const { sequelize, Meeting, User, Image, Participant } = require("../models");
const { Op } = require("sequelize");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const multer = require("multer");
const path = require("path");
const deleteFilesThatStartsWith = require("../utils/deleteFilesThatStartWith");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dvijawvce",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define the storage and file limits
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("tmp"));
  },
  filename: function (req, file, cb) {
    cb(null, `meeting-${req.params.id}-${Date.now()}-${file.originalname}`);
  },
});

const limits = {
  fileSize: 1024 * 1024 * 5, // 5MB
};

// Create the Multer middleware instance
exports.uploadImages = multer({ storage, limits }).array("images");

exports.getMeeting = catchAsync(async (req, res, next) => {
  const { id: meetingId } = req.params;

  const meeting = await Meeting.findByPk(meetingId, {
    attributes: [
      "id",
      "subject",
      "date",
      "startTime",
      "endTime",
      "place",
      "notes",
    ],
    include: [
      {
        model: User,
        as: "participants",
        attributes: ["id", "firstname", "lastname", "email"],
        through: {
          attributes: ["editor"],
          as: "permissions",
        },
      },
      {
        model: Image,
        attributes: ["id", "filepath"],
      },
    ],
  });

  if (!meeting)
    return next(
      new AppError(`The meeting with ID ${meetingId} does not exist`, 404)
    );

  res.status(200).json({ meeting: meeting });
});

exports.getAllMeetings = catchAsync(async (req, res, next) => {
  const isFinishedWhereClause =
    req.query.isFinished !== undefined
      ? req.query.isFinished.toLowerCase() === "true"
        ? { endTime: { [Op.not]: null } }
        : { endTime: null }
      : {};

  const meetings = await Meeting.findAll({
    attributes: ["id", "subject", "date", "startTime", "endTime", "place"],
    where: isFinishedWhereClause,
  });

  res.status(200).json({ meetings });
});

exports.meetingBodyValidation = catchAsync(async (req, res, next) => {
  const participantsIds = req.body.participantsIds || [];
  const editorsIds = req.body.editorsIds || [];

  const usersIds = [...new Set(participantsIds.concat(editorsIds))];

  // Checking if all the users exists
  if (usersIds && usersIds.length > 0) {
    const existingUsers = await User.findAll({
      where: {
        id: usersIds,
      },
    });
    const existingUserIds = existingUsers.map((user) => user.id);
    const invalidUserIds = usersIds.filter(
      (id) => !existingUserIds.includes(id)
    );
    if (invalidUserIds.length > 0) {
      return next(
        new AppError(
          `Following users with ids were not found: ${invalidUserIds.join(
            ", "
          )}`,
          404
        )
      );
    }
  }

  next();
});

// TODO: send email to participants
exports.createMeeting = catchAsync(async (req, res, next) => {
  const { editorsIds } = req.body;

  const meetingData = {
    ...req.body,
    coordinatorId: req.user.id,
  };

  const newMeeting = await sequelize.transaction(async (t) => {
    const createdMeeting = await Meeting.create(meetingData, {
      transaction: t,
    });

    if (!editorsIds.includes(req.user.id)) editorsIds.push(req.user.id);

    const editors = editorsIds.map((memberId) => ({
      editor: true,
      userId: memberId,
      meetingId: createdMeeting.id,
    }));

    await Participant.bulkCreate(editors, { transaction: t });

    return createdMeeting;
  });

  res.status(201).json({
    message: "Meeting was successfully created",
    URI: `/meetings/${newMeeting.id}`,
  });
});

exports.checkUpdatePermsissions = catchAsync(async (req, res, next) => {
  const editor = await Participant.findOne({
    where: {
      userId: req.user.id,
      meetingId: req.params.meetingId,
      editor: true,
    },
  });

  if (!editor) {
    return next(new AppError(`You are not the editor of this meeting`, 401));
  }

  next();
});

exports.updateMeeting = catchAsync(async (req, res, next) => {
  const meetingBody = req.body;
  const { id: meetingId } = req.params;
  const participantsIds = req.body.participantsIds || [];
  const editorsIds = req.body.editorsIds || [];
  const allParticipantsIds = [...new Set(participantsIds.concat(editorsIds))];

  const meetingToUpdate = await Meeting.findOne({ where: { id: meetingId } });
  if (!meetingToUpdate) {
    return next(new AppError(`Meeting with ID ${meetingId} not found`, 404));
  }

  // Updating the meeting
  await sequelize.transaction(async (t) => {
    await meetingToUpdate.update({ ...meetingBody }, { transaction: t });

    // Updating invitations
    await Participant.destroy({
      where: { meetingId: meetingId },
      transaction: t,
    });

    if (allParticipantsIds && allParticipantsIds.length > 0) {
      const participantsToCreate = allParticipantsIds.map((participantId) => ({
        editor: editorsIds.includes(participantId),
        userId: participantId,
        meetingId: meetingId,
      }));

      await Participant.bulkCreate(participantsToCreate, { transaction: t });
    }

    if (req.files && req.files.length > 0) {
      // removing old images from DB and cloudinary
      const oldImages = await Image.findAll({
        where: { meetingId: meetingId },
        transaction: t,
      });

      await Promise.all(
        oldImages.map(async (image) => {
          await cloudinary.uploader.destroy(image.cloudinaryId);
        })
      );

      await Image.destroy({
        where: { meetingId: meetingId },
        transaction: t,
      });

      // creating new images in DB and cloudinary
      const cloudImages = await Promise.all(
        req.files.map((file) => cloudinary.uploader.upload(file.path))
      );

      const imagesToCreate = cloudImages.map(({ url, public_id }) => ({
        filepath: url,
        cloudinaryId: public_id,
        meetingId: meetingId,
      }));

      await Image.bulkCreate(imagesToCreate, { transaction: t });
    }
  });

  await deleteFilesThatStartsWith(`meeting-${req.params.id}`);
  res.status(204).json({});
});

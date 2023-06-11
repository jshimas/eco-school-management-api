const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const {
  School,
  Activity,
  Supervisor,
  User,
  Image,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dvijawvce",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define the storage and file limits
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("/tmp"));
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `activity-${req.params.activityId}-${Date.now()}-${file.originalname}`
    );
  },
});

const limits = {
  fileSize: 1024 * 1024 * 5, // 5MB
};

// Create the Multer middleware instance
exports.uploadImages = multer({ storage, limits }).array("images");

exports.getAllActivities = catchAsync(async (req, res, next) => {
  const { schoolId } = req.params;

  const school = await School.findByPk(schoolId, {
    include: {
      model: Activity,
      attributes: [
        "id",
        "theme",
        "name",
        "approved",
        "startDate",
        "endDate",
        "reason",
        "goal",
        "result",
        "resources",
      ],
    },
  });

  if (!school) {
    return next(new AppError(`School with ID ${schoolId} was not found.`, 404));
  }

  res.status(200).json({ activities: school.toJSON().activities });
});

exports.getActivity = async (req, res, next) => {
  const { schoolId, activityId } = req.params;

  const school = await School.findByPk(schoolId);

  if (!school) {
    return next(new AppError(`School with ID ${schoolId} was not found.`, 404));
  }

  const activity = await Activity.findOne({
    attributes: { exclude: ["user_creator_fk", "school_fk"] },
    where: {
      [Op.and]: {
        id: activityId,
        schoolId: schoolId,
      },
    },
    include: [
      {
        model: Image,
        attributes: ["id", "filepath", "originalName"],
      },
      {
        model: User,
        as: "supervisors",
        attributes: ["id", "firstname", "lastname", "email"],
        through: {
          attributes: [],
        },
      },
    ],
  });

  if (!activity) {
    return next(
      new AppError(
        `Activity with ID ${activityId} was not found at specified school.`,
        404
      )
    );
  }
  res.status(200).json({ activity: activity });
};

exports.checkSupervisorPermission = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const { activityId } = req.params;

  const supervisor = await Supervisor.findOne({
    where: {
      [Op.and]: {
        userId: req.user.id,
        activityId: activityId,
      },
    },
  });

  if (!supervisor && !["admin", "coordinator"].includes(req.user.role)) {
    return next(
      new AppError(
        "You do not have the supervisor role to perform update on this activity",
        401
      )
    );
  }

  next();
});

exports.checkDeletePermission = catchAsync(async (req, res, next) => {
  const { activityId } = req.params;

  // find the activity by the provided id
  const activity = await Activity.findByPk(activityId);
  if (!activity) {
    return next(
      new AppError(`The ativity with ID ${activityId} was not found`, 404)
    );
  }
  // 1. an activity can be deleted by it's creator, coordinator and admin
  // 2. creator can only delete the acitivity until it's not approved

  if (
    ["admin", "coordinator"].includes(req.user.role) ||
    (activity.creatorId === req.user.id && !activity.approved)
  ) {
  } else {
    return next(
      new AppError(`You don't have the permission to perform this action`, 403)
    );
  }
  next();
});

exports.activityBodyValidation = catchAsync(async (req, res, next) => {
  const supervisorsIds = req.body.supervisorsIds
    ? JSON.parse(req.body.supervisorsIds)
    : [];

  const usersIds = [...new Set(supervisorsIds)];

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

exports.createActivity = catchAsync(async (req, res, next) => {
  const { supervisorsIds } = req.body;
  delete req.body.supervisorsIds;
  const activityBody = {
    ...req.body,
    approved: req.user.role !== "member" ? true : null,
    creatorId: req.user.id,
    schoolId: req.params.schoolId,
  };

  const newActivity = await sequelize.transaction(async (t) => {
    const activity = await Activity.create(activityBody, { transaction: t });

    if (!supervisorsIds.some((id) => parseInt(id) === req.user.id)) {
      supervisorsIds.push(req.user.id);
    }

    const supervisorsToCreate = supervisorsIds.map((sId) => ({
      userId: sId,
      activityId: activity.id,
    }));

    await Supervisor.bulkCreate(supervisorsToCreate, { transaction: t });

    return activity;
  });

  res.status(201).json({
    URI: `/schools/${newActivity.schoolId}/activities/${newActivity.id}`,
  });
});

exports.updateActivity = catchAsync(async (req, res, next) => {
  const { schoolId, activityId } = req.params;
  const supervisorsIds = req.body.supervisorsIds
    ? JSON.parse(req.body.supervisorsIds)
    : [];
  const oldImagesIds = req.body.oldImagesIds
    ? JSON.parse(req.body.oldImagesIds)
    : [];
  delete req.body.supervisorsIds;

  const school = await School.findByPk(schoolId);

  if (!school) {
    return next(new AppError(`School with ID ${schoolId} was not found.`, 404));
  }

  const activityToUpdate = await Activity.findOne({
    where: {
      [Op.and]: {
        id: activityId,
        schoolId: schoolId,
      },
    },
  });

  if (!activityToUpdate) {
    return next(
      new AppError(
        `Activity with ID ${activityId} was not found at specified school.`,
        404
      )
    );
  }

  await sequelize.transaction(async (t) => {
    await activityToUpdate.update({ ...req.body }, { transaction: t });

    if (supervisorsIds && supervisorsIds.length > 0) {
      await Supervisor.destroy({ where: { activityId: activityId } });

      if (!supervisorsIds.some((id) => id == req.body.creatorId)) {
        supervisorsIds.push(req.body.creatorId);
      }

      const supervisorsToCreate = supervisorsIds.map((sId) => ({
        userId: sId,
        activityId: activityId,
      }));

      await Supervisor.bulkCreate(supervisorsToCreate, { transaction: t });
    }

    console.log(oldImagesIds);

    // remove unwanted old images
    const oldImages = await Image.findAll({
      where: {
        activityId: activityId,
        id: { [Op.notIn]: oldImagesIds }, // we don't want to delete the old images that the user did not remove on the client
      },
    });

    await Promise.all(
      oldImages.map(async (image) => {
        await cloudinary.uploader.destroy(image.cloudinaryId);
      })
    );

    await Image.destroy({
      where: {
        activityId: activityId,
        id: { [Op.notIn]: oldImagesIds },
      },

      transaction: t,
    });

    if (req.files && req.files.length > 0) {
      const cloudImages = await Promise.all(
        req.files.map(async (file) => {
          console.log(file);
          const { path, originalname } = file;
          const uploadResult = await cloudinary.uploader.upload(path);
          return {
            ...uploadResult,
            originalname,
          };
        })
      );

      const imagesToCreate = cloudImages.map(
        ({ url, public_id, originalname }) => ({
          filepath: url,
          cloudinaryId: public_id,
          activityId: activityId,
          originalName: originalname,
        })
      );

      console.log(imagesToCreate);
      await Image.bulkCreate(imagesToCreate, { transaction: t });
    }
  });

  res.status(204).json({});
});

exports.deleteActivity = catchAsync(async (req, res, next) => {
  const { schoolId, activityId } = req.params;

  const school = await School.findByPk(schoolId);

  if (!school) {
    return next(new AppError(`School with ID ${schoolId} was not found.`, 404));
  }

  const activityToDelete = await Activity.findOne({
    where: {
      [Op.and]: {
        id: activityId,
        schoolId: schoolId,
      },
    },
  });

  if (!activityToDelete) {
    return next(
      new AppError(
        `Activity with ID ${activityId} was not found at school with ID ${schoolId}.`,
        404
      )
    );
  }
  await activityToDelete.destroy();

  res.status(204).json({});
});

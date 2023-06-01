const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const Email = require("../utils/email");
const { User, UserRole, School } = require("../models");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");

exports.getAllUser = catchAsync(async (req, res) => {
  const users = await User.findAll({
    include: UserRole,
    attributes: {
      include: ["id", "firstname", "lastname", "email"],
    },
  });

  const usersJSON = users.map((user) => {
    user = user.toJSON();
    user.role = user.role?.role ?? null;
    return user;
  });

  res.status(200).json({ usersJSON });
});

exports.createUser = catchAsync(async (req, res, next) => {
  // Vlaidating if user does not already exist and the school is valid
  const existingUser = await User.findOne({ where: { email: req.body.email } });
  const existingSchool = await School.findByPk(req.body.schoolId);

  if (existingUser)
    return next(
      new AppError("User already exist with the provided email.", 400)
    );

  if (!existingSchool)
    return next(new AppError("Provided school not found.", 404));

  // Creating new user
  const newUser = await User.create({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    schoolId: req.body.schoolId,
    roleId: req.body.roleId,
  });

  const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  // Sending user token to create a new password
  try {
    const URL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/create-password/${token}`;

    const newUserJson = newUser.toJSON();
    await new Email(req.user, newUserJson, URL).sendPasswordCreate();

    res.status(200).json({
      message: `Email was sent to ${newUserJson.email} to create an account password`,
      userId: newUser.toJSON().id,
    });
  } catch (err) {
    await newUser.destroy();

    return next(
      new AppError(
        "There was an errorr sending an email. Try creating user later!",
        500
      )
    );
  }
});

exports.createPassword = catchAsync(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;

  if (password !== passwordConfirm) {
    return next(new AppError(`Passwords do not match`, 400));
  }

  // 2) Verification of the token
  console.log(req.params.token);
  console.log(process.env.JWT_SECRET);
  const decoded = await promisify(jwt.verify)(
    req.params.token,
    process.env.JWT_SECRET
  );

  // 3) Check if user still exists
  let user = await User.findByPk(decoded.id);
  if (!user) {
    return next(
      new AppError("The user belonging to this token no longer exists", 401)
    );
  }

  user.password = await bcrypt.hash(password, 10);
  await user.save();

  res.status(204).json({});
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.params.id, {
    include: UserRole,
    attributes: {
      include: ["id", "firstname", "lastname", "email", "school_fk"],
    },
  });

  if (!user) return next(new AppError("User not found", 404));

  const userJSON = user.toJSON();
  userJSON.role = userJSON.role?.role ?? null;

  delete userJSON["schoolId"];
  delete userJSON["password"];
  delete userJSON["roleId"];

  res.status(200).json({ userJSON });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.params.id);

  if (!user)
    return next(
      new AppError(`The user with ID ${req.params.id} does not exist`, 404)
    );

  const updatedUser = await User.update(req.body, {
    where: { id: req.params.id },
  });

  res.status(200).json({ updatedUser });
});

exports.getMe = catchAsync(async (req, res, next) => {
  let user = req.user;

  const school = await School.findByPk(user.schoolId);

  res.status(200).json({
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      schoolName: school.name,
      schoolId: school.id,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.params.id);

  if (!user)
    return next(
      new AppError(`The user with ID ${req.params.id} does not exist`, 404)
    );

  const deletedUser = await User.destroy({ where: { id: req.params.id } });

  res.status(200).json("The user was found and successfully deleted.");
});

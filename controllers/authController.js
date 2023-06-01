const { User, UserRole } = require("../models");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const createSendToken = require("../utils/createSendToken");
const jwt = require("jsonwebtoken");

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password is provided
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Check if user exists & password is correct
  const user = await User.findOne({ where: { email } });

  if (
    !user ||
    !user.password ||
    !(await user.isCorrectPassword(password, user.password))
  ) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) If everything is ok, send token to client
  createSendToken(user.id, 200, res);
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          `You do not have permission to perform this action. This endpoint is restricted to ${roles.join(
            ","
          )}`,
          403
        )
      );
    next();
  };

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's provided
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please login to get access", 401)
    );
  }

  // 2) Verification of the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  let currentUser = await User.findByPk(decoded.id, { include: UserRole });
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists", 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  currentUser = currentUser.toJSON();
  currentUser.role = currentUser.role.role;
  req.user = currentUser;
  next();
});

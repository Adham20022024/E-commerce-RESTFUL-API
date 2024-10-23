const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const ApiError = require("../utils/apiError");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");
const CreateToken = require("../utils/createToken");
// @desc Signup
// @route POST /api/v1/auth/signup
// @access Public
exports.signup = asyncHandler(async (req, res, next) => {
  //1- create User
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    role: req.body.role,
  });
  //2-Generate Token JWT (JSON WEB TOKEN)
  const token = CreateToken({ id: user._id });

  res.status(201).json({
    data: user,
    token,
  });
});

// @desc Login
// @route POST /api/v1/auth/login
// @access Public
exports.login = asyncHandler(async (req, res, next) => {
  //1) check if email and password in body (validation)
  //2) check if user exist
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError("Invalid email or password", 401));
  }
  //3) generate token
  const token = CreateToken({ id: user._id });
  //4) send response to client side
  res.status(200).json({
    data: user,
    token,
  });
});
//@desc make sure user is logged in
//@route GET /api/v1/auth/me
//@access Private
exports.protect = asyncHandler(async (req, res, next) => {
  // 1) check if token is exits if exits hold it in a variable
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    // console.log(token);
  }
  if (!token) {
    return next(new ApiError("Not authorized to access this route", 401));
  }
  // 2) verify token (no changes happen or expired)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  // 3) check if user exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new ApiError("The user belonging to this token does no longer exist", 401)
    );
  }
  if (!currentUser.active) {
    return next(new ApiError("The user is not active", 401));
  }
  // 4) check if user changed password after token created\
  if (currentUser.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    // password changed after token created
    if (changedTimeStamp > decoded.iat) {
      return next(
        new ApiError("User recently changed password, please login again", 401)
      );
    }
  }

  req.user = currentUser;
  next();
});
//["admin", "manager"]
//@desc Authorization (User Permissions)

exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // 1) access user Role
    // 2) access registered User (req.user.role)
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You are not allowed to access this route", 403)
      );
    }
    next();
  });
//@desc Forgot Password
//@route POST /api/v1/auth/forgotPassword
//@access Public
exports.forgetPassword = asyncHandler(async (req, res, next) => {
  //get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with this email${req.body.email}`, 404)
    );
  }
  //if user exists generate hash code with 6 digits and save it in db
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");
  //save password hashed reset code in db
  user.passwordResetCode = hashedCode;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; //10 minutes
  user.passwordResetVerified = false;
  await user.save();
  //send reset code via email
  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Code",
      message: `Hi ${user.name} \n Your reset code is ${resetCode}`,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();
    return next(
      new ApiError(`There was an error sending email ${err.message}`, 500)
    );
  }
  res.status(200).json({
    status: "success",
    message: "Reset code sent to your email",
  });
});

//@desc Verify Password Reset Code
//@route POST /api/v1/auth/verifyResetCode
//@access Public
exports.verifyPasswordResetCode = asyncHandler(async (req, res, next) => {
  // get user based on reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
    passwordResetVerified: false,
  });
  if (!user) {
    return next(new ApiError("Invalid reset code", 404));
  }
  // 2) Reset Code Valid
  user.passwordResetVerified = true;
  await user.save();
  res.status(200).json({
    status: "success",
    message: "Reset code verified",
  });
});

//@desc Reset Password
//@route POST /api/v1/auth/resetPassword
//@access Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
  });
  if (!user) {
    return next(new ApiError("Invalid email", 404));
  }
  if (!user.passwordResetVerified) {
    return next(new ApiError("Invalid reset code", 400));
  }
  user.password = req.body.password;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;
  await user.save();
  const token = CreateToken({ id: user._id });

  res.status(200).json({
    status: "success",
    token,
  });
});

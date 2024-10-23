const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");
const CreateToken = require("../utils/createToken");
const factory = require("./handlersFactory");
const { uploadSingleImage } = require("../Middlewares/uploadImageMiddleware");
const User = require("../models/userModel");

// Upload single image
exports.uploadUserImage = uploadSingleImage("profileImg");

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `User-${uuidv4()}-${Date.now()}.jpeg`;
  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/users/${filename}`);

    // Save image into our db
    req.body.profileImg = filename;
    console.log(req.body.image);
  }

  next();
});

// @desc    Get list of users
// @route   GET /api/v1/users
// @access  private
exports.getUsers = factory.getAll(User);

// @desc    Get specific User by id
// @route   GET /api/v1/users/:id
// @access  private
exports.getUser = factory.getOne(User);

// @desc    Create user
// @route   POST  /api/v1/users
// @access  Private
exports.createUser = factory.createOne(User);

// @desc    Update specific User
// @route   PUT /api/v1/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      slug: req.body.slug,
      phone: req.body.phone,
      email: req.body.email,
      profileImg: req.body.profileImg,
      role: req.body.role,
    },
    {
      new: true,
    }
  );

  if (!document) {
    return next(new ApiError(`No User for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );
  if (!document) {
    return next(new ApiError(`No User for this id ${req.params.id}`, 404));
  }
  document.password = req.body.password;
  await document.save();
  res.status(200).json({ data: document });
});

// @desc    Delete specific user
// @route   DELETE /api/v1/users/:id
// @access  Private
exports.deleteUser = factory.deleteOne(User);
// @desc    Delete logged in user
// @route   DELETE /api/v1/users/getMe
// @access  private Protect

exports.getLoggedInUser = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});
// @desc    Update logged User Password
// @route   DELETE /api/v1/users/updateMyPassword
// @access  private Protect
exports.updateLoggedInUserPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );
  const token = CreateToken({ id: user._id });
  res.status(200).json({ data: user, token });
});
// @desc    Update logged User data without password or role
// @route   DELETE /api/v1/users/updateMe
// @access  private Protect
exports.updateLoggedInUserData = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
    },
    {
      new: true,
    }
  );
  res.status(200).json({ data: user });
});
// @desc    Deactivate logged User
// @route   DELETE /api/v1/users/deleteMe
// @access  private Protect
exports.deleteLoggedInUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

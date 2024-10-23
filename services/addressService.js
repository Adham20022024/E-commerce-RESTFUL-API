const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

// @desc    Add address to user addresses list
// @route   POST /api/v1/address
// @access  Protected/User
exports.addAddress = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: {
        addresses: req.body,
      },
    },
    {
      new: true,
    }
  );
  res.status(200).json({
    status: "success",
    message: "Address added to wish list",
    data: user.addresses,
  });
});

// @desc    Remove address Object from user addresses array
// @Route   DELETE /api/v1/address/:addressId
// @access  Protected/User
exports.removeAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        addresses: { _id: req.params.addressId },
      },
    },
    {
      new: true,
    }
  );
  res.status(200).json({
    status: "success",
    message: "Address removed from wish list",
    data: user.addresses,
  });
});
// @desc    Get logged in user Addresses List
// @route   GET /api/v1/address
// @access  Protected/User
exports.getLoggedInUserAddresses = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("addresses");
  res.status(200).json({
    status: "success",
    data: user.addresses,
    results: user.wishlist.length,
  });
});

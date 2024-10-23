const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

// @desc    Add product to wish list
// @route   POST /api/v1/wishList
// @access  Private
exports.addProductToWishList = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: {
        wishlist: req.body.productId,
      },
    },
    {
      new: true,
    }
  );
  res.status(200).json({
    status: "success",
    message: "Product added to wish list",
    data: user.wishlist,
  });
});

// @desc    Remove product from wish list
// @Route   DELETE /api/v1/wishList/:productId
// @access  Private
exports.removeProductFromWishList = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        wishlist: req.params.productId,
      },
    },
    {
      new: true,
    }
  );
  res.status(200).json({
    status: "success",
    message: "Product removed from wish list",
    data: user.wishlist,
  });
});
// @desc    Get logged in user wish list
// @route   GET /api/v1/wishList
// @access  Private
exports.getLoggedInUserWishList = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  res.status(200).json({
    status: "success",
    data: user.wishlist,
    results: user.wishlist.length,
  });
});

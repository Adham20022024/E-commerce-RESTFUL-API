const factory = require("./handlersFactory");

const Coupon = require("../models/couponModel");

// @desc    Get list of Coupons
// @route   GET /api/v1/Coupons
// @access  Private/Admin-Manger
exports.getCoupons = factory.getAll(Coupon);

// @desc    Get specific Coupon by id
// @route   GET /api/v1/Coupons/:id
// @access  Private/Admin-Manger
exports.getCoupon = factory.getOne(Coupon);

// @desc    Create Coupon);
// @route   POST  /api/v1/Coupons
// @access  Private/Admin-Manger
exports.createCoupon = factory.createOne(Coupon);

// @desc    Update specific Coupon;
// @route   PUT /api/v1/Coupons/:id
// @access  Private/Admin-Manger
exports.updateCoupon = factory.updateOne(Coupon);

// @desc    Delete specific Coupon
// @route   DELETE /api/v1/Coupons/:id
// @access  Private/Admin-Manger
exports.deleteCoupon = factory.deleteOne(Coupon);

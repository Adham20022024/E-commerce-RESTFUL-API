const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Product = require("../models/productModel");

const calTotalCartPrice = (cart) => {
  let totalPrice = 0;
  cart.cartItem.forEach((item) => {
    totalPrice += item.quantity * item.price;
  });
  cart.totalCartPrice = totalPrice;
  cart.totalPriceAfterDiscount = undefined;
  return totalPrice;
};
//@desc Add product to cart
//@route Post /api/v1/carts
//@access Private/User
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity, color } = req.body;
  const product = await Product.findById(productId);
  //1) get cart for logged user
  let cart = await Cart.findOne({ user: req.user._id });
  //2) check if cart exist or not
  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      cartItem: [
        {
          product: productId,
          quantity,
          color,
          price: product.price,
        },
      ],
    });
  } else {
    // 3) check if product exists in cart already then update product quantity
    const productExists = cart.cartItem.findIndex(
      (item) =>
        item.product.toString() === productId.toString() && item.color === color
    );
    // console.log(productExists);
    if (productExists > -1) {
      const item = cart.cartItem[productExists];
      item.quantity += quantity || 1;
      cart.cartItem[productExists] = item;
    } else {
      cart.cartItem.push({
        product: productId,
        quantity,
        color,
        price: product.price,
      });
    }
    //else push new product in cart
  }
  // calculate total cart price
  calTotalCartPrice(cart);

  await cart.save();

  res.status(200).json({
    status: "success",
    data: cart,
  });
});
//@desc get logged user cart
//@route get /api/v1/carts
//@access Private/User
exports.getLoggedInUserCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new ApiError("There is no cart for this user ", 404));
  }
  res.status(200).json({
    status: "success",
    numberOfItems: cart.cartItem.length,
    data: cart,
  });
});
//@desc Remove specific cart item
//@route get /api/v1/carts/:itemId
//@access Private/User
exports.removeSpecificCartItem = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItem: { _id: req.params.itemId } },
    }
  );
  calTotalCartPrice(cart);
  cart.save();
  res.status(200).json({
    status: "success",
    data: cart,
    numberOfItems: cart.cartItem.length,
  });
});
//@desc clear logged user cart
//@route get /api/v1/carts/
//@access Private/User
exports.clearLoggedInUserCart = asyncHandler(async (req, res, next) => {
  await Cart.findOneAndDelete({
    user: req.user._id,
  });
  res.send(204);
});
//@desc Update specific cart item quantity
//@route PUT /api/v1/carts/:itemid
//@access Private/User
exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new ApiError("There is no cart for this user ", 404));
  }
  const itemIndex = cart.cartItem.findIndex(
    (item) => item._id.toString() === req.params.itemId.toString()
  );

  if (itemIndex > -1) {
    const cartItem = cart.cartItem[itemIndex];
    cartItem.quantity = quantity;
    cart.cartItem[itemIndex] = cartItem;
  } else {
    return next(new ApiError("Thier is no item for this id", 404));
  }

  calTotalCartPrice(cart);

  cart.save();
  res.status(200).json({
    status: "success",
    data: cart,
    numberOfItems: cart.cartItem.length,
  });
});
//@desc Apply Coupon on logged user Cart
//@route PUT /api/v1/carts/applyCoupon
//@access Private/User
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  // 1) Get coupon based on Coupon name unique
  const coupon = await Coupon.findOne({
    name: req.body.coupon,
    expire: { $gt: Date.now() },
  });
  if (!coupon) {
    return next(new ApiError("Coupon is invalid or expired", 404));
  }
  // 2) get User Cart based on logged in user to get total cart price
  const cart = await Cart.findOne({ user: req.user._id });
  const totalPrice = calTotalCartPrice(cart);
  // 3) Apply Coupon calculate price after discount
  const totalPriceAfterDiscount =
    (totalPrice - (totalPrice * coupon.discount) / 100).toFixed(2) || 0;
  cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
  await cart.save();
  res.status(200).json({
    status: "success",
    data: cart,
  });
});

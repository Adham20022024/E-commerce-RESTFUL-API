// const dotenv = require("dotenv");

// dotenv.config({ path: "../config.env" });
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const asyncHandler = require("express-async-handler");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const factory = require("./handlersFactory");
const APiError = require("../utils/apiError");

// @desc    Create Cash order
// @route   POST /api/v1/orders/cardId
// @access  private/user
exports.createCashOrder = asyncHandler(async (req, res, next) => {
  // app settings
  const taxPrice = 0;
  const shippingPrice = 0;
  // 1) Get Cart depend on CardId
  const cart = await Cart.findById(req.params.cartId);
  // 2) Get order Price depend on cart price "check if Coupon Applied"
  if (!cart) {
    return next(new APiError("There is no cart for this user", 404));
  }
  const cartPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalCartPrice;
  const totalOrderPrice = cartPrice + shippingPrice + taxPrice;
  // 3) Create order with default paymentmethodtype Cash

  const order = await Order.create({
    user: req.user._id,
    cartItems: cart.cartItem,
    shippingAddress: req.body.shippingAddress,
    totalOrderPrice,
  });
  // 4) After Creating order decrement Product quantity, increment product sold
  if (order) {
    const bulkOptions = cart.cartItem.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOptions, {});
    // 5) Clear Cart depend on CartId
    await Cart.findByIdAndDelete(req.params.cartId);
  }

  res.status(201).json({
    status: "success",
    data: order,
  });
});
exports.filterOrdersForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === "user") {
    req.filterObj = { user: req.user._id };
  }
  next();
});
// @desc   Get all orders
// @route   POST /api/v1/orders/
// @access  protected/User-Admin-Manger
exports.findAllOrders = factory.getAll(Order);
// @desc   Get all orders
// @route   POST /api/v1/orders/
// @access  protected/User-Admin-Manger
exports.findSpecificOrder = factory.getOne(Order);
// @desc   Update Order Paid Status to Paid
// @route  PUT /api/v1/orders/:id
// @access Protected/Admin-Manger
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new APiError("There is no order for this id", 404));
  }
  // 1) Update Order status to paid
  order.isPaid = true;
  order.paidAt = Date.now();
  const updatedOrder = await order.save();

  res.status(200).json({
    status: "success",
    data: updatedOrder,
  });
});
// @desc   Update Order Delivered Status
// @route  PUT /api/v1/orders/:id/delivered
// @access Protected/Admin-Manger
exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new APiError("There is no order for this id", 404));
  }
  // 1) Update Order status to paid
  order.isDelivered = true;
  order.deliveredAt = Date.now();
  const updatedOrder = await order.save();

  res.status(200).json({
    status: "success",
    data: updatedOrder,
  });
});
// @desc   Get Checkout Session From Stripe and send it as response
// @route  Get /api/v1/orders/checkout-session/:cartId
// @access Protected/User
exports.getCheckoutSession = asyncHandler(async (req, res, next) => {
  // const taxPrice = 0; // Consider calculating this based on order specifics
  // const shippingPrice = 0; // Consider calculating this based on shipping method

  // // Validate that req.user and req.body.shippingAddress are available
  // if (!req.user || !req.body.shippingAddress) {
  //   return next(new APiError("User data or shipping address is missing", 400));
  // }

  // // 1) Get cart
  // const cart = await Cart.findById(req.params.cartId);
  // if (!cart) {
  //   return next(new APiError("There is no cart for this ID", 404));
  // }

  // // 2) Determine cart price
  // const cartPrice = cart.totalPriceAfterDiscount || cart.totalCartPrice;
  // const totalOrderPrice = cartPrice + shippingPrice + taxPrice;

  // // Log the details of the order for debugging
  // console.log(`Creating checkout session for cart ID: ${req.params.cartId}`);
  // console.log(`Total Order Price: ${totalOrderPrice}`);

  // // 3) Create Stripe Checkout Session
  // try {
  //   const session = await stripe.checkout.sessions.create({
  //     line_items: [
  //       {
  //         price_data: {
  //           currency: "usd", // Consider making this dynamic
  //           product_data: {
  //             name: `Order from ${req.user.name}`, // Change to a meaningful product name
  //           },
  //           unit_amount: totalOrderPrice * 100, // Amount in cents
  //         },
  //         quantity: 1,
  //       },
  //     ],
  //     mode: "payment",
  //     success_url: `${req.protocol}://${req.get("host")}/orders`,
  //     cancel_url: `${req.protocol}://${req.get("host")}/cart`,
  //     customer_email: req.user.email,
  //     client_reference_id: req.params.cartId,
  //     metadata: req.body.shippingAddress,
  //   });

  //   // 4) Send Session to response
  //   res.status(200).json({
  //     status: "success",
  //     session,
  //   });
  // } catch (error) {
  //   console.error("Stripe session creation error:", error);
  //   return next(new APiError("Failed to create checkout session", 500));
  // }

  res.status(200).json({
    status: "success",
    message: "Checkout session created successfully",
  });
});

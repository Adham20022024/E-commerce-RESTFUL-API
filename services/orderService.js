// const dotenv = require("dotenv");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
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
exports.checkoutSession = asyncHandler(async (req, res, next) => {
  // app settings
  const taxPrice = 0;
  const shippingPrice = 0;

  // 1) Get cart based on cartId
  const cart = await Cart.findById(req.params.cartId);
  if (!cart) {
    return next(
      new APiError(`There is no such cart with id ${req.params.cartId}`, 404)
    );
  }

  // 2) Get order price based on cart price "Check if coupon is applied"
  const cartPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalCartPrice;

  const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

  // 3) Create stripe checkout session with price_data
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "egp",
          product_data: {
            name: req.user.name,
          },
          unit_amount: totalOrderPrice * 100, // Stripe requires amount to be in cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${req.protocol}://${req.get("host")}/orders`,
    cancel_url: `${req.protocol}://${req.get("host")}/cart`,
    customer_email: req.user.email,
    client_reference_id: req.params.cartId,
    metadata: req.body.shippingAddress,
  });

  // 4) Send session to response
  res.status(200).json({ status: "success", session });
});
const createCardOrder = async (session) => {
  const cartId = session.client_reference_id;
  const shippingAddress = session.metadata;
  const orderPrice = session.amount_total / 100;
  const cart = await Cart.findById(cartId);
  const user = await User.findOne({ email: session.customer_email });
  //create order with payment type card
  const order = await Order.create({
    user: user._id,
    cart: cart.cartItem,
    shippingAddress,
    totalOrderPrice: orderPrice,
    isPaid: true,
    paidAt: Date.now(),
    paymentMethodType: "card",
  });
  if (order) {
    const bulkOptions = cart.cartItem.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOptions);
    await Cart.findByIdAndDelete(cartId);
  }
};
exports.webhookCheckout = asyncHandler(async (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    await createCardOrder(event.data.object);
  }
  res.status(200).json({ received: true });
});

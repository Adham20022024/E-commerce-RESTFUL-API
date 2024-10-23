const express = require("express");
const authService = require("../services/authService");

const router = express.Router();

const {
  createCashOrder,
  findAllOrders,
  findSpecificOrder,
  filterOrdersForLoggedUser,
  updateOrderToDelivered,
  updateOrderToPaid,
  getCheckoutSession,
} = require("../services/orderService");

router.use(authService.protect);
router.get(
  "/checkout-session/:cartId",
  authService.allowedTo("user"),
  getCheckoutSession
);
router.route("/:cartId").post(authService.allowedTo("user"), createCashOrder);

router.get(
  "/",
  authService.protect,
  authService.allowedTo("user", "admin", "manager"),
  filterOrdersForLoggedUser,
  findAllOrders
);
router.get("/:id", findSpecificOrder);
router.put(
  "/:id/deliver",
  authService.protect,
  authService.allowedTo("admin", "manager"),
  updateOrderToDelivered
);
router.put(
  "/:id/pay",
  authService.protect,
  authService.allowedTo("admin", "manager"),
  updateOrderToPaid
);
module.exports = router;

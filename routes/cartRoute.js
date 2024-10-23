const express = require("express");

const router = express.Router();
const authService = require("../services/authService");
const {
  addProductToCart,
  getLoggedInUserCart,
  removeSpecificCartItem,
  clearLoggedInUserCart,
  updateCartItemQuantity,
  applyCoupon,
} = require("../services/cartService");

router.use(authService.protect, authService.allowedTo("user"));
router
  .route("/")
  .post(addProductToCart)
  .get(getLoggedInUserCart)
  .delete(clearLoggedInUserCart);
router.put("/applyCoupon", applyCoupon);
router
  .route("/:itemId")
  .put(updateCartItemQuantity)
  .delete(removeSpecificCartItem);
module.exports = router;

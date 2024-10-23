const express = require("express");
const {
  addProductToWishList,
  removeProductFromWishList,
  getLoggedInUserWishList,
} = require("../services/wishListService");
const authService = require("../services/authService");

const router = express.Router();
router.use(authService.protect, authService.allowedTo("user"));
router.route("/").post(addProductToWishList).get(getLoggedInUserWishList);

router.delete("/:productId", removeProductFromWishList);

module.exports = router;

const express = require("express");
const { sanitizeInput } = require("../utils/xssProtect");
const {
  signupValidator,
  loginValidator,
} = require("../utils/validators/authValidator");

const {
  signup,
  login,
  forgetPassword,
  verifyPasswordResetCode,
  resetPassword,
} = require("../services/authService");

const router = express.Router();
router.post("/signup", signupValidator, sanitizeInput, signup);

router.post("/login", loginValidator, login);
router.post("/forgetPassword", forgetPassword);
router.post("/verifyResetCode", verifyPasswordResetCode);
router.put("/resetPassword", resetPassword);
module.exports = router;

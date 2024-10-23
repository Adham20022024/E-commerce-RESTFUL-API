const express = require("express");
const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  changeUserPasswordValidator,
  updateLoggedInUserValidator,
} = require("../utils/validators/userValidator");

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadUserImage,
  resizeImage,
  changeUserPassword,
  getLoggedInUser,
  updateLoggedInUserPassword,
  updateLoggedInUserData,
  deleteLoggedInUser,
} = require("../services/userService");

const router = express.Router();
const authService = require("../services/authService");

router.use(authService.protect);
router.get("/getMe", getLoggedInUser, getUser);
router.put("/changeMyPassword", updateLoggedInUserPassword);
router.put("/updateMe", updateLoggedInUserValidator, updateLoggedInUserData);
router.put("/deleteMe", deleteLoggedInUser);
//admin only
router.use(authService.protect, authService.allowedTo("admin", "manager"));
router.put(
  "/changepassword/:id",
  changeUserPasswordValidator,
  changeUserPassword
);
router
  .route("/")
  .get(getUsers)
  .post(uploadUserImage, resizeImage, createUserValidator, createUser);
router
  .route("/:id")
  .get(getUserValidator, getUser)
  .put(uploadUserImage, resizeImage, updateUserValidator, updateUser)
  .delete(deleteUserValidator, deleteUser);

module.exports = router;

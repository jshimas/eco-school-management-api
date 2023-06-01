const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/login", authController.login);
router.post("/create-password/:token", userController.createPassword);

// All further routes are protected from unauthorized use
router.use(authController.protect);

router.post(
  "/",
  authController.restrictTo("coordinator", "admin"),
  userController.createUser
);

router
  .route("/")
  .get(authController.restrictTo("admin"), userController.getAllUser)
  .post(userController.createUser);

router.route("/me").get(userController.getMe);

router
  .route("/:id")
  .get(userController.getUser)
  .put(authController.restrictTo("admin"), userController.updateUser)
  .delete(authController.restrictTo("admin"), userController.deleteUser);

module.exports = router;

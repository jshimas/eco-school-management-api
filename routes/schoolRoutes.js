const express = require("express");
const schoolsController = require("../controllers/schoolsController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use("/:schoolId/activities", require("./activitiesRoutes"));

router.use(authController.protect);

router.route("/:id").get(schoolsController.getSchool);
router
  .route("/")
  .get(schoolsController.getAllSchools)
  .post(
    authController.restrictTo("admin", "coordinator"),
    schoolsController.createSchool
  );

module.exports = router;

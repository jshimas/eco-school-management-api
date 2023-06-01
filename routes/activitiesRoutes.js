const express = require("express");
const activitesController = require("../controllers/activitiesController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route("/")
  .get(activitesController.getAllActivities)
  .post(
    activitesController.activityBodyValidation,
    activitesController.createActivity
  );

router
  .route("/:activityId")
  .get(activitesController.getActivity)
  .patch(
    activitesController.checkSupervisorPermission,
    activitesController.uploadImages,
    activitesController.updateActivity
  )
  .delete(activitesController.deleteActivity);

module.exports = router;

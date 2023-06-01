const express = require("express");
const meetingController = require("../controllers/meetingController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(meetingController.getAllMeetings)
  .post(
    authController.restrictTo("coordinator", "admin"),
    meetingController.meetingBodyValidation,
    meetingController.createMeeting
  );

router
  .route("/:id")
  .get(meetingController.getMeeting)
  .patch(
    meetingController.checkUpdatePermsissions,
    meetingController.meetingBodyValidation,
    meetingController.uploadImages,
    meetingController.updateMeeting
  );

module.exports = router;

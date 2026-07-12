const express = require("express");
const notificationController = require("../controllers/notification.controller");
const { upload, handleUploadError } = require("../middleware/upload.middleware");

const router = express.Router();

router.post("/send", notificationController.send);

router.post(
  "/send-attachment",
  upload.single("file"),
  handleUploadError,
  notificationController.sendAttachment
);

module.exports = router;
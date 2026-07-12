const notificationService = require("../services/notification.service");

async function send(req, res, next) {
  try {
    const result = await notificationService.sendCustomNotification(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function sendAttachment(req, res, next) {
  try {
    const result = await notificationService.sendAttachmentNotification({
      to: req.body.to,
      subject: req.body.subject,
      title: req.body.title,
      message: req.body.message,
      signature: req.body.signature,
      file: req.file
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  send,
  sendAttachment
};
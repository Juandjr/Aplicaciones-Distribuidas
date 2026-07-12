const recoveryService = require("../services/password-recovery.service");

async function requestRecovery(req, res, next) {
  try {
    const result = await recoveryService.requestRecovery(req.body.email);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

function validateToken(req, res, next) {
  try {
    const { email, token } = req.body;
    const result = recoveryService.validateToken(email, token);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, token, newPassword } = req.body;
    const result = await recoveryService.resetPassword(email, token, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = { requestRecovery, validateToken, resetPassword };

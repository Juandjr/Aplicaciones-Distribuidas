const verificationService = require("../services/verification.service");

async function register(req, res, next) {
  try {
    const result = await verificationService.registerUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

function verify(req, res, next) {
  try {
    const result = verificationService.verifyAccount(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

function status(req, res, next) {
  try {
    const result = verificationService.getAccountStatus(req.params.email);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function resend(req, res, next) {
  try {
    const result = await verificationService.resendVerificationCode(
      req.body.email
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  verify,
  status,
  resend
};
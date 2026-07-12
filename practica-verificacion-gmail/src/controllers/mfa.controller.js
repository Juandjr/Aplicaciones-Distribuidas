const mfaService = require("../services/mfa.service");

async function setup(req, res, next) {
  try {
    const result = await mfaService.startMfaSetup(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

function confirm(req, res, next) {
  try {
    const result = mfaService.confirmMfaSetup(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await mfaService.loginFirstStep(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

function verifyLogin(req, res, next) {
  try {
    const result = mfaService.verifyMfaLogin(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

function status(req, res, next) {
  try {
    const result = mfaService.getMfaStatus(req.params.email);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  setup,
  confirm,
  login,
  verifyLogin,
  status
};
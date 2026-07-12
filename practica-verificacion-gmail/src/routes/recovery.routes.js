const express = require("express");
const recoveryController = require("../controllers/recovery.controller");

const router = express.Router();

// POST /api/auth/recovery/request — solicita enlace de recuperación
router.post("/request", recoveryController.requestRecovery);

// POST /api/auth/recovery/validate — valida el token (sin consumirlo)
router.post("/validate", recoveryController.validateToken);

// POST /api/auth/recovery/reset — restablece la contraseña y consume el token
router.post("/reset", recoveryController.resetPassword);

module.exports = router;

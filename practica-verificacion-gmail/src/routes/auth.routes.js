const express = require("express");
const authController = require("../controllers/auth.controller");
const recoveryRoutes = require("./recovery.routes");

const router = express.Router();

router.post("/register", authController.register);
router.post("/verify", authController.verify);
router.post("/resend", authController.resend);
router.get("/status/:email", authController.status);

// Montar rutas de recuperación
router.use("/recovery", recoveryRoutes);

module.exports = router;
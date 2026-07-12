const express = require("express");
const mfaController = require("../controllers/mfa.controller");

const router = express.Router();

router.post("/setup", mfaController.setup);
router.post("/confirm", mfaController.confirm);
router.post("/login", mfaController.login);
router.post("/login/verify", mfaController.verifyLogin);
router.get("/status/:email", mfaController.status);

module.exports = router;
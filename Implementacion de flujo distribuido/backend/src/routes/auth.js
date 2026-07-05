const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/google', passport.authenticate('google', { scope: ['openid', 'profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/' }), authController.handleGoogleCallback);
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;

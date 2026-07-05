const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const logger = require('../utils/logger');

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

if (googleClientId && googleClientSecret) {
  passport.use(new GoogleStrategy({
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: googleCallbackUrl
  }, (accessToken, refreshToken, profile, done) => {
    const user = {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value || '',
      emails: profile.emails
    };
    logger.info(`Google auth succeeded for user ${user.id}`);
    done(null, user);
  }));
} else {
  logger.warn('Google OAuth credentials are not configured. Google login will be unavailable until .env is set.');
}

module.exports = passport;

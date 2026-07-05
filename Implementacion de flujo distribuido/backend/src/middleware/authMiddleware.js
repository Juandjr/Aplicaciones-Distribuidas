const jwt = require('jsonwebtoken');
const db = require('../db');
const logger = require('../utils/logger');

async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      const err = new Error('No token provided');
      err.status = 401;
      return next(err);
    }
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const row = await db.get('SELECT 1 FROM revoked_tokens WHERE jti = ? LIMIT 1', [payload.jti]);
    if (row) {
      const err = new Error('Token revoked');
      err.status = 401;
      return next(err);
    }
    req.user = { id: payload.sub, name: payload.name, email: payload.email, role: payload.role, verified: payload.verified };
    next();
  } catch (e) {
    logger.warn(`Auth failure: ${e.message}`);
    const err = new Error('Invalid or expired token');
    err.status = 401;
    next(err);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error('No authenticated user');
      err.status = 401;
      return next(err);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const err = new Error('Acceso denegado por rol');
      err.status = 403;
      return next(err);
    }

    next();
  };
}

module.exports = authMiddleware;
module.exports.requireRole = requireRole;

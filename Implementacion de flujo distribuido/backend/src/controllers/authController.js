const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const logger = require('../utils/logger');

function getRequestedRole(email) {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes((email || '').toLowerCase()) ? 'Admin' : 'Customer';
}

exports.handleGoogleCallback = async (req, res, next) => {
  try {
    const user = req.user;
    const existingUser = await db.get('SELECT id, email, name, role, verified FROM users WHERE google_id = ? OR email = ?', [user.id, user.email]);

    const requestedRole = getRequestedRole(user.email);
    const role = existingUser?.role === 'Admin' || requestedRole === 'Admin' ? 'Admin' : existingUser?.role || 'Customer';

    if (!existingUser) {
      const insertResult = await db.run('INSERT INTO users (google_id, email, name, role, verified) VALUES (?, ?, ?, ?, ?)', [user.id, user.email, user.displayName, role, 1]);
      user.dbId = insertResult.insertId;
    } else {
      await db.run('UPDATE users SET google_id = ?, name = ?, verified = 1, role = ? WHERE id = ?', [user.id, user.displayName, role, existingUser.id]);
      user.dbId = existingUser.id;
    }
    const jti = uuidv4();
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    const token = jwt.sign({ sub: user.dbId, email: user.email, name: user.displayName, role, verified: true }, process.env.JWT_SECRET, { expiresIn, jwtid: jti });
    logger.info(`Login: user=${user.dbId} role=${role}`);
    res.redirect(`/index.html?token=${encodeURIComponent(token)}`);
  } catch (e) {
    next(e);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const role = getRequestedRole(req.user.email);
    if (req.user.email) {
      await db.run('UPDATE users SET role = ? WHERE email = ?', [role, req.user.email]);
    }
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role,
      verified: req.user.verified
    });
  } catch (e) {
    next(e);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      const err = new Error('No token provided');
      err.status = 401;
      return next(err);
    }
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const expiresAt = payload.exp * 1000;
    await db.run('INSERT IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)', [payload.jti, expiresAt]);
    logger.info(`Logout: user=${payload.sub} jti=${payload.jti}`);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

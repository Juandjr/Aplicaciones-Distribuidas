const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  logger.error(`${req.method} ${req.originalUrl} - ${status} - ${message}`);
  res.status(status).json({ error: message });
};

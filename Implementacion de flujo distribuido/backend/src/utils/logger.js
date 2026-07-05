const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}] ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(timestamp({ format: () => new Date().toISOString() }), logFormat),
  transports: [
    new transports.File({ filename: 'logs/app.log' }),
    new transports.Console()
  ]
});

module.exports = logger;

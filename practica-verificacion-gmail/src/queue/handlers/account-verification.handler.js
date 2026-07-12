const emailService = require("../../services/email.service");

/**
 * Handler para tareas de tipo ACCOUNT_VERIFICATION.
 * Envía el correo con el código OTP de activación.
 */
async function handle(task) {
  const { recipient, metadata } = task;
  const { name, code, expirationMinutes } = metadata;

  await emailService.sendVerificationEmail({ name, email: recipient, code, expirationMinutes });
}

module.exports = { handle };

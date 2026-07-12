const emailService = require("../../services/email.service");

/**
 * Handler para tareas de tipo RESEND_VERIFICATION_CODE.
 * Reenvía el correo con el código OTP cuando el usuario lo solicita.
 */
async function handle(task) {
  const { recipient, metadata } = task;
  const { name, code, expirationMinutes } = metadata;

  await emailService.sendVerificationEmail({ name, email: recipient, code, expirationMinutes });
}

module.exports = { handle };

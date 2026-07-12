const emailService = require("../../services/email.service");

/**
 * Handler para tareas de tipo PASSWORD_RECOVERY.
 * Envía el correo con el botón de recuperación de contraseña.
 */
async function handle(task) {
  const { recipient, metadata } = task;
  const { name, token, baseUrl } = metadata;

  await emailService.sendPasswordRecoveryEmail({ name, email: recipient, token, baseUrl });
}

module.exports = { handle };

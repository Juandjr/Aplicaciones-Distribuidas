const emailService = require("../../services/email.service");

/**
 * Handler para tareas de tipo CUSTOM_NOTIFICATION.
 * Envía el correo dinámico con título, mensaje y firma configurados.
 */
async function handle(task) {
  const { recipient, subject, metadata } = task;
  const { title, message, signature } = metadata;

  await emailService.sendCustomMessage({
    to: recipient,
    subject,
    title,
    message,
    signature: signature || "Aplicaciones Distribuidas"
  });
}

module.exports = { handle };

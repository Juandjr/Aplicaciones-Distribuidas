const emailService = require("../../services/email.service");

/**
 * Handler para tareas de tipo ATTACHMENT_NOTIFICATION.
 * Envía el correo dinámico con un archivo adjunto.
 *
 * metadata.attachment tiene la forma:
 *   { originalname, mimetype, buffer (Buffer serializado como array) }
 */
async function handle(task) {
  const { recipient, subject, metadata } = task;
  const { title, message, signature, attachment } = metadata;

  // El buffer se almacena como array de enteros en la cola, lo restauramos.
  const fileBuffer = Buffer.isBuffer(attachment.buffer)
    ? attachment.buffer
    : Buffer.from(attachment.buffer);

  await emailService.sendEmailWithAttachment({
    to: recipient,
    subject,
    title,
    message,
    signature: signature || "Aplicaciones Distribuidas",
    attachment: {
      filename: attachment.originalname,
      content: fileBuffer,
      contentType: attachment.mimetype
    }
  });
}

module.exports = { handle };

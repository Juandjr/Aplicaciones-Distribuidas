const transporter = require("../config/mail.config");
const { env } = require("../config/env");
const {
  createVerificationEmail
} = require("../templates/verification-email.template");
const {
  createCustomMessageEmail
} = require("../templates/custom-message.template");
const {
  createPasswordRecoveryEmail
} = require("../templates/password-recovery.template");

async function verifyEmailConnection() {
  return transporter.verify();
}

async function sendEmail({ to, subject, text, html }) {
  return transporter.sendMail({
    from: `"Aplicaciones Distribuidas" <${env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  });
}

async function sendVerificationEmail({ name, email, code, expirationMinutes }) {
  const message = createVerificationEmail({
    name,
    code,
    expirationMinutes: expirationMinutes ?? env.CODE_TTL_MINUTES
  });

  return sendEmail({
    to: email,
    subject: message.subject,
    text: message.text,
    html: message.html
  });
}

async function sendCustomMessage({ to, subject, title, message, signature }) {
  const content = createCustomMessageEmail({
    title,
    message,
    signature
  });

  return sendEmail({
    to,
    subject,
    text: content.text,
    html: content.html
  });
}

/**
 * Envía el correo de recuperación de contraseña con botón y token parcial.
 */
async function sendPasswordRecoveryEmail({ name, email, token, baseUrl }) {
  const message = createPasswordRecoveryEmail({ name, email, token, baseUrl });

  return sendEmail({
    to: email,
    subject: message.subject,
    text: message.text,
    html: message.html
  });
}

/**
 * Envía un correo con un archivo adjunto.
 *
 * @param {object} params
 * @param {string} params.to         - Destinatario
 * @param {string} params.subject    - Asunto
 * @param {string} params.title      - Título de la tarjeta HTML
 * @param {string} params.message    - Cuerpo del mensaje
 * @param {string} params.signature  - Firma
 * @param {object} params.attachment - { filename, content (Buffer), contentType }
 */
async function sendEmailWithAttachment({ to, subject, title, message, signature, attachment }) {
  const content = createCustomMessageEmail({ title, message, signature });

  return transporter.sendMail({
    from: `"Aplicaciones Distribuidas" <${env.EMAIL_USER}>`,
    to,
    subject,
    text: content.text,
    html: content.html,
    attachments: [
      {
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType
      }
    ]
  });
}

module.exports = {
  verifyEmailConnection,
  sendEmail,
  sendVerificationEmail,
  sendCustomMessage,
  sendPasswordRecoveryEmail,
  sendEmailWithAttachment
};
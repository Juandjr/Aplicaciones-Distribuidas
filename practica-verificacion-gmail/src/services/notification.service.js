const queueRepository = require("../queue/queue.repository");
const { TASK_TYPES } = require("../queue/task-types");
const { normalizeEmail, isValidEmail } = require("../utils/email.util");
const AppError = require("../utils/app-error");

async function sendCustomNotification({
  to,
  subject,
  title,
  message,
  signature
}) {
  const normalizedEmail = normalizeEmail(to);
  const cleanSubject = String(subject || "").trim();
  const cleanTitle = String(title || "").trim();
  const cleanMessage = String(message || "").trim();
  const cleanSignature = String(signature || "").trim();

  if (!normalizedEmail || !cleanSubject || !cleanTitle || !cleanMessage) {
    throw new AppError(
      "El destinatario, el asunto, el título y el mensaje son obligatorios.",
      400
    );
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new AppError("El correo del destinatario es incorrecto.", 400);
  }

  if (cleanSubject.length > 120) {
    throw new AppError("El asunto no puede superar 120 caracteres.", 400);
  }

  if (cleanTitle.length > 100) {
    throw new AppError("El título no puede superar 100 caracteres.", 400);
  }

  if (cleanMessage.length > 3000) {
    throw new AppError("El mensaje no puede superar 3000 caracteres.", 400);
  }

  const task = queueRepository.createTask({
    type: TASK_TYPES.CUSTOM_NOTIFICATION,
    recipient: normalizedEmail,
    subject: cleanSubject,
    message: cleanMessage,
    metadata: {
      title: cleanTitle,
      message: cleanMessage,
      signature: cleanSignature || "Aplicaciones Distribuidas"
    }
  });

  return {
    message: "Tarea de envío de correo dinámico encolada correctamente.",
    recipient: normalizedEmail,
    taskId: task.id
  };
}

async function sendAttachmentNotification({
  to,
  subject,
  title,
  message,
  signature,
  file
}) {
  const normalizedEmail = normalizeEmail(to);
  const cleanSubject = String(subject || "").trim();
  const cleanTitle = String(title || "").trim();
  const cleanMessage = String(message || "").trim();
  const cleanSignature = String(signature || "").trim();

  if (!normalizedEmail || !cleanSubject || !cleanTitle || !cleanMessage) {
    throw new AppError(
      "El destinatario, el asunto, el título y el mensaje son obligatorios.",
      400
    );
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new AppError("El correo del destinatario es incorrecto.", 400);
  }

  if (!file) {
    throw new AppError("El archivo adjunto es obligatorio.", 400);
  }

  const task = queueRepository.createTask({
    type: TASK_TYPES.ATTACHMENT_NOTIFICATION,
    recipient: normalizedEmail,
    subject: cleanSubject,
    message: cleanMessage,
    metadata: {
      title: cleanTitle,
      message: cleanMessage,
      signature: cleanSignature || "Aplicaciones Distribuidas",
      attachment: {
        originalname: file.originalname,
        mimetype: file.mimetype,
        buffer: Array.from(file.buffer) // Serializar el buffer a array para guardarlo en la cola in-memory
      }
    }
  });

  return {
    message: "Tarea de envío de correo con adjunto encolada correctamente.",
    recipient: normalizedEmail,
    taskId: task.id
  };
}

module.exports = {
  sendCustomNotification,
  sendAttachmentNotification
};
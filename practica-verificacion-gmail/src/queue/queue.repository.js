const crypto = require("crypto");
const { TASK_STATUS } = require("./task-types");

/** @type {Map<string, object>} */
const tasks = new Map();

/**
 * Crea y almacena una nueva tarea en la cola.
 * @param {object} params
 * @param {string} params.type        - Tipo de tarea (TASK_TYPES.*)
 * @param {string} params.recipient   - Correo destinatario
 * @param {string} params.subject     - Asunto del correo
 * @param {string} params.message     - Cuerpo del mensaje (texto plano)
 * @param {object} [params.metadata]  - Datos adicionales específicos de cada tipo
 * @returns {object} La tarea creada
 */
function createTask({ type, recipient, subject, message, metadata = {} }) {
  const now = new Date().toISOString();

  const task = {
    id: crypto.randomUUID(),
    type,
    recipient,
    subject,
    message,
    metadata,        // datos extra: código OTP, token, adjunto, etc.
    status: TASK_STATUS.PENDING,
    attempts: 0,
    error: null,
    createdAt: now,
    updatedAt: now
  };

  tasks.set(task.id, task);
  return task;
}

/**
 * Devuelve todas las tareas como arreglo, del más reciente al más antiguo.
 */
function getAllTasks() {
  return Array.from(tasks.values()).reverse();
}

/**
 * Devuelve las tareas con estado PENDING, ordenadas por fecha de creación.
 */
function getPendingTasks() {
  return Array.from(tasks.values())
    .filter((t) => t.status === TASK_STATUS.PENDING)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Obtiene una tarea por su ID.
 */
function findById(id) {
  return tasks.get(id) || null;
}

/**
 * Actualiza campos de una tarea existente.
 */
function updateTask(id, changes) {
  const task = tasks.get(id);

  if (!task) return null;

  const updated = {
    ...task,
    ...changes,
    updatedAt: new Date().toISOString()
  };

  tasks.set(id, updated);
  return updated;
}

/**
 * Marca una tarea como PROCESSING e incrementa intentos.
 */
function markProcessing(id) {
  const task = tasks.get(id);

  if (!task) return null;

  return updateTask(id, {
    status: TASK_STATUS.PROCESSING,
    attempts: task.attempts + 1
  });
}

/**
 * Marca una tarea como SENT.
 */
function markSent(id) {
  return updateTask(id, { status: TASK_STATUS.SENT, error: null });
}

/**
 * Marca una tarea como FAILED y guarda el mensaje de error.
 */
function markFailed(id, errorMessage) {
  return updateTask(id, {
    status: TASK_STATUS.FAILED,
    error: errorMessage
  });
}

module.exports = {
  createTask,
  getAllTasks,
  getPendingTasks,
  findById,
  updateTask,
  markProcessing,
  markSent,
  markFailed
};

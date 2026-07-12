const queueRepository = require("./queue.repository");
const { TASK_TYPES, TASK_STATUS } = require("./task-types");

const accountVerificationHandler = require("./handlers/account-verification.handler");
const resendVerificationHandler  = require("./handlers/resend-verification.handler");
const passwordRecoveryHandler     = require("./handlers/password-recovery.handler");
const customNotificationHandler   = require("./handlers/custom-notification.handler");
const attachmentNotificationHandler = require("./handlers/attachment-notification.handler");

/** Mapa de tipo de tarea → handler correspondiente */
const HANDLERS = {
  [TASK_TYPES.ACCOUNT_VERIFICATION]:   accountVerificationHandler,
  [TASK_TYPES.RESEND_VERIFICATION_CODE]: resendVerificationHandler,
  [TASK_TYPES.PASSWORD_RECOVERY]:      passwordRecoveryHandler,
  [TASK_TYPES.CUSTOM_NOTIFICATION]:    customNotificationHandler,
  [TASK_TYPES.ATTACHMENT_NOTIFICATION]: attachmentNotificationHandler
};

/** Intervalo entre ciclos del worker (ms) */
const POLL_INTERVAL_MS = 3000;

/** Número máximo de intentos antes de marcar una tarea como FAILED */
const MAX_ATTEMPTS = 3;

let intervalId   = null;
let isPaused     = false;
let isProcessing = false;

/**
 * Procesa una única tarea pendiente de la cola.
 * - Marca la tarea como PROCESSING.
 * - Llama al handler correspondiente.
 * - Marca como SENT si tiene éxito, FAILED si supera MAX_ATTEMPTS.
 * - Devuelve la tarea a PENDING si falla y aún tiene intentos restantes.
 */
async function processBatch() {
  if (isPaused || isProcessing) return;

  const pending = queueRepository.getPendingTasks();

  if (pending.length === 0) return;

  isProcessing = true;

  // Toma solo la primera tarea para procesar de a una a la vez
  const task = pending[0];

  console.log(`[Worker] Procesando tarea ${task.id} | tipo: ${task.type} | intento: ${task.attempts + 1}`);

  const updated = queueRepository.markProcessing(task.id);

  const handler = HANDLERS[task.type];

  if (!handler) {
    console.error(`[Worker] No existe handler para el tipo: ${task.type}`);
    queueRepository.markFailed(task.id, `Tipo de tarea desconocido: ${task.type}`);
    isProcessing = false;
    return;
  }

  try {
    await handler.handle(updated);

    queueRepository.markSent(task.id);
    console.log(`[Worker] ✔ Tarea ${task.id} enviada correctamente.`);
  } catch (error) {
    const attempts = updated.attempts;

    if (attempts >= MAX_ATTEMPTS) {
      queueRepository.markFailed(task.id, error.message);
      console.error(`[Worker] ✘ Tarea ${task.id} fallida definitivamente después de ${attempts} intento(s). Error: ${error.message}`);
    } else {
      // Devuelve la tarea a PENDING para reintentar en el siguiente ciclo
      queueRepository.updateTask(task.id, {
        status: TASK_STATUS.PENDING,
        error: error.message
      });
      console.warn(`[Worker] ⚠ Tarea ${task.id} fallida (intento ${attempts}/${MAX_ATTEMPTS}). Se reintentará. Error: ${error.message}`);
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Inicia el worker. Llama a processBatch() en un intervalo fijo.
 */
function start() {
  if (intervalId) {
    console.log("[Worker] El worker ya está iniciado.");
    return;
  }

  console.log(`[Worker] Iniciado. Revisando la cola cada ${POLL_INTERVAL_MS / 1000}s.`);
  intervalId = setInterval(processBatch, POLL_INTERVAL_MS);
}

/**
 * Pausa el worker (no cancela el intervalo, pero processBatch() no hace nada).
 */
function pause() {
  if (isPaused) {
    console.log("[Worker] Ya está pausado.");
    return;
  }
  isPaused = true;
  console.log("[Worker] ⏸ Worker pausado. Las tareas permanecerán PENDING hasta reanudar.");
}

/**
 * Reanuda el worker tras una pausa.
 */
function resume() {
  if (!isPaused) {
    console.log("[Worker] No está pausado.");
    return;
  }
  isPaused = false;
  console.log("[Worker] ▶ Worker reanudado.");
}

/**
 * Detiene el worker completamente (elimina el intervalo).
 */
function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Worker] Detenido.");
  }
}

/**
 * Devuelve el estado actual del worker.
 */
function getStatus() {
  return {
    running: intervalId !== null,
    paused: isPaused,
    pollIntervalMs: POLL_INTERVAL_MS,
    maxAttempts: MAX_ATTEMPTS
  };
}

module.exports = { start, pause, resume, stop, getStatus };

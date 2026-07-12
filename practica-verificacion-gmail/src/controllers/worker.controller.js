const worker = require("../queue/worker");
const queueRepository = require("../queue/queue.repository");

/**
 * GET /api/worker/status
 * Devuelve el estado actual del worker y las tareas en cola.
 */
function getStatus(req, res) {
  const status = worker.getStatus();
  const tasks = queueRepository.getAllTasks();

  const summary = {
    PENDING:    tasks.filter((t) => t.status === "PENDING").length,
    PROCESSING: tasks.filter((t) => t.status === "PROCESSING").length,
    SENT:       tasks.filter((t) => t.status === "SENT").length,
    FAILED:     tasks.filter((t) => t.status === "FAILED").length
  };

  return res.status(200).json({ worker: status, summary, tasks });
}

/**
 * POST /api/worker/pause
 * Pausa el worker (las tareas PENDING no se procesan hasta reanudar).
 */
function pause(req, res) {
  worker.pause();
  return res.status(200).json({
    message: "Worker pausado. Las tareas permanecerán en PENDING hasta reanudar.",
    worker: worker.getStatus()
  });
}

/**
 * POST /api/worker/resume
 * Reanuda el worker.
 */
function resume(req, res) {
  worker.resume();
  return res.status(200).json({
    message: "Worker reanudado. Se procesarán las tareas pendientes.",
    worker: worker.getStatus()
  });
}

/**
 * GET /api/queue/tasks
 * Lista todas las tareas con sus estados (alias de getStatus sin la info del worker).
 */
function listTasks(req, res) {
  const tasks = queueRepository.getAllTasks();
  return res.status(200).json({ total: tasks.length, tasks });
}

module.exports = { getStatus, pause, resume, listTasks };

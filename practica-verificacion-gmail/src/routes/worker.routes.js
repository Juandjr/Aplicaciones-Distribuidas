const express = require("express");
const workerController = require("../controllers/worker.controller");

const router = express.Router();

// GET  /api/worker/status  — estado del worker + resumen de tareas
router.get("/status", workerController.getStatus);

// POST /api/worker/pause   — pausa el worker
router.post("/pause", workerController.pause);

// POST /api/worker/resume  — reanuda el worker
router.post("/resume", workerController.resume);

// GET  /api/queue/tasks    — lista todas las tareas (sin info del worker)
// Nota: esta ruta se monta como /api/queue en app.js
router.get("/tasks", workerController.listTasks);

module.exports = router;

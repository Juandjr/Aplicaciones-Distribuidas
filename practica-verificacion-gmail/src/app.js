const path = require("path");
const express = require("express");

const authRoutes = require("./routes/auth.routes");
const notificationRoutes = require("./routes/notification.routes");
const mfaRoutes = require("./routes/mfa.routes");
const workerRoutes = require("./routes/worker.routes");

const {
  notFoundHandler,
  errorHandler
} = require("./middleware/error.middleware");

const app = express();

// Aumentado el límite de express.json para soportar los payloads de serialización de archivos adjuntos (hasta 20 MB)
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

// Servir la página de restablecer contraseña
app.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "reset-password.html"));
});

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    service: "account-verification-api",
    status: "UP",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/mfa", mfaRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/queue", workerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
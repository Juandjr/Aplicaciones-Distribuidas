const app = require("./app");
const { env, validateEnvironment } = require("./config/env");
const emailService = require("./services/email.service");
const worker = require("./queue/worker");

async function startServer() {
  try {
    validateEnvironment();
    await emailService.verifyEmailConnection();

    // Iniciar el worker de la cola interna
    worker.start();

    app.listen(env.PORT, () => {
      console.log(`Servidor disponible en http://localhost:${env.PORT}`);
      console.log("Conexión SMTP con Gmail verificada.");
      console.log("Worker de cola interna de correo iniciado.");
    });
  } catch (error) {
    console.error("No fue posible iniciar la aplicación:", error.message);
    process.exit(1);
  }
}

startServer();
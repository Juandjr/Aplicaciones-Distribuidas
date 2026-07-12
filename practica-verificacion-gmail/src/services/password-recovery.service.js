const crypto = require("crypto");
const userRepository = require("../repositories/user.repository");
const queueRepository = require("../queue/queue.repository");
const { TASK_TYPES } = require("../queue/task-types");
const { normalizeEmail, isValidEmail } = require("../utils/email.util");
const { hashPassword } = require("../utils/password.util");
const AppError = require("../utils/app-error");
const { env } = require("../config/env");

/** Tiempo de vida del token de recuperación en minutos */
const RECOVERY_TOKEN_TTL_MINUTES = 30;

/**
 * Solicita la recuperación de cuenta para el correo indicado.
 *
 * Flujo:
 *  1. Valida el correo.
 *  2. Verifica que el usuario exista (sin revelar si no existe, por seguridad).
 *  3. Genera un token criptográficamente seguro.
 *  4. Guarda el token + expiración en el repositorio de usuarios.
 *  5. Encola una tarea PASSWORD_RECOVERY para que el worker envíe el correo.
 *
 * Nota: el token NO es la contraseña. Es una clave temporal que demuestra
 * que quien hace clic en el enlace tiene acceso al correo registrado.
 */
async function requestRecovery(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    throw new AppError("El correo electrónico no es válido.", 400);
  }

  const user = userRepository.findByEmail(normalizedEmail);

  // Por seguridad siempre respondemos igual, incluso si el correo no existe
  if (!user || user.status !== "ACTIVE") {
    return {
      message:
        "Si el correo está registrado y la cuenta está activa, recibirás un enlace de recuperación en breve."
    };
  }

  // Generar token seguro de 64 caracteres hexadecimales (32 bytes)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + RECOVERY_TOKEN_TTL_MINUTES * 60 * 1000
  ).toISOString();

  // Persistir token en el usuario
  userRepository.updateByEmail(normalizedEmail, {
    recoveryToken: token,
    recoveryTokenExpiresAt: expiresAt,
    recoveryTokenUsed: false
  });

  const baseUrl = `http://localhost:${env.PORT}`;

  // Encolar la tarea — el worker la procesará de forma asíncrona
  const task = queueRepository.createTask({
    type: TASK_TYPES.PASSWORD_RECOVERY,
    recipient: normalizedEmail,
    subject: "Solicitud de recuperación de contraseña",
    message: `Token de recuperación generado para ${normalizedEmail}`,
    metadata: {
      name: user.name,
      token,
      baseUrl
    }
  });

  console.log(
    `[Recovery] Token generado para ${normalizedEmail}. Tarea encolada: ${task.id}`
  );

  return {
    message:
      "Si el correo está registrado y la cuenta está activa, recibirás un enlace de recuperación en breve.",
    taskId: task.id // útil para monitorear en el panel de cola
  };
}

/**
 * Valida el token de recuperación sin consumirlo.
 * Usado para verificar si el link es válido antes de mostrar el formulario.
 */
function validateToken(email, token) {
  const normalizedEmail = normalizeEmail(email);
  const user = userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("El token de recuperación no es válido o ha expirado.", 400);
  }

  if (!user.recoveryToken || user.recoveryToken !== token) {
    throw new AppError("El token de recuperación no es válido o ha expirado.", 400);
  }

  if (user.recoveryTokenUsed) {
    throw new AppError("Este enlace de recuperación ya fue utilizado.", 400);
  }

  if (new Date(user.recoveryTokenExpiresAt).getTime() < Date.now()) {
    throw new AppError(
      "El enlace de recuperación ha expirado. Solicita uno nuevo.",
      400
    );
  }

  return { valid: true, email: normalizedEmail };
}

/**
 * Restablece la contraseña del usuario usando el token de recuperación.
 *
 * Flujo:
 *  1. Valida el token (mismo proceso que validateToken).
 *  2. Actualiza la contraseña con hash.
 *  3. Invalida el token para que no pueda reutilizarse.
 */
async function resetPassword(email, token, newPassword) {
  const normalizedEmail = normalizeEmail(email);

  // Reutilizamos la validación
  validateToken(normalizedEmail, token);

  const cleanPassword = String(newPassword || "").trim();

  if (!cleanPassword || cleanPassword.length < 6) {
    throw new AppError(
      "La nueva contraseña debe tener al menos 6 caracteres.",
      400
    );
  }

  const passwordHash = await hashPassword(cleanPassword);

  userRepository.updateByEmail(normalizedEmail, {
    passwordHash,
    recoveryToken: null,
    recoveryTokenExpiresAt: null,
    recoveryTokenUsed: true
  });

  console.log(`[Recovery] Contraseña restablecida para ${normalizedEmail}.`);

  return {
    message: "Contraseña restablecida correctamente. Ya puedes iniciar sesión."
  };
}

module.exports = {
  requestRecovery,
  validateToken,
  resetPassword
};

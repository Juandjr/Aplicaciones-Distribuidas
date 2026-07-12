const crypto = require("crypto");
const userRepository = require("../repositories/user.repository");
const queueRepository = require("../queue/queue.repository");
const { TASK_TYPES } = require("../queue/task-types");
const { generateVerificationCode } = require("../utils/code.util");
const { normalizeEmail, isValidEmail } = require("../utils/email.util");
const { hashPassword } = require("../utils/password.util");
const AppError = require("../utils/app-error");
const { env } = require("../config/env");

function createExpirationDate() {
  return new Date(Date.now() + env.CODE_TTL_MINUTES * 60 * 1000);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    mfaEnabled: Boolean(user.mfaEnabled),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt || null
  };
}

async function registerUser({ name, email, password }) {
  const cleanName = String(name || "").trim();
  const normalizedEmail = normalizeEmail(email);
  const cleanPassword = String(password || "").trim();

  if (!cleanName || !normalizedEmail) {
    throw new AppError("El nombre y el correo son obligatorios.", 400);
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new AppError("El formato del correo electrónico es incorrecto.", 400);
  }

  if (!cleanPassword || cleanPassword.length < 6) {
    throw new AppError(
      "La contraseña es obligatoria y debe tener al menos 6 caracteres.",
      400
    );
  }

  const existingUser = userRepository.findByEmail(normalizedEmail);

  if (existingUser?.status === "ACTIVE") {
    throw new AppError("La cuenta ya se encuentra activa.", 409);
  }

  const verificationCode = generateVerificationCode();
  const expiresAt = createExpirationDate();
  const now = new Date().toISOString();

  const user = {
    id: existingUser?.id || crypto.randomUUID(),
    name: cleanName,
    email: normalizedEmail,
    status: "INACTIVE",

    passwordHash: await hashPassword(cleanPassword),

    verificationCode,
    expiresAt: expiresAt.toISOString(),
    verificationAttempts: 0,

    mfaEnabled: existingUser?.mfaEnabled || false,
    mfaSecret: existingUser?.mfaSecret || null,
    pendingMfaSecret: null,

    createdAt: existingUser?.createdAt || now,
    updatedAt: existingUser ? now : null
  };

  // Encolar la tarea — el worker la procesará de forma asíncrona
  const task = queueRepository.createTask({
    type: TASK_TYPES.ACCOUNT_VERIFICATION,
    recipient: user.email,
    subject: `${verificationCode} es su código de activación`,
    message: `Código de verificación para ${user.email}`,
    metadata: {
      name: user.name,
      code: verificationCode,
      expirationMinutes: env.CODE_TTL_MINUTES
    }
  });

  userRepository.save(user);

  return {
    message:
      "Cuenta registrada como inactiva. Se envió un código al correo proporcionado.",
    user: publicUser(user),
    codeExpiresAt: user.expiresAt,
    taskId: task.id
  };
}

function verifyAccount({ email, code }) {
  const normalizedEmail = normalizeEmail(email);
  const cleanCode = String(code || "").trim();

  if (!normalizedEmail || !cleanCode) {
    throw new AppError("El correo y el código son obligatorios.", 400);
  }

  const user = userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("No existe una cuenta registrada con ese correo.", 404);
  }

  if (user.status === "ACTIVE") {
    return {
      message: "La cuenta ya se encuentra activa.",
      user: publicUser(user)
    };
  }

  if (new Date(user.expiresAt).getTime() < Date.now()) {
    throw new AppError(
      "El código ha expirado. Solicite el reenvío de un nuevo código.",
      400
    );
  }

  if (user.verificationAttempts >= env.MAX_VERIFICATION_ATTEMPTS) {
    throw new AppError(
      "Se alcanzó el número máximo de intentos. Solicite un nuevo código.",
      429
    );
  }

  if (user.verificationCode !== cleanCode) {
    const attempts = user.verificationAttempts + 1;

    userRepository.updateByEmail(normalizedEmail, {
      verificationAttempts: attempts
    });

    const remainingAttempts = Math.max(
      env.MAX_VERIFICATION_ATTEMPTS - attempts,
      0
    );

    throw new AppError(
      `El código es incorrecto. Intentos restantes: ${remainingAttempts}.`,
      400
    );
  }

  const activatedUser = userRepository.updateByEmail(normalizedEmail, {
    status: "ACTIVE",
    verificationCode: null,
    expiresAt: null,
    verificationAttempts: 0,
    activatedAt: new Date().toISOString()
  });

  return {
    message: "Cuenta activada correctamente.",
    user: publicUser(activatedUser)
  };
}

function getAccountStatus(email) {
  const normalizedEmail = normalizeEmail(email);
  const user = userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("La cuenta no se encuentra registrada.", 404);
  }

  return {
    user: publicUser(user)
  };
}

async function resendVerificationCode(email) {
  const normalizedEmail = normalizeEmail(email);
  const user = userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("La cuenta no se encuentra registrada.", 404);
  }

  if (user.status === "ACTIVE") {
    throw new AppError("La cuenta ya se encuentra activa.", 409);
  }

  const verificationCode = generateVerificationCode();
  const expiresAt = createExpirationDate();

  userRepository.updateByEmail(normalizedEmail, {
    verificationCode,
    expiresAt: expiresAt.toISOString(),
    verificationAttempts: 0
  });

  // Encolar reenvío — asíncrono, la API responde de inmediato
  const task = queueRepository.createTask({
    type: TASK_TYPES.RESEND_VERIFICATION_CODE,
    recipient: user.email,
    subject: `${verificationCode} es su nuevo código de activación`,
    message: `Reenvío de código de verificación para ${user.email}`,
    metadata: {
      name: user.name,
      code: verificationCode,
      expirationMinutes: env.CODE_TTL_MINUTES
    }
  });

  return {
    message: "Se envió un nuevo código de verificación.",
    codeExpiresAt: expiresAt.toISOString(),
    taskId: task.id
  };
}

module.exports = {
  registerUser,
  verifyAccount,
  getAccountStatus,
  resendVerificationCode
};
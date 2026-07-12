const { authenticator } = require("@otplib/preset-default");

const QRCode = require("qrcode");
const userRepository = require("../repositories/user.repository");
const { normalizeEmail } = require("../utils/email.util");
const { verifyPassword } = require("../utils/password.util");
const AppError = require("../utils/app-error");
const { env } = require("../config/env");

authenticator.options = {
  step: 30,
  window: env.MFA_WINDOW
};

function publicMfaUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    mfaEnabled: Boolean(user.mfaEnabled)
  };
}

function getActiveUser(email) {
  const normalizedEmail = normalizeEmail(email);
  const user = userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("La cuenta no se encuentra registrada.", 404);
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(
      "La cuenta debe estar activa antes de usar autenticación en dos pasos.",
      403
    );
  }

  return user;
}

async function startMfaSetup({ email }) {
  const user = getActiveUser(email);

  if (user.mfaEnabled) {
    throw new AppError(
      "La autenticación en dos pasos ya está activada para esta cuenta.",
      409
    );
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, env.MFA_ISSUER, secret);
  const qrCode = await QRCode.toDataURL(otpauth);

  userRepository.updateByEmail(user.email, {
    pendingMfaSecret: secret
  });

  return {
    message: "Escanee el código QR con Microsoft Authenticator o Google Authenticator.",
    email: user.email,
    issuer: env.MFA_ISSUER,
    manualKey: secret,
    qrCode
  };
}

function confirmMfaSetup({ email, code }) {
  const user = getActiveUser(email);
  const cleanCode = String(code || "").replace(/\s/g, "");

  if (!user.pendingMfaSecret) {
    throw new AppError(
      "No existe una configuración MFA pendiente para esta cuenta.",
      400
    );
  }

  if (!cleanCode) {
    throw new AppError("El código del autenticador es obligatorio.", 400);
  }

  const isValid = authenticator.check(cleanCode, user.pendingMfaSecret);

  if (!isValid) {
    throw new AppError(
      "El código ingresado no es válido. Revise la hora del celular o espere un nuevo código.",
      400
    );
  }

  const updatedUser = userRepository.updateByEmail(user.email, {
    mfaEnabled: true,
    mfaSecret: user.pendingMfaSecret,
    pendingMfaSecret: null
  });

  return {
    message: "Autenticación en dos pasos activada correctamente.",
    user: publicMfaUser(updatedUser)
  };
}

async function loginFirstStep({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const cleanPassword = String(password || "");
  const user = userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("Correo o contraseña incorrectos.", 401);
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(
      "La cuenta debe estar activa antes de iniciar sesión.",
      403
    );
  }

  if (!user.passwordHash) {
    throw new AppError(
      "La cuenta no tiene contraseña registrada. Registre nuevamente el usuario.",
      400
    );
  }

  const passwordIsValid = await verifyPassword(cleanPassword, user.passwordHash);

  if (!passwordIsValid) {
    throw new AppError("Correo o contraseña incorrectos.", 401);
  }

  if (!user.mfaEnabled) {
    return {
      message: "Inicio de sesión correcto. La cuenta no tiene 2FA activo.",
      requiresMfa: false,
      user: publicMfaUser(user)
    };
  }

  return {
    message: "Primer factor correcto. Ingrese el código del autenticador.",
    requiresMfa: true,
    email: user.email
  };
}

function verifyMfaLogin({ email, code }) {
  const user = getActiveUser(email);
  const cleanCode = String(code || "").replace(/\s/g, "");

  if (!user.mfaEnabled || !user.mfaSecret) {
    throw new AppError(
      "La cuenta no tiene autenticación en dos pasos activada.",
      400
    );
  }

  if (!cleanCode) {
    throw new AppError("El código MFA es obligatorio.", 400);
  }

  const isValid = authenticator.check(cleanCode, user.mfaSecret);

  if (!isValid) {
    throw new AppError("El código MFA no es válido o ya venció.", 400);
  }

  return {
    message: "Inicio de sesión completado con segundo factor.",
    user: publicMfaUser(user)
  };
}

function getMfaStatus(email) {
  const user = getActiveUser(email);

  return {
    user: publicMfaUser(user)
  };
}

module.exports = {
  startMfaSetup,
  confirmMfaSetup,
  loginFirstStep,
  verifyMfaLogin,
  getMfaStatus
};
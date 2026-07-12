const { escapeHtml } = require("../utils/html.util");

/**
 * Genera el correo HTML de recuperación de contraseña.
 * Incluye un botón con enlace que contiene el token temporal.
 *
 * @param {object} params
 * @param {string} params.name     - Nombre del usuario
 * @param {string} params.email    - Correo del usuario (para incluir en el link)
 * @param {string} params.token    - Token de recuperación
 * @param {string} params.baseUrl  - URL base del servidor (ej: http://localhost:3000)
 * @param {number} [params.expirationMinutes=30] - Minutos de validez del token
 */
function createPasswordRecoveryEmail({ name, email, token, baseUrl, expirationMinutes = 30 }) {
  const safeName = escapeHtml(name);
  const recoveryUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  const expirationText = `${expirationMinutes} minuto(s)`;

  // El token se muestra parcialmente oculto en el correo para no exponerlo completo
  const maskedToken = token.substring(0, 8) + "•".repeat(16) + token.slice(-8);

  const subject = "Solicitud de recuperación de contraseña";

  const text = [
    `Hola ${name}:`,
    "",
    "Recibimos una solicitud para recuperar el acceso a tu cuenta.",
    "Si realizaste esta solicitud, haz clic en el enlace a continuación:",
    "",
    recoveryUrl,
    "",
    `Este enlace expira en ${expirationText}.`,
    "",
    "Si no solicitaste la recuperación, ignora este mensaje. Tu contraseña no cambiará.",
    "",
    "Aplicaciones Distribuidas"
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de contraseña</title>
      </head>
      <body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f0f4ff;">
          <tr>
            <td align="center" style="padding:32px 14px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,.12);">
                <!-- Encabezado -->
                <tr>
                  <td align="center" style="padding:30px 24px;background:#1e3a8a;">
                    <div style="width:58px;height:58px;line-height:58px;margin:0 auto 14px;border-radius:50%;background:#ffffff;color:#1e3a8a;font-size:25px;font-weight:700;text-align:center;">🔑</div>
                    <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:-.3px;">Recuperación de contraseña</h1>
                    <p style="margin:8px 0 0;color:#93c5fd;font-size:13px;">Aplicaciones Distribuidas</p>
                  </td>
                </tr>

                <!-- Cuerpo -->
                <tr>
                  <td style="padding:34px 36px 28px;">
                    <p style="margin:0 0 18px;font-size:17px;line-height:1.6;">Hola <strong>${safeName}</strong>:</p>
                    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475569;">
                      Recibimos una solicitud para recuperar el acceso a tu cuenta. Haz clic en el botón de abajo para establecer una nueva contraseña.
                    </p>

                    <!-- Botón de recuperación -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding:8px 0 28px;">
                          <a href="${recoveryUrl}"
                             style="display:inline-block;padding:14px 36px;background:#1d4ed8;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:.3px;">
                            Recuperar mi cuenta
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Token parcialmente oculto (para evidencia) -->
                    <div style="margin:0 0 22px;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                      <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Identificador de solicitud (token parcial)</p>
                      <p style="margin:0;color:#334155;font-size:13px;font-family:monospace;word-break:break-all;">${maskedToken}</p>
                    </div>

                    <!-- Advertencia de expiración -->
                    <div style="padding:14px 16px;background:#fff7ed;border-left:4px solid #f97316;border-radius:6px;">
                      <p style="margin:0;color:#9a3412;font-size:14px;line-height:1.5;">
                        ⚠️ Este enlace expira en <strong>${expirationText}</strong>. Úsalo antes de que venza.
                      </p>
                    </div>

                    <p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:#94a3b8;">
                      Si no solicitaste la recuperación de cuenta, puedes ignorar este correo. Tu contraseña actual permanecerá sin cambios.
                    </p>
                  </td>
                </tr>

                <!-- Pie -->
                <tr>
                  <td align="center" style="padding:20px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#334155;font-size:13px;font-weight:700;">Aplicaciones Distribuidas</p>
                    <p style="margin:0;color:#94a3b8;font-size:12px;">Mensaje automático. No responda a este correo.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { subject, text, html };
}

module.exports = { createPasswordRecoveryEmail };

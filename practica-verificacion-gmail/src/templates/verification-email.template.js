const { escapeHtml } = require("../utils/html.util");

function createVerificationEmail({ name, code, expirationMinutes }) {
  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);
  const expirationText = `${expirationMinutes} minuto(s)`;

  const subject = `${safeCode} es su código de activación`;

  const text = [
    `Hola ${name}:`,
    "",
    "Se solicitó la activación de una cuenta con este correo.",
    `Código de verificación: ${code}`,
    `El código vence en ${expirationText}.`,
    "",
    "Si usted no realizó este registro, puede ignorar el mensaje.",
    "",
    "Aplicaciones Distribuidas"
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activación de cuenta</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f5f9;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f5f9;">
          <tr>
            <td align="center" style="padding:32px 14px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 20px rgba(15,23,42,.10);">
                <tr>
                  <td align="center" style="padding:30px 24px;background:#172554;">
                    <div style="width:58px;height:58px;line-height:58px;margin:0 auto 14px;border-radius:50%;background:#ffffff;color:#172554;font-size:25px;font-weight:700;text-align:center;">AD</div>
                    <h1 style="margin:0;color:#ffffff;font-size:24px;">Activación de cuenta</h1>
                    <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">Aplicaciones Distribuidas</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:34px 34px 22px;">
                    <p style="margin:0 0 18px;font-size:17px;line-height:1.6;">Hola <strong>${safeName}</strong>:</p>
                    <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#475569;">Se solicitó la activación de una cuenta utilizando este correo electrónico. Ingrese el siguiente código en la aplicación:</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding:24px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
                          <p style="margin:0 0 8px;color:#475569;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Código de verificación</p>
                          <p style="margin:0;color:#1d4ed8;font-size:38px;font-weight:700;letter-spacing:9px;line-height:1.3;">${safeCode}</p>
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top:22px;padding:14px 16px;background:#fff7ed;border-left:4px solid #f97316;border-radius:6px;">
                      <p style="margin:0;color:#9a3412;font-size:14px;line-height:1.5;">Este código vence en <strong>${expirationText}</strong>.</p>
                    </div>
                    <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#64748b;">Por seguridad, no comparta este código. La cuenta permanecerá inactiva hasta que el código sea validado.</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:22px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                    <p style="margin:0 0 5px;color:#334155;font-size:13px;font-weight:700;">Aplicaciones Distribuidas</p>
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

module.exports = {
  createVerificationEmail
};
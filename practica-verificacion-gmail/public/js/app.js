console.log("app.js cargado correctamente");

const registerForm = document.getElementById("registerForm");
const verifyForm = document.getElementById("verifyForm");
const statusForm = document.getElementById("statusForm");
const resendButton = document.getElementById("resendButton");
const notificationForm = document.getElementById("notificationForm");

const mfaSetupForm = document.getElementById("mfaSetupForm");
const mfaConfirmForm = document.getElementById("mfaConfirmForm");
const mfaLoginForm = document.getElementById("mfaLoginForm");
const mfaLoginVerifyForm = document.getElementById("mfaLoginVerifyForm");

console.log("mfaSetupForm:", mfaSetupForm);

async function request(url, options = {}) {
  console.log("Enviando solicitud a:", url);

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();

  console.log("Respuesta recibida:", response.status, data);

  if (!response.ok) {
    throw new Error(data.message || "La solicitud no pudo completarse.");
  }

  return data;
}

function showMessage(elementId, message) {
  const element = document.getElementById(elementId);

  if (element) {
    element.textContent = message;
  } else {
    console.error("No existe el elemento:", elementId);
  }
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {
      const data = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password
        })
      });

      showMessage("registerMessage", data.message);

      document.getElementById("verifyEmail").value = email;
      document.getElementById("statusEmail").value = email;
      document.getElementById("mfaSetupEmail").value = email;
      document.getElementById("mfaConfirmEmail").value = email;
      document.getElementById("loginEmail").value = email;
    } catch (error) {
      console.error("Error registro:", error);
      showMessage("registerMessage", error.message);
    }
  });
}

if (verifyForm) {
  verifyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("verifyEmail").value;
    const code = document.getElementById("code").value;

    try {
      const data = await request("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          email,
          code
        })
      });

      showMessage("verifyMessage", data.message);
    } catch (error) {
      console.error("Error verificación:", error);
      showMessage("verifyMessage", error.message);
    }
  });
}

if (resendButton) {
  resendButton.addEventListener("click", async () => {
    const email = document.getElementById("verifyEmail").value;

    try {
      const data = await request("/api/auth/resend", {
        method: "POST",
        body: JSON.stringify({
          email
        })
      });

      showMessage("verifyMessage", data.message);
    } catch (error) {
      console.error("Error reenvío:", error);
      showMessage("verifyMessage", error.message);
    }
  });
}

if (statusForm) {
  statusForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("statusEmail").value;
    const result = document.getElementById("statusResult");

    try {
      const data = await request(
        `/api/auth/status/${encodeURIComponent(email)}`
      );

      result.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
      console.error("Error estado:", error);
      result.textContent = error.message;
    }
  });
}

if (notificationForm) {
  notificationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const to = document.getElementById("notificationEmail").value;
    const subject = document.getElementById("notificationSubject").value;
    const title = document.getElementById("notificationTitle").value;
    const message = document.getElementById("notificationMessage").value;
    const signature = document.getElementById("notificationSignature").value;

    try {
      const data = await request("/api/notifications/send", {
        method: "POST",
        body: JSON.stringify({
          to,
          subject,
          title,
          message,
          signature
        })
      });

      showMessage("notificationMessageResult", data.message);
    } catch (error) {
      console.error("Error notificación:", error);
      showMessage("notificationMessageResult", error.message);
    }
  });
}

if (mfaSetupForm) {
  mfaSetupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    console.log("Clic en generar QR");

    const email = document.getElementById("mfaSetupEmail").value;

    showMessage("mfaSetupMessage", "Generando QR, espere un momento...");

    try {
      const data = await request("/api/mfa/setup", {
        method: "POST",
        body: JSON.stringify({
          email
        })
      });

      document.getElementById("mfaQrImage").src = data.qrCode;
      document.getElementById("mfaManualKey").textContent = data.manualKey;
      document.getElementById("mfaQrContainer").hidden = false;
      document.getElementById("mfaConfirmEmail").value = email;

      showMessage("mfaSetupMessage", data.message);
    } catch (error) {
      console.error("Error MFA setup:", error);
      showMessage("mfaSetupMessage", error.message);
    }
  });
} else {
  console.error("No se encontró el formulario mfaSetupForm");
}

if (mfaConfirmForm) {
  mfaConfirmForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("mfaConfirmEmail").value;
    const code = document.getElementById("mfaConfirmCode").value;

    try {
      const data = await request("/api/mfa/confirm", {
        method: "POST",
        body: JSON.stringify({
          email,
          code
        })
      });

      showMessage("mfaSetupMessage", data.message);
    } catch (error) {
      console.error("Error MFA confirm:", error);
      showMessage("mfaSetupMessage", error.message);
    }
  });
}

if (mfaLoginForm) {
  mfaLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const data = await request("/api/mfa/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password
        })
      });

      showMessage("mfaLoginMessage", data.message);

      if (data.requiresMfa) {
        document.getElementById("mfaLoginChallenge").hidden = false;
        document.getElementById("loginMfaEmail").value = data.email;
      } else {
        document.getElementById("mfaLoginChallenge").hidden = true;
      }
    } catch (error) {
      console.error("Error MFA login:", error);
      showMessage("mfaLoginMessage", error.message);
    }
  });
}

if (mfaLoginVerifyForm) {
  mfaLoginVerifyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginMfaEmail").value;
    const code = document.getElementById("loginMfaCode").value;

    try {
      const data = await request("/api/mfa/login/verify", {
        method: "POST",
        body: JSON.stringify({
          email,
          code
        })
      });

      showMessage("mfaLoginMessage", data.message);
      document.getElementById("mfaLoginChallenge").hidden = true;
    } catch (error) {
      console.error("Error MFA login verify:", error);
      showMessage("mfaLoginMessage", error.message);
    }
  });
}

// ==========================================
// NUEVOS ELEMENTOS: RECUPERACIÓN, COLA Y ADJUNTOS
// ==========================================

const recoveryForm = document.getElementById("recoveryForm");
const attachmentForm = document.getElementById("attachmentForm");
const btnPauseWorker = document.getElementById("btnPauseWorker");
const btnResumeWorker = document.getElementById("btnResumeWorker");
const btnRefreshQueue = document.getElementById("btnRefreshQueue");
const queueTableBody = document.getElementById("queueTableBody");
const workerStatusText = document.getElementById("workerStatusText");

// 5. Recuperación de cuenta por token
if (recoveryForm) {
  recoveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("recoveryEmail").value;
    showMessage("recoveryMessage", "Enviando solicitud...");

    try {
      const data = await request("/api/auth/recovery/request", {
        method: "POST",
        body: JSON.stringify({ email })
      });

      showMessage("recoveryMessage", data.message);
      // Actualizar vista de cola para ver la tarea de recuperación creada
      refreshQueue();
    } catch (error) {
      console.error("Error al solicitar recuperación:", error);
      showMessage("recoveryMessage", error.message);
    }
  });
}

// 6 & 7. Cola Interna y Worker
async function refreshQueue() {
  try {
    const response = await fetch("/api/worker/status");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al obtener estado del worker");
    }

    // Mostrar estado del worker
    const status = data.worker;
    const summary = data.summary;
    workerStatusText.textContent = `${status.paused ? "⏸ Pausado" : "▶ Ejecutándose"} (Intervalo: ${status.pollIntervalMs / 1000}s) | Tareas: PENDING: ${summary.PENDING}, PROCESSING: ${summary.PROCESSING}, SENT: ${summary.SENT}, FAILED: ${summary.FAILED}`;
    
    // Listar tareas
    queueTableBody.innerHTML = "";
    if (data.tasks.length === 0) {
      queueTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 15px;">No hay tareas en la cola</td></tr>`;
      return;
    }

    data.tasks.forEach((task) => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid #e2e8f0";
      
      // Mask token if type is PASSWORD_RECOVERY
      let displayMessage = task.message;
      
      let statusColor = "#64748b"; // default pending
      if (task.status === "PROCESSING") statusColor = "#3b82f6";
      if (task.status === "SENT") statusColor = "#10b981";
      if (task.status === "FAILED") statusColor = "#ef4444";

      tr.innerHTML = `
        <td style="padding: 8px;">
          <strong>${task.type}</strong><br>
          <span style="font-size: 0.8em; color: #64748b; font-family: monospace;">${task.id}</span>
        </td>
        <td style="padding: 8px;">${task.recipient}</td>
        <td style="padding: 8px;"><span style="color: ${statusColor}; font-weight: bold;">${task.status}</span></td>
        <td style="padding: 8px; text-align: center;">${task.attempts}</td>
        <td style="padding: 8px; color: #ef4444; font-size: 0.85em; max-width: 200px; word-wrap: break-word;">${task.error || "-"}</td>
      `;
      queueTableBody.appendChild(tr);
    });

  } catch (error) {
    console.error("Error al refrescar cola:", error);
    workerStatusText.textContent = "Error al conectar con la API del Worker";
  }
}

if (btnPauseWorker) {
  btnPauseWorker.addEventListener("click", async () => {
    try {
      await request("/api/worker/pause", { method: "POST" });
      refreshQueue();
    } catch (error) {
      alert("Error al pausar: " + error.message);
    }
  });
}

if (btnResumeWorker) {
  btnResumeWorker.addEventListener("click", async () => {
    try {
      await request("/api/worker/resume", { method: "POST" });
      refreshQueue();
    } catch (error) {
      alert("Error al reanudar: " + error.message);
    }
  });
}

if (btnRefreshQueue) {
  btnRefreshQueue.addEventListener("click", refreshQueue);
}

// Cargar la cola inicialmente y refrescar cada 3 segundos automáticamente
if (queueTableBody) {
  refreshQueue();
  setInterval(refreshQueue, 3000);
}

// 8. Envío de correos con archivos adjuntos
if (attachmentForm) {
  attachmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const resultElement = document.getElementById("attachmentMessageResult");
    resultElement.textContent = "Validando y subiendo archivo...";
    resultElement.style.color = "#3b82f6";

    const to = document.getElementById("attachEmail").value;
    const subject = document.getElementById("attachSubject").value;
    const title = document.getElementById("attachTitle").value;
    const message = document.getElementById("attachMessage").value;
    const fileInput = document.getElementById("attachFile");

    if (fileInput.files.length === 0) {
      resultElement.textContent = "Por favor, seleccione un archivo.";
      resultElement.style.color = "#ef4444";
      return;
    }

    const file = fileInput.files[0];

    // Validación preliminar en JS por conveniencia (la validación real ocurre en el servidor)
    if (file.size > 20 * 1024 * 1024) {
      resultElement.textContent = "El archivo supera el tamaño máximo permitido de 20 MB.";
      resultElement.style.color = "#ef4444";
      return;
    }

    const formData = new FormData();
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("title", title);
    formData.append("message", message);
    formData.append("file", file);

    try {
      const response = await fetch("/api/notifications/send-attachment", {
        method: "POST",
        body: formData
        // NOTA: fetch configura el Content-Type multipart/form-data automáticamente con el boundary correcto
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "La solicitud no pudo completarse.");
      }

      resultElement.textContent = data.message;
      resultElement.style.color = "#10b981";
      attachmentForm.reset();
      refreshQueue();
    } catch (error) {
      console.error("Error al enviar adjunto:", error);
      resultElement.textContent = error.message;
      resultElement.style.color = "#ef4444";
    }
  });
}
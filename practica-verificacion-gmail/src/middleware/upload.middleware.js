const multer = require("multer");
const AppError = require("../utils/app-error");

/** Tamaño máximo permitido: 20 MB */
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

/** Tipos MIME permitidos */
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",       // .xlsx
  "image/png",
  "image/jpeg"
]);

const ALLOWED_EXTENSIONS_LABEL = "PDF, DOCX, PNG, JPG, XLSX";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },

  fileFilter(_req, file, callback) {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new AppError(
          `Tipo de archivo no permitido. Formatos aceptados: ${ALLOWED_EXTENSIONS_LABEL}.`,
          400
        )
      );
    }
  }
});

/**
 * Middleware de Express que gestiona el error de límite de tamaño de multer
 * y lo convierte en una respuesta JSON consistente.
 */
function handleUploadError(err, _req, res, next) {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "El archivo supera el tamaño máximo permitido de 20 MB."
    });
  }
  return next(err);
}

module.exports = { upload, handleUploadError };

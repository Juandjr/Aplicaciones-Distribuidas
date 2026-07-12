function notFoundHandler(req, res) {
  return res.status(404).json({
    message: `La ruta ${req.method} ${req.originalUrl} no existe.`
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    message:
      statusCode >= 500
        ? "Se produjo un error interno en el servidor."
        : error.message
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
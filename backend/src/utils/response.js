const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const sendError = (res, error) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error.",
    details: error.details || null,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  sendSuccess,
  sendError,
};

const cors = require("cors");

const corsMiddleware = cors({
  origin: process.env.CORS_ORIGIN?.split(",").map((item) => item.trim()) || "*",
  credentials: true,
});

module.exports = corsMiddleware;

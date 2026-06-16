require("dotenv").config();

const cors = require("cors");
const express = require("express");
const http = require("node:http");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const aiRoutes = require("./routes/aiRoutes");
const extendedRoutes = require("./routes/extendedRoutes");
const platformRoutes = require("./routes/platformRoutes");
const { createSocketServer } = require("./services/socketServer");
require("./models");

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (_request, response) => {
  response.status(200).json({
    message: "DevWatchAI Backend Running"
  });
});

app.get("/health", (_request, response) => {
  response.status(200).json({
    message: "DevWatchAI Backend Running",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/ai", aiRoutes);
app.use("/api", platformRoutes);
app.use("/api", extendedRoutes);

app.use((_request, response) => {
  response.status(404).json({
    message: "Route not found"
  });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(error.status || 500).json({
    message: error.message || "Internal server error"
  });
});

async function startServer() {
  const server = http.createServer(app);
  const io = createSocketServer(server, allowedOrigins);
  app.set("io", io);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`DevWatchAI backend running on port ${PORT}`);
  });

  const connectWithRetry = async () => {
    try {
      await connectDB();
    } catch (error) {
      console.error("Retrying MongoDB connection in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    }
  };

  connectWithRetry();

  const shutdown = async (signal) => {
    console.log(`${signal} received. Closing backend server.`);
    server.close(async () => {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start DevWatchAI backend:", error.message);
    process.exit(1);
  });
}

module.exports = app;

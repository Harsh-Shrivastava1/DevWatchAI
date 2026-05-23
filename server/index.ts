import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "http";
import { ZodError } from "zod";
import { connectToDatabase } from "./db";
import "./models";
import { router } from "./routes";
import { createRealtimeServer } from "./socket";

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://127.0.0.1:3000"
  })
);
app.use(express.json({ limit: "10mb" }));
app.use("/api", router);

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction
  ) => {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Validation error",
        issues: error.issues
      });
      return;
    }

    console.error(error);
    response.status(500).json({
      error: "Internal server error"
    });
  }
);

createRealtimeServer(server);

connectToDatabase()
  .catch((error) => {
    console.warn("MongoDB connection skipped or failed:", error);
  })
  .finally(() => {
    server.listen(port, "127.0.0.1", () => {
      console.log(`DevWatch AI API running on http://127.0.0.1:${port}`);
    });
  });

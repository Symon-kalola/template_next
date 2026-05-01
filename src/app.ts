import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/error.middleware";
import apiRoutes from "./routes";

const app = express();

const whitelist = env.CORS_WHITELIST.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server requests (no origin) and whitelisted origins
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => res.json({ success: true, message: "Server is healthy" }));

app.use("/api/v1", apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

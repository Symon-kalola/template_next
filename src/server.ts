import app from "./app";
import { env } from "./config/env";
import { pool } from "./db";

const start = async () => {
  await pool.connect();
  console.log("Database connected");

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

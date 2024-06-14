import cors from "cors";
import express from "express";
import morgan from "morgan";
import { serve } from "inngest/express";

import * as errorMiddlewares from "./api/middlewares/errorMiddlewares";
import responseUtilities from "./api/middlewares/responseUtilities";
import v1Router from "./api/v1/routes";
import { functions, inngest } from "./inngest";

const app = express();
const whitelist = ["http://localhost:3000"];

// Middlewares
app.use(responseUtilities);
app.use(cors({ origin: "*", exposedHeaders: ["X-API-TOKEN"] }));
app.use(express.json());
app.use(morgan("dev"));

// API routes
app.use("/api/v1", v1Router);
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
  })
);

// Error middlewares
app.use(errorMiddlewares.errorLogger);
app.use(errorMiddlewares.errorHandler);

// 404 Handler
app.use((req, res) => {
  res.error(404, "Resource not found", "UNKNOWN_ENDPOINT");
});

export default app;

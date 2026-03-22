import cors from "cors";
import express from "express";
import { ZodError } from "zod";

import { authRoutes } from "./routes/auth-routes.js";
import { AppError } from "./errors/app-error.js";
import { env } from "./lib/env.js";
import { healthRoutes } from "./routes/health-routes.js";
import { userRoutes } from "./routes/user-routes.js";

export function createApp() {
  const app = express();
  const corsOrigin =
    env.NODE_ENV === "development" ? true : (env.WEB_ORIGIN ?? false);

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/health", healthRoutes);
  app.use("/api/users", userRoutes);

  app.use((_request, response) => {
    response.status(404).json({
      message: "Route not found.",
    });
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      response.status(400).json({
        issues: error.issues,
        message: "The request payload is invalid.",
      });
      return;
    }

    if (error instanceof AppError) {
      response.status(error.statusCode).json({
        message: error.message,
      });
      return;
    }

    console.error(error);

    response.status(500).json({
      message: "Internal server error.",
    });
  });

  return app;
}

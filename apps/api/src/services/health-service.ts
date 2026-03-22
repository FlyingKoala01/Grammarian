import type { ApiHealthResponse } from "@grammarian/shared";

import { env } from "../lib/env.js";

class HealthService {
  getHealth(): ApiHealthResponse {
    return {
      appName: env.APP_NAME,
      environment: env.NODE_ENV,
      service: "api",
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      version: env.APP_VERSION,
    };
  }
}

export const healthService = new HealthService();


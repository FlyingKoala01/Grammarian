export type ApiEnvironment = "development" | "test" | "production";

export interface ApiHealthResponse {
  appName: string;
  environment: ApiEnvironment;
  service: "api";
  status: "ok";
  timestamp: string;
  uptimeSeconds: number;
  version: string;
}


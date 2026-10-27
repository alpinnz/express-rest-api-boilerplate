import type { HealthStatusResponse } from "../types/health-status.type.js";

export interface HealthServiceApi {
  getHealthStatus(): Promise<HealthStatusResponse>;
}

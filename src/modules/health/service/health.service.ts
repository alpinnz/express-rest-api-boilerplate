import type { Sequelize } from "sequelize";
import type { HealthServiceApi } from "./health-service.type.js";
import type { HealthStatusResponse } from "../types/health-status.type.js";

export class HealthService implements HealthServiceApi {
  constructor(private readonly database: Sequelize) {}

  async getHealthStatus(): Promise<HealthStatusResponse> {
    try {
      await this.database.authenticate();
      return {
        status: "ok",
        checks: { database: { status: "ok" } },
      };
    } catch {
      return {
        status: "error",
        checks: { database: { status: "error" } },
      };
    }
  }
}

import type { Request, Response } from "express";
import type { HealthServiceApi } from "../service/health-service.type.js";

export class HealthController {
  constructor(private readonly healthService: HealthServiceApi) {}

  async getHealthStatus(_request: Request, response: Response): Promise<void> {
    const healthStatus = await this.healthService.getHealthStatus();
    response.status(healthStatus.status === "ok" ? 200 : 503).json(healthStatus);
  }
}

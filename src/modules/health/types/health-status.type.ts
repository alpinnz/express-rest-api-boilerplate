export type HealthComponentStatus = "ok" | "error";

export type HealthStatusResponse = {
  status: HealthComponentStatus;
  checks: {
    database: { status: HealthComponentStatus };
  };
};

export abstract class ValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly issueCode: string,
  ) {
    super(issueCode);
    this.name = "ValidationError";
  }
}

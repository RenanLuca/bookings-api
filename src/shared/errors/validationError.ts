import { BaseError } from "./base-error.js";

export class ValidationError extends BaseError {
    readonly statusCode = 400;
    readonly code = "VALIDATION_ERROR";
  
    constructor() {
      super("Os dados enviados são inválidos. Revise e tente novamente.");
    }
  }
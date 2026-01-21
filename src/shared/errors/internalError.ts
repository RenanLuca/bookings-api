import { BaseError } from "./base-error.js";

export class InternalError extends BaseError {
    readonly statusCode = 500;
    readonly code = "INTERNAL_SERVER_ERROR";
  
    constructor() {
      super("Erro interno do servidor. Tente novamente mais tarde.");
    }
  }
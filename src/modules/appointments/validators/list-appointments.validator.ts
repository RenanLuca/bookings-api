import { query } from "express-validator";
import { paginationQuery } from "../../../shared/validators/common.validators.js";

export const listAppointmentsValidator = [
  ...paginationQuery,
  query("from")
    .optional()
    .isISO8601()
    .withMessage("Data inicial deve estar no formato ISO 8601"),
  query("to")
    .optional()
    .isISO8601()
    .withMessage("Data final deve estar no formato ISO 8601")
];

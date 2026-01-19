import { query } from "express-validator";
import { paginationQuery } from "../../../shared/validators/common.validators.js";

export const listAppointmentsValidator = [
  ...paginationQuery,
  query("from")
    .optional({ checkFalsy: true })
    .isISO8601()
    .trim()
    .withMessage("Data inicial deve estar no formato ISO 8601"),
  query("to")
    .optional({ checkFalsy: true })
    .isISO8601()
    .trim()
    .withMessage("Data final deve estar no formato ISO 8601"),
  query("search")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
];

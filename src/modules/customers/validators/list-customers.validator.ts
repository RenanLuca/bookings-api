import { query } from "express-validator";
import {
  nameFilterQuery,
  paginationQuery
} from "../../../shared/validators/common.validators.js";

export const listCustomersValidator = [
  ...paginationQuery,
  nameFilterQuery,
  query("from")
    .optional({ checkFalsy: true })
    .isISO8601()
    .trim()
    .withMessage("Data inicial deve estar no formato ISO 8601"),
  query("to")
    .optional({ checkFalsy: true })
    .isISO8601()
    .trim()
    .withMessage("Data final deve estar no formato ISO 8601")
];

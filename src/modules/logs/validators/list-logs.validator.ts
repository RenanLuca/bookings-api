import { query } from "express-validator";
import { paginationQuery } from "../../../shared/validators/common.validators.js";

export const listLogsValidator = [
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
    .trim(),
  query("module")
    .optional({ checkFalsy: true })
    .isIn(["ACCOUNT", "APPOINTMENT"])
    .withMessage("Módulo deve ser 'ACCOUNT' ou 'APPOINTMENT'"),
  query("userId")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("Usuário deve ser um número inteiro positivo")
    .toInt()
];


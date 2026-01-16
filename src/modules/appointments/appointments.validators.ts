import { body, query } from "express-validator";
import { idParam, paginationQuery } from "../../shared/validators/common.validators.js";

export const createAppointmentValidator = [
  body("roomId")
    .notEmpty()
    .withMessage("ID da sala é obrigatório")
    .isInt({ min: 1 })
    .withMessage("ID da sala deve ser um número inteiro positivo"),
  body("scheduledAt")
    .notEmpty()
    .withMessage("Data do agendamento é obrigatória")
    .isISO8601()
    .withMessage("Data do agendamento deve estar no formato ISO 8601")
];

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

export const appointmentIdValidator = [idParam];

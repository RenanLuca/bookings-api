import { body } from "express-validator";

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

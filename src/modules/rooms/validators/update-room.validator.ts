import { body } from "express-validator";
import { idParam } from "../../../shared/validators/common.validators.js";

export const updateRoomValidator = [
  idParam,
  body("name")
    .optional()
    .isString()
    .withMessage("Nome deve ser uma string")
    .trim(),
  body("startTime")
    .optional()
    .isString()
    .withMessage("Horário de início deve ser uma string"),
  body("endTime")
    .optional()
    .isString()
    .withMessage("Horário de término deve ser uma string"),
  body("slotDurationMinutes")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duração do slot deve ser um número inteiro positivo")
];

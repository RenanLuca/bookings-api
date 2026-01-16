import { body } from "express-validator";

export const createRoomValidator = [
  body("name")
    .notEmpty()
    .withMessage("Nome é obrigatório")
    .isString()
    .withMessage("Nome deve ser uma string")
    .trim(),
  body("startTime")
    .notEmpty()
    .withMessage("Horário de início é obrigatório")
    .isString()
    .withMessage("Horário de início deve ser uma string"),
  body("endTime")
    .notEmpty()
    .withMessage("Horário de término é obrigatório")
    .isString()
    .withMessage("Horário de término deve ser uma string"),
  body("slotDurationMinutes")
    .notEmpty()
    .withMessage("Duração do slot é obrigatória")
    .isInt({ min: 1 })
    .withMessage("Duração do slot deve ser um número inteiro positivo")
];

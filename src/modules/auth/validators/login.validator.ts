import { body } from "express-validator";

export const loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("E-mail é obrigatório")
    .isEmail()
    .withMessage("E-mail deve ter um formato válido")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Senha é obrigatória")
];

import { body } from "express-validator";

export const registerCustomerValidator = [
  body("name")
    .notEmpty()
    .withMessage("Nome é obrigatório")
    .isString()
    .withMessage("Nome deve ser uma string")
    .trim(),
  body("email")
    .notEmpty()
    .withMessage("E-mail é obrigatório")
    .isEmail()
    .withMessage("E-mail deve ter um formato válido")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Senha é obrigatória")
    .isString()
    .withMessage("Senha deve ser uma string"),
  body("customer")
    .optional()
    .isObject()
    .withMessage("Dados do cliente devem ser um objeto")
];

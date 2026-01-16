import { body } from "express-validator";

export const updateMeValidator = [
  body("user.name")
    .optional()
    .isString()
    .withMessage("Nome deve ser uma string")
    .trim()
    .notEmpty()
    .withMessage("Nome não pode ser vazio"),
  body("user.email")
    .optional()
    .isEmail()
    .withMessage("E-mail deve ter um formato válido")
    .normalizeEmail(),
  body("user.password")
    .optional()
    .isString()
    .withMessage("Senha deve ser uma string")
    .notEmpty()
    .withMessage("Senha não pode ser vazia"),
  body("customer.zipCode")
    .optional()
    .isString()
    .withMessage("CEP deve ser uma string")
    .trim(),
  body("customer.street")
    .optional()
    .isString()
    .withMessage("Rua deve ser uma string")
    .trim(),
  body("customer.number")
    .optional()
    .isString()
    .withMessage("Número deve ser uma string")
    .trim(),
  body("customer.neighborhood")
    .optional()
    .isString()
    .withMessage("Bairro deve ser uma string")
    .trim(),
  body("customer.city")
    .optional()
    .isString()
    .withMessage("Cidade deve ser uma string")
    .trim(),
  body("customer.state")
    .optional()
    .isString()
    .withMessage("Estado deve ser uma string")
    .trim(),
  body("customer.complement")
    .optional({ values: "null" })
    .isString()
    .withMessage("Complemento deve ser uma string ou null")
    .trim()
];

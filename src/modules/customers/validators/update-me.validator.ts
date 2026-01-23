import { body } from "express-validator";

export const updateMeValidator = [

  body("user.name")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Nome deve ser uma string")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Nome não pode ser vazio"),

  body("user.email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("E-mail deve ter um formato válido")
    .normalizeEmail(),

  body("user.password")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Senha deve ser uma string")
    .isLength({ min: 6 })
    .withMessage("Senha deve ter no mínimo 6 caracteres"),

  body("customer.zipCode")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("CEP deve ser uma string")
    .trim()
    .isLength({ min: 1 })
    .withMessage("CEP não pode ser vazio"),

  body("customer.street")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Rua deve ser uma string")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Rua não pode ser vazia"),

  body("customer.number")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Número deve ser uma string")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Número não pode ser vazio"),

  body("customer.neighborhood")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Bairro deve ser uma string")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Bairro não pode ser vazio"),

  body("customer.city")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Cidade deve ser uma string")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Cidade não pode ser vazia"),

  body("customer.state")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Estado deve ser uma string")
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage("Estado deve ter 2 caracteres (UF)"),

  body("customer.complement")
    .optional({ values: "null" })
    .isString()
    .withMessage("Complemento deve ser uma string")
    .trim()
];
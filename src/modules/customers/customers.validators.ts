import { body } from "express-validator";
import {
  idParam,
  nameFilterQuery,
  paginationQuery
} from "../../shared/validators/common.validators.js";
import { PERMISSION_MODULES } from "../../shared/permissions/modules.js";

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

export const listCustomersValidator = [...paginationQuery, nameFilterQuery];

export const customerIdValidator = [idParam];

export const updatePermissionsValidator = [
  idParam,
  body("modules")
    .isArray({ min: 1 })
    .withMessage("Módulos deve ser um array não vazio"),
  body("modules.*.module")
    .notEmpty()
    .withMessage("Módulo é obrigatório")
    .isIn(PERMISSION_MODULES)
    .withMessage(`Módulo deve ser um dos seguintes: ${PERMISSION_MODULES.join(", ")}`),
  body("modules.*.canView")
    .isBoolean()
    .withMessage("canView deve ser um valor booleano")
];

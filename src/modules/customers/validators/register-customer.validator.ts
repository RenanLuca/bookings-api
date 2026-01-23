import { body } from "express-validator";

export const registerCustomerValidator = [

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Nome é obrigatório")
    .isString()
    .withMessage("Nome deve ser uma string")
    .isLength({ min: 3 })
    .withMessage("Nome deve ter no mínimo 3 caracteres"),
    
  body("email")
    .trim()
    .notEmpty()
    .withMessage("E-mail é obrigatório")
    .isEmail()
    .withMessage("E-mail deve ter um formato válido")
    .normalizeEmail(),
    
  body("password")
    .notEmpty()
    .withMessage("Senha é obrigatória")
    .isString()
    .withMessage("Senha deve ser uma string")
    .isLength({ min: 6 })
    .withMessage("Senha deve ter no mínimo 6 caracteres"),


  body("customer")
    .isObject()
    .withMessage("Dados do cliente devem ser um objeto"),


  body("customer.zipCode")
    .trim()
    .notEmpty()
    .withMessage("CEP é obrigatório")
    .isString()
    .withMessage("CEP deve ser uma string")
    .matches(/^\d{5}-?\d{3}$/)
    .withMessage("CEP deve ter formato válido (00000-000)"),
    
  body("customer.street")
    .trim()
    .notEmpty()
    .withMessage("Rua é obrigatória")
    .isString()
    .withMessage("Rua deve ser uma string"),
    
  body("customer.number")
    .trim()
    .notEmpty()
    .withMessage("Número é obrigatório")
    .isString()
    .withMessage("Número deve ser uma string"),
    
  body("customer.neighborhood")
    .trim()
    .notEmpty()
    .withMessage("Bairro é obrigatório")
    .isString()
    .withMessage("Bairro deve ser uma string"),
    
  body("customer.city")
    .trim()
    .notEmpty()
    .withMessage("Cidade é obrigatória")
    .isString()
    .withMessage("Cidade deve ser uma string"),
    
  body("customer.state")
    .trim()
    .notEmpty()
    .withMessage("Estado é obrigatório")
    .isString()
    .withMessage("Estado deve ser uma string")
    .isLength({ min: 2, max: 2 })
    .withMessage("Estado deve ter 2 caracteres (UF)")
    .toUpperCase(), 
  body("customer.complement")
    .optional({ values: "null" })
    .isString()
    .withMessage("Complemento deve ser uma string")
    .trim()
];
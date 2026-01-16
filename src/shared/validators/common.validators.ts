import { param, query } from "express-validator";

export const idParam = param("id")
  .isInt({ min: 1 })
  .withMessage("ID deve ser um número inteiro positivo")
  .toInt();

export const paginationQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Página deve ser um número inteiro positivo")
    .toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Tamanho da página deve ser um número inteiro positivo")
    .toInt(),
  query("sort")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Ordenação deve ser 'asc' ou 'desc'")
];

export const nameFilterQuery = query("name")
  .optional()
  .isString()
  .trim();

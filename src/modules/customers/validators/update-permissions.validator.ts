import { body } from "express-validator";
import { idParam } from "../../../shared/validators/common.validators.js";
import { PERMISSION_MODULES } from "../../../shared/permissions/modules.js";

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

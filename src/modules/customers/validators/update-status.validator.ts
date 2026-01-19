import { body } from "express-validator";
import { idParam } from "../../../shared/validators/common.validators.js";
import { USER_STATUSES } from "../../../models/user.model.js";

export const updateStatusValidator = [
  idParam,
  body("status")
    .notEmpty()
    .withMessage("Status é obrigatório")
    .isIn(USER_STATUSES)
    .withMessage(`Status deve ser um dos seguintes: ${USER_STATUSES.join(", ")}`)
];


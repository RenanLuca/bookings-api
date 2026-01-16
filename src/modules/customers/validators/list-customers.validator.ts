import {
  nameFilterQuery,
  paginationQuery
} from "../../../shared/validators/common.validators.js";

export const listCustomersValidator = [...paginationQuery, nameFilterQuery];

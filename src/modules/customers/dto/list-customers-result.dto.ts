import type { ProfileResult } from "./profile-result.dto.js";
import type { ListCustomersMeta } from "./list-customers-meta.dto.js";

export type ListCustomersResult = {
  data: ProfileResult[];
  meta: ListCustomersMeta;
};

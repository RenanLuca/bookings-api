import type { Customer } from "../../../models/customer.model.js";
import type { User } from "../../../models/index.js";

export type UserWithCustomer = User & { Customer?: Customer | null };

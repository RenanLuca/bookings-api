import type { CustomerData } from "./customer-data.dto.js";

export type UpdateProfileInput = {
  user?: {
    name?: string;
    email?: string;
    password?: string;
  };
  customer?: Partial<CustomerData>;
};

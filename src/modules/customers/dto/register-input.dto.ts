import type { CustomerData } from "./customer-data.dto.js";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  customer?: Partial<CustomerData>;
};

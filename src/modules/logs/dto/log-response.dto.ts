import type { ActivityLogModule } from "../../../models/activity-log.model.js";
import type { UserRole } from "../../../models/user.model.js";

export type LogResponseUser = {
  id: number;
  name: string;
  role: UserRole;
};

export type LogResponse = {
  id: number;
  module: ActivityLogModule;
  activityType: string;
  description: string;
  createdAt: string;
  user?: LogResponseUser;
};

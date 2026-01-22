import type { ActivityLog } from "../../../models/activity-log.model.js";
import type { UserRole } from "../../../models/user.model.js";

export type ActivityLogWithUser = ActivityLog & {
  User?: { id: number; name: string; role: UserRole } | null;
};

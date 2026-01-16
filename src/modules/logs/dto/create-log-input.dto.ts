import type { ActivityLogModule } from "../../../models/activity-log.model.js";

export type CreateLogInput = {
  userId: number | null;
  module: ActivityLogModule;
  activityType: string;
  description: string;
};

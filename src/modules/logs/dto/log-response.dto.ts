import type { ActivityLogModule } from "../../../models/activity-log.model.js";

export type LogResponse = {
  id: number;
  module: ActivityLogModule;
  activityType: string;
  description: string;
  createdAt: string;
};

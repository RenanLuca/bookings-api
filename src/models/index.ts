import { User } from "./user.model.js";
import { Customer } from "./customer.model.js";
import { Room } from "./room.model.js";
import { Appointment } from "./appointment.model.js";
import { ActivityLog } from "./activity-log.model.js";
import { AuthToken } from "./auth-token.model.js";
import { CustomerModulePermission } from "./customer-module-permission.model.js";

User.hasOne(Customer, { foreignKey: "userId" });
Customer.belongsTo(User, { foreignKey: "userId" });
Customer.hasMany(Appointment, { foreignKey: "customerId" });
Appointment.belongsTo(Customer, { foreignKey: "customerId" });
Room.hasMany(Appointment, { foreignKey: "roomId" });
Appointment.belongsTo(Room, { foreignKey: "roomId" });
User.hasMany(ActivityLog, { foreignKey: "userId" });
ActivityLog.belongsTo(User, { foreignKey: "userId" });
User.hasMany(AuthToken, { foreignKey: "userId" });
AuthToken.belongsTo(User, { foreignKey: "userId" });
Customer.hasMany(CustomerModulePermission, { foreignKey: "customerId" });
CustomerModulePermission.belongsTo(Customer, { foreignKey: "customerId" });

export {
  User,
  Customer,
  Room,
  Appointment,
  ActivityLog,
  AuthToken,
  CustomerModulePermission
};

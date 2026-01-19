import { Sequelize } from "sequelize";
import { env } from "./env.js";

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.pass, {
  host: env.db.host,
  port: env.db.port,
  dialect: "mysql",
  logging: env.nodeEnv === "development" ? console.log : false
});

export { sequelize };

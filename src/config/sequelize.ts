import { Sequelize } from "sequelize";
import { env } from "./env.js";
import "mysql2";

console.log('[SEQUELIZE] Configurando conexão com banco de dados...');
console.log('[SEQUELIZE] Host:', env.db.host);
console.log('[SEQUELIZE] Database:', env.db.name);
console.log('[SEQUELIZE] User:', env.db.user);

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.pass, {
  host: env.db.host,
  port: env.db.port,
  dialect: "mysql",
  logging: (msg) => console.log('[SEQUELIZE]', msg)
});

export { sequelize };

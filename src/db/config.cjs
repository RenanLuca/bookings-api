require("dotenv/config");

console.log("[DB DEBUG]", {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  HAS_PASS: Boolean(process.env.DB_PASS),
  NODE_ENV: process.env.NODE_ENV,
});


const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  dialect: "mysql",
  logging: console.log
};

module.exports = {
  development: { ...baseConfig },
  test: {
    ...baseConfig,
    database: process.env.DB_NAME_TEST || "bookings_db_test"
  },
  production: {
    ...baseConfig,
    logging: console.log
  }
};

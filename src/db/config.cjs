require("dotenv/config");

const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  dialect: "mysql",
  logging: process.env.NODE_ENV === "development" ? console.log : false
};

module.exports = {
  development: { ...baseConfig },
  test: {
    ...baseConfig,
    database: process.env.DB_NAME_TEST || "bookings_db_test"
  },
  production: {
    ...baseConfig,
    logging: false
  }
};

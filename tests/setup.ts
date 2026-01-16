process.env.NODE_ENV = "test";
process.env.DB_NAME = "bookings_test";
process.env.JWT_SECRET = "test-secret-key-for-testing";
process.env.JWT_EXPIRES_IN = "1d";

import "../src/models/index.js";

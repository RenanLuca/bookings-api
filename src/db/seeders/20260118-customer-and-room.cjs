const bcrypt = require("bcryptjs");

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    const now = new Date();

    await queryInterface.bulkInsert("users", [
      {
        name: "Admin Customer",
        email: "admin@bookings2.com",
        passwordHash,
        role: "CUSTOMER",
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now
      }
    ]);

    await queryInterface.bulkInsert("rooms", [
      {
        name: "Sala padrão",
        startTime: "08:00:00",
        endTime: "18:00:00",
        slotDurationMinutes: 30,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("rooms", { name: "Sala padrão" });
    await queryInterface.bulkDelete("users", { email: "admin@bookings2.com" });
  }
};


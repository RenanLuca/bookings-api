const bcrypt = require("bcryptjs");

module.exports = {
    async up(queryInterface) {
        const passwordHash = await bcrypt.hash("admin123", 10);
        await queryInterface.bulkInsert("users", [
            {
                name: "Administrador",
                email: "admin@bookings.com",
                passwordHash,
                role: "ADMIN",
                status: "ACTIVE",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("users", { email: "admin@bookings.com" });
    }
};

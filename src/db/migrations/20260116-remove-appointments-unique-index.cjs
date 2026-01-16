module.exports = {
  async up(queryInterface) {

    await queryInterface.addIndex("appointments", {
      fields: ["roomId"],
      name: "appointments_room_id_idx"
    });

    await queryInterface.removeIndex(
      "appointments",
      "appointments_room_scheduled_at_unique"
    );
  },

  async down(queryInterface) {
    await queryInterface.addIndex("appointments", {
      unique: true,
      fields: ["roomId", "scheduledAt"],
      name: "appointments_room_scheduled_at_unique"
    });

    try {
      await queryInterface.removeIndex(
        "appointments",
        "appointments_room_id_idx"
      );
    } catch (error) {
      // Index may not exist
    }
  }
};

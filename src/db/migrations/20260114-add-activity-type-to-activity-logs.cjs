const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn("activity_logs", "activityType", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "General",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("activity_logs", "activityType");
  },
};

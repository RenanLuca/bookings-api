const { DataTypes, Sequelize } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable("customer_module_permissions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED
      },
      customerId: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
        references: {
          model: "customers",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      module: {
        allowNull: false,
        type: DataTypes.STRING(50)
      },
      canView: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.fn("NOW")
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.fn("NOW")
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE
      }
    });

    await queryInterface.addIndex("customer_module_permissions", {
      fields: ["customerId", "module"],
      unique: true,
      where: { deletedAt: null },
      name: "customer_module_permissions_unique"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("customer_module_permissions");
  }
};

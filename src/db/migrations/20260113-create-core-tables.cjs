const { DataTypes, Sequelize } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable("users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING(255)
      },
      email: {
        allowNull: false,
        type: DataTypes.STRING(255),
        unique: true
      },
      passwordHash: {
        allowNull: false,
        type: DataTypes.STRING(255)
      },
      role: {
        allowNull: false,
        type: DataTypes.ENUM("ADMIN", "CUSTOMER"),
        defaultValue: "CUSTOMER"
      },
      status: {
        allowNull: false,
        type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
        defaultValue: "ACTIVE"
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

    await queryInterface.createTable("customers", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED
      },
      userId: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
        references: {
          model: "users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        unique: true
      },
      zipCode: {
        allowNull: false,
        type: DataTypes.STRING(20)
      },
      street: {
        allowNull: false,
        type: DataTypes.STRING(255)
      },
      number: {
        allowNull: false,
        type: DataTypes.STRING(20)
      },
      complement: {
        allowNull: true,
        type: DataTypes.STRING(255)
      },
      neighborhood: {
        allowNull: false,
        type: DataTypes.STRING(255)
      },
      city: {
        allowNull: false,
        type: DataTypes.STRING(255)
      },
      state: {
        allowNull: false,
        type: DataTypes.STRING(100)
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

    await queryInterface.createTable("rooms", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING(255)
      },
      startTime: {
        allowNull: false,
        type: DataTypes.TIME
      },
      endTime: {
        allowNull: false,
        type: DataTypes.TIME
      },
      slotDurationMinutes: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED
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

    await queryInterface.createTable(
      "appointments",
      {
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
        roomId: {
          allowNull: false,
          type: DataTypes.BIGINT.UNSIGNED,
          references: {
            model: "rooms",
            key: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        scheduledDate: {
          allowNull: false,
          type: DataTypes.DATEONLY
        },
        scheduledTime: {
          allowNull: false,
          type: DataTypes.TIME
        },
        status: {
          allowNull: false,
          type: DataTypes.ENUM("PENDING", "SCHEDULED", "CANCELED"),
          defaultValue: "PENDING"
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
      },
      {
        indexes: [
          {
            unique: true,
            fields: ["roomId", "scheduledDate", "scheduledTime"],
            name: "appointments_room_schedule_unique"
          }
        ]
      }
    );

    await queryInterface.createTable("activity_logs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED
      },
      userId: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
        references: {
          model: "users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      module: {
        allowNull: false,
        type: DataTypes.ENUM("ACCOUNT", "APPOINTMENT")
      },
      description: {
        allowNull: false,
        type: DataTypes.TEXT
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

    await queryInterface.createTable("auth_tokens", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED
      },
      userId: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
        references: {
          model: "users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      token: {
        allowNull: false,
        type: DataTypes.TEXT
      },
      expiresAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      revokedAt: {
        allowNull: true,
        type: DataTypes.DATE
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

    await queryInterface.sequelize.query(
      "ALTER TABLE rooms ADD CONSTRAINT rooms_start_before_end CHECK (startTime < endTime);"
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("auth_tokens");
    await queryInterface.dropTable("activity_logs");
    await queryInterface.dropTable("appointments");
    await queryInterface.dropTable("rooms");
    await queryInterface.dropTable("customers");
    await queryInterface.dropTable("users");
  }
};

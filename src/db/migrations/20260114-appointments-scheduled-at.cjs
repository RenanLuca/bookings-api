const { DataTypes, QueryTypes } = require("sequelize");
const { fromZonedTime, formatInTimeZone } = require("date-fns-tz");

const APP_TZ = "America/Sao_Paulo";

const hasColumn = async (queryInterface, table, column) => {
  const definition = await queryInterface.describeTable(table);
  return Boolean(definition[column]);
};

const buildUtcFromLegacy = (date, time) => {
  if (!date || !time) {
    return null;
  }
  const iso = `${date}T${time}`;
  return fromZonedTime(iso, APP_TZ);
};

const buildLegacyFromUtc = (date) => {
  if (!date) {
    return { scheduledDate: null, scheduledTime: null };
  }
  const scheduledDate = formatInTimeZone(date, APP_TZ, "yyyy-MM-dd");
  const scheduledTime = formatInTimeZone(date, APP_TZ, "HH:mm:ss");
  return { scheduledDate, scheduledTime };
};

module.exports = {
  async up(queryInterface) {
    const hasScheduledAt = await hasColumn(
      queryInterface,
      "appointments",
      "scheduledAt"
    );
    if (!hasScheduledAt) {
      await queryInterface.addColumn("appointments", "scheduledAt", {
        type: DataTypes.DATE,
        allowNull: true
      });
    }

    const appointments = await queryInterface.sequelize.query(
      "SELECT id, scheduledDate, scheduledTime FROM appointments",
      { type: QueryTypes.SELECT }
    );

    for (const appointment of appointments) {
      const scheduledAt = buildUtcFromLegacy(
        appointment.scheduledDate,
        appointment.scheduledTime
      );
      await queryInterface.bulkUpdate(
        "appointments",
        { scheduledAt },
        { id: appointment.id }
      );
    }

    await queryInterface.changeColumn("appointments", "scheduledAt", {
      type: DataTypes.DATE,
      allowNull: false
    });

    try {
      await queryInterface.removeIndex(
        "appointments",
        "appointments_room_schedule_unique"
      );
    } catch (error) {
      // índice antigo pode não existir em bancos vazios
    }

    await queryInterface.addIndex("appointments", {
      unique: true,
      fields: ["roomId", "scheduledAt"],
      name: "appointments_room_scheduled_at_unique"
    });

    const hasScheduledDate = await hasColumn(
      queryInterface,
      "appointments",
      "scheduledDate"
    );
    if (hasScheduledDate) {
      await queryInterface.removeColumn("appointments", "scheduledDate");
    }
    const hasScheduledTime = await hasColumn(
      queryInterface,
      "appointments",
      "scheduledTime"
    );
    if (hasScheduledTime) {
      await queryInterface.removeColumn("appointments", "scheduledTime");
    }
  },

  async down(queryInterface) {
    const hasScheduledDate = await hasColumn(
      queryInterface,
      "appointments",
      "scheduledDate"
    );
    if (!hasScheduledDate) {
      await queryInterface.addColumn("appointments", "scheduledDate", {
        type: DataTypes.DATEONLY,
        allowNull: true
      });
    }
    const hasScheduledTime = await hasColumn(
      queryInterface,
      "appointments",
      "scheduledTime"
    );
    if (!hasScheduledTime) {
      await queryInterface.addColumn("appointments", "scheduledTime", {
        type: DataTypes.TIME,
        allowNull: true
      });
    }

    const appointments = await queryInterface.sequelize.query(
      "SELECT id, scheduledAt FROM appointments",
      { type: QueryTypes.SELECT }
    );

    for (const appointment of appointments) {
      const { scheduledDate, scheduledTime } = buildLegacyFromUtc(
        appointment.scheduledAt
      );
      await queryInterface.bulkUpdate(
        "appointments",
        { scheduledDate, scheduledTime },
        { id: appointment.id }
      );
    }

    await queryInterface.changeColumn("appointments", "scheduledDate", {
      type: DataTypes.DATEONLY,
      allowNull: false
    });
    await queryInterface.changeColumn("appointments", "scheduledTime", {
      type: DataTypes.TIME,
      allowNull: false
    });

    try {
      await queryInterface.removeIndex(
        "appointments",
        "appointments_room_scheduled_at_unique"
      );
    } catch (error) {
      // índice novo pode não existir se migration falhou antes
    }

    await queryInterface.addIndex("appointments", {
      unique: true,
      fields: ["roomId", "scheduledDate", "scheduledTime"],
      name: "appointments_room_schedule_unique"
    });

    const hasScheduledAt = await hasColumn(
      queryInterface,
      "appointments",
      "scheduledAt"
    );
    if (hasScheduledAt) {
      await queryInterface.removeColumn("appointments", "scheduledAt");
    }
  }
};

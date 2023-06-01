"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Meeting extends Model {
    static associate({ Image, User }) {
      this.hasMany(Image);
      this.belongsTo(User, {
        foreignKey: "user_coordinator_fk",
        as: "coordinator",
      });

      this.belongsToMany(User, {
        through: {
          model: "Participant",
          unique: false,
        },
        as: "participants",
        foreignKey: "meeting_fk",
        otherKey: "user_fk",
      });
    }
  }
  Meeting.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
          isDateAfterOrEqualToday(value) {
            const today = new Date();
            const inputDate = new Date(value);
            if (inputDate < today)
              throw new Error("Date should be today or in the future");
          },
        },
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "start_time",
        validate: {
          isDate: true,
          isDateAfterOrEqualToday(value) {
            const inputDate = new Date(value);
            if (inputDate < this.date)
              throw new Error("Date should be today or in the future");
          },
        },
      },
      endTime: {
        type: DataTypes.DATE,
        field: "end_time",
        validate: {
          isDate: true,
          isAfter: {
            args: this.startTime?.toString(),
            msg: "The end time of the meeting must be after the start time.",
          },
        },
      },
      place: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      notes: DataTypes.STRING,
      coordinatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_coordinator_fk",
      },
    },
    {
      sequelize,
      modelName: "Meeting",
      tableName: "meetings",
      timestamps: false,
      name: { singular: "meeting", plural: "meetings" },
    }
  );
  return Meeting;
};

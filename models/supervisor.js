"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Supervisor extends Model {
    static associate(models) {
      // define association here
    }
  }
  Supervisor.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      activityId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Activity", // 'Movies' would also work
          key: "id",
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: "User", // 'Actors' would also work
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "Supervisor",
      tableName: "supervisors",
      timestamps: false,
    }
  );
  return Supervisor;
};

"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class School extends Model {
    static associate({ User, Activity }) {
      this.hasMany(User, { foreignKey: "school_fk" });
      this.hasMany(Activity);
    }
  }
  School.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      projectName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "project_name",
      },
    },
    {
      sequelize,
      modelName: "School",
      tableName: "schools",
      name: { singular: "school", plural: "schools" },
      timestamps: false,
    }
  );
  return School;
};

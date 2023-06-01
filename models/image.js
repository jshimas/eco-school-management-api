"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Image extends Model {
    /**
     * Helper method for defining associations.
     */
    static associate({ Meeting, Activity }) {
      this.belongsTo(Meeting);
      this.belongsTo(Activity);
    }
  }
  Image.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      filepath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cloudinaryId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      activityId: {
        type: DataTypes.INTEGER,
        field: "activity_fk",
      },
      meetingId: {
        type: DataTypes.INTEGER,
        field: "meeting_fk",
      },
    },
    {
      sequelize,
      modelName: "Image",
      tableName: "images",
      timestamps: false,
      name: { singular: "image", plural: "images" },
    }
  );
  return Image;
};

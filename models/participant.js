const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Participant extends Model {
    static associate(models) {
      // define association here
    }
  }
  Participant.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      editor: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_fk",
      },
      meetingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "meeting_fk",
      },
    },
    {
      sequelize,
      modelName: "Participant",
      tableName: "participants",
      timestamps: false,
      name: { singular: "participant", plural: "participants" },
    }
  );
  return Participant;
};

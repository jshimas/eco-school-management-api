const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Activity extends Model {
    static associate({ School, User, Image, Supervisor }) {
      this.belongsTo(School, { foreignKey: "school_fk" });
      this.belongsToMany(User, { through: Supervisor, as: "supervisors" });
      this.belongsTo(User, { foreignKey: "user_creator_fk", as: "creator" });
      this.hasMany(Image, { onDelete: "CASCADE" });
    }
  }
  Activity.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      theme: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "start_date",
        validate: {
          isDate: true,
          isDateAfterOrEqualToday(value) {
            console.log("DATE PARSING");
            console.log(value);
            console.log(new Date(value));
            console.log(this.startDate);
            console.log(new Date(this.startDate));
            if (new Date(value) === new Date(this.startDate)) return; // In DB yyyy-mm-dd hh:mm:ss, but care only about yyyy-dd-mm part
            if (new Date(value) < new Date())
              throw new Error("Date should be today or in the future");
          },
        },
      },
      endDate: {
        type: DataTypes.DATE,
        field: "end_date",
        validate: {
          isDate: true,
          isEndDateAfterOrEqualStartDate(value) {
            if (new Date(value) <= new Date(this.startDate))
              throw new Error("End date should not be before the start date");
          },
        },
      },
      approved: DataTypes.BOOLEAN,
      reason: DataTypes.STRING,
      goal: DataTypes.STRING,
      result: DataTypes.STRING,
      resources: DataTypes.STRING,
      location: DataTypes.STRING,
      notes: DataTypes.STRING,
      creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_creator_fk",
        references: {
          model: "User",
          key: "id",
        },
      },
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "school_fk",
      },
    },
    {
      sequelize,
      modelName: "Activity",
      tableName: "activities",
      timestamps: false,
      name: { singular: "activity", plural: "activities" },
    }
  );
  return Activity;
};

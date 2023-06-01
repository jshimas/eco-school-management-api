const { Model } = require("sequelize");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    async isCorrectPassword(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    }

    static associate({ Meeting, UserRole, School, Activity, Supervisor }) {
      this.belongsToMany(Activity, {
        through: Supervisor,
      });
      this.belongsToMany(Meeting, {
        through: {
          model: "Participant",
          unique: false,
        },
        as: "meetings",
        foreignKey: "user_fk",
        otherKey: "meeting_fk",
      });
      this.hasMany(Meeting, { foreignKey: "user_coordinator_fk" });
      this.belongsTo(UserRole);
      this.belongsTo(School, { foreignKey: "school_fk" });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      firstname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        isEmail: { msg: "Email is in a wrong format" },
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "role_fk",
      },
      password: {
        type: DataTypes.STRING,
        validate: {
          min: 8,
        },
      },
      schoolId: {
        type: DataTypes.INTEGER,
        field: "school_fk",
      },
    },
    {
      sequelize,
      tableName: "users",
      modelName: "User",
      timestamps: false,
      name: { singular: "user", plural: "users" },
    }
  );

  return User;
};

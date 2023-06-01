"use strict";

const bcrypt = require("bcrypt");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword1 = await bcrypt.hash("useruser", 10);
    const hashedPassword2 = await bcrypt.hash("adminadmin", 10);
    const hashedPassword3 = await bcrypt.hash("cordcord", 10);

    await queryInterface.bulkInsert("users", [
      {
        id: 1,
        firstname: "User",
        lastname: "user",
        email: "user@owly.com",
        role_fk: 1,
        password: hashedPassword1,
        school_fk: 1,
      },
      {
        id: 2,
        firstname: "Coord",
        lastname: "Doe",
        email: "coord@owly.com",
        role_fk: 2,
        password: hashedPassword2,
        school_fk: 1,
      },
      {
        id: 3,
        firstname: "Admin",
        lastname: "Doe",
        email: "admin@owly.com",
        role_fk: 3,
        password: hashedPassword3,
        school_fk: 1,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("users", null, {});
  },
};

"use strict";

const bcrypt = require("bcrypt");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash("Esmad_2223", 10);

    await queryInterface.bulkInsert("users", [
      {
        id: 1,
        firstname: "John",
        lastname: "Doe",
        email: "User@owly.com",
        role_fk: 1,
        password: hashedPassword,
        school_fk: 1,
      },
      {
        id: 2,
        firstname: "Peter",
        lastname: "Brown",
        email: "Admin@owly.com",
        role_fk: 3,
        password: hashedPassword,
        school_fk: 1,
      },
      {
        id: 3,
        firstname: "Lisa",
        lastname: "Smith",
        email: "Coordinator@owly.com",
        role_fk: 2,
        password: hashedPassword,
        school_fk: 1,
      },
      {
        id: 4,
        firstname: "Laura",
        lastname: "White",
        email: "User2@owly.com",
        role_fk: 1,
        password: hashedPassword,
        school_fk: 1,
      },
      {
        id: 5,
        firstname: "Sam",
        lastname: "Green",
        email: "User3@owly.com",
        role_fk: 1,
        password: hashedPassword,
        school_fk: 2,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("users", null, {});
  },
};

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("user_roles", [
      {
        id: 1,
        role: "member",
      },
      {
        id: 2,
        role: "coordinator",
      },
      {
        id: 3,
        role: "admin",
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("user_roles", null, {});
  },
};

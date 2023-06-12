"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("schools", [
      {
        id: 1,
        name: "Central valley middle school",
        project_name: "Clean valley",
      },
      {
        id: 2,
        name: "Northern Coastline highschool",
        project_name: "Eco-Safe coast",
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("schools", null, {});
  },
};

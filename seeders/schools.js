"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("schools", [
      {
        id: 1,
        name: "School A",
        project_name: "Project A",
      },
      {
        id: 2,
        name: "School B",
        project_name: "Project B",
      },
      {
        id: 3,
        name: "School C",
        project_name: "Project C",
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("schools", null, {});
  },
};

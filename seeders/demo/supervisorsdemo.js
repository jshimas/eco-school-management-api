"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("supervisors", [
      {
        activityId: 1,
        userId: 1,
      },
      {
        activityId: 2,
        userId: 1,
      },
      {
        activityId: 3,
        userId: 4,
      },
      {
        activityId: 4,
        userId: 2,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("supervisors", null, {});
  },
};

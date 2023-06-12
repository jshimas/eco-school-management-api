module.exports = {
  up: async (queryInterface, Sequelize) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const twoDaysAfter = new Date();
    twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);

    await queryInterface.bulkInsert(
      "activities",
      [
        {
          id: 1,
          theme: "Food waste",
          name: "Stopping food waste in school campus",
          start_date: twoDaysAgo,
          end_date: yesterday, // finished activity
          approved: true,
          user_creator_fk: 1,
          school_fk: 1,
        },
        {
          id: 2,
          theme: "Energy",
          name: "Using renewable energy sources",
          start_date: twoDaysAgo,
          end_date: tmrw, // in progress
          approved: true,
          user_creator_fk: 1,
          school_fk: 1,
        },
        {
          id: 3,
          theme: "Energy",
          name: "Research about using biofuel",
          start_date: tmrw,
          end_date: twoDaysAfter, // pending
          approved: false,
          user_creator_fk: 4,
          school_fk: 1,
        },
        {
          id: 4,
          theme: "Transportation",
          name: "Alternative and sustainable transportation solutions",
          start_date: tmrw,
          end_date: twoDaysAfter,
          approved: true, // planned
          user_creator_fk: 2,
          school_fk: 1,
        },
      ],
      { validate: false }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("activities", null, {});
  },
};

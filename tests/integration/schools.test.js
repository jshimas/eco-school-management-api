require("dotenv").config();
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../app"); // Replace with the path to your Express app
const { sequelize, Sequelize, Activity } = require("../../models"); // Assuming the app is configured properly

const runSeeder = async () => {
  const userRolesSeeder = require("../../seeders/userroles");
  const schoolsSeeder = require("../../seeders/schools");
  const usersSeeder = require("../../seeders/users");

  try {
    await userRolesSeeder.up(sequelize.getQueryInterface(), Sequelize);
    await schoolsSeeder.up(sequelize.getQueryInterface(), Sequelize);
    await usersSeeder.up(sequelize.getQueryInterface(), Sequelize);
    console.log("Seeder executed successfully.");
  } catch (error) {
    console.error("Error executing seeder:", error);
  }
};

describe("School controller", () => {
  const VALID_SCHOOL_ID = 1;
  const NOT_VALID_SCHOOL_ID = 999;
  const COORDINATOR_ID = 2;
  let access_token;
  let school_count;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await runSeeder();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    access_token = jwt.sign({ id: COORDINATOR_ID }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const dateToday = new Date();
    let dateTomorrow = new Date();
    dateTomorrow.setDate(dateToday.getDate() + 1);
    await Activity.bulkCreate([
      {
        theme: "transportation",
        name: "test1",
        location: "Vila do Conde",
        startDate: dateTomorrow,
        creatorId: COORDINATOR_ID,
        schoolId: VALID_SCHOOL_ID,
      },
      {
        theme: "energy",
        name: "test2",
        location: "test loc",
        startDate: dateTomorrow,
        creatorId: COORDINATOR_ID,
        schoolId: VALID_SCHOOL_ID,
      },
    ]);
  });

  afterEach(async () => {
    await Activity.destroy({ where: {} });
  });

  describe("GET /schools/:id", () => {
    it("should return the school data with stats when a valid school ID is provided", async () => {
      const expectedResponse = {
        school: {
          id: VALID_SCHOOL_ID,
          name: "School A",
          projectName: "Project A",
          themesQuantity: 2,
          activitiesQuantity: 2,
          studentsQuantity: 1,
          level: "beginner",
        },
      };

      const response = await request(app)
        .get(`/api/v1/schools/${VALID_SCHOOL_ID}`)
        .set("Authorization", `Bearer ${access_token}`);

      console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedResponse);
    });

    it("should return a 404 error when an invalid school ID is provided", async () => {
      const response = await request(app)
        .get(`/api/v1/schools/${NOT_VALID_SCHOOL_ID}`)
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toEqual(
        `School with ID ${NOT_VALID_SCHOOL_ID} was not found.`
      );
    });
  });

  describe("GET /api/v1/schools", () => {
    it("should return all schools with their stats", async () => {
      const response = await request(app)
        .get(`/api/v1/schools`)
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(response.body.schools).toHaveLength(3);
    });
  });
});

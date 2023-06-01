require("dotenv").config();
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../app"); // Replace with the path to your Express app
const { sequelize, Sequelize, Activity, User } = require("../../models");
const { startServer, closeServer } = require("../../utils/serverHandler");

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

describe("Create activity Controller", () => {
  beforeAll(async () => {
    await startServer();
    await sequelize.sync({ force: true });
    await runSeeder();
  });

  afterAll(async () => {
    await closeServer();
    await sequelize.close();
  });

  describe("POST /schools/:schoolId/activities", () => {
    it("should create a new activity", async () => {
      const testSchoolId = 1;
      const testUserId = 2;
      const testActivity = {
        theme: "transportation",
        name: "eletric vehicles",
        location: "Vila do Conde",
        startDate: "2023-06-03",
        supervisorsIds: [1, 2],
      };

      // Set up the request with the required properties
      const token = jwt.sign({ id: testUserId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      const response = await request(app)
        .post(`/api/v1/schools/${testSchoolId}/activities`)
        .set("Authorization", `Bearer ${token}`)
        .send(testActivity);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("URI");

      // Verify that the activity is created in the database
      const createdActivity = await Activity.findOne({
        where: { id: response.body.URI.match(/activities\/(\d+)/)[1] },
        include: [{ model: User, as: "supervisors" }],
      });

      expect(createdActivity).toBeTruthy();

      // Verify that the supervisors are associated with the activity
      expect(createdActivity.supervisors.length).toBeGreaterThan(0);
      const supervisorIds = createdActivity.supervisors.map(
        (supervisor) => supervisor.userId
      );
      expect(supervisorIds).toContain(testActivity.creatorId); // Assuming creator is also a supervisor
    });
  });
});

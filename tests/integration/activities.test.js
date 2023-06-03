require("dotenv").config();
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../app"); // Replace with the path to your Express app
const {
  sequelize,
  Sequelize,
  Activity,
  User,
  School,
} = require("../../models");

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

describe("Activity Controller", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await runSeeder();
  });

  afterAll(async () => {
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
        startDate: "2023-07-01",
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

  describe("PUT /schools/:schoolId/activities", () => {
    it("should update an activity", async () => {
      const testUserId = 2;

      const school = await School.create({
        name: "Test School",
        projectName: "Test project",
      });
      const activity = await Activity.create({
        theme: "transportation",
        name: "eletric vehicles",
        location: "Vila do Conde",
        startDate: "2023-07-01",
        schoolId: school.id,
        creatorId: testUserId,
        supervisorIds: [testUserId],
      });

      // Create a sample request body with updated activity data
      const requestBody = {
        endDate: "2023-07-03",
        goal: "survive",
      };

      // Set up the request with the required properties
      const token = jwt.sign({ id: testUserId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      // Perform the request to update the activity
      const response = await request(app)
        .patch(`/api/v1/schools/${school.id}/activities/${activity.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(requestBody);

      expect(response.status).toBe(204);
      const updatedActivity = await Activity.findByPk(activity.id);
      expect(updatedActivity).toBeDefined();
      expect(updatedActivity.goal).toBe("survive");
    });
  });

  describe("DELETE /schools/:schoolId/activities", () => {
    let schoolId;
    let activityId;
    const testUserId = 2;

    beforeEach(async () => {
      // Create a school in the database to use for the test
      const school = await School.create({
        name: "Test School",
        projectName: "Test project",
      });
      const activity = await Activity.create({
        theme: "transportation",
        name: "eletric vehicles",
        location: "Vila do Conde",
        startDate: "2023-07-01",
        schoolId: school.id,
        creatorId: testUserId,
        supervisorIds: [testUserId],
      });
      schoolId = school.id;
      activityId = activity.id;
    });

    afterEach(async () => {
      await Activity.destroy({ where: { id: activityId } });
      await School.destroy({ where: { id: schoolId } });
    });

    it("should delete an activity", async () => {
      const token = jwt.sign({ id: testUserId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      const response = await request(app)
        .delete(`/api/v1/schools/${schoolId}/activities/${activityId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      // Perform additional checks, such as querying the database to verify the deletion
      const deletedActivity = await Activity.findByPk(activityId);
      expect(deletedActivity).toBeNull();
    });
  });

  describe("checkDeletePermission middleware", () => {
    let testActivity;
    let schoolId = 1;
    let memberId = 1;

    beforeEach(async () => {
      testActivity = await Activity.create({
        theme: "transportation",
        name: "eletric vehicles",
        location: "Vila do Conde",
        startDate: "2023-06-08",
        supervisorsIds: [59, 60],
        creatorId: memberId,
        schoolId: schoolId,
      });
    });

    afterEach(async () => {
      await testActivity.destroy();
    });

    it("should not allow deletion by the creator after approval", async () => {
      const token = jwt.sign({ id: memberId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });
      testActivity.approved = true;
      await testActivity.save();

      await request(app)
        .delete(`/api/v1/schools/${schoolId}/activities/${testActivity.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });
  });
});

const request = require("supertest");
const app = require("../../app");
const jwt = require("jsonwebtoken");
const { sequelize, Sequelize, User } = require("../../models");

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

describe("createUser", () => {
  let TEST_USER = {
    firstname: "John",
    lastname: "Doe",
    email: "test@example.com",
    schoolId: 1,
    roleId: 1,
  };
  const USER_COORDINATOR_ID = 2;
  const INVALID_SCHOOL_ID = 99999;
  let COORDINATOR_ACESS_TOKEN;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await runSeeder();
    COORDINATOR_ACESS_TOKEN = jwt.sign(
      { id: USER_COORDINATOR_ID },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await User.destroy({ where: { email: TEST_USER.email } });
  });

  it("should create a new user and send success response", async () => {
    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${COORDINATOR_ACESS_TOKEN}`)
      .send(TEST_USER);

    expect(response.status).toBe(200);
    expect(response.userId).toBe(TEST_USER.id);
    expect(response.body.message).toBe(
      `Email was sent to ${TEST_USER.email} to create an account password`
    );
  });

  it("should return an error if user already exists", async () => {
    await User.create(TEST_USER);

    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${COORDINATOR_ACESS_TOKEN}`)
      .send(TEST_USER);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      `User already exist with the provided email.`
    );
  });

  it("should return an error if school not found", async () => {
    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${COORDINATOR_ACESS_TOKEN}`)
      .send({
        firstname: "John",
        lastname: "Doe",
        email: "test@example.com",
        schoolId: INVALID_SCHOOL_ID,
        roleId: 1,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Provided school not found.");
  });

  describe("createPassword controller", () => {
    let user;
    let token;

    beforeAll(async () => {
      user = await User.create({
        firstname: "John",
        lastname: "Doe",
        email: "test2@example.com",
        schoolId: 1,
        roleId: 1,
      });
      token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });
    });

    afterAll(async () => {
      // Clean up the user after tests
      await User.destroy({ where: { id: user.id } });
    });

    it("should set the new password and return 204 status code when passwords match", async () => {
      const newPassword = "newPassword";

      const response = await request(app)
        .post(`/api/v1/users/create-password/${token}`)
        .send({
          password: newPassword,
          passwordConfirm: newPassword,
        });

      // Verify that the user's password has been updated
      expect(response.status).toBe(204);
      const updatedUser = await User.findByPk(user.id);
      const passwordMatch = await updatedUser.isCorrectPassword(newPassword);
      expect(passwordMatch).toBe(true);
    });

    it("should return 400 status code and error message when passwords do not match", async () => {
      const response = await request(app)
        .post(`/api/v1/users/create-password/${token}`)
        .send({
          password: "password1",
          passwordConfirm: "password2",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Passwords do not match");
    });

    it("should return 401 status code and error message when the user does not exist", async () => {
      // Delete the user to simulate non-existing user
      await User.destroy({ where: { id: user.id } });

      const response = await request(app)
        .post(`/api/v1/users/create-password/${token}`)
        .send({
          password: "newPassword",
          passwordConfirm: "newPassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        "The user belonging to this token no longer exists"
      );
    });
  });
});

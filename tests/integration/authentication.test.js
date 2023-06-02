require("dotenv").config();
const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../../app"); // Replace with the path to your Express app
const authController = require("../../controllers/authController");
const { sequelize, Sequelize, User, UserRole } = require("../../models");

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

describe("Login Controller", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await runSeeder();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe("POST /users/login", () => {
    it("should return an error if email and password are not provided", async () => {
      const response = await request(app).post("/api/v1/users/login").send({}); // Empty request body

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Please provide email and password!");
    });

    it("should return an error if incorrect email or password is provided", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .send({ email: "incorrect@example.com", password: "wrongpassword" });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Incorrect email or password");
    });

    it("should return the user ID and token if valid email and password are provided", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .send({ email: "user@owly.com", password: "useruser" });

      expect(response.status).toBe(200);
      expect(response.body.userId).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.expIn).toBeDefined();
    });
  });

  describe("Protect middleware", () => {
    it("should return an error if no token is provided", async () => {
      const response = await request(app).get("/api/v1/schools");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        "You are not logged in. Please login to get access"
      );
    });

    it("should return an error if an invalid token is provided", async () => {
      const invalidToken = "invalid-token";
      const response = await request(app)
        .get("/api/v1/schools")
        .set("Authorization", `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        "You are not logged in. Please login to get access"
      );
    });

    it("should return an error if the user associated with the token does not exist", async () => {
      // Generate a valid token
      const token = jwt.sign({ id: 999 }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      const response = await request(app)
        .get("/api/v1/schools")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        "The user belonging to this token no longer exists"
      );
    });
  });
});

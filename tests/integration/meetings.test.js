require("dotenv").config();
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../app"); // Replace with the path to your Express app
const {
  sequelize,
  Sequelize,
  Meeting,
  Participant,
  Image,
} = require("../../models"); // Assuming the app is configured properly

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

describe("Meeting Controller", () => {
  const USER_MEMBER_ID = 1;
  const USER_COORDINATOR_ID = 2;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await runSeeder();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe("POST /meetings", () => {
    it("should create a new meeting and return a success message", async () => {
      const editorsIds = [USER_MEMBER_ID];
      const meetingData = {
        subject: "creation of new themes",
        date: "2023-06-20",
        startTime: "2023-06-20T10:30:00.000Z",
        place: "Teams",
      };

      const token = jwt.sign(
        { id: USER_COORDINATOR_ID },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN,
        }
      );
      const response = await request(app)
        .post("/api/v1/meetings")
        .set("Authorization", `Bearer ${token}`)
        .send({ editorsIds, ...meetingData });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        "Meeting was successfully created"
      );
      expect(response.body.URI).toContain("/meetings/");
    });
  });

  describe("PUT /meetings/:id", () => {
    let meetingId;

    beforeEach(async () => {
      // Create a sample meeting for testing
      const meeting = await Meeting.create({
        subject: "Sample Meeting",
        date: "2023-06-20",
        startTime: "2023-06-20T10:30:00.000Z",
        place: "Sample Place",
        coordinatorId: USER_COORDINATOR_ID,
      });

      meetingId = meeting.id;
      await Participant.create({
        editor: true,
        userId: USER_COORDINATOR_ID,
        meetingId: meeting.id,
      });
    });

    afterEach(async () => {
      // Clean up the database after each test
      await Participant.destroy({ where: {} });
      await Image.destroy({ where: {} });
      await Meeting.destroy({ where: {} });
    });

    it("should update a meeting", async () => {
      const updatedMeetingData = {
        subject: "Updated Meeting",
        date: "2023-06-21",
        startTime: "2023-06-21T09:00:00.000Z",
        place: "Updated Place",
        participantsIds: [1, USER_COORDINATOR_ID, 3],
        editorsIds: [USER_COORDINATOR_ID, 3],
      };

      const token = jwt.sign(
        { id: USER_COORDINATOR_ID },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN,
        }
      );

      const response = await request(app)
        .patch(`/api/v1/meetings/${meetingId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updatedMeetingData);

      expect(response.status).toBe(204);

      // Verify that the meeting has been updated in the database
      const updatedMeeting = await Meeting.findByPk(meetingId);
      expect(updatedMeeting.subject).toBe(updatedMeetingData.subject);
      expect(updatedMeeting.place).toBe(updatedMeetingData.place);

      // Verify that the participants and editors have been updated in the database
      const participants = await Participant.findAll({
        where: { meetingId },
      });
      expect(participants).toHaveLength(
        updatedMeetingData.participantsIds.length
      );
      const participantIds = participants.map(
        (participant) => participant.userId
      );
      expect(participantIds).toEqual(
        expect.arrayContaining(updatedMeetingData.participantsIds)
      );

      const editors = await Participant.findAll({
        where: { meetingId, editor: true },
      });
      expect(editors).toHaveLength(updatedMeetingData.editorsIds.length);
      const editorIds = editors.map((editor) => editor.userId);
      expect(editorIds).toEqual(
        expect.arrayContaining(updatedMeetingData.editorsIds)
      );
    });

    it("should return 404 if the meeting is not found", async () => {
      const nonExistingMeetingId = 999;

      const updatedMeetingData = {
        subject: "Updated Meeting",
        date: "2023-06-21",
        startTime: "2023-06-21T09:00:00.000Z",
        place: "Updated Place",
        participantsIds: [1, 2, 3],
        editorsIds: [2, 3],
      };

      const token = jwt.sign(
        { id: USER_COORDINATOR_ID },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN,
        }
      );
      const response = await request(app)
        .patch(`/api/v1/meetings/${nonExistingMeetingId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updatedMeetingData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        `Meeting with ID ${nonExistingMeetingId} was not found`
      );
    });
  });
});

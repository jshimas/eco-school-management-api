const { Meeting, User, Image, Participant } = require("../../models");
const { Op } = require("sequelize");
const AppError = require("../../utils/AppError");
const {
  getMeeting,
  getAllMeetings,
  meetingBodyValidation,
  checkUpdatePermsissions,
} = require("../../controllers/meetingController");

describe("getMeeting", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      params: {
        id: 1,
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return the meeting when it exists", async () => {
    const mockMeetingId = 1;
    const mockMeeting = {
      id: mockMeetingId,
      subject: "Test Meeting",
      date: "2023-05-30",
      startTime: "09:00:00",
      endTime: "10:00:00",
      place: "Conference Room",
      notes: "This is a test meeting",
      participants: [
        {
          id: 1,
          firstname: "John",
          lastname: "Doe",
          email: "johndoe@example.com",
          permissions: {
            editor: true,
          },
        },
        {
          id: 2,
          firstname: "Jane",
          lastname: "Smith",
          email: "janesmith@example.com",
          permissions: {
            editor: false,
          },
        },
      ],
      images: [
        {
          id: 1,
          filepath: "image1.jpg",
        },
        {
          id: 2,
          filepath: "image2.jpg",
        },
      ],
    };

    jest.spyOn(Meeting, "findByPk").mockResolvedValue(mockMeeting);

    await getMeeting(mockReq, mockRes, mockNext);

    expect(Meeting.findByPk).toHaveBeenCalledWith(mockMeetingId, {
      attributes: [
        "id",
        "subject",
        "date",
        "startTime",
        "endTime",
        "place",
        "notes",
      ],
      include: [
        {
          model: User,
          as: "participants",
          attributes: ["id", "firstname", "lastname", "email"],
          through: {
            attributes: ["editor"],
            as: "permissions",
          },
        },
        {
          model: Image,
          attributes: ["id", "filepath"],
        },
      ],
    });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ meeting: mockMeeting });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next with an error when the meeting does not exist", async () => {
    const mockMeetingId = 1;
    jest.spyOn(Meeting, "findByPk").mockResolvedValue(null);

    await getMeeting(mockReq, mockRes, mockNext);

    expect(Meeting.findByPk).toHaveBeenCalledWith(mockMeetingId, {
      attributes: [
        "id",
        "subject",
        "date",
        "startTime",
        "endTime",
        "place",
        "notes",
      ],
      include: [
        {
          model: User,
          as: "participants",
          attributes: ["id", "firstname", "lastname", "email"],
          through: {
            attributes: ["editor"],
            as: "permissions",
          },
        },
        {
          model: Image,
          attributes: ["id", "filepath"],
        },
      ],
    });

    expect(mockNext).toHaveBeenCalledWith(
      new AppError(`The meeting with ID ${mockMeetingId} does not exist`, 404)
    );
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});

describe("getAllMeetings", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return all meetings when no filter is applied", async () => {
    const mockMeetings = [
      {
        id: 1,
        subject: "Meeting 1",
        date: "2023-05-30",
        startTime: "09:00:00",
        endTime: "10:00:00",
        place: "Conference Room",
      },
      {
        id: 2,
        subject: "Meeting 2",
        date: "2023-06-01",
        startTime: "14:00:00",
        endTime: "15:00:00",
        place: "Board Room",
      },
    ];

    jest.spyOn(Meeting, "findAll").mockResolvedValue(mockMeetings);

    await getAllMeetings(mockReq, mockRes, mockNext);

    expect(Meeting.findAll).toHaveBeenCalledWith({
      attributes: ["id", "subject", "date", "startTime", "endTime", "place"],
      where: {},
    });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ meetings: mockMeetings });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return finished meetings when isFinished query param is 'true'", async () => {
    const mockMeetings = [
      {
        id: 1,
        subject: "Meeting 1",
        date: "2023-05-30",
        startTime: "09:00:00",
        endTime: "10:00:00",
        place: "Conference Room",
      },
    ];

    mockReq.query.isFinished = "true";

    jest.spyOn(Meeting, "findAll").mockResolvedValue(mockMeetings);

    await getAllMeetings(mockReq, mockRes, mockNext);

    expect(Meeting.findAll).toHaveBeenCalledWith({
      attributes: ["id", "subject", "date", "startTime", "endTime", "place"],
      where: { endTime: { [Op.not]: null } },
    });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ meetings: mockMeetings });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return ongoing meetings when isFinished query param is 'false'", async () => {
    const mockMeetings = [
      {
        id: 2,
        subject: "Meeting 2",
        date: "2023-06-01",
        startTime: "14:00:00",
        endTime: null,
        place: "Board Room",
      },
    ];

    mockReq.query.isFinished = "false";

    jest.spyOn(Meeting, "findAll").mockResolvedValue(mockMeetings);

    await getAllMeetings(mockReq, mockRes, mockNext);

    expect(Meeting.findAll).toHaveBeenCalledWith({
      attributes: ["id", "subject", "date", "startTime", "endTime", "place"],
      where: { endTime: null },
    });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ meetings: mockMeetings });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe("meetingBodyValidation", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
    };

    mockRes = {};

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next if participants and editors exist", async () => {
    const mockParticipantsIds = [1, 2, 3];
    const mockEditorsIds = [4, 5];

    mockReq.body.participantsIds = mockParticipantsIds;
    mockReq.body.editorsIds = mockEditorsIds;

    jest
      .spyOn(User, "findAll")
      .mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
      ]);

    await meetingBodyValidation(mockReq, mockRes, mockNext);

    expect(User.findAll).toHaveBeenCalledWith({
      where: {
        id: expect.arrayContaining([...mockParticipantsIds, ...mockEditorsIds]),
      },
    });

    expect(mockNext.mock.calls[0].length).toBe(0);
  });

  it("should call next with an error if participants or editors do not exist", async () => {
    const mockParticipantsIds = [1, 2, 3];
    const mockEditorsIds = [4, 5];

    mockReq.body.participantsIds = mockParticipantsIds;
    mockReq.body.editorsIds = mockEditorsIds;

    jest.spyOn(User, "findAll").mockResolvedValue([{ id: 1 }, { id: 3 }]);

    await meetingBodyValidation(mockReq, mockRes, mockNext);

    expect(User.findAll).toHaveBeenCalledWith({
      where: {
        id: expect.arrayContaining([...mockParticipantsIds, ...mockEditorsIds]),
      },
    });

    expect(mockNext).toHaveBeenCalledWith(
      new AppError(`Following users with ids were not found: 2, 4, 5`, 404)
    );
  });
});

describe("checkUpdatePermsissions", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: {
        id: 1,
      },
      params: {
        meetingId: 1,
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next if the user is the editor of the meeting", async () => {
    jest.spyOn(Participant, "findOne").mockResolvedValue({ id: 1 });

    await checkUpdatePermsissions(mockReq, mockRes, mockNext);

    expect(Participant.findOne).toHaveBeenCalledWith({
      where: {
        userId: 1,
        meetingId: 1,
        editor: true,
      },
    });

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it("should call next with an error if the user is not the editor of the meeting", async () => {
    jest.spyOn(Participant, "findOne").mockResolvedValue(null);

    await checkUpdatePermsissions(mockReq, mockRes, mockNext);

    expect(Participant.findOne).toHaveBeenCalledWith({
      where: {
        userId: 1,
        meetingId: 1,
        editor: true,
      },
    });

    expect(mockNext).toHaveBeenCalledWith(
      new AppError(`You are not the editor of this meeting`, 401)
    );
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});

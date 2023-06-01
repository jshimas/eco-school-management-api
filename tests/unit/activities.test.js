const activitiesController = require("../../controllers/activitiesController");
const { School, Activity, Supervisor, User } = require("../../models");
const { Op } = require("sequelize");
const AppError = require("../../utils/AppError");

jest.mock(
  "../../utils/catchAsync",
  () => (fn) => (req, res, next) => fn(req, res, next)
);

describe("getActivity", () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return the activity when school and activity exist", async () => {
    const mockSchoolId = 1;
    const mockActivityId = 1;
    const mockSchool = { id: mockSchoolId };
    const mockActivity = { id: mockActivityId };

    jest.spyOn(School, "findByPk").mockResolvedValue(mockSchool);
    jest.spyOn(Activity, "findOne").mockResolvedValue(mockActivity);

    const mockReq = {
      params: {
        schoolId: mockSchoolId,
        activityId: mockActivityId,
      },
    };
    const mockNext = jest.fn();

    await activitiesController.getActivity(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ activity: mockActivity });
  });

  it("should call next with an error when school is not found", async () => {
    const mockSchoolId = 1;
    const mockActivityId = 1;

    jest.spyOn(School, "findByPk").mockResolvedValue(null);
    jest.spyOn(Activity, "findOne").mockResolvedValue(null);

    const mockReq = {
      params: {
        schoolId: mockSchoolId,
        activityId: mockActivityId,
      },
    };

    const mockNext = jest.fn();

    await activitiesController.getActivity(mockReq, mockRes, mockNext);

    expect(School.findByPk).toHaveBeenCalledWith(mockSchoolId);
    expect(Activity.findOne).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      new AppError(`School with ID ${mockSchoolId} was not found.`, 404)
    );
  });

  it("should call next with an error when activity is not found", async () => {
    const mockSchoolId = 1;
    const mockActivityId = 1;
    const mockSchool = { id: mockSchoolId };

    jest.spyOn(School, "findByPk").mockResolvedValue(mockSchool);
    jest.spyOn(Activity, "findOne").mockResolvedValue(null);

    const mockReq = {
      params: {
        schoolId: mockSchoolId,
        activityId: mockActivityId,
      },
    };

    const mockNext = jest.fn();

    await activitiesController.getActivity(mockReq, mockRes, mockNext);

    expect(School.findByPk).toHaveBeenCalledWith(mockSchoolId);
    expect(Activity.findOne).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      new AppError(
        `Activity with ID ${mockActivityId} was not found at specified school.`,
        404
      )
    );
  });
});

describe("checkSupervisorPermission", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      params: {
        activityId: 1,
      },
      user: {
        id: 1,
        role: "admin",
      },
    };

    mockRes = {};

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next if the logged user is supervisor", async () => {
    jest.spyOn(Supervisor, "findOne").mockResolvedValue(true);

    await activitiesController.checkSupervisorPermission(
      mockReq,
      mockRes,
      mockNext
    );

    expect(Supervisor.findOne).toHaveBeenCalledWith({
      where: {
        [Op.and]: {
          userId: mockReq.user.id,
          activityId: mockReq.params.activityId,
        },
      },
    });

    expect(mockNext).toHaveBeenCalled();
  });

  it("should call next with an error if supervisor is not found", async () => {
    jest.spyOn(Supervisor, "findOne").mockResolvedValue(null);

    await activitiesController.checkSupervisorPermission(
      mockReq,
      mockRes,
      mockNext
    );

    expect(Supervisor.findOne).toHaveBeenCalledWith({
      where: {
        [Op.and]: {
          userId: mockReq.user.id,
          activityId: mockReq.params.activityId,
        },
      },
    });

    expect(mockNext).toHaveBeenCalledWith(
      new AppError(
        "You do not have the supervisor role to perform update on this activity",
        401
      )
    );
  });

  it("should call next with an error if user role is not 'admin' or 'coordinator'", async () => {
    jest.spyOn(Supervisor, "findOne").mockResolvedValue(false);
    mockReq.user.role = "student";

    await activitiesController.checkSupervisorPermission(
      mockReq,
      mockRes,
      mockNext
    );

    expect(Supervisor.findOne).toHaveBeenCalledWith({
      where: {
        [Op.and]: {
          userId: mockReq.user.id,
          activityId: mockReq.params.activityId,
        },
      },
    });

    expect(mockNext).toHaveBeenCalledWith(
      new AppError(
        "You do not have the supervisor role to perform update on this activity",
        401
      )
    );
  });
});

describe("activityBodyValidation", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {
        supervisorsIds: [1, 2, 3],
      },
    };

    mockRes = {};

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next if all user IDs are valid", async () => {
    jest
      .spyOn(User, "findAll")
      .mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    await activitiesController.activityBodyValidation(
      mockReq,
      mockRes,
      mockNext
    );

    expect(User.findAll).toHaveBeenCalledWith({
      where: {
        id: mockReq.body.supervisorsIds,
      },
    });

    expect(mockNext).toHaveBeenCalled();
  });

  it("should call next with an error if any user ID is invalid", async () => {
    jest.spyOn(User, "findAll").mockResolvedValue([{ id: 1 }]);

    await activitiesController.activityBodyValidation(
      mockReq,
      mockRes,
      mockNext
    );

    expect(User.findAll).toHaveBeenCalledWith({
      where: {
        id: mockReq.body.supervisorsIds,
      },
    });

    expect(mockNext).toHaveBeenCalledWith(
      new AppError(`Following users with ids were not found: 2, 3`, 404)
    );
  });

  it("should call next if supervisorsIds is empty", async () => {
    mockReq.body.supervisorsIds = [];
    jest.spyOn(User, "findAll");

    await activitiesController.activityBodyValidation(
      mockReq,
      mockRes,
      mockNext
    );

    expect(User.findAll).not.toHaveBeenCalled();

    expect(mockNext).toHaveBeenCalled();
  });

  it("should call next if supervisorsIds is not provided", async () => {
    mockReq.body.supervisorsIds = undefined;
    jest.spyOn(User, "findAll");

    await activitiesController.activityBodyValidation(
      mockReq,
      mockRes,
      mockNext
    );

    expect(User.findAll).not.toHaveBeenCalled();

    expect(mockNext).toHaveBeenCalled();
  });
});

describe("getAllActivities", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      params: {
        schoolId: 1,
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

  it("should return activities of the school when school exists", async () => {
    const mockSchoolId = 1;
    const mockSchool = {
      id: mockSchoolId,
      activities: [
        { id: 1, name: "Activity 1" },
        { id: 2, name: "Activity 2" },
      ],
      toJSON: jest.fn().mockReturnThis(),
    };

    jest.spyOn(School, "findByPk").mockResolvedValue(mockSchool);

    await activitiesController.getAllActivities(mockReq, mockRes, mockNext);

    expect(School.findByPk).toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      activities: mockSchool.activities,
    });
  });

  it("should call next with an error when school is not found", async () => {
    const mockSchoolId = 1;

    jest.spyOn(School, "findByPk").mockResolvedValue(null);

    await activitiesController.getAllActivities(mockReq, mockRes, mockNext);

    expect(School.findByPk).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      new AppError(`School with ID ${mockSchoolId} was not found.`, 404)
    );
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});

const {
  getAllUser,
  getUser,
  updateUser,
  getMe,
  deleteUser,
} = require("../../controllers/userController");
const { User, UserRole, School } = require("../../models");
const AppError = require("../../utils/AppError");

jest.mock(
  "../../utils/catchAsync",
  () => (fn) => (req, res, next) => fn(req, res, next)
);

jest.mock("../../models", () => ({
  User: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  UserRole: {
    findOne: jest.fn(),
  },
  School: {
    findByPk: jest.fn(),
  },
}));

describe("getAllUser", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should get all users with their roles", async () => {
    const mockUsers = [
      {
        id: 1,
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
        role: {
          role: "admin",
        },
      },
      {
        id: 2,
        firstname: "Jane",
        lastname: "Smith",
        email: "jane@example.com",
        role: {
          role: "user",
        },
      },
    ];

    User.findAll.mockResolvedValue(mockUsers);

    await getAllUser(mockReq, mockRes);

    expect(User.findAll).toHaveBeenCalledTimes(1);
    expect(User.findAll).toHaveBeenCalledWith({
      include: UserRole,
      attributes: ["id", "firstname", "lastname", "email"],
    });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      users: [
        {
          id: 1,
          firstname: "John",
          lastname: "Doe",
          email: "john@example.com",
          role: "admin",
        },
        {
          id: 2,
          firstname: "Jane",
          lastname: "Smith",
          email: "jane@example.com",
          role: "user",
        },
      ],
    });
  });
});

describe("getUser", () => {
  let USER_ID = 1;
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      params: {
        id: USER_ID,
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should get the user with the specified ID", async () => {
    const mockUser = {
      id: USER_ID,
      firstname: "John",
      lastname: "Doe",
      email: "john@example.com",
      school_fk: 1,
      role: {
        role: "admin",
      },
      toJSON: jest.fn().mockReturnValue({
        id: 1,
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
        role: "admin",
      }),
    };

    User.findByPk.mockResolvedValue(mockUser);
    UserRole.findOne.mockResolvedValue(mockUser.role);

    await getUser(mockReq, mockRes, mockNext);

    expect(User.findByPk).toHaveBeenCalledTimes(USER_ID);
    expect(User.findByPk).toHaveBeenCalledWith(USER_ID, {
      include: UserRole,
      attributes: ["id", "firstname", "lastname", "email", "school_fk"],
    });

    expect(mockNext).not.toHaveBeenCalled();

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      user: {
        id: USER_ID,
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
        role: "admin",
      },
    });
  });

  it("should handle user not found", async () => {
    User.findByPk.mockResolvedValue(null);

    await getUser(mockReq, mockRes, mockNext);

    expect(User.findByPk).toHaveBeenCalledTimes(USER_ID);
    expect(User.findByPk).toHaveBeenCalledWith(USER_ID, {
      include: UserRole,
      attributes: ["id", "firstname", "lastname", "email", "school_fk"],
    });

    expect(UserRole.findOne).not.toHaveBeenCalled();

    expect(mockNext).toHaveBeenCalledTimes(USER_ID);
    expect(mockNext).toHaveBeenCalledWith(new AppError("User not found", 404));

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});

describe("updateUser", () => {
  let USER_ID = 1;

  it("should update the user successfully", async () => {
    const mockReq = {
      params: {
        id: USER_ID,
      },
      body: {
        firstname: "John",
        lastname: "Doe",
        email: "john.doe@example.com",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockNext = jest.fn();

    const user = {
      id: USER_ID,
      update: jest.fn(),
    };

    User.findByPk = jest.fn().mockResolvedValue(user);

    await updateUser(mockReq, mockRes, mockNext);

    expect(User.findByPk).toHaveBeenCalledWith(USER_ID);
    expect(user.update).toHaveBeenCalledWith({
      firstname: "John",
      lastname: "Doe",
      email: "john.doe@example.com",
    });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 404 if user does not exist", async () => {
    // ARRANGE
    const mockReq = {
      params: {
        id: USER_ID,
      },
      body: {
        firstname: "John",
        lastname: "Doe",
        email: "john.doe@example.com",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    User.findByPk = jest.fn().mockResolvedValue(null);

    // ACT
    await updateUser(mockReq, mockRes, mockNext);

    // ASSERT
    expect(User.findByPk).toHaveBeenCalledWith(USER_ID);
    expect(mockNext).toHaveBeenCalledWith(
      new AppError(`The user with ID ${USER_ID} does not exist`, 404)
    );
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});

describe("getMe", () => {
  let USER_ID = 1;
  let SCHOOL_ID = 1;
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: {
        id: USER_ID,
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
        role: "admin",
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
    jest.clearAllMocks();
  });

  it("should get the current user information", async () => {
    const mockSchool = {
      id: SCHOOL_ID,
      name: "Sample School",
    };

    User.findByPk.mockResolvedValue(mockReq.user);
    School.findByPk.mockResolvedValue(mockSchool);

    await getMe(mockReq, mockRes, mockNext);

    expect(User.findByPk).toHaveBeenCalledTimes(1);
    expect(User.findByPk).toHaveBeenCalledWith(USER_ID);

    expect(School.findByPk).toHaveBeenCalledTimes(1);
    expect(School.findByPk).toHaveBeenCalledWith(SCHOOL_ID);

    expect(mockNext).not.toHaveBeenCalled();

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      user: {
        id: USER_ID,
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
        role: "admin",
        schoolName: "Sample School",
        schoolId: SCHOOL_ID,
      },
    });
  });
});

describe("deleteUser", () => {
  let USER_ID = 1;
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      params: {
        id: USER_ID,
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

  it("should delete the user and send success response", async () => {
    jest.spyOn(User, "findByPk").mockResolvedValue({ id: USER_ID });

    await deleteUser(mockReq, mockRes, mockNext);

    expect(User.findByPk).toHaveBeenCalledWith(USER_ID);
    expect(User.destroy).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "The user was successfully deleted.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle user not found", async () => {
    jest.spyOn(User, "findByPk").mockResolvedValue(null);

    await deleteUser(mockReq, mockRes, mockNext);

    expect(User.findByPk).toHaveBeenCalledWith(USER_ID);
    expect(mockNext).toHaveBeenCalledWith(
      new AppError(`The user with ID ${USER_ID} does not exist`, 404)
    );
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});

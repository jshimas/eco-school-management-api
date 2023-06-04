const {
  getSchoolStats,
  createSchool,
} = require("../../controllers/schoolsController");
const { School, Activity, User, Sequelize } = require("../../models"); // Assuming you import the Sequelize models
const AppError = require("../../utils/AppError");

jest.mock(
  "../../utils/catchAsync",
  () => (fn) => (req, res, next) => fn(req, res, next)
);

describe("createSchool", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new school and return the URI with the school ID", async () => {
    const req = {
      body: {
        name: "Northern Coastline highschool",
        projectName: "Eco-Safe coast",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const mockCreatedSchool = { id: 1 };
    jest.spyOn(School, "create").mockResolvedValue(mockCreatedSchool);

    await createSchool(req, res, next);

    expect(School.create).toHaveBeenCalledWith(req.body);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      URI: `/schools/${mockCreatedSchool.id}`,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

const errorHandler = require("../../controllers/errorController");

describe("errorHandler", () => {
  test("should set the status code, success flag, message, errors, and stack in the response", () => {
    const err = new Error("Test error");
    err.statusCode = 400;
    err.success = false;
    err.name = "SequelizeValidationError";
    err.message = "Validation errors";
    err.errors = [
      { message: "SequelizeValidationError.Error 1" },
      { message: "SequelizeValidationError.Error 2" },
    ];
    err.stack = "Error stack trace";

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation errors",
      errors: ["Error 1", "Error 2"],
      stack: "Error stack trace",
    });
    expect(next).not.toHaveBeenCalled();
  });
});

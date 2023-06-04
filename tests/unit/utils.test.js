const assignSchoolLevel = require("../../utils/assignSchoolLevel");

describe("assignSchoolLevel", () => {
  test("should return the correct school level based on scores", () => {
    // Test case 1
    const level1 = assignSchoolLevel(1, 1, 1);
    expect(level1).toBe("beginner");

    // Test case 2
    const level2 = assignSchoolLevel(5, 3, 10);
    expect(level2).toBe("novice");

    // Test case 3
    const level3 = assignSchoolLevel(10, 2, 30);
    expect(level3).toBe("intermediate");

    // Test case 4
    const level4 = assignSchoolLevel(15, 5, 40);
    expect(level4).toBe("advanced");

    // Test case 5
    const level5 = assignSchoolLevel(25, 10, 30);
    expect(level5).toBe("expert");

    // Add more test cases as needed
  });
});

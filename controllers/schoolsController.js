const { Sequelize } = require("sequelize");
const { School, Activity, User } = require("../models");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const assignSchoolLevel = require("../utils/assignSchoolLevel");

const getSchoolStats = async (schoolId) => {
  // Count school activities
  const { count: activitiesCount } = await Activity.findAndCountAll({
    where: {
      schoolId: schoolId,
    },
  });

  // Count school themes
  const schoolThemes = await Activity.findAll({
    attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("theme")), "theme"]],
    where: {
      schoolId: schoolId,
    },
  });

  // Count school students
  const { count: studentsCount } = await User.findAndCountAll({
    where: {
      schoolId: schoolId,
      roleId: 1, // 1 - member
    },
  });

  const schoolLevel = assignSchoolLevel(
    activitiesCount,
    schoolThemes.length,
    studentsCount
  );

  return {
    themesQuantity: schoolThemes.length,
    activitiesQuantity: activitiesCount,
    studentsQuantity: studentsCount,
    level: schoolLevel,
  };
};

exports.getSchool = catchAsync(async (req, res, next) => {
  const { id: schoolId } = req.params;

  const school = await School.findByPk(schoolId);

  if (!school) {
    return next(new AppError(`School with ID ${schoolId} was not found.`, 404));
  }

  const schoolStats = await getSchoolStats(schoolId);

  const schoolData = {
    ...school.toJSON(),
    ...schoolStats,
  };

  res.status(200).json({ school: schoolData });
});

exports.getAllSchools = catchAsync(async (req, res, next) => {
  const schools = await School.findAll();

  const schoolsData = await Promise.all(
    schools.map(async (school) => {
      const schoolStats = await getSchoolStats(school.id);
      return {
        ...school.toJSON(),
        ...schoolStats,
      };
    })
  );

  res.status(200).json({ schools: schoolsData });
});

exports.createSchool = catchAsync(async (req, res, next) => {
  const newSchool = await School.create({ ...req.body });

  res.status(201).json({ URI: `/schools/${newSchool.id}` });
});

module.exports = (activitiesQuantity, themesQuantity, studentsQuantity) => {
  const score =
    activitiesQuantity * 0.4 + themesQuantity * 0.4 + studentsQuantity * 0.2;

  if (score < 3) return "beginner";
  else if (score < 8) return "novice";
  else if (score < 21) return "intermediate";
  else if (score < 34) return "advanced";
  else return "expert";
};

const db = require('../models');
const GradeScale = db.GradeScale;

const getGrade = async (score) => {
  const grade = await GradeScale.findOne({
    where: {
      minScore: { [db.Sequelize.Op.lte]: score },
      maxScore: { [db.Sequelize.Op.gte]: score }
    }
  });

  return grade;
};

module.exports = { getGrade };
const db = require('../models');
const GradeScale = db.GradeScale;

const seedGrades = async () => {
  await GradeScale.bulkCreate([
    { grade: 'D1', minScore: 80, maxScore: 100, remark: 'Excellent' },
    { grade: 'D2', minScore: 75, maxScore: 79, remark: 'Very Good' },
    { grade: 'C3', minScore: 70, maxScore: 74, remark: 'Good' },
    { grade: 'C4', minScore: 65, maxScore: 69, remark: 'Fair Good' },
    { grade: 'C5', minScore: 60, maxScore: 64, remark: 'Fair' },
    { grade: 'C6', minScore: 50, maxScore: 59, remark: 'Pass' },
    { grade: 'P7', minScore: 40, maxScore: 49, remark: 'Weak Pass' },
    { grade: 'P8', minScore: 35, maxScore: 39, remark: 'Very Weak' },
    { grade: 'F9', minScore: 0, maxScore: 34, remark: 'Fail' }
  ]);
};

module.exports = seedGrades;
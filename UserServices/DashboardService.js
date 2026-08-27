const db = require('../models');
const { Op } = require('sequelize');

const DashboardService = {
  async getDashboardStats() {
    const [
      totalStudents,
      totalClasses,
      totalSubjects,
      totalTeachers,
      feeStats,
      markStats,
      recentStudents,
      recentFees
    ] = await Promise.all([
      db.Student.count(),
      db.Class.count(),
      db.Subject.count(),
      db.Teacher.count(),
      this.getFeeStats(),
      this.getMarkStats(),
      db.Student.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [{ model: db.Class, as: 'class' }]
      }),
      db.Fee.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [{ model: db.Student, as: 'student' }]
      })
    ]);

    return {
      totalStudents,
      totalClasses,
      totalSubjects,
      totalTeachers,
      ...feeStats,
      ...markStats,
      recentStudents,
      recentFees
    };
  },

  async getFeeStats() {
    const fees = await db.Fee.findAll();
    
    let totalCollected = 0;
    let totalDemanded = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let partialCount = 0;

    fees.forEach(fee => {
      const paid = Number(fee.amountPaid || 0);
      const total = Number(fee.totalFee || 0);
      totalCollected += paid;
      totalDemanded += total;
      
      const balance = total - paid;
      if (balance === 0 && paid > 0) paidCount++;
      else if (balance > 0 && paid > 0) partialCount++;
      else if (paid === 0 && total > 0) pendingCount++;
    });

    return {
      totalFeesCollected: totalCollected,
      totalFeesDemanded: totalDemanded,
      totalBalance: totalDemanded - totalCollected,
      paidCount,
      pendingCount,
      partialCount
    };
  },

  async getMarkStats() {
    const totalMarks = await db.Mark.count();
    const averageScore = await db.Mark.findOne({
      attributes: [
        [db.Sequelize.fn('AVG', db.Sequelize.col('score')), 'average']
      ],
      raw: true
    });

    return {
      totalMarks,
      averageScore: Math.round(averageScore?.average || 0)
    };
  }
};

module.exports = DashboardService;
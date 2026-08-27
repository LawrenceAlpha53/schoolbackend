// const db = require('../models');

// exports.getDashboardStats = async (req, res) => {
//   try {

//     // 1. Total Students
//     const totalStudents = await db.Student.count();

//     // 2. Total Classes
//     const totalClasses = await db.Class.count();

//     // 3. Total Subjects
//     const totalSubjects = await db.Subject.count();

//     // 4. Total Teachers
//     const totalTeachers = await db.Users.count({
//   where: {
//     role: 'teacher'
//   }
// });

//     // 5. Total Fees Paid
//     const fees = await db.Fee.findAll();
//     const totalFeesCollected = fees.reduce((sum, fee) => sum + Number(fee.amountPaid), 0);

//     // 6. Total Balance (unpaid fees)
//     const totalBalance = fees.reduce((sum, fee) => sum + Number(fee.balance), 0);

//     // 7. Total Marks Entries
//     const totalMarks = await db.Mark.count();

//     return res.json({
//       totalStudents,
//       totalClasses,
//       totalSubjects,
//       totalTeachers,
//       totalFeesCollected,
//       totalBalance,
//       totalMarks
//     });

//   } catch (error) {
//     return res.status(500).json({
//       message: "Dashboard error",
//       error: error.message
//     });
//   }
// };

// const DashboardService = require('../UserServices/DashboardService');

// const DashboardController = {
//   async getDashboardStats(req, res, next) {
//     try {
//       const stats = await DashboardService.getDashboardStats();
      
//       res.json({
//         success: true,
//         data: stats
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// };

// module.exports = DashboardController;

const DashboardService = require('../UserServices/DashboardService');
const db = require('../models');

const DashboardController = {
  async getDashboardStats(req, res, next) {
    try {
      // If teacher, we might want to return only their class stats
      if (req.user.role === 'teacher' && req.teacherClassId) {
        const classId = req.teacherClassId;
        // Fetch stats for this class only
        const students = await db.Student.count({ where: { classId } });
        const teachers = 1; // just themselves
        const subjects = await db.Subject.count({ include: [{ model: db.Class, as: 'classes', where: { id: classId } }] });
        const fees = await db.Fee.findAll({ include: [{ model: db.Student, where: { classId } }] });
        const totalCollected = fees.reduce((sum, f) => sum + Number(f.amountPaid || 0), 0);
        const totalBalance = fees.reduce((sum, f) => sum + Number(f.balance || 0), 0);
        const marks = await db.Mark.count({ include: [{ model: db.Student, where: { classId } }] });
        res.json({
          success: true,
          data: {
            students,
            teachers,
            subjects,
            totalFeesCollected: totalCollected,
            totalBalance,
            marks
          }
        });
      } else {
        // Admin/secretary – full stats
        const stats = await DashboardService.getDashboardStats();
        res.json({ success: true, data: stats });
      }
    } catch (error) { next(error); }
  }
};
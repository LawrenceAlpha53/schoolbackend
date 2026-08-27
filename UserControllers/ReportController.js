const db = require('../models');
const { Student, Class, Fee, Mark, Subject } = db;

module.exports = {

  // 📊 DASHBOARD STATS
  async getDashboardStats(req, res) {
    try {

      const students = await Student.count();
      const classes = await Class.count();
      const marks = await Mark.count();

      const fees = await Fee.findAll();

      const totalFeesCollected = fees.reduce(
        (sum, f) => sum + Number(f.amountPaid || 0),
        0
      );

      const totalBalance = fees.reduce(
        (sum, f) => sum + Number(f.balance || 0),
        0
      );

      res.json({
        students,
        classes,
        marks,
        totalFeesCollected,
        totalBalance
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to load dashboard",
        error: error.message
      });
    }
  },

  // 👨‍🎓 STUDENT REPORT (RAW DATA ONLY)
  async getStudentReport(req, res) {
    try {

      const students = await Student.findAll({
        include: ["class", "fees", "marks"]
      });

      res.json(students);

    } catch (error) {
      res.status(500).json({
        message: "Student report failed",
        error: error.message
      });
    }
  },

  // 💰 FEES REPORT
  async getFeesReport(req, res) {
    try {

      const fees = await Fee.findAll({
        include: ["student"]
      });

      res.json(fees);

    } catch (error) {
      res.status(500).json({
        message: "Fees report failed",
        error: error.message
      });
    }
  },

  // 📚 MARKS REPORT (NO GRADING HERE)
  async getMarksReport(req, res) {
    try {

      const marks = await Mark.findAll({
        include: [
          { model: Student, as: "student" },
          { model: Subject, as: "subject" }
        ]
      });

      res.json(marks);

    } catch (error) {
      res.status(500).json({
        message: "Marks report failed",
        error: error.message
      });
    }
  },

  // 🏫 CLASS REPORT
  async getClassReport(req, res) {
    try {

      const classes = await Class.findAll({
        include: ["students"]
      });

      res.json(classes);

    } catch (error) {
      res.status(500).json({
        message: "Class report failed",
        error: error.message
      });
    }
  }
};
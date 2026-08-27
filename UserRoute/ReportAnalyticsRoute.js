const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');
const db = require('../models');

// GET /report-analytics/students/status?term=...&academicYear=...&classId=...
router.get('/students/status', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    const { term, academicYear, classId } = req.query;
    const whereStudent = {};
    if (classId) whereStudent.classId = classId;

    const students = await db.Student.findAll({
      where: whereStudent,
      include: [{ model: db.Class, as: 'class' }],
      order: [['fullName', 'ASC']]
    });

    const result = [];
    for (const student of students) {
      // Fee status
      const fees = await db.Fee.findAll({ where: { studentId: student.id } });
      const totalDemanded = fees.reduce((sum, f) => sum + Number(f.totalFee || 0), 0);
      const totalPaid = fees.reduce((sum, f) => sum + Number(f.amountPaid || 0), 0);
      const totalBalance = totalDemanded - totalPaid;
      const isEligible = totalBalance === 0;

      // Report card existence
      const reportCard = await db.ReportCard.findOne({
        where: { studentId: student.id, term, academicYear }
      });

      // Pickup status
      const pickup = await db.ReportPickup.findOne({
        where: { studentId: student.id, term, academicYear, isPicked: true }
      });

      result.push({
        student: {
          id: student.id,
          fullName: student.fullName,
          studentNumber: student.studentNumber,
          gender: student.gender
        },
        class: student.class,
        feeStatus: { totalDemanded, totalPaid, totalBalance },
        isEligible,
        hasReportCard: !!reportCard,
        isPicked: !!pickup,
        pickup: pickup || null
      });
    }

    const pickedCount = result.filter(r => r.isPicked).length;
    const eligibleCount = result.filter(r => r.isEligible).length;
    const notEligibleCount = result.length - eligibleCount;
    const noReportCount = result.filter(r => !r.hasReportCard).length;

    res.json({
      success: true,
      data: {
        summary: {
          totalStudents: result.length,
          pickedCount,
          eligibleCount,
          notEligibleCount,
          noReportCount,
          pickUpRate: result.length > 0 ? Math.round((pickedCount / result.length) * 100) : 0
        },
        students: result
      }
    });
  } catch (error) {
    console.error('Report analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /report-analytics/student/:studentId/status?term=...&academicYear=...
router.get('/student/:studentId/status', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term, academicYear } = req.query;

    const student = await db.Student.findByPk(studentId, {
      include: [{ model: db.Class, as: 'class' }]
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const fees = await db.Fee.findAll({ where: { studentId } });
    const totalDemanded = fees.reduce((sum, f) => sum + Number(f.totalFee || 0), 0);
    const totalPaid = fees.reduce((sum, f) => sum + Number(f.amountPaid || 0), 0);
    const totalBalance = totalDemanded - totalPaid;
    const isEligible = totalBalance === 0;

    const reportCard = await db.ReportCard.findOne({ where: { studentId, term, academicYear } });
    const pickup = await db.ReportPickup.findOne({ where: { studentId, term, academicYear, isPicked: true } });

    res.json({
      success: true,
      data: {
        feeStatus: { totalDemanded, totalPaid, totalBalance },
        isEligible,
        hasReportCard: !!reportCard,
        isPicked: !!pickup,
        pickup: pickup || null
      }
    });
  } catch (error) {
    console.error('Student status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /report-analytics/student/:studentId/combination
router.get('/student/:studentId/combination', verifyToken, role('admin', 'secretary', 'teacher'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await db.Student.findByPk(studentId, {
      include: [{ model: db.Class, as: 'class' }]
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const subjects = await db.Subject.findAll({ where: { classId: student.classId } });
    const marks = await db.Mark.findAll({
      where: { studentId },
      include: [{ model: db.Subject, as: 'subject' }]
    });

    const getUgandaGrade = (score) => {
      if (score >= 80) return 'D1';
      if (score >= 75) return 'D2';
      if (score >= 70) return 'C3';
      if (score >= 65) return 'C4';
      if (score >= 60) return 'C5';
      if (score >= 55) return 'C6';
      if (score >= 50) return 'P7';
      if (score >= 45) return 'P8';
      return 'F9';
    };

    const subjectMarks = subjects.map(subject => {
      const mark = marks.find(m => m.subjectId === subject.id);
      return {
        subject: subject.subjectName,
        score: mark?.score || null,
        grade: mark?.score ? getUgandaGrade(mark.score) : 'N/A'
      };
    });

    res.json({
      success: true,
      data: {
        level: student.class?.className || 'N/A',
        combination: subjects.map(s => s.subjectName),
        subjects: subjectMarks
      }
    });
  } catch (error) {
    console.error('Combination error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /report-analytics/pickup
router.post('/pickup', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    const { studentId, term, academicYear, remarks } = req.body;
    const secretaryId = req.user.id;

    const reportCard = await db.ReportCard.findOne({ where: { studentId, term, academicYear } });
    if (!reportCard) {
      return res.status(400).json({ success: false, message: 'No report card found for this student' });
    }

    const fees = await db.Fee.findAll({ where: { studentId } });
    const totalBalance = fees.reduce((sum, f) => sum + Number(f.totalFee || 0), 0) -
                         fees.reduce((sum, f) => sum + Number(f.amountPaid || 0), 0);
    if (totalBalance > 0) {
      return res.status(400).json({ success: false, message: 'Student has outstanding fees. Cannot release report.' });
    }

    const [pickup, created] = await db.ReportPickup.findOrCreate({
      where: { studentId, term, academicYear },
      defaults: {
        studentId,
        secretaryId,
        term,
        academicYear,
        pickupDate: new Date(),
        pickupTime: new Date().toTimeString().slice(0, 8),
        remarks,
        isPicked: true
      }
    });

    if (!created) {
      await pickup.update({
        secretaryId,
        pickupDate: new Date(),
        pickupTime: new Date().toTimeString().slice(0, 8),
        remarks: remarks || pickup.remarks,
        isPicked: true
      });
    }

    res.json({ success: true, data: pickup });
  } catch (error) {
    console.error('Pickup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
const db = require('../models');
const { Op } = require('sequelize');
const Student = db.Student;
const Class = db.Class;
const Fee = db.Fee;
const Mark = db.Mark;
const Subject = db.Subject;
const ReportCard = db.ReportCard;
const ReportPickup = db.ReportPickup;
const User = db.Users;
const sequelize = db.sequelize;

const ReportAnalyticsService = {
  // ================= GET STUDENT REPORT STATUS =================
  async getStudentReportStatus(studentId, term, academicYear) {
    const student = await Student.findByPk(studentId, {
      include: [
        { model: Class, as: 'class' },
        { model: Fee, as: 'fees' },
        { model: ReportCard, as: 'reportCards' }
      ]
    });

    if (!student) throw new Error('Student not found');

    // Get fee status
    const feeStatus = await this.getStudentFeeStatus(studentId);
    
    // Get report card
    const reportCard = await ReportCard.findOne({
      where: { studentId, term, academicYear },
      include: [
        { model: Student, as: 'student' }
      ]
    });

    // Check if report has been picked
    const pickup = await ReportPickup.findOne({
      where: { studentId, term, academicYear },
      include: [
        { model: User, as: 'secretary' }
      ]
    });

    // Get marks
    const marks = await Mark.findAll({
      where: { studentId },
      include: [
        { model: Subject, as: 'subject' }
      ]
    });

    const isEligible = feeStatus.totalBalance === 0;

    return {
      student,
      feeStatus,
      reportCard,
      pickup: pickup || null,
      isPicked: pickup?.isPicked || false,
      isEligible,
      marks,
      marksCount: marks.length,
      canPick: isEligible && reportCard !== null
    };
  },

  // ================= GET STUDENT FEE STATUS =================
  async getStudentFeeStatus(studentId) {
    const fees = await Fee.findAll({
      where: { studentId },
      order: [['createdAt', 'DESC']]
    });

    let totalPaid = 0;
    let totalDemanded = 0;
    let totalBalance = 0;

    fees.forEach(fee => {
      totalPaid += Number(fee.amountPaid || 0);
      totalDemanded += Number(fee.totalFee || 0);
      totalBalance += Number(fee.balance || 0);
    });

    const isCleared = totalBalance === 0;

    return {
      totalPaid,
      totalDemanded,
      totalBalance,
      isCleared,
      fees,
      feeCount: fees.length
    };
  },

  // ================= MARK REPORT AS PICKED =================
  async markReportPicked(studentId, term, academicYear, secretaryId, remarks = '') {
    const student = await Student.findByPk(studentId);
    if (!student) throw new Error('Student not found');

    const secretary = await User.findByPk(secretaryId);
    if (!secretary) throw new Error('Secretary not found');

    // Check if report card exists
    const reportCard = await ReportCard.findOne({
      where: { studentId, term, academicYear }
    });

    if (!reportCard) {
      throw new Error('Report card not found for this student');
    }

    // Check fee clearance
    const feeStatus = await this.getStudentFeeStatus(studentId);
    if (feeStatus.totalBalance > 0) {
      throw new Error('Student has outstanding fees. Cannot release report.');
    }

    // Create or update pickup record
    const [pickup, created] = await ReportPickup.findOrCreate({
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

    return pickup;
  },

  // ================= GET CLASS REPORT STATUS =================
  async getClassReportStatus(classId, term, academicYear) {
    const classExists = await Class.findByPk(classId);
    if (!classExists) throw new Error('Class not found');

    const students = await Student.findAll({
      where: { classId },
      include: [
        { model: Fee, as: 'fees' },
        { model: ReportCard, as: 'reportCards', where: { term, academicYear }, required: false }
      ]
    });

    const results = [];
    let totalStudents = 0;
    let pickedCount = 0;
    let eligibleCount = 0;
    let notEligibleCount = 0;
    let noReportCount = 0;

    for (const student of students) {
      totalStudents++;
      
      const feeStatus = await this.getStudentFeeStatus(student.id);
      const isEligible = feeStatus.totalBalance === 0;
      
      if (isEligible) eligibleCount++;
      else notEligibleCount++;

      const reportCard = student.reportCards?.[0] || null;
      if (!reportCard) noReportCount++;

      const pickup = await ReportPickup.findOne({
        where: { 
          studentId: student.id, 
          term, 
          academicYear,
          isPicked: true
        }
      });

      if (pickup) pickedCount++;

      results.push({
        student: {
          id: student.id,
          fullName: student.fullName,
          studentNumber: student.studentNumber,
          gender: student.gender
        },
        feeStatus,
        hasReportCard: !!reportCard,
        reportCard,
        isEligible,
        isPicked: !!pickup,
        pickup: pickup || null
      });
    }

    return {
      class: classExists,
      summary: {
        totalStudents,
        pickedCount,
        eligibleCount,
        notEligibleCount,
        noReportCount,
        pickUpRate: totalStudents > 0 ? ((pickedCount / totalStudents) * 100).toFixed(1) : 0
      },
      students: results
    };
  },

  // ================= GET ALL STUDENTS REPORT STATUS =================
  async getAllStudentsReportStatus(term, academicYear, classId = null) {
    const where = {};
    if (classId) where.classId = classId;

    const students = await Student.findAll({
      where,
      include: [
        { model: Class, as: 'class' },
        { model: Fee, as: 'fees' }
      ],
      order: [['fullName', 'ASC']]
    });

    const results = [];
    let totalStudents = 0;
    let pickedCount = 0;
    let eligibleCount = 0;
    let notEligibleCount = 0;
    let noReportCount = 0;

    for (const student of students) {
      totalStudents++;
      
      const feeStatus = await this.getStudentFeeStatus(student.id);
      const isEligible = feeStatus.totalBalance === 0;
      
      if (isEligible) eligibleCount++;
      else notEligibleCount++;

      const reportCard = await ReportCard.findOne({
        where: { studentId: student.id, term, academicYear }
      });

      if (!reportCard) noReportCount++;

      const pickup = await ReportPickup.findOne({
        where: { 
          studentId: student.id, 
          term, 
          academicYear,
          isPicked: true
        }
      });

      if (pickup) pickedCount++;

      results.push({
        student: {
          id: student.id,
          fullName: student.fullName,
          studentNumber: student.studentNumber,
          gender: student.gender
        },
        class: student.class,
        feeStatus,
        hasReportCard: !!reportCard,
        reportCard,
        isEligible,
        isPicked: !!pickup,
        pickup: pickup || null
      });
    }

    return {
      summary: {
        totalStudents,
        pickedCount,
        eligibleCount,
        notEligibleCount,
        noReportCount,
        pickUpRate: totalStudents > 0 ? ((pickedCount / totalStudents) * 100).toFixed(1) : 0
      },
      students: results
    };
  },

  // ================= GET STUDENT COMBINATION (Uganda Secondary) =================
  async getStudentCombination(studentId) {
    const student = await Student.findByPk(studentId, {
      include: [
        { model: Class, as: 'class' }
      ]
    });

    if (!student) throw new Error('Student not found');

    const subjects = await Subject.findAll({
      where: { classId: student.classId },
      include: [
        { model: Class, as: 'class' }
      ]
    });

    const marks = await Mark.findAll({
      where: { studentId },
      include: [
        { model: Subject, as: 'subject' }
      ]
    });

    // Determine class level
    const className = student.class?.className || '';
    let level = 'Unknown';
    let combination = [];

    if (className.includes('S.1') || className.includes('S1')) {
      level = 'Senior 1';
      combination = subjects.map(s => s.subjectName);
    } else if (className.includes('S.2') || className.includes('S2')) {
      level = 'Senior 2';
      combination = subjects.map(s => s.subjectName);
    } else if (className.includes('S.3') || className.includes('S3')) {
      level = 'Senior 3';
      // Identify sciences vs arts
      const scienceSubjects = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Additional Mathematics'];
      const artsSubjects = ['History', 'Geography', 'Economics', 'Literature', 'Christian Religious Education', 'Islamic Religious Education'];
      const commercialSubjects = ['Commerce', 'Accounting', 'Economics', 'Mathematics'];
      
      const scienceCount = subjects.filter(s => scienceSubjects.includes(s.subjectName)).length;
      const artsCount = subjects.filter(s => artsSubjects.includes(s.subjectName)).length;
      const commercialCount = subjects.filter(s => commercialSubjects.includes(s.subjectName)).length;
      
      if (scienceCount >= 3) combination = ['Science', ...subjects.filter(s => scienceSubjects.includes(s.subjectName)).map(s => s.subjectName)];
      else if (artsCount >= 3) combination = ['Arts', ...subjects.filter(s => artsSubjects.includes(s.subjectName)).map(s => s.subjectName)];
      else if (commercialCount >= 3) combination = ['Commercial', ...subjects.filter(s => commercialSubjects.includes(s.subjectName)).map(s => s.subjectName)];
      else combination = subjects.map(s => s.subjectName);
    } else if (className.includes('S.4') || className.includes('S4')) {
      level = 'Senior 4';
      combination = subjects.map(s => s.subjectName);
    } else if (className.includes('S.5') || className.includes('S5')) {
      level = 'Senior 5';
      // A-Level combinations
      const scienceSubjects = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Additional Mathematics'];
      const artsSubjects = ['History', 'Geography', 'Economics', 'Literature', 'Divinity', 'Christian Religious Education'];
      const commercialSubjects = ['Commerce', 'Accounting', 'Economics', 'Mathematics'];
      
      const scienceCount = subjects.filter(s => scienceSubjects.includes(s.subjectName)).length;
      const artsCount = subjects.filter(s => artsSubjects.includes(s.subjectName)).length;
      const commercialCount = subjects.filter(s => commercialSubjects.includes(s.subjectName)).length;
      
      if (scienceCount >= 3) combination = ['Science', ...subjects.filter(s => scienceSubjects.includes(s.subjectName)).map(s => s.subjectName)];
      else if (artsCount >= 3) combination = ['Arts', ...subjects.filter(s => artsSubjects.includes(s.subjectName)).map(s => s.subjectName)];
      else if (commercialCount >= 3) combination = ['Commercial', ...subjects.filter(s => commercialSubjects.includes(s.subjectName)).map(s => s.subjectName)];
      else combination = subjects.map(s => s.subjectName);
    } else if (className.includes('S.6') || className.includes('S6')) {
      level = 'Senior 6';
      // A-Level combinations
      const scienceSubjects = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Additional Mathematics'];
      const artsSubjects = ['History', 'Geography', 'Economics', 'Literature', 'Divinity', 'Christian Religious Education'];
      const commercialSubjects = ['Commerce', 'Accounting', 'Economics', 'Mathematics'];
      
      const scienceCount = subjects.filter(s => scienceSubjects.includes(s.subjectName)).length;
      const artsCount = subjects.filter(s => artsSubjects.includes(s.subjectName)).length;
      const commercialCount = subjects.filter(s => commercialSubjects.includes(s.subjectName)).length;
      
      if (scienceCount >= 3) combination = ['Science', ...subjects.filter(s => scienceSubjects.includes(s.subjectName)).map(s => s.subjectName)];
      else if (artsCount >= 3) combination = ['Arts', ...subjects.filter(s => artsSubjects.includes(s.subjectName)).map(s => s.subjectName)];
      else if (commercialCount >= 3) combination = ['Commercial', ...subjects.filter(s => commercialSubjects.includes(s.subjectName)).map(s => s.subjectName)];
      else combination = subjects.map(s => s.subjectName);
    } else {
      combination = subjects.map(s => s.subjectName);
    }

    // Get marks with grades for each subject
    const subjectMarks = subjects.map(subject => {
      const mark = marks.find(m => m.subjectId === subject.id);
      return {
        subject: subject.subjectName,
        score: mark?.score || null,
        grade: mark?.score ? this.getUgandaGrade(mark.score) : 'N/A'
      };
    });

    return {
      student,
      level,
      combination,
      subjects: subjectMarks,
      totalSubjects: subjects.length
    };
  },

  // ================= UGANDA GRADING SYSTEM =================
  getUgandaGrade(score) {
    if (score >= 80) return 'D1';
    if (score >= 75) return 'D2';
    if (score >= 70) return 'C3';
    if (score >= 65) return 'C4';
    if (score >= 60) return 'C5';
    if (score >= 55) return 'C6';
    if (score >= 50) return 'P7';
    if (score >= 45) return 'P8';
    return 'F9';
  },

  // ================= GET REPORT PICKUP STATISTICS =================
  async getPickupStatistics(term, academicYear) {
    const totalPickups = await ReportPickup.count({
      where: { term, academicYear, isPicked: true }
    });

    const totalStudents = await Student.count();

    const pickupsByClass = await ReportPickup.findAll({
      where: { term, academicYear, isPicked: true },
      include: [
        {
          model: Student,
          as: 'student',
          include: [{ model: Class, as: 'class' }]
        }
      ]
    });

    const classStats = {};
    pickupsByClass.forEach(pickup => {
      const className = pickup.student?.class?.className || 'Unknown';
      if (!classStats[className]) {
        classStats[className] = 0;
      }
      classStats[className]++;
    });

    // Get daily pickup trends
    const dailyPickups = await ReportPickup.findAll({
      where: { term, academicYear, isPicked: true },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('pickupDate')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('pickupDate'))],
      order: [[sequelize.fn('DATE', sequelize.col('pickupDate')), 'DESC']],
      limit: 30
    });

    return {
      totalPickups,
      totalStudents,
      pickUpRate: totalStudents > 0 ? ((totalPickups / totalStudents) * 100).toFixed(1) : 0,
      byClass: classStats,
      dailyTrends: dailyPickups
    };
  }
};

module.exports = ReportAnalyticsService;
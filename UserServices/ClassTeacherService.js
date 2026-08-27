const db = require('../models');
const { Op } = require('sequelize');

class ClassTeacherService {
  // Get class teacher's dashboard data
  async getClassTeacherDashboard(teacherId) {
    // 1. Get the teacher with their class
    const teacher = await db.Teacher.findByPk(teacherId, {
      include: [{ model: db.Class, as: 'class' }],
    });
    
    if (!teacher) throw new Error('Teacher not found');
    if (!teacher.isClassTeacher) throw new Error('Teacher is not a class teacher');
    
    const classId = teacher.classId;
    
    // 2. Get all students in this class
    const students = await db.Student.findAll({
      where: { classId, status: 'Active' },
      include: [
        { model: db.Class, as: 'class' },
        { model: db.Fee, as: 'fees' },
        {
          model: db.Mark,
          as: 'marks',
          include: [{ model: db.Subject, as: 'subject' }],
        },
      ],
      order: [['fullName', 'ASC']],
    });
    
    // 3. Get all subjects for this class
    const subjects = await db.Subject.findAll({
      include: [
        {
          model: db.Class,
          as: 'classes',
          where: { id: classId },
          through: { attributes: [] },
        },
      ],
    });
    
    // 4. Calculate statistics for each student
    const studentData = students.map((student) => {
      const marks = student.marks || [];
      const totalSubjects = subjects.length;
      const subjectsWithMarks = marks.filter((m) => m.score !== null && m.score !== undefined);
      const subjectsWithoutMarks = totalSubjects - subjectsWithMarks.length;
      
      const totalScore = subjectsWithMarks.reduce((sum, m) => sum + Number(m.score), 0);
      const average = subjectsWithMarks.length > 0 ? totalScore / subjectsWithMarks.length : 0;
      
      // Check if student has all subjects marked
      const isComplete = subjectsWithoutMarks === 0 && totalSubjects > 0;
      
      // Determine pass/fail (assuming 50% is passing)
      const passedSubjects = subjectsWithMarks.filter((m) => Number(m.score) >= 50);
      const failedSubjects = subjectsWithMarks.filter((m) => Number(m.score) < 50);
      const hasAllPassed = failedSubjects.length === 0 && totalSubjects > 0;
      
      return {
        student: {
          id: student.id,
          fullName: student.fullName,
          studentNumber: student.studentNumber,
          gender: student.gender,
        },
        marks: subjects.map((subject) => {
          const mark = marks.find((m) => m.subjectId === subject.id);
          return {
            subjectId: subject.id,
            subjectName: subject.subjectName,
            score: mark?.score || null,
            isComplete: mark?.score !== null && mark?.score !== undefined,
          };
        }),
        summary: {
          totalSubjects,
          subjectsWithMarks: subjectsWithMarks.length,
          subjectsWithoutMarks,
          totalScore,
          average: Math.round(average * 10) / 10,
          isComplete,
          passedSubjects: passedSubjects.length,
          failedSubjects: failedSubjects.length,
          hasAllPassed,
          status: isComplete && hasAllPassed ? '✅ Eligible for Promotion' :
                  isComplete && !hasAllPassed ? '❌ Needs to Repeat' :
                  '⏳ Awaiting Marks',
        },
      };
    });
    
    // 5. Overall class statistics
    const classStats = {
      totalStudents: students.length,
      completedStudents: studentData.filter((s) => s.summary.isComplete).length,
      eligibleForPromotion: studentData.filter((s) => s.summary.hasAllPassed && s.summary.isComplete).length,
      needsToRepeat: studentData.filter((s) => s.summary.isComplete && !s.summary.hasAllPassed).length,
      awaitingMarks: studentData.filter((s) => !s.summary.isComplete).length,
      averageClassScore: studentData.reduce((sum, s) => sum + s.summary.average, 0) / students.length || 0,
    };
    
    return {
      teacher,
      classStats,
      students: studentData,
      subjects,
    };
  }
  
  // Get student details for promotion decision
  async getStudentPromotionDetails(studentId) {
    const student = await db.Student.findByPk(studentId, {
      include: [
        { model: db.Class, as: 'class' },
        {
          model: db.Mark,
          as: 'marks',
          include: [
            { model: db.Subject, as: 'subject' },
            { model: db.Teacher, as: 'teacher' },
          ],
        },
        { model: db.Fee, as: 'fees' },
        { model: db.ReportCard, as: 'reportCards' },
      ],
    });
    
    if (!student) throw new Error('Student not found');
    
    // Get promotion history
    const promotionHistory = await db.StudentPromotion.findAll({
      where: { studentId },
      include: [
        { model: db.Class, as: 'fromClass' },
        { model: db.Class, as: 'toClass' },
      ],
      order: [['promotionDate', 'DESC']],
    });
    
    return { student, promotionHistory };
  }
  
  // Finalize promotion decisions
  async finalizePromotionDecision(classId, decisions) {
    // decisions: [{ studentId, promote: true/false, remarks }]
    const t = await db.sequelize.transaction();
    
    try {
      const results = [];
      const classTeacher = await db.Teacher.findOne({
        where: { classId, isClassTeacher: true },
      });
      
      if (!classTeacher) throw new Error('No class teacher assigned for this class');
      
      const currentTerm = 'Term 3';
      const currentYear = new Date().getFullYear().toString();
      const nextClass = await db.Class.findOne({
        where: { id: classId + 1 }, // Assumes class IDs are sequential
      });
      
      if (!nextClass) throw new Error('Next class not found. Please create the next class first.');
      
      for (const decision of decisions) {
        const student = await db.Student.findByPk(decision.studentId, { transaction: t });
        if (!student) continue;
        
        // Create promotion record
        const promotion = await db.StudentPromotion.create({
          studentId: student.id,
          fromClassId: classId,
          toClassId: decision.promote ? nextClass.id : classId, // Repeat if not promoted
          promotedBy: classTeacher.id,
          academicYear: currentYear,
          term: currentTerm,
          remarks: decision.remarks || (decision.promote ? 'Promoted' : 'Repeating'),
        }, { transaction: t });
        
        if (decision.promote) {
          student.classId = nextClass.id;
          await student.save({ transaction: t });
        }
        
        results.push(promotion);
      }
      
      await t.commit();
      return results;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = new ClassTeacherService();
const db = require('../models');

const Student = db.Student;
const Mark = db.Mark;
const Subject = db.Subject;
const ReportCard = db.ReportCard;

module.exports = {

  // 📄 GET SINGLE STUDENT REPORT CARD
  async getStudentReportCard(req, res) {

    try {

      const { studentId } = req.params;

      const student = await Student.findByPk(studentId, {
        include: [
          {
            model: Mark,
            as: 'marks',
            include: [
              { model: Subject, as: 'subject' }
            ]
          }
        ]
      });

      if (!student) {
        return res.status(404).json({
          message: "Student not found"
        });
      }

      let totalMarks = 0;

      const results = student.marks.map(mark => {

        const score = Number(mark.score || 0);
        const grade = getUgandaGrade(score);

        totalMarks += score;

        return {
          subject: mark.subject?.subjectName || "Unknown",
          score,
          grade,
          remark: getRemark(score)
        };
      });

      const average = student.marks.length
        ? totalMarks / student.marks.length
        : 0;

      // OPTIONAL: save report card record
      await ReportCard.create({
        studentId: student.id,
        totalMarks,
        average,
        term: "Term 1",
        academicYear: "2026",
        teacherComment: "",
        headTeacherComment: ""
      });

      res.json({
        student: {
          id: student.id,
          studentNumber: student.studentNumber,
          fullName: student.fullName
        },
        totalMarks,
        average,
        results
      });

    } catch (error) {

      res.status(500).json({
        message: "Failed to generate report card",
        error: error.message
      });

    }
  }
};

// 🇺🇬 UGANDA GRADING SYSTEM
function getUgandaGrade(score) {
  if (score >= 80) return "D1";
  if (score >= 75) return "D2";
  if (score >= 70) return "C3";
  if (score >= 65) return "C4";
  if (score >= 60) return "C5";
  if (score >= 55) return "C6";
  if (score >= 50) return "P7";
  if (score >= 45) return "P8";
  return "F9";
}

// 📝 COMMENTS
function getRemark(score) {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Very Good";
  if (score >= 60) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}
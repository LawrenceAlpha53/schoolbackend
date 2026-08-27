const db = require('../models');

const Student = db.Student;
const Mark = db.Mark;
const Subject = db.Subject;
const ReportCard = db.ReportCard;

const ReportService = {

  async generateReportCard(studentId) {

    const student = await Student.findByPk(studentId);

    if (!student) throw new Error("Student not found");

    const marks = await Mark.findAll({
      where: { studentId },
      include: [{ model: Subject, as: 'subject' }]
    });

    let total = 0;
    let results = [];

    for (const m of marks) {

      const score = Number(m.score || 0);
      const grade = getUgandaGrade(score);

      total += score;

      results.push({
        subject: m.subject?.subjectName || "Unknown",
        score,
        grade,
        comment: getSubjectComment(score)
      });
    }

    const average = marks.length ? total / marks.length : 0;

    const report = await ReportCard.create({
      studentId,
      totalMarks: total,
      average,
      term: "Term 1",
      academicYear: "2026",
      teacherComment: "",
      headTeacherComment: ""
    });

    return { student, totalMarks: total, average, results, report };
  },

  async getClassRanking(classId, term = "Term 1", academicYear = "2026") {

    const students = await Student.findAll({
      where: { classId },
      include: [{ model: Mark, as: "marks" }]
    });

    let ranking = [];

    for (const s of students) {

      let total = 0;
      let count = 0;

      s.marks.forEach(m => {
        total += Number(m.score || 0);
        count++;
      });

      ranking.push({
        studentId: s.id,
        fullName: s.fullName,
        totalMarks: total,
        average: count ? total / count : 0
      });
    }

    ranking.sort((a, b) => b.average - a.average);

    return ranking.map((r, i) => ({
      position: i + 1,
      ...r
    }));
  },

  async getPrintableReportCard(studentId) {

    const student = await Student.findByPk(studentId, {
      include: [{ model: db.Class, as: "class" }]
    });

    if (!student) throw new Error("Student not found");

    const marks = await Mark.findAll({
      where: { studentId },
      include: [{ model: Subject, as: 'subject' }]
    });

    let total = 0;
    let results = [];

    for (const m of marks) {

      const score = Number(m.score || 0);
      const grade = getUgandaGrade(score);

      total += score;

      results.push({
        subject: m.subject?.subjectName || "Unknown",
        score,
        grade,
        comment: getSubjectComment(score)
      });
    }

    const average = marks.length ? total / marks.length : 0;

    const ranking = await this.getClassRanking(student.classId);

    const position = ranking.find(r => r.studentId === student.id);

    const report = await ReportCard.create({
      studentId,
      totalMarks: total,
      average,
      term: "Term 1",
      academicYear: "2026"
    });

    return {
      student: {
        id: student.id,
        studentNumber: student.studentNumber,
        fullName: student.fullName,
        class: student.class?.className
      },
      totalMarks: total,
      average,
      position: position?.position || null,
      results,
      report
    };
  }
};

// 🇺🇬 GRADING SYSTEM
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

function getSubjectComment(score) {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Very Good";
  if (score >= 60) return "Good";
  if (score >= 50) return "Fair";
  return "Poor performance";
}

module.exports = ReportService;
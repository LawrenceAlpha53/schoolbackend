const db = require('../models');
const Student = db.Student;
const Class = db.Class;

const StudentService = {
  // ========== CREATE STUDENT ==========
  async createStudent(data) {
    // ----- FIX: Validate and convert classId -----
    let classId = data.classId;
    if (classId !== undefined && classId !== null && classId !== '') {
      const parsed = parseInt(classId, 10);
      if (isNaN(parsed)) {
        throw new Error('Invalid classId: must be a number');
      }
      classId = parsed;
    } else {
      throw new Error('classId is required. Please select a class.');
    }

    // Check that the class exists
    const classRecord = await Class.findByPk(classId);
    if (!classRecord) {
      throw new Error(`Class with ID ${classId} does not exist. Please select a valid class.`);
    }

    // Generate student number if not provided
    if (!data.studentNumber) {
      const count = await Student.count();
      data.studentNumber = `STU-${String(count + 1).padStart(4, '0')}`;
    }

    // Prepare data
    const studentData = {
      studentNumber: data.studentNumber,
      fullName: data.fullName,
      gender: data.gender || 'Male',
      dateOfBirth: data.dateOfBirth || null,
      classId: classId,
      parentName: data.parentName || null,
      parentPhone: data.parentPhone || null,
      address: data.address || null,
      status: data.status || 'Active',
      nationality: data.nationality || 'Ugandan',
      medicalcondition: data.medicalcondition || 'none'
    };

    const student = await Student.create(studentData);
    return await Student.findByPk(student.id, {
      include: [{ model: Class, as: 'class' }]
    });
  },

  // ========== GET ALL STUDENTS ==========
  async getStudents() {
    return await Student.findAll({
      include: [{ model: Class, as: 'class' }],
      order: [['createdAt', 'DESC']]
    });
  },

  // ========== GET SINGLE STUDENT ==========
  async getStudent(id) {
    const student = await Student.findByPk(id, {
      include: [
        { model: Class, as: 'class' },
        { model: db.Fee, as: 'fees' },
        { model: db.Mark, as: 'marks' }
      ]
    });
    if (!student) {
      throw new Error('Student not found');
    }
    return student;
  },

  // ========== UPDATE STUDENT ==========
  async updateStudent(id, data) {
    const student = await Student.findByPk(id);
    if (!student) {
      throw new Error('Student not found');
    }

    // ----- FIX: Validate classId if provided -----
    if (data.classId !== undefined) {
      let classId = data.classId;
      if (classId !== null && classId !== '') {
        const parsed = parseInt(classId, 10);
        if (isNaN(parsed)) {
          throw new Error('Invalid classId: must be a number');
        }
        classId = parsed;
        // Check class exists
        const classRecord = await Class.findByPk(classId);
        if (!classRecord) {
          throw new Error(`Class with ID ${classId} does not exist`);
        }
        data.classId = classId;
      } else {
        // If they send empty, remove it (optional)
        delete data.classId;
      }
    }

    await student.update(data);
    return await Student.findByPk(id, {
      include: [{ model: Class, as: 'class' }]
    });
  },

  // ========== DELETE STUDENT ==========
  async deleteStudent(id) {
    const student = await Student.findByPk(id);
    if (!student) {
      throw new Error('Student not found');
    }
    await student.destroy();
    return true;
  },

  // ========== GET STUDENTS BY CLASS ==========
  async getStudentsByClass(classId) {
    return await Student.findAll({
      where: { classId },
      include: [{ model: Class, as: 'class' }],
      order: [['fullName', 'ASC']]
    });
  },

  // ========== GET STUDENT STATS ==========
  async getStudentStats() {
    const total = await Student.count();
    const active = await Student.count({ where: { status: 'Active' } });
    const byGender = await Student.findAll({
      attributes: [
        'gender',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
      ],
      group: ['gender']
    });

    return { total, active, byGender };
  }
};

module.exports = StudentService;
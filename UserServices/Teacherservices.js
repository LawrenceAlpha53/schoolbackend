const db = require('../models');

class TeacherService {

  async getTeachers() {
    try {
      const teachers = await db.Teacher.findAll({
        include: [
          { model: db.Class, as: 'class', attributes: ['id', 'className'] },
          { model: db.Users, as: 'user', attributes: ['id', 'Fname', 'Lname', 'Email'] },
          { model: db.Subject, as: 'subjects', through: { attributes: [] }, attributes: ['id', 'subjectName', 'subjectCode'] }
        ],
        order: [['fullName', 'ASC']]
      });
      console.log(`✅ Found ${teachers.length} teachers with subjects`);
      return teachers;
    } catch (error) {
      console.error('Get teachers error:', error);
      throw error;
    }
  }

  async assignClassTeacher(teacherId, classId) {
    await db.Teacher.update(
      { isClassTeacher: false },
      { where: { classId, isClassTeacher: true } }
    );
    const teacher = await db.Teacher.findByPk(teacherId);
    if (!teacher) throw new Error('Teacher not found');
    await teacher.update({ classId, isClassTeacher: true });
    return teacher;
  }

  async getClassTeacher(classId) {
    return await db.Teacher.findOne({
      where: { classId, isClassTeacher: true },
      include: [
        { model: db.Class, as: 'class' },
        { model: db.Users, as: 'user' },
      ],
    });
  }

  async getTeacher(id) {
    try {
      const teacher = await db.Teacher.findByPk(id, {
        include: [
          { model: db.Class, as: 'class', attributes: ['id', 'className'] },
          { model: db.Users, as: 'user', attributes: ['id', 'Fname', 'Lname', 'Email'] },
          { model: db.Subject, as: 'subjects', through: { attributes: [] }, attributes: ['id', 'subjectName', 'subjectCode'] }
        ]
      });
      if (!teacher) throw new Error('Teacher not found');
      return teacher;
    } catch (error) {
      console.error('Get teacher error:', error);
      throw error;
    }
  }

  // ========== FIXED CREATE TEACHER ==========
  async createTeacher(data) {
    try {
      const { subjectIds, ...teacherData } = data;

      // 🔥 Auto‑generate employeeNumber if missing
      if (!teacherData.employeeNumber) {
        const count = await db.Teacher.count();
        teacherData.employeeNumber = `EMP-${String(count + 1).padStart(5, '0')}`;
        console.log(`✅ Auto‑generated employeeNumber: ${teacherData.employeeNumber}`);
      }

      const teacher = await db.Teacher.create(teacherData);
      if (subjectIds && subjectIds.length > 0) {
        await teacher.setSubjects(subjectIds);
      }
      return this.getTeacher(teacher.id);
    } catch (error) {
      console.error('Create teacher error:', error);
      throw error;
    }
  }

  async updateTeacher(id, data) {
    try {
      const teacher = await db.Teacher.findByPk(id);
      if (!teacher) throw new Error('Teacher not found');
      
      const { subjectIds, ...updateData } = data;
      
      if (updateData.classId !== undefined) {
        teacher.classId = updateData.classId;
      }
      if (updateData.subjectId !== undefined) {
        teacher.subjectId = updateData.subjectId;
      }
      
      const otherFields = { ...updateData };
      delete otherFields.classId;
      delete otherFields.subjectId;
      
      await teacher.update(otherFields);
      
      if (subjectIds !== undefined) {
        await teacher.setSubjects(subjectIds);
      }
      
      return this.getTeacher(id);
    } catch (error) {
      console.error('Update teacher error:', error);
      throw error;
    }
  }

  async deleteTeacher(id) {
    try {
      const teacher = await db.Teacher.findByPk(id);
      if (!teacher) throw new Error('Teacher not found');
      await teacher.destroy();
      return true;
    } catch (error) {
      console.error('Delete teacher error:', error);
      throw error;
    }
  }

  async getCurrentTeacher(userId) {
    try {
      const teacher = await db.Teacher.findOne({
        where: { userId },
        include: [
          { model: db.Class, as: 'class' },
          { model: db.Users, as: 'user' },
          { model: db.Subject, as: 'subjects', through: { attributes: [] } }
        ]
      });
      if (!teacher) throw new Error('Teacher not found');
      return teacher;
    } catch (error) {
      console.error('Get current teacher error:', error);
      throw error;
    }
  }

  async getMyStudents(teacherId) {
    try {
      const teacher = await db.Teacher.findByPk(teacherId, {
        include: [
          {
            model: db.Class,
            as: 'class',
            include: [
              { model: db.Student, as: 'students' }
            ]
          }
        ]
      });
      if (!teacher) throw new Error('Teacher not found');
      return teacher.class?.students || [];
    } catch (error) {
      console.error('Get my students error:', error);
      throw error;
    }
  }

  async getMyClasses(teacherId) {
    try {
      const teacher = await db.Teacher.findByPk(teacherId, {
        include: [{ model: db.Class, as: 'class' }]
      });
      if (!teacher) throw new Error('Teacher not found');
      return teacher.class ? [teacher.class] : [];
    } catch (error) {
      console.error('Get my classes error:', error);
      throw error;
    }
  }

  async getMySubjects(teacherId) {
    try {
      const teacher = await db.Teacher.findByPk(teacherId, {
        include: [
          { model: db.Subject, as: 'subjects', through: { attributes: [] } }
        ]
      });
      if (!teacher) throw new Error('Teacher not found');
      return teacher.subjects || [];
    } catch (error) {
      console.error('Get my subjects error:', error);
      throw error;
    }
  }
}

module.exports = new TeacherService();
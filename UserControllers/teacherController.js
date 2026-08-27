// UserControllers/teacherController.js - COMPLETE FIXED VERSION
const db = require('../models');

const TeacherController = {

  // ================= CREATE TEACHER =================
  async createTeacher(req, res, next) {
    try {
      const { subjectIds, ...teacherData } = req.body;
      console.log('📌 CREATE TEACHER - Data:', req.body);

      const teacher = await db.Teacher.create(teacherData);
      if (subjectIds && subjectIds.length > 0) {
        await teacher.setSubjects(subjectIds);
      }

      const createdTeacher = await db.Teacher.findByPk(teacher.id, {
        include: [
          { model: db.Class, as: 'class', attributes: ['id', 'className'] },
          { model: db.Subject, as: 'subjects', through: { attributes: [] }, attributes: ['id', 'subjectName'] }
        ]
      });

      res.status(201).json({ success: true, data: createdTeacher });
    } catch (error) {
      console.error('❌ CREATE TEACHER ERROR:', error);
      next(error);
    }
  },

  // ================= ASSIGN CLASS TEACHER =================
  async assignClassTeacher(req, res, next) {
    try {
      const { id } = req.params;
      const { classId } = req.body;

      const teacher = await db.Teacher.findByPk(id);
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

      await teacher.update({ isClassTeacher: true, classId: classId || teacher.classId });

      const updatedTeacher = await db.Teacher.findByPk(id, {
        include: [ { model: db.Class, as: 'class' }, { model: db.Subject, as: 'subjects' } ]
      });

      res.json({ success: true, data: updatedTeacher, message: 'Teacher assigned as class teacher' });
    } catch (error) {
      console.error('❌ ASSIGN CLASS TEACHER ERROR:', error);
      next(error);
    }
  },

  // ================= GET CLASS TEACHER =================
  async getClassTeacher(req, res, next) {
    try {
      const { classId } = req.params;
      const teacher = await db.Teacher.findOne({
        where: { classId, isClassTeacher: true },
        include: [ { model: db.Class, as: 'class' }, { model: db.Subject, as: 'subjects' } ]
      });
      if (!teacher) return res.status(404).json({ success: false, message: 'No class teacher assigned' });
      res.json({ success: true, data: teacher });
    } catch (error) {
      console.error('❌ GET CLASS TEACHER ERROR:', error);
      next(error);
    }
  },

  // ================= GET ALL TEACHERS =================
  async getTeachers(req, res, next) {
    try {
      const teachers = await db.Teacher.findAll({
        include: [
          { model: db.Class, as: 'class', attributes: ['id', 'className'] },
          { model: db.Subject, as: 'subjects', through: { attributes: [] }, attributes: ['id', 'subjectName'] }
        ],
        order: [['fullName', 'ASC']]
      });
      res.json({ success: true, data: teachers });
    } catch (error) {
      console.error('❌ GET TEACHERS ERROR:', error);
      next(error);
    }
  },

  // ================= GET SINGLE TEACHER =================
  async getTeacher(req, res, next) {
    try {
      const { id } = req.params;
      const teacher = await db.Teacher.findByPk(id, {
        include: [
          { model: db.Class, as: 'class' },
          { model: db.Subject, as: 'subjects' },
          { model: db.Users, as: 'user', attributes: ['id', 'Fname', 'Lname', 'Email'] }
        ]
      });
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
      res.json({ success: true, data: teacher });
    } catch (error) {
      console.error('❌ GET TEACHER ERROR:', error);
      next(error);
    }
  },

  // ================= UPDATE TEACHER =================
  async updateTeacher(req, res, next) {
    try {
      const { id } = req.params;
      const { classId, subjectId, subjectIds, ...otherData } = req.body;

      const teacher = await db.Teacher.findByPk(id);
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

      const updatePayload = { ...otherData };
      if (classId !== undefined) updatePayload.classId = classId === '' ? null : parseInt(classId);

      await teacher.update(updatePayload);

      let finalSubjectIds = [];
      if (subjectId && subjectId !== '') finalSubjectIds = [parseInt(subjectId)];
      else if (subjectIds && Array.isArray(subjectIds) && subjectIds.length) finalSubjectIds = subjectIds.map(id => parseInt(id));
      else if (subjectId === null || subjectId === '' || subjectId === 'null') finalSubjectIds = [];

      if (finalSubjectIds.length) await teacher.setSubjects(finalSubjectIds);
      else if (subjectId !== undefined || subjectIds !== undefined) await teacher.setSubjects([]);

      const updatedTeacher = await db.Teacher.findByPk(id, {
        include: [ { model: db.Class, as: 'class' }, { model: db.Subject, as: 'subjects' }, { model: db.Users, as: 'user' } ]
      });

      res.json({ success: true, data: updatedTeacher, message: 'Teacher updated' });
    } catch (error) {
      console.error('❌ UPDATE TEACHER ERROR:', error);
      next(error);
    }
  },

  // ================= DELETE TEACHER (COMPLETE – NO TRACE) =================
  async deleteTeacher(req, res, next) {
    const transaction = await db.sequelize.transaction();
    try {
      const teacherId = req.params.id;
      console.log('📌 DELETE TEACHER - ID:', teacherId);

      // 1. Find the teacher
      const teacher = await db.Teacher.findByPk(teacherId, { transaction });
      if (!teacher) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Teacher not found' });
      }

      // 2. If linked to a user, delete that user (to remove all traces)
      if (teacher.userId) {
        const user = await db.Users.findByPk(teacher.userId, { transaction });
        if (user) {
          await user.destroy({ transaction });
          console.log(`✅ Deleted associated user ${teacher.userId}`);
        }
      }

      // 3. Remove the teacher from any class where they are class teacher (classTeacher string)
      await db.Class.update(
        { classTeacher: null },
        { where: { classTeacher: teacher.fullName }, transaction }
      );

      // 4. Delete all related records (cascade is already set, but we do it explicitly for safety)
      await db.Timetable.destroy({ where: { teacherId }, transaction });
      await db.TeacherAttendance.destroy({ where: { teacherId }, transaction });
      await db.TeacherAllowance.destroy({ where: { teacherId }, transaction });
      await db.TeacherAdvance.destroy({ where: { teacherId }, transaction });
      await db.TeacherLoan.destroy({ where: { teacherId }, transaction });
      await db.TeacherDocument.destroy({ where: { teacherId }, transaction });
      await db.TeacherLeave.destroy({ where: { teacherId }, transaction });
      await db.Mark.destroy({ where: { teacherId }, transaction });
      if (db.TeacherSubject) {
        await db.TeacherSubject.destroy({ where: { teacherId }, transaction });
      }

      // 5. Delete the teacher itself
      await teacher.destroy({ transaction });

      // Commit transaction
      await transaction.commit();

      res.json({
        success: true,
        message: 'Teacher and all associated records deleted permanently'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('❌ DELETE TEACHER ERROR:', error);
      next(error);
    }
  },

  // ================= GET CURRENT TEACHER =================
  async getCurrentTeacher(req, res, next) {
    try {
      const userId = req.user.id;
      const teacher = await db.Teacher.findOne({
        where: { userId },
        include: [ { model: db.Class, as: 'class' }, { model: db.Subject, as: 'subjects' }, { model: db.Users, as: 'user' } ]
      });
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found for this user' });
      res.json({ success: true, data: teacher });
    } catch (error) {
      console.error('❌ GET CURRENT TEACHER ERROR:', error);
      next(error);
    }
  },

  // ================= GET MY STUDENTS =================
  async getMyStudents(req, res, next) {
    try {
      const userId = req.user.id;
      const teacher = await db.Teacher.findOne({
        where: { userId },
        include: [ { model: db.Class, as: 'class', include: [ { model: db.Student, as: 'students' } ] } ]
      });
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
      res.json({ success: true, data: teacher.class?.students || [] });
    } catch (error) {
      console.error('❌ GET MY STUDENTS ERROR:', error);
      next(error);
    }
  },

  // ================= GET MY CLASSES =================
  async getMyClasses(req, res, next) {
    try {
      const userId = req.user.id;
      const teacher = await db.Teacher.findOne({
        where: { userId },
        include: [ { model: db.Class, as: 'class' } ]
      });
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
      res.json({ success: true, data: teacher.class ? [teacher.class] : [] });
    } catch (error) {
      console.error('❌ GET MY CLASSES ERROR:', error);
      next(error);
    }
  },

  // ================= GET MY SUBJECTS =================
  async getMySubjects(req, res, next) {
    try {
      const userId = req.user.id;
      const teacher = await db.Teacher.findOne({
        where: { userId },
        include: [ { model: db.Subject, as: 'subjects', through: { attributes: [] } } ]
      });
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
      res.json({ success: true, data: teacher.subjects || [] });
    } catch (error) {
      console.error('❌ GET MY SUBJECTS ERROR:', error);
      next(error);
    }
  },

  // ================= GET TEACHER CLASSES (BY TEACHER ID) =================
  async getTeacherClasses(req, res, next) {
    try {
      const { id } = req.params;
      const teacher = await db.Teacher.findByPk(id, {
        include: [ { model: db.Class, as: 'class' } ]
      });
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
      res.json({ success: true, data: teacher.class ? [teacher.class] : [] });
    } catch (error) {
      console.error('❌ GET TEACHER CLASSES ERROR:', error);
      next(error);
    }
  },

  // ================= GET TEACHER STUDENTS (BY TEACHER ID) =================
  async getTeacherStudents(req, res, next) {
    try {
      const { id } = req.params;
      const teacher = await db.Teacher.findByPk(id, { include: [ { model: db.Class, as: 'class' } ] });
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
      if (!teacher.classId) return res.json({ success: true, data: [] });
      const students = await db.Student.findAll({
        where: { classId: teacher.classId },
        include: [ { model: db.Class, as: 'class' } ]
      });
      res.json({ success: true, data: students });
    } catch (error) {
      console.error('❌ GET TEACHER STUDENTS ERROR:', error);
      next(error);
    }
  },

  // ================= FORCE DELETE (kept as backup) =================
  async forceDeleteTeacher(req, res, next) {
    const transaction = await db.sequelize.transaction();
    try {
      const teacherId = req.params.id;
      const teacher = await db.Teacher.findByPk(teacherId, { transaction });
      if (!teacher) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Teacher not found' });
      }

      // Same as deleteTeacher but we can keep it separate if needed
      if (teacher.userId) {
        const user = await db.Users.findByPk(teacher.userId, { transaction });
        if (user) await user.destroy({ transaction });
      }

      await db.Class.update(
        { classTeacher: null },
        { where: { classTeacher: teacher.fullName }, transaction }
      );

      await db.Timetable.destroy({ where: { teacherId }, transaction });
      await db.TeacherAttendance.destroy({ where: { teacherId }, transaction });
      await db.TeacherAllowance.destroy({ where: { teacherId }, transaction });
      await db.TeacherAdvance.destroy({ where: { teacherId }, transaction });
      await db.TeacherLoan.destroy({ where: { teacherId }, transaction });
      await db.TeacherDocument.destroy({ where: { teacherId }, transaction });
      await db.TeacherLeave.destroy({ where: { teacherId }, transaction });
      await db.Mark.destroy({ where: { teacherId }, transaction });
      if (db.TeacherSubject) {
        await db.TeacherSubject.destroy({ where: { teacherId }, transaction });
      }

      await teacher.destroy({ transaction });
      await transaction.commit();

      res.json({
        success: true,
        message: 'Teacher force-deleted permanently'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('❌ FORCE DELETE TEACHER ERROR:', error);
      next(error);
    }
  }
};

module.exports = TeacherController;
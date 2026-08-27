const db = require('../models');
const { Op } = require('sequelize');

const TimetableController = {

  // ================= GET ALL TIMETABLES =================
  async getAllTimetables(req, res, next) {
    try {
      const { term, academicYear, classId, teacherId } = req.query;
      
      const where = {};
      if (term) where.term = term;
      if (academicYear) where.academicYear = academicYear;
      
      // If teacher, force their own class and teacher ID
      if (req.user.role === 'teacher') {
        where.classId = req.teacherClassId;
        where.teacherId = req.teacherId;
      } else {
        if (classId) where.classId = parseInt(classId);
        if (teacherId) where.teacherId = parseInt(teacherId);
      }
      
      const timetables = await db.Timetable.findAll({
        where,
        include: [
          { model: db.Class, as: 'class' },
          { model: db.Subject, as: 'subject' },
          { model: db.Teacher, as: 'teacher' }
        ],
        order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
      });
      
      res.json({
        success: true,
        data: timetables,
        count: timetables.length
      });
    } catch (error) {
      console.error('Get all timetables error:', error);
      next(error);
    }
  },

  // ================= GET TIMETABLE BY CLASS =================
  async getTimetableByClass(req, res, next) {
    try {
      let classId = parseInt(req.params.classId);
      if (req.user.role === 'teacher' && req.teacherClassId) {
        classId = req.teacherClassId;
      }
      
      const { term, academicYear } = req.query;
      const where = { classId };
      if (term) where.term = term;
      if (academicYear) where.academicYear = academicYear;
      
      const timetables = await db.Timetable.findAll({
        where,
        include: [
          { model: db.Class, as: 'class' },
          { model: db.Subject, as: 'subject' },
          { model: db.Teacher, as: 'teacher' }
        ],
        order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
      });
      
      // Group by day
      const grouped = {};
      timetables.forEach(t => {
        if (!grouped[t.dayOfWeek]) grouped[t.dayOfWeek] = [];
        grouped[t.dayOfWeek].push(t);
      });
      
      res.json({
        success: true,
        data: grouped,
        count: timetables.length
      });
    } catch (error) {
      console.error('Get timetable by class error:', error);
      next(error);
    }
  },

  // ================= GET TIMETABLE BY TEACHER =================
  async getTimetableByTeacher(req, res, next) {
    try {
      let teacherId = parseInt(req.params.teacherId);
      if (req.user.role === 'teacher' && req.teacherId) {
        teacherId = req.teacherId;
      }
      
      const { term, academicYear } = req.query;
      const where = { teacherId, isActive: true };
      if (term) where.term = term;
      if (academicYear) where.academicYear = academicYear;
      
      const timetables = await db.Timetable.findAll({
        where,
        include: [
          { model: db.Class, as: 'class' },
          { model: db.Subject, as: 'subject' },
          { model: db.Teacher, as: 'teacher' }
        ],
        order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
      });
      
      // Group by day
      const grouped = {};
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      days.forEach(day => grouped[day] = []);
      
      timetables.forEach(t => {
        if (!grouped[t.dayOfWeek]) grouped[t.dayOfWeek] = [];
        grouped[t.dayOfWeek].push({
          id: t.id,
          subject: t.subject?.subjectName || 'Subject',
          subjectId: t.subjectId,
          class: t.class?.className || 'Class',
          classId: t.classId,
          teacher: t.teacher?.fullName || 'Teacher',
          teacherId: t.teacherId,
          startTime: t.startTime,
          endTime: t.endTime,
          room: t.room || 'N/A',
          dayOfWeek: t.dayOfWeek,
          term: t.term,
          academicYear: t.academicYear
        });
      });
      
      // Remove empty days
      Object.keys(grouped).forEach(day => {
        if (grouped[day].length === 0) delete grouped[day];
      });
      
      res.json({
        success: true,
        data: grouped,
        teacherId,
        teacherName: timetables[0]?.teacher?.fullName || 'Teacher',
        count: timetables.length
      });
    } catch (error) {
      console.error('❌ Get timetable by teacher error:', error);
      next(error);
    }
  },

  // ================= GET TIMETABLE BY DAY =================
  async getTimetableByDay(req, res, next) {
    try {
      const { day } = req.params;
      const { term, academicYear, classId } = req.query;
      const where = { dayOfWeek: day };
      if (term) where.term = term;
      if (academicYear) where.academicYear = academicYear;
      if (classId) where.classId = parseInt(classId);
      
      // If teacher, force their own class
      if (req.user.role === 'teacher' && req.teacherClassId) {
        where.classId = req.teacherClassId;
      }
      
      const timetables = await db.Timetable.findAll({
        where,
        include: [
          { model: db.Class, as: 'class' },
          { model: db.Subject, as: 'subject' },
          { model: db.Teacher, as: 'teacher' }
        ],
        order: [['startTime', 'ASC']]
      });
      
      res.json({
        success: true,
        data: timetables,
        count: timetables.length
      });
    } catch (error) {
      console.error('Get timetable by day error:', error);
      next(error);
    }
  },

  // ================= CREATE TIMETABLE =================
  async createTimetable(req, res, next) {
    try {
      const data = req.body;
      
      // If teacher, restrict creation to their own class and teacherId
      if (req.user.role === 'teacher') {
        data.classId = req.teacherClassId;
        data.teacherId = req.teacherId;
      }
      
      // Conflict check
      const conflict = await db.Timetable.findOne({
        where: {
          teacherId: parseInt(data.teacherId),
          dayOfWeek: data.dayOfWeek,
          term: data.term || 'Term 1',
          academicYear: data.academicYear || new Date().getFullYear().toString(),
          [Op.or]: [
            { startTime: { [Op.between]: [data.startTime, data.endTime] } },
            { endTime: { [Op.between]: [data.startTime, data.endTime] } }
          ]
        }
      });
      
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: 'Teacher already has a class at this time on this day'
        });
      }
      
      const timetable = await db.Timetable.create(data);
      const newTimetable = await db.Timetable.findByPk(timetable.id, {
        include: [
          { model: db.Class, as: 'class' },
          { model: db.Subject, as: 'subject' },
          { model: db.Teacher, as: 'teacher' }
        ]
      });
      
      res.status(201).json({
        success: true,
        data: newTimetable,
        message: 'Timetable created successfully'
      });
    } catch (error) {
      console.error('Create timetable error:', error);
      next(error);
    }
  },

  // ================= BULK CREATE TIMETABLE =================
  async bulkCreateTimetable(req, res, next) {
    try {
      const { entries } = req.body;
      const created = [];
      const errors = [];
      
      for (const entry of entries) {
        try {
          // If teacher, force their class and ID
          if (req.user.role === 'teacher') {
            entry.classId = req.teacherClassId;
            entry.teacherId = req.teacherId;
          }
          
          const conflict = await db.Timetable.findOne({
            where: {
              teacherId: parseInt(entry.teacherId),
              dayOfWeek: entry.dayOfWeek,
              term: entry.term || 'Term 1',
              academicYear: entry.academicYear || new Date().getFullYear().toString(),
              [Op.or]: [
                { startTime: { [Op.between]: [entry.startTime, entry.endTime] } },
                { endTime: { [Op.between]: [entry.startTime, entry.endTime] } }
              ]
            }
          });
          
          if (conflict) {
            errors.push({ entry, error: 'Time conflict' });
            continue;
          }
          
          const timetable = await db.Timetable.create(entry);
          created.push(timetable);
        } catch (error) {
          errors.push({ entry, error: error.message });
        }
      }
      
      res.status(201).json({
        success: true,
        data: created,
        errors,
        created: created.length,
        failed: errors.length,
        message: `${created.length} timetables created`
      });
    } catch (error) {
      console.error('Bulk create timetable error:', error);
      next(error);
    }
  },

  // ================= UPDATE TIMETABLE =================
  async updateTimetable(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const timetable = await db.Timetable.findByPk(id);
      if (!timetable) {
        return res.status(404).json({ success: false, message: 'Timetable not found' });
      }
      
      // If teacher, ensure the timetable belongs to their class
      if (req.user.role === 'teacher') {
        if (timetable.classId !== req.teacherClassId || timetable.teacherId !== req.teacherId) {
          return res.status(403).json({ success: false, message: 'You cannot edit this timetable' });
        }
        // Prevent changing class/teacher away
        data.classId = req.teacherClassId;
        data.teacherId = req.teacherId;
      }
      
      // Conflict check (excluding self)
      if (data.teacherId || data.dayOfWeek || data.startTime || data.endTime) {
        const conflict = await db.Timetable.findOne({
          where: {
            id: { [Op.ne]: parseInt(id) },
            teacherId: parseInt(data.teacherId) || timetable.teacherId,
            dayOfWeek: data.dayOfWeek || timetable.dayOfWeek,
            term: data.term || timetable.term,
            academicYear: data.academicYear || timetable.academicYear,
            [Op.or]: [
              { startTime: { [Op.between]: [data.startTime || timetable.startTime, data.endTime || timetable.endTime] } },
              { endTime: { [Op.between]: [data.startTime || timetable.startTime, data.endTime || timetable.endTime] } }
            ]
          }
        });
        if (conflict) {
          return res.status(400).json({ success: false, message: 'Teacher already has a class at this time on this day' });
        }
      }
      
      await timetable.update(data);
      const updated = await db.Timetable.findByPk(id, {
        include: [
          { model: db.Class, as: 'class' },
          { model: db.Subject, as: 'subject' },
          { model: db.Teacher, as: 'teacher' }
        ]
      });
      
      res.json({
        success: true,
        data: updated,
        message: 'Timetable updated successfully'
      });
    } catch (error) {
      console.error('Update timetable error:', error);
      next(error);
    }
  },

  // ================= DELETE TIMETABLE =================
  async deleteTimetable(req, res, next) {
    try {
      const { id } = req.params;
      const timetable = await db.Timetable.findByPk(id);
      if (!timetable) {
        return res.status(404).json({ success: false, message: 'Timetable not found' });
      }
      
      // Teacher can only delete their own class timetables
      if (req.user.role === 'teacher') {
        if (timetable.classId !== req.teacherClassId || timetable.teacherId !== req.teacherId) {
          return res.status(403).json({ success: false, message: 'You cannot delete this timetable' });
        }
      }
      
      await timetable.destroy();
      res.json({ success: true, message: 'Timetable deleted successfully' });
    } catch (error) {
      console.error('Delete timetable error:', error);
      next(error);
    }
  },

  // ================= CLONE TIMETABLE =================
  async cloneTimetable(req, res, next) {
    try {
      const { fromTerm, fromYear, toTerm, toYear, classId } = req.body;
      const where = { term: fromTerm, academicYear: fromYear };
      
      // Teacher can only clone their own class
      if (req.user.role === 'teacher') {
        where.classId = req.teacherClassId;
      } else if (classId) {
        where.classId = parseInt(classId);
      }
      
      const timetables = await db.Timetable.findAll({ where });
      const cloned = [];
      for (const t of timetables) {
        const newT = await db.Timetable.create({
          classId: t.classId,
          subjectId: t.subjectId,
          teacherId: t.teacherId,
          dayOfWeek: t.dayOfWeek,
          startTime: t.startTime,
          endTime: t.endTime,
          room: t.room,
          term: toTerm,
          academicYear: toYear,
          isActive: true
        });
        cloned.push(newT);
      }
      
      res.json({
        success: true,
        data: cloned,
        cloned: cloned.length,
        message: `${cloned.length} timetables cloned`
      });
    } catch (error) {
      console.error('Clone timetable error:', error);
      next(error);
    }
  }
};

module.exports = TimetableController;
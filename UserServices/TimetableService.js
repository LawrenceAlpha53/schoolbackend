// UserServices/TimetableService.js
const db = require('../models');
const { Op } = require('sequelize');
const Timetable = db.Timetable;
const Class = db.Class;
const Subject = db.Subject;
const Teacher = db.Teacher;

const TimetableService = {
  // Create timetable entry
  async createTimetable(data) {
    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, term, academicYear } = data;

    // Validate class exists
    const classExists = await Class.findByPk(classId);
    if (!classExists) throw new Error('Class not found');

    // Validate subject exists
    const subjectExists = await Subject.findByPk(subjectId);
    if (!subjectExists) throw new Error('Subject not found');

    // Validate teacher exists
    const teacherExists = await Teacher.findByPk(teacherId);
    if (!teacherExists) throw new Error('Teacher not found');

    // Check for conflicts
    const conflict = await Timetable.findOne({
      where: {
        classId,
        dayOfWeek,
        [Op.or]: [
          {
            startTime: {
              [Op.lt]: endTime,
              [Op.gte]: startTime
            }
          },
          {
            endTime: {
              [Op.gt]: startTime,
              [Op.lte]: endTime
            }
          }
        ],
        term,
        academicYear
      }
    });

    if (conflict) {
      throw new Error('Time slot conflict exists for this class');
    }

    const timetable = await Timetable.create(data);
    return await Timetable.findByPk(timetable.id, {
      include: [
        { model: Class, as: 'class' },
        { model: Subject, as: 'subject' },
        { model: Teacher, as: 'teacher' }
      ]
    });
  },

  // Get all timetables
  async getAllTimetables(term, academicYear) {
    const where = {};
    if (term) where.term = term;
    if (academicYear) where.academicYear = academicYear;

    return await Timetable.findAll({
      where,
      include: [
        { model: Class, as: 'class' },
        { model: Subject, as: 'subject' },
        { model: Teacher, as: 'teacher' }
      ],
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    });
  },

  // Get timetable by class
  async getTimetableByClass(classId, term, academicYear) {
    const classExists = await Class.findByPk(classId);
    if (!classExists) throw new Error('Class not found');

    const where = { classId };
    if (term) where.term = term;
    if (academicYear) where.academicYear = academicYear;

    const timetables = await Timetable.findAll({
      where,
      include: [
        { model: Class, as: 'class' },
        { model: Subject, as: 'subject' },
        { model: Teacher, as: 'teacher' }
      ],
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    });

    // Group by day
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = {};
    days.forEach(day => {
      grouped[day] = timetables.filter(t => t.dayOfWeek === day);
    });

    return {
      class: classExists,
      timetables,
      grouped,
      days
    };
  },

  // ✅ FIXED - Get timetable by teacher - returns empty data instead of error
  async getTimetableByTeacher(teacherId, term, academicYear) {
    try {
      console.log(`📌 Fetching timetable for teacher: ${teacherId}`);
      
      // Check if teacher exists
      const teacherExists = await Teacher.findByPk(teacherId);
      if (!teacherExists) {
        console.warn(`⚠️ Teacher with ID ${teacherId} not found, returning empty timetable`);
        // Return empty data instead of throwing error
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const grouped = {};
        days.forEach(day => {
          grouped[day] = [];
        });
        
        return {
          teacherId,
          teacherName: 'Unknown Teacher',
          timetables: [],
          grouped,
          days,
          total: 0
        };
      }

      const where = { 
        teacherId,
        isActive: true 
      };
      
      if (term) where.term = term;
      if (academicYear) where.academicYear = academicYear;

      const timetables = await Timetable.findAll({
        where,
        include: [
          { 
            model: Class, 
            as: 'class',
            attributes: ['id', 'className']
          },
          { 
            model: Subject, 
            as: 'subject',
            attributes: ['id', 'subjectName']
          },
          { 
            model: Teacher, 
            as: 'teacher',
            attributes: ['id', 'fullName', 'email']
          }
        ],
        order: [
          ['dayOfWeek', 'ASC'],
          ['startTime', 'ASC']
        ]
      });

      console.log(`✅ Found ${timetables.length} timetables for teacher ${teacherId}`);

      // Group by day - this is what the frontend expects
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const grouped = {};
      days.forEach(day => {
        grouped[day] = timetables
          .filter(t => t.dayOfWeek === day)
          .map(t => ({
            id: t.id,
            subject: t.subject?.subjectName || 'Unknown Subject',
            subjectId: t.subjectId,
            class: t.class?.className || 'Unknown Class',
            classId: t.classId,
            startTime: t.startTime,
            endTime: t.endTime,
            time: `${t.startTime} - ${t.endTime}`,
            room: t.room || 'Not Assigned',
            dayOfWeek: t.dayOfWeek,
            term: t.term,
            academicYear: t.academicYear
          }));
      });

      return {
        teacherId,
        teacherName: teacherExists.fullName || 'Teacher',
        timetables,
        grouped,
        days,
        total: timetables.length
      };
    } catch (error) {
      console.error('❌ Error in getTimetableByTeacher:', error);
      // Return empty data on error
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const grouped = {};
      days.forEach(day => {
        grouped[day] = [];
      });
      
      return {
        teacherId,
        teacherName: 'Error Loading',
        timetables: [],
        grouped,
        days,
        total: 0
      };
    }
  },

  // Update timetable entry
  async updateTimetable(id, data) {
    const timetable = await Timetable.findByPk(id);
    if (!timetable) throw new Error('Timetable entry not found');

    // Check for conflicts if time or day changed
    if (data.dayOfWeek || data.startTime || data.endTime || data.classId) {
      const classId = data.classId || timetable.classId;
      const dayOfWeek = data.dayOfWeek || timetable.dayOfWeek;
      const startTime = data.startTime || timetable.startTime;
      const endTime = data.endTime || timetable.endTime;
      const term = data.term || timetable.term;
      const academicYear = data.academicYear || timetable.academicYear;

      const conflict = await Timetable.findOne({
        where: {
          classId,
          dayOfWeek,
          id: { [Op.ne]: id },
          [Op.or]: [
            {
              startTime: {
                [Op.lt]: endTime,
                [Op.gte]: startTime
              }
            },
            {
              endTime: {
                [Op.gt]: startTime,
                [Op.lte]: endTime
              }
            }
          ],
          term,
          academicYear
        }
      });

      if (conflict) {
        throw new Error('Time slot conflict exists');
      }
    }

    await timetable.update(data);
    return await Timetable.findByPk(id, {
      include: [
        { model: Class, as: 'class' },
        { model: Subject, as: 'subject' },
        { model: Teacher, as: 'teacher' }
      ]
    });
  },

  // Delete timetable entry
  async deleteTimetable(id) {
    const timetable = await Timetable.findByPk(id);
    if (!timetable) throw new Error('Timetable entry not found');
    await timetable.destroy();
    return true;
  },

  // Get timetable by day
  async getTimetableByDay(dayOfWeek, term, academicYear) {
    const where = { dayOfWeek };
    if (term) where.term = term;
    if (academicYear) where.academicYear = academicYear;

    return await Timetable.findAll({
      where,
      include: [
        { model: Class, as: 'class' },
        { model: Subject, as: 'subject' },
        { model: Teacher, as: 'teacher' }
      ],
      order: [
        ['startTime', 'ASC']
      ]
    });
  },

  // Bulk create timetable entries
  async bulkCreateTimetable(entries) {
    const results = [];
    const errors = [];

    for (const entry of entries) {
      try {
        const result = await this.createTimetable(entry);
        results.push(result);
      } catch (error) {
        errors.push({
          entry,
          error: error.message
        });
      }
    }

    return { results, errors, total: entries.length, success: results.length, failed: errors.length };
  },

  // Clone timetable from previous term
  async cloneTimetable(fromTerm, fromYear, toTerm, toYear, classId) {
    const sourceTimetables = await Timetable.findAll({
      where: {
        term: fromTerm,
        academicYear: fromYear,
        ...(classId && { classId })
      }
    });

    if (sourceTimetables.length === 0) {
      throw new Error('No timetable entries found to clone');
    }

    const results = [];
    for (const source of sourceTimetables) {
      const newEntry = await this.createTimetable({
        classId: source.classId,
        subjectId: source.subjectId,
        teacherId: source.teacherId,
        dayOfWeek: source.dayOfWeek,
        startTime: source.startTime,
        endTime: source.endTime,
        room: source.room,
        term: toTerm,
        academicYear: toYear,
        isActive: true
      });
      results.push(newEntry);
    }

    return {
      cloned: results.length,
      total: sourceTimetables.length, 
      results
    };
  }
};

module.exports = TimetableService;
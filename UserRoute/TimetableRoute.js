// UserRoute/TimetableRoute.js - COMPLETE FIXED
const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');
const db = require('../models');
const { Op } = require('sequelize');

// ================= GET ALL TIMETABLES (with query params) =================
router.get('/', verifyToken, async (req, res) => {
  try {
    const { term, academicYear, classId, teacherId } = req.query;
    
    console.log('📌 GET /timetables - Query params:', req.query);
    
    const where = {};
    if (term) where.term = term;
    if (academicYear) where.academicYear = academicYear;
    if (classId) where.classId = parseInt(classId);
    if (teacherId) where.teacherId = parseInt(teacherId);
    
    const timetables = await db.Timetable.findAll({
      where,
      include: [
        { model: db.Class, as: 'class' },
        { model: db.Subject, as: 'subject' },
        { model: db.Teacher, as: 'teacher' }
      ],
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    });
    
    console.log(`✅ Found ${timetables.length} timetables`);
    
    res.json({
      success: true,
      data: timetables,
      count: timetables.length
    });
  } catch (error) {
    console.error('❌ Get all timetables error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ================= GET TIMETABLE BY CLASS =================
router.get('/class/:classId', verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { term, academicYear } = req.query;
    
    const where = { classId: parseInt(classId) };
    if (term) where.term = term;
    if (academicYear) where.academicYear = academicYear;
    
    const timetables = await db.Timetable.findAll({
      where,
      include: [
        { model: db.Class, as: 'class' },
        { model: db.Subject, as: 'subject' },
        { model: db.Teacher, as: 'teacher' }
      ],
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    });
    
    res.json({
      success: true,
      data: timetables,
      count: timetables.length
    });
  } catch (error) {
    console.error('Get timetable by class error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= GET TIMETABLE BY TEACHER =================
router.get('/teacher/:teacherId', verifyToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { term, academicYear } = req.query;
    
    console.log('📌 getTimetableByTeacher called with teacherId:', teacherId);
    
    const where = { 
      teacherId: parseInt(teacherId),
      isActive: true
    };
    if (term) where.term = term;
    if (academicYear) where.academicYear = academicYear;
    
    const timetables = await db.Timetable.findAll({
      where,
      include: [
        { model: db.Class, as: 'class' },
        { model: db.Subject, as: 'subject' },
        { model: db.Teacher, as: 'teacher' }
      ],
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    });
    
    console.log(`✅ Found ${timetables.length} timetables for teacher ${teacherId}`);
    
    // Group by day
    const grouped = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    days.forEach(day => { grouped[day] = []; });
    
    timetables.forEach(t => {
      if (!grouped[t.dayOfWeek]) {
        grouped[t.dayOfWeek] = [];
      }
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
        academicYear: t.academicYear,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      });
    });
    
    // Remove empty days
    Object.keys(grouped).forEach(day => {
      if (grouped[day].length === 0) {
        delete grouped[day];
      }
    });
    
    res.json({
      success: true,
      data: grouped,
      teacherId: parseInt(teacherId),
      teacherName: timetables[0]?.teacher?.fullName || 'Teacher',
      count: timetables.length
    });
  } catch (error) {
    console.error('❌ Get timetable by teacher error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= GET TIMETABLE BY DAY =================
router.get('/day/:day', verifyToken, async (req, res) => {
  try {
    const { day } = req.params;
    const { term, academicYear, classId } = req.query;
    
    const where = { dayOfWeek: day };
    if (term) where.term = term;
    if (academicYear) where.academicYear = academicYear;
    if (classId) where.classId = parseInt(classId);
    
    const timetables = await db.Timetable.findAll({
      where,
      include: [
        { model: db.Class, as: 'class' },
        { model: db.Subject, as: 'subject' },
        { model: db.Teacher, as: 'teacher' }
      ],
      order: [
        ['startTime', 'ASC']
      ]
    });
    
    res.json({
      success: true,
      data: timetables,
      count: timetables.length
    });
  } catch (error) {
    console.error('Get timetable by day error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= CREATE TIMETABLE =================
router.post('/', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    const data = req.body;
    
    // Check for conflicts
    const conflict = await db.Timetable.findOne({
      where: {
        teacherId: parseInt(data.teacherId),
        dayOfWeek: data.dayOfWeek,
        term: data.term || 'Term 1',
        academicYear: data.academicYear || new Date().getFullYear().toString(),
        [Op.or]: [
          {
            startTime: { [Op.between]: [data.startTime, data.endTime] }
          },
          {
            endTime: { [Op.between]: [data.startTime, data.endTime] }
          }
        ]
      }
    });
    
    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'Teacher already has a class at this time on this day'
      });
    }
    
    const timetable = await db.Timetable.create({
      classId: parseInt(data.classId),
      subjectId: parseInt(data.subjectId),
      teacherId: parseInt(data.teacherId),
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room || '',
      term: data.term || 'Term 1',
      academicYear: data.academicYear || new Date().getFullYear().toString(),
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      data: timetable,
      message: 'Timetable created successfully'
    });
  } catch (error) {
    console.error('Create timetable error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= ASSIGN TIMETABLE TO TEACHER =================
router.post('/assign-to-teacher', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    const { 
      teacherId, 
      classId, 
      subjectId, 
      dayOfWeek, 
      startTime, 
      endTime, 
      room, 
      term, 
      academicYear, 
      message 
    } = req.body;

    console.log('📌 Assign to teacher - Data:', req.body);

    if (!teacherId || !classId || !subjectId || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const teacher = await db.Teacher.findByPk(parseInt(teacherId));
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const classInfo = await db.Class.findByPk(parseInt(classId));
    if (!classInfo) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const subject = await db.Subject.findByPk(parseInt(subjectId));
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const conflict = await db.Timetable.findOne({
      where: {
        teacherId: parseInt(teacherId),
        dayOfWeek: dayOfWeek,
        term: term || 'Term 1',
        academicYear: academicYear || new Date().getFullYear().toString(),
        [Op.or]: [
          { startTime: { [Op.between]: [startTime, endTime] } },
          { endTime: { [Op.between]: [startTime, endTime] } }
        ]
      }
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'Teacher already has a class at this time on this day'
      });
    }

    const timetable = await db.Timetable.create({
      teacherId: parseInt(teacherId),
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      dayOfWeek: dayOfWeek,
      startTime: startTime,
      endTime: endTime,
      room: room || '',
      term: term || 'Term 1',
      academicYear: academicYear || new Date().getFullYear().toString(),
      isActive: true
    });

    // Create notification
    if (teacher.userId) {
      try {
        await db.Notification.create({
          userId: teacher.userId,
          title: '📋 New Timetable Assignment',
          message: message || `You have been assigned to teach ${subject.subjectName} for ${classInfo.className} on ${dayOfWeek} at ${startTime} - ${endTime}`,
          type: 'info',
          category: 'academic',
          priority: 'high',
          createdBy: req.user.id,
          metadata: {
            timetableId: timetable.id,
            teacherId: teacherId,
            classId: classId,
            subjectId: subjectId,
            dayOfWeek: dayOfWeek,
            startTime: startTime,
            endTime: endTime,
            room: room
          },
          actionLink: '/teacher/timetable',
          actionLabel: 'View Timetable',
          isRead: false
        });
      } catch (notifError) {
        console.log('Notification error:', notifError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: '✅ Timetable assigned to teacher successfully!',
      data: { timetable, teacher: teacher.fullName, subject: subject.subjectName, class: classInfo.className }
    });
  } catch (error) {
    console.error('❌ Assign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= UPDATE TIMETABLE =================
router.put('/:id', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const timetable = await db.Timetable.findByPk(id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }
    
    await timetable.update({
      classId: parseInt(data.classId) || timetable.classId,
      subjectId: parseInt(data.subjectId) || timetable.subjectId,
      teacherId: parseInt(data.teacherId) || timetable.teacherId,
      dayOfWeek: data.dayOfWeek || timetable.dayOfWeek,
      startTime: data.startTime || timetable.startTime,
      endTime: data.endTime || timetable.endTime,
      room: data.room || timetable.room,
      term: data.term || timetable.term,
      academicYear: data.academicYear || timetable.academicYear
    });
    
    res.json({ success: true, data: timetable, message: 'Timetable updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= DELETE TIMETABLE =================
router.delete('/:id', verifyToken, role('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const timetable = await db.Timetable.findByPk(id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }
    
    await timetable.destroy();
    res.json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= GET TEACHER NOTIFICATIONS =================
router.get('/notifications/:teacherId', verifyToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const teacher = await db.Teacher.findByPk(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    const notifications = await db.Notification.findAll({
      where: { userId: teacher.userId, isRead: false },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, data: notifications, unreadCount: notifications.length });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= MARK NOTIFICATION AS READ =================
router.put('/notifications/read/:notificationId', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await db.Notification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    await notification.update({ isRead: true });
    res.json({ success: true, data: notification, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= MARK ALL NOTIFICATIONS AS READ =================
router.put('/notifications/read-all/:teacherId', verifyToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const teacher = await db.Teacher.findByPk(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    await db.Notification.update(
      { isRead: true },
      { where: { userId: teacher.userId, isRead: false } }
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
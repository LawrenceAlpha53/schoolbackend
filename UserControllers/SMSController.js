// UserControllers/SMSController.js
const SMSService = require('../UserServices/SMSService');
const db = require('../models');

const SMSController = {

  // ================= SEND SMS TO CLASS =================
  async sendToClass(req, res, next) {
    try {
      const { classId, message, senderId } = req.body;
      
      if (!classId || !message) {
        return res.status(400).json({
          success: false,
          message: 'Class ID and message are required'
        });
      }

      const result = await SMSService.sendToClass(classId, message, senderId);
      
      // Log who sent it
      await db.SMSLog.update(
        { sentBy: req.user.id },
        { where: { sentAt: { [db.Sequelize.Op.gte]: new Date(Date.now() - 60000) } } }
      );

      res.json({
        success: true,
        message: `✅ SMS sent to ${result.total} parents`,
        data: result
      });
    } catch (error) {
      console.error('❌ Send to class error:', error);
      next(error);
    }
  },

  // ================= SEND SMS TO ALL PARENTS =================
  async sendToAllParents(req, res, next) {
    try {
      const { message, senderId } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      const result = await SMSService.sendToAllParents(message, senderId);
      
      await db.SMSLog.update(
        { sentBy: req.user.id },
        { where: { sentAt: { [db.Sequelize.Op.gte]: new Date(Date.now() - 60000) } } }
      );

      res.json({
        success: true,
        message: `✅ SMS sent to ${result.total} parents`,
        data: result
      });
    } catch (error) {
      console.error('❌ Send to all parents error:', error);
      next(error);
    }
  },

  // ================= SEND SMS TO TEACHERS =================
  async sendToTeachers(req, res, next) {
    try {
      const { message, senderId } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      const result = await SMSService.sendToTeachers(message, senderId);
      
      await db.SMSLog.update(
        { sentBy: req.user.id },
        { where: { sentAt: { [db.Sequelize.Op.gte]: new Date(Date.now() - 60000) } } }
      );

      res.json({
        success: true,
        message: `✅ SMS sent to ${result.total} teachers`,
        data: result
      });
    } catch (error) {
      console.error('❌ Send to teachers error:', error);
      next(error);
    }
  },

  // ================= SEND SMS TO SELECTED RECIPIENTS =================
  async sendToSelected(req, res, next) {
    try {
      const { recipients, message, senderId } = req.body;
      
      if (!recipients || !message) {
        return res.status(400).json({
          success: false,
          message: 'Recipients and message are required'
        });
      }

      if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Recipients must be a non-empty array'
        });
      }

      const result = await SMSService.sendToSelected(recipients, message, senderId);
      
      await db.SMSLog.update(
        { sentBy: req.user.id },
        { where: { sentAt: { [db.Sequelize.Op.gte]: new Date(Date.now() - 60000) } } }
      );

      res.json({
        success: true,
        message: `✅ SMS sent to ${result.total} recipients`,
        data: result
      });
    } catch (error) {
      console.error('❌ Send to selected error:', error);
      next(error);
    }
  },

  // ================= GET SMS LOGS =================
  async getSMSLogs(req, res, next) {
    try {
      const { limit = 50, offset = 0, status, startDate, endDate } = req.query;
      
      const where = {};
      if (status) where.status = status;
      if (startDate && endDate) {
        where.sentAt = { [db.Sequelize.Op.between]: [startDate, endDate] };
      }

      const logs = await db.SMSLog.findAll({
        where,
        include: [
          { model: db.Student, as: 'student' },
          { model: db.Teacher, as: 'teacher' },
          { model: db.Users, as: 'sender' }
        ],
        order: [['sentAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const total = await db.SMSLog.count({ where });

      res.json({
        success: true,
        data: logs,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('❌ Get SMS logs error:', error);
      next(error);
    }
  },

  // ================= GET SMS BALANCE =================
  async getBalance(req, res, next) {
    try {
      const balance = await SMSService.getBalance();
      
      res.json({
        success: true,
        data: balance
      });
    } catch (error) {
      console.error('❌ Get balance error:', error);
      next(error);
    }
  },

  // ================= GET SMS STATS =================
  async getSMSStats(req, res, next) {
    try {
      const totalSent = await db.SMSLog.count();
      const totalDelivered = await db.SMSLog.count({ where: { status: 'delivered' } });
      const totalFailed = await db.SMSLog.count({ where: { status: 'failed' } });
      const totalPending = await db.SMSLog.count({ where: { status: 'pending' } });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sentToday = await db.SMSLog.count({
        where: {
          sentAt: { [db.Sequelize.Op.gte]: today }
        }
      });

      res.json({
        success: true,
        data: {
          totalSent,
          totalDelivered,
          totalFailed,
          totalPending,
          sentToday,
          deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0
        }
      });
    } catch (error) {
      console.error('❌ Get SMS stats error:', error);
      next(error);
    }
  }
};

module.exports = SMSController;
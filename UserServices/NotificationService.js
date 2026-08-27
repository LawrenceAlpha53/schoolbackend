// UserServices/NotificationService.js
const db = require('../models');

class NotificationService {
  
  // ================= CREATE NOTIFICATION =================
  async createNotification(data) {
    try {
      const notification = await db.Notification.create({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        category: data.category || 'general',
        priority: data.priority || 'medium',
        createdBy: data.createdBy,
        metadata: data.metadata || {},
        actionLink: data.actionLink || null,
        actionLabel: data.actionLabel || null,
        isRead: false,
        isPinned: false,
        isArchived: false
      });
      return notification;
    } catch (error) {
      throw error;
    }
  }

  // ================= GET USER NOTIFICATIONS =================
  async getUserNotifications(userId, options = {}) {
    try {
      const where = {
        [db.Sequelize.Op.or]: [
          { userId: userId },
          { userId: null }
        ]
      };

      if (options.isRead !== undefined) {
        where.isRead = options.isRead;
      }

      const notifications = await db.Notification.findAll({
        where,
        include: [
          { model: db.Users, as: 'creator', attributes: ['id', 'Fname', 'Lname', 'Email'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: options.limit || 50,
        offset: options.offset || 0
      });

      const unreadCount = await db.Notification.count({
        where: {
          [db.Sequelize.Op.or]: [
            { userId: userId },
            { userId: null }
          ],
          isRead: false
        }
      });

      return { notifications, unreadCount };
    } catch (error) {
      throw error;
    }
  }

  // ================= MARK AS READ =================
  async markAsRead(notificationId, userId) {
    try {
      const notification = await db.Notification.findOne({
        where: {
          id: notificationId,
          [db.Sequelize.Op.or]: [
            { userId: userId },
            { userId: null }
          ]
        }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.update({ isRead: true });
      return notification;
    } catch (error) {
      throw error;
    }
  }

  // ================= MARK ALL AS READ =================
  async markAllAsRead(userId) {
    try {
      await db.Notification.update(
        { isRead: true },
        {
          where: {
            [db.Sequelize.Op.or]: [
              { userId: userId },
              { userId: null }
            ],
            isRead: false
          }
        }
      );
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new NotificationService();
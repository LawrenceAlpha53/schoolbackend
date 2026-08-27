  const db = require('../models');
  const Notification = db.Notification;
  const User = db.Users;

  const NotificationService = {
    // ================= CREATE NOTIFICATION =================
    async createNotification(data) {
      const { userId, title, message, type, category, priority, createdBy, scheduledFor, expiresAt, actionLink, actionLabel, metadata } = data;

      // Validate user if specific user
      if (userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');
      }

      // Validate creator
      const creator = await User.findByPk(createdBy);
      if (!creator) throw new Error('Creator not found');

      const notification = await Notification.create({
        userId: userId || null,
        title,
        message,
        type: type || 'info',
        category: category || 'general',
        priority: priority || 'medium',
        createdBy,
        scheduledFor: scheduledFor || null,
        expiresAt: expiresAt || null,
        actionLink: actionLink || null,
        actionLabel: actionLabel || null,
        metadata: metadata || null,
        isRead: false,
        isPinned: false,
        isArchived: false
      });

      return await Notification.findByPk(notification.id, {
        include: [
          { model: User, as: 'user' },
          { model: User, as: 'creator' }
        ]
      });
    },

    // ================= BULK CREATE NOTIFICATIONS =================
    async bulkCreateNotifications(data) {
      const { userIds, title, message, type, category, priority, createdBy, scheduledFor, expiresAt, actionLink, actionLabel, metadata } = data;

      const notifications = [];
      for (const userId of userIds) {
        const notification = await this.createNotification({
          userId,
          title,
          message,
          type,
          category,
          priority,
          createdBy,
          scheduledFor,
          expiresAt,
          actionLink,
          actionLabel,
          metadata
        });
        notifications.push(notification);
      }

      return notifications;
    },

    // ================= BROADCAST NOTIFICATION =================
    async broadcastNotification(data) {
      const { title, message, type, category, priority, createdBy, scheduledFor, expiresAt, actionLink, actionLabel, metadata } = data;

      const notification = await Notification.create({
        userId: null, // null means broadcast
        title,
        message,
        type: type || 'announcement',
        category: category || 'general',
        priority: priority || 'medium',
        createdBy,
        scheduledFor: scheduledFor || null,
        expiresAt: expiresAt || null,
        actionLink: actionLink || null,
        actionLabel: actionLabel || null,
        metadata: metadata || null,
        isRead: false,
        isPinned: false,
        isArchived: false
      });

      return await Notification.findByPk(notification.id, {
        include: [
          { model: User, as: 'creator' }
        ]
      });
    },

    // ================= GET USER NOTIFICATIONS =================
    async getUserNotifications(userId, options = {}) {
      const { limit = 50, offset = 0, isRead, category, type, priority } = options;

      const where = {
        [db.Sequelize.Op.or]: [
          { userId: userId },
          { userId: null } // broadcast notifications
        ]
      };

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (category) {
        where.category = category;
      }

      if (type) {
        where.type = type;
      }

      if (priority) {
        where.priority = priority;
      }

      const notifications = await Notification.findAll({
        where,
        include: [
          { model: User, as: 'creator', attributes: ['id', 'Fname', 'Lname', 'Email'] }
        ],
        order: [
          ['isPinned', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Get unread count
      const unreadCount = await Notification.count({
        where: {
          [db.Sequelize.Op.or]: [
            { userId: userId },
            { userId: null }
          ],
          isRead: false
        }
      });

      return {
        notifications,
        unreadCount,
        total: notifications.length
      };
    },

    // ================= MARK NOTIFICATION AS READ =================
    async markAsRead(notificationId, userId) {
      const notification = await Notification.findOne({
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
    },

    // ================= MARK ALL AS READ =================
    async markAllAsRead(userId) {
      await Notification.update(
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

      return { success: true, message: 'All notifications marked as read' };
    },

    // ================= DELETE NOTIFICATION =================
    async deleteNotification(notificationId, userId) {
      const notification = await Notification.findOne({
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

      await notification.destroy();
      return { success: true, message: 'Notification deleted' };
    },

    // ================= PIN/UNPIN NOTIFICATION =================
    async togglePin(notificationId, userId) {
      const notification = await Notification.findOne({
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

      await notification.update({ isPinned: !notification.isPinned });
      return notification;
    },

    // ================= ARCHIVE NOTIFICATION =================
    async archiveNotification(notificationId, userId) {
      const notification = await Notification.findOne({
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

      await notification.update({ isArchived: true });
      return notification;
    }
  };

  module.exports = NotificationService;
// const express = require('express');
// const router = express.Router();
// const verifyToken = require('../Middlewares/AuthMiddleware');
// const db = require('../models');
// const { Op } = require('sequelize');

// console.log('📌 NotificationRoute loaded!');

// // ================= TEST =================
// router.get('/test', (req, res) => {
//   res.json({ success: true, message: 'Notification route is working!' });
// });

// // ================= GET UNREAD COUNT (for current user) =================
// router.get('/unread-count', verifyToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const count = await db.Notification.count({
//       where: {
//         [Op.or]: [{ userId }, { userId: null }],
//         isRead: false
//       }
//     });
//     res.json({ success: true, unreadCount: count });
//   } catch (error) {
//     console.error('❌ /unread-count error:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // ================= GET CURRENT USER NOTIFICATIONS =================
// router.get('/', verifyToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { limit = 50, offset = 0, isRead } = req.query;

//     const where = {
//       [Op.or]: [{ userId: userId }, { userId: null }]
//     };
//     if (isRead === 'true') where.isRead = true;
//     else if (isRead === 'false') where.isRead = false;

//     const notifications = await db.Notification.findAll({
//       where,
//       order: [['createdAt', 'DESC']],
//       limit: parseInt(limit),
//       offset: parseInt(offset),
//       include: [
//         { model: db.Users, as: 'creator', attributes: ['id', 'Fname', 'Lname', 'Email'] }
//       ]
//     });

//     const unreadCount = await db.Notification.count({
//       where: {
//         [Op.or]: [{ userId: userId }, { userId: null }],
//         isRead: false
//       }
//     });

//     res.json({
//       success: true,
//       data: notifications,
//       unreadCount,
//       total: notifications.length
//     });
//   } catch (error) {
//     console.error('❌ GET / notifications error:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // ================= POST – CREATE NOTIFICATION (unchanged) =================
// router.post('/', verifyToken, async (req, res) => {
//   // ... keep your existing POST logic – no changes needed
// });

// // ================= GET MY (alias) =================
// router.get('/my', verifyToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { limit = 50, offset = 0, isRead } = req.query;

//     const where = {
//       [Op.or]: [{ userId: userId }, { userId: null }]
//     };
//     if (isRead === 'true') where.isRead = true;
//     else if (isRead === 'false') where.isRead = false;

//     const notifications = await db.Notification.findAll({
//       where,
//       order: [['createdAt', 'DESC']],
//       limit: parseInt(limit),
//       offset: parseInt(offset),
//       include: [
//         { model: db.Users, as: 'creator', attributes: ['id', 'Fname', 'Lname', 'Email'] }
//       ]
//     });

//     const unreadCount = await db.Notification.count({
//       where: {
//         [Op.or]: [{ userId: userId }, { userId: null }],
//         isRead: false
//       }
//     });

//     res.json({
//       success: true,
//       data: notifications,
//       unreadCount,
//       total: notifications.length
//     });
//   } catch (error) {
//     console.error('❌ GET /my error:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // ================= GET ALL (admin) – unchanged =================
// router.get('/all', verifyToken, async (req, res) => {
//   // ... keep your existing logic
// });

// // ================= GET BY USER ID (with NaN protection) =================
// router.get('/:userId', verifyToken, async (req, res) => {
//   try {
//     let userId = parseInt(req.params.userId);
//     if (isNaN(userId)) {
//       return res.status(400).json({ success: false, error: 'Invalid user ID' });
//     }
//     const { limit = 50, offset = 0, isRead } = req.query;

//     const where = {
//       [Op.or]: [{ userId: userId }, { userId: null }]
//     };
//     if (isRead === 'true') where.isRead = true;
//     else if (isRead === 'false') where.isRead = false;

//     const notifications = await db.Notification.findAll({
//       where,
//       order: [['createdAt', 'DESC']],
//       limit: parseInt(limit),
//       offset: parseInt(offset),
//       include: [
//         { model: db.Users, as: 'creator', attributes: ['id', 'Fname', 'Lname', 'Email'] }
//       ]
//     });

//     const unreadCount = await db.Notification.count({
//       where: {
//         [Op.or]: [{ userId: userId }, { userId: null }],
//         isRead: false
//       }
//     });

//     res.json({
//       success: true,
//       data: notifications,
//       unreadCount,
//       total: notifications.length
//     });
//   } catch (error) {
//     console.error('❌ GET /:userId error:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // ================= MARK AS READ =================
// router.put('/read/:id', verifyToken, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;

//     const notification = await db.Notification.findOne({
//       where: {
//         id,
//         [Op.or]: [{ userId: userId }, { userId: null }]
//       }
//     });

//     if (!notification) {
//       return res.status(404).json({ success: false, error: 'Notification not found' });
//     }

//     await notification.update({ isRead: true });
//     res.json({ success: true, data: notification, message: 'Marked as read' });
//   } catch (error) {
//     console.error('❌ PUT /read/:id error:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // ================= MARK ALL AS READ =================
// router.put('/read-all', verifyToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     await db.Notification.update(
//       { isRead: true },
//       {
//         where: {
//           [Op.or]: [{ userId: userId }, { userId: null }],
//           isRead: false
//         }
//       }
//     );
//     res.json({ success: true, message: 'All notifications marked as read' });
//   } catch (error) {
//     console.error('❌ PUT /read-all error:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// module.exports = router;



// UserRoute/NotificationRoute.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/AuthMiddleware');
const db = require('../models');
const { Op } = require('sequelize');

// ================= GET ALL NOTIFICATIONS (Admin only) =================
router.get('/', verifyToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, isRead } = req.query;
    
    const where = {};
    if (isRead === 'true') where.isRead = true;
    else if (isRead === 'false') where.isRead = false;
    
    const notifications = await db.Notification.findAll({
      where,
      include: [
        {
          model: db.Users,
          as: 'creator',
          attributes: ['id', 'Fname', 'Lname', 'Email']
        },
        {
          model: db.Users,
          as: 'user',
          attributes: ['id', 'Fname', 'Lname', 'Email', 'role']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
    
    const total = await db.Notification.count({ where });
    
    res.json({
      success: true,
      data: notifications,
      total: total,
      count: notifications.length
    });
    
  } catch (error) {
    console.error('❌ Get all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// ================= CREATE NOTIFICATION WITH TARGETING =================
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'info',
      category = 'general',
      priority = 'medium',
      recipientType = 'all',
      recipientId = null,
      sendEmail = false,
      sendSMS = false,
      metadata = {}
    } = req.body;

    const createdBy = req.user.id;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    let targetUserIds = [];
    let targetUsers = [];
    let notifications = [];

    console.log(`📌 Looking for users with recipientType: ${recipientType}`);

    // ============================================================
    // CASE 1: Send to ALL users - Create BROADCAST notification
    // ============================================================
    if (recipientType === 'all') {
      console.log('📌 Sending to ALL users (broadcast)');
      
      const broadcast = await db.Notification.create({
        userId: null,
        title: title,
        message: message,
        type: type,
        category: category,
        priority: priority,
        createdBy: createdBy,
        isRead: false,
        isPinned: false,
        isArchived: false,
        metadata: {
          ...metadata,
          recipientType: recipientType,
          sendEmail: sendEmail,
          sendSMS: sendSMS,
          isBroadcast: true
        }
      });
      
      targetUsers = await db.Users.findAll({
        attributes: ['id', 'Fname', 'Lname', 'Email', 'role']
      });
      targetUserIds = targetUsers.map(u => u.id);
      
      notifications = [broadcast];
      
      return res.status(201).json({
        success: true,
        message: `✅ Notification broadcast to ALL ${targetUserIds.length} users`,
        data: {
          sentTo: targetUserIds.length,
          recipientType: 'all (broadcast)',
          users: targetUsers.map(u => ({
            id: u.id,
            name: u.Fname || u.name,
            role: u.role,
            email: u.Email
          })),
          notifications: notifications,
          isBroadcast: true
        }
      });
    }

    // ============================================================
    // CASE 2: Send to SPECIFIC user
    // ============================================================
    if (recipientType === 'specific') {
      if (recipientId) {
        const user = await db.Users.findByPk(recipientId, {
          attributes: ['id', 'Fname', 'Lname', 'Email', 'role']
        });
        if (user) {
          targetUsers = [user];
          targetUserIds = [user.id];
        }
      }
    }

    // ============================================================
    // CASE 3: Send to SPECIFIC ROLE
    // ============================================================
    if (recipientType !== 'all' && recipientType !== 'specific') {
      const roleMap = {
        'teachers': 'teacher',
        'secretary': 'secretary',
        'admin': 'admin',
        'students': 'student'
      };
      
      const searchRole = roleMap[recipientType] || recipientType;
      
      console.log(`📌 Searching for users with role: ${searchRole}`);
      
      // ============================================================
      // 🔥 FIX: Use Sequelize finder instead of raw SQL
      // This avoids the ENUM casting issues entirely
      // ============================================================
      const users = await db.Users.findAll({
        where: {
          role: searchRole  // ✅ Exact match on ENUM
        },
        attributes: ['id', 'Fname', 'Lname', 'Email', 'role']
      });
      
      // ✅ users is always an array from Sequelize
      targetUsers = users || [];
      targetUserIds = targetUsers.map(u => u.id);
      
      console.log(`📌 Found ${targetUserIds.length} users with role: ${searchRole}`);
      console.log(`📌 Users:`, targetUsers.map(u => ({ id: u.id, name: u.Fname, role: u.role })));
    }

    // ============================================================
    // Check if any users found
    // ============================================================
    if (targetUserIds.length === 0) {
      // Get all available roles for debugging
      const allUsers = await db.Users.findAll({
        attributes: ['id', 'Fname', 'Lname', 'Email', 'role']
      });
      const availableRoles = [...new Set(allUsers.map(u => u.role))];
      
      return res.status(404).json({
        success: false,
        message: `No users found with role: ${recipientType}`,
        availableRoles: availableRoles,
        suggestion: availableRoles.length > 0 
          ? `Available roles: ${availableRoles.join(', ')}` 
          : 'No users found in the system',
        allUsers: allUsers.map(u => ({ id: u.id, name: u.Fname, role: u.role }))
      });
    }

    // ============================================================
    // Create PERSONAL notifications for each target user
    // ============================================================
    for (const userId of targetUserIds) {
      const notification = await db.Notification.create({
        userId: userId,
        title: title,
        message: message,
        type: type,
        category: category,
        priority: priority,
        createdBy: createdBy,
        isRead: false,
        isPinned: false,
        isArchived: false,
        metadata: {
          ...metadata,
          recipientType: recipientType,
          sendEmail: sendEmail,
          sendSMS: sendSMS
        }
      });
      notifications.push(notification);
    }

    console.log(`✅ Notification sent to ${targetUserIds.length} ${recipientType} users`);

    res.status(201).json({
      success: true,
      message: `✅ Notification sent to ${targetUserIds.length} ${recipientType} users`,
      data: {
        sentTo: targetUserIds.length,
        recipientType: recipientType,
        users: targetUsers.map(u => ({
          id: u.id,
          name: u.Fname || u.name,
          role: u.role,
          email: u.Email
        })),
        notifications: notifications,
        isBroadcast: false
      }
    });

  } catch (error) {
    console.error('❌ Notification creation error:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

// ================= DEBUG: CHECK ALL USER ROLES =================
router.get('/debug/roles', verifyToken, async (req, res) => {
  try {
    const users = await db.Users.findAll({
      attributes: ['id', 'Fname', 'Lname', 'Email', 'role'],
      order: [['role', 'ASC']]
    });
    
    const roles = {};
    users.forEach(u => {
      const role = u.role || 'undefined';
      if (!roles[role]) roles[role] = [];
      roles[role].push({ 
        id: u.id, 
        name: u.Fname, 
        email: u.Email
      });
    });
    
    res.json({
      success: true,
      data: {
        totalUsers: users.length,
        roles: roles,
        allUsers: users
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= GET NOTIFICATIONS FOR CURRENT USER =================
router.get('/my', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, isRead } = req.query;

    const where = {
      [Op.or]: [
        { userId: userId },
        { userId: null }
      ]
    };

    if (isRead === 'true') where.isRead = true;
    else if (isRead === 'false') where.isRead = false;

    const notifications = await db.Notification.findAll({
      where,
      include: [
        {
          model: db.Users,
          as: 'creator',
          attributes: ['id', 'Fname', 'Lname', 'Email']
        }
      ],
      order: [
        ['isPinned', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    const unreadCount = await db.Notification.count({
      where: {
        [Op.or]: [
          { userId: userId },
          { userId: null }
        ],
        isRead: false
      }
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount: unreadCount,
      total: notifications.length
    });

  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// ================= GET NOTIFICATIONS BY USER ID =================
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, isRead } = req.query;

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const where = {
      [Op.or]: [
        { userId: parsedUserId },
        { userId: null }
      ]
    };

    if (isRead === 'true') where.isRead = true;
    else if (isRead === 'false') where.isRead = false;

    const notifications = await db.Notification.findAll({
      where,
      include: [
        {
          model: db.Users,
          as: 'creator',
          attributes: ['id', 'Fname', 'Lname', 'Email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    const unreadCount = await db.Notification.count({
      where: {
        [Op.or]: [
          { userId: parsedUserId },
          { userId: null }
        ],
        isRead: false
      }
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount: unreadCount,
      total: notifications.length
    });

  } catch (error) {
    console.error('❌ Get user notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// ================= MARK NOTIFICATION AS READ =================
router.put('/read/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await db.Notification.findOne({
      where: {
        id: id,
        [Op.or]: [
          { userId: userId },
          { userId: null }
        ]
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.update({ isRead: true });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// ================= MARK ALL AS READ =================
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await db.Notification.update(
      { isRead: true },
      {
        where: {
          [Op.or]: [
            { userId: userId },
            { userId: null }
          ],
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('❌ Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: error.message
    });
  }
});

// ================= DELETE NOTIFICATION =================
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await db.Notification.findOne({
      where: {
        id: id,
        [Op.or]: [
          { userId: userId },
          { userId: null }
        ]
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});



// ================= PIN / UNPIN =================
router.patch('/:id/pin', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;
    const userId = req.user.id;

    const notification = await db.Notification.findOne({
      where: {
        id,
        [Op.or]: [{ userId: userId }, { userId: null }]
      }
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    await notification.update({ isPinned });
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('❌ Pin error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= ARCHIVE / RESTORE =================
router.patch('/:id/archive', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isArchived } = req.body;
    const userId = req.user.id;

    const notification = await db.Notification.findOne({
      where: {
        id,
        [Op.or]: [{ userId: userId }, { userId: null }]
      }
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    await notification.update({ isArchived });
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('❌ Archive error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= BULK MARK AS READ =================
router.patch('/bulk-read', verifyToken, async (req, res) => {
  try {
    const { ids, read } = req.body;
    const userId = req.user.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array required' });
    }

    await db.Notification.update(
      { isRead: read },
      {
        where: {
          id: { [Op.in]: ids },
          [Op.or]: [{ userId: userId }, { userId: null }]
        }
      }
    );

    res.json({ success: true, message: 'Bulk read update successful' });
  } catch (error) {
    console.error('❌ Bulk read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= BULK ARCHIVE / UNARCHIVE =================
router.patch('/bulk-archive', verifyToken, async (req, res) => {
  try {
    const { ids, isArchived } = req.body;
    const userId = req.user.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array required' });
    }

    await db.Notification.update(
      { isArchived },
      {
        where: {
          id: { [Op.in]: ids },
          [Op.or]: [{ userId: userId }, { userId: null }]
        }
      }
    );

    res.json({ success: true, message: 'Bulk archive update successful' });
  } catch (error) {
    console.error('❌ Bulk archive error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= BULK DELETE =================
router.post('/bulk-delete', verifyToken, async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array required' });
    }

    await db.Notification.destroy({
      where: {
        id: { [Op.in]: ids },
        [Op.or]: [{ userId: userId }, { userId: null }]
      }
    });

    res.json({ success: true, message: 'Bulk delete successful' });
  } catch (error) {
    console.error('❌ Bulk delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});









// ================= DELETE ALL NOTIFICATIONS =================
router.delete('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await db.Notification.destroy({
      where: {
        [Op.or]: [
          { userId: userId },
          { userId: null }
        ]
      }
    });

    res.json({
      success: true,
      message: 'All notifications deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notifications',
      error: error.message
    });
  }
});
 
module.exports = router;
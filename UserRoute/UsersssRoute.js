// // UserRoute/UsersssRoute.js
// const express = require('express');
// const router = express.Router();
// const db = require('../models');
// const verifyToken = require('../Middlewares/AuthMiddleware');
// const role = require('../Middlewares/RoleMiddleware');

// // ================= GET ALL USERS =================
// router.get('/', verifyToken, async (req, res) => {
//   try {
//     const users = await db.Users.findAll({
//       attributes: { exclude: ['password'] },
//       order: [['createdAt', 'DESC']]
//     });
    
//     res.json({
//       success: true,
//       data: users,
//       count: users.length
//     });
//   } catch (error) {
//     console.error('❌ Error fetching users:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // ================= DELETE A USER (with unlinking) =================
// router.delete('/:id', verifyToken, role('admin'), async (req, res) => {
//   try {
//     const userId = req.params.id;

//     // 1. Check if user exists
//     const user = await db.Users.findByPk(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // 2. If this user is linked to a teacher, set teacher.userId = NULL
//     const teacher = await db.Teacher.findOne({ where: { userId } });
//     if (teacher) {
//       await teacher.update({ userId: null });
//       console.log(`✅ Unlinked teacher ${teacher.id} from user ${userId}`);
//     }

//     // 3. Delete the user
//     await user.destroy();

//     res.json({
//       success: true,
//       message: 'User deleted successfully'
//     });
//   } catch (error) {
//     console.error('❌ Delete user error:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// module.exports = router;


// UserRoute/UsersssRoute.js – full cascade including Requirements
const express = require('express');
const router = express.Router();
const db = require('../models');
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');

// ================= GET ALL USERS =================
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await db.Users.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================= UPDATE USER =================
router.put('/:id', verifyToken, role('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { Fname, Lname, Email, Phonenumber, role, status } = req.body;

    const user = await db.Users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (Email && Email !== user.Email) {
      const existing = await db.Users.findOne({ where: { Email } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    await user.update({
      Fname: Fname || user.Fname,
      Lname: Lname || user.Lname,
      Email: Email || user.Email,
      Phonenumber: Phonenumber || user.Phonenumber,
      role: role || user.role,
      status: status || user.status,
    });

    const updatedUser = await db.Users.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// PUT /api/users/:id/block
router.put('/:id/block', verifyToken, role('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body; // boolean

    const user = await db.Users.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.update({ isBlocked });

    res.json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: { id: user.id, isBlocked: user.isBlocked },
    });
  } catch (error) {
    console.error('Block/unblock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});





// ================= DELETE USER (full cascade with Requirements) =================
router.delete('/:id', verifyToken, role('admin'), async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const userId = req.params.id;

    const user = await db.Users.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Unlink from Teacher
    const teacher = await db.Teacher.findOne({ where: { userId }, transaction });
    if (teacher) {
      await teacher.update({ userId: null }, { transaction });
    }

    // 2. Notifications: delete createdBy; set userId to NULL
    await db.Notification.destroy({
      where: { createdBy: userId },
      transaction,
    });
    await db.Notification.update(
      { userId: null },
      { where: { userId }, transaction },
    );

    // 3. StudentPromotions: delete where promotedBy = userId
    await db.StudentPromotion.destroy({
      where: { promotedBy: userId },
      transaction,
    });

    // 4. ReportPickup: delete where secretaryId = userId
    if (db.ReportPickup) {
      await db.ReportPickup.destroy({
        where: { secretaryId: userId },
        transaction,
      });
    }

    // 5. UserSettings: delete
    if (db.UserSettings) {
      await db.UserSettings.destroy({
        where: { userId },
        transaction,
      });
    }

    // 6. Requirements: delete where createdBy = userId (NOT NULL)
    if (db.Requirement) {
      await db.Requirement.destroy({
        where: { createdBy: userId },
        transaction,
      });
    }

    // 7. StudentRequirements: if receivedBy = userId, set to NULL (or delete)
    // But receivedBy is nullable, so set to NULL
    if (db.StudentRequirement) {
      await db.StudentRequirement.update(
        { receivedBy: null },
        { where: { receivedBy: userId }, transaction },
      );
    }

    // 8. Finally, delete the user
    await user.destroy({ transaction });

    await transaction.commit();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

module.exports = router;
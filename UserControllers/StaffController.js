const db = require('../models');
const { Staff, Users, Notification } = db;

// ================================
// Helper: Notify all secretaries
// ================================
const notifySecretaries = async (title, message, metadata = {}) => {
  try {
    const secretaries = await Users.findAll({
      where: { role: 'secretary' }
    });
    for (const sec of secretaries) {
      await Notification.create({
        userId: sec.id,
        title,
        message,
        type: 'info',
        category: 'staff',
        priority: 'medium',
        createdBy: sec.id, // or system user id if you have one
        actionLink: '/secretary/staff',
        actionLabel: 'View Staff',
        isRead: false,
        metadata
      });
    }
  } catch (e) {
    console.error('Notification error:', e.message);
  }
};

// ================================
// CREATE Staff
// ================================
exports.createStaff = async (req, res, next) => {
  try {
    let staffData = req.body;

    // Auto-generate employeeNumber if not provided
    if (!staffData.employeeNumber) {
      const count = await Staff.count();
      staffData.employeeNumber = `STF-${String(count + 1).padStart(4, '0')}`;
    }

    const staff = await Staff.create(staffData);

    // Notify secretaries about new staff
    await notifySecretaries(
      '👤 New Non-Teaching Staff Added',
      `${staff.fullName} (${staff.position}) has been registered in ${staff.department || 'General'}.`,
      { staffId: staff.id, position: staff.position }
    );

    // Fetch the created staff with all fields (including BaseSalary)
    const createdStaff = await Staff.findByPk(staff.id);
    res.status(201).json({ success: true, data: createdStaff });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET ALL Staff
// ================================
exports.getAllStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET Staff by ID
// ================================
exports.getStaffById = async (req, res, next) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff record not found' });
    }
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

// ================================
// UPDATE Staff
// ================================
exports.updateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff record not found' });
    }
    await staff.update(req.body);
    // Fetch updated staff to return full object
    const updatedStaff = await Staff.findByPk(req.params.id);
    res.json({ success: true, data: updatedStaff });
  } catch (error) {
    next(error);
  }
};

// ================================
// DELETE Staff
// ================================
exports.deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff record not found' });
    }
    await staff.destroy();
    res.json({ success: true, message: 'Staff record deleted successfully' });
  } catch (error) {
    next(error);
  }
};
const express = require('express');
const router = express.Router();
const StaffController = require('../UserControllers/StaffController');
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');

// All routes require authentication and admin/secretary privileges
router.use(verifyToken);

router.post('/', role('admin', 'secretary'), StaffController.createStaff);
router.get('/', role('admin', 'secretary'), StaffController.getAllStaff);
router.get('/:id', role('admin', 'secretary'), StaffController.getStaffById);
router.put('/:id', role('admin', 'secretary'), StaffController.updateStaff);
router.delete('/:id', role('admin', 'secretary'), StaffController.deleteStaff);

module.exports = router;
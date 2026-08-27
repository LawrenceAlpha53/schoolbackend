const express = require('express');
const router = express.Router();
const PromotionController = require('../UserControllers/PromotionController');
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');

// All promotion routes require authentication
router.use(verifyToken);

// Bulk promote students (teachers, admin, secretary)
router.post('/bulk', role('admin', 'teacher', 'secretary'), PromotionController.bulkPromote);

// Get promotion history (with filters)
router.get('/', role('admin', 'teacher', 'secretary'), PromotionController.getHistory);

// Get promotion statistics
router.get('/stats', role('admin', 'teacher', 'secretary'), PromotionController.getStats);

module.exports = router;
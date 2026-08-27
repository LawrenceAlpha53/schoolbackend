const router = require('express').Router();
const DashboardController = require('../UserControllers/DashboardController');

router.get('/', DashboardController.getDashboardStats);

module.exports = router;
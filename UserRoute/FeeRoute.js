// const router = require('express').Router();
// const FeeController = require('../UserControllers/FeeController');

// // CREATE FEE
// router.post('/', FeeController.createFee);

// // GET ALL FEES
// router.get('/', FeeController.getAllFees);

// // GET STUDENT FEES
// router.get('/student/:studentId', FeeController.getStudentFees);

// module.exports = router;


const express = require('express');
const router = express.Router();
const FeeController = require('../UserControllers/FeeController');
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');

// Public routes (with auth)
router.post('/', verifyToken, FeeController.createFee);
router.get('/', verifyToken, FeeController.getAllFees);
router.get('/stats', verifyToken, FeeController.getFeeStats);
router.get('/outstanding', verifyToken, FeeController.getOutstandingFees);
router.get('/term', verifyToken, FeeController.getFeesByTerm);
router.get('/:id', verifyToken, FeeController.getFeeById);
router.get('/student/:studentId', verifyToken, FeeController.getStudentFees);
router.put('/:id', verifyToken, FeeController.updateFee);
router.delete('/:id', verifyToken, FeeController.deleteFee);

module.exports = router;
const express = require('express');
const router = express.Router();

const ClassController = require('../UserControllers/CreatedClasscontrollers');
const verifyToken = require('../Middlewares/AuthMiddleware');

// CREATE
router.post('/', verifyToken, ClassController.createClass);

// READ ALL
router.get('/', verifyToken, ClassController.getClasses);

// READ ONE
router.get('/:id', verifyToken, ClassController.getClass);

// UPDATE
router.put('/:id', verifyToken, ClassController.updateClass);

// DELETE
router.delete('/:id', verifyToken, ClassController.deleteClass);

module.exports = router;
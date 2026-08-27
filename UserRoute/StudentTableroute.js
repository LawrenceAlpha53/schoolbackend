const express = require('express');

const router = express.Router();

const StudentController =
require('../UserControllers/StudentTable');

const verifyToken =
require('../Middlewares/AuthMiddleware');

router.post(
  '/',
  verifyToken,
  StudentController.createStudent
);

router.get(
  '/',
  verifyToken,
  StudentController.getStudents
);

router.get(
  '/:id',
  verifyToken,
  StudentController.getStudent
);

router.put(
  '/:id',
  verifyToken,
  StudentController.updateStudent
);

router.delete(
  '/:id',
  verifyToken,
  StudentController.deleteStudent
);

module.exports = router;
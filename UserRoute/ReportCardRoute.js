const express = require('express');
const router = express.Router();

const ReportCardController =
require('../UserControllers/ReportCardController');

const auth =
require('../Middlewares/AuthMiddleware');

router.get(
  '/:studentId',
  auth,
  ReportCardController.getStudentReportCard
);

module.exports = router;
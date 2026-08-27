const express = require('express');

const router = express.Router();

const ClassController =
require('../UserControllers/ClassController');

const verifyToken =
require('../Middlewares/AuthMiddleware');

router.post(
  '/',
  verifyToken,
  ClassController.createClass
);

router.get(
  '/',
  verifyToken,
  ClassController.getClasses
);

router.get(
  '/:id',
  verifyToken,
  ClassController.getClass
);

router.put(
  '/:id',
  verifyToken,
  ClassController.updateClass
);

router.delete(
  '/:id',
  verifyToken,
  ClassController.deleteClass
);

module.exports = router;
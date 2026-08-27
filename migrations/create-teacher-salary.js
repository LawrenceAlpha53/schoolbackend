// routes/UserRoute/TeacherSalaryRoute.js
const express = require('express');
const router = express.Router();
const { TeacherSalary, Teacher, sequelize } = require('../models'); // import sequelize too
const { verifyToken, role } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/teacher-salaries
router.get('/', verifyToken, role('admin'), async (req, res) => {
  try {
    const { teacherId, month, year } = req.query;
    const where = {};
    if (teacherId) where.teacherId = teacherId;
    if (month) where.month = month;
    if (year) where.year = year;

    const salaries = await TeacherSalary.findAll({
      where,
      include: [
        {
          model: Teacher,
          attributes: ['fullName']
        }
      ],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    res.json({ success: true, data: salaries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/teacher-salaries
router.post('/', verifyToken, role('admin'), async (req, res) => {
  try {
    const { teacherId, month, year, amountPaid, status, paymentDate, remarks } = req.body;
    const recordedBy = req.user.id;

    const salary = await TeacherSalary.create({
      teacherId,
      month,
      year,
      amountPaid,
      status: status || 'paid',
      paymentDate,
      remarks,
      recordedBy
    });
    res.status(201).json({ success: true, data: salary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/teacher-salaries/:id
router.put('/:id', verifyToken, role('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year, amountPaid, status, paymentDate, remarks } = req.body;
    const salary = await TeacherSalary.findByPk(id);
    if (!salary) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }
    await salary.update({
      month,
      year,
      amountPaid,
      status,
      paymentDate,
      remarks
    });
    // Reload with Teacher
    const updated = await TeacherSalary.findByPk(id, {
      include: [{ model: Teacher, attributes: ['fullName'] }]
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/teacher-salaries/:id
router.delete('/:id', verifyToken, role('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const salary = await TeacherSalary.findByPk(id);
    if (!salary) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }
    await salary.destroy();
    res.json({ success: true, message: 'Salary record deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/teacher-salaries/summary
router.get('/summary', verifyToken, role('admin'), async (req, res) => {
  try {
    const { teacherId, month, year } = req.query;
    const where = {};
    if (teacherId) where.teacherId = teacherId;
    if (month) where.month = month;
    if (year) where.year = year;

    // Group by teacherId
    const results = await TeacherSalary.findAll({
      where,
      attributes: [
        'teacherId',
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalAmountPaid'],
        [sequelize.fn('SUM', sequelize.literal(`CASE WHEN status = 'unpaid' THEN amountPaid ELSE 0 END`)), 'totalUnpaid'],
        [sequelize.fn('MAX', sequelize.col('paymentDate')), 'lastPaymentDate']
      ],
      include: [{ model: Teacher, attributes: ['fullName'] }],
      group: ['teacherId', 'Teacher.id']
    });

    res.json({ success: true, data: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
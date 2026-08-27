// UserRoute/TeacherSalaryRoute.js – FINAL (recordedBy optional)
const express = require('express');
const router = express.Router();
const { TeacherSalary, Teacher, sequelize } = require('../models');
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');

// ----- TEST -----
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'TeacherSalaryRoute is working!' });
});

// ----- GET all salaries -----
router.get('/', verifyToken, role('admin'), async (req, res) => {
  try {
    const { teacherId, month, year } = req.query;
    const where = {};
    if (teacherId) where.teacherId = teacherId;
    if (month !== undefined) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const salaries = await TeacherSalary.findAll({
      where,
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'fullName', 'employeeNumber'] }],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    res.json({ success: true, data: salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----- POST create salary (recordedBy optional) -----
router.post('/', verifyToken, role('admin'), async (req, res) => {
  try {
    const { teacherId, month, year, amountPaid, status, paymentDate, remarks } = req.body;
    if (!teacherId || month === undefined || !year) {
      return res.status(400).json({ success: false, message: 'teacherId, month, and year are required' });
    }
    const existing = await TeacherSalary.findOne({ where: { teacherId, month, year } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Salary record already exists for this month' });
    }

    const recordedBy = req.user?.id || null; // can be null

    const salary = await TeacherSalary.create({ 
      teacherId, 
      month, 
      year, 
      amountPaid, 
      status, 
      paymentDate, 
      remarks,
      recordedBy
    });
    const created = await TeacherSalary.findByPk(salary.id, {
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'fullName'] }]
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----- PUT update salary -----
router.put('/:id', verifyToken, role('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year, amountPaid, status, paymentDate, remarks } = req.body;
    const salary = await TeacherSalary.findByPk(id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found' });
    await salary.update({ month, year, amountPaid, status, paymentDate, remarks });
    const updated = await TeacherSalary.findByPk(id, {
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'fullName'] }]
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----- DELETE salary -----
router.delete('/:id', verifyToken, role('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const salary = await TeacherSalary.findByPk(id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found' });
    await salary.destroy();
    res.json({ success: true, message: 'Salary record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----- SUMMARY – raw SQL -----
router.get('/summary', verifyToken, role('admin'), async (req, res) => {
  try {
    const { teacherId } = req.query;
    let whereClause = '';
    if (teacherId) {
      whereClause = `WHERE "TeacherSalary"."teacherId" = ${parseInt(teacherId)}`;
    }
    const sql = `
      SELECT 
        "TeacherSalary"."teacherId",
        SUM("TeacherSalary"."amountPaid") AS "totalAmountPaid",
        SUM(CASE WHEN "TeacherSalary"."status" = 'unpaid' THEN "TeacherSalary"."amountPaid" ELSE 0 END) AS "totalUnpaid",
        MAX("TeacherSalary"."paymentDate") AS "lastPaymentDate",
        "Teacher"."fullName" AS "teacher.fullName"
      FROM "TeacherSalaries" AS "TeacherSalary"
      LEFT JOIN "Teachers" AS "Teacher" ON "Teacher"."id" = "TeacherSalary"."teacherId"
      ${whereClause}
      GROUP BY "TeacherSalary"."teacherId", "Teacher"."fullName"
    `;
    const [results] = await sequelize.query(sql);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { StaffSalary, Staff, sequelize } = require('../models'); // Ensure Staff is imported
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');

// GET all staff salaries with optional filters
router.get('/', verifyToken, role('admin'), async (req, res) => {
  try {
    const { staffId, month, year  } = req.query;
    const where = {};
    if (staffId) where.staffId = staffId;
    if (month !== undefined) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    

    const salaries = await StaffSalary.findAll({
      where,
      include: [{
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'employeeNumber']
      }],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    res.json({ success: true, data: salaries });
  } catch (error) {
    console.error('GET staff-salaries error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new staff salary
router.post('/', verifyToken, role('admin'), async (req, res) => {
  try {
    const { staffId, month, year, amountPaid, status, paymentDate, remarks,} = req.body;
    if (!staffId || month === undefined || !year) {
      return res.status(400).json({ success: false, message: 'staffId, month, and year are required' });
    }
    const existing = await StaffSalary.findOne({ where: { staffId, month, year } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Salary record already exists for this month' });
    }
    const recordedBy = req.user?.id || null;
    const salary = await StaffSalary.create({
      staffId, month, year, amountPaid, status, paymentDate, remarks, recordedBy
    });
    const created = await StaffSalary.findByPk(salary.id, {
      include: [{ model: Staff, as: 'staff', attributes: ['id', 'fullName'] }]
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('POST staff-salary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update staff salary
router.put('/:id', verifyToken, role('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year, amountPaid, status, paymentDate, remarks } = req.body;
    const salary = await StaffSalary.findByPk(id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found' });
    await salary.update({ month, year, amountPaid, BaseSalary, status, paymentDate, remarks });
    const updated = await StaffSalary.findByPk(id, {
      include: [{ model: Staff, as: 'staff', attributes: ['id', 'fullName'] }]
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('PUT staff-salary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE staff salary
router.delete('/:id', verifyToken, role('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const salary = await StaffSalary.findByPk(id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found' });
    await salary.destroy();
    res.json({ success: true, message: 'Salary record deleted' });
  } catch (error) {
    console.error('DELETE staff-salary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET summary
router.get('/summary', verifyToken, role('admin'), async (req, res) => {
  try {
    const { staffId } = req.query;
    let whereClause = '';
    if (staffId) {
      whereClause = `WHERE "StaffSalary"."staffId" = ${parseInt(staffId)}`;
    }
    const sql = `
      SELECT 
        "StaffSalary"."staffId", 
        SUM("StaffSalary"."amountPaid") AS "totalAmountPaid",
        SUM(CASE WHEN "StaffSalary"."status" = 'unpaid' THEN "StaffSalary"."amountPaid" ELSE 0 END) AS "totalUnpaid",
        MAX("StaffSalary"."paymentDate") AS "lastPaymentDate",
        "Staff"."fullName" AS "staff.fullName"
      FROM "StaffSalaries" AS "StaffSalary"
      LEFT JOIN "Staff" AS "Staff" ON "Staff"."id" = "StaffSalary"."staffId"
      ${whereClause}
      GROUP BY "StaffSalary"."staffId", "Staff"."fullName"
    `;
    const [results] = await sequelize.query(sql);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('GET staff-salary summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');
const db = require('../models');

router.use(verifyToken);

// ===== DASHBOARD STATS =====
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalRequirements = await db.Requirement.count();
    const totalAssignments = await db.StudentRequirement.count();
    const completed = await db.StudentRequirement.count({ where: { status: 'Completed' } });
    const partial = await db.StudentRequirement.count({ where: { status: 'Partial' } });
    const pending = await db.StudentRequirement.count({ where: { status: 'Pending' } });
    const completionPercentage = totalAssignments > 0 ? Math.round((completed / totalAssignments) * 100) : 0;
    res.json({ success: true, data: { totalRequirements, totalAssignments, completed, pending, partial, completionPercentage } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET ALL REQUIREMENTS =====
router.get('/', async (req, res) => {
  try {
    const requirements = await db.Requirement.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: requirements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// ✅ IMPORTANT: Specific routes MUST come BEFORE /:id
// ============================================================

// ===== ✅ GET ALL STUDENT REQUIREMENTS (for dashboard) =====
// This MUST come before /:id or Express will treat "student-requirements" as an ID
router.get('/student-requirements', async (req, res) => {
  try {
    const { academicYear, term } = req.query;
    
    const where = {};
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = term;
    
    const studentReqs = await db.StudentRequirement.findAll({
      where,
      include: [
        { 
          model: db.Student, 
          as: 'student',
          attributes: ['id', 'fullName', 'studentNumber', 'classId'],
          include: [{ model: db.Class, as: 'class', attributes: ['id', 'className'] }]
        },
        { 
          model: db.Requirement, 
          as: 'requirement',
          attributes: ['id', 'requirementName', 'category', 'quantityRequired', 'unit']
        },
        { 
          model: db.Users, 
          as: 'receiver', 
          attributes: ['id', 'Fname', 'Lname'] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`✅ Found ${studentReqs.length} student requirements`);
    res.json({ success: true, data: studentReqs });
  } catch (error) {
    console.error('❌ Get student requirements error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET STUDENT REQUIREMENTS (by student ID) =====
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, term } = req.query;
    
    const where = { studentId: parseInt(studentId) };
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = term;
    
    const studentReqs = await db.StudentRequirement.findAll({
      where,
      include: [{ model: db.Requirement, as: 'requirement' }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, data: studentReqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET STUDENT HISTORY =====
router.get('/student/:studentId/history', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const history = await db.StudentRequirement.findAll({
      where: { studentId: parseInt(studentId) },
      include: [
        { 
          model: db.Requirement, 
          as: 'requirement',
          attributes: ['id', 'requirementName', 'category', 'quantityRequired', 'unit']
        },
        { 
          model: db.Users, 
          as: 'receiver', 
          attributes: ['id', 'Fname', 'Lname'] 
        }
      ],
      order: [['updatedAt', 'DESC']]
    });
    
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET SINGLE REQUIREMENT =====
// ⚠️ This MUST come AFTER all specific routes
router.get('/:id', async (req, res) => {
  try {
    const requirement = await db.Requirement.findByPk(req.params.id);
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }
    res.json({ success: true, data: requirement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== CREATE REQUIREMENT =====
router.post('/', role('admin', 'secretary'), async (req, res) => {
  try {
    const requirement = await db.Requirement.create(req.body);
    res.json({ success: true, data: requirement });
  } catch (error) {
    console.error('❌ Create requirement error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== UPDATE REQUIREMENT =====
router.put('/:id', role('admin', 'secretary'), async (req, res) => {
  try {
    const requirement = await db.Requirement.findByPk(req.params.id);
    if (!requirement) return res.status(404).json({ success: false, message: 'Not found' });
    await requirement.update(req.body);
    res.json({ success: true, data: requirement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== DELETE REQUIREMENT =====
router.delete('/:id', role('admin', 'secretary'), async (req, res) => {
  try {
    const requirement = await db.Requirement.findByPk(req.params.id);
    if (!requirement) return res.status(404).json({ success: false, message: 'Not found' });
    await requirement.destroy();
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== FIXED ASSIGNMENT - NO CONDITION =====
router.post('/assign/students', role('admin', 'secretary'), async (req, res) => {
  try {
    const { requirementId, studentIds, academicYear, term } = req.body;
    
    console.log('📤 ===== ASSIGNMENT REQUEST =====');
    console.log('📤 requirementId:', requirementId);
    console.log('📤 studentIds:', studentIds);
    console.log('📤 academicYear:', academicYear);
    console.log('📤 term:', term);
    
    if (!requirementId) {
      return res.status(400).json({ success: false, message: 'Missing requirementId' });
    }
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing studentIds array' });
    }

    const requirement = await db.Requirement.findByPk(parseInt(requirementId));
    if (!requirement) {
      console.log('❌ Requirement not found:', requirementId);
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }
    
    console.log('📌 Requirement:', requirement.requirementName);
    console.log('📌 Quantity:', requirement.quantityRequired);

    const year = academicYear || requirement.academicYear || '2026';
    const termValue = term || requirement.term || 'Term 1';

    console.log('📌 Year:', year, 'Term:', termValue);

    const results = [];

    for (const studentId of studentIds) {
      try {
        console.log(`📤 Processing student ${studentId}...`);
        
        const student = await db.Student.findByPk(parseInt(studentId));
        if (!student) {
          console.log(`❌ Student ${studentId} not found`);
          continue;
        }
        
        console.log(`✅ Student: ${student.fullName}`);

        const assignment = await db.StudentRequirement.create({
          studentId: parseInt(studentId),
          requirementId: parseInt(requirementId),
          requiredQuantity: requirement.quantityRequired,
          quantityReceived: 0,
          balance: requirement.quantityRequired,
          status: 'Pending',
          academicYear: year,
          term: termValue,
          remarks: `Assigned for ${termValue} ${year}`
        });

        console.log(`✅ CREATED ID: ${assignment.id}`);
        results.push(assignment);
      } catch (error) {
        console.error(`❌ Error for student ${studentId}:`, error.message);
      }
    }

    console.log(`📊 TOTAL: ${results.length}`);

    res.json({ 
      success: true, 
      data: results, 
      count: results.length,
      message: `${results.length} students assigned successfully` 
    });
  } catch (error) {
    console.error('❌ Assignment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== ASSIGN TO CLASS =====
router.post('/assign/class', role('admin', 'secretary'), async (req, res) => {
  try {
    const { requirementId, classId, academicYear, term } = req.body;
    
    if (!requirementId || !classId) {
      return res.status(400).json({ success: false, message: 'Missing requirementId or classId' });
    }

    const requirement = await db.Requirement.findByPk(parseInt(requirementId));
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }

    const year = academicYear || requirement.academicYear || '2026';
    const termValue = term || requirement.term || 'Term 1';

    const students = await db.Student.findAll({ 
      where: { classId: parseInt(classId) },
      attributes: ['id']
    });

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students in this class' });
    }

    const results = [];

    for (const student of students) {
      try {
        const assignment = await db.StudentRequirement.create({
          studentId: student.id,
          requirementId: parseInt(requirementId),
          requiredQuantity: requirement.quantityRequired,
          quantityReceived: 0,
          balance: requirement.quantityRequired,
          status: 'Pending',
          academicYear: year,
          term: termValue,
          remarks: `Assigned for ${termValue} ${year}`
        });
        results.push(assignment);
      } catch (error) {
        console.error(`Error for student ${student.id}:`, error.message);
      }
    }

    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error('Assign class error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== RECEIVE ITEMS =====
router.post('/receive', role('admin', 'secretary'), async (req, res) => {
  try {
    const { studentRequirementId, quantityReceived, condition, remarks } = req.body;
    
    if (!studentRequirementId || !quantityReceived) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const sr = await db.StudentRequirement.findByPk(parseInt(studentRequirementId));
    if (!sr) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    if (quantityReceived < 1 || quantityReceived > sr.balance) {
      return res.status(400).json({ 
        success: false, 
        message: `Quantity must be between 1 and ${sr.balance}` 
      });
    }

    const newReceived = sr.quantityReceived + quantityReceived;
    const newBalance = sr.requiredQuantity - newReceived;
    const newStatus = newBalance <= 0 ? 'Completed' : 'Partial';

    await sr.update({
      quantityReceived: newReceived,
      balance: newBalance,
      status: newStatus,
      condition: condition || sr.condition,
      remarks: remarks || sr.remarks,
      receivedBy: req.user.id,
      receivedDate: new Date()
    });

    res.json({ success: true, data: sr });
  } catch (error) {
    console.error('Receive error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
// UserRoute/StudentRoute.js – COMPLETE OPTIMIZED VERSION (Streaming CSV, Batch Insert, 10GB support)
// FIXED: handles missing classId by assigning default class or skipping rows.

const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const router = express.Router();
const StudentController = require('../UserControllers/StudentController');
const verifyToken = require('../Middlewares/AuthMiddleware');
const PromotionService = require('../UserServices/PromotionService');
const { Student, Class, Attendance, Fee, Mark, ReportCard, StudentRequirement, sequelize } = require('../models');

// ========== ENSURE UPLOADS DIRECTORY EXISTS ==========
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ========== MULTER CONFIGURATION – diskStorage, 10GB limit ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype) ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls') ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'), false);
    }
  }
});

// ========== ORIGINAL ROUTES (ALL WORKING) ==========
router.post('/', verifyToken, StudentController.createStudent);
router.get('/', verifyToken, StudentController.getStudents);
router.get('/:id', verifyToken, StudentController.getStudent);
router.put('/:id', verifyToken, StudentController.updateStudent);
router.delete('/:id', verifyToken, StudentController.deleteStudent);

// ========== BULK IMPORT – STREAMING CSV + BATCH INSERTS ==========
router.post('/import', verifyToken, upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    // ---------- Handle Excel files (with default class fallback) ----------
    if (ext === '.xlsx' || ext === '.xls') {
      try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(worksheet);
        fs.unlinkSync(filePath);

        if (rows.length === 0) {
          return res.status(400).json({ success: false, message: 'The uploaded file is empty' });
        }

        // Pre‑load class cache and default class
        const classMap = new Map();
        const classes = await Class.findAll({ attributes: ['id', 'className'] });
        classes.forEach(c => classMap.set(c.className.trim(), c.id));
        const defaultClass = await Class.findOne({ order: [['id', 'ASC']] });
        const defaultClassId = defaultClass ? defaultClass.id : null;

        const result = { total: rows.length, added: 0, skipped: 0, errors: [] };
        const studentsToCreate = [];

        for (const row of rows) {
          const studentNumber = row['Student Number'] || row['studentNumber'] || row['student_number'] || row['StudentNumber'];
          const fullName = row['Full Name'] || row['fullName'] || row['full_name'] || row['FullName'];
          const gender = row['Gender'] || row['gender'];
          const className = row['Class Name'] || row['className'] || row['class'] || row['Class'] || row['class_name'];
          const parentName = row['Parent Name'] || row['parentName'] || row['parent_name'] || row['parent'];
          const parentPhone = row['Parent Phone'] || row['parentPhone'] || row['parent_phone'] || row['phone'];
          const address = row['Address'] || row['address'];

          if (!studentNumber || !fullName) {
            result.errors.push({ row, reason: 'Missing required fields: Student Number and Full Name' });
            continue;
          }

          // Check duplicate
          const existing = await Student.findOne({
            where: { studentNumber: String(studentNumber).trim() }
          });
          if (existing) {
            result.skipped++;
            continue;
          }

          // ---- Handle classId ----
          let classId = null;
          if (className) {
            classId = classMap.get(className.trim()) || null;
            if (!classId) {
              result.errors.push({ row, reason: `Class "${className}" not found. Create it first.` });
              continue; // skip row if class not found
            }
          } else {
            // No class provided – use default class if available
            if (defaultClassId !== null) {
              classId = defaultClassId;
            } else {
              result.errors.push({ row, reason: 'No class provided and no default class exists. Please create a class first.' });
              continue;
            }
          }

          studentsToCreate.push({
            studentNumber: String(studentNumber).trim(),
            fullName: String(fullName).trim(),
            gender: gender || 'Male',
            dateOfBirth: null,
            classId: classId,
            parentName: parentName ? String(parentName).trim() : null,
            parentPhone: parentPhone ? String(parentPhone).trim() : null,
            address: address ? String(address).trim() : null,
            status: 'Active',
            nationality: 'Ugandan',
            medicalcondition: 'none'
          });
        }

        if (studentsToCreate.length > 0) {
          await Student.bulkCreate(studentsToCreate);
          result.added = studentsToCreate.length;
        }

        return res.status(200).json({
          success: true,
          data: result,
          message: `Import completed: ${result.added} added, ${result.skipped} skipped, ${result.errors.length} errors.`
        });
      } catch (error) {
        fs.unlinkSync(filePath);
        return res.status(500).json({ success: false, message: 'Excel processing failed: ' + error.message });
      }
    }

    // ---------- CSV – streaming, batch insert with default class ----------
    if (ext !== '.csv') {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Only CSV files are supported for large imports.' });
    }

    // Pre‑load class cache and default class
    const classMap = new Map();
    const classes = await Class.findAll({ attributes: ['id', 'className'] });
    classes.forEach(c => classMap.set(c.className.trim(), c.id));
    const defaultClass = await Class.findOne({ order: [['id', 'ASC']] });
    const defaultClassId = defaultClass ? defaultClass.id : null;

    const BATCH_SIZE = 50000;   // rows per SQL insert
    let totalRows = 0;
    let inserted = 0;
    let duplicateSkipped = 0;
    let errors = [];
    let batch = [];

    function escapeSQL(str) {
      if (str === null || str === undefined) return '';
      return String(str).replace(/'/g, "''");
    }

    async function insertBatch(rows) {
      if (rows.length === 0) return;
      const values = rows.map(r => {
        // r now contains classId directly
        const classId = r.classId;
        return `(
          '${escapeSQL(r.studentNumber)}',
          '${escapeSQL(r.fullName)}',
          '${escapeSQL(r.gender || 'Male')}',
          ${classId === null ? 'NULL' : classId},
          ${r.parentName ? `'${escapeSQL(r.parentName)}'` : 'NULL'},
          ${r.parentPhone ? `'${escapeSQL(r.parentPhone)}'` : 'NULL'},
          ${r.address ? `'${escapeSQL(r.address)}'` : 'NULL'},
          NOW(),
          NOW()
        )`;
      }).join(',');

      const sql = `
        INSERT INTO "Students" (
          "studentNumber", "fullName", "gender", "classId",
          "parentName", "parentPhone", "address",
          "createdAt", "updatedAt"
        )
        VALUES ${values}
        ON CONFLICT ("studentNumber") DO NOTHING
      `;

      const result = await sequelize.query(sql);
      const insertedCount = result[0] ? result[0].rowCount : 0;
      inserted += insertedCount;
      duplicateSkipped += rows.length - insertedCount;
    }

    // Stream CSV
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let isFirstLine = true;
    let header = [];

    for await (const line of rl) {
      if (!line.trim()) continue;

      if (isFirstLine) {
        header = line.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        isFirstLine = false;
        continue;
      }

      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row = {};
      header.forEach((key, index) => {
        row[key] = values[index] || '';
      });

      const studentNumber = row['Student Number'] || row['studentNumber'] || row['student_number'];
      const fullName = row['Full Name'] || row['fullName'] || row['full_name'];

      if (!studentNumber || !fullName) {
        errors.push({ row, reason: 'Missing studentNumber or fullName' });
        continue;
      }

      // ---- Handle classId ----
      const className = (row['Class'] || row['class'] || row['className'] || '').trim();
      let classId = null;
      if (className) {
        classId = classMap.get(className) || null;
        if (!classId) {
          errors.push({ row, reason: `Class "${className}" not found. Create it first.` });
          continue; // skip row
        }
      } else {
        // No class provided – use default class if available
        if (defaultClassId !== null) {
          classId = defaultClassId;
        } else {
          errors.push({ row, reason: 'No class provided and no default class exists. Please create a class first.' });
          continue;
        }
      }

      const rec = {
        studentNumber: studentNumber.trim(),
        fullName: fullName.trim(),
        gender: row['Gender'] || row['gender'] || 'Male',
        classId: classId,  // store resolved classId
        parentName: (row['Parent Name'] || row['parentName'] || row['parent_name'] || '').trim() || null,
        parentPhone: (row['Parent Phone'] || row['parentPhone'] || row['parent_phone'] || '').trim() || null,
        address: (row['Address'] || row['address'] || '').trim() || null,
      };

      batch.push(rec);
      totalRows++;

      if (batch.length >= BATCH_SIZE) {
        await insertBatch(batch);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await insertBatch(batch);
    }

    // Clean up file
    fs.unlinkSync(filePath);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Imported ${inserted} students (skipped ${duplicateSkipped} duplicates) in ${duration}s`);

    res.status(200).json({
      success: true,
      data: {
        totalRows,
        inserted,
        duplicateSkipped,
        errors: errors.slice(0, 50),
        duration: `${duration}s`
      },
      message: `Import completed in ${duration}s. ${inserted} added, ${duplicateSkipped} skipped.`
    });

  } catch (error) {
    console.error('Import error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ========== FORCE DELETE STUDENT ==========
router.delete('/:id/force', verifyToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log(`🔍 Force deleting student ${studentId}...`);
    
    await Attendance.destroy({ where: { studentId } }).catch(e => console.log('⚠️ Attendance:', e.message));
    await Fee.destroy({ where: { studentId } }).catch(e => console.log('⚠️ Fee:', e.message));
    await Mark.destroy({ where: { studentId } }).catch(e => console.log('⚠️ Mark:', e.message));
    await ReportCard.destroy({ where: { studentId } }).catch(e => console.log('⚠️ ReportCard:', e.message));
    if (StudentRequirement) {
      await StudentRequirement.destroy({ where: { studentId } }).catch(e => console.log('⚠️ Requirement:', e.message));
    }
    
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    await student.destroy();
    
    res.json({ success: true, message: 'Student and all related records deleted successfully' });
  } catch (error) {
    console.error('❌ Force delete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DELETE ATTENDANCE BY STUDENT ==========
router.delete('/attendance/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    await Attendance.destroy({ where: { studentId } });
    res.json({ success: true, message: 'Attendance records deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DELETE FEES BY STUDENT ==========
router.delete('/fees/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    await Fee.destroy({ where: { studentId } });
    res.json({ success: true, message: 'Fee records deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DELETE MARKS BY STUDENT ==========
router.delete('/marks/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    await Mark.destroy({ where: { studentId } });
    res.json({ success: true, message: 'Mark records deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// ✅ PROMOTION ENDPOINTS (UNCHANGED)
// ============================================================
router.post('/promote/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term, academicYear, remarks } = req.body;
    const promotedBy = req.user.id;

    if (term && term !== 'Term 3') {
      return res.status(400).json({
        success: false,
        message: 'Promotion is only allowed in the third term (Term 3).'
      });
    }

    const promotion = await PromotionService.autoPromoteStudent({
      studentId,
      term: term || 'Term 3',
      academicYear: academicYear || new Date().getFullYear().toString(),
      promotedBy,
      remarks: remarks || '',
    });

    const updatedStudent = await Student.findByPk(studentId, {
      include: [{ model: Class, as: 'class' }]
    });

    res.json({
      success: true,
      message: `Student promoted to ${updatedStudent.class.className}`,
      data: updatedStudent,
      promotion: promotion
    });
  } catch (error) {
    console.error('Promotion error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/bulk-promote', verifyToken, async (req, res) => {
  try {
    const { studentIds, fromClassId, toClassId, term, academicYear, remarks } = req.body;
    const promotedBy = req.user.id;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'studentIds must be a non-empty array.'
      });
    }

    if (!fromClassId || !toClassId) {
      return res.status(400).json({
        success: false,
        message: 'fromClassId and toClassId are required.'
      });
    }

    const promotions = await PromotionService.promoteStudents({
      studentIds,
      fromClassId,
      toClassId,
      academicYear: academicYear || new Date().getFullYear().toString(),
      term: term || 'Term 3',
      remarks: remarks || '',
      promotedBy,
    });

    res.json({
      success: true,
      message: `${promotions.length} students promoted successfully.`,
      data: promotions
    });
  } catch (error) {
    console.error('Bulk promotion error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/auto-promote-class/:classId', verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { term, academicYear, remarks } = req.body;
    const promotedBy = req.user.id;

    const students = await Student.findAll({
      where: { classId },
      include: [{ model: Class, as: 'class' }]
    });

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No students found in this class.'
      });
    }

    const nextClass = await PromotionService.getNextClass(classId);
    if (!nextClass) {
      return res.status(400).json({
        success: false,
        message: 'No higher class exists. Students cannot be promoted further.'
      });
    }

    const studentIds = students.map(s => s.id);
    const promotions = await PromotionService.promoteStudents({
      studentIds,
      fromClassId: parseInt(classId),
      toClassId: nextClass.id,
      academicYear: academicYear || new Date().getFullYear().toString(),
      term: term || 'Term 3',
      remarks: remarks || `Auto-promotion from ${students[0].class.className} to ${nextClass.className}`,
      promotedBy,
    });

    res.json({
      success: true,
      message: `${promotions.length} students promoted from ${students[0].class.className} to ${nextClass.className}`,
      data: promotions
    });
  } catch (error) {
    console.error('Class auto-promotion error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/promotion-history', verifyToken, async (req, res) => {
  try {
    const { studentId, fromClassId, toClassId, academicYear, term, limit, offset } = req.query;
    const result = await PromotionService.getPromotionHistory({
      studentId: studentId ? parseInt(studentId) : undefined,
      fromClassId: fromClassId ? parseInt(fromClassId) : undefined,
      toClassId: toClassId ? parseInt(toClassId) : undefined,
      academicYear,
      term,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Promotion history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/promotion-stats', verifyToken, async (req, res) => {
  try {
    const { academicYear, term } = req.query;
    const stats = await PromotionService.getPromotionStats({ academicYear, term });
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Promotion stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
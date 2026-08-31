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

// ========== BULK IMPORT – UNIFIED FAST PATH (Excel + CSV) ==========
// Why this was rewritten (v2):
//  1. The old Excel path ran `Student.findOne()` (a DB round-trip) for EVERY
//     row to check duplicates. For 1,000,000 rows that is 1,000,000
//     sequential queries — this alone can take hours.
//  2. The old Excel path then called `Student.bulkCreate(studentsToCreate)`
//     with ALL rows in a single call. Postgres has a hard limit of 65,535
//     bind parameters per query, so anything past ~7,000 rows blew past
//     that limit and the whole import threw.
//  3. Duplicate detection is pushed down to the database via
//     `ON CONFLICT ("studentNumber") DO NOTHING` (index-backed, effectively
//     free) instead of one SELECT per row.
//  4. IMPORTANT (fixed in v2): batches are now inserted AS THEY ARE BUILT,
//     with a bounded number running concurrently (a semaphore), instead of
//     collecting every batch for the whole file before inserting any of
//     them. The earlier version held the ENTIRE file in memory twice over
//     (once as raw parsed rows, once as normalized batches waiting to be
//     inserted) — for 1,000,000 rows that is enough to blow through
//     Node's ~2GB default heap ceiling and crash the whole process, which
//     also explains why unrelated requests (login, /fees, /settings) all
//     failed with "Operation timeout": the batches in flight were holding
//     every connection in the DB pool for the whole import, so nothing
//     else could get one. This version bounds memory to roughly
//     CONCURRENCY × BATCH_SIZE rows in flight at any moment, and never
//     holds more than CONCURRENCY connections from the pool at once.
router.post('/import', verifyToken, upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext !== '.xlsx' && ext !== '.xls' && ext !== '.csv') {
      fs.unlinkSync(filePath);
      filePath = null;
      return res.status(400).json({ success: false, message: 'Only Excel (.xlsx, .xls) and CSV files are supported.' });
    }

    // ---------- Pre-load class cache + default class (once, not per row) ----------
    const classMap = new Map();
    const classes = await Class.findAll({ attributes: ['id', 'className'] });
    classes.forEach(c => classMap.set(String(c.className).trim().toLowerCase(), c.id));
    const defaultClass = await Class.findOne({ order: [['id', 'ASC']] });
    const defaultClassId = defaultClass ? defaultClass.id : null;

    const BATCH_SIZE = 20000;   // rows per multi-row INSERT statement
    const CONCURRENCY = 2;      // max simultaneous INSERTs — leaves DB pool headroom for other requests
    const MAX_ERRORS_STORED = 200; // don't let a bad file blow up memory/response size with 1M error rows

    const result = { total: 0, added: 0, skipped: 0, errors: [] };
    let insertedTotal = 0;

    function escapeSQL(str) {
      if (str === null || str === undefined) return '';
      return String(str).replace(/\\/g, '\\\\').replace(/'/g, "''");
    }

    function normalizeGender(g) {
      const v = String(g || '').trim().toLowerCase();
      if (v === 'f' || v === 'female') return 'Female';
      return 'Male';
    }

    // Validate + normalize one raw row into an insertable record (or an error)
    function resolveRow(row) {
      const studentNumber = row['Student Number'] || row['studentNumber'] || row['student_number'] || row['StudentNumber'];
      const fullName = row['Full Name'] || row['fullName'] || row['full_name'] || row['FullName'];
      const gender = row['Gender'] || row['gender'];
      const className = row['Class Name'] || row['className'] || row['class'] || row['Class'] || row['class_name'];
      const parentName = row['Parent Name'] || row['parentName'] || row['parent_name'] || row['parent'];
      const parentPhone = row['Parent Phone'] || row['parentPhone'] || row['parent_phone'] || row['phone'];
      const address = row['Address'] || row['address'];

      if (!studentNumber || !fullName) {
        return { error: 'Missing required fields: Student Number and Full Name' };
      }

      let classId = null;
      const trimmedClassName = className ? String(className).trim() : '';
      if (trimmedClassName) {
        classId = classMap.get(trimmedClassName.toLowerCase()) || null;
        if (!classId) {
          return { error: `Class "${className}" not found. Create it first.` };
        }
      } else if (defaultClassId !== null) {
        classId = defaultClassId;
      } else {
        return { error: 'No class provided and no default class exists. Please create a class first.' };
      }

      return {
        rec: {
          studentNumber: String(studentNumber).trim(),
          fullName: String(fullName).trim(),
          gender: normalizeGender(gender),
          classId,
          parentName: parentName ? String(parentName).trim() : null,
          parentPhone: parentPhone ? String(parentPhone).trim() : null,
          address: address ? String(address).trim() : null,
        }
      };
    }

    // Insert one batch as a single multi-row INSERT. Duplicates (same
    // studentNumber) are silently skipped by the database via ON CONFLICT.
    // Wrapped so one bad batch (e.g. a constraint violation we didn't
    // anticipate) can't take down the whole import — it's recorded as an
    // error instead.
    async function insertBatch(rows) {
      if (!rows || rows.length === 0) return 0;
      const values = rows.map(r => `(
        '${escapeSQL(r.studentNumber)}',
        '${escapeSQL(r.fullName)}',
        '${escapeSQL(r.gender)}',
        ${r.classId === null ? 'NULL' : Number(r.classId)},
        ${r.parentName ? `'${escapeSQL(r.parentName)}'` : 'NULL'},
        ${r.parentPhone ? `'${escapeSQL(r.parentPhone)}'` : 'NULL'},
        ${r.address ? `'${escapeSQL(r.address)}'` : 'NULL'},
        'Active',
        NOW(),
        NOW()
      )`).join(',');

      const sql = `
        INSERT INTO "Students" (
          "studentNumber", "fullName", "gender", "classId",
          "parentName", "parentPhone", "address", "status",
          "createdAt", "updatedAt"
        )
        VALUES ${values}
        ON CONFLICT ("studentNumber") DO NOTHING
        RETURNING "id"
      `;

      try {
        const [insertedRows] = await sequelize.query(sql);
        return insertedRows.length;
      } catch (batchError) {
        console.error('❌ Batch insert failed:', batchError.message);
        if (result.errors.length < MAX_ERRORS_STORED) {
          result.errors.push({ row: null, reason: `A batch of ${rows.length} rows failed: ${batchError.message}` });
        }
        result.skipped += rows.length;
        return 0;
      }
    }

    // ---------- Bounded concurrency: a tiny semaphore ----------
    // The reading/validating loop below `await`s acquire() before handing
    // off a new batch. Once CONCURRENCY batches are already running, the
    // loop itself pauses — it does NOT keep building more batches in the
    // background — which is what keeps memory bounded.
    let activeSlots = 0;
    const waiters = [];
    function acquireSlot() {
      return new Promise(resolve => {
        if (activeSlots < CONCURRENCY) {
          activeSlots++;
          resolve();
        } else {
          waiters.push(resolve);
        }
      });
    }
    function releaseSlot() {
      activeSlots--;
      if (waiters.length > 0) {
        activeSlots++;
        waiters.shift()();
      }
    }

    const inFlight = []; // promises for batches currently inserting

    async function submitBatch(batchRows) {
      await acquireSlot();
      const p = insertBatch(batchRows)
        .then(count => { insertedTotal += count; })
        .finally(releaseSlot);
      inFlight.push(p);
    }

    // ---------- Collect + validate rows, submitting batches as they fill ----------
    let pendingBatch = [];

    async function pushRow(row) {
      result.total++;
      const { rec, error } = resolveRow(row);
      if (error) {
        if (result.errors.length < MAX_ERRORS_STORED) {
          result.errors.push({ row: result.total, reason: error });
        }
        result.skipped++;
        return;
      }
      pendingBatch.push(rec);
      if (pendingBatch.length >= BATCH_SIZE) {
        const batchToSend = pendingBatch;
        pendingBatch = []; // detach immediately so old batch can be GC'd once inserted
        await submitBatch(batchToSend);
      }
    }

    if (ext === '.xlsx' || ext === '.xls') {
      // NOTE: the 'xlsx' package parses the whole sheet into memory in one
      // shot — there's no way around holding ~1,000,000 raw row objects
      // briefly with this library. What we control (and what was broken
      // before) is NOT also holding a second full copy as normalized
      // batches. If you regularly import files this large, converting to
      // CSV first uses the streaming line-reader below instead, which
      // never holds the whole file in memory.
      const workbook = xlsx.readFile(filePath, { cellDates: false });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
      fs.unlinkSync(filePath);
      filePath = null;

      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: 'The uploaded file is empty' });
      }
      for (const row of rows) {
        await pushRow(row);
      }

    } else {
      // ---------- CSV – streamed line by line, never holds the whole file in memory ----------
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

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
        header.forEach((key, i) => { row[key] = values[i] || ''; });

        await pushRow(row);
      }

      fs.unlinkSync(filePath);
      filePath = null;
    }

    // Flush the final partial batch and wait for every in-flight insert to finish.
    if (pendingBatch.length > 0) {
      await submitBatch(pendingBatch);
      pendingBatch = [];
    }
    await Promise.all(inFlight);

    if (result.total === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded file is empty' });
    }

    result.added = insertedTotal;

    // Rows that passed validation but didn't get inserted were duplicates
    // caught by ON CONFLICT DO NOTHING.
    const validatedRows = result.total - result.skipped;
    const duplicateSkipped = validatedRows - insertedTotal;
    result.skipped += Math.max(duplicateSkipped, 0);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Imported ${result.added}/${result.total} students (skipped ${result.skipped}) in ${duration}s`);

    return res.status(200).json({
      success: true,
      data: {
        total: result.total,
        added: result.added,
        skipped: result.skipped,
        errors: result.errors,
        duration: `${duration}s`
      },
      message: `Import completed in ${duration}s: ${result.added} added, ${result.skipped} skipped, ${result.errors.length} validation errors.`
    });

  } catch (error) {
    console.error('Import error:', error);
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) { /* ignore cleanup failure */ }
    }
    return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
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
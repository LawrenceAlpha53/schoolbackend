// UserServices/PromotionService.js
const db = require('../models');
const { Op } = require('sequelize');

class PromotionService {
  /**
   * Get the next class in sequence based on current class name
   * e.g., S.1 → S.2, S.2 → S.3, ... S.6 → null
   */
  async getNextClass(currentClassId) {
    const currentClass = await db.Class.findByPk(currentClassId);
    if (!currentClass) return null;

    const className = currentClass.className;
    // Match patterns like "S.1", "S.2", "Senior 1", "Senior 2", "S1", "S2"
    const match = className.match(/(\d+)/);
    if (!match) return null;

    const currentLevel = parseInt(match[1]);
    const nextLevel = currentLevel + 1;

    // Try to find next class with the same naming convention
    const nextClassName = className.replace(/\d+/, nextLevel);
    let nextClass = await db.Class.findOne({
      where: { className: nextClassName }
    });

    // Try alternative patterns
    if (!nextClass) {
      const patterns = [
        className.replace(/\s+\d+/, ` ${nextLevel}`),      // Senior 1 → Senior 2
        className.replace(/(\d+)/, nextLevel),             // S1 → S2
        className.replace(/\.(\d+)/, `.${nextLevel}`),     // S.1 → S.2 (fallback)
      ];
      for (const pattern of patterns) {
        const found = await db.Class.findOne({ where: { className: pattern } });
        if (found) { nextClass = found; break; }
      }
    }

    // If still not found, try generic "S.{nextLevel}" format
    if (!nextClass) {
      const genericNext = `S.${nextLevel}`;
      nextClass = await db.Class.findOne({ where: { className: genericNext } });
    }

    return nextClass; // null if no next class exists
  }

  /**
   * Auto-promote a single student to the next logical class
   * Only allowed in Term 3 (if term is provided)
   */
  async autoPromoteStudent({ studentId, term, academicYear, promotedBy, remarks = '' }) {
    // Validate term if provided
    if (term && term !== 'Term 3') {
      throw new Error('Promotion is only allowed in the third term (Term 3).');
    }

    const student = await db.Student.findByPk(studentId, {
      include: [{ model: db.Class, as: 'class' }]
    });
    if (!student) {
      throw new Error('Student not found');
    }

    // Check if already promoted
    if (student.promotionStatus === 'promoted') {
      throw new Error('This student is already promoted.');
    }

    const nextClass = await this.getNextClass(student.classId);
    if (!nextClass) {
      throw new Error('No higher class exists. The student cannot be promoted further.');
    }

    // Use the bulk method with a single student
    const results = await this.promoteStudents({
      studentIds: [studentId],
      fromClassId: student.classId,
      toClassId: nextClass.id,
      academicYear: academicYear || new Date().getFullYear().toString(),
      term: term || 'Term 3',
      remarks,
      promotedBy,
    });

    return results[0];
  }

  /**
   * Bulk promote students from one class to another
   * @param {Object} params
   * @param {number[]} params.studentIds - array of student IDs to promote
   * @param {number} params.fromClassId - current class (for validation)
   * @param {number} params.toClassId - target class
   * @param {string} params.academicYear - e.g., '2026'
   * @param {string} params.term - e.g., 'Term 2'
   * @param {string} params.remarks - optional note
   * @param {number} params.promotedBy - user ID of the person doing promotion
   */
  async promoteStudents({
    studentIds,
    fromClassId,
    toClassId,
    academicYear,
    term,
    remarks = '',
    promotedBy,
  }) {
    const t = await db.sequelize.transaction();

    try {
      // Validate that all students exist and are currently in fromClassId
      const students = await db.Student.findAll({
        where: {
          id: { [Op.in]: studentIds },
          classId: fromClassId,
        },
        transaction: t,
      });

      if (students.length !== studentIds.length) {
        throw new Error('Some students are not in the specified source class or do not exist.');
      }

      // Create promotion records and update student class
      const promotions = [];
      for (const student of students) {
        // Create history record
        const prom = await db.StudentPromotion.create(
          {
            studentId: student.id,
            fromClassId,
            toClassId,
            promotedBy,
            academicYear,
            term,
            remarks,
          },
          { transaction: t }
        );
        promotions.push(prom);

        // Update student's classId and promotionStatus
        student.classId = toClassId;
        student.promotionStatus = 'promoted';
        await student.save({ transaction: t });
      }

      await t.commit();
      return promotions;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Get promotion history with filters
   * @param {Object} filters
   * @param {number} filters.studentId - optional
   * @param {number} filters.fromClassId - optional
   * @param {number} filters.toClassId - optional
   * @param {string} filters.academicYear - optional
   * @param {string} filters.term - optional
   * @param {number} filters.limit - pagination limit
   * @param {number} filters.offset - pagination offset
   */
  async getPromotionHistory(filters = {}) {
    const { studentId, fromClassId, toClassId, academicYear, term, limit = 50, offset = 0 } = filters;
    const where = {};
    if (studentId) where.studentId = studentId;
    if (fromClassId) where.fromClassId = fromClassId;
    if (toClassId) where.toClassId = toClassId;
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = term;

    const { rows, count } = await db.StudentPromotion.findAndCountAll({
      where,
      include: [
        { model: db.Student, as: 'student', attributes: ['id', 'fullName', 'studentNumber'] },
        { model: db.Class, as: 'fromClass', attributes: ['id', 'className'] },
        { model: db.Class, as: 'toClass', attributes: ['id', 'className'] },
        { model: db.Users, as: 'promoter', attributes: ['id', 'Fname', 'Lname'] },
      ],
      order: [['promotionDate', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /**
   * Get aggregated promotion statistics
   * @param {Object} filters
   * @param {string} filters.academicYear - optional
   * @param {string} filters.term - optional
   */
  async getPromotionStats(filters = {}) {
    const { academicYear, term } = filters;
    const where = {};
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = term;

    const total = await db.StudentPromotion.count({ where });

    const classFlow = await db.StudentPromotion.findAll({
      attributes: [
        'fromClassId',
        'toClassId',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      where,
      group: ['fromClassId', 'toClassId'],
      include: [
        { model: db.Class, as: 'fromClass', attributes: ['className'] },
        { model: db.Class, as: 'toClass', attributes: ['className'] },
      ],
      raw: true,
    });

    return { total, classFlow };
  }
}

module.exports = new PromotionService();
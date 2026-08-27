const PromotionService = require('../UserServices/PromotionService');

class PromotionController {
  // POST /api/promotions/bulk
  async bulkPromote(req, res, next) {
    try {
      const { studentIds, fromClassId, toClassId, academicYear, term, remarks } = req.body;

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No students selected.' });
      }
      if (!fromClassId || !toClassId || !academicYear || !term) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: fromClassId, toClassId, academicYear, term.',
        });
      }

      const promotedBy = req.user.id; // assumes auth middleware sets req.user
      const results = await PromotionService.promoteStudents({
        studentIds,
        fromClassId,
        toClassId,
        academicYear,
        term,
        remarks,
        promotedBy,
      });

      res.status(201).json({
        success: true,
        message: `${results.length} students promoted successfully.`,
        data: results,
      });
    } catch (error) {
      console.error('Promotion error:', error);
      next(error);
    }
  }

  // GET /api/promotions?studentId=...&fromClassId=...&toClassId=...&academicYear=...&term=...&limit=...&offset=...
  async getHistory(req, res, next) {
    try {
      const filters = {
        studentId: req.query.studentId,
        fromClassId: req.query.fromClassId,
        toClassId: req.query.toClassId,
        academicYear: req.query.academicYear,
        term: req.query.term,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
      };

      const result = await PromotionService.getPromotionHistory(filters);
      res.json({
        success: true,
        data: result.data,
        total: result.total,
      });
    } catch (error) {
      console.error('History error:', error);
      next(error);
    }
  }

  // GET /api/promotions/stats?academicYear=...&term=...
  async getStats(req, res, next) {
    try {
      const { academicYear, term } = req.query;
      const stats = await PromotionService.getPromotionStats({ academicYear, term });
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Stats error:', error);
      next(error);
    }
  }
}

module.exports = new PromotionController();
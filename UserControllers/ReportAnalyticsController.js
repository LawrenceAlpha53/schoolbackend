const ReportAnalyticsService = require('../UserServices/ReportAnalyticsService');

const ReportAnalyticsController = {
  // ================= GET STUDENT REPORT STATUS =================
  async getStudentReportStatus(req, res, next) {
    try {
      const { studentId } = req.params;
      const { term, academicYear } = req.query;
      
      const result = await ReportAnalyticsService.getStudentReportStatus(
        studentId, 
        term, 
        academicYear
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // ================= MARK REPORT AS PICKED =================
  async markReportPicked(req, res, next) {
    try {
      const { studentId, term, academicYear, remarks } = req.body;
      const secretaryId = req.user.id;
      
      const pickup = await ReportAnalyticsService.markReportPicked(
        studentId,
        term,
        academicYear,
        secretaryId,
        remarks
      );
      
      res.json({
        success: true,
        message: 'Report marked as picked successfully',
        data: pickup
      });
    } catch (error) {
      next(error);
    }
  },

  // ================= GET CLASS REPORT STATUS =================
  async getClassReportStatus(req, res, next) {
    try {
      const { classId } = req.params;
      const { term, academicYear } = req.query;
      
      const result = await ReportAnalyticsService.getClassReportStatus(
        classId,
        term,
        academicYear
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // ================= GET ALL STUDENTS REPORT STATUS =================
  async getAllStudentsReportStatus(req, res, next) {
    try {
      const { term, academicYear, classId } = req.query;
      
      const result = await ReportAnalyticsService.getAllStudentsReportStatus(
        term,
        academicYear,
        classId || null
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // ================= GET STUDENT COMBINATION =================
  async getStudentCombination(req, res, next) {
    try {
      const { studentId } = req.params;
      
      const result = await ReportAnalyticsService.getStudentCombination(studentId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // ================= GET PICKUP STATISTICS =================
  async getPickupStatistics(req, res, next) {
    try {
      const { term, academicYear } = req.query;
      
      const result = await ReportAnalyticsService.getPickupStatistics(
        term,
        academicYear
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // ================= GET STUDENT FEE STATUS =================
  async getStudentFeeStatus(req, res, next) {
    try {
      const { studentId } = req.params;
      
      const result = await ReportAnalyticsService.getStudentFeeStatus(studentId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ReportAnalyticsController;
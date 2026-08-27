const ClassTeacherService = require('../UserServices/ClassTeacherService');

class ClassTeacherController {
  // GET /api/class-teacher/dashboard
  async getDashboard(req, res, next) {
    try {
      const teacherId = req.user.id;
      const data = await ClassTeacherService.getClassTeacherDashboard(teacherId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
  
  // GET /api/class-teacher/student/:studentId
  async getStudentDetails(req, res, next) {
    try {
      const { studentId } = req.params;
      const data = await ClassTeacherService.getStudentPromotionDetails(studentId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
  
  // POST /api/class-teacher/finalize-promotion/:classId
  async finalizePromotion(req, res, next) {
    try {
      const { classId } = req.params;
      const { decisions } = req.body;
      
      if (!decisions || !Array.isArray(decisions)) {
        return res.status(400).json({
          success: false,
          message: 'Decisions array required',
        });
      }
      
      const results = await ClassTeacherService.finalizePromotionDecision(classId, decisions);
      
      res.json({
        success: true,
        message: `${results.length} students processed for promotion`,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClassTeacherController();
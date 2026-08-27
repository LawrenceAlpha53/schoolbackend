const RequirementService = require('../services/RequirementService');

class RequirementController {
  // ---------- REQUIREMENT CRUD ----------
  async createRequirement(req, res, next) {
    try {
      const data = { ...req.body, createdBy: req.user.id };
      const requirement = await RequirementService.createRequirement(data);
      res.status(201).json({ success: true, data: requirement });
    } catch (error) {
      next(error);
    }
  }

  async getAllRequirements(req, res, next) {
    try {
      const filters = req.query;
      const requirements = await RequirementService.getAllRequirements(filters);
      res.json({ success: true, data: requirements });
    } catch (error) {
      next(error);
    }
  }

  async getRequirementById(req, res, next) {
    try {
      const requirement = await RequirementService.getRequirementById(req.params.id);
      if (!requirement) {
        return res.status(404).json({ success: false, message: 'Requirement not found' });
      }
      res.json({ success: true, data: requirement });
    } catch (error) {
      next(error);
    }
  }

  async updateRequirement(req, res, next) {
    try {
      const requirement = await RequirementService.updateRequirement(req.params.id, req.body);
      res.json({ success: true, data: requirement });
    } catch (error) {
      next(error);
    }
  }

  async deleteRequirement(req, res, next) {
    try {
      const result = await RequirementService.deleteRequirement(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  // ---------- ASSIGNMENT ----------
  async assignToStudents(req, res, next) {
    try {
      const { requirementId, studentIds, academicYear, term, override = false } = req.body;
      
      if (!requirementId || !studentIds || !Array.isArray(studentIds)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing requirementId or studentIds array' 
        });
      }
if (requirementId.isArray(studentIds)) {
  return res.status(203).json({
    success: true,
    message:"student payed this requirement in this term",

  })
}

      
      const result = await RequirementService.assignRequirementToStudents(
        requirementId,
        studentIds,
        academicYear,
        term,
        override
      );
      
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async assignToClass(req, res, next) {
    try {
      const { requirementId, classId, academicYear, term, override = false } = req.body;
      
      if (!requirementId || !classId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing requirementId or classId' 
        });
      }
      
      const result = await RequirementService.assignRequirementToClass(
        requirementId,
        classId,
        academicYear,
        term,
        override
      );
      
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ---------- RECEIVING ----------
  async receiveRequirement(req, res, next) {
    try {
      const { studentRequirementId, quantityReceived, condition, remarks } = req.body;
      
      if (!studentRequirementId || quantityReceived === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing studentRequirementId or quantityReceived' 
        });
      }
      
      const updated = await RequirementService.receiveRequirement(studentRequirementId, {
        quantityReceived,
        condition,
        remarks,
        receivedBy: req.user.id,
      });
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // ---------- STUDENT REQUIREMENTS ----------
  async getStudentRequirements(req, res, next) {
    try {
      const { studentId } = req.params;
      const filters = req.query;
      const data = await RequirementService.getStudentRequirements(studentId, filters);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getStudentRequirementSummary(req, res, next) {
    try {
      const { studentId } = req.params;
      const summary = await RequirementService.getStudentRequirementSummary(studentId);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  // ---------- DASHBOARD STATS ----------
  async getDashboardStats(req, res, next) {
    try {
      const { academicYear, term } = req.query;
      const stats = await RequirementService.getDashboardStats(academicYear, term);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // ---------- DELETE STUDENT REQUIREMENT ----------
  async deleteStudentRequirement(req, res, next) {
    try {
      const { id } = req.params;
      const result = await RequirementService.deleteStudentRequirement(id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RequirementController();
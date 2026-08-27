const db = require('../models');
const { Op } = require('sequelize');

class RequirementService {
  // ====================== REQUIREMENT CRUD ======================
  
  async createRequirement(data) {
    try {
      return await db.Requirement.create(data);
    } catch (error) {
      throw new Error(`Failed to create requirement: ${error.message}`);
    }
  }

  async getAllRequirements(filters = {}) {
    try {
      const where = {};
      if (filters.academicYear) where.academicYear = filters.academicYear;
      if (filters.term) where.term = filters.term;
      if (filters.category) where.category = filters.category;
      if (filters.activeStatus !== undefined) where.activeStatus = filters.activeStatus === 'true';
      
      return await db.Requirement.findAll({
        where,
        order: [['createdAt', 'DESC']],
        include: [{ model: db.Users, as: 'creator', attributes: ['id', 'Fname', 'Lname'] }]
      });
    } catch (error) {
      throw new Error(`Failed to fetch requirements: ${error.message}`);
    }
  }

  async getRequirementById(id) {
    try {
      return await db.Requirement.findByPk(id, {
        include: [
          { model: db.Users, as: 'creator', attributes: ['id', 'Fname', 'Lname'] },
          { model: db.StudentRequirement, as: 'studentRequirements' }
        ]
      });
    } catch (error) {
      throw new Error(`Failed to fetch requirement: ${error.message}`);
    }
  }

  async updateRequirement(id, data) {
    try {
      const requirement = await db.Requirement.findByPk(id);
      if (!requirement) throw new Error('Requirement not found');
      await requirement.update(data);
      return requirement;
    } catch (error) {
      throw new Error(`Failed to update requirement: ${error.message}`);
    }
  }

  async deleteRequirement(id) {
    try {
      const requirement = await db.Requirement.findByPk(id);
      if (!requirement) throw new Error('Requirement not found');
      
      const assignments = await db.StudentRequirement.count({ where: { requirementId: id } });
      if (assignments > 0) {
        throw new Error('Cannot delete requirement with existing assignments');
      }
      
      await requirement.destroy();
      return { message: 'Requirement deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete requirement: ${error.message}`);
    }
  }

  // ====================== ASSIGNMENT LOGIC ======================

  async assignRequirementToStudents(requirementId, studentIds, academicYear, term, override = false) {
    try {
      const requirement = await db.Requirement.findByPk(requirementId);
      if (!requirement) throw new Error('Requirement not found');

      const year = academicYear || requirement.academicYear;
      const termValue = term || requirement.term;

      if (!year || !termValue) {
        throw new Error('Academic year and term are required');
      }

      const results = [];
      const errors = [];

      for (const studentId of studentIds) {
        try {
          // Verify student exists before assigning
          const studentExists = await db.Student.findByPk(parseInt(studentId));
          if (!studentExists) {
            errors.push({ studentId, error: 'Student not found' });
            continue;
          }

          const existing = await db.StudentRequirement.findOne({
            where: {
              studentId: parseInt(studentId),
              requirementId: parseInt(requirementId),
              academicYear: year,
              term: termValue
            }
          });

          if (existing) {
            if (override) {
              await existing.update({
                requiredQuantity: requirement.quantityRequired,
                balance: Math.max(0, requirement.quantityRequired - existing.quantityReceived),
                status: existing.quantityReceived >= requirement.quantityRequired ? 'Completed' : 
                       existing.quantityReceived > 0 ? 'Partial' : 'Pending'
              });
              results.push(existing);
            } else {
              errors.push({ studentId, error: 'Already exists for this term' });
            }
            continue;
          }

          const assignment = await db.StudentRequirement.create({
            studentId: parseInt(studentId),
            requirementId: parseInt(requirementId),
            requiredQuantity: requirement.quantityRequired,
            quantityReceived: 0,
            balance: requirement.quantityRequired,
            status: 'Pending',
            academicYear: year,
            term: termValue,
            condition: 'Pending',
            remarks: `Assigned for ${termValue} ${year}`
          });

          results.push(assignment);
        } catch (error) {
          errors.push({ studentId, error: error.message });
        }
      }

      return {
        success: results,
        errors: errors,
        total: studentIds.length,
        assigned: results.length,
        failed: errors.length
      };
    } catch (error) {
      throw new Error(`Failed to assign requirement: ${error.message}`);
    }
  }

  async assignRequirementToClass(requirementId, classId, academicYear, term, override = false) {
    try {
      const requirement = await db.Requirement.findByPk(requirementId);
      if (!requirement) throw new Error('Requirement not found');

      const students = await db.Student.findAll({ where: { classId } });
      if (students.length === 0) throw new Error('No students found in this class');

      const studentIds = students.map(s => s.id);
      return await this.assignRequirementToStudents(requirementId, studentIds, academicYear, term, override);
    } catch (error) {
      throw new Error(`Failed to assign to class: ${error.message}`);
    }
  }

  // ====================== RECEIVING LOGIC (FIXED) ======================

  async receiveRequirement(studentRequirementId, receiveData) {
    try {
      const { quantityReceived, condition, remarks, receivedBy } = receiveData;

      const studentReq = await db.StudentRequirement.findByPk(studentRequirementId, {
        include: [{ model: db.Requirement, as: 'requirement' }]
      });

      if (!studentReq) throw new Error('Student requirement not found');
      
      const parsedQty = parseInt(quantityReceived);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        throw new Error('Quantity must be a valid number greater than 0');
      }
      if (parsedQty > studentReq.balance) {
        throw new Error(`Cannot receive more than remaining balance (${studentReq.balance})`);
      }

      const newReceived = studentReq.quantityReceived + parsedQty;
      const remaining = Math.max(0, studentReq.requiredQuantity - newReceived);
      const status = remaining === 0 ? 'Completed' : 'Partial';

      await studentReq.update({
        quantityReceived: newReceived,
        balance: remaining,
        status: status,
        condition: condition || studentReq.condition || 'Good',
        remarks: remarks || studentReq.remarks,
        receivedBy: receivedBy || studentReq.receivedBy,
        receivedDate: new Date()
      });

      return studentReq;
    } catch (error) {
      throw new Error(`Failed to receive requirement: ${error.message}`);
    }
  }

  // ====================== STUDENT REQUIREMENT QUERIES ======================

  async getStudentRequirements(studentId, filters = {}) {
    try {
      const where = { studentId: parseInt(studentId) };
      
      if (filters.academicYear) where.academicYear = filters.academicYear;
      if (filters.term) where.term = filters.term;
      if (filters.status) where.status = filters.status;

      const requirements = await db.StudentRequirement.findAll({
        where,
        include: [
          { 
            model: db.Requirement, 
            as: 'requirement',
            include: [{ model: db.Users, as: 'creator', attributes: ['id', 'Fname', 'Lname'] }]
          },
          { model: db.Users, as: 'receiver', attributes: ['id', 'Fname', 'Lname'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      return requirements.map(req => {
        const progress = req.requiredQuantity > 0 
          ? Math.round((req.quantityReceived / req.requiredQuantity) * 100)
          : 0;
        
        return {
          ...req.toJSON(),
          progress,
          isCleared: req.status === 'Completed' && req.balance === 0,
          remaining: req.balance
        };
      });
    } catch (error) {
      throw new Error(`Failed to get student requirements: ${error.message}`);
    }
  }

  async getStudentRequirementSummary(studentId) {
    try {
      const allRequirements = await db.StudentRequirement.findAll({
        where: { studentId: parseInt(studentId) },
        include: [{ model: db.Requirement, as: 'requirement' }]
      });

      const total = allRequirements.length;
      const completed = allRequirements.filter(r => r.status === 'Completed').length;
      const partial = allRequirements.filter(r => r.status === 'Partial').length;
      const pending = allRequirements.filter(r => r.status === 'Pending').length;

      const totalRequired = allRequirements.reduce((sum, r) => sum + r.requiredQuantity, 0);
      const totalReceived = allRequirements.reduce((sum, r) => sum + r.quantityReceived, 0);
      const totalBalance = allRequirements.reduce((sum, r) => sum + r.balance, 0);

      return {
        total,
        completed,
        partial,
        pending,
        totalRequired,
        totalReceived,
        totalBalance,
        completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        requirements: allRequirements
      };
    } catch (error) {
      throw new Error(`Failed to get student summary: ${error.message}`);
    }
  }

  // ====================== DASHBOARD STATS ======================

  async getDashboardStats(academicYear, term) {
    try {
      const where = {};
      if (academicYear) where.academicYear = academicYear;
      if (term) where.term = term;

      const totalRequirements = await db.Requirement.count({ where: { ...where, activeStatus: true } });
      const totalAssignments = await db.StudentRequirement.count({ where });
      const completed = await db.StudentRequirement.count({ where: { ...where, status: 'Completed' } });
      const partial = await db.StudentRequirement.count({ where: { ...where, status: 'Partial' } });
      const pending = await db.StudentRequirement.count({ where: { ...where, status: 'Pending' } });

      return {
        totalRequirements,
        totalAssignments,
        completed,
        partial,
        pending,
        completionPercentage: totalAssignments > 0 ? Math.round((completed / totalAssignments) * 100) : 0
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  async deleteStudentRequirement(studentRequirementId) {
    try {
      const studentReq = await db.StudentRequirement.findByPk(studentRequirementId);
      if (!studentReq) throw new Error('Student requirement not found');
      if (studentReq.quantityReceived > 0) {
        throw new Error('Cannot delete assignment with received items');
      }
      await studentReq.destroy();
      return { message: 'Student requirement deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete student requirement: ${error.message}`);
    }
  }
}

module.exports = new RequirementService();
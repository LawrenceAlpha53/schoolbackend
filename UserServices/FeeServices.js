// UserServices/FeeServices.js
const db = require('../models');
const Fee = db.Fee;
const Student = db.Student;
const { Op } = require('sequelize');

const FeeService = {

  // ================= CREATE OR UPDATE FEE (PAYMENT) =================
  async createFee(data) {
    const { 
      studentId, 
      totalFee,        // only used for new fee records
      amountPaid, 
      term, 
      academicYear, 
      paymentMethod, 
      referenceNumber, 
      paymentDate 
    } = data;

    // Validate student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // 1. Try to find existing fee for this student, term, and year
    let fee = await Fee.findOne({
      where: {
        studentId,
        term,
        academicYear
      }
    });

    if (fee) {
      // 2. Fee exists → UPDATE it (add amountPaid)
      const newAmountPaid = parseFloat(fee.amountPaid) + parseFloat(amountPaid);
      const newBalance = parseFloat(fee.totalFee) - newAmountPaid;

      await fee.update({
        amountPaid: newAmountPaid,
        balance: newBalance,
        paymentMethod: paymentMethod || fee.paymentMethod,
        referenceNumber: referenceNumber || fee.referenceNumber,
        paymentDate: paymentDate || new Date()
      });

      // Fetch the updated fee with student details
      const updatedFee = await Fee.findByPk(fee.id, {
        include: [{ model: Student, as: 'student' }]
      });
      return updatedFee;
    } else {
      // 3. No fee record → CREATE new
      // Use the provided totalFee (should be the agreed amount for that term)
      const newBalance = totalFee - amountPaid;

      const newFee = await Fee.create({
        studentId,
        totalFee,
        amountPaid,
        balance: newBalance,
        term,
        academicYear,
        paymentMethod: paymentMethod || null,
        referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
        paymentDate: paymentDate || new Date()
      });

      // Fetch the created fee with student details
      const createdFee = await Fee.findByPk(newFee.id, {
        include: [{ model: Student, as: 'student' }]
      });
      return createdFee;
    }
  },

  // ================= GET ALL FEES =================
  async getAllFees() {
    return await Fee.findAll({
      include: [
        {
          model: Student,
          as: 'student'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  },

  // ================= GET FEE BY ID =================
  async getFeeById(id) {
    const fee = await Fee.findByPk(id, {
      include: [
        {
          model: Student,
          as: 'student'
        }
      ]
    });
    if (!fee) {
      throw new Error('Fee record not found');
    }
    return fee;
  },

  // ================= GET FEES BY STUDENT =================
  async getFeesByStudent(studentId) {
    const student = await Student.findByPk(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    return await Fee.findAll({
      where: { studentId },
      include: [
        {
          model: Student,
          as: 'student'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  },

  // ================= UPDATE FEE RECORD =================
  async updateFee(id, data) {
    const fee = await Fee.findByPk(id);
    if (!fee) {
      throw new Error('Fee record not found');
    }

    // Validate student if changed
    if (data.studentId && data.studentId !== fee.studentId) {
      const student = await Student.findByPk(data.studentId);
      if (!student) {
        throw new Error('Student not found');
      }
    }

    // Recalculate balance
    const totalFee = data.totalFee || fee.totalFee;
    const amountPaid = data.amountPaid || fee.amountPaid;
    data.balance = totalFee - amountPaid;

    await fee.update(data);
    return fee;
  },

  // ================= DELETE FEE RECORD =================
  async deleteFee(id) {
    const fee = await Fee.findByPk(id);
    if (!fee) {
      throw new Error('Fee record not found');
    }
    await fee.destroy();
    return true;
  },

  // ================= GET FEE STATISTICS =================
  async getFeeStats() {
    const fees = await Fee.findAll();
    
    let totalCollected = 0;
    let totalDemanded = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let partialCount = 0;

    fees.forEach(fee => {
      const paid = Number(fee.amountPaid || 0);
      const total = Number(fee.totalFee || 0);
      totalCollected += paid;
      totalDemanded += total;
      
      const balance = total - paid;
      if (balance === 0 && paid > 0) paidCount++;
      else if (balance > 0 && paid > 0) partialCount++;
      else if (paid === 0 && total > 0) pendingCount++;
    });

    const outstanding = totalDemanded - totalCollected;
    const collectionRate = totalDemanded > 0 ? ((totalCollected / totalDemanded) * 100) : 0;

    return {
      totalCollected,
      totalDemanded,
      outstanding,
      collectionRate: Number(collectionRate.toFixed(1)),
      paidCount,
      pendingCount,
      partialCount,
      totalRecords: fees.length
    };
  },

  // ================= GET FEES BY TERM & YEAR =================
  async getFeesByTerm(term, academicYear) {
    const where = {};
    if (term) where.term = term;
    if (academicYear) where.academicYear = academicYear;

    return await Fee.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  },

  // ================= GET OUTSTANDING FEES =================
  async getOutstandingFees() {
    return await Fee.findAll({
      where: {
        balance: {
          [Op.gt]: 0
        }
      },
      include: [
        {
          model: Student,
          as: 'student'
        }
      ],
      order: [['balance', 'DESC']]
    });
  }
};

module.exports = FeeService;
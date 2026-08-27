const FeeService = require('../UserServices/FeeServices');
const db = require('../models');

// Helper to notify admins - tries multiple methods to find admins
const notifyAdmins = async (title, message, category, metadata = {}, senderName = 'System') => {
  try {
    let admins = [];
    
    // Method 1: Find users with role 'admin'
    admins = await db.Users.findAll({ 
      where: { role: 'admin' },
      attributes: ['id', 'Fname', 'Email', 'role']
    });
    
    // Method 2: If no admins found by role, try finding users with role 'administrator'
    if (admins.length === 0) {
      admins = await db.Users.findAll({ 
        where: { role: 'administrator' },
        attributes: ['id', 'Fname', 'Email', 'role']
      });
    }
    
    // Method 3: Find ALL users and log their roles for debugging
    if (admins.length === 0) {
      const allUsers = await db.Users.findAll({ 
        attributes: ['id', 'Fname', 'Email', 'role'],
        limit: 10
      });
      console.log('📋 All users found:', allUsers.map(u => ({ id: u.id, name: u.Fname, role: u.role })));
      
      // Try case-insensitive match
      admins = allUsers.filter(u => 
        (u.role || '').toLowerCase() === 'admin' || 
        (u.role || '').toLowerCase() === 'administrator'
      );
    }
    
    console.log(`👥 Found ${admins.length} admin users to notify`);
    
    for (const admin of admins) {
      console.log(`📧 Creating notification for admin: ${admin.Fname} (ID: ${admin.id})`);
      await db.Notification.create({
        userId: admin.id,
        title: title,
        message: message,
        type: category === 'fee' ? 'success' : 'info',
        category: category,
        priority: 'high',
        sender: senderName,
        actionLink: category === 'fee' ? '/admin/adminfees' : '/admin',
        actionLabel: category === 'fee' ? 'View Fees' : 'View Dashboard',
        isRead: false,
        metadata: metadata
      });
    }
    
    if (admins.length === 0) {
      console.warn('⚠️ No admin users found to notify! Check your Users table.');
    } else {
      console.log(`✅ Notified ${admins.length} admin(s)`);
    }
  } catch (e) {
    console.error('❌ Notification creation failed:', e.message);
    console.error('Stack:', e.stack);
  }
};

const FeeController = {
  async createFee(req, res, next) {
    try {
      const fee = await FeeService.createFee(req.body);
      const completeFee = await FeeService.getFeeById(fee.id);
      
      // Create notification for admin
      try {
        const student = await db.Student.findByPk(fee.studentId);
        const amount = Number(fee.amountPaid || 0);
        const totalFee = Number(fee.totalFee || 0);
        const balance = totalFee - amount;
        const studentName = student?.fullName || 'A student';
        
        await notifyAdmins(
          '💰 New Fee Payment',
          `${studentName} paid UGX ${amount.toLocaleString()}${balance > 0 ? ` (Balance: UGX ${balance.toLocaleString()})` : ' (Fully Paid ✅)'}`,
          'fee',
          {
            studentId: fee.studentId,
            studentName: studentName,
            amount: amount,
            totalFee: totalFee,
            balance: balance,
            feeId: fee.id
          },
          req.user?.Fname || req.user?.fullName || 'Secretary'
        );
      } catch (notifError) {
        console.error('Failed to create fee notification:', notifError);
      }
      
      res.status(201).json({
        success: true,
        message: 'Fee payment recorded successfully',
        data: completeFee
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllFees(req, res, next) {
    try {
      const fees = await FeeService.getAllFees();
      res.json({ success: true, count: fees.length, data: fees });
    } catch (error) { next(error); }
  },

  async getFeeById(req, res, next) {
    try {
      const fee = await FeeService.getFeeById(req.params.id);
      res.json({ success: true, data: fee });
    } catch (error) { next(error); }
  },

  async getStudentFees(req, res, next) {
    try {
      const fees = await FeeService.getFeesByStudent(req.params.studentId);
      res.json({ success: true, count: fees.length, data: fees });
    } catch (error) { next(error); }
  },

  async updateFee(req, res, next) {
    try {
      const fee = await FeeService.updateFee(req.params.id, req.body);
      const completeFee = await FeeService.getFeeById(fee.id);
      
      // Create notification for admin on update
      try {
        const student = await db.Student.findByPk(fee.studentId);
        const amount = Number(fee.amountPaid || 0);
        const totalFee = Number(fee.totalFee || 0);
        const balance = totalFee - amount;
        
        await notifyAdmins(
          '💰 Fee Record Updated',
          `${student?.fullName || 'A student'}'s fee updated: UGX ${amount.toLocaleString()}${balance > 0 ? ` (Balance: UGX ${balance.toLocaleString()})` : ' (Fully Paid ✅)'}`,
          'fee',
          {
            studentId: fee.studentId,
            amount: amount,
            balance: balance,
            feeId: fee.id
          },
          req.user?.Fname || 'Secretary'
        );
      } catch (notifError) {
        console.error('Failed to create fee update notification:', notifError);
      }
      
      res.json({ success: true, message: 'Fee record updated successfully', data: completeFee });
    } catch (error) { next(error); }
  },

  async deleteFee(req, res, next) {
    try {
      await FeeService.deleteFee(req.params.id);
      res.json({ success: true, message: 'Fee record deleted successfully' });
    } catch (error) { next(error); }
  },

  async getFeeStats(req, res, next) {
    try {
      const stats = await FeeService.getFeeStats();
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  },

  async getFeesByTerm(req, res, next) {
    try {
      const { term, academicYear } = req.query;
      const fees = await FeeService.getFeesByTerm(term, academicYear);
      res.json({ success: true, count: fees.length, data: fees });
    } catch (error) { next(error); }
  },

  async getOutstandingFees(req, res, next) {
    try {
      const fees = await FeeService.getOutstandingFees();
      res.json({ success: true, count: fees.length, data: fees });
    } catch (error) { next(error); }
  }
};

module.exports = FeeController;
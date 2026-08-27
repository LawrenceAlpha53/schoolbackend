const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');
const db = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const { Contact } = require('../models');
const { normalizePhone, isValidPhone } = require('../utils/normalizePhone');

// ===== TEST ROUTE =====
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'SMS route is working!', timestamp: new Date().toISOString() });
});

// ===== DEBUG =====
router.use((req, res, next) => {
  console.log('📩 SMS router hit:', req.method, req.path);
  next();
});

// Authentication for all routes below
router.use(verifyToken);

// ============================================================
// 🆕 HELPER: Sync balance with Yoola and update local DB
// ============================================================
const syncBalanceFromYoola = async () => {
  try {
    const YOOLA_API_KEY = process.env.YOOLA_API_KEY;
    const YOOLA_BASE_URL = process.env.YOOLA_BASE_URL || 'https://yoolasms.com/api/v1';

    if (!YOOLA_API_KEY) {
      console.warn('⚠️ YOOLA_API_KEY not set – using local balance');
      const local = await db.SmsBalance.findOne();
      return local || { balance: 0 };
    }

    // Call Yoola balance API
    const response = await axios.post(`${YOOLA_BASE_URL}/balance`, {
      api_key: YOOLA_API_KEY
    }, { timeout: 10000 });

    const yoolaBalance = response.data?.balance ?? 0;

    // Update local balance record
    let balanceRecord = await db.SmsBalance.findOne();
    if (!balanceRecord) {
      balanceRecord = await db.SmsBalance.create({
        balance: yoolaBalance,
        totalPurchased: 0,
        totalUsed: 0,
        totalSpent: 0,
        lastSyncDate: new Date()
      });
    } else {
      await balanceRecord.update({
        balance: yoolaBalance,
        lastSyncDate: new Date()
      });
    }

    console.log(`✅ Synced Yoola balance: ${yoolaBalance}`);
    return balanceRecord;
  } catch (error) {
    console.error('❌ Yoola balance sync error:', error.message);
    // Fallback to local balance
    const local = await db.SmsBalance.findOne();
    if (!local) {
      return await db.SmsBalance.create({ balance: 0, totalPurchased: 0, totalUsed: 0, totalSpent: 0 });
    }
    return local;
  }
};

// ==================== BALANCE (REAL‑TIME FROM YOOLA) ====================
router.get('/balance', async (req, res) => {
  try {
    const updated = await syncBalanceFromYoola();
    res.json({
      success: true,
      data: { balance: updated.balance || 0 }
    });
  } catch (error) {
    console.error('❌ Balance error:', error);
    // Fallback to local DB
    const balance = await db.SmsBalance.findOne();
    res.status(500).json({
      success: false,
      message: 'Could not fetch real‑time balance, showing cached value',
      data: { balance: balance?.balance || 0 }
    });
  }
});

// ==================== RECIPIENTS (unchanged) ====================
router.get('/recipients/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { classId } = req.query;
    let formatted = [];

    switch (type) {
      case 'parents': {
        const parents = await db.Student.findAll({
          attributes: ['id', 'fullName', 'parentName', 'parentPhone'],
        });
        formatted = parents.map(s => ({
          id: s.id,
          title: s.fullName,
          parentName: s.parentName || s.fullName,
          phone: s.parentPhone,
        }));
        break;
      }
      case 'students': {
        const students = await db.Student.findAll({
          attributes: ['id', 'fullName', 'parentPhone'],
          include: [{ model: db.Class, as: 'class', attributes: ['className'] }],
        });
        formatted = students.map(s => ({
          id: s.id,
          title: s.fullName,
          phone: s.parentPhone,
          className: s.class?.className || 'N/A',
        }));
        break;
      }
      case 'teachers': {
        const teachers = await db.Teacher.findAll({
          attributes: ['id', 'fullName', 'phoneNumber', 'email'],
        });
        formatted = teachers.map(t => ({
          id: t.id,
          title: t.fullName,
          phone: t.phoneNumber,
          email: t.email,
        }));
        break;
      }
      case 'class': {
        const where = classId ? { classId: parseInt(classId) } : {};
        const classStudents = await db.Student.findAll({
          where,
          attributes: ['id', 'fullName', 'parentPhone'],
          include: [{ model: db.Class, as: 'class', attributes: ['className'] }],
        });
        formatted = classStudents.map(s => ({
          id: s.id,
          title: s.fullName,
          phone: s.parentPhone,
          className: s.class?.className || 'N/A',
        }));
        break;
      }
      case 'school': {
        const allStudents = await db.Student.findAll({
          attributes: ['id', 'fullName', 'parentPhone'],
          include: [{ model: db.Class, as: 'class', attributes: ['className'] }],
        });
        formatted = allStudents.map(s => ({
          id: s.id,
          title: s.fullName,
          phone: s.parentPhone,
          className: s.class?.className || 'N/A',
        }));
        break;
      }
      default:
        return res.status(400).json({ success: false, message: 'Invalid recipient type' });
    }

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('❌ Error fetching recipients:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== TEMPLATES (CRUD) – unchanged ====================
router.get('/templates', async (req, res) => {
  try {
    const templates = await db.SmsTemplate.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/templates', role('admin', 'secretary'), async (req, res) => {
  try {
    const template = await db.SmsTemplate.create(req.body);
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/templates/:id', role('admin', 'secretary'), async (req, res) => {
  try {
    const template = await db.SmsTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    await template.update(req.body);
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/templates/:id', role('admin', 'secretary'), async (req, res) => {
  try {
    const template = await db.SmsTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    await template.destroy();
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== MESSAGE HISTORY – unchanged ====================
router.get('/messages', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { message: { [Op.iLike]: `%${search}%` } },
        { recipientName: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const messages = await db.SmsMessage.findAndCountAll({
      where,
      order: [['sentAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    res.json({
      success: true,
      data: messages.rows,
      pagination: {
        total: messages.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(messages.count / limit)
      }
    });
  } catch (error) {
    console.error('SMS history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DELETE SINGLE MESSAGE – unchanged ====================
router.delete('/messages/:id', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.SmsMessage.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DELETE ALL MESSAGES – unchanged ====================
router.delete('/messages', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    await db.SmsMessage.destroy({ where: {} });
    res.json({ success: true, message: 'All messages deleted successfully' });
  } catch (error) {
    console.error('❌ Delete all messages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== REPLIES (INBOX) – unchanged ====================
router.get('/replies', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    res.json({ success: true, data: [], message: 'Yoola inbox integration not implemented.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== PURCHASES – unchanged ====================
router.get('/purchases', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    const purchases = await db.SmsPurchase.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    res.json({ success: true, data: purchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== SMS BUNDLES – unchanged ====================
router.get('/bundles', verifyToken, (req, res) => {
  const bundles = [
    { id: 'bundle_500', name: '500 SMS', amount: 500, price: 31000 },
    { id: 'bundle_1000', name: '1000 SMS', amount: 1000, price: 62000 },
    { id: 'bundle_2000', name: '2000 SMS', amount: 2000, price: 124000 },
    { id: 'bundle_5000', name: '5000 SMS', amount: 5000, price: 310000 },
    { id: 'bundle_10000', name: '10000 SMS', amount: 10000, price: 620000 }
  ];
  res.json({ success: true, data: bundles });
});

// ==================== INITIATE PURCHASE – unchanged ====================
router.post('/purchase/initiate', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    const { bundleId, paymentMethod, phoneNumber } = req.body;
    if (!bundleId || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Bundle ID and payment method required' });
    }

    const bundles = [
      { id: 'bundle_500', amount: 500, price: 31000 },
      { id: 'bundle_1000', amount: 1000, price: 62000 },
      { id: 'bundle_2000', amount: 2000, price: 124000 },
      { id: 'bundle_5000', amount: 5000, price: 310000 },
      { id: 'bundle_10000', amount: 10000, price: 620000 }
    ];
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) {
      return res.status(400).json({ success: false, message: 'Invalid bundle' });
    }

    const currentBalance = await db.SmsBalance.findOne();
    const balanceBefore = currentBalance ? currentBalance.balance : 0;

    const purchase = await db.SmsPurchase.create({
      amount: bundle.amount,
      cost: bundle.price,
      costPerSms: Math.round(bundle.price / bundle.amount),
      paymentMethod,
      reference: `PUR-${Date.now()}`,
      status: 'pending',
      purchasedBy: req.user.id,
      balanceBefore: balanceBefore,
      balanceAfter: balanceBefore + bundle.amount
    });

    res.json({
      success: true,
      data: {
        transaction: purchase,
        paymentUrl: null,
        instructions: 'Please complete payment via ' + paymentMethod
      }
    });
  } catch (error) {
    console.error('Error initiating purchase:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== CHECK PURCHASE STATUS – unchanged ====================
router.get('/purchase/status/:reference', verifyToken, async (req, res) => {
  try {
    const purchase = await db.SmsPurchase.findOne({
      where: { reference: req.params.reference }
    });
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, data: { status: purchase.status } });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== SEND SMS – unchanged (still uses local balance) ====================
router.post('/send', role('admin', 'secretary', 'teacher', 'bursar'), async (req, res) => {
  try {
    let { recipients, message, category, scheduledFor, recipientType, recipientIds, isBulk, templateId, recipientName } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // ----- get phone numbers -----
    let phoneNumbers = [];
    if (recipients && Array.isArray(recipients) && recipients.length > 0) {
      phoneNumbers = recipients
        .map(p => normalizePhone(p))
        .filter(p => p && isValidPhone(p));
    } else {
      const contacts = await Contact.findAll({ attributes: ['phone'] });
      phoneNumbers = contacts.map(c => c.phone).filter(p => isValidPhone(p));
    }

    if (phoneNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid phone numbers to send to' });
    }

    const formattedRecipients = phoneNumbers;

    // ----- cost and balance -----
    const smsLength = 160;
    const smsCount = Math.ceil(message.length / smsLength);
    const costPerSms = 62;
    const totalCost = smsCount * costPerSms * formattedRecipients.length;

    let balance = await db.SmsBalance.findOne();
    if (!balance) balance = await db.SmsBalance.create({ balance: 1000, totalPurchased: 0, totalUsed: 0, totalSpent: 0 });

    if (balance.balance < totalCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient SMS balance. Need ${totalCost} SMS, have ${balance.balance}`
      });
    }

    // ----- create record -----
    const finalRecipientIds = recipientIds || formattedRecipients;
    const smsRecord = await db.SmsMessage.create({
      recipient: formattedRecipients.length === 1 ? formattedRecipients[0] : 'BULK',
      recipientName: recipientName || formattedRecipients.join(', '),
      message: message,
      category: category || 'general',
      scheduledFor: scheduledFor || null,
      totalRecipients: formattedRecipients.length,
      status: 'pending',
      smsCount: smsCount,
      cost: totalCost,
      recipientType: recipientType || 'general',
      recipientIds: finalRecipientIds,
      isBulk: isBulk || formattedRecipients.length > 1,
      templateId: templateId || null,
      sentAt: new Date()
    });

    // ===== SENDER ID – FORCED TO USE ENV OR ATInfo =====
    const finalSenderId = process.env.YOOLA_SENDER_ID || 'ATInfo';
    console.log('📌 Using sender ID:', finalSenderId);

    // ===== SEND VIA YOOLA =====
    try {
      const YOOLA_API_KEY = process.env.YOOLA_API_KEY;
      const YOOLA_BASE_URL = process.env.YOOLA_BASE_URL || 'https://yoolasms.com/api/v1';

      if (!YOOLA_API_KEY) {
        // Simulate
        await smsRecord.update({ status: 'sent', providerMessageId: `mock-${Date.now()}`, successfulCount: formattedRecipients.length });
        await balance.update({
          balance: balance.balance - totalCost,
          totalUsed: (balance.totalUsed || 0) + totalCost,
          totalSpent: (balance.totalSpent || 0) + totalCost
        });
        return res.json({
          success: true,
          data: { message: smsRecord, totalRecipients: formattedRecipients.length, smsUsed: totalCost, remainingBalance: balance.balance - totalCost, sender: finalSenderId },
          message: `SMS simulated to ${formattedRecipients.length} recipients (No API Key)`
        });
      }

      const phoneNumbersStr = formattedRecipients.join(',');
      const response = await axios.post(`${YOOLA_BASE_URL}/send_sms`, {
        api_key: YOOLA_API_KEY,
        phone: phoneNumbersStr,
        message,
        sender: finalSenderId
      }, { timeout: 30000, headers: { 'Content-Type': 'application/json' } });

      const isSuccess = response.data.status === 'success' || response.data.success === true || response.data.status === 'ok' || response.data.code === 200;

      if (isSuccess) {
        await smsRecord.update({
          status: 'sent',
          providerMessageId: response.data.message_id || response.data.id || `yoola-${Date.now()}`,
          successfulCount: formattedRecipients.length
        });
        await balance.update({
          balance: balance.balance - totalCost,
          totalUsed: (balance.totalUsed || 0) + totalCost,
          totalSpent: (balance.totalSpent || 0) + totalCost
        });
        return res.json({
          success: true,
          data: { message: smsRecord, totalRecipients: formattedRecipients.length, smsUsed: totalCost, remainingBalance: balance.balance - totalCost, provider: 'Yoola', sender: finalSenderId },
          message: `SMS sent successfully to ${formattedRecipients.length} recipients with sender ID: ${finalSenderId}`
        });
      } else {
        throw new Error(response.data.message || 'Yoola returned an error');
      }
    } catch (yoolaError) {
      const errorMsg = yoolaError.response?.data?.message || yoolaError.message || 'Yoola API error';
      console.error('❌ Yoola error:', errorMsg);
      console.error(yoolaError.response?.data || yoolaError);
      await smsRecord.update({ status: 'failed', remarks: errorMsg });
      return res.status(500).json({
        success: false,
        message: errorMsg,
        details: yoolaError.response?.data || null
      });
    }
  } catch (error) {
    console.error('❌ Send SMS error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ANALYTICS (REAL‑TIME BALANCE + LOCAL STATS) ====================
router.get('/analytics', async (req, res) => {
  try {
    // Sync balance from Yoola
    const updated = await syncBalanceFromYoola();

    const totalMessages = await db.SmsMessage.count();
    const totalSent = await db.SmsMessage.count({ where: { status: 'sent' } });
    const totalFailed = await db.SmsMessage.count({ where: { status: 'failed' } });
    const today = new Date();
    today.setHours(0,0,0,0);
    const sentToday = await db.SmsMessage.count({
      where: { sentAt: { [Op.gte]: today }, status: 'sent' }
    });

    res.json({
      success: true,
      data: {
        currentBalance: updated.balance || 0,
        totalPurchased: updated.totalPurchased || 0,
        totalUsed: updated.totalUsed || 0,
        totalSpent: updated.totalSpent || 0,
        totalMessages: totalMessages || 0,
        totalSent: totalSent || 0,
        totalFailed: totalFailed || 0,
        sentToday: sentToday || 0,
        deliveryRate: totalSent > 0 ? Math.round((totalSent / totalMessages) * 100) : 0
      }
    });
  } catch (error) {
    console.error('❌ Analytics error:', error);
    // Fallback to local balance
    const local = await db.SmsBalance.findOne();
    res.status(500).json({
      success: false,
      message: 'Could not fetch real‑time analytics, showing cached data',
      data: {
        currentBalance: local?.balance || 0,
        totalPurchased: local?.totalPurchased || 0,
        totalUsed: local?.totalUsed || 0,
        totalSpent: local?.totalSpent || 0
      }
    });
  }
});

module.exports = router;
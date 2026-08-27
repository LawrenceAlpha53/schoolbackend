// UserRoute/SettingsRoute.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');
const SettingsService = require('../UserServices/SettingsService'); // ✅ ADD THIS IMPORT

// ======================= SCHOOL SETTINGS =======================
router.get('/school', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    let settings = await SettingsService.getSchoolSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get school settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch school settings' });
  }
});


// GET current school settings (public, no auth needed)
router.get('/current', async (req, res) => {
  try {
    const settings = await SettingsService.getSchoolSettings();
    res.json({
      success: true,
      data: {
        currentTerm: settings.currentTerm,
        currentAcademicYear: settings.currentAcademicYear || new Date().getFullYear().toString(),
        schoolName: settings.schoolName,
        schoolMotto: settings.schoolMotto,
        schoolAddress: settings.schoolAddress,
        schoolPhone: settings.schoolPhone,
        schoolEmail: settings.schoolEmail,
        principalName: settings.principalName,
        feeCurrency: settings.feeCurrency,
        reportCardFormat: settings.reportCardFormat
      }
    });
  } catch (error) {
    console.error('Get current settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});




router.put('/school', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await SettingsService.updateSchoolSettings(req.body, userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Update school settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update school settings' });
  }
});

// ======================= USER SETTINGS =======================
router.get('/user', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await SettingsService.getUserSettings(userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user settings' });
  }
});

router.put('/user', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await SettingsService.updateUserSettings(userId, req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user settings' });
  }
});

// ======================= SYSTEM STATS =======================
router.get('/stats', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    const stats = await SettingsService.getSystemStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch system stats' });
  }
});

// ======================= BACKUP =======================
router.post('/backup', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    const result = await SettingsService.createBackup();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ success: false, message: 'Failed to create backup' });
  }
});

// ======================= CLEAR CACHE =======================
router.post('/clear-cache', verifyToken, role('admin'), async (req, res) => {
  try {
    const result = await SettingsService.clearCache();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear cache' });
  }
});

// ======================= FACTORY RESET =======================
router.post('/factory-reset', verifyToken, role('admin'), async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await SettingsService.factoryReset(userId);
    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Factory reset error:', error);
    res.status(500).json({ success: false, message: error.message || 'Factory reset failed' });
  }
});

module.exports = router;
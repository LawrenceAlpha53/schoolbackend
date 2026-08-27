const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Contact } = require('../models');
const { normalizePhone, isValidPhone } = require('../utils/normalizePhone');
const verifyToken = require('../Middlewares/AuthMiddleware');
const role = require('../Middlewares/RoleMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

// ========== GET all contacts ==========
router.get('/', verifyToken, async (req, res) => {
  try {
    const contacts = await Contact.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: contacts, count: contacts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DELETE a contact ==========
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deleted = await Contact.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DELETE all contacts ==========
router.delete('/', verifyToken, role('admin', 'secretary'), async (req, res) => {
  try {
    await Contact.destroy({ where: {} });
    res.json({ success: true, message: 'All contacts cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== IMPORT from JSON (manual input) ==========
router.post('/import', verifyToken, async (req, res) => {
  try {
    const { numbers } = req.body;
    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of phone numbers' });
    }

    const normalized = numbers
      .map(n => normalizePhone(n))
      .filter(n => n && isValidPhone(n));

    if (normalized.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid phone numbers found' });
    }

    const inserted = [];
    for (const phone of normalized) {
      try {
        const [contact, created] = await Contact.findOrCreate({
          where: { phone },
          defaults: { phone },
        });
        if (created) inserted.push(contact);
      } catch (err) {
        // ignore duplicate errors
      }
    }

    res.json({
      success: true,
      message: `Imported ${inserted.length} new contacts (${normalized.length - inserted.length} duplicates skipped)`,
      data: inserted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== IMPORT from CSV (drag & drop) ==========
router.post('/import/csv', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const csv = req.file.buffer.toString('utf8');
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length === 0) return res.status(400).json({ success: false, message: 'CSV is empty' });

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    let phoneIndex = -1;
    const possibleNames = ['phone', 'mobile', 'contact', 'telephone', 'tel', 'number', 'phonenumber'];
    for (let i = 0; i < header.length; i++) {
      if (possibleNames.some(name => header[i].includes(name))) {
        phoneIndex = i;
        break;
      }
    }
    if (phoneIndex === -1) phoneIndex = 0; // assume first column

    const numbers = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length > phoneIndex && cols[phoneIndex]) {
        numbers.push(cols[phoneIndex]);
      }
    }

    if (numbers.length === 0) {
      return res.status(400).json({ success: false, message: 'No numbers found in CSV' });
    }

    const normalized = numbers
      .map(n => normalizePhone(n))
      .filter(n => n && isValidPhone(n));

    const inserted = [];
    for (const phone of normalized) {
      try {
        const [contact, created] = await Contact.findOrCreate({
          where: { phone },
          defaults: { phone },
        });
        if (created) inserted.push(contact);
      } catch (err) {}
    }

    res.json({
      success: true,
      message: `Imported ${inserted.length} new contacts from CSV (${numbers.length} rows, ${normalized.length} valid)`,
      data: inserted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
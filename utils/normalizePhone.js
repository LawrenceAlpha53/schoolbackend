// utils/normalizePhone.js
const normalizePhone = (raw) => {
  if (!raw) return null;
  let cleaned = raw.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '256' + cleaned.substring(1);
  }
  if (/^256[0-9]{9}$/.test(cleaned)) return cleaned;
  // Try to fix common variants
  if (cleaned.length === 9 && /^[0-9]{9}$/.test(cleaned)) {
    return '256' + cleaned;
  }
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    if (cleaned.startsWith('7')) return '256' + cleaned;
  }
  return null;
};

const isValidPhone = (phone) => /^256[0-9]{9}$/.test(phone);

module.exports = { normalizePhone, isValidPhone };
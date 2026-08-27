// services/SmsService.js - WITH COMPLETE TRACKING
const axios = require('axios');
const db = require('../models');

class SmsService {
  constructor() {
    this.apiKey = process.env.YOOLA_API_KEY;
    this.baseUrl = 'https://yoolasms.com/api/v1';
    this.costPerSms = 62; // UGX 62 per SMS
  }

  // ========== SEND SMS ==========
  async sendSms(phone, message) {
    try {
      const response = await axios.post(`${this.baseUrl}/send_sms`, {
        api_key: this.apiKey,
        phone: phone,
        message: message
      });
      return response.data;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  // ========== SEND BULK SMS ==========
  async sendBulkSms(recipients, message) {
    try {
      const phoneNumbers = Array.isArray(recipients) 
        ? recipients.join(',') 
        : recipients;

      const response = await axios.post(`${this.baseUrl}/send_sms`, {
        api_key: this.apiKey,
        phone: phoneNumbers,
        message: message
      });
      return response.data;
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      throw error;
    }
  }

  // ========== CHECK BALANCE FROM YOOLA ==========
  async getBalanceFromYoola() {
    try {
      const response = await axios.post(`${this.baseUrl}/balance`, {
        api_key: this.apiKey
      });
      return response.data.balance || 0;
    } catch (error) {
      console.error('Error fetching balance from Yoola:', error);
      return 0;
    }
  }

  // ========== GET LOCAL BALANCE ==========
  async getLocalBalance() {
    try {
      const balance = await db.SmsBalance.findOne({ where: { id: 'default' } });
      if (!balance) {
        return await db.SmsBalance.create({ 
          id: 'default',
          balance: 0 
        });
      }
      return balance;
    } catch (error) {
      console.error('Error fetching local balance:', error);
      throw error;
    }
  }

  // ========== SYNC BALANCE WITH YOOLA ==========
  async syncBalance() {
    try {
      const yoolaBalance = await this.getBalanceFromYoola();
      const localBalance = await this.getLocalBalance();
      
      await localBalance.update({
        balance: yoolaBalance,
        lastSyncDate: new Date()
      });
      
      return localBalance;
    } catch (error) {
      console.error('Error syncing balance:', error);
      throw error;
    }
  }

  // ========== RECORD SMS PURCHASE ==========
  async recordPurchase(purchaseData) {
    try {
      const { 
        amount, 
        paymentMethod, 
        reference, 
        yoolaTransactionId,
        notes,
        purchasedBy 
      } = purchaseData;

      // Get current balance before purchase
      const currentBalance = await this.getLocalBalance();
      const balanceBefore = currentBalance.balance;

      // Calculate cost
      const cost = amount * this.costPerSms;

      // Create purchase record
      const purchase = await db.SmsPurchase.create({
        amount: amount,
        cost: cost,
        costPerSms: this.costPerSms,
        paymentMethod: paymentMethod,
        reference: reference || `MANUAL-${Date.now()}`,
        yoolaTransactionId: yoolaTransactionId || null,
        status: 'completed',
        notes: notes || '',
        purchasedBy: purchasedBy,
        balanceBefore: balanceBefore,
        balanceAfter: balanceBefore + amount
      });

      // Update local balance
      await currentBalance.update({
        balance: balanceBefore + amount,
        totalPurchased: currentBalance.totalPurchased + amount,
        totalSpent: currentBalance.totalSpent + cost,
        lastPurchaseDate: new Date()
      });

      // Sync with Yoola to confirm
      await this.syncBalance();

      return purchase;
    } catch (error) {
      console.error('Error recording purchase:', error);
      throw error;
    }
  }

  // ========== TRACK SMS USAGE ==========
  async trackUsage(amount) {
    try {
      const balance = await this.getLocalBalance();
      
      await balance.update({
        balance: balance.balance - amount,
        totalUsed: balance.totalUsed + amount
      });

      return balance;
    } catch (error) {
      console.error('Error tracking usage:', error);
      throw error;
    }
  }

  // ========== GET PURCHASE HISTORY ==========
  async getPurchaseHistory(limit = 50, offset = 0) {
    try {
      const purchases = await db.SmsPurchase.findAndCountAll({
        include: [{
          model: db.User,
          as: 'purchaser',
          attributes: ['id', 'Fname', 'Lname', 'Email']
        }],
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset
      });
      
      return purchases;
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      throw error;
    }
  }

  // ========== GET SMS STATISTICS ==========
  async getStatistics() {
    try {
      const balance = await this.getLocalBalance();
      
      const [
        totalMessages,
        totalRecipients,
        purchasesCount,
        totalPurchasesAmount
      ] = await Promise.all([
        db.SmsMessage.count(),
        db.SmsMessage.sum('totalRecipients'),
        db.SmsPurchase.count(),
        db.SmsPurchase.sum('amount')
      ]);

      return {
        currentBalance: balance.balance,
        totalPurchased: balance.totalPurchased || 0,
        totalUsed: balance.totalUsed || 0,
        totalSpent: balance.totalSpent || 0,
        totalMessages: totalMessages || 0,
        totalRecipients: totalRecipients || 0,
        purchasesCount: purchasesCount || 0,
        totalPurchasesAmount: totalPurchasesAmount || 0,
        lastPurchaseDate: balance.lastPurchaseDate
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  // ========== GET DELIVERY REPORT ==========
  async getDeliveryReport(messageId) {
    try {
      const response = await axios.post(`${this.baseUrl}/delivery_report`, {
        api_key: this.apiKey,
        message_id: messageId
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery report:', error);
      throw error;
    }
  }

  // ========== SCHEDULE SMS ==========
  async scheduleSms(phone, message, scheduleDate) {
    try {
      const response = await axios.post(`${this.baseUrl}/schedule_sms`, {
        api_key: this.apiKey,
        phone: phone,
        message: message,
        schedule_date: scheduleDate
      });
      return response.data;
    } catch (error) {
      console.error('Error scheduling SMS:', error);
      throw error;
    }
  }

  // ========== GET INBOX ==========
  async getInbox() {
    try {
      const response = await axios.get(`${this.baseUrl}/inbox`, {
        params: { api_key: this.apiKey }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching inbox:', error);
      return { messages: [] };
    }
  }

  // ========== CALCULATE SMS COST ==========
  calculateSmsCost(message) {
    const smsLength = 160;
    const count = Math.ceil(message.length / smsLength);
    return {
      smsCount: count,
      cost: count * this.costPerSms
    };
  }
}

module.exports = new SmsService();
// services/SmsScheduler.js
const cron = require('node-cron');
const { Op } = require('sequelize');
const db = require('../models');
const SmsService = require('./SmsService');

class SmsScheduler {
  constructor() {
    // Run every minute to check for scheduled messages
    cron.schedule('* * * * *', this.processScheduledMessages.bind(this));
    
    // Check fee reminders daily at 8 AM
    cron.schedule('0 8 * * *', this.processFeeReminders.bind(this));
    
    // Birthday SMS at 7 AM
    cron.schedule('0 7 * * *', this.processBirthdayMessages.bind(this));
  }

  async processScheduledMessages() {
    try {
      const now = new Date();
      const scheduled = await db.SmsMessage.findAll({
        where: {
          status: 'scheduled',
          scheduledFor: { [Op.lte]: now }
        }
      });

      for (const message of scheduled) {
        await SmsService.sendBulkSmsWithTracking(
          message.recipients,
          message.message
        );
        await message.update({
          status: 'sent',
          sentAt: now
        });
      }
    } catch (error) {
      console.error('Error processing scheduled messages:', error);
    }
  }

  async processFeeReminders() {
    try {
      const defaulters = await db.Fee.findAll({
        where: { balance: { [Op.gt]: 0 } },
        include: [{ model: db.Student }]
      });

      for (const fee of defaulters) {
        if (fee.Student && fee.Student.parentPhone) {
          await SmsService.sendFeeReminder(
            fee.Student,
            fee.balance,
            fee.Student.parentPhone
          );
        }
      }
    } catch (error) {
      console.error('Error processing fee reminders:', error);
    }
  }

  async processBirthdayMessages() {
    try {
      const today = new Date();
      const students = await db.Student.findAll();
      
      for (const student of students) {
        const birthday = new Date(student.dateOfBirth);
        if (birthday.getDate() === today.getDate() && 
            birthday.getMonth() === today.getMonth()) {
          if (student.parentPhone) {
            const message = `Happy Birthday ${student.fullName}!\nFrom all of us at ${process.env.SCHOOL_NAME}.`;
            await SmsService.sendSingleSms(student.parentPhone, message);
          }
        }
      }
    } catch (error) {
      console.error('Error processing birthday messages:', error);
    }
  }
}

module.exports = new SmsScheduler();
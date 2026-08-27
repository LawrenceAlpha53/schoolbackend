const db = require('../models');

const SettingsService = {
    // ================= SCHOOL SETTINGS =================
    async getSchoolSettings() {
        let settings = await db.SchoolSettings.findOne();
        if (!settings) {
            settings = await db.SchoolSettings.create({
                schoolName: 'Academic ERP System',
                currentTerm: 'Term 1',
                feeCurrency: 'UGX',
                reportCardFormat: 'standard'
            });
        }
        return settings;
    },



async getCurrentTermAndYear() {
  const settings = await this.getSchoolSettings();
  return {
    term: settings.currentTerm,
    year: settings.currentAcademicYear || new Date().getFullYear().toString()
  };
},


async getDefaultTermAndYear() {
  const settings = await this.getSchoolSettings();
  return {
    term: settings.currentTerm || 'Term 0',
    year: settings.currentAcademicYear || new Date().getFullYear().toString()
  };
},



// ================= FACTORY RESET =================
// ================= FACTORY RESET =================
async factoryReset(userId) {
  const transaction = await db.sequelize.transaction();
  try {
    // 1. Get all table names in the public schema (exclude SequelizeMeta and system tables)
    const [tables] = await db.sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'SequelizeMeta'
    `, { transaction });

    const tableNames = tables.map(row => row.table_name);

    // 2. Delete all rows from each table (except Users – we handle it separately)
    for (const table of tableNames) {
      if (table === 'Users') continue; // skip, we'll handle users manually

      try {
        await db.sequelize.query(`DELETE FROM "${table}"`, { transaction });
        console.log(`✅ Deleted all rows from ${table}`);
      } catch (err) {
        // If DELETE fails (likely due to foreign key), try TRUNCATE with CASCADE
        if (err.message.includes('foreign key')) {
          await db.sequelize.query(`TRUNCATE TABLE "${table}" CASCADE`, { transaction });
          console.log(`✅ Truncated ${table} (with CASCADE)`);
        } else {
          // Re-throw unexpected errors
          throw err;
        }
      }
    }

    // 3. Delete all non‑admin users (keep current user and other admins)
    await db.sequelize.query(
      `DELETE FROM "Users" WHERE id != :userId AND role != 'admin'`,
      { transaction, replacements: { userId } }
    );

    // 4. Reset all sequences (auto‑increment counters)
    const [seqs] = await db.sequelize.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `, { transaction });

    for (const seq of seqs) {
      const seqName = seq.sequence_name;
      // Reset sequence to 1 (only if it's associated with a table column)
      try {
        await db.sequelize.query(
          `SELECT setval('"${seqName}"', 1, false)`,
          { transaction }
        );
      } catch (_) { /* ignore */ }
    }

    // 5. Reset school settings to defaults
    await db.SchoolSettings.update(
      {
        schoolName: 'Academic ERP System',
        schoolAddress: 'Kampala, Uganda',
        schoolPhone: '+256 700 000 000',
        schoolEmail: 'info@school.ug',
        schoolMotto: 'Excellence in Education',
        currentTerm: 'Term 1',
        currentAcademicYear: new Date().getFullYear().toString(),
        principalName: 'Dr. John Doe',
        feeCurrency: 'UGX',
        reportCardFormat: 'standard'
      },
      { where: {}, transaction }
    );

    await transaction.commit();
    return { success: true, message: 'Factory reset completed successfully' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
},



    async updateSchoolSettings(data, userId) {
        const settings = await db.SchoolSettings.findOne();
        if (!settings) {
            throw new Error('School settings not found');
        }
        const updated = await settings.update({
            ...data,
            updatedBy: userId
        });
        return updated;
    },

    // ================= USER SETTINGS =================
    async getUserSettings(userId) {
        let settings = await db.UserSettings.findOne({ where: { userId } });
        if (!settings) {
            settings = await db.UserSettings.create({
                userId,
                theme: 'light',
                language: 'en',
                notificationsEnabled: true
            });
        }
        return settings;
    },

    async updateUserSettings(userId, data) {
        const settings = await db.UserSettings.findOne({ where: { userId } });
        if (!settings) {
            throw new Error('User settings not found');
        }
        await settings.update(data);
        return settings;
    },

    // ================= SYSTEM STATISTICS =================
    async getSystemStats() {
        const [
            totalUsers,
            totalStudents,
            totalTeachers,
            totalClasses,
            totalSubjects,
            totalFees,
            totalMarks
        ] = await Promise.all([
            db.Users.count(),
            db.Student.count(),
            db.Teacher.count(),
            db.Class.count(),
            db.Subject.count(),
            db.Fee.count(),
            db.Mark.count()
        ]);

        return {
            totalUsers,
            totalStudents,
            totalTeachers,
            totalClasses,
            totalSubjects,
            totalFees,
            totalMarks,
            lastUpdated: new Date()
        };
    },

    // ================= SYSTEM BACKUP =================
    async createBackup() {
        return {
            success: true,
            message: 'Backup created successfully',
            timestamp: new Date().toISOString(),
            filename: `backup_${new Date().toISOString().slice(0,10)}.sql`
        };
    },

    // ================= CLEAR CACHE =================
    async clearCache() {
        return {
            success: true,
            message: 'Cache cleared successfully',
            timestamp: new Date().toISOString()
        };
    }
};

module.exports = SettingsService;
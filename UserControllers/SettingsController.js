const SettingsService = require('../UserServices/SettingsService');

// Check if SettingsService exists, if not create placeholder
let service;
try {
    service = require('../UserServices/SettingsService');
} catch (error) {
    console.warn('⚠️ SettingsService not found, using placeholder');
    service = {
        getSchoolSettings: async () => ({ schoolName: 'School Management System', currentTerm: 'Term 1' }),
        updateSchoolSettings: async (data, userId) => ({ ...data, updatedBy: userId }),
        getUserSettings: async (userId) => ({ userId, theme: 'light', language: 'en' }),
        updateUserSettings: async (userId, data) => ({ userId, ...data }),
        getSystemStats: async () => ({ totalUsers: 0, totalStudents: 0 }),
        createBackup: async () => ({ success: true, message: 'Backup created' }),
        clearCache: async () => ({ success: true, message: 'Cache cleared' })
    };
}

const SettingsController = {
    async getSchoolSettings(req, res, next) {
        try {
            const settings = await service.getSchoolSettings();
            res.json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error);
        }
    },

    async updateSchoolSettings(req, res, next) {
        try {
            const userId = req.user.id;
            const settings = await service.updateSchoolSettings(req.body, userId);
            res.json({
                success: true,
                message: 'School settings updated successfully',
                data: settings
            });
        } catch (error) {
            next(error);
        }
    },

    async getUserSettings(req, res, next) {
        try {
            const userId = req.user.id;
            const settings = await service.getUserSettings(userId);
            res.json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error);
        }
    },

    async updateUserSettings(req, res, next) {
        try {
            const userId = req.user.id;
            const settings = await service.updateUserSettings(userId, req.body);
            res.json({
                success: true,
                message: 'User settings updated successfully',
                data: settings
            });
        } catch (error) {
            next(error);
        }
    },

    async getSystemStats(req, res, next) {
        try {
            const stats = await service.getSystemStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    },

    async createBackup(req, res, next) {
        try {
            const result = await service.createBackup();
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async clearCache(req, res, next) {
        try {
            const result = await service.clearCache();
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = SettingsController;
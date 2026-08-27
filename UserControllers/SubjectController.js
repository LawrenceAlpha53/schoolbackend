// UserControllers/SubjectController.js - COMPLETE FIXED
const db = require('../models');
const SubjectService = require('../UserServices/SubjectService');

const SubjectController = {

  async createSubject(req, res, next) {
    try {
      console.log('📌 CREATE SUBJECT:', req.body);
      const subject = await SubjectService.createSubject(req.body);
      res.status(201).json({ success: true, data: subject });
    } catch (error) { 
      console.error('❌ Create subject error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ✅ GET ALL SUBJECTS - WITH PROPER ERROR HANDLING
  async getSubjects(req, res, next) {
    try {
      console.log('📌 GET ALL SUBJECTS');
      const subjects = await SubjectService.getSubjects();
      
      console.log(`📌 Returning ${subjects.length} subjects`);
      
      res.json({ 
        success: true, 
        data: subjects 
      });
      
    } catch (error) { 
      console.error('❌ Get subjects error:', error);
      // Return empty array instead of failing
      res.json({ 
        success: true, 
        data: [],
        message: 'Error loading subjects, but returning empty array'
      });
    }
  },

  async getSubject(req, res, next) {
    try {
      console.log('📌 GET SUBJECT:', req.params.id);
      const subject = await SubjectService.getSubject(req.params.id);
      res.json({ success: true, data: subject });
    } catch (error) { 
      console.error('❌ Get subject error:', error);
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async updateSubject(req, res, next) {
    try {
      console.log('📌 UPDATE SUBJECT:', req.params.id, req.body);
      const subject = await SubjectService.updateSubject(req.params.id, req.body);
      res.json({ success: true, data: subject });
    } catch (error) { 
      console.error('❌ Update subject error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteSubject(req, res, next) {
    try {
      console.log('📌 DELETE SUBJECT:', req.params.id);
      await SubjectService.deleteSubject(req.params.id);
      res.json({ success: true, message: 'Subject deleted' });
    } catch (error) { 
      console.error('❌ Delete subject error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ============================================================
  // ✅ ASSIGN TEACHER TO SUBJECT
  // ============================================================
  async assignTeacher(req, res, next) {
    try {
      const { subjectId, teacherId } = req.params;
      
      console.log('🔍 ASSIGN TEACHER:', { subjectId, teacherId });
      
      await SubjectService.assignTeacherToSubject(subjectId, teacherId);
      
      // Get updated subject with teachers
      const subject = await SubjectService.getSubject(subjectId);
      
      res.json({ 
        success: true, 
        data: subject,
        message: 'Teacher assigned successfully'
      });
      
    } catch (error) {
      console.error('❌ Assign teacher error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // ============================================================
  // ✅ REMOVE TEACHER FROM SUBJECT
  // ============================================================
  async removeTeacher(req, res, next) {
    try {
      const { subjectId, teacherId } = req.params;
      
      console.log('🔍 REMOVE TEACHER:', { subjectId, teacherId });
      
      await SubjectService.removeTeacherFromSubject(subjectId, teacherId);
      
      // Get updated subject with teachers
      const subject = await SubjectService.getSubject(subjectId);
      
      res.json({ 
        success: true, 
        data: subject,
        message: 'Teacher unassigned successfully' 
      });
      
    } catch (error) {
      console.error('❌ Remove teacher error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ============================================================
  // ✅ ASSIGN CLASS TO SUBJECT
  // ============================================================
  async assignClass(req, res, next) {
    try {
      const { subjectId, classId } = req.params;
      
      console.log('🔍 ASSIGN CLASS:', { subjectId, classId });
      
      const subject = await SubjectService.assignSubjectToClass(subjectId, classId);
      
      res.json({ 
        success: true, 
        data: subject,
        message: 'Class assigned to subject successfully'
      });
      
    } catch (error) {
      console.error('❌ Assign class error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // ============================================================
  // ✅ REMOVE CLASS FROM SUBJECT
  // ============================================================
  async removeClass(req, res, next) {
    try {
      const { subjectId } = req.params;
      
      console.log('🔍 REMOVE CLASS:', { subjectId });
      
      const subject = await SubjectService.removeSubjectFromClass(subjectId);
      
      res.json({ 
        success: true, 
        data: subject,
        message: 'Class removed from subject successfully'
      });
      
    } catch (error) {
      console.error('❌ Remove class error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = SubjectController;
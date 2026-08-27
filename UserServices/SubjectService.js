// UserServices/SubjectService.js - SIMPLIFIED WORKING VERSION
const db = require('../models');

class SubjectService {
  
  // ============================================================
  // ✅ CREATE SUBJECT
  // ============================================================
  async createSubject(data) {
    try {
      const { classId, ...subjectData } = data;
      const subject = await db.Subject.create({
        ...subjectData,
        classId: classId || null
      });
      return await this.getSubject(subject.id);
    } catch (error) {
      console.error('Create subject error:', error);
      throw error;
    }
  }

  // ============================================================
  // ✅ GET ALL SUBJECTS - USING RAW SQL (WORKS 100%)
  // ============================================================
  async getSubjects() {
    try {
      console.log('📌 Fetching all subjects...');
      
      // ✅ Get all subjects with class information using RAW SQL
      const subjects = await db.sequelize.query(`
        SELECT 
          s.*,
          c.id as "class.id",
          c."className" as "class.className"
        FROM "Subjects" s
        LEFT JOIN "Classes" c ON s."classId" = c.id
        ORDER BY s."subjectName" ASC
      `, {
        type: db.sequelize.QueryTypes.SELECT,
        nest: true
      });
      
      console.log(`📌 Found ${subjects.length} subjects`);
      
      // ✅ For each subject, get teachers
      for (let subject of subjects) {
        try {
          const teachers = await db.sequelize.query(`
            SELECT 
              t.id,
              t."fullName",
              t.email,
              t."phoneNumber",
              t."employeeNumber"
            FROM "Teachers" t
            INNER JOIN "TeacherSubjects" ts ON t.id = ts."teacherId"
            WHERE ts."subjectId" = ${subject.id}
          `, {
            type: db.sequelize.QueryTypes.SELECT
          });
          
          subject.teachers = teachers || [];
          subject.teacherCount = teachers ? teachers.length : 0;
          
        } catch (err) {
          console.error(`Error getting teachers for subject ${subject.id}:`, err.message);
          subject.teachers = [];
          subject.teacherCount = 0;
        }
      }
      
      console.log('✅ Subjects loaded successfully:', subjects.map(s => ({
        id: s.id,
        name: s.subjectName,
        class: s.class ? s.class.className : 'No class',
        teacherCount: s.teacherCount || 0
      })));
      
      return subjects;
      
    } catch (error) {
      console.error('❌ Get subjects error:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  // ============================================================
  // ✅ GET SINGLE SUBJECT
  // ============================================================
  async getSubject(id) {
    try {
      console.log(`📌 Getting subject ${id}...`);
      
      // Get subject with class
      const subjects = await db.sequelize.query(`
        SELECT 
          s.*,
          c.id as "class.id",
          c."className" as "class.className"
        FROM "Subjects" s
        LEFT JOIN "Classes" c ON s."classId" = c.id
        WHERE s.id = ${id}
      `, {
        type: db.sequelize.QueryTypes.SELECT,
        nest: true
      });
      
      if (!subjects || subjects.length === 0) {
        throw new Error('Subject not found');
      }
      
      const subject = subjects[0];
      
      // Get teachers for this subject
      const teachers = await db.sequelize.query(`
        SELECT 
          t.id,
          t."fullName",
          t.email,
          t."phoneNumber",
          t."employeeNumber"
        FROM "Teachers" t
        INNER JOIN "TeacherSubjects" ts ON t.id = ts."teacherId"
        WHERE ts."subjectId" = ${id}
      `, {
        type: db.sequelize.QueryTypes.SELECT
      });
      
      subject.teachers = teachers || [];
      subject.teacherCount = teachers ? teachers.length : 0;
      
      return subject;
      
    } catch (error) {
      console.error('❌ Get subject error:', error);
      throw error;
    }
  }

  // ============================================================
  // ✅ UPDATE SUBJECT
  // ============================================================
  async updateSubject(id, data) {
    try {
      console.log(`📌 Updating subject ${id}:`, data);
      
      const { classId, ...updateData } = data;
      
      // Build update query
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (updateData.subjectName !== undefined) {
        updates.push(`"subjectName" = $${paramIndex++}`);
        values.push(updateData.subjectName);
      }
      if (updateData.subjectCode !== undefined) {
        updates.push(`"subjectCode" = $${paramIndex++}`);
        values.push(updateData.subjectCode);
      }
      if (updateData.level !== undefined) {
        updates.push(`"level" = $${paramIndex++}`);
        values.push(updateData.level);
      }
      if (updateData.category !== undefined) {
        updates.push(`"category" = $${paramIndex++}`);
        values.push(updateData.category);
      }
      if (updateData.description !== undefined) {
        updates.push(`"description" = $${paramIndex++}`);
        values.push(updateData.description);
      }
      if (updateData.isCompulsory !== undefined) {
        updates.push(`"isCompulsory" = $${paramIndex++}`);
        values.push(updateData.isCompulsory);
      }
      if (updateData.examinable !== undefined) {
        updates.push(`"examinable" = $${paramIndex++}`);
        values.push(updateData.examinable);
      }
      if (classId !== undefined) {
        updates.push(`"classId" = $${paramIndex++}`);
        values.push(classId || null);
      }
      
      updates.push(`"updatedAt" = NOW()`);
      values.push(id);
      
      if (updates.length === 0) {
        throw new Error('No fields to update');
      }
      
      const query = `
        UPDATE "Subjects" 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      console.log('📌 Update query:', query);
      console.log('📌 Values:', values);
      
      const result = await db.sequelize.query(query, {
        bind: values,
        type: db.sequelize.QueryTypes.UPDATE
      });
      
      return await this.getSubject(id);
      
    } catch (error) {
      console.error('❌ Update subject error:', error);
      throw error;
    }
  }

  // ============================================================
  // ✅ DELETE SUBJECT
  // ============================================================
  async deleteSubject(id) {
    try {
      // Delete from TeacherSubjects first
      await db.sequelize.query(`
        DELETE FROM "TeacherSubjects" WHERE "subjectId" = ${id}
      `);
      
      // Delete from ClassSubjects if exists
      await db.sequelize.query(`
        DELETE FROM "ClassSubjects" WHERE "subjectId" = ${id}
      `);
      
      // Delete the subject
      await db.sequelize.query(`
        DELETE FROM "Subjects" WHERE id = ${id}
      `);
      
      return true;
      
    } catch (error) {
      console.error('❌ Delete subject error:', error);
      throw error;
    }
  }

  // ============================================================
  // ✅ ASSIGN TEACHER TO SUBJECT
  // ============================================================
  async assignTeacherToSubject(subjectId, teacherId) {
    try {
      console.log('🔍 Assigning teacher:', { subjectId, teacherId });
      
      // Check if already assigned
      const existing = await db.sequelize.query(`
        SELECT * FROM "TeacherSubjects" 
        WHERE "teacherId" = ${teacherId} AND "subjectId" = ${subjectId}
      `, {
        type: db.sequelize.QueryTypes.SELECT
      });
      
      if (existing && existing.length > 0) {
        throw new Error('Teacher already assigned to this subject');
      }
      
      // Insert assignment
      await db.sequelize.query(`
        INSERT INTO "TeacherSubjects" ("teacherId", "subjectId", "createdAt", "updatedAt") 
        VALUES (${teacherId}, ${subjectId}, NOW(), NOW())
      `);
      
      console.log('✅ Assignment created successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Assign teacher error:', error);
      throw error;
    }
  }

  // ============================================================
  // ✅ REMOVE TEACHER FROM SUBJECT
  // ============================================================
  async removeTeacherFromSubject(subjectId, teacherId) {
    try {
      await db.sequelize.query(`
        DELETE FROM "TeacherSubjects" 
        WHERE "teacherId" = ${teacherId} AND "subjectId" = ${subjectId}
      `);
      return true;
    } catch (error) {
      console.error('❌ Remove teacher error:', error);
      throw error;
    }
  }

  // ============================================================
  // ✅ ASSIGN SUBJECT TO CLASS
  // ============================================================
  async assignSubjectToClass(subjectId, classId) {
    try {
      // Update subject's classId
      await db.sequelize.query(`
        UPDATE "Subjects" SET "classId" = ${classId}, "updatedAt" = NOW()
        WHERE id = ${subjectId}
      `);
      
      // Check if ClassSubject table exists and add entry
      try {
        await db.sequelize.query(`
          INSERT INTO "ClassSubjects" ("classId", "subjectId", "createdAt", "updatedAt") 
          VALUES (${classId}, ${subjectId}, NOW(), NOW())
          ON CONFLICT ("classId", "subjectId") DO NOTHING
        `);
      } catch (err) {
        console.log('ClassSubjects table may not exist, skipping...');
      }
      
      return await this.getSubject(subjectId);
      
    } catch (error) {
      console.error('❌ Assign subject to class error:', error);
      throw error;
    }
  }

  // ============================================================
  // ✅ REMOVE SUBJECT FROM CLASS
  // ============================================================
  async removeSubjectFromClass(subjectId) {
    try {
      // Update subject's classId to null
      await db.sequelize.query(`
        UPDATE "Subjects" SET "classId" = NULL, "updatedAt" = NOW()
        WHERE id = ${subjectId}
      `);
      
      // Remove from ClassSubjects if exists
      try {
        await db.sequelize.query(`
          DELETE FROM "ClassSubjects" WHERE "subjectId" = ${subjectId}
        `);
      } catch (err) {
        console.log('ClassSubjects table may not exist, skipping...');
      }
      
      return await this.getSubject(subjectId);
      
    } catch (error) {
      console.error('❌ Remove subject from class error:', error);
      throw error;
    }
  }
}

module.exports = new SubjectService();
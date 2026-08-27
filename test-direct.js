const db = require('./models');

async function test() {
  try {
    console.log('🔍 ===== DIRECT DATABASE TEST =====');
    
    // Check student
    const student = await db.Student.findByPk(60);
    console.log('📌 Student 60:', student ? student.fullName : 'NOT FOUND');
    console.log('📌 Student data:', student ? student.toJSON() : null);
    
    // Check requirement
    const requirement = await db.Requirement.findByPk(1);
    console.log('📌 Requirement 1:', requirement ? requirement.requirementName : 'NOT FOUND');
    console.log('📌 Requirement data:', requirement ? requirement.toJSON() : null);
    
    if (student && requirement) {
      console.log('✅ Both found! Creating assignment...');
      
      const assignment = await db.StudentRequirement.create({
        studentId: 60,
        requirementId: 1,
        requiredQuantity: requirement.quantityRequired || 1,
        quantityReceived: 0,
        balance: requirement.quantityRequired || 1,
        status: 'Pending',
        academicYear: '2026',
        term: 'Term 1',
        condition: 'Pending',
        remarks: 'Direct test assignment'
      });
      
      console.log('✅ ASSIGNMENT CREATED! ID:', assignment.id);
      console.log('📊 Full data:', assignment.toJSON());
    } else {
      console.log('❌ Student or Requirement not found!');
      console.log('Student exists?', !!student);
      console.log('Requirement exists?', !!requirement);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

test();
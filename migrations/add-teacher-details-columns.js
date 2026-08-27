// migrations/xxxxxxxxxxxxxx-add-teacher-details-columns.js - FIXED VERSION
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns exist before adding them
    
    // 1. Add alternativePhone
    try {
      await queryInterface.addColumn('Teachers', 'alternativePhone', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added alternativePhone column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ alternativePhone column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 2. Add dateOfBirth
    try {
      await queryInterface.addColumn('Teachers', 'dateOfBirth', {
        type: Sequelize.DATEONLY,
        allowNull: true
      });
      console.log('✅ Added dateOfBirth column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ dateOfBirth column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 3. Add gender
    try {
      await queryInterface.addColumn('Teachers', 'gender', {
        type: Sequelize.ENUM('Male', 'Female', 'Other'),
        allowNull: true
      });
      console.log('✅ Added gender column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ gender column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 4. Add nationalId
    try {
      await queryInterface.addColumn('Teachers', 'nationalId', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      });
      console.log('✅ Added nationalId column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ nationalId column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 5. Add employeeNumber
    try {
      await queryInterface.addColumn('Teachers', 'employeeNumber', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      });
      console.log('✅ Added employeeNumber column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ employeeNumber column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 6. Add qualification
    try {
      await queryInterface.addColumn('Teachers', 'qualification', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added qualification column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ qualification column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 7. Add specialization
    try {
      await queryInterface.addColumn('Teachers', 'specialization', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added specialization column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ specialization column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 8. Add yearsOfExperience
    try {
      await queryInterface.addColumn('Teachers', 'yearsOfExperience', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added yearsOfExperience column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ yearsOfExperience column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 9. Add startDate
    try {
      await queryInterface.addColumn('Teachers', 'startDate', {
        type: Sequelize.DATEONLY,
        allowNull: true
      });
      console.log('✅ Added startDate column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ startDate column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 10. Add employmentStatus - SKIP if exists
    try {
      await queryInterface.addColumn('Teachers', 'employmentStatus', {
        type: Sequelize.ENUM('Permanent', 'Contract', 'Probation', 'Part-time', 'Volunteer'),
        allowNull: true,
        defaultValue: 'Contract'
      });
      console.log('✅ Added employmentStatus column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ employmentStatus column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 11. Add userId - SKIP since it already exists
    try {
      // Check if column exists first by trying to add it
      await queryInterface.addColumn('Teachers', 'userId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added userId column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ userId column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 12. Add basicSalary
    try {
      await queryInterface.addColumn('Teachers', 'basicSalary', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
      });
      console.log('✅ Added basicSalary column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ basicSalary column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 13. Add salaryScale
    try {
      await queryInterface.addColumn('Teachers', 'salaryScale', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added salaryScale column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ salaryScale column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 14. Add bankName
    try {
      await queryInterface.addColumn('Teachers', 'bankName', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added bankName column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ bankName column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 15. Add bankAccountNumber
    try {
      await queryInterface.addColumn('Teachers', 'bankAccountNumber', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added bankAccountNumber column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ bankAccountNumber column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 16. Add emergencyContactName
    try {
      await queryInterface.addColumn('Teachers', 'emergencyContactName', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added emergencyContactName column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ emergencyContactName column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 17. Add emergencyContactPhone
    try {
      await queryInterface.addColumn('Teachers', 'emergencyContactPhone', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added emergencyContactPhone column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ emergencyContactPhone column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 18. Add emergencyContactRelation
    try {
      await queryInterface.addColumn('Teachers', 'emergencyContactRelation', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added emergencyContactRelation column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ emergencyContactRelation column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 19. Add homeAddress
    try {
      await queryInterface.addColumn('Teachers', 'homeAddress', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('✅ Added homeAddress column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ homeAddress column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 20. Add district
    try {
      await queryInterface.addColumn('Teachers', 'district', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added district column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ district column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 21. Add subCounty
    try {
      await queryInterface.addColumn('Teachers', 'subCounty', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added subCounty column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ subCounty column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 22. Add village
    try {
      await queryInterface.addColumn('Teachers', 'village', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added village column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ village column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 23. Add status
    try {
      await queryInterface.addColumn('Teachers', 'status', {
        type: Sequelize.ENUM('Active', 'On Leave', 'Suspended', 'Retired', 'Terminated'),
        allowNull: true,
        defaultValue: 'Active'
      });
      console.log('✅ Added status column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ status column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 24. Add isActive
    try {
      await queryInterface.addColumn('Teachers', 'isActive', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true
      });
      console.log('✅ Added isActive column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ isActive column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 25. Add terminationDate
    try {
      await queryInterface.addColumn('Teachers', 'terminationDate', {
        type: Sequelize.DATEONLY,
        allowNull: true
      });
      console.log('✅ Added terminationDate column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ terminationDate column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // 26. Add terminationReason
    try {
      await queryInterface.addColumn('Teachers', 'terminationReason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('✅ Added terminationReason column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ terminationReason column already exists, skipping...');
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface) {
    // Remove all columns (in reverse order - with error handling)
    const columns = [
      'terminationReason',
      'terminationDate',
      'isActive',
      'status',
      'village',
      'subCounty',
      'district',
      'homeAddress',
      'emergencyContactRelation',
      'emergencyContactPhone',
      'emergencyContactName',
      'bankAccountNumber',
      'bankName',
      'salaryScale',
      'basicSalary',
      'userId',
      'employmentStatus',
      'startDate',
      'yearsOfExperience',
      'specialization',
      'qualification',
      'employeeNumber',
      'nationalId',
      'gender',
      'dateOfBirth',
      'alternativePhone'
    ];
    
    for (const column of columns) {
      try {
        await queryInterface.removeColumn('Teachers', column);
        console.log(`✅ Removed ${column} column`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`⚠️ ${column} column does not exist, skipping...`);
        } else {
          throw error;
        }
      }
    }
  }
};
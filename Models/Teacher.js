'use strict';

module.exports = (sequelize, DataTypes) => {

  const Teacher = sequelize.define('Teacher', {

    isClassTeacher: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },

    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    alternativePhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: true
    },
    nationalId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    employeeNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    qualification: {
      type: DataTypes.STRING,
      allowNull: true
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    employmentStatus: {
      type: DataTypes.ENUM('Permanent', 'Contract', 'Probation', 'Part-time', 'Volunteer'),
      allowNull: false,
      defaultValue: 'Contract'
    },
    classId: DataTypes.INTEGER,
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    },
    basicSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    },
    salaryScale: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankAccountNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContactName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContactRelation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    homeAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    district: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subCounty: {
      type: DataTypes.STRING,
      allowNull: true
    },
    village: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'On Leave', 'Suspended', 'Retired', 'Terminated'),
      defaultValue: 'Active'
    },
    terminationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    terminationReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'Teachers',
    timestamps: true,

    // ========== HOOKS: Auto‑generate employeeNumber ==========
    hooks: {
      // beforeValidate runs before validation – safest place
      beforeValidate: async (teacher, options) => {
        if (!teacher.employeeNumber) {
          const count = await sequelize.models.Teacher.count();
          teacher.employeeNumber = `EMP-${String(count + 1).padStart(5, '0')}`;
          console.log(`✅ Auto-generated employeeNumber: ${teacher.employeeNumber}`);
        }
      },
      // fallback in case beforeValidate is skipped (e.g., bulkCreate with individualHooks: false)
      beforeCreate: async (teacher, options) => {
        if (!teacher.employeeNumber) {
          const count = await sequelize.models.Teacher.count();
          teacher.employeeNumber = `EMP-${String(count + 1).padStart(5, '0')}`;
          console.log(`✅ (fallback) Auto-generated employeeNumber: ${teacher.employeeNumber}`);
        }
      }
    }
  });

  Teacher.associate = (models) => {
    Teacher.belongsTo(models.Class, { foreignKey: 'classId', as: 'class' });
    Teacher.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });

    Teacher.belongsToMany(models.Subject, {
      through: 'TeacherSubjects',
      foreignKey: 'teacherId',
      otherKey: 'subjectId',
      as: 'subjects'
    });

    Teacher.hasMany(models.Mark, { foreignKey: 'teacherId', as: 'marks' });
    Teacher.hasMany(models.TeacherAttendance, { foreignKey: 'teacherId', as: 'attendances' });
    Teacher.hasMany(models.TeacherAllowance, { foreignKey: 'teacherId', as: 'allowances' });
    Teacher.hasMany(models.TeacherAdvance, { foreignKey: 'teacherId', as: 'advances' });
    Teacher.hasMany(models.TeacherLoan, { foreignKey: 'teacherId', as: 'loans' });
    Teacher.hasMany(models.TeacherDocument, { foreignKey: 'teacherId', as: 'documents' });
    Teacher.hasMany(models.TeacherLeave, { foreignKey: 'teacherId', as: 'leaves' });
  };

  return Teacher;
};
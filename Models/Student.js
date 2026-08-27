// models/Student.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    static associate(models) {
      Student.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class'
      });

      Student.hasMany(models.Mark, {
        foreignKey: 'studentId',
        as: 'marks'
      });



      Student.hasMany(models.Fee, {
        foreignKey: 'studentId',
        as: 'fees'
      });

      Student.hasMany(models.ReportCard, {
        foreignKey: 'studentId',
        as: 'reportCards'
      });

      Student.hasMany(models.StudentPromotion, {
  foreignKey: 'studentId',
  as: 'promotions',
});

      Student.hasMany(models.Attendance, {
        foreignKey: 'studentId',
        as: 'attendances'
      });

      // ✅ Add StudentRequirement if it exists
      if (models.StudentRequirement) {
        Student.hasMany(models.StudentRequirement, {
          foreignKey: 'studentId',
          as: 'studentRequirements'
        });
      }
    }
  }

  Student.init({
    studentNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },

promotionStatus: {
  type: DataTypes.ENUM('pending', 'promoted', 'not_promoted', 'repeated'),
  defaultValue: 'pending'
},

    gender: {
      type: DataTypes.ENUM("Male", "Female"),
      allowNull: true
    },


Section: {
  type: DataTypes.ENUM("Day Section", "Boarding Section"),
  allowNull:true
},


    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Classes',
        key: 'id'
      }
    },
    parentName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    parentPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Active'
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: true
    },
    medicalcondition: {
      type: DataTypes.ENUM("none", "allergy", "asthma", "diabetes", "epilepsy", "sicklecell", "heartcondition", "visualImpairment", "hearingImpairement", "physicalDisability", "other"),
      defaultValue: 'none'
    }
  }, {
    sequelize,
    modelName: 'Student',
    tableName: 'Students'
  });

  return Student;
};
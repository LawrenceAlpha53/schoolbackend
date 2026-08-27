// 'use strict';

// const { Model } = require('sequelize');

// module.exports = (sequelize, DataTypes) => {

//   class Fee extends Model {

//     static associate(models) {

//       // Each fee record belongs to one student
//       Fee.belongsTo(models.Student, {
//         foreignKey: 'studentId',
//         as: 'student'
//       });

//     }

//   }

//   Fee.init({

//     studentId: {
//       type: DataTypes.INTEGER,
//       allowNull: false
//     },

//     amountPaid: {
//       type: DataTypes.FLOAT,
//       allowNull: false
//     },

//     totalFee: {
//       type: DataTypes.FLOAT,
//       allowNull: false
//     },

//     balance: {
//       type: DataTypes.FLOAT,
//       allowNull: true
//     },

//     term: {
//       type: DataTypes.STRING,
//       allowNull: false
//     },

//     academicYear: {
//       type: DataTypes.STRING,
//       allowNull: false
//     },

//     paymentMethod: {
//       type: DataTypes.STRING,
//       allowNull: true
//     },

//     paymentDate: {
//       type: DataTypes.DATEONLY,
//       defaultValue: DataTypes.NOW
//     }

//   }, {

//     sequelize,
//     modelName: 'Fee',
//     tableName: 'Fees'

//   });

//   return Fee;
// };





'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Fee extends Model {
    static associate(models) {
      // Each fee record belongs to one student
      Fee.belongsTo(models.Student, {
        foreignKey: 'studentId',
        as: 'student'
      });
    }
  }

  Fee.init({
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Students',
        key: 'id'
      }
    },
    totalFee: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    amountPaid: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    balance: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    term: {
      type: DataTypes.STRING,
      allowNull: false
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    referenceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Fee',
    tableName: 'Fees',
    hooks: {
      beforeCreate: (fee) => {
        // Auto-calculate balance
        fee.balance = fee.totalFee - fee.amountPaid;
        // Generate reference if not provided
        if (!fee.referenceNumber) {
          fee.referenceNumber = `REF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
        }
      },
      beforeUpdate: (fee) => {
        // Recalculate balance on update
        fee.balance = fee.totalFee - fee.amountPaid;
      }
    }
  });

  return Fee;
};
// // // models/Notification.js
// // 'use strict';
// // const { Model } = require('sequelize');

// // module.exports = (sequelize, DataTypes) => {
// //   class Notification extends Model {
// //     static associate(models) {
// //       Notification.belongsTo(models.Users, {
// //         foreignKey: 'userId',
// //         as: 'user'
// //       });
      
// //       Notification.belongsTo(models.Users, {
// //         foreignKey: 'createdBy',
// //         as: 'creator' 
// //       });
// //     }
// //   }

// //   Notification.init({
// //     userId: {
// //       type: DataTypes.INTEGER,
// //       allowNull: true,
// //       references: {
// //         model: 'Users',
// //         key: 'id'
// //       }
// //     },
// //     title: {
// //       type: DataTypes.STRING,
// //       allowNull: false
// //     },
// //     message: {
// //       type: DataTypes.TEXT,
// //       allowNull: false
// //     },
// //     type: {
// //       type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'announcement', 'reminder'),
// //       defaultValue: 'info'
// //     },
// //     category: {
// //       type: DataTypes.ENUM('general', 'academic', 'fee', 'attendance', 'report', 'event', 'system'),
// //       defaultValue: 'general'
// //     },
// //     priority: {
// //       type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
// //       defaultValue: 'medium'
// //     },
// //     isRead: {
// //       type: DataTypes.BOOLEAN,
// //       defaultValue: false
// //     },
// //     isPinned: {
// //       type: DataTypes.BOOLEAN,
// //       defaultValue: false
// //     },
// //     isArchived: {
// //       type: DataTypes.BOOLEAN,
// //       defaultValue: false
// //     },
// //     createdBy: {
// //       type: DataTypes.INTEGER,
// //       allowNull: false,
// //       references: {
// //         model: 'Users',
// //         key: 'id'
// //       }
// //     },
// //     scheduledFor: {
// //       type: DataTypes.DATE,
// //       allowNull: true
// //     },
// //     expiresAt: {
// //       type: DataTypes.DATE,
// //       allowNull: true
// //     },
// //     actionLink: {
// //       type: DataTypes.STRING,
// //       allowNull: true
// //     },
// //     actionLabel: {
// //       type: DataTypes.STRING,
// //       allowNull: true
// //     },
// //     metadata: {
// //       type: DataTypes.JSONB,
// //       allowNull: true
// //     }
// //   }, {
// //     sequelize,
// //     modelName: 'Notification',
// //     tableName: 'Notifications'
// //   });

// //   return Notification;
// // };


// 'use strict';
// const { Model } = require('sequelize');

// module.exports = (sequelize, DataTypes) => {
//   class Notification extends Model {
//     static associate(models) {
//       // Use string references – Sequelize resolves them later
//       Notification.belongsTo('Users', {
//         foreignKey: 'userId',
//         as: 'user'
//       });
      
//       Notification.belongsTo('Users', {
//         foreignKey: 'createdBy',
//         as: 'creator' 
//       });
//     }
//   }

//   Notification.init({
//     userId: {
//       type: DataTypes.INTEGER,
//       allowNull: true,
//       references: {
//         model: 'Users',
//         key: 'id'
//       }
//     },
//     title: {
//       type: DataTypes.STRING,
//       allowNull: false
//     },
//     message: {
//       type: DataTypes.TEXT,
//       allowNull: false
//     },
//     type: {
//       type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'announcement', 'reminder'),
//       defaultValue: 'info'
//     },
//     category: {
//       type: DataTypes.ENUM('general', 'academic', 'fee', 'attendance', 'report', 'event', 'system'),
//       defaultValue: 'general'
//     },
//     priority: {
//       type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
//       defaultValue: 'medium'
//     },
//     isRead: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false
//     },
//     isPinned: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false
//     },
//     isArchived: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false
//     },
//     createdBy: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: 'Users',
//         key: 'id'
//       }
//     },
//     scheduledFor: {
//       type: DataTypes.DATE,
//       allowNull: true
//     },
//     expiresAt: {
//       type: DataTypes.DATE,
//       allowNull: true
//     },
//     actionLink: {
//       type: DataTypes.STRING,
//       allowNull: true
//     },
//     actionLabel: {
//       type: DataTypes.STRING,
//       allowNull: true
//     },
//     metadata: {
//       type: DataTypes.JSONB,
//       allowNull: true
//     }
//   }, {
//     sequelize,
//     modelName: 'Notification',
//     tableName: 'Notifications'
//   });

//   return Notification;
// };


// models/Notification.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      // Direct reference – models.Users now exists
      Notification.belongsTo(models.Users, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      Notification.belongsTo(models.Users, {
        foreignKey: 'createdBy',
        as: 'creator' 
      });
    }
  }

  Notification.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'announcement', 'reminder'),
      defaultValue: 'info'
    },
    category: {
      type: DataTypes.ENUM('general', 'academic', 'fee', 'attendance', 'report', 'event', 'system'),
      defaultValue: 'general'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actionLink: {
      type: DataTypes.STRING,
      allowNull: true
    },
    actionLabel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'Notifications'
  });

  return Notification;
};
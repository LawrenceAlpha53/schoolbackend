'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Read all model files
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const modelPath = path.join(__dirname, file);
    try {
      const modelDef = require(modelPath);
      
      // Try to get the model class
      let modelClass;
      if (typeof modelDef === 'function') {
        // It might be a function that returns a model, or a class constructor
        try {
          // Attempt to call it with sequelize and DataTypes (old style)
          modelClass = modelDef(sequelize, Sequelize.DataTypes);
        } catch (err) {
          // If that fails, it's probably a class-based model – use it directly
          modelClass = modelDef;
        }
      } else {
        modelClass = modelDef;
      }

      // Check if it's a valid Sequelize model
      if (modelClass && modelClass.name && typeof modelClass.associate === 'function') {
        // Store by the model's name (e.g., 'Users', 'Teacher')
        db[modelClass.name] = modelClass;
        console.log(`✅ Loaded model: ${modelClass.name}`);
      } else if (modelClass && modelClass.modelName) {
        db[modelClass.modelName] = modelClass;
        console.log(`✅ Loaded model: ${modelClass.modelName}`);
      } else {
        console.warn(`⚠️ Could not load model from file: ${file}`);
        // Still try to add it by filename (fallback)
        const fileName = path.basename(file, '.js');
        if (modelClass && typeof modelClass === 'object') {
          db[fileName] = modelClass;
        }
      }
    } catch (error) {
      console.error(`❌ Error loading model from ${file}:`, error.message);
      console.error(error.stack);
    }
  });

console.log('📋 MODELS FOUND:', Object.keys(db));

// Run associations
Object.keys(db).forEach(modelName => {
  const model = db[modelName];
  if (model && typeof model.associate === 'function') {
    console.log(`🔗 Associating: ${modelName}`);
    try {
      model.associate(db);
    } catch (error) {
      console.error(`❌ Error associating ${modelName}:`, error.message);
    }
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
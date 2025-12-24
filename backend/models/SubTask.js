const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubTask = sequelize.define('SubTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  checklistId: {
    type: DataTypes.INTEGER,
    field: 'checklist_id',
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_completed',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'todo',
    allowNull: false,
    validate: {
      isIn: [['todo', 'in_progress', 'completed']],
    },
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
  },
}, {
  tableName: 'sub_tasks',
});

module.exports = SubTask;


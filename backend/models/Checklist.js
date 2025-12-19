const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Checklist = sequelize.define('Checklist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  taskId: {
    type: DataTypes.INTEGER,
    field: 'task_id',
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
  assignedTo: {
    type: DataTypes.INTEGER,
    field: 'assigned_to',
    allowNull: true,
  },
  groupId: {
    type: DataTypes.INTEGER,
    field: 'group_id',
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
  tableName: 'checklists',
});

module.exports = Checklist;






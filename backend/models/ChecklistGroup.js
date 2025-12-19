const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChecklistGroup = sequelize.define('ChecklistGroup', {
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
  assignedTo: {
    type: DataTypes.INTEGER,
    field: 'assigned_to',
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
  tableName: 'checklist_groups',
});

module.exports = ChecklistGroup;


const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskAssignment = sequelize.define('TaskAssignment', {
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
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id',
    allowNull: false,
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
  tableName: 'task_assignments',
});

module.exports = TaskAssignment;


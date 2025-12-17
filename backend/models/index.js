const sequelize = require('../config/database');
const User = require('./User');
const Task = require('./Task');
const Checklist = require('./Checklist');
const TaskAssignment = require('./TaskAssignment');
const Attachment = require('./Attachment');

// Định nghĩa các quan hệ
Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Task, { foreignKey: 'createdBy', as: 'createdTasks' });

Task.hasMany(Checklist, { foreignKey: 'taskId', as: 'checklists', onDelete: 'CASCADE' });
Checklist.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

Task.belongsToMany(User, {
  through: TaskAssignment,
  foreignKey: 'taskId',
  otherKey: 'userId',
  as: 'assignedUsers',
});
User.belongsToMany(Task, {
  through: TaskAssignment,
  foreignKey: 'userId',
  otherKey: 'taskId',
  as: 'assignedTasks',
});

Task.hasMany(Attachment, { foreignKey: 'taskId', as: 'attachments', onDelete: 'CASCADE' });
Attachment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

module.exports = {
  sequelize,
  User,
  Task,
  Checklist,
  TaskAssignment,
  Attachment,
};


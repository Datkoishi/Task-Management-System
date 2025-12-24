const sequelize = require('../config/database');
const User = require('./User');
const Task = require('./Task');
const Checklist = require('./Checklist');
const ChecklistGroup = require('./ChecklistGroup');
const SubTask = require('./SubTask');
const TaskAssignment = require('./TaskAssignment');
const Attachment = require('./Attachment');
const Team = require('./Team');
const TeamMember = require('./TeamMember');

// Định nghĩa các quan hệ
Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Task, { foreignKey: 'createdBy', as: 'createdTasks' });

Task.hasMany(ChecklistGroup, { foreignKey: 'taskId', as: 'checklistGroups', onDelete: 'CASCADE' });
ChecklistGroup.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
ChecklistGroup.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
User.hasMany(ChecklistGroup, { foreignKey: 'assignedTo', as: 'assignedChecklistGroups' });
ChecklistGroup.hasMany(Checklist, { foreignKey: 'groupId', as: 'checklists', onDelete: 'CASCADE' });
Checklist.belongsTo(ChecklistGroup, { foreignKey: 'groupId', as: 'group' });
Task.hasMany(Checklist, { foreignKey: 'taskId', as: 'checklists', onDelete: 'CASCADE' });
Checklist.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
Checklist.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
User.hasMany(Checklist, { foreignKey: 'assignedTo', as: 'assignedChecklists' });

Checklist.hasMany(SubTask, { foreignKey: 'checklistId', as: 'subTasks', onDelete: 'CASCADE' });
SubTask.belongsTo(Checklist, { foreignKey: 'checklistId', as: 'checklist' });
SubTask.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(SubTask, { foreignKey: 'createdBy', as: 'createdSubTasks' });

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

// Team relationships
Team.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Team, { foreignKey: 'createdBy', as: 'createdTeams' });

Team.belongsToMany(User, {
  through: TeamMember,
  foreignKey: 'teamId',
  otherKey: 'userId',
  as: 'members',
});
User.belongsToMany(Team, {
  through: TeamMember,
  foreignKey: 'userId',
  otherKey: 'teamId',
  as: 'teams',
});

module.exports = {
  sequelize,
  User,
  Task,
  Checklist,
  ChecklistGroup,
  SubTask,
  TaskAssignment,
  Attachment,
  Team,
  TeamMember,
};


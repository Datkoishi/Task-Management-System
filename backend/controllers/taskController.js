const { Task, Checklist, TaskAssignment, Attachment, User } = require('../models');
const { Op } = require('sequelize');

// Hàm cập nhật trạng thái task dựa trên checklist
const updateTaskStatus = async (taskId) => {
  const task = await Task.findByPk(taskId, {
    include: [{ model: Checklist, as: 'checklists' }],
  });

  if (task && task.checklists && task.checklists.length > 0) {
    const allCompleted = task.checklists.every((item) => item.isCompleted);
    const hasInProgress = task.checklists.some((item) => item.isCompleted);

    if (allCompleted) {
      await task.update({ status: 'completed' });
    } else if (hasInProgress) {
      await task.update({ status: 'in_progress' });
    } else {
      await task.update({ status: 'todo' });
    }
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const where = {};

    // Nếu là user thường, chỉ lấy tasks được assign cho họ (không lấy tasks họ tạo vì chỉ admin mới tạo task)
    if (req.user.role === 'user') {
      const assignedTasks = await TaskAssignment.findAll({
        where: { userId: req.user.id },
        attributes: ['taskId'],
      });
      const assignedTaskIds = assignedTasks.map((ta) => ta.taskId);

      if (assignedTaskIds.length > 0) {
        where.id = { [Op.in]: assignedTaskIds };
      } else {
        // Nếu không có task nào được assign, trả về mảng rỗng
        where.id = { [Op.in]: [] };
      }
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Checklist, as: 'checklists' },
        { model: Attachment, as: 'attachments' },
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách nhiệm vụ', error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Checklist, as: 'checklists' },
        { model: Attachment, as: 'attachments' },
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        },
      ],
    });

    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
    }

    // Kiểm tra quyền truy cập - user chỉ có thể xem task được assign cho họ
    if (req.user.role === 'user') {
      const isAssigned = await TaskAssignment.findOne({
        where: { taskId: task.id, userId: req.user.id },
      });
      if (!isAssigned) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập nhiệm vụ này' });
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy thông tin nhiệm vụ', error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    // Chỉ admin mới có thể tạo nhiệm vụ
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ quản trị viên mới có thể tạo nhiệm vụ' });
    }

    const { title, description, priority, status, startDate, dueDate, checklists, assignedUserIds, teamIds, attachments } = req.body;

    const task = await Task.create({
      title,
      description,
      priority: priority || 'medium',
      status: status || 'todo',
      startDate,
      dueDate,
      createdBy: req.user.id,
    });

    // Tạo checklists
    if (checklists && checklists.length > 0) {
      await Checklist.bulkCreate(
        checklists.map((item) => ({
          taskId: task.id,
          title: item.title,
          isCompleted: item.isCompleted || false,
        }))
      );
    }

    // Gán users trực tiếp
    const finalUserIds = new Set(assignedUserIds || []);
    
    // Nếu có teamIds, lấy tất cả members của các teams
    if (teamIds && teamIds.length > 0) {
      for (const teamId of teamIds) {
        const teamMembers = await TeamMember.findAll({
          where: { teamId },
          attributes: ['userId'],
        });
        teamMembers.forEach(member => finalUserIds.add(member.userId));
      }
    }

    // Gán tất cả users (từ assignedUserIds và từ teams)
    if (finalUserIds.size > 0) {
      await TaskAssignment.bulkCreate(
        Array.from(finalUserIds).map((userId) => ({
          taskId: task.id,
          userId,
        }))
      );
    }

    // Tạo attachments
    if (attachments && attachments.length > 0) {
      await Attachment.bulkCreate(
        attachments.map((url) => ({
          taskId: task.id,
          fileUrl: url,
        }))
      );
    }

    const createdTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Checklist, as: 'checklists' },
        { model: Attachment, as: 'attachments' },
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        },
      ],
    });

    res.status(201).json(createdTask);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo nhiệm vụ', error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
    }

    // Kiểm tra quyền - chỉ admin mới có thể chỉnh sửa task, user chỉ có thể update checklist
    if (req.user.role === 'user') {
      // User chỉ có thể cập nhật checklist của task được gán cho họ
      const isAssigned = await TaskAssignment.findOne({
        where: { taskId: task.id, userId: req.user.id },
      });
      if (!isAssigned) {
        return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa nhiệm vụ này' });
      }
      // User chỉ có thể update checklists, không thể update các field khác
      const { checklists } = req.body;
      if (checklists !== undefined) {
        await Checklist.destroy({ where: { taskId: task.id } });
        if (checklists.length > 0) {
          await Checklist.bulkCreate(
            checklists.map((item) => ({
              taskId: task.id,
              title: item.title,
              isCompleted: item.isCompleted || false,
            }))
          );
        }
        await updateTaskStatus(task.id);
      }
      // Lấy lại task sau khi update
      const updatedTask = await Task.findByPk(task.id, {
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          { model: Checklist, as: 'checklists' },
          { model: Attachment, as: 'attachments' },
          {
            model: User,
            as: 'assignedUsers',
            attributes: ['id', 'name', 'email'],
            through: { attributes: [] },
          },
        ],
      });
      return res.json(updatedTask);
    }

    const { title, description, priority, status, startDate, dueDate, checklists, assignedUserIds, teamIds, attachments } = req.body;

    await task.update({
      title,
      description,
      priority,
      status,
      startDate,
      dueDate,
    });

    // Cập nhật checklists
    if (checklists !== undefined) {
      await Checklist.destroy({ where: { taskId: task.id } });
      if (checklists.length > 0) {
        await Checklist.bulkCreate(
          checklists.map((item) => ({
            taskId: task.id,
            title: item.title,
            isCompleted: item.isCompleted || false,
          }))
        );
      }
      // Cập nhật trạng thái tự động
      await updateTaskStatus(task.id);
    }

    // Cập nhật assigned users và teams
    if (assignedUserIds !== undefined || teamIds !== undefined) {
      await TaskAssignment.destroy({ where: { taskId: task.id } });
      
      const finalUserIds = new Set(assignedUserIds || []);
      
      // Nếu có teamIds, lấy tất cả members của các teams
      if (teamIds && teamIds.length > 0) {
        for (const teamId of teamIds) {
          const teamMembers = await TeamMember.findAll({
            where: { teamId },
            attributes: ['userId'],
          });
          teamMembers.forEach(member => finalUserIds.add(member.userId));
        }
      }

      // Gán tất cả users
      if (finalUserIds.size > 0) {
        await TaskAssignment.bulkCreate(
          Array.from(finalUserIds).map((userId) => ({
            taskId: task.id,
            userId,
          }))
        );
      }
    }

    // Cập nhật attachments
    if (attachments !== undefined) {
      await Attachment.destroy({ where: { taskId: task.id } });
      if (attachments.length > 0) {
        await Attachment.bulkCreate(
          attachments.map((url) => ({
            taskId: task.id,
            fileUrl: url,
          }))
        );
      }
    }

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Checklist, as: 'checklists' },
        { model: Attachment, as: 'attachments' },
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        },
      ],
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật nhiệm vụ', error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    // Chỉ admin mới có thể xóa nhiệm vụ
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ quản trị viên mới có thể xóa nhiệm vụ' });
    }

    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
    }

    await task.destroy();
    res.json({ message: 'Xóa nhiệm vụ thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa nhiệm vụ', error: error.message });
  }
};

exports.updateChecklist = async (req, res) => {
  try {
    const { taskId, checklistId } = req.params;
    const { isCompleted } = req.body;

    const checklist = await Checklist.findByPk(checklistId);
    if (!checklist || checklist.taskId !== parseInt(taskId)) {
      return res.status(404).json({ message: 'Không tìm thấy checklist' });
    }

    await checklist.update({ isCompleted });
    await updateTaskStatus(taskId);

    const task = await Task.findByPk(taskId, {
      include: [{ model: Checklist, as: 'checklists' }],
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật checklist', error: error.message });
  }
};

exports.getTaskStats = async (req, res) => {
  try {
    const where = {};
    // User chỉ thấy tasks được assign cho họ
    if (req.user.role === 'user') {
      const assignedTasks = await TaskAssignment.findAll({
        where: { userId: req.user.id },
        attributes: ['taskId'],
      });
      const assignedTaskIds = assignedTasks.map((ta) => ta.taskId);

      if (assignedTaskIds.length > 0) {
        where.id = { [Op.in]: assignedTaskIds };
      } else {
        // Nếu không có task nào được assign, trả về 0
        where.id = { [Op.in]: [] };
      }
    }

    const total = await Task.count({ where });
    const todo = await Task.count({ where: { ...where, status: 'todo' } });
    const inProgress = await Task.count({ where: { ...where, status: 'in_progress' } });
    const completed = await Task.count({ where: { ...where, status: 'completed' } });

    // Nhiệm vụ quá hạn
    const overdue = await Task.count({
      where: {
        ...where,
        dueDate: { [Op.lt]: new Date() },
        status: { [Op.ne]: 'completed' },
      },
    });

    res.json({
      total,
      todo,
      inProgress,
      completed,
      overdue,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy thống kê', error: error.message });
  }
};


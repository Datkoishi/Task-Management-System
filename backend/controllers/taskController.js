const { Task, Checklist, ChecklistGroup, TaskAssignment, Attachment, User, TeamMember } = require('../models');
const { Op } = require('sequelize');

// Hàm cập nhật trạng thái task dựa trên checklist
const updateTaskStatus = async (taskId) => {
  const task = await Task.findByPk(taskId, {
    include: [
      { model: Checklist, as: 'checklists' },
      { 
        model: ChecklistGroup, 
        as: 'checklistGroups',
        include: [{ model: Checklist, as: 'checklists' }]
      }
    ],
  });

  let allChecklists = [];
  
  // Lấy checklists từ groups
  if (task && task.checklistGroups && task.checklistGroups.length > 0) {
    task.checklistGroups.forEach((group) => {
      if (group.checklists && group.checklists.length > 0) {
        allChecklists = allChecklists.concat(group.checklists);
      }
    });
  }
  
  // Lấy checklists phẳng
  if (task && task.checklists && task.checklists.length > 0) {
    allChecklists = allChecklists.concat(task.checklists);
  }

  if (allChecklists.length > 0) {
    const allCompleted = allChecklists.every((item) => item.status === 'completed' || item.isCompleted);
    const hasInProgress = allChecklists.some((item) => item.status === 'in_progress');
    const hasCompleted = allChecklists.some((item) => item.status === 'completed' || item.isCompleted);

    if (allCompleted) {
      await task.update({ status: 'completed' });
    } else if (hasInProgress || hasCompleted) {
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
        { 
          model: Checklist, 
          as: 'checklists',
          include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }]
        },
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
        { 
          model: ChecklistGroup, 
          as: 'checklistGroups',
          include: [
            { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
            {
              model: Checklist,
              as: 'checklists',
              include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }]
            }
          ]
        },
        { 
          model: Checklist, 
          as: 'checklists',
          where: { groupId: null },
          required: false,
          include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }]
        },
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

    const { title, description, priority, status, startDate, dueDate, checklists, checklistGroups, assignedUserIds, teamIds, attachments } = req.body;

    const task = await Task.create({
      title,
      description,
      priority: priority || 'medium',
      status: status || 'todo',
      startDate,
      dueDate,
      createdBy: req.user.id,
    });

    // Tạo checklist groups (cách mới)
    if (checklistGroups && checklistGroups.length > 0) {
      for (const group of checklistGroups) {
        if (group.title && group.title.trim()) {
          const checklistGroup = await ChecklistGroup.create({
            taskId: task.id,
            title: group.title,
            assignedTo: group.assignedTo || null,
          });

          // Tạo checklist items trong group
          if (group.items && group.items.length > 0) {
            await Checklist.bulkCreate(
              group.items
                .filter((item) => item.title && item.title.trim())
                .map((item) => ({
                  taskId: task.id,
                  groupId: checklistGroup.id,
                  title: item.title,
                  isCompleted: item.isCompleted || false,
                  assignedTo: item.assignedTo || null,
                }))
            );
          }
        }
      }
    } else if (checklists && checklists.length > 0) {
      // Backward compatible: tạo checklists phẳng (không có group)
      await Checklist.bulkCreate(
        checklists
          .filter((item) => item.title && item.title.trim())
          .map((item) => ({
            taskId: task.id,
            title: item.title,
            isCompleted: item.status === 'completed' || item.isCompleted || false,
            status: item.status || 'todo',
            assignedTo: item.assignedTo || null,
            groupId: null,
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
        { 
          model: ChecklistGroup, 
          as: 'checklistGroups',
          include: [
            { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
            {
              model: Checklist,
              as: 'checklists',
              include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }]
            }
          ]
        },
        { 
          model: Checklist, 
          as: 'checklists',
          where: { groupId: null },
          required: false,
          include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }]
        },
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
              assignedTo: item.assignedTo || null,
            }))
          );
        }
        await updateTaskStatus(task.id);
      }
      // Lấy lại task sau khi update
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { 
          model: ChecklistGroup, 
          as: 'checklistGroups',
          include: [
            { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
            {
              model: Checklist,
              as: 'checklists',
              include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }]
            }
          ]
        },
        { 
          model: Checklist, 
          as: 'checklists',
          where: { groupId: null },
          required: false,
          include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }]
        },
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

    const { title, description, priority, status, startDate, dueDate, checklists, checklistGroups, assignedUserIds, teamIds, attachments } = req.body;

    await task.update({
      title,
      description,
      priority,
      status,
      startDate,
      dueDate,
    });

    // Cập nhật checklist groups (cách mới)
    if (checklistGroups !== undefined) {
      // Xóa tất cả checklist groups và items cũ
      await ChecklistGroup.destroy({ where: { taskId: task.id } });
      await Checklist.destroy({ where: { taskId: task.id } });

      // Tạo lại checklist groups và items
      if (checklistGroups.length > 0) {
        for (const group of checklistGroups) {
          if (group.title && group.title.trim()) {
            const checklistGroup = await ChecklistGroup.create({
              taskId: task.id,
              title: group.title,
              assignedTo: group.assignedTo || null,
            });

            // Tạo checklist items trong group
            if (group.items && group.items.length > 0) {
              await Checklist.bulkCreate(
                group.items
                  .filter((item) => item.title && item.title.trim())
                  .map((item) => ({
                    taskId: task.id,
                    groupId: checklistGroup.id,
                    title: item.title,
                    isCompleted: item.status === 'completed' || item.isCompleted || false,
                    status: item.status || 'todo',
                    assignedTo: item.assignedTo || null,
                  }))
              );
            }
          }
        }
      }
      await updateTaskStatus(task.id);
    } else if (checklists !== undefined) {
      // Backward compatible: cập nhật checklists phẳng
      await Checklist.destroy({ where: { taskId: task.id, groupId: null } });
      if (checklists.length > 0) {
        await Checklist.bulkCreate(
          checklists
            .filter((item) => item.title && item.title.trim())
            .map((item) => ({
              taskId: task.id,
              title: item.title,
              isCompleted: item.status === 'completed' || item.isCompleted || false,
              status: item.status || 'todo',
              assignedTo: item.assignedTo || null,
              groupId: null,
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
        { 
          model: Checklist, 
          as: 'checklists',
          include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }]
        },
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
    const { status, isCompleted } = req.body;

    const checklist = await Checklist.findByPk(checklistId, {
      include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }],
    });
    
    if (!checklist || checklist.taskId !== parseInt(taskId)) {
      return res.status(404).json({ message: 'Không tìm thấy checklist' });
    }

    // Kiểm tra quyền: chỉ người được gán mới có thể cập nhật status
    // Admin có thể cập nhật bất kỳ checklist nào
    if (req.user.role !== 'admin') {
      if (checklist.assignedTo && checklist.assignedTo !== req.user.id) {
        return res.status(403).json({ 
          message: 'Chỉ người được gán mới có thể cập nhật checklist này' 
        });
      }
    }

    // Cập nhật status (ưu tiên) hoặc isCompleted (backward compatible)
    const updateData = {};
    if (status !== undefined) {
      // Validate status
      if (!['todo', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Status không hợp lệ. Phải là: todo, in_progress, hoặc completed' });
      }
      updateData.status = status;
    } else if (isCompleted !== undefined) {
      // Backward compatible: nếu chỉ có isCompleted, chuyển đổi sang status
      updateData.status = isCompleted ? 'completed' : 'todo';
    }

    await checklist.update(updateData);
    await updateTaskStatus(taskId);

    // Lấy lại task với đầy đủ thông tin
    const task = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { 
          model: ChecklistGroup, 
          as: 'checklistGroups',
          include: [
            { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
            {
              model: Checklist,
              as: 'checklists',
              include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }]
            }
          ]
        },
        { 
          model: Checklist, 
          as: 'checklists',
          where: { groupId: null },
          required: false,
          include: [{ model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }]
        },
        { model: Attachment, as: 'attachments' },
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        },
      ],
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


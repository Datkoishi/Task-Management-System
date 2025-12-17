const { User, Task, TaskAssignment } = require('../models');
const { Op } = require('sequelize');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách người dùng', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Task, as: 'createdTasks' },
        {
          model: Task,
          as: 'assignedTasks',
          through: { attributes: [] },
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy thông tin người dùng', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const { name, email, role } = req.body;
    await user.update({ name, email, role });

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật người dùng', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Không thể xóa chính mình' });
    }

    await user.destroy();
    res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa người dùng', error: error.message });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
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


const { Team, User, TeamMember } = require('../models');
const { Op } = require('sequelize');

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách teams', error: error.message });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        },
      ],
    });

    if (!team) {
      return res.status(404).json({ message: 'Không tìm thấy team' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy thông tin team', error: error.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;

    const team = await Team.create({
      name,
      description,
      createdBy: req.user.id,
    });

    // Thêm members vào team
    if (memberIds && memberIds.length > 0) {
      await TeamMember.bulkCreate(
        memberIds.map((userId) => ({
          teamId: team.id,
          userId,
        }))
      );
    }

    const createdTeam = await Team.findByPk(team.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        },
      ],
    });

    res.status(201).json(createdTeam);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo team', error: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Không tìm thấy team' });
    }

    const { name, description, memberIds } = req.body;

    await team.update({
      name,
      description,
    });

    // Cập nhật members
    if (memberIds !== undefined) {
      await TeamMember.destroy({ where: { teamId: team.id } });
      if (memberIds.length > 0) {
        await TeamMember.bulkCreate(
          memberIds.map((userId) => ({
            teamId: team.id,
            userId,
          }))
        );
      }
    }

    const updatedTeam = await Team.findByPk(team.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        },
      ],
    });

    res.json(updatedTeam);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật team', error: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Không tìm thấy team' });
    }

    await team.destroy();
    res.json({ message: 'Xóa team thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa team', error: error.message });
  }
};










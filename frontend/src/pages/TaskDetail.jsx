import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { format, differenceInDays, differenceInHours, isPast, isToday, isTomorrow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(id === 'new');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    startDate: '',
    dueDate: '',
        checklistGroups: [{ title: '', assignedToIds: [], items: [{ title: '', status: 'todo', isCompleted: false, assignedToIds: [] }] }],
        checklists: [{ title: '', status: 'todo', isCompleted: false, assignedToIds: [] }], // Backward compatible
        assignedUserIds: [],
        teamIds: [],
        attachments: [],
  });
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newAttachment, setNewAttachment] = useState('');
  const [newChecklist, setNewChecklist] = useState('');
  const [newChecklistGroup, setNewChecklistGroup] = useState('');

  useEffect(() => {
    if (id === 'new') {
      // All users can create tasks
      setLoading(false);
      fetchUsers();
    } else {
      fetchTask();
    }
  }, [id, user]);

  const fetchUsers = async () => {
    try {
      // All users can get user list to assign to tasks
        const [usersRes, teamsRes] = await Promise.all([
        api.get('/auth/users'), // Endpoint mới cho tất cả user
        api.get('/teams').catch(() => ({ data: [] })), // Teams có thể không có quyền truy cập
        ]);
        setUsers(usersRes.data);
      if (teamsRes?.data) {
        setTeams(teamsRes.data);
      }
    } catch (error) {
      console.error('Error loading users/teams:', error);
      // Nếu không lấy được teams, vẫn tiếp tục với users
      try {
        const usersRes = await api.get('/auth/users');
        setUsers(usersRes.data);
      } catch (err) {
        console.error('Error loading users:', err);
      }
    }
  };

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      const taskData = res.data;
      setTask(taskData);

      setFormData({
        title: taskData.title || '',
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        status: taskData.status || 'todo',
        startDate: taskData.startDate ? format(new Date(taskData.startDate), 'yyyy-MM-dd') : '',
        dueDate: taskData.dueDate ? format(new Date(taskData.dueDate), 'yyyy-MM-dd') : '',
            checklistGroups: taskData.checklistGroups && taskData.checklistGroups.length > 0
          ? taskData.checklistGroups.map((g) => ({
              title: g.title,
              assignedToIds: g.assignedTo ? [g.assignedTo] : [],
              items: g.checklists ? g.checklists.map((c) => ({
                title: c.title,
                status: c.status || (c.isCompleted ? 'completed' : 'todo'),
                isCompleted: c.isCompleted,
                assignedToIds: c.assignedTo ? [c.assignedTo] : []
              })) : []
            }))
          : [{ title: '', assignedToIds: [], items: [{ title: '', isCompleted: false, assignedToIds: [] }] }],
        checklists: taskData.checklists && taskData.checklists.length > 0
          ? taskData.checklists.map((c) => ({ 
              title: c.title, 
              isCompleted: c.isCompleted,
              assignedToIds: c.assignedTo ? [c.assignedTo] : []
            }))
          : [{ title: '', isCompleted: false, assignedTo: null }],
        assignedUserIds: taskData.assignedUsers ? taskData.assignedUsers.map((u) => u.id) : [],
        teamIds: [], // Teams sẽ được xác định từ assignedUsers nếu cần, hoặc để trống để admin chọn lại
        attachments: taskData.attachments ? taskData.attachments.map((a) => a.fileUrl) : [],
      });

      fetchUsers();
    } catch (error) {
      console.error('Error loading task:', error);
      alert('Unable to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e, createAnother = false) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        checklistGroups: formData.checklistGroups
          .filter((g) => g.title.trim() !== '')
          .map((g) => ({
            title: g.title,
            assignedTo: g.assignedToIds && g.assignedToIds.length > 0 ? g.assignedToIds[0] : null,
            items: g.items.filter((item) => item.title.trim() !== '').map((item) => ({
              title: item.title,
              status: item.status || 'todo',
              isCompleted: item.isCompleted || false,
              assignedTo: item.assignedToIds && item.assignedToIds.length > 0 ? item.assignedToIds[0] : null,
            })),
          }))
          .filter((g) => g.items.length > 0),
        checklists: formData.checklists.filter((c) => c.title.trim() !== ''),
        assignedUserIds: formData.assignedUserIds,
        teamIds: formData.teamIds,
        attachments: formData.attachments.filter((a) => a.trim() !== ''),
      };

      if (id === 'new') {
        await api.post('/tasks', data);
        if (createAnother) {
          // Reset form và ở lại trang tạo mới
          setFormData({
            title: '',
            description: '',
            priority: 'medium',
            status: 'todo',
            startDate: '',
            dueDate: '',
            checklistGroups: [{ title: '', assignedToIds: [], items: [{ title: '', status: 'todo', isCompleted: false, assignedToIds: [] }] }],
            checklists: [{ title: '', status: 'todo', isCompleted: false, assignedToIds: [] }],
            assignedUserIds: [],
            teamIds: [],
            attachments: [],
          });
          setNewChecklistGroup('');
          setNewChecklist('');
          setNewAttachment('');
          // Scroll to top
          window.scrollTo(0, 0);
        } else {
        navigate('/tasks');
        }
      } else {
        await api.put(`/tasks/${id}`, data);
        setEditing(false);
        fetchTask();
      }
    } catch (error) {
      alert('Error saving task: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleChecklistStatusChange = async (checklistId, newStatus) => {
    if (!checklistId) {
      console.error('Checklist ID không tồn tại');
      return;
    }
    try {
      await api.put(`/tasks/${id}/checklists/${checklistId}`, { status: newStatus });
      fetchTask();
    } catch (error) {
      console.error('Error updating checklist:', error);
      alert('Error updating checklist: ' + (error.response?.data?.message || error.message));
    }
  };

  const [newSubTaskTitle, setNewSubTaskTitle] = useState({});

  const handleCreateSubTask = async (checklistId, title) => {
    if (!title || !title.trim()) {
      alert('Vui lòng nhập tên sub-task');
      return;
    }
    try {
      await api.post(`/tasks/checklists/${checklistId}/sub-tasks`, { 
        title: title.trim(),
        status: 'todo'
      });
      setNewSubTaskTitle({ ...newSubTaskTitle, [checklistId]: '' });
      fetchTask();
    } catch (error) {
      console.error('Error creating sub-task:', error);
      alert('Error creating sub-task: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateSubTask = async (subTaskId, status) => {
    try {
      await api.put(`/tasks/sub-tasks/${subTaskId}`, { status });
      fetchTask();
    } catch (error) {
      console.error('Error updating sub-task:', error);
      alert('Error updating sub-task: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteSubTask = async (subTaskId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sub-task này?')) {
      return;
    }
    try {
      await api.delete(`/tasks/sub-tasks/${subTaskId}`);
      fetchTask();
    } catch (error) {
      console.error('Error deleting sub-task:', error);
      alert('Error deleting sub-task: ' + (error.response?.data?.message || error.message));
    }
  };

  const addChecklistGroup = () => {
    if (newChecklistGroup.trim()) {
      setFormData({
        ...formData,
        checklistGroups: [...formData.checklistGroups, { 
          title: newChecklistGroup,
          assignedTo: null,
          items: [{ title: '', status: 'todo', isCompleted: false, assignedTo: null }] 
        }],
      });
      setNewChecklistGroup('');
    }
  };

  const removeChecklistGroup = (groupIndex) => {
    setFormData({
      ...formData,
      checklistGroups: formData.checklistGroups.filter((_, i) => i !== groupIndex),
    });
  };

  const addChecklistItem = (groupIndex) => {
    const newGroups = [...formData.checklistGroups];
    newGroups[groupIndex].items.push({ title: '', status: 'todo', isCompleted: false, assignedTo: null });
    setFormData({ ...formData, checklistGroups: newGroups });
  };

  const removeChecklistItem = (groupIndex, itemIndex) => {
    const newGroups = [...formData.checklistGroups];
    newGroups[groupIndex].items = newGroups[groupIndex].items.filter((_, i) => i !== itemIndex);
    setFormData({ ...formData, checklistGroups: newGroups });
  };

  const addChecklist = () => {
    if (newChecklist.trim()) {
      setFormData({
        ...formData,
        checklists: [...formData.checklists, { title: newChecklist, status: 'todo', isCompleted: false, assignedTo: null }],
      });
      setNewChecklist('');
    }
  };

  const removeChecklist = (index) => {
    setFormData({
      ...formData,
      checklists: formData.checklists.filter((_, i) => i !== index),
    });
  };

  const addAttachment = () => {
    if (newAttachment.trim()) {
      setFormData({
        ...formData,
        attachments: [...formData.attachments, newAttachment.trim()],
      });
      setNewAttachment('');
    }
  };

  const removeAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index),
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'todo':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'todo':
        return 'Not Started';
      default:
        return status;
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return priority;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center">
          <Link
            to="/tasks"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            title="Quay lại danh sách tasks"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Quay lại</span>
          </Link>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 font-medium">Loading task information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!editing && !task) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center">
          <Link
            to="/tasks"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            title="Quay lại danh sách tasks"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Quay lại</span>
          </Link>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-12">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Task Not Found</h3>
              <p className="text-gray-600 mb-4">The task you are looking for does not exist or has been deleted.</p>
              <Link
                to="/tasks"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Back to List
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link 
            to={id === 'new' ? "/tasks" : `/tasks/${id}`}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg font-medium"
            title={id === 'new' ? "Quay lại danh sách tasks" : "Hủy chỉnh sửa"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{id === 'new' ? 'Quay lại' : 'Hủy'}</span>
          </Link>
          {id === 'new' && (
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-8 space-y-8 border border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Enter detailed description of the task"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {id !== 'new' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="todo">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {(user?.role === 'admin' || (id === 'new') || (task && task.creator && task.creator.id === user?.id)) && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Select Team
                  </label>
                  {teams.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.teamIds.length === teams.length) {
                          setFormData({ ...formData, teamIds: [] });
                        } else {
                          setFormData({ ...formData, teamIds: teams.map((t) => t.id) });
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {formData.teamIds.length === teams.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                  {teams.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No teams yet</p>
                  ) : (
                    <div className="space-y-2">
                      {teams.map((team) => (
                        <label
                          key={team.id}
                          className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.teamIds.includes(team.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  teamIds: [...formData.teamIds, team.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  teamIds: formData.teamIds.filter((id) => id !== team.id),
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{team.name}</p>
                            <p className="text-xs text-gray-500">
                              {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}
                              {team.description && ` • ${team.description}`}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Selected: {formData.teamIds.length} team{formData.teamIds.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Or Assign to Specific Users
                  </label>
                  {users.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.assignedUserIds.length === users.length) {
                          setFormData({ ...formData, assignedUserIds: [] });
                        } else {
                          setFormData({ ...formData, assignedUserIds: users.map((u) => u.id) });
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {formData.assignedUserIds.length === users.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                  {users.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No users yet</p>
                  ) : (
                    <div className="space-y-2">
                      {users.map((u) => (
                        <label
                          key={u.id}
                          className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.assignedUserIds.includes(u.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  assignedUserIds: [...formData.assignedUserIds, u.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  assignedUserIds: formData.assignedUserIds.filter((id) => id !== u.id),
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 font-semibold text-xs">
                                  {u.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{u.name}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Selected: {formData.assignedUserIds.length} user{formData.assignedUserIds.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Checklist Groups
            </label>
            <div className="space-y-4">
              {formData.checklistGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="text"
                      value={group.title}
                    onChange={(e) => {
                        const newGroups = [...formData.checklistGroups];
                        newGroups[groupIndex].title = e.target.value;
                        setFormData({ ...formData, checklistGroups: newGroups });
                      }}
                      placeholder="Checklist group name"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <div className="relative min-w-[200px]">
                      <div className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white cursor-pointer hover:border-blue-500 transition-colors" onClick={() => {
                        const newGroups = [...formData.checklistGroups];
                        newGroups[groupIndex].showAssigneeDropdown = !newGroups[groupIndex].showAssigneeDropdown;
                        setFormData({ ...formData, checklistGroups: newGroups });
                      }}>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">
                            {group.assignedToIds && group.assignedToIds.length > 0 
                              ? `${group.assignedToIds.length} người được chọn`
                              : 'Chọn người được gán'}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {group.showAssigneeDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {((id === 'new' || formData.assignedUserIds.length > 0) 
                              ? (id === 'new' ? users : users.filter(u => formData.assignedUserIds.includes(u.id)))
                              : (task?.assignedUsers || [])
                            ).map((u) => (
                              <label key={u.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={group.assignedToIds?.includes(u.id) || false}
                                  onChange={(e) => {
                                    const newGroups = [...formData.checklistGroups];
                                    if (!newGroups[groupIndex].assignedToIds) {
                                      newGroups[groupIndex].assignedToIds = [];
                                    }
                                    if (e.target.checked) {
                                      newGroups[groupIndex].assignedToIds = [...newGroups[groupIndex].assignedToIds, u.id];
                                    } else {
                                      newGroups[groupIndex].assignedToIds = newGroups[groupIndex].assignedToIds.filter(id => id !== u.id);
                                    }
                                    setFormData({ ...formData, checklistGroups: newGroups });
                                  }}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{u.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {formData.checklistGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChecklistGroup(groupIndex)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete this group"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 ml-4">
                    {group.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start space-x-3">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const newGroups = [...formData.checklistGroups];
                            newGroups[groupIndex].items[itemIndex].title = e.target.value;
                            setFormData({ ...formData, checklistGroups: newGroups });
                    }}
                    placeholder="Enter checklist item"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                        <select
                          value={item.status || 'todo'}
                          onChange={(e) => {
                            const newGroups = [...formData.checklistGroups];
                            newGroups[groupIndex].items[itemIndex].status = e.target.value;
                            newGroups[groupIndex].items[itemIndex].isCompleted = e.target.value === 'completed';
                            setFormData({ ...formData, checklistGroups: newGroups });
                          }}
                          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[130px]"
                        >
                          <option value="todo">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <div className="relative min-w-[200px]">
                          <div className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white cursor-pointer hover:border-blue-500 transition-colors" onClick={() => {
                            const newGroups = [...formData.checklistGroups];
                            if (!newGroups[groupIndex].items[itemIndex].showAssigneeDropdown) {
                              newGroups[groupIndex].items[itemIndex].showAssigneeDropdown = true;
                            } else {
                              newGroups[groupIndex].items[itemIndex].showAssigneeDropdown = false;
                            }
                            setFormData({ ...formData, checklistGroups: newGroups });
                          }}>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700">
                                {item.assignedToIds && item.assignedToIds.length > 0 
                                  ? `${item.assignedToIds.length} người được chọn`
                                  : 'Chọn người được gán'}
                              </span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          {item.showAssigneeDropdown && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              <div className="p-2 space-y-1">
                                {((id === 'new' || formData.assignedUserIds.length > 0) 
                                  ? (id === 'new' ? users : users.filter(u => formData.assignedUserIds.includes(u.id)))
                                  : (task?.assignedUsers || [])
                                ).map((u) => (
                                  <label key={u.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.assignedToIds?.includes(u.id) || false}
                                      onChange={(e) => {
                                        const newGroups = [...formData.checklistGroups];
                                        if (!newGroups[groupIndex].items[itemIndex].assignedToIds) {
                                          newGroups[groupIndex].items[itemIndex].assignedToIds = [];
                                        }
                                        if (e.target.checked) {
                                          newGroups[groupIndex].items[itemIndex].assignedToIds = [...newGroups[groupIndex].items[itemIndex].assignedToIds, u.id];
                                        } else {
                                          newGroups[groupIndex].items[itemIndex].assignedToIds = newGroups[groupIndex].items[itemIndex].assignedToIds.filter(id => id !== u.id);
                                        }
                                        setFormData({ ...formData, checklistGroups: newGroups });
                                      }}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{u.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {group.items.length > 1 && (
                    <button
                      type="button"
                            onClick={() => removeChecklistItem(groupIndex, itemIndex)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete this item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addChecklistItem(groupIndex)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                    >
                      <span>+</span>
                      <span>Add item to this group</span>
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newChecklistGroup}
                  onChange={(e) => setNewChecklistGroup(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistGroup())}
                  placeholder="New checklist group name"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button 
                  type="button" 
                  onClick={addChecklistGroup} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                  Add Group
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Attachments
            </label>
            <div className="space-y-3">
              {formData.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <a
                    href={attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-blue-600 hover:text-blue-800 hover:underline truncate text-sm"
                  >
                    {attachment}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete this link"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-3">
                <input
                  type="url"
                  value={newAttachment}
                  onChange={(e) => setNewAttachment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttachment())}
                  placeholder="https://example.com"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button 
                  type="button" 
                  onClick={addAttachment} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <Link
              to="/tasks"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium text-sm transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-sm transition-colors shadow-sm hover:shadow-md"
            >
              {id === 'new' ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // View mode - Tính toán progress bao gồm cả checklist groups và checklists phẳng
  let completedCount = 0;
  let totalCount = 0;
  
  // Đếm từ checklist groups
  if (task.checklistGroups && task.checklistGroups.length > 0) {
    task.checklistGroups.forEach((group) => {
      if (group.checklists && group.checklists.length > 0) {
        group.checklists.forEach((item) => {
          totalCount++;
          // Sử dụng status thay vì isCompleted
          const itemStatus = item.status || (item.isCompleted ? 'completed' : 'todo');
          if (itemStatus === 'completed') completedCount++;
        });
      }
    });
  }
  
  // Đếm từ checklists phẳng (backward compatible)
  if (task.checklists && task.checklists.length > 0) {
    task.checklists.forEach((checklist) => {
      totalCount++;
      // Sử dụng status thay vì isCompleted
      const checklistStatus = checklist.status || (checklist.isCompleted ? 'completed' : 'todo');
      if (checklistStatus === 'completed') completedCount++;
    });
  }
  
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Calculate time stats
  const getTimeStats = () => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysLeft = differenceInDays(dueDate, now);
    const hoursLeft = differenceInHours(dueDate, now);
    const isOverdue = isPast(dueDate) && task.status !== 'completed';
    const isDueToday = isToday(dueDate);
    const isDueTomorrow = isTomorrow(dueDate);

    return {
      daysLeft,
      hoursLeft,
      isOverdue,
      isDueToday,
      isDueTomorrow,
    };
  };

  const getDurationStats = () => {
    if (!task.startDate || !task.dueDate) return null;
    const start = new Date(task.startDate);
    const due = new Date(task.dueDate);
    const now = new Date();
    const totalDays = differenceInDays(due, start);
    const daysPassed = differenceInDays(now, start);
    const daysRemaining = differenceInDays(due, now);
    const progressDays = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

    return {
      totalDays,
      daysPassed,
      daysRemaining,
      progressDays: Math.min(100, Math.max(0, progressDays)),
    };
  };

  const timeStats = getTimeStats();
  const durationStats = getDurationStats();

  // Get day name and month name
  const getDueDateInfo = () => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      dayName: dayNames[dueDate.getDay()],
      monthName: monthNames[dueDate.getMonth()],
      day: dueDate.getDate(),
      year: dueDate.getFullYear(),
    };
  };

  const dueDateInfo = getDueDateInfo();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-4 md:mb-0 flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <Link 
                to="/tasks" 
                className="inline-flex items-center space-x-2 text-white hover:text-white transition-colors font-semibold"
                title="Quay lại danh sách tasks"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Quay lại</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
            <p className="text-purple-100 text-lg">
              {task.description ? task.description.substring(0, 100) + (task.description.length > 100 ? '...' : '') : 'No description'}
            </p>
          </div>
          <div className="flex space-x-3">
            {(user?.role === 'admin' || (task && task.creator && task.creator.id === user?.id)) && (
              <button
                onClick={() => setEditing(true)}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-200 flex items-center space-x-2 transform hover:scale-105 hover:shadow-md active:scale-95"
              >
                <span>✏️</span>
                <span>Edit Task</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
        {/* Due Date Countdown */}
        {timeStats && (
          <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 transform transition-all duration-300 hover:scale-105 hover:shadow-lg ${
            timeStats.isOverdue 
              ? 'border-red-500' 
              : timeStats.isDueToday 
              ? 'border-orange-500'
              : timeStats.isDueTomorrow
              ? 'border-yellow-500'
              : 'border-blue-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Due Date</p>
                {timeStats.isOverdue ? (
                  <>
                    <p className="text-3xl font-bold text-gray-900">
                      {Math.abs(timeStats.daysLeft)}
                    </p>
                    <p className="text-xs text-red-600 mt-1">Days Overdue</p>
                  </>
                ) : timeStats.isDueToday ? (
                  <>
                    <p className="text-3xl font-bold text-gray-900">
                      {timeStats.hoursLeft}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">Hours Remaining</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900">
                      {timeStats.daysLeft}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Days Left</p>
                  </>
                )}
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                timeStats.isOverdue 
                  ? 'bg-red-100' 
                  : timeStats.isDueToday 
                  ? 'bg-orange-100'
                  : timeStats.isDueTomorrow
                  ? 'bg-yellow-100'
                  : 'bg-blue-100'
              } transform transition-all duration-300 hover:scale-110 hover:rotate-3`}>
                <span className="text-2xl">
                  {timeStats.isOverdue ? '⚠️' : timeStats.isDueToday ? '⏰' : '📅'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Stats */}
        {durationStats && (
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Time Progress</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(durationStats.progressDays)}%
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {durationStats.daysPassed}/{durationStats.totalDays} days
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:rotate-3">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
        )}

        {/* Checklist Progress */}
        {totalCount > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Checklist</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(progressPercent)}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {completedCount}/{totalCount} completed
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:rotate-3">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-lg">
        {/* Status and Priority Section */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                <span className={`px-3 py-1.5 inline-flex text-sm font-semibold rounded-full transition-all duration-200 hover:scale-105 ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Priority Level</p>
                <p className="text-sm font-semibold text-gray-900">{getPriorityText(task.priority)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dates Section with Calendar View */}
        {(task.startDate || task.dueDate) && (
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {task.startDate && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">{format(new Date(task.startDate), 'dd/MM/yyyy')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(task.startDate).toLocaleDateString('en-US', { weekday: 'long' })}
                    </p>
                  </div>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                      timeStats?.isOverdue 
                        ? 'bg-red-100' 
                        : timeStats?.isDueToday 
                        ? 'bg-orange-100'
                        : 'bg-blue-100'
                    }`}>
                      <span className={`text-xs font-semibold ${
                        timeStats?.isOverdue 
                          ? 'text-red-600' 
                          : timeStats?.isDueToday 
                          ? 'text-orange-600'
                          : 'text-blue-600'
                      }`}>
                        {dueDateInfo?.monthName}
                      </span>
                      <span className={`text-lg font-bold ${
                        timeStats?.isOverdue 
                          ? 'text-red-700' 
                          : timeStats?.isDueToday 
                          ? 'text-orange-700'
                          : 'text-blue-700'
                      }`}>
                        {dueDateInfo?.day}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Due Date</p>
                    <p className="text-sm font-medium text-gray-900">{format(new Date(task.dueDate), 'dd/MM/yyyy')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {dueDateInfo?.dayName}
                      {timeStats?.isOverdue && <span className="text-red-600 font-semibold ml-2">• Overdue</span>}
                      {timeStats?.isDueToday && <span className="text-orange-600 font-semibold ml-2">• Today</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description Section */}
        {task.description && (
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Assigned Users Section */}
        {task.assignedUsers && task.assignedUsers.length > 0 && (
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assigned To</p>
                <div className="flex flex-wrap gap-2">
                  {task.assignedUsers.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 transition-all duration-200 hover:bg-blue-200 hover:scale-105"
                    >
                      {u.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Attachments Section */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Attachments</p>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 hover:underline p-2 rounded-lg hover:bg-blue-50 transition-colors group"
                    >
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="truncate">{attachment.fileUrl}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline & Metadata Section */}
        <div className="px-8 py-6 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Details</p>
          <div className="space-y-3">
            {task.creator && (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Created by: </span>
                  <span className="text-sm font-medium text-gray-900">{task.creator.name}</span>
                  {task.creator.email && (
                    <span className="text-xs text-gray-500 ml-2">({task.creator.email})</span>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-500">Created at: </span>
                <span className="text-sm font-medium text-gray-900">
                  {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm')}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({new Date(task.createdAt).toLocaleDateString('en-US', { weekday: 'long' })})
                </span>
              </div>
            </div>
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Last updated: </span>
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(task.updatedAt), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              </div>
            )}
            {durationStats && (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Duration: </span>
                  <span className="text-sm font-medium text-gray-900">
                    {durationStats.totalDays} days
                  </span>
                  {durationStats.daysPassed >= 0 && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({durationStats.daysPassed} days passed, {durationStats.daysRemaining} days remaining)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
          </div>

          {/* Checklist Card */}
          {(task.checklistGroups && task.checklistGroups.length > 0) || (task.checklists && task.checklists.length > 0) ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-lg animate-fadeIn">
              {task.checklistGroups && task.checklistGroups.length > 0 && (
                <>
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Checklist Groups</h3>
                    <Link
                      to={`/tasks/${id}/checklist-groups`}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>View Dashboard</span>
                    </Link>
                  </div>
                  <div className="p-6 space-y-4">
                    {task.checklistGroups.map((group) => {
                      const groupCompletedCount = group.checklists ? group.checklists.filter((c) => {
                        const status = c.status || (c.isCompleted ? 'completed' : 'todo');
                        return status === 'completed';
                      }).length : 0;
                      const groupTotalCount = group.checklists ? group.checklists.length : 0;
                      const groupProgressPercent = groupTotalCount > 0 ? (groupCompletedCount / groupTotalCount) * 100 : 0;
                      
                      return (
                        <div key={group.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 transform transition-all duration-200 hover:shadow-md hover:border-blue-300">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-sm font-semibold text-gray-900">{group.title}</h4>
                              {group.assignedUser && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  {group.assignedUser.name}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded-full">
                              {groupCompletedCount}/{groupTotalCount} ({Math.round(groupProgressPercent)}%)
                            </span>
                          </div>
                          {group.checklists && group.checklists.length > 0 && (
                            <div className="space-y-2 ml-4">
                              {group.checklists.map((checklist) => {
                                const isAssignedToCurrentUser = checklist.assignedTo && parseInt(checklist.assignedTo) === parseInt(user?.id);
                                const canToggle = user?.role === 'admin' || isAssignedToCurrentUser || !checklist.assignedTo;
                                const currentStatus = checklist.status || (checklist.isCompleted ? 'completed' : 'todo');
                                
                                const getStatusColor = (status) => {
                                  switch (status) {
                                    case 'completed': return 'bg-green-100 text-green-800 border-green-300';
                                    case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                                    case 'todo': return 'bg-gray-100 text-gray-800 border-gray-300';
                                    default: return 'bg-gray-100 text-gray-800 border-gray-300';
                                  }
                                };
                                
                                return (
                                  <div key={checklist.id} className="space-y-2">
                                    <div 
                                      className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 ${
                                        currentStatus === 'completed' ? 'bg-gray-50' : 'bg-white hover:bg-gray-50 hover:shadow-sm'
                                      }`}
                                    >
                                      <select
                                        value={currentStatus}
                                        onChange={(e) => {
                                          if (canToggle) {
                                            handleChecklistStatusChange(checklist.id, e.target.value);
                                          }
                                        }}
                                        disabled={!canToggle}
                                        className={`text-xs font-medium px-2 py-1 rounded border transition-all duration-200 ${
                                          getStatusColor(currentStatus)
                                        } ${canToggle ? 'cursor-pointer hover:scale-105 hover:shadow-sm' : 'cursor-not-allowed opacity-50'}`}
                                        title={!canToggle ? 'Only assigned user can update' : ''}
                                      >
                                        <option value="todo">Not Started</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                      </select>
                                      <div className="flex-1 flex items-center justify-between">
                                        <label
                                          className={`text-sm ${
                                            currentStatus === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                                          }`}
                                        >
                                          {checklist.title}
                                        </label>
                                        {checklist.assignedUser && (
                                          <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {checklist.assignedUser.name}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Sub-tasks section - chỉ hiện cho assigned user hoặc admin */}
                                    {isAssignedToCurrentUser && (
                                      <div className="ml-8 mt-3 space-y-3 border-l-3 border-indigo-400 pl-4 bg-indigo-50/30 rounded-r-lg py-3">
                                        {checklist.subTasks && checklist.subTasks.length > 0 && (
                                          <div className="flex items-center space-x-2 mb-2">
                                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                            <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                                              {checklist.subTasks.length}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {/* Hiển thị sub-tasks */}
                                        {checklist.subTasks && checklist.subTasks.length > 0 && (
                                          <div className="space-y-2">
                                            {checklist.subTasks.map((subTask) => {
                                              const subTaskStatus = subTask.status || (subTask.isCompleted ? 'completed' : 'todo');
                                              return (
                                                <div key={subTask.id} className="flex items-center space-x-2 p-2.5 bg-white rounded-lg border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                                                  <select
                                                    value={subTaskStatus}
                                                    onChange={(e) => handleUpdateSubTask(subTask.id, e.target.value)}
                                                    className={`px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                                                      subTaskStatus === 'completed' 
                                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200'
                                                        : subTaskStatus === 'in_progress'
                                                        ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200'
                                                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                                    }`}
                                                  >
                                                    <option value="todo">Chưa bắt đầu</option>
                                                    <option value="in_progress">Đang làm</option>
                                                    <option value="completed">Hoàn thành</option>
                                                  </select>
                                                  <span className={`flex-1 text-sm font-medium ${
                                                    subTaskStatus === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'
                                                  }`}>
                                                    {subTask.title}
                                                  </span>
                                                  <button
                                                    onClick={() => handleDeleteSubTask(subTask.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                                                    title="Xóa sub-task"
                                                  >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                  </button>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                        
                                        {/* Form tạo sub-task mới */}
                                        <div className="flex items-center space-x-2 pt-1">
                                          <input
                                            type="text"
                                            value={newSubTaskTitle[checklist.id] || ''}
                                            onChange={(e) => setNewSubTaskTitle({ ...newSubTaskTitle, [checklist.id]: e.target.value })}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleCreateSubTask(checklist.id, newSubTaskTitle[checklist.id]);
                                              }
                                            }}
                                            placeholder="Nhập tên sub-task mới..."
                                            className="flex-1 border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                          />
                                          <button
                                            onClick={() => handleCreateSubTask(checklist.id, newSubTaskTitle[checklist.id])}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md flex items-center space-x-1"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span>Thêm</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {task.checklists && task.checklists.length > 0 && (
                <>
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Checklist</h3>
                    <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                      {completedCount}/{totalCount} completed ({Math.round(progressPercent)}%)
                    </span>
                  </div>
                  <div className="p-6 space-y-3">
                    {task.checklists.map((checklist) => {
                      const isAssignedToCurrentUser = checklist.assignedTo && parseInt(checklist.assignedTo) === parseInt(user?.id);
                      const canToggle = user?.role === 'admin' || isAssignedToCurrentUser || !checklist.assignedTo;
                      const currentStatus = checklist.status || (checklist.isCompleted ? 'completed' : 'todo');
                      
                      const getStatusColor = (status) => {
                        switch (status) {
                          case 'completed': return 'bg-green-100 text-green-800 border-green-300';
                          case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                          case 'todo': return 'bg-gray-100 text-gray-800 border-gray-300';
                          default: return 'bg-gray-100 text-gray-800 border-gray-300';
                        }
                      };
                      
                      return (
                        <div key={checklist.id} className="space-y-2">
                          <div 
                            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                              currentStatus === 'completed' ? 'bg-gray-50' : 'bg-white hover:bg-gray-50 hover:shadow-sm'
                            }`}
                          >
                            <select
                              value={currentStatus}
                              onChange={(e) => {
                                if (canToggle) {
                                  handleChecklistStatusChange(checklist.id, e.target.value);
                                }
                              }}
                              disabled={!canToggle}
                              className={`text-xs font-medium px-3 py-1.5 rounded border transition-all duration-200 ${
                                getStatusColor(currentStatus)
                              } ${canToggle ? 'cursor-pointer hover:scale-105 hover:shadow-sm' : 'cursor-not-allowed opacity-50'}`}
                              title={!canToggle ? 'Only assigned user can update' : ''}
                            >
                              <option value="todo">Not Started</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                            <div className="flex-1 flex items-center justify-between">
                              <label
                                className={`text-sm font-medium ${
                                  currentStatus === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                                }`}
                              >
                                {checklist.title}
                              </label>
                              {checklist.assignedUser && (
                                <span className="ml-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  {checklist.assignedUser.name}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Sub-tasks section - chỉ hiện cho assigned user hoặc admin */}
                          {isAssignedToCurrentUser && (
                            <div className="ml-8 mt-3 space-y-3 border-l-3 border-indigo-400 pl-4 bg-indigo-50/30 rounded-r-lg py-3">
                              {checklist.subTasks && checklist.subTasks.length > 0 && (
                                <div className="flex items-center space-x-2 mb-2">
                                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                  </svg>
                                  <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                                    {checklist.subTasks.length}
                                  </span>
                                </div>
                              )}
                              
                              {/* Hiển thị sub-tasks */}
                              {checklist.subTasks && checklist.subTasks.length > 0 && (
                                <div className="space-y-2">
                                  {checklist.subTasks.map((subTask) => {
                                    const subTaskStatus = subTask.status || (subTask.isCompleted ? 'completed' : 'todo');
                                    return (
                                      <div key={subTask.id} className="flex items-center space-x-2 p-2.5 bg-white rounded-lg border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                                        <select
                                          value={subTaskStatus}
                                          onChange={(e) => handleUpdateSubTask(subTask.id, e.target.value)}
                                          className={`px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                                            subTaskStatus === 'completed' 
                                              ? 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200'
                                              : subTaskStatus === 'in_progress'
                                              ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200'
                                              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                          }`}
                                        >
                                          <option value="todo">Chưa bắt đầu</option>
                                          <option value="in_progress">Đang làm</option>
                                          <option value="completed">Hoàn thành</option>
                                        </select>
                                        <span className={`flex-1 text-sm font-medium ${
                                          subTaskStatus === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'
                                        }`}>
                                          {subTask.title}
                                        </span>
                                        <button
                                          onClick={() => handleDeleteSubTask(subTask.id)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                                          title="Xóa sub-task"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Form tạo sub-task mới */}
                              <div className="flex items-center space-x-2 pt-1">
                                <input
                                  type="text"
                                  value={newSubTaskTitle[checklist.id] || ''}
                                  onChange={(e) => setNewSubTaskTitle({ ...newSubTaskTitle, [checklist.id]: e.target.value })}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleCreateSubTask(checklist.id, newSubTaskTitle[checklist.id]);
                                    }
                                  }}
                                  placeholder="Nhập tên sub-task mới..."
                                  className="flex-1 border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                />
                                <button
                                  onClick={() => handleCreateSubTask(checklist.id, newSubTaskTitle[checklist.id])}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md flex items-center space-x-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span>Thêm</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Task Info Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Task Information</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</p>
                <span className={`px-3 py-1.5 inline-flex text-sm font-semibold rounded-full ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Priority</p>
                <p className="text-sm font-semibold text-gray-900">{getPriorityText(task.priority)}</p>
              </div>

              {/* Dates */}
              {task.startDate && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Start Date</p>
                  <p className="text-sm font-medium text-gray-900">{format(new Date(task.startDate), 'dd/MM/yyyy')}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(task.startDate).toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
              )}

              {task.dueDate && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Due Date</p>
                  <p className="text-sm font-medium text-gray-900">{format(new Date(task.dueDate), 'dd/MM/yyyy')}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {dueDateInfo?.dayName}
                    {timeStats?.isOverdue && <span className="text-red-600 font-semibold ml-2">• Overdue</span>}
                    {timeStats?.isDueToday && <span className="text-orange-600 font-semibold ml-2">• Today</span>}
                  </p>
                </div>
              )}

              {/* Assigned Users */}
              {task.assignedUsers && task.assignedUsers.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assigned To</p>
                  <div className="flex flex-wrap gap-2">
                    {task.assignedUsers.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 transition-all duration-200 hover:bg-blue-200 hover:scale-105"
                      >
                        {u.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Creator */}
              {task.creator && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Created By</p>
                  <p className="text-sm font-medium text-gray-900">{task.creator.name}</p>
                  {task.creator.email && (
                    <p className="text-xs text-gray-500 mt-0.5">{task.creator.email}</p>
                  )}
                </div>
              )}

              {/* Created At */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Created At</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;


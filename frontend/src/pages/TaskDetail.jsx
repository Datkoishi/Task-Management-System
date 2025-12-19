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
        checklistGroups: [{ title: '', assignedTo: null, items: [{ title: '', status: 'todo', isCompleted: false, assignedTo: null }] }],
        checklists: [{ title: '', status: 'todo', isCompleted: false, assignedTo: null }], // Backward compatible
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
      // Chỉ admin mới có thể tạo nhiệm vụ
      if (user?.role !== 'admin') {
        navigate('/tasks');
        return;
      }
      setLoading(false);
      fetchUsers();
    } else {
      fetchTask();
    }
  }, [id, user]);

  const fetchUsers = async () => {
    try {
      if (user?.role === 'admin') {
        const [usersRes, teamsRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/teams'),
        ]);
        setUsers(usersRes.data);
        setTeams(teamsRes.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách users/teams:', error);
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
              assignedTo: g.assignedTo || null,
              items: g.checklists ? g.checklists.map((c) => ({
                title: c.title,
                status: c.status || (c.isCompleted ? 'completed' : 'todo'),
                isCompleted: c.isCompleted,
                assignedTo: c.assignedTo || null
              })) : []
            }))
          : [{ title: '', assignedTo: null, items: [{ title: '', isCompleted: false, assignedTo: null }] }],
        checklists: taskData.checklists && taskData.checklists.length > 0
          ? taskData.checklists.map((c) => ({ 
              title: c.title, 
              isCompleted: c.isCompleted,
              assignedTo: c.assignedTo || null
            }))
          : [{ title: '', isCompleted: false, assignedTo: null }],
        assignedUserIds: taskData.assignedUsers ? taskData.assignedUsers.map((u) => u.id) : [],
        teamIds: [], // Teams sẽ được xác định từ assignedUsers nếu cần, hoặc để trống để admin chọn lại
        attachments: taskData.attachments ? taskData.attachments.map((a) => a.fileUrl) : [],
      });

      fetchUsers();
    } catch (error) {
      console.error('Lỗi tải nhiệm vụ:', error);
      alert('Không thể tải nhiệm vụ');
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
            assignedTo: g.assignedTo || null,
            items: g.items.filter((item) => item.title.trim() !== ''),
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
            checklistGroups: [{ title: '', assignedTo: null, items: [{ title: '', status: 'todo', isCompleted: false, assignedTo: null }] }],
            checklists: [{ title: '', status: 'todo', isCompleted: false, assignedTo: null }],
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
      alert('Lỗi lưu nhiệm vụ: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleChecklistStatusChange = async (checklistId, newStatus) => {
    if (!checklistId) {
      console.error('Checklist ID không tồn tại');
      return;
    }
    console.log('Updating checklist:', { checklistId, newStatus, taskId: id });
    try {
      const response = await api.put(`/tasks/${id}/checklists/${checklistId}`, { status: newStatus });
      console.log('Checklist updated successfully:', response.data);
      fetchTask();
    } catch (error) {
      console.error('Lỗi cập nhật checklist:', error);
      alert('Lỗi cập nhật checklist: ' + (error.response?.data?.message || error.message));
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
      <div className="max-w-4xl mx-auto">
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
      <div className="max-w-4xl mx-auto">
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
            to="/tasks" 
            className="text-blue-600 hover:text-blue-800 flex items-center space-x-2 text-sm font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Quay lại danh sách</span>
          </Link>
          {id === 'new' && (
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Tạo Task Mới</h1>
              <Link
                to="/tasks/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center space-x-2"
                onClick={(e) => {
                  e.preventDefault();
                  // Reset form và reload trang
                  window.location.href = '/tasks/new';
                }}
              >
                <span>+</span>
                <span>Thêm Task Khác</span>
          </Link>
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

          {user?.role === 'admin' && (
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
                      placeholder="Tên nhóm checklist"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <select
                      value={group.assignedTo || ''}
                      onChange={(e) => {
                        const newGroups = [...formData.checklistGroups];
                        newGroups[groupIndex].assignedTo = e.target.value ? parseInt(e.target.value) : null;
                        setFormData({ ...formData, checklistGroups: newGroups });
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[180px]"
                    >
                      <option value="">Chọn người gán nhóm</option>
                      {(id === 'new' || formData.assignedUserIds.length > 0) 
                        ? (id === 'new' 
                            ? users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))
                            : users.filter(u => formData.assignedUserIds.includes(u.id)).map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))
                          )
                        : task?.assignedUsers?.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))
                      }
                    </select>
                    {formData.checklistGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChecklistGroup(groupIndex)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa nhóm này"
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
                    placeholder="Nhập mục kiểm tra"
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
                          <option value="todo">Chưa làm</option>
                          <option value="in_progress">Đang làm</option>
                          <option value="completed">Hoàn thành</option>
                        </select>
                        <select
                          value={item.assignedTo || ''}
                          onChange={(e) => {
                            const newGroups = [...formData.checklistGroups];
                            newGroups[groupIndex].items[itemIndex].assignedTo = e.target.value ? parseInt(e.target.value) : null;
                            setFormData({ ...formData, checklistGroups: newGroups });
                          }}
                          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[180px]"
                        >
                          <option value="">Chọn người gán</option>
                          {(id === 'new' || formData.assignedUserIds.length > 0) 
                            ? (id === 'new' 
                                ? users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                  ))
                                : users.filter(u => formData.assignedUserIds.includes(u.id)).map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                  ))
                              )
                            : task?.assignedUsers?.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))
                          }
                        </select>
                        {group.items.length > 1 && (
                    <button
                      type="button"
                            onClick={() => removeChecklistItem(groupIndex, itemIndex)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa mục này"
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
                      <span>Thêm mục vào nhóm này</span>
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
                  placeholder="Tên nhóm checklist mới"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button 
                  type="button" 
                  onClick={addChecklistGroup} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                  Thêm Nhóm
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
            {id === 'new' && (
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium text-sm transition-colors shadow-sm hover:shadow-md"
              >
                Lưu và Tạo Task Mới
              </button>
            )}
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
          if (item.isCompleted) completedCount++;
        });
      }
    });
  }
  
  // Đếm từ checklists phẳng (backward compatible)
  if (task.checklists && task.checklists.length > 0) {
    task.checklists.forEach((checklist) => {
      totalCount++;
      if (checklist.isCompleted) completedCount++;
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <Link 
          to="/tasks" 
          className="text-blue-600 hover:text-blue-800 flex items-center space-x-2 text-sm font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Quay lại danh sách</span>
        </Link>
        {/* Chỉ admin mới có thể chỉnh sửa nhiệm vụ */}
        {user?.role === 'admin' && (
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm hover:shadow-md"
          >
            Edit
          </button>
        )}
      </div>

      {/* Task Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Due Date Countdown */}
        {timeStats && (
          <div className={`rounded-xl p-5 shadow-md ${
            timeStats.isOverdue 
              ? 'bg-red-50 border border-red-200' 
              : timeStats.isDueToday 
              ? 'bg-orange-50 border border-orange-200'
              : timeStats.isDueTomorrow
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</span>
              {timeStats.isOverdue && (
                <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                  Overdue
                </span>
              )}
              {timeStats.isDueToday && (
                <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">
                  Today
                </span>
              )}
            </div>
            {timeStats.isOverdue ? (
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {Math.abs(timeStats.daysLeft)} days
                </p>
                <p className="text-sm text-gray-600 mt-1">Overdue</p>
              </div>
            ) : timeStats.isDueToday ? (
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {timeStats.hoursLeft} hours
                </p>
                <p className="text-sm text-gray-600 mt-1">Remaining</p>
              </div>
            ) : (
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {timeStats.daysLeft}
                </p>
                <p className="text-sm text-gray-600 mt-1">days left</p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {format(new Date(task.dueDate), 'dd/MM/yyyy')}
            </p>
          </div>
        )}

        {/* Progress Stats */}
        {durationStats && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 shadow-md">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Time Progress</span>
            <div className="mt-2">
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(durationStats.progressDays)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {durationStats.daysPassed}/{durationStats.totalDays} days
              </p>
            </div>
            <div className="mt-3 bg-purple-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${durationStats.progressDays}%` }}
              />
            </div>
          </div>
        )}

        {/* Checklist Progress */}
        {totalCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-md">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Checklist</span>
            <div className="mt-2">
              <p className="text-2xl font-bold text-green-600">
                {Math.round(progressPercent)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {completedCount}/{totalCount} completed
              </p>
            </div>
            <div className="mt-3 bg-green-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
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
                <span className={`px-3 py-1.5 inline-flex text-sm font-semibold rounded-full ${getStatusColor(task.status)}`}>
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
                      {timeStats?.isOverdue && <span className="text-red-600 font-semibold ml-2">• Quá hạn</span>}
                      {timeStats?.isDueToday && <span className="text-orange-600 font-semibold ml-2">• Hôm nay</span>}
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
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {u.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checklist Groups Section */}
        {task.checklistGroups && task.checklistGroups.length > 0 && (
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh sách kiểm tra (Nhóm)</p>
              </div>
            </div>
            <div className="space-y-4">
              {task.checklistGroups.map((group) => {
                const groupCompletedCount = group.checklists ? group.checklists.filter((c) => {
                  const status = c.status || (c.isCompleted ? 'completed' : 'todo');
                  return status === 'completed';
                }).length : 0;
                const groupTotalCount = group.checklists ? group.checklists.length : 0;
                const groupProgressPercent = groupTotalCount > 0 ? (groupCompletedCount / groupTotalCount) * 100 : 0;
                
                return (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                          console.log('Checklist render:', { checklistId: checklist.id, assignedTo: checklist.assignedTo, userId: user?.id, isAssignedToCurrentUser, canToggle, role: user?.role });
                          
                          const getStatusColor = (status) => {
                            switch (status) {
                              case 'completed': return 'bg-green-100 text-green-800 border-green-300';
                              case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                              case 'todo': return 'bg-gray-100 text-gray-800 border-gray-300';
                              default: return 'bg-gray-100 text-gray-800 border-gray-300';
                            }
                          };
                          
                          const getStatusText = (status) => {
                            switch (status) {
                              case 'completed': return 'Hoàn thành';
                              case 'in_progress': return 'Đang làm';
                              case 'todo': return 'Chưa làm';
                              default: return 'Chưa làm';
                            }
                          };
                          
                          return (
                            <div 
                              key={checklist.id} 
                              className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                                currentStatus === 'completed' ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                              }`}
                            >
                              <select
                                value={currentStatus}
                                onChange={(e) => {
                                  console.log('Select changed:', { checklistId: checklist.id, newValue: e.target.value, canToggle });
                                  if (canToggle) {
                                    handleChecklistStatusChange(checklist.id, e.target.value);
                                  } else {
                                    console.warn('Cannot toggle - permission denied');
                                  }
                                }}
                                disabled={!canToggle}
                                className={`text-xs font-medium px-2 py-1 rounded border transition-colors ${
                                  getStatusColor(currentStatus)
                                } ${canToggle ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                title={!canToggle ? 'Chỉ người được gán mới có thể cập nhật' : ''}
                              >
                                <option value="todo">Chưa làm</option>
                                <option value="in_progress">Đang làm</option>
                                <option value="completed">Hoàn thành</option>
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
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Checklist Section (Flat - Backward Compatible) */}
        {task.checklists && task.checklists.length > 0 && (
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh sách kiểm tra</p>
              </div>
              <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                {completedCount}/{totalCount} completed ({Math.round(progressPercent)}%)
              </span>
            </div>
            <div className="space-y-3 mb-4">
              {task.checklists.map((checklist) => {
                const isAssignedToCurrentUser = checklist.assignedTo && parseInt(checklist.assignedTo) === parseInt(user?.id);
                const canToggle = user?.role === 'admin' || isAssignedToCurrentUser || !checklist.assignedTo;
                const currentStatus = checklist.status || (checklist.isCompleted ? 'completed' : 'todo');
                console.log('Checklist render (flat):', { checklistId: checklist.id, assignedTo: checklist.assignedTo, userId: user?.id, isAssignedToCurrentUser, canToggle, role: user?.role });
                
                const getStatusColor = (status) => {
                  switch (status) {
                    case 'completed': return 'bg-green-100 text-green-800 border-green-300';
                    case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                    case 'todo': return 'bg-gray-100 text-gray-800 border-gray-300';
                    default: return 'bg-gray-100 text-gray-800 border-gray-300';
                  }
                };
                
                return (
                <div 
                  key={checklist.id} 
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      currentStatus === 'completed' ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <select
                      value={currentStatus}
                      onChange={(e) => {
                        console.log('Select changed:', { checklistId: checklist.id, newValue: e.target.value, canToggle });
                        if (canToggle) {
                          handleChecklistStatusChange(checklist.id, e.target.value);
                        } else {
                          console.warn('Cannot toggle - permission denied');
                        }
                      }}
                      disabled={!canToggle}
                      className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors ${
                        getStatusColor(currentStatus)
                      } ${canToggle ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                      title={!canToggle ? 'Chỉ người được gán mới có thể cập nhật' : ''}
                    >
                      <option value="todo">Chưa làm</option>
                      <option value="in_progress">Đang làm</option>
                      <option value="completed">Hoàn thành</option>
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
                );
              })}
            </div>
            {/* Progress Bar */}
            <div className="relative">
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
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
    </div>
  );
};

export default TaskDetail;


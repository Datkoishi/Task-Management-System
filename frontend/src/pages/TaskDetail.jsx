import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { format } from 'date-fns';
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
    checklists: [{ title: '', isCompleted: false }],
    assignedUserIds: [],
    attachments: [],
  });
  const [users, setUsers] = useState([]);
  const [newAttachment, setNewAttachment] = useState('');
  const [newChecklist, setNewChecklist] = useState('');

  useEffect(() => {
    if (id === 'new') {
      setLoading(false);
      fetchUsers();
    } else {
      fetchTask();
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      if (user?.role === 'admin') {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách users:', error);
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
        checklists: taskData.checklists && taskData.checklists.length > 0
          ? taskData.checklists.map((c) => ({ title: c.title, isCompleted: c.isCompleted }))
          : [{ title: '', isCompleted: false }],
        assignedUserIds: taskData.assignedUsers ? taskData.assignedUsers.map((u) => u.id) : [],
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        checklists: formData.checklists.filter((c) => c.title.trim() !== ''),
        assignedUserIds: formData.assignedUserIds,
        attachments: formData.attachments.filter((a) => a.trim() !== ''),
      };

      if (id === 'new') {
        await api.post('/tasks', data);
        navigate('/tasks');
      } else {
        await api.put(`/tasks/${id}`, data);
        setEditing(false);
        fetchTask();
      }
    } catch (error) {
      alert('Lỗi lưu nhiệm vụ: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleChecklistToggle = async (checklistId, isCompleted) => {
    try {
      await api.put(`/tasks/${id}/checklists/${checklistId}`, { isCompleted: !isCompleted });
      fetchTask();
    } catch (error) {
      alert('Lỗi cập nhật checklist');
    }
  };

  const addChecklist = () => {
    if (newChecklist.trim()) {
      setFormData({
        ...formData,
        checklists: [...formData.checklists, { title: newChecklist, isCompleted: false }],
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
        return 'Hoàn thành';
      case 'in_progress':
        return 'Đang làm';
      case 'todo':
        return 'Chưa bắt đầu';
      default:
        return status;
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return priority;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  if (!editing && !task) {
    return <div className="text-center py-12">Không tìm thấy nhiệm vụ</div>;
  }

  if (editing) {
    return (
      <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/tasks" className="text-blue-600 hover:text-blue-800">
            ← Quay lại danh sách
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            {id === 'new' ? 'Tạo nhiệm vụ mới' : 'Chỉnh sửa nhiệm vụ'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ ưu tiên</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>

            {id !== 'new' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todo">Chưa bắt đầu</option>
                  <option value="in_progress">Đang làm</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày đến hạn</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {user?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gán cho người dùng</label>
              <select
                multiple
                value={formData.assignedUserIds.map(String)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assignedUserIds: Array.from(e.target.selectedOptions, (option) => parseInt(option.value)),
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                size={5}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Giữ Ctrl (Cmd trên Mac) để chọn nhiều người</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Danh sách kiểm tra</label>
            <div className="space-y-2">
              {formData.checklists.map((checklist, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={checklist.title}
                    onChange={(e) => {
                      const newChecklists = [...formData.checklists];
                      newChecklists[index].title = e.target.value;
                      setFormData({ ...formData, checklists: newChecklists });
                    }}
                    placeholder="Mục kiểm tra"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {formData.checklists.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChecklist(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newChecklist}
                  onChange={(e) => setNewChecklist(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklist())}
                  placeholder="Thêm mục kiểm tra mới"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button type="button" onClick={addChecklist} className="bg-blue-600 text-white px-4 py-2 rounded-md">
                  Thêm
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link đính kèm</label>
            <div className="space-y-2">
              {formData.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <a
                    href={attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-blue-600 hover:underline truncate"
                  >
                    {attachment}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Xóa
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={newAttachment}
                  onChange={(e) => setNewAttachment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttachment())}
                  placeholder="https://example.com"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button type="button" onClick={addAttachment} className="bg-blue-600 text-white px-4 py-2 rounded-md">
                  Thêm
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              to="/tasks"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md font-medium"
            >
              Hủy
            </Link>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium">
              {id === 'new' ? 'Tạo' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // View mode
  const completedCount = task.checklists ? task.checklists.filter((c) => c.isCompleted).length : 0;
  const totalCount = task.checklists ? task.checklists.length : 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/tasks" className="text-blue-600 hover:text-blue-800">
          ← Quay lại danh sách
        </Link>
        <div className="flex justify-between items-center mt-4">
          <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Chỉnh sửa
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Trạng thái</span>
            <div className="mt-1">
              <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(task.status)}`}>
                {getStatusText(task.status)}
              </span>
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Mức độ ưu tiên</span>
            <div className="mt-1">
              <span className="text-sm font-semibold">{getPriorityText(task.priority)}</span>
            </div>
          </div>
          {task.startDate && (
            <div>
              <span className="text-sm font-medium text-gray-500">Ngày bắt đầu</span>
              <div className="mt-1 text-sm">{format(new Date(task.startDate), 'dd/MM/yyyy')}</div>
            </div>
          )}
          {task.dueDate && (
            <div>
              <span className="text-sm font-medium text-gray-500">Ngày đến hạn</span>
              <div className="mt-1 text-sm">{format(new Date(task.dueDate), 'dd/MM/yyyy')}</div>
            </div>
          )}
        </div>

        {task.description && (
          <div>
            <span className="text-sm font-medium text-gray-500">Mô tả</span>
            <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{task.description}</div>
          </div>
        )}

        {task.assignedUsers && task.assignedUsers.length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-500">Người được giao</span>
            <div className="mt-1 text-sm">
              {task.assignedUsers.map((u) => u.name).join(', ')}
            </div>
          </div>
        )}

        {task.checklists && task.checklists.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500">Danh sách kiểm tra</span>
              <span className="text-sm text-gray-500">
                {completedCount}/{totalCount} hoàn thành ({Math.round(progressPercent)}%)
              </span>
            </div>
            <div className="mt-2 space-y-2">
              {task.checklists.map((checklist) => (
                <div key={checklist.id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={checklist.isCompleted}
                    onChange={() => handleChecklistToggle(checklist.id, checklist.isCompleted)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    className={`flex-1 text-sm ${
                      checklist.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {checklist.title}
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {task.attachments && task.attachments.length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-500">Đính kèm</span>
            <div className="mt-2 space-y-2">
              {task.attachments.map((attachment) => (
                <div key={attachment.id}>
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {attachment.fileUrl}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetail;


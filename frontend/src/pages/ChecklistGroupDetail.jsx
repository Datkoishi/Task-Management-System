import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ChecklistGroupDetail = () => {
  const { taskId, groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState({});

  useEffect(() => {
    fetchTask();
  }, [taskId, groupId]);

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${taskId}`);
      setTask(res.data);
      const foundGroup = res.data.checklistGroups?.find(g => g.id === parseInt(groupId));
      setGroup(foundGroup);
    } catch (error) {
      console.error('Error loading task:', error);
      alert('Unable to load task');
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500';
      case 'in_progress':
        return 'bg-amber-500';
      case 'todo':
        return 'bg-slate-400';
      default:
        return 'bg-gray-400';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Link
              to={taskId ? `/tasks/${taskId}/checklist-groups` : "/tasks"}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              title="Quay lại"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Quay lại</span>
            </Link>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-gray-600 font-medium">Đang tải...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Link
              to={taskId ? `/tasks/${taskId}/checklist-groups` : "/tasks"}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              title="Quay lại"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Quay lại</span>
            </Link>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy nhóm</h3>
              <Link
                to={taskId ? `/tasks/${taskId}/checklist-groups` : "/tasks"}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Quay lại danh sách nhóm
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groupItems = group.checklists || [];
  const groupCompleted = groupItems.filter((item) => {
    const status = item.status || (item.isCompleted ? 'completed' : 'todo');
    return status === 'completed';
  }).length;
  const groupTotal = groupItems.length;
  const groupProgress = groupTotal > 0 ? (groupCompleted / groupTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Header với gradient đẹp */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb with Back Button */}
          <div className="flex items-center justify-between mb-6">
            <nav className="flex items-center space-x-2 text-sm text-white/90">
              <Link to="/tasks" className="hover:text-white transition-colors">Tasks</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link to={`/tasks/${taskId}`} className="hover:text-white transition-colors">{task.title}</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link to={`/tasks/${taskId}/checklist-groups`} className="hover:text-white transition-colors">Checklist Groups</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-white font-medium">{group.title}</span>
            </nav>
            <Link
              to={`/tasks/${taskId}/checklist-groups`}
              className="inline-flex items-center space-x-2 text-white hover:text-white transition-colors font-semibold"
              title="Quay lại Checklist Groups"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Quay lại</span>
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{group.title}</h1>
              {group.assignedUser && (
                <div className="flex items-center space-x-2 text-white/90">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm">{group.assignedUser.name}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white mb-1">{Math.round(groupProgress)}%</div>
              <div className="text-sm text-white/80">{groupCompleted}/{groupTotal} hoàn thành</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
              <div
                className="bg-white h-3 rounded-full transition-all duration-700 ease-out shadow-lg"
                style={{ width: `${groupProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Checklist Items */}
        {groupItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-600 font-medium text-lg mb-2">Chưa có nhiệm vụ</p>
            <p className="text-sm text-gray-500">Nhóm này chưa có checklist items nào.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupItems.map((item) => {
              const itemStatus = item.status || (item.isCompleted ? 'completed' : 'todo');
              const subTasksCount = item.subTasks ? item.subTasks.length : 0;
              const subTasksCompleted = item.subTasks 
                ? item.subTasks.filter(st => (st.status || (st.isCompleted ? 'completed' : 'todo')) === 'completed').length 
                : 0;
              const isAssignedToCurrentUser = item.assignedTo && parseInt(item.assignedTo) === parseInt(user?.id);

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Status Indicator */}
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 ${getStatusColor(itemStatus)}`}></div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`text-lg font-semibold ${
                            itemStatus === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
                          }`}>
                            {item.title}
                          </h3>
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 ${
                            itemStatus === 'completed' 
                              ? 'bg-emerald-100 text-emerald-700'
                              : itemStatus === 'in_progress'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {getStatusText(itemStatus)}
                          </span>
                        </div>
                        
                        {/* Metadata */}
                        <div className="flex items-center space-x-6 mb-4">
                          {item.assignedUser && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-sm text-gray-600">{item.assignedUser.name}</span>
                            </div>
                          )}
                          {subTasksCount > 0 && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              <span className="text-sm font-medium text-indigo-600">
                                {subTasksCompleted}/{subTasksCount} sub-tasks
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Sub-tasks section */}
                        {isAssignedToCurrentUser && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                            {item.subTasks && item.subTasks.length > 0 && (
                              <div className="space-y-2">
                                {item.subTasks.map((subTask) => {
                                  const subTaskStatus = subTask.status || (subTask.isCompleted ? 'completed' : 'todo');
                                  return (
                                    <div key={subTask.id} className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                      <select
                                        value={subTaskStatus}
                                        onChange={(e) => handleUpdateSubTask(subTask.id, e.target.value)}
                                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
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
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
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
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={newSubTaskTitle[item.id] || ''}
                                onChange={(e) => setNewSubTaskTitle({ ...newSubTaskTitle, [item.id]: e.target.value })}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCreateSubTask(item.id, newSubTaskTitle[item.id]);
                                  }
                                }}
                                placeholder="Nhập tên sub-task mới..."
                                className="flex-1 border border-indigo-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                              />
                              <button
                                onClick={() => handleCreateSubTask(item.id, newSubTaskTitle[item.id])}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md flex items-center space-x-2"
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistGroupDetail;


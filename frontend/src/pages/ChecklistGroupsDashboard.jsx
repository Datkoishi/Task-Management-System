import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ChecklistGroupsDashboard = () => {
  const { taskId, groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState({});
  const [expandedGroupId, setExpandedGroupId] = useState(groupId ? parseInt(groupId) : null);

  const toggleGroup = (groupId) => {
    const newExpandedId = expandedGroupId === groupId ? null : groupId;
    setExpandedGroupId(newExpandedId);
    // Update URL without navigation
    if (newExpandedId) {
      window.history.pushState({}, '', `/tasks/${taskId}/checklist-groups/${newExpandedId}`);
    } else {
      window.history.pushState({}, '', `/tasks/${taskId}/checklist-groups`);
    }
  };

  useEffect(() => {
    fetchTask();
    if (groupId) {
      setExpandedGroupId(parseInt(groupId));
    }
  }, [taskId, groupId]);

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${taskId}`);
      setTask(res.data);
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
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 font-medium">Đang tải...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
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
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy task</h3>
              <Link
                to="/tasks"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Quay lại danh sách
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const checklistGroups = task.checklistGroups || [];
  
  // Tính toán thống kê
  let totalGroups = checklistGroups.length;
  let totalItems = 0;
  let completedItems = 0;
  let inProgressItems = 0;
  let todoItems = 0;

  checklistGroups.forEach((group) => {
    if (group.checklists && group.checklists.length > 0) {
      group.checklists.forEach((item) => {
        totalItems++;
        const status = item.status || (item.isCompleted ? 'completed' : 'todo');
        if (status === 'completed') completedItems++;
        else if (status === 'in_progress') inProgressItems++;
        else todoItems++;
      });
    }
  });

  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Top Navigation Bar với gradient đẹp */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <Link
                to={`/tasks/${taskId}`}
                className="inline-flex items-center space-x-2 text-white hover:text-white transition-colors font-semibold"
                title="Quay lại Task Detail"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Quay lại</span>
              </Link>
              <div className="h-6 w-px bg-white/30"></div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{task.title}</h1>
                <p className="text-sm text-white/80 mt-1">Checklist Groups Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
                task.status === 'completed' ? 'bg-emerald-500/90 text-white' :
                task.status === 'in_progress' ? 'bg-amber-500/90 text-white' :
                'bg-slate-500/90 text-white'
              }`}>
                {getStatusText(task.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats - Modern Design */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="text-4xl font-bold text-blue-600 mb-2">{totalGroups}</div>
                <div className="text-sm font-medium text-blue-700">Nhóm</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="text-4xl font-bold text-purple-600 mb-2">{totalItems}</div>
                <div className="text-sm font-medium text-purple-700">Nhiệm vụ</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                <div className="text-4xl font-bold text-emerald-600 mb-2">{completedItems}</div>
                <div className="text-sm font-medium text-emerald-700">Hoàn thành</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                <div className="text-4xl font-bold text-indigo-600 mb-2">{Math.round(overallProgress)}%</div>
                <div className="text-sm font-medium text-indigo-700">Tiến độ</div>
              </div>
            </div>
            
            {/* Overall Progress Bar */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-semibold text-gray-800">Tiến độ tổng thể</span>
                <span className="text-base font-bold text-gray-900">{completedItems}/{totalItems}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-700 ease-out shadow-lg"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-3 text-sm font-medium text-gray-600">
                <span className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span>Chưa bắt đầu: {todoItems}</span>
                </span>
                <span className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span>Đang làm: {inProgressItems}</span>
                </span>
                <span className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span>Hoàn thành: {completedItems}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist Groups - Modern Card Design */}
        {checklistGroups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-600 font-medium text-lg mb-2">Chưa có nhóm checklist</p>
            <p className="text-sm text-gray-500">Task này chưa có checklist groups nào.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {checklistGroups.map((group, groupIndex) => {
              const groupItems = group.checklists || [];
              const groupCompleted = groupItems.filter((item) => {
                const status = item.status || (item.isCompleted ? 'completed' : 'todo');
                return status === 'completed';
              }).length;
              const groupTotal = groupItems.length;
              const groupProgress = groupTotal > 0 ? (groupCompleted / groupTotal) * 100 : 0;

              const isExpanded = expandedGroupId === group.id;

              return (
                <div
                  key={group.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300"
                >
                  {/* Group Header - Gradient Design */}
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-6 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 border border-white/30">
                            <span className="text-white font-bold text-xl">{groupIndex + 1}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-2">{group.title}</h3>
                            {group.assignedUser && (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-sm text-white/90 font-medium">{group.assignedUser.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-3xl font-bold text-white mb-1">{Math.round(groupProgress)}%</div>
                        <div className="text-sm text-white/80">{groupCompleted}/{groupTotal} hoàn thành</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-white h-2.5 rounded-full transition-all duration-700 ease-out shadow-lg"
                          style={{ width: `${groupProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Checklist Items Preview */}
                  <div className="px-6 py-5">
                    {groupItems.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">Chưa có nhiệm vụ trong nhóm này</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {groupItems.slice(0, 3).map((item) => {
                          const itemStatus = item.status || (item.isCompleted ? 'completed' : 'todo');
                          const subTasksCount = item.subTasks ? item.subTasks.length : 0;
                          const subTasksCompleted = item.subTasks 
                            ? item.subTasks.filter(st => (st.status || (st.isCompleted ? 'completed' : 'todo')) === 'completed').length 
                            : 0;
                          const isAssignedToCurrentUser = item.assignedTo && parseInt(item.assignedTo) === parseInt(user?.id);

                          return (
                            <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusColor(itemStatus)}`}></div>
                              <p className={`text-sm font-medium flex-1 ${
                                itemStatus === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'
                              }`}>
                                {item.title}
                              </p>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                itemStatus === 'completed' 
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : itemStatus === 'in_progress'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {getStatusText(itemStatus)}
                              </span>
                            </div>
                          );
                        })}
                        {groupItems.length > 3 && (
                          <div className="text-center pt-2">
                            <span className="text-sm text-indigo-600 font-medium">
                              +{groupItems.length - 3} nhiệm vụ khác...
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleGroup(group.id);
                        }}
                        className="w-full flex items-center justify-center space-x-2 text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors py-2"
                      >
                        <span>{isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}</span>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="border-t-4 border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50">
                      <div className="px-6 py-6">
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">Chi tiết nhóm: {group.title}</h4>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              {group.assignedUser && (
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="text-sm text-gray-600">{group.assignedUser.name}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">Tiến độ:</span>
                                <span className="text-sm font-bold text-indigo-600">{Math.round(groupProgress)}%</span>
                                <span className="text-sm text-gray-600">({groupCompleted}/{groupTotal})</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Checklist Items Detail */}
                        {groupItems.length === 0 ? (
                          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-gray-600 font-medium mb-2">Chưa có nhiệm vụ</p>
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistGroupsDashboard;

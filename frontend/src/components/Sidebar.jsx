import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const isActive = (path) => {
    if (path.includes('?tab=')) {
      const [basePath, query] = path.split('?');
      const tab = query.split('=')[1];
      return location.pathname === basePath && location.search === `?tab=${tab}`;
    }
    // For /admin path, check if we're on admin page and no specific tab in URL
    if (path === '/admin') {
      return location.pathname === '/admin' && !location.search.includes('tab=');
    }
    // Exact match for paths
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/tasks', label: 'Tasks', icon: '📋' },
    { path: '/tasks/new', label: 'Create Task', icon: '➕' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ path: '/admin?tab=team', label: 'Teams', icon: '👨‍👩‍👧‍👦' });
    menuItems.push({ path: '/admin', label: 'Admin', icon: '⚙️' });
  }

  useEffect(() => {
    fetchAssignedTasks();
  }, [user]);

  const fetchAssignedTasks = async () => {
    if (!user) return;
    setLoadingTasks(true);
    try {
      const res = await api.get('/tasks');
      // Lọc các task được assign cho user hiện tại hoặc user tạo
      const tasks = res.data.filter(task => {
        const isAssigned = task.assignedUsers?.some(u => u.id === user.id);
        const isCreator = task.creator?.id === user.id;
        return (isAssigned || isCreator) && task.status !== 'completed';
      });
      // Sắp xếp theo dueDate và lấy 5 task gần nhất
      const sortedTasks = tasks
        .sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        })
        .slice(0, 5);
      setAssignedTasks(sortedTasks);
    } catch (error) {
      console.error('Error loading assigned tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
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

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-2xl font-bold text-blue-600">TMS</h1>
        <p className="text-xs text-gray-500 mt-1">Task Management System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-xl mr-3">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Assigned Tasks Summary */}
      {user && (
        <div className="px-4 py-4 border-t border-gray-200 flex-shrink-0 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhiệm vụ của tôi</h3>
            <Link
              to="/tasks"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Xem tất cả
            </Link>
          </div>
          {loadingTasks ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          ) : assignedTasks.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">Chưa có nhiệm vụ</p>
          ) : (
            <div className="space-y-2">
              {assignedTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="block p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-xs font-medium text-gray-900 line-clamp-2 flex-1 pr-2">
                      {task.title}
                    </h4>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status).charAt(0)}
                    </span>
                  </div>
                  {task.dueDate && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Info */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrator' : 'User'}</p>
          </div>
        </div>
        <div className="flex items-center text-xs text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Online
        </div>
      </div>
    </div>
  );
};

export default Sidebar;


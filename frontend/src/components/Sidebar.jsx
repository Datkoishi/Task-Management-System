import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

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
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/tasks', label: 'Tasks', icon: '📋' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ path: '/admin?tab=team', label: 'Teams', icon: '👨‍👩‍👧‍👦' });
    menuItems.push({ path: '/admin', label: 'Admin', icon: '⚙️' });
  }

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


import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Fixed Left */}
      <Sidebar />

      {/* Main Content Area - Flexible */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header - Fixed Top */}
        <Header />

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-auto pt-16 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;


import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Fixed */}
      <Sidebar />

      {/* Header - Fixed */}
      <Header />

      {/* Main Content - Offset by sidebar width and header height */}
      <main className="ml-64 pt-16 min-h-screen bg-gray-50 p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;


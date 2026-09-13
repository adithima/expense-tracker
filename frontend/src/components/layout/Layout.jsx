import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Navbar sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />

        <main style={{ flex: 1, padding: '28px 24px', width: '100%' }}>
          <div className="container" style={{ padding: 0 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
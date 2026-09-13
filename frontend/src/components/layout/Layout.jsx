import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * Main app shell layout used by all protected/authenticated pages.
 * Manages the collapsed/expanded state of the sidebar — starts
 * collapsed (icon rail only), expands when the hamburger is clicked.
 */
const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((prev) => !prev)} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Navbar />

        <main
          style={{
            flex: 1,
            padding: '28px 24px',
            width: '100%',
          }}
        >
          <div className="container" style={{ padding: 0 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
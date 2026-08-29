import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * Main app shell layout used by all protected/authenticated pages.
 * Combines the Sidebar and Navbar around the routed page content.
 * Manages mobile sidebar open/close state, shared between Navbar
 * (which triggers it) and Sidebar (which displays/closes it).
 */
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

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
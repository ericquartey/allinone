// ============================================================================
// EJLOG WMS - App Layout
// Layout principale dell'applicazione con Header fisso e Sidebar collapsible
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import Footer from './Footer';

const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const isPpcRoute = location.pathname.startsWith('/ppc');

  useEffect(() => {
    if (isPpcRoute) {
      document.body.classList.add('ppc-theme');
    } else {
      document.body.classList.remove('ppc-theme');
    }
    return () => {
      document.body.classList.remove('ppc-theme');
    };
  }, [isPpcRoute]);

  if (isPpcRoute) {
    return (
      <div className="ppc-ui ppc-shell">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="ejlog-dashboard-theme">
      {/* Header - Fixed at top with full width */}
      <Header />

      {/* Sidebar - Full menu with all pages from menuConfig */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main container with coordinated margin for sidebar and padding-top for fixed header */}
      <div
        className="transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? '64px' : '256px',
          paddingTop: '64px' // 4rem = 64px for fixed header
        }}
      >
        {/* Main content area */}
        <main className="min-h-screen">
          <div className="container mx-auto px-4 py-6 max-w-screen-2xl">
            <Outlet />
          </div>
        </main>

        {/* Footer - At bottom */}
        <Footer />
      </div>
    </div>
  );
};

export default AppLayout;

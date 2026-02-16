import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import SkipToMainContent from '../accessibility/SkipToMainContent';

/**
 * MainLayout Component
 *
 * Provides the main application layout with:
 * - Fixed sidebar navigation (collapsible)
 * - Top header bar
 * - Main content area with responsive offset
 */
function MainLayout(): JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content - WCAG 2.4.1 Bypass Blocks */}
      <SkipToMainContent />

      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        role="navigation"
        aria-label="Menu principale"
      />

      {/* Main Content Area - Dynamic margin based on sidebar state */}
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}
      >
        {/* Header */}
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Page Content */}
        <main id="main-content" className="pt-16 min-h-screen" role="main">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;

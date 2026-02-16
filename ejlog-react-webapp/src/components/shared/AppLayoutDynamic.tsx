// ============================================================================
// EJLOG WMS - App Layout (Dynamic)
// Layout principale con sidebar dinamica basata su permessi
// ============================================================================

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import DynamicSidebar from './DynamicSidebar';
import Footer from './Footer';

const AppLayoutDynamic: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <DynamicSidebar isOpen={sidebarOpen} />

        <main
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AppLayoutDynamic;

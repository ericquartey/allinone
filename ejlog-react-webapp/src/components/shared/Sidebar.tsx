// ============================================================================
// EJLOG WMS - Sidebar Component
// Menu laterale di navigazione con struttura completa a 14 moduli
// ============================================================================

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Package,
  ClipboardList,
  Box,
  Activity,
  TrendingUp,
  BarChart3,
  MapPin,
  Tag,
  Monitor,
  Users,
  FileText,
  Cpu,
  AlertTriangle,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  children?: { label: string; path: string }[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const menuItems: MenuItem[] = [
    // 1. Dashboard
    {
      icon: Home,
      label: 'Dashboard',
      path: '/',
    },

    // 2. Gestione Liste
    {
      icon: ClipboardList,
      label: 'Gestione Liste',
      path: '/lists',
    },

    // 3. Gestione Articoli
    {
      icon: Package,
      label: 'Gestione Articoli',
      path: '/items',
    },

    // 4. Gestione Ubicazioni
    {
      icon: MapPin,
      label: 'Gestione Ubicazioni',
      children: [
        { label: 'Browser Ubicazioni', path: '/locations' },
        { label: 'CRUD Ubicazioni', path: '/management/locations' },
      ],
    },

    // 5. Gestione UDC
    {
      icon: Box,
      label: 'Gestione UDC',
      path: '/udc',
    },

    // 6. Esecuzione Picking (accessed via Lists page)
    // Removed from menu - accessible from list detail page
    // {
    //   icon: Activity,
    //   label: 'Esecuzione Picking',
    //   path: '/picking',
    // },

    // 7. Esecuzione Refilling (accessed via Lists page)
    // Removed from menu - accessible from list detail page
    // {
    //   icon: TrendingUp,
    //   label: 'Esecuzione Refilling',
    //   path: '/refilling',
    // },

    // 8. Movimenti Stock
    {
      icon: BarChart3,
      label: 'Movimenti Stock',
      path: '/stock/movements',
    },

    // 9. Configurazione Aree (corrected path)
    {
      icon: Settings,
      label: 'Configurazione Aree',
      path: '/config/areas',
    },

    // 10. Configurazione Stampanti (no dedicated page - removed)
    // {
    //   icon: Monitor,
    //   label: 'Configurazione Stampanti',
    //   path: '/config/printers',
    // },

    // 11. Gestione Utenti (completa con tabs: Lista, Storico, Token, Gruppi)
    {
      icon: Users,
      label: 'Gestione Utenti',
      path: '/users-management',
    },

    // 12. Gestione Allarmi
    {
      icon: AlertTriangle,
      label: 'Gestione Allarmi',
      path: '/alarms',
    },

    // 13. Report Dashboard
    {
      icon: FileText,
      label: 'Report Dashboard',
      path: '/reports',
    },

    // 14. Gestione Ricevimento (mock page - removed until backend ready)
    // {
    //   icon: Tag,
    //   label: 'Gestione Ricevimento',
    //   path: '/receiving',
    // },

    // 15. Gestione Macchine
    {
      icon: Cpu,
      label: 'Gestione Macchine',
      path: '/machines',
    },

    // 16. Ordini
    {
      icon: Package,
      label: 'Ordini',
      path: '/orders',
    },

    // 17. Gestione (Sprint 3 - CRUD Management)
    {
      icon: Settings,
      label: 'Gestione',
      children: [
        { label: 'Postazioni', path: '/management/workstations' },
        { label: 'Ubicazioni', path: '/management/locations' },
      ],
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 w-64 bg-ferretto-dark text-white transform transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <nav className="h-full overflow-y-auto py-4">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={item.label + index}>
              {item.children ? (
                // Menu con sottomenu
                <div>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-ferretto-red/20 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {openMenus.includes(item.label) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {openMenus.includes(item.label) && (
                    <ul className="bg-ferretto-dark/50">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) =>
                              `flex items-center px-4 py-2 pl-12 hover:bg-ferretto-red/20 transition-colors text-sm ${
                                isActive ? 'bg-ferretto-red text-white' : ''
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                // Menu semplice senza sottomenu
                <NavLink
                  to={item.path!}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 hover:bg-ferretto-red/20 transition-colors ${
                      isActive ? 'bg-ferretto-red text-white' : ''
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGetMenuQuery } from '../../services/api/menuApi';
import * as Icons from '@mui/icons-material';

// Default menu se backend non disponibile
const DEFAULT_MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard', path: '/dashboard', order: 1 },
  { id: 'lists', label: 'Liste', icon: 'List', path: '/lists-management', order: 2 },
  { id: 'stock', label: 'Stock', icon: 'Inventory', path: '/stock', order: 3 },
  { id: 'movements', label: 'Movimenti', icon: 'SwapHoriz', path: '/movements', order: 4 },
  { id: 'products', label: 'Prodotti', icon: 'Category', path: '/products', order: 5 },
  { id: 'locations', label: 'Ubicazioni', icon: 'Place', path: '/locations', order: 6 },
  { id: 'udc', label: 'UDC', icon: 'Widgets', path: '/udc', order: 7 },
  { id: 'drawers', label: 'Gestione Cassetti', icon: 'Inbox', path: '/drawers', order: 8 },
  { id: 'users', label: 'Utenti', icon: 'People', path: '/users', order: 9 },
  { id: 'plc', label: 'PLC', icon: 'Settings', path: '/plc', order: 10 },
  { id: 'alarms', label: 'Allarmi', icon: 'Warning', path: '/alarms', order: 11 },
  { id: 'reports', label: 'Report', icon: 'Assessment', path: '/reports', order: 12 },
];

interface SidebarDynamicProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const SidebarDynamic: React.FC<SidebarDynamicProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { data, isLoading, error } = useGetMenuQuery();

  const menuItems = data?.items || DEFAULT_MENU;
  const isUsingFallback = !data || error;

  const getIcon = (iconName?: string) => {
    if (!iconName) return <Icons.Circle className="w-5 h-5" />;
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <Icons.Circle className="w-5 h-5" />;
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64`}
    >
      <div className="flex flex-col h-full">
        {isUsingFallback && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-xs text-yellow-800">
            Menu di default (backend non disponibile)
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems
              .filter(item => item.visible !== false)
              .sort((a, b) => (a.order || 999) - (b.order || 999))
              .map((item) => (
                <li key={item.id}>
                  {item.path ? (
                    <Link
                      to={item.path}
                      onClick={handleClick}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {getIcon(item.icon)}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <div className="px-3 py-2 text-sm font-semibold text-gray-500 uppercase">
                      {item.label}
                    </div>
                  )}

                  {item.children && item.children.length > 0 && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            to={child.path || '#'}
                            onClick={handleClick}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              isActive(child.path)
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {getIcon(child.icon)}
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
          </ul>
        </nav>

        {isLoading && (
          <div className="p-4 text-center text-sm text-gray-500">
            Caricamento menu...
          </div>
        )}
      </div>
    </aside>
  );
};

export default SidebarDynamic;

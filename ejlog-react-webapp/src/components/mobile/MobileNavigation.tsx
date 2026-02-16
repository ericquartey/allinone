import React, { FC, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Package, List, BarChart3, Settings, Bell,
  Menu, X, ChevronRight, Search, User, LogOut,
  Warehouse, Boxes, AlertTriangle, FileText, Activity
} from 'lucide-react';

// Types
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
  submenu?: NavItem[];
}

interface MobileNavigationProps {
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export const MobileNavigation: FC<MobileNavigationProps> = ({
  userName = 'Operatore',
  userRole = 'Warehouse Operator',
  onLogout
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(3);

  // Navigation items
  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'lists',
      label: 'Liste',
      icon: List,
      path: '/lists',
      submenu: [
        { id: 'picking', label: 'Picking', icon: Package, path: '/lists/picking' },
        { id: 'putaway', label: 'Putaway', icon: Warehouse, path: '/lists/putaway' },
        { id: 'inventory', label: 'Inventario', icon: Boxes, path: '/lists/inventory' }
      ]
    },
    {
      id: 'stock',
      label: 'Giacenze',
      icon: Package,
      path: '/stock'
    },
    {
      id: 'operations',
      label: 'Operazioni',
      icon: Activity,
      path: '/operations'
    },
    {
      id: 'alarms',
      label: 'Allarmi',
      icon: AlertTriangle,
      path: '/alarms',
      badge: 5
    },
    {
      id: 'reports',
      label: 'Report',
      icon: FileText,
      path: '/reports'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics'
    }
  ];

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
    setExpandedMenu(null);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const filteredNavItems = searchQuery
    ? navItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.submenu?.some(sub => sub.label.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : navItems;

  return (
    <>
      {/* Top Bar - Always visible */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4 shadow-sm">
        {/* Menu Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>

        {/* Logo/Title */}
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-lg font-bold text-gray-900">EjLog WMS</h1>
        </div>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 -mr-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition relative"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6 text-gray-700" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Menu */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{userName}</div>
                <div className="text-sm text-gray-600 truncate">{userRole}</div>
              </div>
            </div>

            {/* Search */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-2">
              {filteredNavItems.map((item) => (
                <div key={item.id}>
                  {/* Main Item */}
                  <button
                    onClick={() => {
                      if (item.submenu) {
                        toggleSubmenu(item.id);
                      } else {
                        handleNavigation(item.path);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition mb-1 ${
                      isActivePath(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                      {item.submenu && (
                        <ChevronRight
                          className={`w-5 h-5 transition-transform ${
                            expandedMenu === item.id ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </div>
                  </button>

                  {/* Submenu */}
                  {item.submenu && expandedMenu === item.id && (
                    <div className="ml-8 mt-1 mb-2 space-y-1">
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleNavigation(subItem.path)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition text-sm ${
                            isActivePath(subItem.path)
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                          }`}
                        >
                          <subItem.icon className="w-4 h-4 flex-shrink-0" />
                          <span>{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={() => handleNavigation('/settings')}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Impostazioni</span>
            </button>
            <button
              onClick={() => {
                onLogout?.();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 active:bg-red-100 transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40 flex items-center justify-around px-2 shadow-lg md:hidden">
        {[
          { icon: Home, label: 'Home', path: '/dashboard' },
          { icon: List, label: 'Liste', path: '/lists' },
          { icon: Package, label: 'Stock', path: '/stock' },
          { icon: BarChart3, label: 'Analytics', path: '/analytics' }
        ].map((item, idx) => {
          const isActive = isActivePath(item.path);
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-xs font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

// Hook for managing mobile navigation state
export const useMobileNavigation = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile };
};

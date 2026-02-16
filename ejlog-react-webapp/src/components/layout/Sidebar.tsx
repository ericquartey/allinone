import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/solid';
import { menuConfig, MenuItem } from '../../config/menuConfig';
import { toggleTouchMode, selectTouchMode } from '../../features/settings/settingsSlice';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface ExpandedSections {
  [key: string]: boolean;
}

/**
 * Modern Sidebar Component for EJLOG WMS
 *
 * Features:
 * - Collapsible with smooth animations
 * - Expandable submenus
 * - Active state highlighting
 * - Search/filter functionality
 * - Ferretto theme (red + dark)
 * - Responsive design
 * - Badge support for notifications
 */
function Sidebar({ collapsed, onToggle }: SidebarProps): JSX.Element {
  const location = useLocation();
  const dispatch = useDispatch();
  const touchMode = useSelector(selectTouchMode);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    'rf-operations': true,
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toggle section expansion
  const toggleSection = (sectionId: string): void => {
    if (!collapsed) {
      setExpandedSections((prev) => ({
        ...prev,
        [sectionId]: !prev[sectionId],
      }));
    }
  };

  // Check if path is active
  const isPathActive = (path?: string): boolean => {
    if (!path) return false;
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    // Exact match for most paths to avoid highlighting multiple items
    return location.pathname === path;
  };

  // Check if section has active child
  const hasSectionActiveChild = (section: MenuItem): boolean => {
    if (section.path && isPathActive(section.path)) return true;
    if (section.children) {
      return section.children.some((child) => isPathActive(child.path));
    }
    return false;
  };

  // Filter menu items based on touch mode
  const filterByTouchMode = (items: MenuItem[]): MenuItem[] => {
    return items
      .map((item) => {
        // Hide if hideInTouchMode is true and touch mode is active
        if (touchMode && item.hideInTouchMode) {
          return null;
        }

        // Hide if showOnlyInTouchMode is true and touch mode is NOT active
        if (!touchMode && item.showOnlyInTouchMode) {
          return null;
        }

        // Process children recursively
        if (item.children) {
          const filteredChildren = filterByTouchMode(item.children);
          if (filteredChildren.length === 0) {
            return null; // Hide parent if all children are hidden
          }
          return {
            ...item,
            children: filteredChildren,
          };
        }

        return item;
      })
      .filter((item): item is MenuItem => item !== null);
  };

  // Filter menu items based on search query
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items
      .map((item) => {
        const matchesLabel = item.label.toLowerCase().includes(query);
        const matchesDescription = item.description?.toLowerCase().includes(query);

        // If parent matches, include all children
        if (matchesLabel || matchesDescription) {
          return item;
        }

        // Check if any children match
        if (item.children) {
          const filteredChildren = item.children.filter(
            (child) =>
              child.label.toLowerCase().includes(query) ||
              child.description?.toLowerCase().includes(query)
          );

          if (filteredChildren.length > 0) {
            return {
              ...item,
              children: filteredChildren,
              // Auto-expand sections with matching children
              forceExpanded: true,
            };
          }
        }

        return null;
      })
      .filter((item): item is MenuItem => item !== null);
  };

  // Apply filters in sequence: touch mode → search
  const touchFilteredMenu = filterByTouchMode(menuConfig);
  const filteredMenu = filterMenuItems(touchFilteredMenu);

  // Animation variants
  const sidebarVariants = {
    open: { width: '16rem' },
    closed: { width: '4rem' },
  };

  const submenuVariants = {
    open: {
      height: 'auto',
      opacity: 1,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2, delay: 0.1 },
      },
    },
    closed: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2 },
      },
    },
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? 'closed' : 'open'}
      initial={false}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-ferretto-dark shadow-ferretto-lg z-30 flex flex-col"
    >
      {/* Header with Logo - Rimosso perché ora c'è l'header principale sopra */}
      <div className="h-0 hidden border-b border-gray-700 px-4">
        {collapsed ? (
          <div className="w-10 h-10 bg-ferretto-red rounded flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-ferretto-red rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-xl font-bold leading-tight">EJLOG</span>
              <span className="text-gray-400 text-xs">WMS System</span>
            </div>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 bg-ferretto-red text-white rounded-full p-1.5 hover:bg-ferretto-red-dark transition-colors shadow-lg z-50 focus:outline-none focus:ring-2 focus:ring-ferretto-red-light"
        aria-label={collapsed ? 'Espandi menu' : 'Comprimi menu'}
      >
        <motion.svg
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </motion.svg>
      </button>

      {/* Search Bar (only when expanded) */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-gray-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cerca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-700 text-gray-100 text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-ferretto-red focus:ring-1 focus:ring-ferretto-red transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-600 rounded"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" style={{ scrollbarWidth: 'thin' }}>
        <ul className="space-y-1">
          {filteredMenu.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedSections[item.id] || item.forceExpanded;
            const isActive = hasSectionActiveChild(item);
            const Icon = item.icon;

            // Simple menu item (no children)
            if (!hasChildren) {
              return (
                <li key={item.id}>
                  <Link
                    to={item.path || '/'}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                      isPathActive(item.path)
                        ? 'bg-ferretto-red text-white shadow-md'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : ''}
                  >
                    {/* Active indicator */}
                    {isPathActive(item.path) && !collapsed && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r" />
                    )}

                    <Icon className="w-5 h-5 flex-shrink-0" />

                    {!collapsed && (
                      <>
                        <span className="text-sm font-medium flex-1">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-2 py-0.5 bg-ferretto-red-light text-white text-xs font-semibold rounded-full">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </>
                    )}

                    {/* Tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                        {item.label}
                      </div>
                    )}
                  </Link>
                </li>
              );
            }

            // Parent item with children
            return (
              <li key={item.id}>
                {/* Parent button */}
                <button
                  onClick={() => toggleSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />

                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left uppercase tracking-wide">
                        {item.label}
                      </span>
                      {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4 transition-transform" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 transition-transform" />
                      )}
                    </>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {item.label}
                    </div>
                  )}
                </button>

                {/* Submenu */}
                <AnimatePresence initial={false}>
                  {!collapsed && isExpanded && (
                    <motion.ul
                      variants={submenuVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      className="mt-1 ml-3 space-y-0.5 overflow-hidden border-l border-gray-600 pl-3"
                    >
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = isPathActive(child.path);

                        return (
                          <li key={child.id}>
                            <Link
                              to={child.path || '/'}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm group relative ${
                                isChildActive
                                  ? 'bg-ferretto-red text-white shadow-sm'
                                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                              }`}
                              title={child.description}
                            >
                              {/* Active indicator for child */}
                              {isChildActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white rounded-r" />
                              )}

                              {ChildIcon && <ChildIcon className="w-4 h-4 flex-shrink-0" />}
                              <span className="flex-1">{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        {/* No results message */}
        {!collapsed && searchQuery && filteredMenu.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Nessun risultato trovato</p>
            <p className="text-gray-500 text-xs mt-1">Prova con altri termini</p>
          </div>
        )}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-gray-700 bg-gray-800">
          {/* Touch Mode Toggle */}
          <div className="px-3 py-3 border-b border-gray-700">
            <button
              onClick={() => {
                dispatch(toggleTouchMode());
                toast.success(
                  !touchMode
                    ? 'Modalità Touch attivata'
                    : 'Modalità Touch disattivata'
                );
              }}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-2">
                <DevicePhoneMobileIcon className={`w-5 h-5 ${touchMode ? 'text-blue-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${touchMode ? 'text-blue-400' : 'text-gray-300'}`}>
                  Touch Mode
                </span>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out ${
                  touchMode
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-gray-600 border-gray-500'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    touchMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Version Info */}
          <div className="px-4 py-3">
            <div className="text-xs text-gray-400 text-center">
              <p className="font-semibold text-gray-300">Ferretto Group</p>
              <p className="mt-0.5">EJLOG WMS v1.0.0</p>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

export default Sidebar;

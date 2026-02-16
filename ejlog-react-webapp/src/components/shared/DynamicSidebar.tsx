// ============================================================================
// EJLOG WMS - Dynamic Sidebar Component
// Menu laterale con gestione permessi e struttura gerarchica
// ============================================================================

import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAppSelector } from '../../app/hooks';
import { filterMenuByPermissions, type MenuItem } from '../../config/menuConfig';
import { menuConfig } from '../../config/menuConfig';

interface DynamicSidebarProps {
  isOpen: boolean;
}

interface MenuItemComponentProps {
  item: MenuItem;
  depth?: number;
}

const MenuItemComponent: React.FC<MenuItemComponentProps> = ({ item, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const IconComponent = item.icon;
  const paddingLeft = depth === 0 ? 'pl-4' : `pl-${4 + depth * 4}`;

  // Se ha figli, è un menu espandibile
  if (hasChildren) {
    return (
      <li>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between ${paddingLeft} pr-4 py-3 hover:bg-ferretto-red/20 transition-colors text-left group`}
          aria-expanded={isExpanded}
          aria-label={`Toggle ${item.label} menu`}
        >
          <div className="flex items-center space-x-3">
            <IconComponent className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-ferretto-red rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 transition-transform" />
          ) : (
            <ChevronRight className="w-4 h-4 transition-transform" />
          )}
        </button>

        {/* Sottomenu */}
        {isExpanded && (
          <ul className="bg-ferretto-dark/30">
            {item.children!.map((child) => (
              <MenuItemComponent key={child.id} item={child} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // Menu item semplice con link
  return (
    <li>
      <NavLink
        to={item.path!}
        className={({ isActive }) =>
          `flex items-center space-x-3 ${paddingLeft} pr-4 py-3 hover:bg-ferretto-red/20 transition-colors group ${
            isActive ? 'bg-ferretto-red text-white' : ''
          }`
        }
        aria-label={item.label}
      >
        <IconComponent className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium">{item.label}</span>
        {item.badge && (
          <span className="ml-auto px-2 py-0.5 text-xs bg-ferretto-red rounded-full">
            {item.badge}
          </span>
        )}
      </NavLink>
    </li>
  );
};

const DynamicSidebar: React.FC<DynamicSidebarProps> = ({ isOpen }) => {
  const user = useAppSelector((state) => state.auth.user);

  // Filtra il menu in base ai permessi dell'utente
  const filteredMenu = useMemo(() => {
    if (!user) return [];
    return filterMenuByPermissions(menuConfig, {
      accessLevel: user.accessLevel,
      permissions: user.permissions,
    });
  }, [user]);

  if (!user) return null;

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 w-64 bg-ferretto-dark text-white transform transition-transform duration-300 z-40 overflow-hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Main navigation"
      role="navigation"
    >
      {/* User Info Section */}
      <div className="px-4 py-4 bg-ferretto-dark/50 border-b border-ferretto-red/30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-ferretto-red rounded-full flex items-center justify-center text-white font-bold">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.displayName}</p>
            <p className="text-xs text-gray-400 truncate">
              {user.accessLevel === 1
                ? 'Operatore'
                : user.accessLevel === 2
                ? 'Supervisore'
                : user.accessLevel === 3
                ? 'Amministratore'
                : 'System'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className="h-full overflow-y-auto py-2">
        {filteredMenu.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400">
            <p className="text-sm">Nessun menu disponibile</p>
            <p className="text-xs mt-2">Contatta l'amministratore</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {filteredMenu.map((item) => (
              <MenuItemComponent key={item.id} item={item} />
            ))}
          </ul>
        )}
      </nav>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-ferretto-dark/50 border-t border-ferretto-red/30">
        <p className="text-xs text-gray-400 text-center">EjLog WMS v1.0.0</p>
      </div>
    </aside>
  );
};

export default DynamicSidebar;

// ============================================================================
// EJLOG WMS - Header Component
// Header principale con menu utente e notifiche
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { useGetActiveAlarmsQuery } from '../../services/api/alarmsApi';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarCollapsed = false }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { data: activeAlarms } = useGetActiveAlarmsQuery({});

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const alarmCount = activeAlarms?.length || 0;
  const criticalAlarms = activeAlarms?.filter((a) => a.severity === 3).length || 0;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center px-4 sticky top-0 z-50">
      <div className="flex items-center flex-1">
        {/* Menu Toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 mr-4"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo e Titolo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-ferrRed rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">EjLog WMS</h1>
            <p className="text-xs text-gray-500">Ferretto System</p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* Allarmi */}
        <button
          onClick={() => navigate('/alarms')}
          className="relative p-2 rounded-lg hover:bg-gray-100"
          aria-label="Allarmi"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {alarmCount > 0 && (
            <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs text-white ${
              criticalAlarms > 0 ? 'bg-red-600' : 'bg-yellow-500'
            }`}>
              {alarmCount > 9 ? '9+' : alarmCount}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div className="flex items-center space-x-3 border-l pl-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.userName || user?.displayName || 'Utente'}</p>
            <div className="flex items-center justify-end space-x-1">
              <p className="text-xs text-gray-500">
                {user?.roles?.[0] || user?.accessLevel || 'Visualizzatore'}
              </p>
              {user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPERUSER') ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-ferrRed text-white">
                  SUPER
                </span>
              ) : null}
            </div>
          </div>
          <div className="relative group">
            <button className="w-10 h-10 rounded-full bg-ferrRed text-white flex items-center justify-center font-semibold">
              {(user?.userName || user?.displayName)?.charAt(0)?.toUpperCase() || 'U'}
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="py-1">
                <button
                  onClick={() => navigate('/profile')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profilo
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Impostazioni
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Esci
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

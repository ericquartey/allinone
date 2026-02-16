import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import StatCard from '../../../components/shared/StatCard';
import { useGetAlarmStatsQuery } from '../../../services/api/alarmsApi';
import { useGetUnreadCountQuery } from '../../../services/api/notificationsApi';
import { useGetStockStatsQuery } from '../../../services/api/stockApi';
import { useGetLoginStatsQuery, useGetUsersQuery } from '../../../services/api/usersApi';

const dashboardCards = [
  {
    id: 'users',
    title: 'Users',
    description: 'Manage users, roles, and permissions.',
    path: '/ppc/admin/users',
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Reporting dashboards and exports.',
    path: '/ppc/admin/reports',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Analytics and KPI dashboards.',
    path: '/ppc/admin/analytics',
  },
  {
    id: 'config',
    title: 'Config',
    description: 'Configuration and settings.',
    path: '/ppc/admin/config',
  },
  {
    id: 'system',
    title: 'System',
    description: 'System and operations monitoring.',
    path: '/ppc/admin/system',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Notification management.',
    path: '/ppc/admin/notifications',
  },
];

const PpcAdminDashboardPage: React.FC = () => {
  const { data: users, isLoading: usersLoading, isError: usersError } = useGetUsersQuery();
  const { data: unreadData, isLoading: unreadLoading, isError: unreadError } = useGetUnreadCountQuery();
  const { data: alarmStats, isLoading: alarmsLoading, isError: alarmsError } = useGetAlarmStatsQuery();
  const { data: loginStats, isLoading: loginLoading, isError: loginError } = useGetLoginStatsQuery({ days: 7 });
  const { data: stockStats, isLoading: stockLoading, isError: stockError } = useGetStockStatsQuery();

  const formatValue = (value?: number, format?: (val: number) => string): string | number => {
    if (typeof value !== 'number') {
      return 'N/A';
    }
    return format ? format(value) : value.toLocaleString();
  };

  const displayValue = (
    value: number | undefined,
    isLoading: boolean,
    isError: boolean,
    format?: (val: number) => string,
  ): string | number => {
    if (isLoading) {
      return '...';
    }
    if (isError) {
      return 'N/A';
    }
    return formatValue(value, format);
  };

  const criticalAlarms =
    alarmStats?.bySeverity?.CRITICAL ??
    alarmStats?.bySeverity?.critical;
  const loginStatsPayload = loginStats?.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PPC Admin Dashboard</h1>
          <p className="text-sm text-gray-600">
            Overview of admin tools and system controls.
          </p>
        </div>
        <Link to="/ppc/admin">
          <Button variant="secondary" size="sm">
            Admin Menu
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Users"
          value={displayValue(users?.length, usersLoading, usersError)}
          subtitle={!usersLoading && !usersError ? 'Total users' : undefined}
          color="blue"
        />
        <StatCard
          title="Unread Notifications"
          value={displayValue(unreadData?.unreadCount, unreadLoading, unreadError)}
          subtitle={!unreadLoading && !unreadError ? 'System alerts' : undefined}
          color="yellow"
        />
        <StatCard
          title="Active Alarms"
          value={displayValue(alarmStats?.totalActive, alarmsLoading, alarmsError)}
          subtitle={
            !alarmsLoading && !alarmsError && typeof criticalAlarms === 'number'
              ? `${criticalAlarms.toLocaleString()} critical`
              : undefined
          }
          color="red"
        />
        <StatCard
          title="Login Attempts (7d)"
          value={displayValue(loginStatsPayload?.totalAttempts, loginLoading, loginError)}
          subtitle={
            !loginLoading && !loginError && loginStatsPayload
              ? `${loginStatsPayload.successfulLogins.toLocaleString()} success, ${loginStatsPayload.failedLogins.toLocaleString()} failed`
              : undefined
          }
          color="purple"
        />
        <StatCard
          title="Unique Users (7d)"
          value={displayValue(loginStatsPayload?.uniqueUsers, loginLoading, loginError)}
          subtitle={!loginLoading && !loginError ? 'Login activity' : undefined}
          color="green"
        />
        <StatCard
          title="Stock Occupancy"
          value={displayValue(
            stockStats?.occupancyPercentage,
            stockLoading,
            stockError,
            (val) => `${val.toFixed(0)}%`,
          )}
          subtitle={
            !stockLoading && !stockError && typeof stockStats?.totalLocations === 'number'
              ? `${stockStats.totalLocations.toLocaleString()} locations`
              : undefined
          }
          color="gray"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => (
          <Card key={card.id} className="p-5" variant="outlined" hoverable>
            <div className="space-y-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">{card.title}</div>
                <div className="text-sm text-gray-600">{card.description}</div>
              </div>
              <Link to={card.path} className="inline-flex">
                <Button variant="primary" size="sm">
                  Open
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PpcAdminDashboardPage;

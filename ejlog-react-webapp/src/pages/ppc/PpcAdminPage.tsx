import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';

const adminActions = [
  {
    id: 'dashboard',
    title: 'Admin Dashboard',
    description: 'Overview of admin tools.',
    path: '/ppc/admin/dashboard',
  },
  {
    id: 'user-management',
    title: 'User Management',
    description: 'Manage users, roles, and permissions.',
    path: '/ppc/admin/users',
  },
  {
    id: 'users-management',
    title: 'Users Management (Module)',
    description: 'Complete users module overview.',
    path: '/users-management',
  },
  {
    id: 'users-list',
    title: 'Users List',
    description: 'Browse users list and details.',
    path: '/users-list',
  },
  {
    id: 'audit-log',
    title: 'Audit Log',
    description: 'Review system audit logs.',
    path: '/ppc/admin/audit-log',
  },
  {
    id: 'reports-builder',
    title: 'Report Builder',
    description: 'Create and manage reports.',
    path: '/ppc/admin/reports-builder',
  },
  {
    id: 'reports-dashboard',
    title: 'Reports Dashboard',
    description: 'Reporting overview and summaries.',
    path: '/reports',
  },
  {
    id: 'reports-section',
    title: 'Reports Section',
    description: 'PPC admin report tools.',
    path: '/ppc/admin/reports',
  },
  {
    id: 'system-section',
    title: 'System & Operations',
    description: 'System monitoring and operational tooling.',
    path: '/ppc/admin/system',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage system notifications.',
    path: '/ppc/admin/notifications',
  },
  {
    id: 'barcode-management',
    title: 'Barcode Management',
    description: 'Manage barcode configurations.',
    path: '/ppc/admin/barcodes',
  },
  {
    id: 'analytics-hub',
    title: 'Analytics Hub',
    description: 'Analytics and KPI dashboard hub.',
    path: '/analytics/hub',
  },
  {
    id: 'analytics-advanced',
    title: 'Analytics Advanced',
    description: 'Advanced analytics dashboards.',
    path: '/analytics/advanced',
  },
  {
    id: 'kpi-dashboard',
    title: 'KPI Dashboard',
    description: 'Operational KPI overview.',
    path: '/kpi/dashboard',
  },
  {
    id: 'analytics-section',
    title: 'Analytics Section',
    description: 'PPC admin analytics tools.',
    path: '/ppc/admin/analytics',
  },
  {
    id: 'settings-advanced',
    title: 'Advanced Settings',
    description: 'System-wide configuration settings.',
    path: '/ppc/admin/settings',
  },
  {
    id: 'config-areas',
    title: 'Areas Config',
    description: 'Manage areas configuration.',
    path: '/config/areas',
  },
  {
    id: 'config-users',
    title: 'Users Config',
    description: 'Manage system user settings.',
    path: '/config/users',
  },
  {
    id: 'config-section',
    title: 'Config Section',
    description: 'PPC admin configuration tools.',
    path: '/ppc/admin/config',
  },
  {
    id: 'list-templates',
    title: 'List Templates',
    description: 'Manage list templates.',
    path: '/list-templates',
  },
  {
    id: 'product-images',
    title: 'Product Images',
    description: 'Manage product images.',
    path: '/product-images',
  },
  {
    id: 'event-logs',
    title: 'Event Logs',
    description: 'View system event logs.',
    path: '/event-logs',
  },
];

const PpcAdminPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">PPC Admin</h1>
        <p className="text-sm text-gray-600">
          Administrative tools integrated into the PPC workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {adminActions.map((action) => (
          <Card key={action.id} className="p-5" variant="outlined" hoverable>
            <div className="space-y-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">{action.title}</div>
                <div className="text-sm text-gray-600">{action.description}</div>
              </div>
              <Link to={action.path} className="inline-flex">
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

export default PpcAdminPage;

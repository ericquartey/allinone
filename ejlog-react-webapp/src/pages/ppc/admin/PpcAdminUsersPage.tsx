import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import UserManagement from '../../UserManagement';

const quickLinks = [
  {
    id: 'users-list',
    title: 'Users List',
    description: 'Browse users list and details.',
    path: '/users-list',
  },
  {
    id: 'config-users',
    title: 'Users Config',
    description: 'Manage system user settings.',
    path: '/config/users',
  },
];

const PpcAdminUsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Admin User Management</h2>
          <p className="text-sm text-gray-600">
            PPC admin workspace for user management and permissions.
          </p>
        </div>
        <Link to="/admin/user-management">
          <Button variant="secondary" size="sm">
            Open Full Admin Page
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {quickLinks.map((action) => (
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

      <Card title="User Management" variant="outlined">
        <UserManagement />
      </Card>
    </div>
  );
};

export default PpcAdminUsersPage;

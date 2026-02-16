import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';

const configActions = [
  {
    id: 'config-home',
    title: 'Config Home',
    description: 'Overview of system configuration.',
    path: '/config',
  },
  {
    id: 'config-areas',
    title: 'Areas',
    description: 'Manage areas configuration.',
    path: '/config/areas',
  },
  {
    id: 'config-users',
    title: 'Users',
    description: 'Manage system user settings.',
    path: '/config/users',
  },
  {
    id: 'config-settings',
    title: 'Settings',
    description: 'Advanced system settings.',
    path: '/config/settings',
  },
];

const PpcAdminConfigPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Admin Config</h2>
        <p className="text-sm text-gray-600">Configuration tools for PPC admins.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {configActions.map((action) => (
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

export default PpcAdminConfigPage;

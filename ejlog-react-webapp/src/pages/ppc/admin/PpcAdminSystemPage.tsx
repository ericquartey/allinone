import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';

const systemActions = [
  {
    id: 'machines',
    title: 'Machines',
    description: 'Monitor machine status and details.',
    path: '/machines',
  },
  {
    id: 'plc',
    title: 'PLC Devices',
    description: 'PLC devices and signals.',
    path: '/plc',
  },
  {
    id: 'alarms',
    title: 'Alarms',
    description: 'Active alarms and history.',
    path: '/alarms',
  },
  {
    id: 'event-logs',
    title: 'Event Logs',
    description: 'Operational events and logs.',
    path: '/event-logs',
  },
  {
    id: 'equipment',
    title: 'Equipment Management',
    description: 'Maintenance schedules and equipment.',
    path: '/equipment/management',
  },
  {
    id: 'operations',
    title: 'Operations Hub',
    description: 'Operations overview and actions.',
    path: '/operations',
  },
];

const PpcAdminSystemPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">System & Operations</h2>
        <p className="text-sm text-gray-600">
          System monitoring and operational tooling for PPC admins.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {systemActions.map((action) => (
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

export default PpcAdminSystemPage;

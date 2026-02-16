import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';

const reportActions = [
  {
    id: 'reports-dashboard',
    title: 'Reports Dashboard',
    description: 'Reporting summaries and exports.',
    path: '/reports',
  },
  {
    id: 'report-builder',
    title: 'Report Builder',
    description: 'Create and manage reports.',
    path: '/admin/reports',
  },
  {
    id: 'event-logs',
    title: 'Event Logs',
    description: 'Operational events and log export.',
    path: '/event-logs',
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
];

const PpcAdminReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Admin Reports</h2>
        <p className="text-sm text-gray-600">Reporting tools and exports for PPC admins.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reportActions.map((action) => (
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

export default PpcAdminReportsPage;

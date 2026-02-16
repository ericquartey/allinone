import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';

const analyticsActions = [
  {
    id: 'analytics-hub',
    title: 'Analytics Hub',
    description: 'Analytics overview and navigation.',
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
    description: 'Operational KPIs and metrics.',
    path: '/kpi/dashboard',
  },
  {
    id: 'reports-dashboard',
    title: 'Reports Dashboard',
    description: 'Reporting summaries and exports.',
    path: '/reports',
  },
];

const PpcAdminAnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Admin Analytics</h2>
        <p className="text-sm text-gray-600">Analytics and KPI tools for PPC admins.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {analyticsActions.map((action) => (
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

export default PpcAdminAnalyticsPage;

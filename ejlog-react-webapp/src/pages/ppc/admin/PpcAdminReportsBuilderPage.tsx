import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import ReportBuilderPageEnhanced from '../../admin/ReportBuilderPageEnhanced';

const quickLinks = [
  {
    id: 'reports-dashboard',
    title: 'Reports Dashboard',
    description: 'Reporting summaries and exports.',
    path: '/reports',
  },
  {
    id: 'report-viewer',
    title: 'Report Viewer',
    description: 'Open a report by ID.',
    path: '/reports/1',
  },
];

const PpcAdminReportsBuilderPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Report Builder</h2>
          <p className="text-sm text-gray-600">
            PPC admin workspace for report creation and management.
          </p>
        </div>
        <Link to="/admin/reports">
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

      <Card title="Report Builder" variant="outlined">
        <ReportBuilderPageEnhanced />
      </Card>
    </div>
  );
};

export default PpcAdminReportsBuilderPage;

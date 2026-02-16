import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import AuditLogViewer from '../../AuditLogViewer';

const quickLinks = [
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage system notifications.',
    path: '/admin/notifications',
  },
  {
    id: 'event-logs',
    title: 'Event Logs',
    description: 'Operational events and logs.',
    path: '/event-logs',
  },
];

const PpcAdminAuditLogPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Audit Log</h2>
          <p className="text-sm text-gray-600">
            PPC admin workspace for audit logging and traceability.
          </p>
        </div>
        <Link to="/admin/audit-log">
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

      <Card title="Audit Log" variant="outlined">
        <AuditLogViewer />
      </Card>
    </div>
  );
};

export default PpcAdminAuditLogPage;

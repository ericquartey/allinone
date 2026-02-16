import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import BarcodeManagementPageEnhanced from '../../admin/BarcodeManagementPageEnhanced';

const quickLinks = [
  {
    id: 'barcode-management',
    title: 'Barcode Management (Full)',
    description: 'Open full barcode management page.',
    path: '/barcode/management-enhanced',
  },
  {
    id: 'barcode-demo',
    title: 'Barcode Demo',
    description: 'Test barcode scanner demo.',
    path: '/barcode-demo',
  },
];

const PpcAdminBarcodePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Barcode Management</h2>
          <p className="text-sm text-gray-600">
            PPC admin workspace for barcode configuration and testing.
          </p>
        </div>
        <Link to="/barcode/management-enhanced">
          <Button variant="secondary" size="sm">
            Open Full Page
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

      <Card title="Barcode Management" variant="outlined">
        <BarcodeManagementPageEnhanced />
      </Card>
    </div>
  );
};

export default PpcAdminBarcodePage;

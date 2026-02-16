import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';

// Import existing operation pages
import ReceivingManagementPage from '../receiving/ReceivingManagementPage';
import ShippingManagementPage from '../shipping/ShippingManagementPage';
import PutAwayManagementPage from '../putaway/PutAwayManagementPage';
import PackingOperationsPage from '../packing/PackingOperationsPage';
import DockManagementPage from '../dock/DockManagementPage';
import AppointmentSchedulingPage from '../appointments/AppointmentSchedulingPage';

type TabType = 'receiving' | 'shipping' | 'putaway' | 'packing' | 'dock' | 'appointments';

const OperationsHubPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('receiving');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'receiving', label: 'Receiving' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'putaway', label: 'Put-Away' },
    { id: 'packing', label: 'Packing' },
    { id: 'dock', label: 'Dock' },
    { id: 'appointments', label: 'Appointments' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'receiving':
        return <ReceivingManagementPage />;
      case 'shipping':
        return <ShippingManagementPage />;
      case 'putaway':
        return <PutAwayManagementPage />;
      case 'packing':
        return <PackingOperationsPage />;
      case 'dock':
        return <DockManagementPage />;
      case 'appointments':
        return <AppointmentSchedulingPage />;
      default:
        return <ReceivingManagementPage />;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Operations Hub</h1>
        <p className="text-gray-600 mt-2">Manage all warehouse operations in one place</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? 'border-ferretto-red text-ferretto-red'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default OperationsHubPage;

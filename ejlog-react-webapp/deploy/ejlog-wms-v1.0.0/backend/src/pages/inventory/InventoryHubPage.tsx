import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';

// Import existing pages
import StockPage from '../StockPage';
import StockMovementsPage from '../stock/StockMovementsPage';
import CycleCountPage from './CycleCountPage';
import InventoryAdjustmentsPage from '../adjustments/InventoryAdjustmentsPage';
import BatchManagementPage from '../batch/BatchManagementPage';

type TabType = 'stock' | 'movements' | 'cycle-count' | 'adjustments' | 'batch';

const InventoryHubPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('stock');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'stock', label: 'Stock Overview' },
    { id: 'movements', label: 'Movements' },
    { id: 'cycle-count', label: 'Cycle Count' },
    { id: 'adjustments', label: 'Adjustments' },
    { id: 'batch', label: 'Batch Management' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'stock':
        return <StockPage />;
      case 'movements':
        return <StockMovementsPage />;
      case 'cycle-count':
        return <CycleCountPage />;
      case 'adjustments':
        return <InventoryAdjustmentsPage />;
      case 'batch':
        return <BatchManagementPage />;
      default:
        return <StockPage />;
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
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-2">Track and manage warehouse inventory</p>
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

export default InventoryHubPage;

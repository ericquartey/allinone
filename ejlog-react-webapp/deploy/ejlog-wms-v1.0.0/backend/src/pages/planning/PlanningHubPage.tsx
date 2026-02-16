import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';

// Import existing pages
import WavePlanningPage from '../waves/WavePlanningPage';
import ReplenishmentPlanningPage from '../replenishment/ReplenishmentPlanningPage';
import DemandForecastingPage from '../forecasting/DemandForecastingPage';
import SlottingOptimizationPage from '../slotting/SlottingOptimizationPage';
import OrderConsolidationPage from '../consolidation/OrderConsolidationPage';
import TaskAssignmentPage from '../tasks/TaskAssignmentPage';

type TabType = 'waves' | 'replenishment' | 'forecasting' | 'slotting' | 'consolidation' | 'tasks';

const PlanningHubPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('waves');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'waves', label: 'Wave Planning' },
    { id: 'replenishment', label: 'Replenishment' },
    { id: 'forecasting', label: 'Demand Forecasting' },
    { id: 'slotting', label: 'Slotting' },
    { id: 'consolidation', label: 'Order Consolidation' },
    { id: 'tasks', label: 'Task Management' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'waves':
        return <WavePlanningPage />;
      case 'replenishment':
        return <ReplenishmentPlanningPage />;
      case 'forecasting':
        return <DemandForecastingPage />;
      case 'slotting':
        return <SlottingOptimizationPage />;
      case 'consolidation':
        return <OrderConsolidationPage />;
      case 'tasks':
        return <TaskAssignmentPage />;
      default:
        return <WavePlanningPage />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Planning & Optimization</h1>
        <p className="text-gray-600 mt-2">Plan and optimize warehouse operations</p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-ferretto-red text-ferretto-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">{renderContent()}</div>
    </div>
  );
};

export default PlanningHubPage;

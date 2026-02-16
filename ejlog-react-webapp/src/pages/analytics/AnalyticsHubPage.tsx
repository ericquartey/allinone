import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';

// Import existing pages
import KPIDashboardPage from '../kpi/KPIDashboardPage';
import ReportsDashboardPage from '../reports/ReportsDashboardPage';
import PerformanceMetricsPage from '../metrics/PerformanceMetricsPage';
import AlertsDashboardPage from '../alerts/AlertsDashboardPage';

type TabType = 'kpi' | 'reports' | 'metrics' | 'alerts';

const AnalyticsHubPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('kpi');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'kpi', label: 'KPI Dashboard' },
    { id: 'reports', label: 'Reports' },
    { id: 'metrics', label: 'Performance Metrics' },
    { id: 'alerts', label: 'Alerts & Notifications' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'kpi':
        return <KPIDashboardPage />;
      case 'reports':
        return <ReportsDashboardPage />;
      case 'metrics':
        return <PerformanceMetricsPage />;
      case 'alerts':
        return <AlertsDashboardPage />;
      default:
        return <KPIDashboardPage />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor performance and analyze warehouse data</p>
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

export default AnalyticsHubPage;

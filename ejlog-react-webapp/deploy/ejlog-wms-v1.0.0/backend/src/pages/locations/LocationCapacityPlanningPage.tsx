// ============================================================================
// EJLOG WMS - Location Capacity Planning Page
// Dedicated page for capacity planning and optimization
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import Select from '../../components/shared/Select';
import LocationCapacityPlanner from '../../components/locations/LocationCapacityPlanner';
import { useGetWarehousesQuery } from '../../services/api/locationApi';

const LocationCapacityPlanningPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  const { data: warehouses } = useGetWarehousesQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Capacity Planning</h1>
          <p className="text-sm text-gray-500 mt-1">
            Analisi e pianificazione capacità ubicazioni con proiezioni di crescita
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/locations')}>
            ← Back to Locations
          </Button>
        </div>
      </div>

      {/* Warehouse Selector */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Scope Selection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse
            </label>
            <Select
              value={selectedWarehouseId}
              onChange={(e) => {
                setSelectedWarehouseId(e.target.value);
                setSelectedZoneId(''); // Reset zone on warehouse change
              }}
              options={[
                { value: '', label: 'All Warehouses' },
                ...(warehouses?.map(w => ({ value: w.id, label: w.name })) || []),
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zone (Optional)
            </label>
            <Select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              disabled={!selectedWarehouseId}
              options={[
                { value: '', label: 'All Zones' },
                // Zones would be loaded based on selectedWarehouseId
              ]}
            />
          </div>
        </div>
      </div>

      {/* Capacity Planner Component */}
      <LocationCapacityPlanner
        warehouseId={selectedWarehouseId || undefined}
        zoneId={selectedZoneId || undefined}
      />

      {/* Help & Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📚 How to Use Capacity Planning
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>1. Select Scope:</strong> Choose warehouse and optionally a specific zone to analyze.
          </p>
          <p>
            <strong>2. Choose Scenario:</strong> Select a predefined growth scenario or enter custom growth percentage.
          </p>
          <p>
            <strong>3. Review Metrics:</strong> Analyze current capacity, projected utilization, and days until full.
          </p>
          <p>
            <strong>4. Follow Recommendations:</strong> Address critical bottlenecks and optimize underutilized locations.
          </p>
          <p>
            <strong>5. Export Report:</strong> Generate JSON or PDF reports for documentation and planning.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationCapacityPlanningPage;

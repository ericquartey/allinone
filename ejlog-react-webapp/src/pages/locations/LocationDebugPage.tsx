// ============================================================================
// EJLOG WMS - Location Debug Page
// Dedicated page for location debugging with advanced diagnostics
// ============================================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import LocationDebugger from '../../components/locations/LocationDebugger';

const LocationDebugPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  if (!code) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Location Debugger</h1>
          <Button variant="ghost" onClick={() => navigate('/locations')}>
            ← Back to Locations
          </Button>
        </div>
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">Please provide a location code in the URL</p>
          <p className="text-sm text-yellow-600 mt-2">
            Example: /locations/debug/A01-02-03
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Location Debugger</h1>
          <p className="text-sm text-gray-500 mt-1">
            Advanced debugging and diagnostics for location {code}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate(`/locations/${code}`)}>
          ← Back to Details
        </Button>
      </div>

      <LocationDebugger
        locationCode={code}
        onClose={() => navigate(`/locations/${code}`)}
      />
    </div>
  );
};

export default LocationDebugPage;

// ============================================================================
// EJLOG WMS - Page Loader Component
// Fallback component for React.lazy Suspense boundaries
// ============================================================================

import React from 'react';

const PageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-ferrari-red"></div>
        <p className="mt-4 text-gray-600">Caricamento...</p>
      </div>
    </div>
  );
};

export default PageLoader;

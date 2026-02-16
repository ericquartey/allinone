// Test page - completamente vuota
import React from 'react';

const TestSimplePage: React.FC = () => {
  console.log('[TestSimplePage] Rendering...');

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">Test Simple Page</h1>
        <p className="mt-4 text-gray-600">Se vedi questo messaggio, la pagina è accessibile!</p>
        <p className="mt-2 text-sm text-gray-500">URL: {window.location.href}</p>
      </div>
    </div>
  );
};

export default TestSimplePage;

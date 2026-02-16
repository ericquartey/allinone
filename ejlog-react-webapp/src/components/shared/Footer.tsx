// ============================================================================
// EJLOG WMS - Footer Component
// Footer applicazione
// ============================================================================

import React from 'react';
import { useGetVersionQuery } from '../../services/api/versionApi';

const Footer: React.FC = () => {
  const { data: version } = useGetVersionQuery();

  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div>
          <span className="font-semibold">EjLog WMS</span> by Ferretto Group
        </div>
        <div className="flex items-center space-x-4">
          {version && (
            <span>
              v{version.version} - {version.environment}
            </span>
          )}
          <span>{new Date().getFullYear()} - Tutti i diritti riservati</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

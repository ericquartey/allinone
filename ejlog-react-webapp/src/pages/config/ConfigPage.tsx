// ============================================================================
// EJLOG WMS - Config Page
// Hub configurazione sistema
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';

const ConfigPage: React.FC = () => {
  const navigate = useNavigate();

  const configSections = [
    {
      title: 'Aree Magazzino',
      description: 'Gestione aree e zone del magazzino',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      path: '/config/areas',
    },
    {
      title: 'Utenti',
      description: 'Gestione utenti e permessi',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      path: '/config/users',
    },
    {
      title: 'Parametri Sistema',
      description: 'Configurazione parametri globali',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      path: '/config/parameters',
    },
    {
      title: 'Stampanti',
      description: 'Configurazione stampanti ed etichette',
      icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z',
      path: '/config/printers',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurazione</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {configSections.map((section) => (
          <Card key={section.path}>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-8 h-8 text-ferrGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{section.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate(section.path)}
                >
                  Configura
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ConfigPage;

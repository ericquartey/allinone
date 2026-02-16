// ============================================================================
// EJLOG WMS - Reports Page
// Hub report e analisi
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();

  const reports = [
    {
      id: 'stock',
      title: 'Report Giacenze',
      description: 'Analisi completa delle giacenze per articolo, ubicazione e lotto',
      icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
      path: '/reports/stock',
    },
    {
      id: 'movements',
      title: 'Report Movimenti',
      description: 'Storico movimenti e analisi flussi di magazzino',
      icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      path: '/reports/movements',
    },
    {
      id: 'lists',
      title: 'Report Liste',
      description: 'Statistiche esecuzione liste e performance',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      path: '/reports/lists',
    },
    {
      id: 'productivity',
      title: 'Report Produttività',
      description: 'Analisi KPI e produttività operatori',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      path: '/reports/productivity',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Report e Analisi</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Card
            key={report.path}
            data-testid={`${report.id}-report-card`}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(report.path)}
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-ferrRed/10 rounded-lg">
                <svg className="w-8 h-8 text-ferrRed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={report.icon} />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{report.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                <div className="mt-3 text-sm text-ferrRed font-medium">
                  Visualizza Report →
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;

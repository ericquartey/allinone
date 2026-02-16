import React from 'react';
import { Link } from 'react-router-dom';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { ppcViews } from '../../../features/ppc/ppcViews';

const getRoute = (viewName: string): string => {
  const match = ppcViews.find(
    (view) => view.moduleSlug === 'operator' && view.view === viewName
  );
  return match?.route || '/ppc/operator';
};

const statisticsActions = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Operational overview dashboard.',
    path: getRoute('StatisticsGeneralDataView'),
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Advanced analytics and KPIs.',
    path: getRoute('StatisticsMachineView'),
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Operational reports and exports.',
    path: getRoute('StatisticsErrorsView'),
  },
  {
    id: 'events',
    title: 'Event Logs',
    description: 'Event log review and filtering.',
    path: getRoute('StatisticsNavigationView'),
  },
];

const PpcOperatorStatisticsPage: React.FC = () => {
  return (
    <div className="ppc-page">
      <div className="ppc-accessories__title">
        <span>{ppcT('OperatorApp.Statistics', 'Statistiche')}</span>
      </div>
      <div className="ppc-accessories__description">
        {ppcT('OperatorApp.StatisticsDescription', 'Statistiche e monitoraggio operatore.')}
      </div>

      <div className="ppc-menu-card-grid">
        {statisticsActions.map((action) => (
          <div key={action.id} className="ppc-menu-card">
            <div className="ppc-menu-card__abbr">{ppcT('General.Open', 'Apri')}</div>
            <div className="ppc-menu-card__title">{action.title}</div>
            <div className="ppc-menu-card__desc">{action.description}</div>
            <Link to={action.path} className="ppc-installation-footer__button">
              {ppcT('General.Open', 'Apri')}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PpcOperatorStatisticsPage;

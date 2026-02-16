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

const aboutActions = [
  {
    id: 'general',
    title: 'General Info',
    description: 'System overview and operator info.',
    path: getRoute('GeneralView'),
  },
  {
    id: 'diagnostics',
    title: 'Diagnostics',
    description: 'Operational diagnostics and status checks.',
    path: getRoute('DiagnosticsView'),
  },
  {
    id: 'statistics',
    title: 'Statistics',
    description: 'Operational statistics and KPIs.',
    path: getRoute('StatisticsView'),
  },
  {
    id: 'logs',
    title: 'Logs Export',
    description: 'Review logs and export reports.',
    path: getRoute('LogsExportView'),
  },
  {
    id: 'alarms',
    title: 'Alarms',
    description: 'Active alarms and history.',
    path: getRoute('AlarmView'),
  },
];

const PpcOperatorAboutPage: React.FC = () => {
  return (
    <div className="ppc-page">
      <div className="ppc-accessories__title">
        <span>{ppcT('OperatorApp.About', 'Informazioni')}</span>
      </div>
      <div className="ppc-accessories__description">
        {ppcT('OperatorApp.AboutDescription', 'Informazioni sistema e diagnostica.')}
      </div>

      <div className="ppc-menu-card-grid">
        {aboutActions.map((action) => (
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

export default PpcOperatorAboutPage;

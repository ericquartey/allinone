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

const othersActions = [
  {
    id: 'menu-navigation',
    title: 'Menu Navigation',
    description: 'Navigate auxiliary operator functions.',
    path: getRoute('MenuNavigationView'),
  },
  {
    id: 'loading-units',
    title: 'Loading Units',
    description: 'Open loading units overview.',
    path: getRoute('LoadingUnitsMissionsView'),
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    description: 'Maintenance workflow and details.',
    path: getRoute('MaintenanceView'),
  },
  {
    id: 'statistics',
    title: 'Statistics',
    description: 'Operational statistics and dashboards.',
    path: getRoute('StatisticsNavigationView'),
  },
  {
    id: 'alarms',
    title: 'Alarms',
    description: 'Monitor alarms and fault history.',
    path: getRoute('AlarmView'),
  },
  {
    id: 'operations',
    title: 'Operations',
    description: 'Return to operator operations hub.',
    path: getRoute('OperatorMenuView'),
  },
];

const PpcOperatorOthersPage: React.FC = () => {
  return (
    <div className="ppc-page">
      <div className="ppc-accessories__title">
        <span>{ppcT('OperatorApp.Other', 'Altro')}</span>
      </div>
      <div className="ppc-accessories__description">
        {ppcT('OperatorApp.OtherDescription', 'Funzioni secondarie e utilità operatore.')}
      </div>

      <div className="ppc-menu-card-grid">
        {othersActions.map((action) => (
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

export default PpcOperatorOthersPage;

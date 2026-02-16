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

const loadingUnitActions = [
  {
    id: 'udc-list',
    title: 'Loading Units',
    description: 'UDC list and loading unit details.',
    path: getRoute('LoadingUnitView'),
  },
  {
    id: 'locations',
    title: 'Locations',
    description: 'Inspect locations and inventory placement.',
    path: getRoute('LoadingUnitsMissionsView'),
  },
  {
    id: 'movements',
    title: 'Movements',
    description: 'Review movements affecting loading units.',
    path: getRoute('LoadingUnitMissionDataGridView'),
  },
];

const PpcOperatorLoadingUnitsPage: React.FC = () => {
  return (
    <div className="ppc-page">
      <div className="ppc-accessories__title">
        <span>{ppcT('Menu.MenuLoadingUnits', 'Cassetti')}</span>
      </div>
      <div className="ppc-accessories__description">
        {ppcT('OperatorApp.LoadingUnitsDescription', 'Navigazione cassetti e missioni.')}
      </div>

      <div className="ppc-menu-card-grid">
        {loadingUnitActions.map((action) => (
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

export default PpcOperatorLoadingUnitsPage;

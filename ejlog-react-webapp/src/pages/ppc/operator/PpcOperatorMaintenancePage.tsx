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

const maintenanceActions = [
  {
    id: 'equipment',
    title: 'Equipment Management',
    description: 'Maintain equipment and schedules.',
    path: getRoute('MaintenanceView'),
  },
  {
    id: 'machines',
    title: 'Machines',
    description: 'Machine status and details.',
    path: getRoute('MaintenanceDetailView'),
  },
  {
    id: 'alarms',
    title: 'Alarms',
    description: 'Alarm monitoring and history.',
    path: getRoute('AlarmView'),
  },
  {
    id: 'events',
    title: 'Event Logs',
    description: 'Maintenance events and logs.',
    path: getRoute('LogsExportView'),
  },
];

const PpcOperatorMaintenancePage: React.FC = () => {
  return (
    <div className="ppc-page">
      <div className="ppc-accessories__title">
        <span>{ppcT('MainMenu.Maintenance', 'Manutenzione')}</span>
      </div>
      <div className="ppc-accessories__description">
        {ppcT('OperatorApp.MaintenanceDescription', 'Flussi manutenzione e diagnostica.')}
      </div>

      <div className="ppc-menu-card-grid">
        {maintenanceActions.map((action) => (
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

export default PpcOperatorMaintenancePage;

import React from 'react';
import PpcMenuButton from '../../../components/ppc/PpcMenuButton';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcMachineStatus from '../../../hooks/usePpcMachineStatus';

const PpcMaintenanceMenuPage: React.FC = () => {
  const now = new Date();
  const time = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('it-IT');
  const { identity } = usePpcMachineStatus({ pollIntervalMs: 5000 });
  const modelName = identity?.ModelName || 'ModelName';
  const serialNumber = identity?.SerialNumber || 'SerialNumber';

  return (
    <div className="ppc-main-menu">
      <div className="ppc-main-menu__clock">
        <div className="ppc-main-menu__time">{time}</div>
        <div className="ppc-main-menu__date">{date}</div>
      </div>

      <div className="ppc-main-menu__title">
        <div className="ppc-main-menu__model">{modelName}</div>
        <div className="ppc-main-menu__serial">
          {ppcT('General.SerialNumber', 'Serial Number')} {serialNumber}
        </div>
      </div>

      <div
        className="ppc-main-menu__grid"
        style={{ backgroundImage: "url('/ppc-assets/bkg_login.jpg')" }}
      >
        <PpcMenuButton
          title={ppcT('MaintenanceMenu.Maintenance', 'Maintenance')}
          abbreviation={ppcT('MaintenanceMenu.MaintenanceAbbreviation', 'MA')}
          description={ppcT('MaintenanceMenu.MaintenanceDescription', '')}
          number="2.1"
          accentColor="var(--ppc-orange)"
        />
        <PpcMenuButton
          title={ppcT('MaintenanceMenu.Compaction', 'Compaction')}
          abbreviation={ppcT('MaintenanceMenu.CompactionAbbreviation', 'CO')}
          description={ppcT('MaintenanceMenu.CompactionDescription', '')}
          number="2.3"
          accentColor="var(--ppc-orange)"
        />
        <PpcMenuButton
          title={ppcT('MaintenanceMenu.Updating', 'Updating')}
          abbreviation={ppcT('MaintenanceMenu.UpdatingAbbreviation', 'UP')}
          description={ppcT('MaintenanceMenu.UpdatingDescription', '')}
          number="2.2"
          accentColor="var(--ppc-orange)"
        />
      </div>
    </div>
  );
};

export default PpcMaintenanceMenuPage;

import React, { useEffect, useState } from 'react';
import { Grid3x3, MoreHorizontal, Sparkles, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PpcMenuButton from '../../../components/ppc/PpcMenuButton';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcMachineStatus from '../../../hooks/usePpcMachineStatus';
import { usePermissions } from '../../../hooks/usePermissions';

const PpcMainMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const { identity, bayNumber } = usePpcMachineStatus({ pollIntervalMs: 2000 });
  const { isOperator } = usePermissions();
  const time = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('it-IT');
  const modelName = identity?.ModelName || 'ModelName';
  const serialNumber = identity?.SerialNumber || 'SerialNumber';
  const showMovements = isOperator;
  const mainColors = {
    pick: '#0b6fb1',
    info: '#0f8b3f',
    maintenance: '#d58412',
    installation: '#b61f23',
  };

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="ppc-main-menu">
      <div className="ppc-main-menu__header">
        <div className="ppc-main-menu__title">
          <div className="ppc-main-menu__model">{modelName}</div>
          <div className="ppc-main-menu__serial">
            {ppcT('General.SerialNumber', 'Numero Seriale:')} {serialNumber}
          </div>
        </div>

        <div className="ppc-main-menu__clock">
          <div className="ppc-main-menu__time">{time}</div>
          <div className="ppc-main-menu__date">{date}</div>
        </div>
      </div>

      <div className="ppc-main-menu__grid ppc-main-menu__grid--main">
        <div className="ppc-main-menu__cell ppc-main-menu__cell--top-left">
          <PpcMenuButton
            title={ppcT('MainMenu.Operation', 'Picking')}
            abbreviation={ppcT('MainMenu.OperationAbbreviation', 'PICK')}
            description={ppcT('MainMenu.OperationDescription', 'Prelievo, versamento, inventario')}
            number="01"
            accentColor={mainColors.pick}
            icon={<User size={28} />}
            onClick={() => navigate('/ppc/operator/operator-menu')}
            variant="main"
          />
        </div>
        <div className="ppc-main-menu__cell ppc-main-menu__cell--top-right">
          <PpcMenuButton
            title={ppcT('MainMenu.About', 'Informazioni')}
            abbreviation={ppcT('MainMenu.AboutAbbreviation', 'INFO')}
            description={ppcT('MainMenu.AboutDescription', 'Statistiche, allarmi, diagnostica')}
            number="03"
            accentColor={mainColors.info}
            icon={<Grid3x3 size={28} />}
            onClick={() => navigate('/ppc/operator/about-menu-navigation')}
            variant="main"
          />
        </div>
        <div className="ppc-main-menu__cell ppc-main-menu__cell--bottom-left">
          <PpcMenuButton
            title={ppcT('MainMenu.Maintenance', 'Manutenzione')}
            abbreviation={ppcT('MainMenu.MaintenanceAbbreviation', 'MAINT')}
            description={ppcT('MainMenu.MaintenanceDescription', 'Manutenzione, compattazione cassetti, aggiornamento')}
            number="02"
            accentColor={mainColors.maintenance}
            icon={<MoreHorizontal size={28} />}
            onClick={() => navigate('/ppc/menu/maintenance-menu')}
            variant="main"
          />
        </div>
        <div className="ppc-main-menu__cell ppc-main-menu__cell--bottom-right">
          {showMovements ? (
            <PpcMenuButton
              title={ppcT('MainMenu.Movements', 'Movimenti')}
              abbreviation={ppcT('MainMenu.MovementsAbbreviation', 'MOVE')}
              description={ppcT('MainMenu.MovementsDescription', 'Stato sensori, reset macchina, altro')}
              number="04"
              accentColor={mainColors.installation}
              icon={<Sparkles size={28} />}
              onClick={() => navigate('/ppc/installation/movements')}
              variant="main"
            />
          ) : (
            <PpcMenuButton
              title={ppcT('MainMenu.Installation', 'Installazione')}
              abbreviation={ppcT('MainMenu.InstallationAbbreviation', 'INST')}
              description={ppcT('MainMenu.InstallationDescription', 'Procedure di installazione, movimenti manuali, altro')}
              number="04"
              accentColor={mainColors.installation}
              icon={<Sparkles size={28} />}
              onClick={() => navigate('/ppc/menu/installation-menu')}
              variant="main"
            />
          )}
        </div>
      </div>

      <div className="ppc-main-menu__bay">
        <span>
          {ppcT('InstallationApp.Bay', 'Baia')} {bayNumber}
        </span>
      </div>
    </div>
  );
};

export default PpcMainMenuPage;

import React, { useEffect, useMemo, useState } from 'react';
import { ThumbsUp, ListChecks, Search, CircleUserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PpcMenuButton from '../../../components/ppc/PpcMenuButton';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcMachineStatus from '../../../hooks/usePpcMachineStatus';
import { ppcViews } from '../../../features/ppc/ppcViews';

const getRoute = (viewName: string): string => {
  const match = ppcViews.find(
    (view) => view.moduleSlug === 'operator' && view.view === viewName
  );
  return match?.route || '/ppc/operator';
};

const PpcOperatorMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const { identity } = usePpcMachineStatus({ pollIntervalMs: 2000 });
  const time = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('it-IT');
  const modelName = identity?.ModelName || 'ModelName';
  const serialNumber = identity?.SerialNumber || 'SerialNumber';
  const accentBlue = '#0b6fb1';

  const menuItems = useMemo(
    () => [
      {
        title: ppcT('OperatorApp.NavigationMainMenuDrawerOperation', 'Operazioni su cassetto'),
        abbreviation: ppcT('OperatorApp.NavigationMainMenuDrawerOperationAbbreviation', 'PICK'),
        description: ppcT('OperatorApp.NavigationMainMenuDrawerOperationDescription', 'Prelievo'),
        number: '1.1',
        icon: <ThumbsUp size={28} />,
        route: getRoute('ItemOperationWaitView'),
        cellClass: 'ppc-main-menu__cell--top-left',
      },
      {
        title: ppcT('OperatorApp.NavigationMainMenuItems', 'Ricerca articolo'),
        abbreviation: ppcT('OperatorApp.NavigationMainMenuItemsAbbreviation', 'ITEM'),
        description: ppcT(
          'OperatorApp.NavigationMainMenuItemsDescription',
          'Ricerca e richiama articoli'
        ),
        number: '1.3',
        icon: <Search size={28} />,
        route: getRoute('ItemSearchMainView'),
        cellClass: 'ppc-main-menu__cell--top-right',
      },
      {
        title: ppcT('OperatorApp.NavigationMainMenuLists', 'Liste in attesa'),
        abbreviation: ppcT('OperatorApp.NavigationMainMenuListsAbbreviation', 'LIST'),
        description: ppcT(
          'OperatorApp.NavigationMainMenuListsDescription',
          'Esecuzione/sospensione di liste'
        ),
        number: '1.2',
        icon: <ListChecks size={28} />,
        route: getRoute('WaitingListsView'),
        cellClass: 'ppc-main-menu__cell--bottom-left',
      },
      {
        title: ppcT('OperatorApp.OtherNavigationImmediateDrawerCall', 'Chiamata cassetto'),
        abbreviation: ppcT('OperatorApp.OtherNavigationImmediateDrawerCallAbbreviation', 'DRAW'),
        description: ppcT(
          'OperatorApp.OtherNavigationImmediateDrawerCallDescription',
          'Operazioni su cassetto'
        ),
        number: '1.4',
        icon: <CircleUserRound size={28} />,
        route: getRoute('ImmediateLoadingUnitCallView'),
        cellClass: 'ppc-main-menu__cell--bottom-right',
      },
    ],
    []
  );

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
        {menuItems.map((item) => (
          <div key={item.number} className={`ppc-main-menu__cell ${item.cellClass}`}>
            <PpcMenuButton
              title={item.title}
              abbreviation={item.abbreviation}
              description={item.description}
              number={item.number}
              accentColor={accentBlue}
              icon={item.icon}
              onClick={() => navigate(item.route)}
              variant="main"
            />
          </div>
        ))}
      </div>

      <div className="ppc-main-menu__back">
        <button
          type="button"
          className="ppc-main-menu__back-button"
          onClick={() => navigate('/ppc/menu/main-menu')}
        >
          {ppcT('General.Back', 'Indietro')}
        </button>
      </div>
    </div>
  );
};

export default PpcOperatorMenuPage;

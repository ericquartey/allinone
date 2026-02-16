import React from 'react';
import PpcInstallationNavMenu from '../../../components/ppc/PpcInstallationNavMenu';
import PpcInstallationNavFooter from '../../../components/ppc/PpcInstallationNavFooter';
import PpcMenuCard from '../../../components/ppc/PpcMenuCard';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcLoadingUnitsMenuPage: React.FC = () => {
  return (
    <div className="ppc-installation-layout">
      <div className="ppc-installation-layout__nav">
        <PpcInstallationNavMenu activeKey="loading-units" />
      </div>

      <div className="ppc-installation-layout__content">
        <div className="ppc-installation-layout__title">
          {ppcT('Menu.UnitsMenuName', 'Units')}
        </div>

        <div className="ppc-menu-card-grid">
          <PpcMenuCard
            title={ppcT('InstallationApp.UnitManageMenuTitle', 'Unit manage')}
            abbreviation="4.5.1"
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.InsertMenuTitle', 'Insert')}
            abbreviation="4.5.2"
            description={ppcT('InstallationApp.InsertMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.RemoveMenuTitle', 'Remove')}
            abbreviation="4.5.3"
            description={ppcT('InstallationApp.RemoveMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.MoveCellToCellMenuTitle', 'Move cell to cell')}
            abbreviation="4.5.4"
            description={ppcT('InstallationApp.MoveCellToCellMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.MoveBayToBayMenuTitle', 'Move bay to bay')}
            abbreviation="4.5.5"
            description={ppcT('InstallationApp.MoveBayToBayMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.CompleteTestMenuTitle', 'Complete test')}
            abbreviation="4.5.6"
          />
          <PpcMenuCard
            title={ppcT('OperatorApp.LogLoadingUnits', 'Log loading units')}
            abbreviation="4.5.7"
          />
        </div>

        <div className="ppc-installation-layout__footer">
          <PpcInstallationNavFooter />
        </div>
      </div>
    </div>
  );
};

export default PpcLoadingUnitsMenuPage;

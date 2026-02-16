import React from 'react';
import PpcInstallationNavMenu from '../../../components/ppc/PpcInstallationNavMenu';
import PpcInstallationNavFooter from '../../../components/ppc/PpcInstallationNavFooter';
import PpcMenuCard from '../../../components/ppc/PpcMenuCard';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcCellsMenuPage: React.FC = () => {
  return (
    <div className="ppc-installation-layout">
      <div className="ppc-installation-layout__nav">
        <PpcInstallationNavMenu activeKey="cells" />
      </div>

      <div className="ppc-installation-layout__content">
        <div className="ppc-installation-layout__title">
          {ppcT('Menu.CellsMenuName', 'Cells')}
        </div>

        <div className="ppc-menu-card-grid">
          <PpcMenuCard
            title={ppcT('InstallationApp.CellManagerMenuTitle', 'Cell manager')}
            abbreviation="4.4.1"
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.CheckCellDimensionMenuTitle', 'Check cell dimension')}
            abbreviation="4.4.2"
            description={ppcT('InstallationApp.CheckCellDimensionMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.NewCellsControl', 'New cells control')}
            abbreviation="4.4.3"
            description={ppcT('InstallationApp.CheckCellDimensionMenuDescription', '')}
            accentColor="purple"
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.CellTestMenuTitle', 'Cell test')}
            abbreviation="4.4.5"
            description={ppcT('InstallationApp.CellTestMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.FixBackDrawers', 'Fix back drawers')}
            abbreviation="4.4.6"
            description={ppcT('InstallationApp.FixBackDrawersDescription', '')}
            accentColor="var(--ppc-orange)"
          />
        </div>

        <div className="ppc-installation-layout__footer">
          <PpcInstallationNavFooter />
        </div>
      </div>
    </div>
  );
};

export default PpcCellsMenuPage;

import React from 'react';
import PpcInstallationNavMenu from '../../../components/ppc/PpcInstallationNavMenu';
import PpcInstallationNavFooter from '../../../components/ppc/PpcInstallationNavFooter';
import PpcMenuCard from '../../../components/ppc/PpcMenuCard';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcElevatorMenuPage: React.FC = () => {
  return (
    <div className="ppc-installation-layout">
      <div className="ppc-installation-layout__nav">
        <PpcInstallationNavMenu activeKey="elevator" />
      </div>

      <div className="ppc-installation-layout__content">
        <div className="ppc-installation-layout__title">
          {ppcT('Menu.ElevatorMenuName', 'Elevator')}
        </div>

        <div className="ppc-menu-card-grid">
          <PpcMenuCard
            title={ppcT('InstallationApp.VerticalAxisOriginMenuTitle', 'Vertical axis origin')}
            abbreviation="4.2.1"
            description={ppcT('InstallationApp.VerticalAxisOriginMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.ResolutionVerticalAxisMenuTitle', 'Vertical axis resolution')}
            abbreviation="4.2.2"
            description={ppcT('InstallationApp.ResolutionVerticalAxisMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.BeltBreakInMenuTitle', 'Belt break-in')}
            abbreviation="4.2.3"
            description={ppcT('InstallationApp.BeltBreakInMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.OffsetVerticalAxisMenuTitle', 'Vertical axis offset')}
            abbreviation="4.2.4"
            description={ppcT('InstallationApp.OffsetVerticalAxisMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.HorizontalZeroOffset', 'Horizontal zero offset')}
            abbreviation="4.2.5"
            description={ppcT('InstallationApp.HorizontalZeroOffsetDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.HorizontalResolutionCalibration', 'Horizontal resolution')}
            abbreviation="4.2.6"
            description={ppcT('InstallationApp.HorizontalResolutionCalibrationDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.WeightCalibration', 'Weight calibration')}
            abbreviation="4.2.7"
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.EmbarkDisembarkMenuTitle', 'Embark/Disembark')}
            abbreviation="4.2.8"
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

export default PpcElevatorMenuPage;

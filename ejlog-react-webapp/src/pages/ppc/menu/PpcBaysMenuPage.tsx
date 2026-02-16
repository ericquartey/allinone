import React from 'react';
import PpcInstallationNavMenu from '../../../components/ppc/PpcInstallationNavMenu';
import PpcInstallationNavFooter from '../../../components/ppc/PpcInstallationNavFooter';
import PpcMenuCard from '../../../components/ppc/PpcMenuCard';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcBaysMenuPage: React.FC = () => {
  return (
    <div className="ppc-installation-layout">
      <div className="ppc-installation-layout__nav">
        <PpcInstallationNavMenu activeKey="bays" />
      </div>

      <div className="ppc-installation-layout__content">
        <div className="ppc-installation-layout__title">
          {ppcT('Menu.BaysMenuName', 'Bays')}
        </div>

        <div className="ppc-menu-card-grid">
          <PpcMenuCard
            title={ppcT('InstallationApp.BayControlMenuTitle', 'Bay control')}
            abbreviation="4.3.1"
            description={ppcT('InstallationApp.BayControlMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.CarouselCalibrationMenuTitle', 'Carousel calibration')}
            abbreviation="4.3.3"
            description={ppcT('InstallationApp.CarouselCalibrationMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.ExternalBayCalibrationMenuTitle', 'External bay calibration')}
            abbreviation="4.3.3"
            description={ppcT('InstallationApp.ExternalBayCalibrationMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.GateTestMenuTitle', 'Gate test')}
            abbreviation="4.3.4"
            description={ppcT('InstallationApp.GateTestMenuDescription', '')}
          />
          <PpcMenuCard title="Test BED" abbreviation="4.3.5" />
          <PpcMenuCard
            title={ppcT('InstallationApp.ProfileResolutionCalibration', 'Profile calibration')}
            abbreviation="4.3.6"
            description={ppcT('InstallationApp.BarrierCalibrationMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.SensitiveAlarm', 'Sensitive alarm')}
            abbreviation="4.3.7"
            description={ppcT('InstallationApp.SensitiveAlarmDescription', '')}
            accentColor="var(--ppc-green)"
          />
        </div>

        <div className="ppc-installation-layout__footer">
          <PpcInstallationNavFooter />
        </div>
      </div>
    </div>
  );
};

export default PpcBaysMenuPage;

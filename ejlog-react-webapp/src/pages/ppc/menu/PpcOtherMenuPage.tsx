import React from 'react';
import PpcInstallationNavMenu from '../../../components/ppc/PpcInstallationNavMenu';
import PpcInstallationNavFooter from '../../../components/ppc/PpcInstallationNavFooter';
import PpcMenuCard from '../../../components/ppc/PpcMenuCard';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcOtherMenuPage: React.FC = () => {
  return (
    <div className="ppc-installation-layout">
      <div className="ppc-installation-layout__nav">
        <PpcInstallationNavMenu activeKey="other" />
      </div>

      <div className="ppc-installation-layout__content">
        <div className="ppc-installation-layout__title">
          {ppcT('Menu.OtherMenuName', 'Other')}
        </div>

        <div className="ppc-menu-card-grid">
          <PpcMenuCard
            title={ppcT('InstallationApp.ManageUserMenuTitle', 'Manage users')}
            abbreviation="4.7.1"
            description={ppcT('InstallationApp.manageUserMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.WMSComunicationMenuTitle', 'WMS communication')}
            abbreviation="4.7.2"
            description={ppcT('InstallationApp.WMSComunicationMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.ParametersMenuTitle', 'Parameters')}
            abbreviation="4.7.3"
            description={ppcT('InstallationApp.ParametersMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.InverterParameterizationMenuTitle', 'Inverter parameters')}
            abbreviation="4.7.4"
            description={ppcT('InstallationApp.InverterParameterizationMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.DateTimeMenuTitle', 'Date & time')}
            abbreviation="4.7.5"
            description={ppcT('InstallationApp.DateTimeMenuDescription', '')}
          />
          <PpcMenuCard
            title="Database backup"
            abbreviation="4.7.6"
            description={ppcT('InstallationApp.DatabaseBackupMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.ErrorAndActualValue', 'Error and actual value')}
            abbreviation="4.7.7"
          />
          <PpcMenuCard
            title={ppcT('InstallationApp.AutoLogoutSetings', 'Auto logout settings')}
            abbreviation="4.7.8"
          />
          <PpcMenuCard
            title={ppcT('OperatorApp.BayOperations', 'Bay operations')}
            abbreviation="4.7.9"
          />
        </div>

        <div className="ppc-installation-layout__footer">
          <PpcInstallationNavFooter />
        </div>
      </div>
    </div>
  );
};

export default PpcOtherMenuPage;

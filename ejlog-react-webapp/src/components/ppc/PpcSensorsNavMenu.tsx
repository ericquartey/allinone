import React from 'react';
import { useNavigate } from 'react-router-dom';
import PpcStackedMenu, { PpcMenuItem } from './PpcStackedMenu';
import { ppcT } from '../../features/ppc/ppcStrings';

type PpcSensorsNavMenuProps = {
  activeKey?: string;
};

const PpcSensorsNavMenu: React.FC<PpcSensorsNavMenuProps> = ({ activeKey }) => {
  const navigate = useNavigate();

  const items: PpcMenuItem[] = [
    {
      id: 'security',
      label: ppcT('InstallationApp.SecuritySensors', 'Security sensors'),
      onClick: () => navigate('/ppc/installation/other-sensors'),
    },
    {
      id: 'vertical-axis',
      label: ppcT('InstallationApp.VerticalAxis', 'Vertical axis'),
      onClick: () => navigate('/ppc/installation/vertical-axis-sensors'),
    },
    {
      id: 'bays',
      label: ppcT('InstallationApp.Bays', 'Bays'),
      onClick: () => navigate('/ppc/installation/bays-sensors'),
    },
    {
      id: 'io1',
      label: ppcT('InstallationApp.Bay1DeviceIO', 'Device IO 1'),
      onClick: () => navigate('/ppc/installation/bay1-device-io'),
    },
    {
      id: 'io2',
      label: ppcT('InstallationApp.Bay2DeviceIO', 'Device IO 2'),
      onClick: () => navigate('/ppc/installation/bay2-device-io'),
    },
    {
      id: 'io3',
      label: ppcT('InstallationApp.Bay3DeviceIO', 'Device IO 3'),
      onClick: () => navigate('/ppc/installation/bay3-device-io'),
    },
    {
      id: 'io-admin',
      label: ppcT('InstallationApp.IoAdmin', 'IO Admin'),
      onClick: () => navigate('/ppc/installation/sensors-admin'),
    },
  ];

  return (
    <PpcStackedMenu
      items={items.map((item) => ({
        ...item,
        active: item.id === activeKey,
      }))}
    />
  );
};

export default PpcSensorsNavMenu;

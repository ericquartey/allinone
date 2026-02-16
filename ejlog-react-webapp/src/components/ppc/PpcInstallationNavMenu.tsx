import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ppcT } from '../../features/ppc/ppcStrings';

type NavItem = {
  key: string;
  label: string;
  abbr: string;
  route: string;
};

const navItems: NavItem[] = [
  {
    key: 'installation',
    label: ppcT('Menu.Installation', 'Installation'),
    abbr: '4.1',
    route: '/ppc/menu/installation-menu',
  },
  {
    key: 'elevator',
    label: ppcT('Menu.MenuElevator', 'Elevator'),
    abbr: '4.2',
    route: '/ppc/menu/elevator-menu',
  },
  {
    key: 'bays',
    label: ppcT('Menu.Bay', 'Bay'),
    abbr: '4.3',
    route: '/ppc/menu/bays-menu',
  },
  {
    key: 'cells',
    label: ppcT('Menu.MenuCells', 'Cells'),
    abbr: '4.4',
    route: '/ppc/menu/cells-menu',
  },
  {
    key: 'loading-units',
    label: ppcT('Menu.MenuLoadingUnits', 'Units'),
    abbr: '4.5',
    route: '/ppc/menu/loading-units-menu',
  },
  {
    key: 'accessories',
    label: ppcT('Menu.MenuAccessories', 'Accessories'),
    abbr: '4.6',
    route: '/ppc/menu/accessories-menu',
  },
  {
    key: 'other',
    label: ppcT('Menu.Other', 'Other'),
    abbr: '4.7',
    route: '/ppc/menu/other-menu',
  },
];

type PpcInstallationNavMenuProps = {
  activeKey?: string;
};

const PpcInstallationNavMenu: React.FC<PpcInstallationNavMenuProps> = ({ activeKey }) => {
  const navigate = useNavigate();

  return (
    <div className="ppc-installation-nav">
      {navItems.map((item) => (
        <button
          type="button"
          key={item.key}
          className={`ppc-installation-nav__item${
            activeKey === item.key ? ' is-active' : ''
          }`}
          onClick={() => navigate(item.route)}
          aria-current={activeKey === item.key ? 'page' : undefined}
        >
          <div className="ppc-installation-nav__abbr">{item.abbr}</div>
          <div className="ppc-installation-nav__label">{item.label}</div>
        </button>
      ))}
    </div>
  );
};

export default PpcInstallationNavMenu;

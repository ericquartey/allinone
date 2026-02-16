import React from 'react';

export type PpcMenuItem = {
  id: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

type PpcStackedMenuProps = {
  items: PpcMenuItem[];
};

const PpcStackedMenu: React.FC<PpcStackedMenuProps> = ({ items }) => {
  return (
    <div className="ppc-menu">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`ppc-menu-item${item.active ? ' is-active' : ''}`}
          disabled={item.disabled}
          onClick={item.onClick}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default PpcStackedMenu;

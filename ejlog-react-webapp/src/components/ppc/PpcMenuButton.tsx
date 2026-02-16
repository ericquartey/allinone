import React from 'react';

type PpcMenuButtonProps = {
  title: string;
  abbreviation: string;
  description: string;
  number: string;
  icon?: React.ReactNode;
  accentColor?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'main';
};

const PpcMenuButton: React.FC<PpcMenuButtonProps> = ({
  title,
  abbreviation,
  description,
  number,
  icon,
  accentColor = 'var(--ppc-blue)',
  onClick,
  disabled,
  variant = 'default',
}) => {
  if (variant === 'main') {
    return (
      <button
        type="button"
        className="ppc-menu-button ppc-menu-button--main"
        style={{ '--ppc-menu-accent': accentColor } as React.CSSProperties}
        onClick={onClick}
        disabled={disabled}
      >
        <div className="ppc-menu-button__accent">
          <div className="ppc-menu-button__abbr">{abbreviation}</div>
          <div className="ppc-menu-button__number">{number}</div>
        </div>
        <div className="ppc-menu-button__body">
          <div className="ppc-menu-button__title">{title}</div>
          <div className="ppc-menu-button__description">{description}</div>
        </div>
        <div className="ppc-menu-button__icon">{icon}</div>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="ppc-menu-button"
      style={{ '--ppc-menu-accent': accentColor } as React.CSSProperties}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="ppc-menu-button__number">{number}</div>
      <div className="ppc-menu-button__content">
        <div className="ppc-menu-button__title">{title}</div>
        <div className="ppc-menu-button__abbr">{abbreviation}</div>
        <div className="ppc-menu-button__description">{description}</div>
      </div>
      <div className="ppc-menu-button__icon">{icon}</div>
    </button>
  );
};

export default PpcMenuButton;

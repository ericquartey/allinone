import React from 'react';

type PpcMenuCardProps = {
  title: string;
  abbreviation: string;
  description?: string;
  accentColor?: string;
  isCompleted?: boolean;
  isBypassed?: boolean;
  disabled?: boolean;
};

const PpcMenuCard: React.FC<PpcMenuCardProps> = ({
  title,
  abbreviation,
  description,
  accentColor = 'var(--ppc-red)',
  isCompleted,
  isBypassed,
  disabled,
}) => {
  return (
    <div
      className={`ppc-menu-card${disabled ? ' is-disabled' : ''}${
        isCompleted ? ' is-completed' : ''
      }${isBypassed ? ' is-bypassed' : ''}`}
      style={{ '--ppc-menu-accent': accentColor } as React.CSSProperties}
    >
      <div className="ppc-menu-card__abbr">{abbreviation}</div>
      <div className="ppc-menu-card__title">{title}</div>
      {description && <div className="ppc-menu-card__desc">{description}</div>}
    </div>
  );
};

export default PpcMenuCard;

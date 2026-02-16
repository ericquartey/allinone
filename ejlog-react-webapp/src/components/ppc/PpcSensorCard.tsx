import React from 'react';

export type PpcSensorBadge = {
  label: string;
  variant?: 'success' | 'warning' | 'info' | 'default';
};

type PpcSensorCardProps = {
  title: string;
  value?: string;
  secondary?: string;
  badges?: PpcSensorBadge[];
  lines?: string[];
  className?: string;
};

const PpcSensorCard: React.FC<PpcSensorCardProps> = ({
  title,
  value,
  secondary,
  badges,
  lines = [],
  className,
}) => {
  return (
    <div className={`ppc-sensor-card${className ? ` ${className}` : ''}`}>
      <div className="ppc-sensor-card__title">{title}</div>
      {(value || secondary || (badges && badges.length > 0)) && (
        <div className="ppc-sensor-card__meta">
          {value && <div className="ppc-sensor-card__value">{value}</div>}
          {secondary && <div className="ppc-sensor-card__secondary">{secondary}</div>}
          {badges && badges.length > 0 && (
            <div className="ppc-sensor-card__badges">
              {badges.map((badge) => (
                <span
                  key={`${title}-${badge.label}`}
                  className={`ppc-sensor-card__badge ppc-sensor-card__badge--${badge.variant ?? 'default'}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="ppc-sensor-card__body">
        {lines.length === 0 ? (
          <div className="ppc-sensor-card__line">--</div>
        ) : (
          lines.map((line, index) => (
            <div key={`${title}-${index}`} className="ppc-sensor-card__line">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PpcSensorCard;

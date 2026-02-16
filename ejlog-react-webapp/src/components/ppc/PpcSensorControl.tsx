import React from 'react';

type PpcSensorControlProps = {
  label: string;
  active?: boolean;
  transparent?: boolean;
  compact?: boolean;
};

const PpcSensorControl: React.FC<PpcSensorControlProps> = ({
  label,
  active = false,
  transparent = false,
  compact = false,
}) => {
  const className = [
    'ppc-sensor',
    active ? 'ppc-sensor--active' : '',
    transparent ? 'ppc-sensor--transparent' : '',
    compact ? 'ppc-sensor--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <span className="ppc-sensor-indicator" />
      <span className="ppc-sensor-label">{label}</span>
    </div>
  );
};

export default PpcSensorControl;

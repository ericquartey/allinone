import React from 'react';

type PpcSensorTileProps = {
  label: string;
  shape?: 'circle' | 'square';
  active?: boolean;
};

const PpcSensorTile: React.FC<PpcSensorTileProps> = ({
  label,
  shape = 'square',
  active = false,
}) => {
  return (
    <div className={`ppc-sensor-tile ppc-sensor-tile--${shape}${active ? ' is-active' : ''}`}>
      <div className="ppc-sensor-tile__label">{label}</div>
    </div>
  );
};

export default PpcSensorTile;

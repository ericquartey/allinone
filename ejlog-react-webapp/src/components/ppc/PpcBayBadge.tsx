import React from 'react';

type PpcBayBadgeProps = {
  bayNumber?: string | number;
};

const PpcBayBadge: React.FC<PpcBayBadgeProps> = ({ bayNumber }) => {
  return (
    <div className="ppc-bay-badge">
      <div className="ppc-bay-badge__label">BAY</div>
      <div className="ppc-bay-badge__value">{bayNumber ?? '--'}</div>
    </div>
  );
};

export default PpcBayBadge;

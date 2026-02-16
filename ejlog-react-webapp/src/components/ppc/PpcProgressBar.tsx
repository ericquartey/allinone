import React from 'react';

type PpcProgressBarProps = {
  value: number;
  label?: string;
  color1?: string;
  color2?: string;
  max?: number;
  displayValue?: string;
};

const PpcProgressBar: React.FC<PpcProgressBarProps> = ({
  value,
  label,
  color1 = 'var(--ppc-green)',
  color2 = 'var(--ppc-orange)',
  max = 100,
  displayValue,
}) => {
  const clamped = Math.max(0, Math.min(value, max));
  const percent = max === 0 ? 0 : (clamped / max) * 100;
  const text = displayValue ?? `${clamped.toFixed(2)}%`;

  return (
    <div className="ppc-progress">
      {label && <div className="ppc-progress__label">{label}</div>}
      <div className="ppc-progress__bar">
        <div
          className="ppc-progress__fill"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${color1}, ${color2})`,
          }}
        />
        <div className="ppc-progress__value">{text}</div>
      </div>
    </div>
  );
};

export default PpcProgressBar;

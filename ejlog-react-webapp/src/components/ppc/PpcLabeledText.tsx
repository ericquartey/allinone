import React from 'react';

type PpcLabeledTextProps = {
  label: string;
  value?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
};

const PpcLabeledText: React.FC<PpcLabeledTextProps> = ({
  label,
  value = '-',
  align = 'left',
  className,
}) => {
  return (
    <div className={`ppc-labeled ppc-labeled--${align}${className ? ` ${className}` : ''}`}>
      <div className="ppc-labeled__label">{label}</div>
      <div className="ppc-labeled__content">{value}</div>
    </div>
  );
};

export default PpcLabeledText;

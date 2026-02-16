import React from 'react';

type PpcActionButtonProps = {
  label: string;
  tone?: 'default' | 'warning';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const PpcActionButton: React.FC<PpcActionButtonProps> = ({
  label,
  tone = 'default',
  className,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      className={`ppc-action-button ppc-action-button--${tone}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default PpcActionButton;

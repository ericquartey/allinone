import React from 'react';

type PpcCheckboxFieldProps = {
  label: string;
  checked?: boolean;
  className?: string;
  name?: string;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
};

const PpcCheckboxField: React.FC<PpcCheckboxFieldProps> = ({
  label,
  checked = false,
  className,
  name,
  onChange,
  disabled = false,
}) => {
  const isControlled = typeof onChange === 'function';

  return (
    <label className={`ppc-checkbox${className ? ` ${className}` : ''}`}>
      <input
        type="checkbox"
        name={name}
        checked={isControlled ? checked : undefined}
        defaultChecked={!isControlled ? checked : undefined}
        onChange={isControlled ? (event) => onChange(event.target.checked) : undefined}
        disabled={disabled}
      />
      <span>{label}</span>
    </label>
  );
};

export default PpcCheckboxField;

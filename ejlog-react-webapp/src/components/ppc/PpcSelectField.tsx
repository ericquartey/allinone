import React from 'react';

type PpcSelectFieldProps = {
  label: string;
  options: Array<string | { label: string; value: string }>;
  className?: string;
  value?: string;
  name?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

const PpcSelectField: React.FC<PpcSelectFieldProps> = ({
  label,
  options,
  className,
  value,
  name,
  onChange,
  disabled = false,
}) => {
  const isControlled = typeof onChange === 'function';
  const normalizedOptions = options.map((option) =>
    typeof option === 'string' ? { label: option, value: option } : option
  );

  return (
    <label className={`ppc-form-field${className ? ` ${className}` : ''}`}>
      <span className="ppc-form-field__label">{label}</span>
      <select
        className="ppc-form-field__input"
        name={name}
        value={isControlled ? value : undefined}
        defaultValue={!isControlled ? value : undefined}
        onChange={isControlled ? (event) => onChange(event.target.value) : undefined}
        disabled={disabled}
      >
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default PpcSelectField;

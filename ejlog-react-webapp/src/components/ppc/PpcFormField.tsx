import React from 'react';

type PpcFormFieldProps = {
  label: string;
  value?: string;
  placeholder?: string;
  type?: string;
  className?: string;
  name?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

const PpcFormField: React.FC<PpcFormFieldProps> = ({
  label,
  value = '',
  placeholder,
  type = 'text',
  className,
  name,
  onChange,
  onKeyDown,
  disabled = false,
  autoFocus = false,
}) => {
  const isControlled = typeof onChange === 'function';

  return (
    <label className={`ppc-form-field${className ? ` ${className}` : ''}`}>
      <span className="ppc-form-field__label">{label}</span>
      <input
        className="ppc-form-field__input"
        type={type}
        name={name}
        value={isControlled ? value : undefined}
        defaultValue={!isControlled ? value : undefined}
        placeholder={placeholder}
        onChange={isControlled ? (event) => onChange(event.target.value) : undefined}
        onKeyDown={onKeyDown}
        disabled={disabled}
        autoFocus={autoFocus}
      />
    </label>
  );
};

export default PpcFormField;

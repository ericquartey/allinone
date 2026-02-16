import React from 'react';

// Placeholder UI component - select
export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export interface SelectValueProps {
  placeholder?: string;
}

export interface SelectContentProps {
  children?: React.ReactNode;
  className?: string;
}

export interface SelectItemProps {
  value: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

// Context for Select state
interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const SelectContext = React.createContext<SelectContextValue>({});

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  defaultValue,
  disabled,
  children,
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || value || '');

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue: string) => {
    if (!disabled) {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    }
  };

  return (
    <SelectContext.Provider value={{ value: internalValue, onValueChange: handleValueChange, disabled }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ children, className = '', ...props }, ref) => {
    const { disabled } = React.useContext(SelectContext);

    return (
      <button
        ref={ref}
        type="button"
        role="combobox"
        aria-expanded="false"
        className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
        <svg
          className="h-4 w-4 opacity-50 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }
);

SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext);

  return <span className="block truncate">{value || placeholder}</span>;
};

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm ${className}`}
      role="listbox"
    >
      {children}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({ value, children, disabled }) => {
  const { onValueChange, value: selectedValue } = React.useContext(SelectContext);
  const isSelected = value === selectedValue;

  const handleClick = () => {
    if (!disabled) {
      onValueChange?.(value);
    }
  };

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={handleClick}
      className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${
        isSelected
          ? 'bg-blue-600 text-white'
          : 'text-gray-900 hover:bg-gray-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`block truncate ${isSelected ? 'font-semibold' : 'font-normal'}`}>
        {children}
      </span>
      {isSelected && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-4">
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </div>
  );
};

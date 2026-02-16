import React from 'react';

// Form context for managing form state
export interface FormContextValue {
  formState?: any;
  getValues?: (name: string) => any;
  register?: (name: string) => any;
  watch?: (name: string) => any;
}

const FormContext = React.createContext<FormContextValue | undefined>(undefined);

export const useFormContext = (): FormContextValue => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context;
};

// Form - Main container
export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  formState?: any;
  getValues?: (name: string) => any;
  register?: (name: string) => any;
  watch?: (name: string) => any;
}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ children, className = '', formState, getValues, register, watch, ...props }, ref) => {
    const value: FormContextValue = {
      formState,
      getValues,
      register,
      watch,
    };

    return (
      <FormContext.Provider value={value}>
        <form ref={ref} className={`form space-y-4 ${className}`} {...props}>
          {children}
        </form>
      </FormContext.Provider>
    );
  }
);
Form.displayName = 'Form';

// FormField - Wrapper for field logic
export interface FormFieldProps {
  name: string;
  render: (props: {
    field: {
      value: any;
      onChange: (value: any) => void;
      onBlur: () => void;
    };
    fieldState: {
      error?: { message: string };
    };
  }) => React.ReactElement;
}

export const FormField = ({ name, render }: FormFieldProps) => {
  const context = useFormContext();
  const [value, setValue] = React.useState(context.getValues?.(name) ?? '');
  const [touched, setTouched] = React.useState(false);

  const fieldState = {
    error: undefined, // Placeholder for error state
  };

  const field = {
    value,
    onChange: (e: any) => {
      const newValue = e.target?.value ?? e;
      setValue(newValue);
    },
    onBlur: () => setTouched(true),
  };

  return render({ field, fieldState });
};

// FormItem - Container for form field
export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`form-item space-y-2 ${className}`} {...props}>
      {children}
    </div>
  )
);
FormItem.displayName = 'FormItem';

// FormLabel - Label for form fields
export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ children, className = '', required = false, ...props }, ref) => (
    <label
      ref={ref}
      className={`form-label block text-sm font-medium text-gray-700 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-red-600">*</span>}
    </label>
  )
);
FormLabel.displayName = 'FormLabel';

// FormControl - Wrapper for form input/select/textarea
export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`form-control ${className}`} {...props}>
      {children}
    </div>
  )
);
FormControl.displayName = 'FormControl';

// FormDescription - Helper text for form fields
export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ children, className = '', ...props }, ref) => (
    <p ref={ref} className={`form-description text-xs text-gray-500 ${className}`} {...props}>
      {children}
    </p>
  )
);
FormDescription.displayName = 'FormDescription';

// FormMessage - Error message for form fields
export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
  error?: string;
}

export const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ children, error, className = '', ...props }, ref) => {
    if (!error && !children) return null;

    return (
      <p ref={ref} className={`form-message text-xs text-red-600 ${className}`} {...props}>
        {error || children}
      </p>
    );
  }
);
FormMessage.displayName = 'FormMessage';

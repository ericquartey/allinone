// Placeholder UI component - alert
export const Alert = ({ children, className = '', variant = 'default', ...props }: any) => {
  const variantClasses = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  return (
    <div
      role="alert"
      className={`alert border-l-4 p-4 ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertDescription = ({ children, className = '', ...props }: any) => (
  <div className={`alert-description text-sm ${className}`} {...props}>{children}</div>
);

export const AlertTitle = ({ children, className = '', ...props }: any) => (
  <h5 className={`alert-title font-semibold mb-1 ${className}`} {...props}>{children}</h5>
);

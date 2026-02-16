import React from 'react';

interface AlertDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface AlertDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface AlertDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface AlertDialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

// AlertDialog - Container component
export const AlertDialog = ({ children, open, onOpenChange }: AlertDialogProps) => {
  const [isOpen, setIsOpen] = React.useState(open ?? false);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <div data-state={isOpen ? 'open' : 'closed'} data-testid="alert-dialog">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            onOpenChange: handleOpenChange,
          });
        }
        return child;
      })}
    </div>
  );
};

// AlertDialogTrigger
export const AlertDialogTrigger = React.forwardRef<HTMLButtonElement, AlertDialogTriggerProps>(
  ({ children, onClick, onOpenChange, isOpen, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`alert-dialog-trigger ${className}`}
        onClick={(e) => {
          onOpenChange?.(!isOpen);
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
AlertDialogTrigger.displayName = 'AlertDialogTrigger';

// AlertDialogContent
export const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(
  ({ children, className = '', isOpen, onOpenChange, ...props }, ref) => {
    if (!isOpen) return null;

    return (
      <>
        <div
          className="alert-dialog-overlay fixed inset-0 z-40 bg-black/50"
          onClick={() => onOpenChange?.(false)}
        />
        <div
          ref={ref}
          className={`alert-dialog-content fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-lg ${className}`}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);
AlertDialogContent.displayName = 'AlertDialogContent';

// AlertDialogHeader
export const AlertDialogHeader = React.forwardRef<HTMLDivElement, AlertDialogHeaderProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`alert-dialog-header mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

// AlertDialogTitle
export const AlertDialogTitle = React.forwardRef<HTMLHeadingElement, AlertDialogTitleProps>(
  ({ children, className = '', ...props }, ref) => (
    <h2
      ref={ref}
      className={`alert-dialog-title text-lg font-semibold text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </h2>
  )
);
AlertDialogTitle.displayName = 'AlertDialogTitle';

// AlertDialogDescription
export const AlertDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDialogDescriptionProps
>(({ children, className = '', ...props }, ref) => (
  <p ref={ref} className={`alert-dialog-description mt-2 text-sm text-gray-600 ${className}`} {...props}>
    {children}
  </p>
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

// AlertDialogFooter
export const AlertDialogFooter = React.forwardRef<HTMLDivElement, AlertDialogFooterProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`alert-dialog-footer mt-6 flex justify-end gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

// AlertDialogAction
export const AlertDialogAction = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  ({ children, onClick, onOpenChange, className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`alert-dialog-action inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      onClick={(e) => {
        onClick?.(e);
        onOpenChange?.(false);
      }}
      {...props}
    >
      {children}
    </button>
  )
);
AlertDialogAction.displayName = 'AlertDialogAction';

// AlertDialogCancel
export const AlertDialogCancel = React.forwardRef<HTMLButtonElement, AlertDialogCancelProps>(
  ({ children, onClick, onOpenChange, className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`alert-dialog-cancel inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      onClick={(e) => {
        onClick?.(e);
        onOpenChange?.(false);
      }}
      {...props}
    >
      {children}
    </button>
  )
);
AlertDialogCancel.displayName = 'AlertDialogCancel';

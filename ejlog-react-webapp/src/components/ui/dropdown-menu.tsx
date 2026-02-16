import React from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  disabled?: boolean;
  onSelect?: () => void;
}

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

// DropdownMenu - Container component
export const DropdownMenu = ({ children, open, onOpenChange }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(open ?? false);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <div
      className="dropdown-menu relative inline-block"
      data-state={isOpen ? 'open' : 'closed'}
      onBlur={() => handleOpenChange(false)}
      tabIndex={-1}
    >
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

// DropdownMenuTrigger
export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, onClick, onOpenChange, isOpen, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`dropdown-menu-trigger inline-flex items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 ${className}`}
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
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

// DropdownMenuContent
export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ children, className = '', isOpen, onOpenChange, align = 'start', ...props }, ref) => {
    const alignClasses = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0',
    };

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={`dropdown-menu-content absolute top-full z-50 mt-1 min-w-[200px] rounded-md border border-gray-200 bg-white p-1 shadow-md ${alignClasses[align]} ${className}`}
        role="menu"
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

// DropdownMenuItem
export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ children, className = '', disabled = false, onSelect, onOpenChange, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="menuitem"
        className={`dropdown-menu-item relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 ${
          disabled ? 'pointer-events-none opacity-50' : ''
        } ${className}`}
        onClick={(e) => {
          if (!disabled) {
            onSelect?.();
            onOpenChange?.(false);
            onClick?.(e);
          }
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

// DropdownMenuLabel
export const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`dropdown-menu-label px-3 py-1.5 text-xs font-semibold text-gray-600 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

// DropdownMenuSeparator
export const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`dropdown-menu-separator my-1 h-px bg-gray-200 ${className}`}
      role="separator"
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

// Placeholder UI component - tabs
export const Tabs = ({ children, className = '', ...props }: any) => (
  <div className={`tabs ${className}`} {...props}>{children}</div>
);

export const TabsList = ({ children, className = '', ...props }: any) => (
  <div className={`tabs-list ${className}`} {...props}>{children}</div>
);

export const TabsTrigger = ({ children, className = '', ...props }: any) => (
  <button className={`tabs-trigger ${className}`} {...props}>{children}</button>
);

export const TabsContent = ({ children, className = '', ...props }: any) => (
  <div className={`tabs-content ${className}`} {...props}>{children}</div>
);

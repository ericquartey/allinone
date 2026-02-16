// Placeholder UI component - badge
export const Badge = ({ children, className = '', variant = 'default', ...props }: any) => (
  <span className={`badge badge-${variant} ${className}`} {...props}>{children}</span>
);

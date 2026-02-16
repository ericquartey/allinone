/**
 * ============================================================================
 * Ferretto Logo Component
 * Official Ferretto Group branding - Storage Goes Vertical
 * ============================================================================
 */

import React from 'react';

interface FerrettoLogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const FerrettoLogo: React.FC<FerrettoLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  // Size mappings - altezza del logo in pixel
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
  };

  const height = sizeMap[size];

  // Il logo PNG originale ha proporzioni orizzontali (circa 5:1)
  // quindi calcoliamo la larghezza automaticamente mantenendo l'aspect ratio
  return (
    <img
      src="/ferretto-logo.png"
      alt="Ferretto - Storage Goes Vertical"
      style={{
        height: `${height}px`,
        width: 'auto',
        objectFit: 'contain'
      }}
      className={className}
    />
  );
};

export default FerrettoLogo;

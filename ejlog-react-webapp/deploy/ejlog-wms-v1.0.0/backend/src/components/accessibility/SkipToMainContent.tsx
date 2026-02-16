// ==============================================================================
// EJLOG WMS - Skip to Main Content Component
// WCAG 2.4.1 Bypass Blocks - Allow keyboard users to skip navigation
// ==============================================================================

import React from 'react';

interface SkipToMainContentProps {
  mainContentId?: string;
  label?: string;
}

const SkipToMainContent: React.FC<SkipToMainContentProps> = ({
  mainContentId = 'main-content',
  label = 'Salta al contenuto principale',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const mainContent = document.getElementById(mainContentId);

    if (mainContent) {
      // Set tabindex to make it focusable
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();

      // Scroll to element
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Remove tabindex after focusing
      setTimeout(() => {
        mainContent.removeAttribute('tabindex');
      }, 100);
    }
  };

  return (
    <a
      href={`#${mainContentId}`}
      onClick={handleClick}
      className="
        sr-only
        focus:not-sr-only
        focus:absolute
        focus:top-4
        focus:left-4
        focus:z-50
        focus:px-4
        focus:py-2
        focus:bg-ferrRed
        focus:text-white
        focus:rounded-md
        focus:shadow-lg
        focus:outline-none
        focus:ring-2
        focus:ring-white
        focus:ring-offset-2
        focus:ring-offset-ferrRed
        transition-all
        duration-200
      "
    >
      {label}
    </a>
  );
};

export default SkipToMainContent;

import React from 'react';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcLoaderPage: React.FC = () => {
  return (
    <div className="ppc-loader">
      <img
        className="ppc-loader__spinner"
        src="/ppc-assets/spinner_pure_white.gif"
        alt="Loading"
      />
      <div className="ppc-loader__title">
        {ppcT('InstallationApp.InitializingWithEllipsis', 'Initializing...')}
      </div>
      <div className="ppc-loader__version">2.3.12.4</div>
    </div>
  );
};

export default PpcLoaderPage;

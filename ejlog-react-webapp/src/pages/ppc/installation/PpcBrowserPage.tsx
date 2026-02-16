import React from 'react';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcBrowserPage: React.FC = () => {
  return (
    <div className="ppc-page">
      <div className="ppc-panel ppc-browser">
        <div className="ppc-panel__title">
          {ppcT('InstallationApp.OpenBrowser', 'Open browser')}
        </div>
        <div className="ppc-browser__frame">Browser preview</div>
      </div>
    </div>
  );
};

export default PpcBrowserPage;

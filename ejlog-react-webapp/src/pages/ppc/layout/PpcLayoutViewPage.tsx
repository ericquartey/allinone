import React from 'react';
import PpcHeader from '../../../components/ppc/PpcHeader';
import PpcFooter from '../../../components/ppc/PpcFooter';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcLayoutViewPage: React.FC = () => {
  return (
    <div className="ppc-layout-view">
      <PpcHeader />
      <div className="ppc-layout-view__main">
        <div className="ppc-layout-view__placeholder">
          {ppcT('General.View', 'View')} / {ppcT('General.MainContent', 'Main content')}
        </div>
      </div>
      <PpcFooter />
    </div>
  );
};

export default PpcLayoutViewPage;

import React from 'react';
import PpcFooter from '../../../components/ppc/PpcFooter';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcLayoutFooterPage: React.FC = () => {
  return (
    <div className="ppc-layout-single">
      <PpcFooter
        notification={ppcT('ErrorsApp.SilenceSirenAlarm', 'Silence siren alarm')}
        severity="warning"
      />
    </div>
  );
};

export default PpcLayoutFooterPage;

import React from 'react';
import PpcDeviceInfoPanel from '../../../components/ppc/PpcDeviceInfoPanel';
import { useGetIdentityQuery } from '../../../services/api/ppcAutomationApi';

const PpcDeviceInformationPage: React.FC = () => {
  const identityQuery = useGetIdentityQuery();
  const identity = identityQuery.data;

  return (
    <div className="ppc-page">
      <PpcDeviceInfoPanel
        model={identity?.ModelName}
        serialNumber={identity?.SerialNumber}
        firmwareVersion={identity?.InstallationDate ?? undefined}
      />
    </div>
  );
};

export default PpcDeviceInformationPage;

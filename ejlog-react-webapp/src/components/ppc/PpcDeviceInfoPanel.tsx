import React from 'react';
import { ppcT } from '../../features/ppc/ppcStrings';

type PpcDeviceInfoPanelProps = {
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
};

const PpcDeviceInfoPanel: React.FC<PpcDeviceInfoPanelProps> = ({
  model,
  serialNumber,
  firmwareVersion,
}) => {
  const modelText = model || '--';
  const serialText = serialNumber || '--';
  const firmwareText = firmwareVersion || '--';

  return (
    <div className="ppc-panel ppc-device-info">
      <div className="ppc-panel__title">
        {ppcT('InstallationApp.DeviceInformation', 'Device information')}
      </div>
      <div className="ppc-device-info__list">
        <div>{ppcT('General.Model', 'Model')}: {modelText}</div>
        <div>{ppcT('General.SerialNumber', 'Serial number')}: {serialText}</div>
        <div>{ppcT('General.FirmwareVersion', 'Firmware version')}: {firmwareText}</div>
      </div>
    </div>
  );
};

export default PpcDeviceInfoPanel;

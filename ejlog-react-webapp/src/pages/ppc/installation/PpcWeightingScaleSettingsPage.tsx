import React, { useEffect, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcCheckboxField from '../../../components/ppc/PpcCheckboxField';
import PpcDeviceInfoPanel from '../../../components/ppc/PpcDeviceInfoPanel';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcSelectField from '../../../components/ppc/PpcSelectField';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcAccessories from '../../../hooks/usePpcAccessories';
import ppcAutomationService from '../../../services/ppc/automationService';
import { formatIpAddress } from '../../../services/ppc/automationUtils';
import { WeightingScaleModelNumber } from '../../../services/ppc/automationTypes';

const PpcWeightingScaleSettingsPage: React.FC = () => {
  const models = [
    { label: 'Dini Argeo', value: String(WeightingScaleModelNumber.DiniArgeo) },
    { label: 'Minebea Intec', value: String(WeightingScaleModelNumber.MinebeaIntec) },
  ];
  const { accessories, refresh } = usePpcAccessories();
  const [isEnabled, setIsEnabled] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('0');
  const [modelNumber, setModelNumber] = useState(String(WeightingScaleModelNumber.DiniArgeo));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const scale = accessories?.WeightingScale;
    if (!scale) {
      return;
    }
    setIsEnabled(Boolean(scale.IsEnabledNew));
    setIpAddress(formatIpAddress(scale.IpAddress));
    setPort(scale.TcpPort ? String(scale.TcpPort) : '0');

    const deviceModel = scale.DeviceInformation?.ModelNumber?.toLowerCase() || '';
    if (deviceModel.includes('minebea')) {
      setModelNumber(String(WeightingScaleModelNumber.MinebeaIntec));
    } else if (deviceModel.includes('dini')) {
      setModelNumber(String(WeightingScaleModelNumber.DiniArgeo));
    }
  }, [accessories]);

  const deviceInfo = accessories?.WeightingScale?.DeviceInformation || undefined;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await ppcAutomationService.updateWeightingScaleSettings({
        isEnabled,
        ipAddress,
        port: Number(port) || 0,
        modelNumber: Number(modelNumber) as WeightingScaleModelNumber,
      });
      await refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenBrowser = () => {
    const trimmed = ipAddress.trim();
    if (!trimmed) {
      return;
    }
    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const tareDisplay = '--.-- g';
  const weightDisplay = '--.--';

  return (
    <div className="ppc-page">
      <div className="ppc-accessories">
        <div className="ppc-accessories__title">
          {ppcT('Menu.AccessoriesWeightingScaleMenuTitle', 'Weighting scale')}
        </div>

        <PpcDeviceInfoPanel
          model={deviceInfo?.ModelNumber}
          serialNumber={deviceInfo?.SerialNumber}
          firmwareVersion={deviceInfo?.FirmwareVersion}
        />

        <PpcCheckboxField
          label={ppcT('InstallationApp.AccessoryEnabled', 'Accessory enabled')}
          checked={isEnabled}
          onChange={setIsEnabled}
        />

        <div className="ppc-form-grid">
          <PpcFormField
            label={ppcT('Menu.AccessoriesIpAddress', 'IP address')}
            value={ipAddress}
            onChange={setIpAddress}
          />
          <PpcFormField
            label={ppcT('Menu.AccessoriesPort', 'Port')}
            value={port}
            onChange={setPort}
            type="number"
          />
          <PpcSelectField
            label={ppcT('InstallationApp.ModelNumber', 'Model number')}
            options={models}
            value={modelNumber}
            onChange={setModelNumber}
          />
        </div>

        {isEnabled && (
          <div className="ppc-panel ppc-scale-display">
            <div className="ppc-scale-display__tare">
              {ppcT('InstallationApp.WeightingScaleTare', 'Tare')}: {tareDisplay}
            </div>
            <div className="ppc-scale-display__screen">
              <span className="ppc-scale-display__value">{weightDisplay}</span>
              <span className="ppc-scale-display__unit">g</span>
            </div>
          </div>
        )}

        <div className="ppc-form-actions ppc-form-actions--end">
          <PpcActionButton
            label={ppcT('InstallationApp.OpenBrowser', 'Open browser')}
            onClick={handleOpenBrowser}
            disabled={!ipAddress}
          />
          <PpcActionButton
            label={ppcT('General.Save', 'Save')}
            onClick={handleSave}
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default PpcWeightingScaleSettingsPage;

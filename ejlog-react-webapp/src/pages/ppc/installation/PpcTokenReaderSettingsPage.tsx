import React, { useEffect, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcCheckboxField from '../../../components/ppc/PpcCheckboxField';
import PpcLabeledText from '../../../components/ppc/PpcLabeledText';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcAccessories from '../../../hooks/usePpcAccessories';
import ppcAutomationService from '../../../services/ppc/automationService';

const PpcTokenReaderSettingsPage: React.FC = () => {
  const { accessories, refresh } = usePpcAccessories();
  const [isEnabled, setIsEnabled] = useState(false);
  const [portName, setPortName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const ports = ['COM1', 'COM2', 'COM3'];

  useEffect(() => {
    const token = accessories?.TokenReader;
    if (!token) {
      return;
    }
    setIsEnabled(Boolean(token.IsEnabledNew));
    setPortName(token.PortName || '');
  }, [accessories]);

  const portOptions = isEnabled && portName && !ports.includes(portName) ? [...ports, portName] : ports;
  const tokenSerial = accessories?.TokenReader?.DeviceInformation?.SerialNumber || '';
  const tokenInserted = Boolean(tokenSerial);
  const tokenStatusLabel = tokenInserted
    ? ppcT('General.Present', 'Present')
    : ppcT('General.NotPresent', 'Not present');

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await ppcAutomationService.updateTokenReaderSettings({
        isEnabled,
        portName,
      });
      await refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="ppc-page">
      <div className="ppc-accessories">
        <div className="ppc-accessories__title">
          <span>4.6.6</span>
          <span>{ppcT('Menu.AccessoriesTokenReaderMenuTitle', 'Token reader')}</span>
        </div>

        <PpcCheckboxField
          label={ppcT('InstallationApp.AccessoryEnabled', 'Accessory enabled')}
          checked={isEnabled}
          onChange={setIsEnabled}
        />

        <div className="ppc-panel">
          <div className="ppc-panel__title">{ppcT('General.TokenStatus', 'Token status')}</div>
          <div className="ppc-token-status">
            <span className={`ppc-status-dot${tokenInserted ? ' is-active' : ''}`} />
            <span>
              {tokenStatusLabel}
            </span>
          </div>
        </div>

        <div className="ppc-panel">
          <PpcLabeledText
            label={ppcT('InstallationApp.TokenSerialNumber', 'Token serial number')}
            value={tokenSerial || '--'}
          />
        </div>

        <div className="ppc-panel">
          <div className="ppc-panel__title">{ppcT('InstallationApp.SystemPorts', 'System ports')}</div>
          <div className="ppc-port-list">
            {portOptions.map((port) => (
              <button
                key={port}
                type="button"
                className={`ppc-port-item${port === portName ? ' is-active' : ''}`}
                onClick={() => setPortName(port)}
              >
                {port}
              </button>
            ))}
          </div>
        </div>

        <div className="ppc-form-actions ppc-form-actions--end">
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

export default PpcTokenReaderSettingsPage;

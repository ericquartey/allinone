import React, { useEffect, useMemo, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcCheckboxField from '../../../components/ppc/PpcCheckboxField';
import PpcDeviceInfoPanel from '../../../components/ppc/PpcDeviceInfoPanel';
import PpcFormField from '../../../components/ppc/PpcFormField';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcAccessories from '../../../hooks/usePpcAccessories';
import ppcAutomationService from '../../../services/ppc/automationService';
import { useNavigate } from 'react-router-dom';

const PpcBarcodeReaderSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const ports = ['COM1', 'COM2', 'COM3'];
  const { accessories, refresh } = usePpcAccessories();
  const [isEnabled, setIsEnabled] = useState(false);
  const [portName, setPortName] = useState('');
  const [testBarcode, setTestBarcode] = useState('');
  const [previewValue, setPreviewValue] = useState('');
  const [receivedBarcode, setReceivedBarcode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const barcode = accessories?.BarcodeReader;
    if (!barcode) {
      return;
    }
    setIsEnabled(Boolean(barcode.IsEnabledNew));
    setPortName(barcode.PortName || '');
  }, [accessories]);

  const deviceInfo = accessories?.BarcodeReader?.DeviceInformation || undefined;

  const previewBars = useMemo(() => {
    const value = previewValue.trim();
    if (!value) return [];

    const bars = [];
    for (let i = 0; i < value.length; i += 1) {
      const code = value.charCodeAt(i);
      const seed = (code + i * 13) % 7;
      bars.push(
        { width: 1 + (seed % 3), active: true },
        { width: 1 + ((seed + 2) % 2), active: false },
        { width: 1 + ((seed + 3) % 4), active: true },
        { width: 1 + ((seed + 1) % 2), active: false }
      );
    }
    return bars;
  }, [previewValue]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await ppcAutomationService.updateBarcodeReaderSettings({
        isEnabled,
        portName,
      });
      await refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestBarcode = () => {
    setPreviewValue(testBarcode);
  };

  const handleBarcodeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && testBarcode.trim()) {
      event.preventDefault();
      setReceivedBarcode(testBarcode.trim());
    }
  };

  const handleConfigureDevice = () => {
    navigate('/ppc/installation/barcode-reader-configuration');
  };

  const portOptions = useMemo(() => {
    if (portName && !ports.includes(portName)) {
      return [...ports, portName];
    }
    return ports;
  }, [portName]);

  return (
    <div className="ppc-page">
      <div className="ppc-accessories">
        <div className="ppc-accessories__title">
          {ppcT('Menu.AccessoriesBarcodeReaderMenuTitle', 'Barcode reader')}
        </div>

        <div className="ppc-barcode-settings">
          <PpcDeviceInfoPanel
            model={deviceInfo?.ModelNumber}
            serialNumber={deviceInfo?.SerialNumber}
            firmwareVersion={deviceInfo?.FirmwareVersion}
          />

          <div className="ppc-panel">
            <div className="ppc-panel__title">{ppcT('OperatorApp.BarcodeLabel', 'Barcode')}</div>
            <div className="ppc-form-row">
              <PpcFormField
                label={ppcT('OperatorApp.BarcodeLabel', 'Barcode')}
                value={testBarcode}
                onChange={setTestBarcode}
                onKeyDown={handleBarcodeKeyDown}
              />
              <PpcActionButton
                label={ppcT('InstallationApp.TestBarcode', 'Test barcode')}
                onClick={handleTestBarcode}
                disabled={!testBarcode.trim()}
              />
            </div>
            <div className="ppc-barcode-settings__preview">
              <div className="ppc-barcode-preview__bars">
                {previewBars.length === 0
                  ? ppcT('InstallationApp.BarcodePreview', 'Barcode preview')
                  : previewBars.map((bar, index) => (
                      <span
                        key={`${index}`}
                        className={`ppc-barcode-preview__bar${bar.active ? ' is-active' : ''}`}
                        style={{ width: `${bar.width * 4}px` }}
                      />
                    ))}
              </div>
              {previewValue && <div className="ppc-barcode-preview__text">{previewValue}</div>}
            </div>
          </div>
        </div>

        <PpcCheckboxField
          label={ppcT('InstallationApp.AccessoryEnabled', 'Accessory enabled')}
          checked={isEnabled}
          onChange={setIsEnabled}
        />

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

        <div className="ppc-panel">
          <div className="ppc-panel__title">{ppcT('InstallationApp.ReceivedBarcode', 'Received barcode')}</div>
          <div className="ppc-labeled__content">{receivedBarcode || '--'}</div>
        </div>

        <div className="ppc-form-actions ppc-form-actions--end">
          <PpcActionButton
            label={ppcT('InstallationApp.ConfigureDevice', 'Configure device')}
            onClick={handleConfigureDevice}
          />
          <PpcActionButton
            label={ppcT('General.Save', 'Save')}
            onClick={handleSave}
            disabled={isSaving}
          />
        </div>
        <div className="ppc-hint">{ppcT('InstallationApp.ConfigureBarcodeReaderHint', '')}</div>
      </div>
    </div>
  );
};

export default PpcBarcodeReaderSettingsPage;

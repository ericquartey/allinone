import React, { useEffect, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcCheckboxField from '../../../components/ppc/PpcCheckboxField';
import PpcDeviceInfoPanel from '../../../components/ppc/PpcDeviceInfoPanel';
import PpcFormField from '../../../components/ppc/PpcFormField';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcAccessories from '../../../hooks/usePpcAccessories';
import ppcAutomationService from '../../../services/ppc/automationService';
import { formatIpAddress } from '../../../services/ppc/automationUtils';
import { PPC_BAY_NUMBER } from '../../../config/api';

const PpcLaserPointerSettingsPage: React.FC = () => {
  const { accessories, refresh } = usePpcAccessories();
  const [isEnabled, setIsEnabled] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('0');
  const [xOffset, setXOffset] = useState('0');
  const [yOffset, setYOffset] = useState('0');
  const [zOffsetUpper, setZOffsetUpper] = useState('0');
  const [zOffsetLower, setZOffsetLower] = useState('0');
  const [ignoreItemHeight, setIgnoreItemHeight] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

  useEffect(() => {
    const laser = accessories?.LaserPointer;
    if (!laser) {
      return;
    }
    setIsEnabled(Boolean(laser.IsEnabledNew));
    setIpAddress(formatIpAddress(laser.IpAddress));
    setPort(laser.TcpPort ? String(laser.TcpPort) : '0');
    setXOffset(laser.XOffset !== null && laser.XOffset !== undefined ? String(laser.XOffset) : '0');
    setYOffset(laser.YOffset !== null && laser.YOffset !== undefined ? String(laser.YOffset) : '0');
    setZOffsetUpper(
      laser.ZOffsetUpperPosition !== null && laser.ZOffsetUpperPosition !== undefined
        ? String(laser.ZOffsetUpperPosition)
        : '0'
    );
    setZOffsetLower(
      laser.ZOffsetLowerPosition !== null && laser.ZOffsetLowerPosition !== undefined
        ? String(laser.ZOffsetLowerPosition)
        : '0'
    );
  }, [accessories]);

  useEffect(() => {
    const loadBaySettings = async () => {
      try {
        const bay = await ppcAutomationService.getBay(PPC_BAY_NUMBER);
        setIgnoreItemHeight(Boolean(bay.LaserIgnoreItemHeight));
      } catch (error) {
        console.error('Unable to load bay laser settings', error);
      }
    };
    loadBaySettings();
  }, []);

  const deviceInfo = accessories?.LaserPointer?.DeviceInformation || undefined;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await ppcAutomationService.updateLaserPointer({
        isEnabled,
        ipAddress,
        port: Number(port) || 0,
        xOffset: Number(xOffset) || 0,
        yOffset: Number(yOffset) || 0,
        zOffsetLowerPosition: Number(zOffsetLower) || 0,
        zOffsetUpperPosition: Number(zOffsetUpper) || 0,
        ignoreItemHeight,
      });
      await refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setConnectionStatus('checking');
      await ppcAutomationService.getAccessories();
      setConnectionStatus('ok');
      await refresh();
    } catch (error) {
      console.error('Laser pointer check failed', error);
      setConnectionStatus('error');
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

  const connectionLabel =
    connectionStatus === 'checking'
      ? ppcT('InstallationApp.Wait', 'Wait')
      : connectionStatus === 'ok'
        ? ppcT('InstallationApp.WmsStatusOnline', 'Online')
        : connectionStatus === 'error'
          ? ppcT('InstallationApp.WmsStatusOffline', 'Offline')
          : ppcT('General.Connectivity', 'Connectivity');

  return (
    <div className="ppc-page">
      <div className="ppc-accessories">
        <div className="ppc-accessories__title">
          <span>4.6.5</span>
          <span>{ppcT('Menu.AccessoriesLaserPointerMenuTitle', 'Laser pointer')}</span>
        </div>

        <PpcCheckboxField
          label={ppcT('Menu.AccessoriesLaserPointerMenuDescription', 'Laser pointer enabled')}
          checked={isEnabled}
          onChange={setIsEnabled}
        />

        <div className="ppc-panel">
          <div className="ppc-panel__title">
            {ppcT('Menu.AccessoriesAlphaNumBarMenuSection1', 'Connection')}
          </div>
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
          </div>
          <div className="ppc-form-grid">
            <PpcFormField
              label={ppcT('Menu.AccessoriesLaserPointerXOffset', 'X offset')}
              value={xOffset}
              onChange={setXOffset}
              type="number"
            />
            <PpcFormField
              label={ppcT('Menu.AccessoriesLaserPointerYOffset', 'Y offset')}
              value={yOffset}
              onChange={setYOffset}
              type="number"
            />
            <PpcFormField
              label={ppcT('Menu.AccessoriesLaserPointerZOffsetUpperPosition', 'Z offset upper')}
              value={zOffsetUpper}
              onChange={setZOffsetUpper}
              type="number"
            />
            <PpcFormField
              label={ppcT('Menu.AccessoriesLaserPointerZOffsetLowerPosition', 'Z offset lower')}
              value={zOffsetLower}
              onChange={setZOffsetLower}
              type="number"
            />
          </div>
          <PpcDeviceInfoPanel
            model={deviceInfo?.ModelNumber}
            serialNumber={deviceInfo?.SerialNumber}
            firmwareVersion={deviceInfo?.FirmwareVersion}
          />
          <PpcCheckboxField
            label={ppcT('OperatorApp.LaserIgnoreItemHeight', 'Ignore item height')}
            checked={ignoreItemHeight}
            onChange={setIgnoreItemHeight}
          />
        </div>

        <div className="ppc-panel">
          <div className="ppc-panel__title">
            {ppcT('Menu.AccessoriesAlphaNumBarMenuSection2', 'Test')}
          </div>
          <div className="ppc-radio-group">
            <label className="ppc-radio">
              <input type="radio" name="laserTest" defaultChecked />
              <span>{ppcT('Menu.AccessoriesOff', 'Off')}</span>
            </label>
            <label className="ppc-radio">
              <input type="radio" name="laserTest" />
              <span>{ppcT('Menu.AccessoriesOn', 'On')}</span>
            </label>
          </div>
          <div className="ppc-form-row">
            <div className="ppc-connectivity">
              <span>{connectionLabel}</span>
              <span
                className={`ppc-badge ${connectionStatus === 'error' ? 'ppc-badge--error' : 'ppc-badge--ok'}`}
              >
                {connectionStatus === 'error' ? 'KO' : 'OK'}
              </span>
            </div>
            <PpcActionButton
              label={ppcT('InstallationApp.CheckStatus', 'Check status')}
              onClick={handleCheckStatus}
              disabled={connectionStatus === 'checking'}
            />
          </div>
        </div>

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

export default PpcLaserPointerSettingsPage;

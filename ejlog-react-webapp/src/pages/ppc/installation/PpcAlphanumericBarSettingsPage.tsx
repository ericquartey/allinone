import React, { useEffect, useMemo, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcCheckboxField from '../../../components/ppc/PpcCheckboxField';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcSelectField from '../../../components/ppc/PpcSelectField';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcAccessories from '../../../hooks/usePpcAccessories';
import { useGetAlphaNumericBarMovementQuery } from '../../../services/api/ppcAutomationApi';
import ppcAutomationService from '../../../services/ppc/automationService';
import { formatIpAddress } from '../../../services/ppc/automationUtils';

const ALPHANUMERIC_FIELDS = [
  'ItemCode',
  'ItemDescription',
  'Destination',
  'ItemListCode',
  'ItemListDescription',
  'ItemListRowCode',
  'ItemNotes',
  'Lot',
  'SerialNumber',
  'Sscc',
];

const PpcAlphanumericBarSettingsPage: React.FC = () => {
  const { accessories, refresh } = usePpcAccessories();
  const [isEnabled, setIsEnabled] = useState(false);
  const [movementEnabled, setMovementEnabled] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('0');
  const [size, setSize] = useState('64');
  const [maxMessageLength, setMaxMessageLength] = useState('0');
  const [clearOnClose, setClearOnClose] = useState(false);
  const [useGet, setUseGet] = useState(false);
  const [messageFields, setMessageFields] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>(ALPHANUMERIC_FIELDS);
  const [selectedField, setSelectedField] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [testMode, setTestMode] = useState<'off' | 'led' | 'message' | 'arrow'>('off');
  const [testOffset, setTestOffset] = useState('0');
  const [testMessage, setTestMessage] = useState('HELLO');
  const [loopEnabled, setLoopEnabled] = useState(false);
  const movementQuery = useGetAlphaNumericBarMovementQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const sizeOptions = useMemo(
    () => [
      { label: 'Small', value: '64' },
      { label: 'Medium', value: '80' },
      { label: 'Large', value: '96' },
    ],
    []
  );

  const previewFields = useMemo(
    () => Array.from({ length: 5 }, (_, index) => messageFields[index] || ''),
    [messageFields]
  );

  const isAtMaxFields = messageFields.length >= 5;
  const canResetFields = messageFields.length > 0;
  const availableFieldOptions = availableFields.length ? availableFields : ['--'];
  const selectValue = availableFields.length ? selectedField : '--';
  const showLoopError = false;

  useEffect(() => {
    const alpha = accessories?.AlphaNumericBar;
    if (!alpha) {
      return;
    }
    const loadedFields = [
      alpha.Field1,
      alpha.Field2,
      alpha.Field3,
      alpha.Field4,
      alpha.Field5,
    ].filter((field): field is string => Boolean(field));

    setIsEnabled(Boolean(alpha.IsEnabledNew));
    setIpAddress(formatIpAddress(alpha.IpAddress));
    setPort(alpha.TcpPort ? String(alpha.TcpPort) : '0');
    setSize(alpha.Size ? String(alpha.Size) : '64');
    setMaxMessageLength(alpha.MaxMessageLength ? String(alpha.MaxMessageLength) : '0');
    setClearOnClose(Boolean(alpha.ClearAlphaBarOnCloseView));
    setUseGet(Boolean(alpha.UseGet));
    setMessageFields(loadedFields);

    const remainingFields = ALPHANUMERIC_FIELDS.filter((field) => !loadedFields.includes(field));
    setAvailableFields(remainingFields);
    setSelectedField(remainingFields[0] || '');
  }, [accessories]);

  useEffect(() => {
    if (movementQuery.data !== undefined) {
      setMovementEnabled(Boolean(movementQuery.data));
    }
  }, [movementQuery.data]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await ppcAutomationService.updateAlphaNumericBar({
        isEnabled,
        ipAddress,
        port: Number(port) || 0,
        size: Number(size) || 64,
        maxMessageLength: Number(maxMessageLength) || 0,
        clearOnClose,
        useGet,
        messageFields,
      });
      await ppcAutomationService.setAlphaNumericBarMovement(movementEnabled);
      await movementQuery.refetch();
      await refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setMessageFields([]);
    setAvailableFields(ALPHANUMERIC_FIELDS);
    setSelectedField(ALPHANUMERIC_FIELDS[0] || '');
  };

  const handleAddField = () => {
    if (!selectedField || selectedField === '--' || isAtMaxFields) {
      return;
    }
    setMessageFields((prev) => [...prev, selectedField]);
    setAvailableFields((prev) => {
      const next = prev.filter((field) => field !== selectedField);
      setSelectedField(next[0] || '');
      return next;
    });
  };

  const handleOpenBrowser = () => {
    const trimmed = ipAddress.trim();
    if (!trimmed) {
      return;
    }
    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="ppc-page">
      <div className="ppc-accessories">
        <div className="ppc-accessories__title">
          <span>4.6.1</span>
          <span>{ppcT('Menu.AccessoriesAlphaNumBarMenuTitle', 'Alphanumeric bar')}</span>
        </div>
        <div className="ppc-accessories__description">
          {ppcT('Menu.AccessoriesAlphaNumBarMenuDescription', '')}
        </div>

        <div className="ppc-form-row">
          <PpcCheckboxField
            label={ppcT('InstallationApp.AccessoryEnabled', 'Accessory enabled')}
            checked={isEnabled}
            onChange={setIsEnabled}
          />
          <PpcCheckboxField
            label={ppcT('InstallationApp.AlphaNumericBarMovementEnable', 'Enable movement')}
            checked={movementEnabled}
            onChange={setMovementEnabled}
          />
        </div>

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
            <PpcSelectField
              label={ppcT('Menu.AccessoriesSize', 'Size')}
              options={sizeOptions}
              value={size}
              onChange={setSize}
            />
            <PpcFormField
              label={ppcT('InstallationApp.MaxMessageLength', 'Max message length')}
              value={maxMessageLength}
              onChange={setMaxMessageLength}
              type="number"
            />
          </div>
          <div className="ppc-form-row">
            <PpcCheckboxField
              label={ppcT('InstallationApp.ClearAlphaBarOnCloseView', 'Clear on close')}
              checked={clearOnClose}
              onChange={setClearOnClose}
            />
            <PpcCheckboxField
              label={ppcT('InstallationApp.UseGetMessage', 'Use GET')}
              checked={useGet}
              onChange={setUseGet}
            />
          </div>

          <div className="ppc-form-row">
            <PpcSelectField
              label={ppcT('InstallationApp.Field', 'Field')}
              options={availableFieldOptions}
              value={selectValue}
              onChange={setSelectedField}
              disabled={!availableFields.length}
            />
          </div>

          <div className="ppc-field-preview">
            {previewFields.map((field, index) => (
              <div key={`${index}`} className="ppc-field-preview__item">
                <div className="ppc-field-preview__label">
                  {ppcT('InstallationApp.Field', 'Field')} {index + 1}
                </div>
                <div className="ppc-field-preview__value">{field || '--'}</div>
              </div>
            ))}
          </div>

          <div className="ppc-form-actions">
            <PpcActionButton
              label={ppcT('OperatorApp.Reset', 'Reset')}
              onClick={handleReset}
              disabled={!canResetFields || isSaving}
            />
            <PpcActionButton
              label={ppcT('OperatorApp.Add', 'Add')}
              onClick={handleAddField}
              disabled={!selectedField || isAtMaxFields || isSaving}
            />
          </div>
        </div>

        <div className="ppc-panel">
          <div className="ppc-panel__title">
            {ppcT('Menu.AccessoriesAlphaNumBarMenuSection2', 'Test')}
          </div>
          <div className="ppc-radio-group">
            <label className="ppc-radio">
              <input
                type="radio"
                name="testMode"
                checked={testMode === 'off'}
                onChange={() => setTestMode('off')}
              />
              <span>{ppcT('Menu.AccessoriesOff', 'Off')}</span>
            </label>
            <label className="ppc-radio">
              <input
                type="radio"
                name="testMode"
                checked={testMode === 'led'}
                onChange={() => setTestMode('led')}
              />
              <span>{ppcT('Menu.AccessoriesAlphaNumBarTestLed', 'LED test')}</span>
            </label>
            <label className="ppc-radio">
              <input
                type="radio"
                name="testMode"
                checked={testMode === 'message'}
                onChange={() => setTestMode('message')}
              />
              <span>{ppcT('Menu.AccessoriesAlphaNumBarTestMessage', 'Test message')}</span>
            </label>
            <label className="ppc-radio">
              <input
                type="radio"
                name="testMode"
                checked={testMode === 'arrow'}
                onChange={() => setTestMode('arrow')}
              />
              <span>{ppcT('Menu.AccessoriesAlphaNumBarTestArrow', 'Test arrow')}</span>
            </label>
          </div>

          <div className="ppc-form-grid">
            <PpcFormField
              label={ppcT('Menu.AccessoriesAlphaNumBarTestOffset', 'Offset')}
              value={testOffset}
              onChange={setTestOffset}
              type="number"
            />
            <PpcFormField
              label={ppcT('Menu.AccessoriesAlphaNumBarTestText', 'Test text')}
              value={testMessage}
              onChange={setTestMessage}
            />
          </div>
          <div className="ppc-form-row">
            <PpcCheckboxField
              label={ppcT('InstallationApp.StartLoop', 'Start loop')}
              checked={loopEnabled}
              onChange={setLoopEnabled}
            />
            {showLoopError && <span className="ppc-badge">{ppcT('InstallationApp.LoopError', 'Loop error')}</span>}
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
            disabled={isSaving || messageFields.length === 0}
          />
        </div>
      </div>
    </div>
  );
};

export default PpcAlphanumericBarSettingsPage;


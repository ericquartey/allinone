import React, { useEffect, useMemo, useRef, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcCheckboxField from '../../../components/ppc/PpcCheckboxField';
import PpcFormField from '../../../components/ppc/PpcFormField';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcAccessories from '../../../hooks/usePpcAccessories';
import ppcAutomationService from '../../../services/ppc/automationService';
import type { UserParameters } from '../../../services/ppc/automationTypes';

const PpcCardReaderSettingsPage: React.FC = () => {
  const { accessories, refresh } = usePpcAccessories();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLocal, setIsLocal] = useState(false);
  const [tokenRegex, setTokenRegex] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [inputKeys, setInputKeys] = useState<string[]>([]);
  const [acquiredTokens, setAcquiredTokens] = useState<string[]>([]);
  const [users, setUsers] = useState<UserParameters[]>([]);
  const [userName, setUserName] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserParameters | null>(null);
  const [localModeError, setLocalModeError] = useState('');
  const tokenBufferRef = useRef('');

  useEffect(() => {
    const card = accessories?.CardReader;
    if (!card) {
      return;
    }
    setIsEnabled(Boolean(card.IsEnabledNew));
    setIsLocal(Boolean(card.IsLocal));
    setTokenRegex(card.TokenRegex || '');
  }, [accessories]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await ppcAutomationService.getTokenUsers();
        setUsers(data || []);
      } catch (error) {
        console.error('Unable to load token users', error);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (!isTesting) {
      return;
    }

    tokenBufferRef.current = '';
    setInputKeys([]);
    setAcquiredTokens([]);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTesting) {
        return;
      }

      if (event.key === 'Enter') {
        const token = tokenBufferRef.current.trim();
        if (token) {
          setAcquiredTokens((prev) => [...prev, token].slice(-6));
        }
        tokenBufferRef.current = '';
        return;
      }

      if (event.key.length === 1) {
        tokenBufferRef.current += event.key;
        setInputKeys((prev) => [...prev, event.key].slice(-12));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTesting]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setLocalModeError('');
      if (isLocal) {
        const wmsEnabled = await ppcAutomationService.getWmsEnabled();
        if (wmsEnabled) {
          setLocalModeError(ppcT('InstallationApp.LocalAndWmsNotAllowed', 'Local mode not allowed while WMS is enabled.'));
          return;
        }
      }
      await ppcAutomationService.updateCardReaderSettings({
        isEnabled,
        tokenRegex,
        isLocal,
      });
      await refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartTest = () => {
    if (isSaving || !isEnabled) {
      return;
    }
    setIsTesting(true);
  };

  const handleStopTest = () => {
    setIsTesting(false);
  };

  const handleAddUser = async () => {
    const token = acquiredTokens[acquiredTokens.length - 1];
    if (!userName.trim() || !token) {
      return;
    }
    try {
      setIsSaving(true);
      await ppcAutomationService.addTokenUser({
        Name: userName.trim(),
        Token: token,
        AccessLevel: 2,
        PasswordHash: '',
        PasswordSalt: '',
      });
      const data = await ppcAutomationService.getTokenUsers();
      setUsers(data || []);
      setUserName('');
      setAcquiredTokens([]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      return;
    }
    try {
      setIsSaving(true);
      await ppcAutomationService.deleteTokenUser(selectedUser);
      const data = await ppcAutomationService.getTokenUsers();
      setUsers(data || []);
      setSelectedUser(null);
    } finally {
      setIsSaving(false);
    }
  };

  const canStartTest = !isSaving && !isTesting && isEnabled;
  const canStopTest = isTesting;
  const canAddUser = Boolean(userName.trim()) && acquiredTokens.length > 0;
  const canDeleteUser = Boolean(selectedUser?.Token);
  const latestToken = acquiredTokens[acquiredTokens.length - 1];
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
  }, [users]);

  return (
    <div className="ppc-page">
      <div className="ppc-accessories">
        <div className="ppc-accessories__title">
          {ppcT('Menu.AccessoriesCardReaderMenuTitle', 'Card reader')}
        </div>

        <div className="ppc-form-row">
          <PpcCheckboxField
            label={ppcT('InstallationApp.AccessoryEnabled', 'Accessory enabled')}
            checked={isEnabled}
            onChange={setIsEnabled}
          />
          <PpcCheckboxField
            label={ppcT('InstallationApp.IsLocal', 'Is local')}
            checked={isLocal}
            onChange={setIsLocal}
          />
        </div>

        <div className="ppc-form-row">
          <PpcFormField
            label={ppcT('InstallationApp.AccessoriesCardReaderTokenRegex', 'Token regex')}
            value={tokenRegex}
            onChange={setTokenRegex}
            disabled={!isEnabled || isTesting}
          />
          <PpcActionButton
            label={ppcT('InstallationApp.StartTest', 'Start test')}
            onClick={handleStartTest}
            disabled={!canStartTest}
          />
          <PpcActionButton
            label={ppcT('InstallationApp.StopTest', 'Stop test')}
            onClick={handleStopTest}
            disabled={!canStopTest}
          />
        </div>

        <div className="ppc-panel">
          <div className="ppc-panel__title">{ppcT('InstallationApp.InputKeys', 'Input keys')}</div>
          <div className="ppc-chip-grid">
            {(inputKeys.length ? inputKeys : ['--']).map((key, index) => (
              <div key={`${key}-${index}`} className="ppc-chip">
                {key}
              </div>
            ))}
          </div>
        </div>

        <div className="ppc-panel">
          <div className="ppc-panel__title">{ppcT('InstallationApp.AcquiredToken', 'Acquired token')}</div>
          <div className="ppc-chip-grid">
            {(acquiredTokens.length ? acquiredTokens : ['--']).map((token, index) => (
              <div key={`${token}-${index}`} className="ppc-chip ppc-chip--light">
                {token}
              </div>
            ))}
          </div>
        </div>

        <div className="ppc-card-reader__footer">
          <PpcFormField
            label={ppcT('InstallationApp.Name', 'Name')}
            value={userName}
            onChange={setUserName}
            placeholder={latestToken ? ppcT('InstallationApp.TokenAvailable', 'Token ready') : ''}
          />
          <PpcActionButton
            label={ppcT('OperatorApp.Add', 'Add')}
            onClick={handleAddUser}
            disabled={!canAddUser || isSaving}
          />
        </div>

        <div className="ppc-panel">
          <div className="ppc-panel__title">{ppcT('InstallationApp.Users', 'Users')}</div>
          <div className="ppc-user-list">
            {(sortedUsers.length ? sortedUsers : [{ Name: '--', Token: null }]).map((user, index) => (
              <button
                key={`${user.Name || 'user'}-${index}`}
                type="button"
                className={`ppc-user-list__row${selectedUser?.Name === user.Name ? ' is-active' : ''}`}
                onClick={() => setSelectedUser(user.Token ? user : null)}
              >
                {user.Name}
              </button>
            ))}
          </div>
          <PpcActionButton
            label={ppcT('OperatorApp.Delete', 'Delete')}
            onClick={handleDeleteUser}
            disabled={!canDeleteUser || isSaving}
          />
        </div>

        <div className="ppc-form-actions ppc-form-actions--end">
          <PpcActionButton
            label={ppcT('General.Save', 'Save')}
            onClick={handleSave}
            disabled={isSaving}
          />
        </div>
        {localModeError && <div className="ppc-hint">{localModeError}</div>}
      </div>
    </div>
  );
};

export default PpcCardReaderSettingsPage;

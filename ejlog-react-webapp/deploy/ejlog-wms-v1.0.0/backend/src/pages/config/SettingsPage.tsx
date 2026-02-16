// ============================================================================
// EJLOG WMS - Settings Page
// Configurazione avanzata delle impostazioni di sistema
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Sliders, Save, RotateCcw, AlertCircle } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import Badge from '../../components/shared/Badge';

// Types based on backend API
interface Setting {
  key: string;
  value: string | number | boolean;
  category: string;
  dataType: 'string' | 'number' | 'boolean';
  description?: string;
  isReadOnly?: boolean;
}

interface SettingsData {
  // General
  companyName: string;
  plantId: number;
  language: string;
  timezone: string;

  // Warehouse
  enableFIFO: boolean;
  enableLotManagement: boolean;
  enableSerialNumbers: boolean;
  enableExpiryDateCheck: boolean;
  defaultWarehouse: number;

  // List Management
  defaultListPriority: number;
  enableAutoLaunch: boolean;
  enableAutoRefilling: boolean;
  maxListsPerOperator: number;

  // Interface
  theme: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  showDebugInfo: boolean;

  // Printing
  defaultPrinter: string;
  enableAutoPrint: boolean;
  printFormat: string;

  // Email & Notifications
  enableEmailNotifications: boolean;
  smtpServer: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  notificationEmail: string;

  // Security
  sessionTimeout: number;
  enablePasswordExpiry: boolean;
  passwordExpiryDays: number;
  minPasswordLength: number;
  requireStrongPassword: boolean;

  // Backup
  enableAutoBackup: boolean;
  backupFrequency: string;
  backupRetentionDays: number;
}

const SettingsPage: React.FC = () => {
  // State
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3077/EjLogHostVertimag/Settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.result === 'SUCCESS' && data.exported) {
        setSettings(data.exported);
        setHasChanges(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento impostazioni');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle setting change
  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [key]: value,
    });
    setHasChanges(true);
    setSuccessMessage(null);
  };

  // Save settings
  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3077/EjLogHostVertimag/Settings', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.result === 'SUCCESS') {
        setSuccessMessage('Impostazioni salvate con successo');
        setHasChanges(false);
        // Reload to get updated values
        setTimeout(() => loadSettings(), 1000);
      } else {
        throw new Error(data.message || 'Errore nel salvataggio');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio impostazioni');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleResetToDefaults = async () => {
    if (!confirm('Sei sicuro di voler ripristinare le impostazioni predefinite?')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3077/EjLogHostVertimag/Settings/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSuccessMessage('Impostazioni ripristinate ai valori predefiniti');
      setHasChanges(false);
      loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel ripristino impostazioni');
      console.error('Error resetting settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card variant="error">
          <div className="p-4">
            <p className="text-red-700">Impossibile caricare le impostazioni</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Impostazioni Avanzate</h1>
          <p className="text-gray-600 mt-1">Configura le impostazioni di sistema</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={handleResetToDefaults}
            disabled={saving}
            title="Ripristina valori predefiniti"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveSettings}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salva Modifiche
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Changes Indicator */}
      {hasChanges && (
        <Card variant="warning">
          <div className="p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">
              Ci sono modifiche non salvate. Ricorda di cliccare su "Salva Modifiche".
            </span>
          </div>
        </Card>
      )}

      {/* Success Message */}
      {successMessage && (
        <Card variant="success">
          <div className="p-4">
            <p className="text-green-700">{successMessage}</p>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card variant="error">
          <div className="p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {/* General Settings */}
      <Card>
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Sliders className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold">Generale</h2>
            <Badge variant="primary">General</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Azienda
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.companyName}
                onChange={(e) => handleSettingChange('companyName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plant ID</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.plantId}
                onChange={(e) => handleSettingChange('plantId', parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lingua</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
              >
                <option value="it">Italiano</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.timezone}
                onChange={(e) => handleSettingChange('timezone', e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Warehouse Settings */}
      <Card>
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Sliders className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold">Magazzino</h2>
            <Badge variant="success">Warehouse</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableFIFO"
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                checked={settings.enableFIFO}
                onChange={(e) => handleSettingChange('enableFIFO', e.target.checked)}
              />
              <label htmlFor="enableFIFO" className="text-sm font-medium text-gray-700">
                Abilita FIFO
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableLotManagement"
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                checked={settings.enableLotManagement}
                onChange={(e) => handleSettingChange('enableLotManagement', e.target.checked)}
              />
              <label htmlFor="enableLotManagement" className="text-sm font-medium text-gray-700">
                Gestione Lotti
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableSerialNumbers"
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                checked={settings.enableSerialNumbers}
                onChange={(e) => handleSettingChange('enableSerialNumbers', e.target.checked)}
              />
              <label htmlFor="enableSerialNumbers" className="text-sm font-medium text-gray-700">
                Numeri Seriali
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableExpiryDateCheck"
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                checked={settings.enableExpiryDateCheck}
                onChange={(e) => handleSettingChange('enableExpiryDateCheck', e.target.checked)}
              />
              <label htmlFor="enableExpiryDateCheck" className="text-sm font-medium text-gray-700">
                Controllo Scadenza
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Magazzino Default
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.defaultWarehouse}
                onChange={(e) => handleSettingChange('defaultWarehouse', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* List Management Settings */}
      <Card>
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Sliders className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold">Gestione Liste</h2>
            <Badge variant="warning">List</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorità Default Liste
              </label>
              <input
                type="number"
                min="1"
                max="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.defaultListPriority}
                onChange={(e) =>
                  handleSettingChange('defaultListPriority', parseInt(e.target.value))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Liste per Operatore
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.maxListsPerOperator}
                onChange={(e) =>
                  handleSettingChange('maxListsPerOperator', parseInt(e.target.value))
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableAutoLaunch"
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                checked={settings.enableAutoLaunch}
                onChange={(e) => handleSettingChange('enableAutoLaunch', e.target.checked)}
              />
              <label htmlFor="enableAutoLaunch" className="text-sm font-medium text-gray-700">
                Avvio Automatico Liste
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableAutoRefilling"
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                checked={settings.enableAutoRefilling}
                onChange={(e) => handleSettingChange('enableAutoRefilling', e.target.checked)}
              />
              <label htmlFor="enableAutoRefilling" className="text-sm font-medium text-gray-700">
                Refilling Automatico
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Interface Settings */}
      <Card>
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Sliders className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold">Interfaccia</h2>
            <Badge variant="primary">Interface</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
              >
                <option value="light">Chiaro</option>
                <option value="dark">Scuro</option>
                <option value="auto">Automatico</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formato Data
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.dateFormat}
                onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formato Ora
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.timeFormat}
                onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
              >
                <option value="24h">24 ore</option>
                <option value="12h">12 ore (AM/PM)</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showDebugInfo"
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                checked={settings.showDebugInfo}
                onChange={(e) => handleSettingChange('showDebugInfo', e.target.checked)}
              />
              <label htmlFor="showDebugInfo" className="text-sm font-medium text-gray-700">
                Mostra Info Debug
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card>
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Sliders className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold">Sicurezza</h2>
            <Badge variant="error">Security</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout Sessione (minuti)
              </label>
              <input
                type="number"
                min="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lunghezza Minima Password
              </label>
              <input
                type="number"
                min="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.minPasswordLength}
                onChange={(e) =>
                  handleSettingChange('minPasswordLength', parseInt(e.target.value))
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enablePasswordExpiry"
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                checked={settings.enablePasswordExpiry}
                onChange={(e) => handleSettingChange('enablePasswordExpiry', e.target.checked)}
              />
              <label htmlFor="enablePasswordExpiry" className="text-sm font-medium text-gray-700">
                Scadenza Password
              </label>
            </div>
            {settings.enablePasswordExpiry && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giorni Scadenza Password
                </label>
                <input
                  type="number"
                  min="30"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={settings.passwordExpiryDays}
                  onChange={(e) =>
                    handleSettingChange('passwordExpiryDays', parseInt(e.target.value))
                  }
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireStrongPassword"
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                checked={settings.requireStrongPassword}
                onChange={(e) => handleSettingChange('requireStrongPassword', e.target.checked)}
              />
              <label htmlFor="requireStrongPassword" className="text-sm font-medium text-gray-700">
                Richiedi Password Forte
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;


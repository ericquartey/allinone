// ============================================================================
// EJLOG WMS - Settings General Page Enhanced
// Gestione completa impostazioni applicazione con UI/UX migliorata
// ============================================================================

import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  DevicePhoneMobileIcon,
  MoonIcon,
  SunIcon,
  BellIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowPathIcon,
  ClockIcon,
  LanguageIcon,
  CalendarIcon,
  ViewColumnsIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { Cog6ToothIcon } from '@heroicons/react/24/solid';
import {
  selectSettings,
  toggleTouchMode,
  toggleDarkMode,
  toggleCompactMode,
  setEnableNotifications,
  setSoundEnabled,
  setAutoRefresh,
  setRefreshInterval,
  setItemsPerPage,
  setLanguage,
  setDateFormat,
  setTimeFormat,
  resetSettings,
} from '../../features/settings/settingsSlice';

// ============================================================================
// Setting Card Component
// ============================================================================

interface SettingCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingCard: React.FC<SettingCardProps> = ({ icon: Icon, title, description, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-4 flex-1">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          {children}
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// Toggle Switch Component
// ============================================================================

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, label }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      enabled
        ? 'bg-blue-600 border-blue-600'
        : 'bg-gray-200 border-gray-300'
    }`}
  >
    {label && <span className="sr-only">{label}</span>}
    <span
      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        enabled ? 'translate-x-6' : 'translate-x-0'
      }`}
    />
  </button>
);

// ============================================================================
// Main Component
// ============================================================================

export default function SettingsGeneralPageEnhanced() {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);

  const handleResetSettings = () => {
    if (confirm('Sei sicuro di voler ripristinare tutte le impostazioni ai valori predefiniti?')) {
      dispatch(resetSettings());
      toast.success('Impostazioni ripristinate ai valori predefiniti');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Cog6ToothIcon className="h-12 w-12 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Impostazioni</h1>
                <p className="text-gray-600 mt-1">Configura l'applicazione secondo le tue preferenze</p>
              </div>
            </div>

            <button
              onClick={handleResetSettings}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span>Ripristina Default</span>
            </button>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="space-y-6">
          {/* ============================================================ */}
          {/* UI & APPEARANCE */}
          {/* ============================================================ */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Interfaccia Utente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Touch Mode */}
              <SettingCard
                icon={DevicePhoneMobileIcon}
                title="Modalità Touch"
                description="Ottimizza l'interfaccia per schermi touchscreen con pulsanti più grandi"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${settings.touchMode ? 'text-blue-600' : 'text-gray-500'}`}>
                    {settings.touchMode ? 'Attiva' : 'Disattiva'}
                  </span>
                  <ToggleSwitch
                    enabled={settings.touchMode}
                    onChange={() => {
                      dispatch(toggleTouchMode());
                      toast.success(settings.touchMode ? 'Modalità Touch disattivata' : 'Modalità Touch attivata');
                    }}
                    label="Touch Mode"
                  />
                </div>
              </SettingCard>

              {/* Dark Mode */}
              <SettingCard
                icon={settings.darkMode ? MoonIcon : SunIcon}
                title="Modalità Scura"
                description="Riduci l'affaticamento degli occhi con il tema scuro"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${settings.darkMode ? 'text-blue-600' : 'text-gray-500'}`}>
                    {settings.darkMode ? 'Attiva' : 'Disattiva'}
                  </span>
                  <ToggleSwitch
                    enabled={settings.darkMode}
                    onChange={() => {
                      dispatch(toggleDarkMode());
                      toast.success(settings.darkMode ? 'Tema chiaro attivato' : 'Tema scuro attivato');
                    }}
                    label="Dark Mode"
                  />
                </div>
                {settings.darkMode && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Funzionalità in sviluppo - disponibile prossimamente
                    </p>
                  </div>
                )}
              </SettingCard>

              {/* Compact Mode */}
              <SettingCard
                icon={ViewColumnsIcon}
                title="Modalità Compatta"
                description="Visualizza più contenuti riducendo gli spazi"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${settings.compactMode ? 'text-blue-600' : 'text-gray-500'}`}>
                    {settings.compactMode ? 'Attiva' : 'Disattiva'}
                  </span>
                  <ToggleSwitch
                    enabled={settings.compactMode}
                    onChange={() => {
                      dispatch(toggleCompactMode());
                      toast.success(settings.compactMode ? 'Modalità normale attivata' : 'Modalità compatta attivata');
                    }}
                    label="Compact Mode"
                  />
                </div>
              </SettingCard>

              {/* Sidebar State */}
              <SettingCard
                icon={Bars3Icon}
                title="Menu Laterale"
                description="Stato predefinito del menu laterale all'avvio"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${settings.sidebarCollapsed ? 'text-gray-500' : 'text-blue-600'}`}>
                    {settings.sidebarCollapsed ? 'Compresso' : 'Espanso'}
                  </span>
                  <ToggleSwitch
                    enabled={!settings.sidebarCollapsed}
                    onChange={(expanded) => dispatch({ type: 'settings/setSidebarCollapsed', payload: !expanded })}
                    label="Sidebar Expanded"
                  />
                </div>
              </SettingCard>
            </div>
          </div>

          {/* ============================================================ */}
          {/* NOTIFICATIONS */}
          {/* ============================================================ */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notifiche</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enable Notifications */}
              <SettingCard
                icon={BellIcon}
                title="Notifiche Push"
                description="Ricevi notifiche per eventi importanti"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${settings.enableNotifications ? 'text-blue-600' : 'text-gray-500'}`}>
                    {settings.enableNotifications ? 'Abilitate' : 'Disabilitate'}
                  </span>
                  <ToggleSwitch
                    enabled={settings.enableNotifications}
                    onChange={(enabled) => {
                      dispatch(setEnableNotifications(enabled));
                      toast.success(enabled ? 'Notifiche abilitate' : 'Notifiche disabilitate');
                    }}
                    label="Enable Notifications"
                  />
                </div>
              </SettingCard>

              {/* Sound Effects */}
              <SettingCard
                icon={settings.soundEnabled ? SpeakerWaveIcon : SpeakerXMarkIcon}
                title="Effetti Sonori"
                description="Riproduci suoni per le notifiche"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${settings.soundEnabled ? 'text-blue-600' : 'text-gray-500'}`}>
                    {settings.soundEnabled ? 'Attivi' : 'Silenziosi'}
                  </span>
                  <ToggleSwitch
                    enabled={settings.soundEnabled}
                    onChange={(enabled) => {
                      dispatch(setSoundEnabled(enabled));
                      toast.success(enabled ? 'Suoni attivati' : 'Suoni disattivati');
                    }}
                    label="Sound Effects"
                  />
                </div>
              </SettingCard>
            </div>
          </div>

          {/* ============================================================ */}
          {/* DATA & PERFORMANCE */}
          {/* ============================================================ */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Dati e Prestazioni</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Auto Refresh */}
              <SettingCard
                icon={ArrowPathIcon}
                title="Aggiornamento Automatico"
                description="Aggiorna automaticamente i dati in background"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-sm font-medium ${settings.autoRefresh ? 'text-blue-600' : 'text-gray-500'}`}>
                    {settings.autoRefresh ? 'Attivo' : 'Disattivo'}
                  </span>
                  <ToggleSwitch
                    enabled={settings.autoRefresh}
                    onChange={(enabled) => {
                      dispatch(setAutoRefresh(enabled));
                      toast.success(enabled ? 'Auto-refresh attivato' : 'Auto-refresh disattivato');
                    }}
                    label="Auto Refresh"
                  />
                </div>
                {settings.autoRefresh && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intervallo (secondi): {settings.refreshInterval}s
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="300"
                      step="5"
                      value={settings.refreshInterval}
                      onChange={(e) => dispatch(setRefreshInterval(Number(e.target.value)))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5s</span>
                      <span>5min</span>
                    </div>
                  </div>
                )}
              </SettingCard>

              {/* Items Per Page */}
              <SettingCard
                icon={ClockIcon}
                title="Elementi per Pagina"
                description="Numero di righe visualizzate nelle tabelle"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Righe: <span className="text-blue-600 font-bold">{settings.itemsPerPage}</span>
                    </span>
                  </div>
                  <select
                    value={settings.itemsPerPage}
                    onChange={(e) => {
                      dispatch(setItemsPerPage(Number(e.target.value)));
                      toast.success(`Impostati ${e.target.value} elementi per pagina`);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10 righe</option>
                    <option value={25}>25 righe</option>
                    <option value={50}>50 righe</option>
                    <option value={100}>100 righe</option>
                    <option value={200}>200 righe</option>
                  </select>
                </div>
              </SettingCard>
            </div>
          </div>

          {/* ============================================================ */}
          {/* LANGUAGE & LOCALE */}
          {/* ============================================================ */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lingua e Formato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Language */}
              <SettingCard
                icon={LanguageIcon}
                title="Lingua"
                description="Lingua dell'interfaccia utente"
              >
                <select
                  value={settings.language}
                  onChange={(e) => {
                    dispatch(setLanguage(e.target.value as 'it' | 'en'));
                    toast.success(`Lingua impostata: ${e.target.value === 'it' ? 'Italiano' : 'English'}`);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                </select>
              </SettingCard>

              {/* Date Format */}
              <SettingCard
                icon={CalendarIcon}
                title="Formato Data e Ora"
                description="Come visualizzare date e orari"
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Formato Data</label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => {
                        dispatch(setDateFormat(e.target.value as any));
                        toast.success(`Formato data: ${e.target.value}`);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="DD/MM/YYYY">GG/MM/AAAA (31/12/2024)</option>
                      <option value="MM/DD/YYYY">MM/GG/AAAA (12/31/2024)</option>
                      <option value="YYYY-MM-DD">AAAA-MM-GG (2024-12-31)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Formato Ora</label>
                    <select
                      value={settings.timeFormat}
                      onChange={(e) => {
                        dispatch(setTimeFormat(e.target.value as '12h' | '24h'));
                        toast.success(`Formato ora: ${e.target.value}`);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="24h">24 ore (14:30)</option>
                      <option value="12h">12 ore (2:30 PM)</option>
                    </select>
                  </div>
                </div>
              </SettingCard>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <svg
                className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Salvataggio Automatico</h4>
                <p className="text-sm text-blue-800">
                  Le modifiche alle impostazioni vengono salvate automaticamente nel browser.
                  Alcune modifiche potrebbero richiedere il ricaricamento della pagina per essere applicate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

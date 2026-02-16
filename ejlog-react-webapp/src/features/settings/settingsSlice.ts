// ============================================================================
// Settings Slice - Gestione impostazioni applicazione
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type {
  AIAssistantSettings,
  AIModel,
  AIContextDepth,
  IntegrationsSettings,
} from '../../types/settings';

interface SettingsState {
  // UI Settings
  touchMode: boolean;
  darkMode: boolean;
  compactMode: boolean;
  sidebarCollapsed: boolean;

  // Notifications
  enableNotifications: boolean;
  soundEnabled: boolean;

  // Data & Performance
  itemsPerPage: number;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds

  // Language & Locale
  language: 'it' | 'en';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';

  // AI Assistant
  aiAssistant: AIAssistantSettings;
  // External MAS host/IP override
  externalMasHost: string;

  // Integrations
  integrations: IntegrationsSettings;
}

// Carica impostazioni da localStorage
const loadSettings = (): SettingsState => {
  const defaultSettings: SettingsState = {
    // UI Settings
    touchMode: false,
    darkMode: false,
    compactMode: false,
    sidebarCollapsed: false,

    // Notifications
    enableNotifications: true,
    soundEnabled: true,

    // Data & Performance
    itemsPerPage: 50,
    autoRefresh: true,
    refreshInterval: 30,

    // Language & Locale
    language: 'it',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',

    // AI Assistant
    aiAssistant: {
      enabled: false,
      voiceEnabled: false,
      voiceOutput: true,
      autoTrigger: true,
      language: 'it',
      model: 'claude',
      contextDepth: 'standard',
      showAvatar: true,
    },
    externalMasHost: '',
    integrations: {
      sap: {
        enabled: false,
        mode: 'ODATA',
        baseUrl: '',
        client: '',
        systemId: '',
        username: '',
        password: '',
        oauth: {
          enabled: false,
          tokenUrl: '',
          clientId: '',
          clientSecret: '',
          scope: '',
        },
        rfc: {
          destination: '',
          gatewayHost: '',
          gatewayService: '',
          systemNumber: '',
          sapRouter: '',
        },
        idoc: {
          port: '',
          partner: '',
          messageType: '',
          basicType: '',
        },
        sftp: {
          host: '',
          port: 22,
          username: '',
          password: '',
          privateKey: '',
          inboundPath: '/inbound',
          outboundPath: '/outbound',
        },
        flows: {
          items: true,
          stock: true,
          orders: true,
          transfers: false,
          inventory: true,
          suppliers: false,
          customers: false,
        },
        mapping: {
          itemCodeSource: 'SAP_MATNR',
          locationCodeSource: 'SAP_LGORT',
          lotSource: 'SAP_CHARG',
        },
        lastTestAt: undefined,
      },
    },
  };

  try {
    const saved = localStorage.getItem('ejlog_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge con defaults per garantire che tutti i campi esistano
      const integrations = {
        ...defaultSettings.integrations,
        ...(parsed.integrations || {}),
        sap: {
          ...defaultSettings.integrations.sap,
          ...(parsed.integrations?.sap || {}),
          oauth: {
            ...defaultSettings.integrations.sap.oauth,
            ...(parsed.integrations?.sap?.oauth || {}),
          },
          rfc: {
            ...defaultSettings.integrations.sap.rfc,
            ...(parsed.integrations?.sap?.rfc || {}),
          },
          idoc: {
            ...defaultSettings.integrations.sap.idoc,
            ...(parsed.integrations?.sap?.idoc || {}),
          },
          sftp: {
            ...defaultSettings.integrations.sap.sftp,
            ...(parsed.integrations?.sap?.sftp || {}),
          },
          flows: {
            ...defaultSettings.integrations.sap.flows,
            ...(parsed.integrations?.sap?.flows || {}),
          },
          mapping: {
            ...defaultSettings.integrations.sap.mapping,
            ...(parsed.integrations?.sap?.mapping || {}),
          },
        },
      };

      return {
        ...defaultSettings,
        ...parsed,
        // Merge profondo per aiAssistant
        aiAssistant: {
          ...defaultSettings.aiAssistant,
          ...(parsed.aiAssistant || {}),
        },
        externalMasHost: parsed.externalMasHost || '',
        integrations,
      };
    }
  } catch (error) {
    console.error('Errore caricamento impostazioni:', error);
  }

  return defaultSettings;
};

// Salva impostazioni in localStorage
const saveSettings = (state: SettingsState) => {
  try {
    localStorage.setItem('ejlog_settings', JSON.stringify(state));
  } catch (error) {
    console.error('Errore salvataggio impostazioni:', error);
  }
};

const initialState: SettingsState = loadSettings();

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // UI Settings
    setTouchMode: (state, action: PayloadAction<boolean>) => {
      state.touchMode = action.payload;
      saveSettings(state);
    },
    toggleTouchMode: (state) => {
      state.touchMode = !state.touchMode;
      saveSettings(state);
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      saveSettings(state);
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      saveSettings(state);
    },
    setCompactMode: (state, action: PayloadAction<boolean>) => {
      state.compactMode = action.payload;
      saveSettings(state);
    },
    toggleCompactMode: (state) => {
      state.compactMode = !state.compactMode;
      saveSettings(state);
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      saveSettings(state);
    },

    // Notifications
    setEnableNotifications: (state, action: PayloadAction<boolean>) => {
      state.enableNotifications = action.payload;
      saveSettings(state);
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
      saveSettings(state);
    },

    // Data & Performance
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.itemsPerPage = action.payload;
      saveSettings(state);
    },
    setAutoRefresh: (state, action: PayloadAction<boolean>) => {
      state.autoRefresh = action.payload;
      saveSettings(state);
    },
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
      saveSettings(state);
    },

    // Language & Locale
    setLanguage: (state, action: PayloadAction<'it' | 'en'>) => {
      state.language = action.payload;
      saveSettings(state);
    },
    setDateFormat: (state, action: PayloadAction<'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'>) => {
      state.dateFormat = action.payload;
      saveSettings(state);
    },
    setTimeFormat: (state, action: PayloadAction<'12h' | '24h'>) => {
      state.timeFormat = action.payload;
      saveSettings(state);
    },
    setExternalMasHost: (state, action: PayloadAction<string>) => {
      state.externalMasHost = action.payload;
      saveSettings(state);
    },

    // Bulk update
    updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      Object.assign(state, action.payload);
      saveSettings(state);
    },

    // Reset
    resetSettings: () => {
      const defaults = loadSettings();
      localStorage.removeItem('ejlog_settings');
      return defaults;
    },

    // AI Assistant Actions
    toggleAIAssistant: (state) => {
      console.log('[settingsSlice] toggleAIAssistant - before:', state.aiAssistant.enabled);
      state.aiAssistant.enabled = !state.aiAssistant.enabled;
      console.log('[settingsSlice] toggleAIAssistant - after:', state.aiAssistant.enabled);
      saveSettings(state);
      console.log('[settingsSlice] toggleAIAssistant - saved to localStorage');
    },
    setAIEnabled: (state, action: PayloadAction<boolean>) => {
      state.aiAssistant.enabled = action.payload;
      saveSettings(state);
    },
    toggleAIVoice: (state) => {
      state.aiAssistant.voiceEnabled = !state.aiAssistant.voiceEnabled;
      saveSettings(state);
    },
    setAIVoiceEnabled: (state, action: PayloadAction<boolean>) => {
      state.aiAssistant.voiceEnabled = action.payload;
      saveSettings(state);
    },
    setAIVoiceOutput: (state, action: PayloadAction<boolean>) => {
      state.aiAssistant.voiceOutput = action.payload;
      saveSettings(state);
    },
    setAIAutoTrigger: (state, action: PayloadAction<boolean>) => {
      state.aiAssistant.autoTrigger = action.payload;
      saveSettings(state);
    },
    setAILanguage: (state, action: PayloadAction<'it' | 'en'>) => {
      state.aiAssistant.language = action.payload;
      saveSettings(state);
    },
    setAIModel: (state, action: PayloadAction<AIModel>) => {
      state.aiAssistant.model = action.payload;
      saveSettings(state);
    },
    setAIContextDepth: (state, action: PayloadAction<AIContextDepth>) => {
      state.aiAssistant.contextDepth = action.payload;
      saveSettings(state);
    },
    setAIShowAvatar: (state, action: PayloadAction<boolean>) => {
      state.aiAssistant.showAvatar = action.payload;
      saveSettings(state);
    },
  },
});

export const {
  // UI
  setTouchMode,
  toggleTouchMode,
  setDarkMode,
  toggleDarkMode,
  setCompactMode,
  toggleCompactMode,
  setSidebarCollapsed,
  // Notifications
  setEnableNotifications,
  setSoundEnabled,
  // Data & Performance
  setItemsPerPage,
  setAutoRefresh,
  setRefreshInterval,
  // Language & Locale
  setLanguage,
  setDateFormat,
  setTimeFormat,
  setExternalMasHost,
  // AI Assistant
  toggleAIAssistant,
  setAIEnabled,
  toggleAIVoice,
  setAIVoiceEnabled,
  setAIVoiceOutput,
  setAIAutoTrigger,
  setAILanguage,
  setAIModel,
  setAIContextDepth,
  setAIShowAvatar,
  // Bulk
  updateSettings,
  resetSettings,
} = settingsSlice.actions;

// Selectors
export const selectTouchMode = (state: RootState) => state.settings.touchMode;
export const selectDarkMode = (state: RootState) => state.settings.darkMode;
export const selectCompactMode = (state: RootState) => state.settings.compactMode;
export const selectSidebarCollapsed = (state: RootState) => state.settings.sidebarCollapsed;
export const selectEnableNotifications = (state: RootState) => state.settings.enableNotifications;
export const selectSoundEnabled = (state: RootState) => state.settings.soundEnabled;
export const selectItemsPerPage = (state: RootState) => state.settings.itemsPerPage;
export const selectAutoRefresh = (state: RootState) => state.settings.autoRefresh;
export const selectRefreshInterval = (state: RootState) => state.settings.refreshInterval;
export const selectLanguage = (state: RootState) => state.settings.language;
export const selectDateFormat = (state: RootState) => state.settings.dateFormat;
export const selectTimeFormat = (state: RootState) => state.settings.timeFormat;
export const selectExternalMasHost = (state: RootState) => state.settings.externalMasHost;
export const selectSettings = (state: RootState) => state.settings;
export const selectSapIntegrationSettings = (state: RootState) =>
  state.settings.integrations.sap;

// AI Assistant Selectors
export const selectAISettings = (state: RootState) => {
  console.log('[selectAISettings] state.settings:', state.settings);
  return state.settings?.aiAssistant;
};
export const selectAIEnabled = (state: RootState) => state.settings?.aiAssistant?.enabled || false;
export const selectAIVoiceEnabled = (state: RootState) => state.settings?.aiAssistant?.voiceEnabled || false;
export const selectAIModel = (state: RootState) => state.settings?.aiAssistant?.model || 'claude';

export default settingsSlice.reducer;

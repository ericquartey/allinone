// ============================================================================
// Settings Slice - Gestione impostazioni applicazione
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

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
}

// Carica impostazioni da localStorage
const loadSettings = (): SettingsState => {
  try {
    const saved = localStorage.getItem('ejlog_settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Errore caricamento impostazioni:', error);
  }

  return {
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
  };
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
export const selectSettings = (state: RootState) => state.settings;

export default settingsSlice.reducer;

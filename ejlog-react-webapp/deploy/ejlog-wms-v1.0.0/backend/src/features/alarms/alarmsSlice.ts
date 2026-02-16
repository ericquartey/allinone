// ============================================================================
// EJLOG WMS - Alarms Slice
// Gestione stato allarmi
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Alarm, AlarmFilters, AlarmSeverity } from '../../types/models';

interface AlarmsState {
  activeAlarms: Alarm[];
  filters: AlarmFilters;
  showOnlyActive: boolean;
  severityFilter: AlarmSeverity | 'all';
  soundEnabled: boolean;
  acknowledgedAlarms: number[]; // IDs allarmi già riconosciuti in sessione
}

const initialState: AlarmsState = {
  activeAlarms: [],
  filters: {
    page: 1,
    pageSize: 20,
    orderBy: 'occurredAt',
    sortDirection: 'desc',
    isActive: true,
  },
  showOnlyActive: true,
  severityFilter: 'all',
  soundEnabled: true,
  acknowledgedAlarms: [],
};

const alarmsSlice = createSlice({
  name: 'alarms',
  initialState,
  reducers: {
    setActiveAlarms: (state, action: PayloadAction<Alarm[]>) => {
      state.activeAlarms = action.payload;
    },
    addActiveAlarm: (state, action: PayloadAction<Alarm>) => {
      if (!state.activeAlarms.find((a) => a.id === action.payload.id)) {
        state.activeAlarms.unshift(action.payload);
      }
    },
    removeActiveAlarm: (state, action: PayloadAction<number>) => {
      state.activeAlarms = state.activeAlarms.filter((a) => a.id !== action.payload);
    },
    setFilters: (state, action: PayloadAction<Partial<AlarmFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    toggleShowOnlyActive: (state) => {
      state.showOnlyActive = !state.showOnlyActive;
      state.filters.isActive = state.showOnlyActive;
    },
    setSeverityFilter: (state, action: PayloadAction<AlarmSeverity | 'all'>) => {
      state.severityFilter = action.payload;
      state.filters.severity = action.payload === 'all' ? undefined : action.payload;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
    markAlarmAcknowledged: (state, action: PayloadAction<number>) => {
      if (!state.acknowledgedAlarms.includes(action.payload)) {
        state.acknowledgedAlarms.push(action.payload);
      }
    },
    clearAcknowledgedAlarms: (state) => {
      state.acknowledgedAlarms = [];
    },
  },
});

export const {
  setActiveAlarms,
  addActiveAlarm,
  removeActiveAlarm,
  setFilters,
  resetFilters,
  toggleShowOnlyActive,
  setSeverityFilter,
  toggleSound,
  markAlarmAcknowledged,
  clearAcknowledgedAlarms,
} = alarmsSlice.actions;
export default alarmsSlice.reducer;

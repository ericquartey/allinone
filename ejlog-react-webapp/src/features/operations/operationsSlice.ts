// ============================================================================
// EJLOG WMS - Operations Slice
// Gestione stato operazioni missione
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MissionOperation } from '../../types/models';

interface OperationsState {
  activeOperation: MissionOperation | null;
  operationQueue: MissionOperation[];
  filters: {
    machineId?: number;
    status?: number;
    itemListId?: number;
  };
  autoRefresh: boolean;
  refreshInterval: number; // secondi
}

const initialState: OperationsState = {
  activeOperation: null,
  operationQueue: [],
  filters: {},
  autoRefresh: true,
  refreshInterval: 30,
};

const operationsSlice = createSlice({
  name: 'operations',
  initialState,
  reducers: {
    setActiveOperation: (state, action: PayloadAction<MissionOperation | null>) => {
      state.activeOperation = action.payload;
    },
    setOperationQueue: (state, action: PayloadAction<MissionOperation[]>) => {
      state.operationQueue = action.payload;
    },
    addToQueue: (state, action: PayloadAction<MissionOperation>) => {
      if (!state.operationQueue.find((op) => op.id === action.payload.id)) {
        state.operationQueue.push(action.payload);
      }
    },
    removeFromQueue: (state, action: PayloadAction<number>) => {
      state.operationQueue = state.operationQueue.filter((op) => op.id !== action.payload);
    },
    clearQueue: (state) => {
      state.operationQueue = [];
    },
    setFilters: (
      state,
      action: PayloadAction<{
        machineId?: number;
        status?: number;
        itemListId?: number;
      }>
    ) => {
      state.filters = action.payload;
    },
    setAutoRefresh: (state, action: PayloadAction<boolean>) => {
      state.autoRefresh = action.payload;
    },
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
    },
  },
});

export const {
  setActiveOperation,
  setOperationQueue,
  addToQueue,
  removeFromQueue,
  clearQueue,
  setFilters,
  setAutoRefresh,
  setRefreshInterval,
} = operationsSlice.actions;
export default operationsSlice.reducer;

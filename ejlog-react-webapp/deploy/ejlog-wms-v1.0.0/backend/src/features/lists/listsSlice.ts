// ============================================================================
// EJLOG WMS - Lists Slice
// Gestione stato liste
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ItemList, ItemListRow, ListFilters } from '../../types/models';

interface ListsState {
  activeList: ItemList | null;
  selectedRow: ItemListRow | null;
  filters: ListFilters;
  executionState: {
    isExecuting: boolean;
    currentRowIndex: number;
    completedRows: number[];
  };
}

const initialState: ListsState = {
  activeList: null,
  selectedRow: null,
  filters: {
    page: 1,
    pageSize: 20,
    orderBy: 'createdAt',
    sortDirection: 'desc',
  },
  executionState: {
    isExecuting: false,
    currentRowIndex: 0,
    completedRows: [],
  },
};

const listsSlice = createSlice({
  name: 'lists',
  initialState,
  reducers: {
    setActiveList: (state, action: PayloadAction<ItemList | null>) => {
      state.activeList = action.payload;
      // Reset execution state quando cambia lista
      if (action.payload?.id !== state.activeList?.id) {
        state.executionState = initialState.executionState;
      }
    },
    setSelectedRow: (state, action: PayloadAction<ItemListRow | null>) => {
      state.selectedRow = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<ListFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    startExecution: (state) => {
      state.executionState.isExecuting = true;
    },
    stopExecution: (state) => {
      state.executionState.isExecuting = false;
    },
    setCurrentRowIndex: (state, action: PayloadAction<number>) => {
      state.executionState.currentRowIndex = action.payload;
    },
    markRowCompleted: (state, action: PayloadAction<number>) => {
      if (!state.executionState.completedRows.includes(action.payload)) {
        state.executionState.completedRows.push(action.payload);
      }
    },
    resetExecutionState: (state) => {
      state.executionState = initialState.executionState;
    },
  },
});

export const {
  setActiveList,
  setSelectedRow,
  setFilters,
  resetFilters,
  startExecution,
  stopExecution,
  setCurrentRowIndex,
  markRowCompleted,
  resetExecutionState,
} = listsSlice.actions;
export default listsSlice.reducer;

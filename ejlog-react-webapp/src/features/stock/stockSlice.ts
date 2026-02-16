// ============================================================================
// EJLOG WMS - Stock Slice
// Gestione stato giacenze
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { StockFilters } from '../../types/models';

interface StockState {
  filters: StockFilters;
  groupBy: 'item' | 'location' | 'lot' | 'none';
  showOnlyBelowMin: boolean;
  showOnlyBlocked: boolean;
}

const initialState: StockState = {
  filters: {
    page: 1,
    pageSize: 50,
    orderBy: 'itemCode',
    sortDirection: 'asc',
  },
  groupBy: 'none',
  showOnlyBelowMin: false,
  showOnlyBlocked: false,
};

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<StockFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setGroupBy: (state, action: PayloadAction<'item' | 'location' | 'lot' | 'none'>) => {
      state.groupBy = action.payload;
    },
    toggleShowOnlyBelowMin: (state) => {
      state.showOnlyBelowMin = !state.showOnlyBelowMin;
      state.filters.belowMinStock = state.showOnlyBelowMin;
    },
    toggleShowOnlyBlocked: (state) => {
      state.showOnlyBlocked = !state.showOnlyBlocked;
      state.filters.isBlocked = state.showOnlyBlocked;
    },
  },
});

export const {
  setFilters,
  resetFilters,
  setGroupBy,
  toggleShowOnlyBelowMin,
  toggleShowOnlyBlocked,
} = stockSlice.actions;
export default stockSlice.reducer;

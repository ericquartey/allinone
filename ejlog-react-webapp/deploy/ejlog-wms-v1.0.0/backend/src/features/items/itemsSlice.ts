// ============================================================================
// EJLOG WMS - Items Slice
// Gestione stato articoli
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Item, ItemFilters } from '../../types/models';

interface ItemsState {
  selectedItem: Item | null;
  filters: ItemFilters;
  searchQuery: string;
  viewMode: 'grid' | 'list';
  recentItems: Item[];
}

const initialState: ItemsState = {
  selectedItem: null,
  filters: {
    page: 1,
    pageSize: 20,
    orderBy: 'code',
    sortDirection: 'asc',
  },
  searchQuery: '',
  viewMode: 'list',
  recentItems: [],
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    setSelectedItem: (state, action: PayloadAction<Item | null>) => {
      state.selectedItem = action.payload;
      // Aggiungi a recenti se non null
      if (action.payload && !state.recentItems.find((i) => i.id === action.payload!.id)) {
        state.recentItems = [action.payload, ...state.recentItems].slice(0, 10);
      }
    },
    setFilters: (state, action: PayloadAction<Partial<ItemFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.filters.search = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.viewMode = action.payload;
    },
    clearRecentItems: (state) => {
      state.recentItems = [];
    },
  },
});

export const {
  setSelectedItem,
  setFilters,
  resetFilters,
  setSearchQuery,
  setViewMode,
  clearRecentItems,
} = itemsSlice.actions;
export default itemsSlice.reducer;

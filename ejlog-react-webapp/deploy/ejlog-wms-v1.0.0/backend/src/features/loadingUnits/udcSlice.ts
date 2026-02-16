// ============================================================================
// EJLOG WMS - UDC Slice
// Gestione stato unità di carico
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LoadingUnit, Compartment } from '../../types/models';

interface UdcState {
  currentUdc: LoadingUnit | null;
  selectedCompartment: Compartment | null;
  viewMode: '2D' | '3D';
  highlightedCompartments: number[];
}

const initialState: UdcState = {
  currentUdc: null,
  selectedCompartment: null,
  viewMode: '2D',
  highlightedCompartments: [],
};

const udcSlice = createSlice({
  name: 'udc',
  initialState,
  reducers: {
    setCurrentUdc: (state, action: PayloadAction<LoadingUnit | null>) => {
      state.currentUdc = action.payload;
      // Reset selezione compartimento quando cambia UDC
      if (action.payload?.id !== state.currentUdc?.id) {
        state.selectedCompartment = null;
        state.highlightedCompartments = [];
      }
    },
    setSelectedCompartment: (state, action: PayloadAction<Compartment | null>) => {
      state.selectedCompartment = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'2D' | '3D'>) => {
      state.viewMode = action.payload;
    },
    highlightCompartments: (state, action: PayloadAction<number[]>) => {
      state.highlightedCompartments = action.payload;
    },
    clearHighlights: (state) => {
      state.highlightedCompartments = [];
    },
  },
});

export const {
  setCurrentUdc,
  setSelectedCompartment,
  setViewMode,
  highlightCompartments,
  clearHighlights,
} = udcSlice.actions;
export default udcSlice.reducer;

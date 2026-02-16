// ============================================================================
// EJLOG WMS - Machines Slice
// Gestione stato macchine
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MachineInfo } from '../../types/models';

interface MachinesState {
  selectedMachine: MachineInfo | null;
  currentBay: number | null;
  machineStatuses: Record<number, string>; // machineId -> status
  liveMonitoring: boolean;
}

const initialState: MachinesState = {
  selectedMachine: null,
  currentBay: null,
  machineStatuses: {},
  liveMonitoring: false,
};

const machinesSlice = createSlice({
  name: 'machines',
  initialState,
  reducers: {
    setSelectedMachine: (state, action: PayloadAction<MachineInfo | null>) => {
      state.selectedMachine = action.payload;
      // Reset baia quando cambia macchina
      if (action.payload?.id !== state.selectedMachine?.id) {
        state.currentBay = null;
      }
    },
    setCurrentBay: (state, action: PayloadAction<number | null>) => {
      state.currentBay = action.payload;
    },
    updateMachineStatus: (state, action: PayloadAction<{ machineId: number; status: string }>) => {
      state.machineStatuses[action.payload.machineId] = action.payload.status;
    },
    setLiveMonitoring: (state, action: PayloadAction<boolean>) => {
      state.liveMonitoring = action.payload;
    },
    clearMachineStatuses: (state) => {
      state.machineStatuses = {};
    },
  },
});

export const {
  setSelectedMachine,
  setCurrentBay,
  updateMachineStatus,
  setLiveMonitoring,
  clearMachineStatuses,
} = machinesSlice.actions;
export default machinesSlice.reducer;

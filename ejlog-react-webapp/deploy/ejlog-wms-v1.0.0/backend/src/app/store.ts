// ============================================================================
// EJLOG WMS - Redux Store Configuration
// Configurazione centrale dello store Redux con RTK Query
// ============================================================================

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '../services/api/baseApi';
import authReducer from '../features/auth/authSlice';
import itemsReducer from '../features/items/itemsSlice';
import listsReducer from '../features/lists/listsSlice';
import udcReducer from '../features/loadingUnits/udcSlice';
import operationsReducer from '../features/operations/operationsSlice';
import stockReducer from '../features/stock/stockSlice';
import machinesReducer from '../features/machines/machinesSlice';
import alarmsReducer from '../features/alarms/alarmsSlice';
import settingsReducer from '../features/settings/settingsSlice';
import { autoLoginMiddleware } from './autoLoginMiddleware';

export const store = configureStore({
  reducer: {
    // RTK Query API
    [baseApi.reducerPath]: baseApi.reducer,

    // Feature slices
    auth: authReducer,
    items: itemsReducer,
    lists: listsReducer,
    udc: udcReducer,
    operations: operationsReducer,
    stock: stockReducer,
    machines: machinesReducer,
    alarms: alarmsReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignora le action di RTK Query che potrebbero contenere valori non serializzabili
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
      .concat(baseApi.middleware)
      .concat(autoLoginMiddleware), // Auto-login middleware MUST run after all other middleware
  devTools: process.env.NODE_ENV !== 'production',
});

// Abilita refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// Tipi TypeScript per l'intero store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

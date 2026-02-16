// ============================================================================
// EJLOG WMS - Redux Typed Hooks
// Hook tipizzati per TypeScript
// ============================================================================

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Usa questi hook al posto di useDispatch e useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

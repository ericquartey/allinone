// src/hooks/useDrawers.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { drawersApi } from '../services/drawersApi';
import type {
  LoadingUnit,
  Compartment,
  DrawerFilters,
  CompartmentFilters,
  CreateLoadingUnitRequest,
  UpdateLoadingUnitRequest,
  CallLoadingUnitResponse
} from '../types/drawers';

/**
 * Custom hook for managing loading units (drawers) state and operations
 */
export const useDrawers = (filters?: DrawerFilters) => {
  const [drawers, setDrawers] = useState<LoadingUnit[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, { ts: number; items: LoadingUnit[]; totalCount: number }>>({});

  // Stable reference for filters to prevent infinite loops
  const filtersRef = useRef<string>('');
  const currentFiltersStr = JSON.stringify(filters || {});
  const CACHE_TTL = 30 * 1000; // 30s cache per filtro

  const fetchDrawers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cacheKey = currentFiltersStr;
      const cached = cache[cacheKey];
      const now = Date.now();

      if (cached && now - cached.ts < CACHE_TTL) {
        setDrawers(cached.items);
        setTotalCount(cached.totalCount);
        setLoading(false);
        return;
      }

      const response = await drawersApi.getAllLoadingUnits(filters);
      setDrawers(response.items);
      setTotalCount(response.totalCount);
      setCache(prev => ({ ...prev, [cacheKey]: { ts: now, items: response.items, totalCount: response.totalCount } }));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Errore nel caricamento dei cassetti');
      console.error('Error fetching drawers:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const getDrawerById = useCallback(async (id: number): Promise<LoadingUnit | null> => {
    setLoading(true);
    setError(null);

    try {
      const drawer = await drawersApi.getLoadingUnitById(id);
      return drawer;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Errore nel caricamento del cassetto');
      console.error('Error fetching drawer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createDrawer = useCallback(async (data: CreateLoadingUnitRequest): Promise<LoadingUnit | null> => {
    setLoading(true);
    setError(null);

    try {
      const newDrawer = await drawersApi.createLoadingUnit(data);
      await fetchDrawers(); // Refresh the list
      return newDrawer;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Errore nella creazione del cassetto');
      console.error('Error creating drawer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDrawers]);

  const updateDrawer = useCallback(async (id: number, data: UpdateLoadingUnitRequest): Promise<LoadingUnit | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedDrawer = await drawersApi.updateLoadingUnit(id, data);
      await fetchDrawers(); // Refresh the list
      return updatedDrawer;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Errore nell\'aggiornamento del cassetto');
      console.error('Error updating drawer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDrawers]);

  const deleteDrawer = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await drawersApi.deleteLoadingUnit(id);
      await fetchDrawers(); // Refresh the list
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Errore nell\'eliminazione del cassetto');
      console.error('Error deleting drawer:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDrawers]);

  const callDrawer = useCallback(async (id: number, destinationId?: number): Promise<CallLoadingUnitResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await drawersApi.callLoadingUnit(id, destinationId);
      await fetchDrawers(); // Refresh the list
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Errore nella chiamata del cassetto');
      console.error('Error calling drawer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDrawers]);

  useEffect(() => {
    // Only fetch if filters actually changed (by comparing stringified version)
    if (filtersRef.current !== currentFiltersStr) {
      filtersRef.current = currentFiltersStr;
      fetchDrawers();
    }
  }, [currentFiltersStr, fetchDrawers]);

  return {
    drawers,
    totalCount,
    loading,
    error,
    fetchDrawers,
    getDrawerById,
    createDrawer,
    updateDrawer,
    deleteDrawer,
    callDrawer
  };
};

/**
 * Custom hook for managing compartments state and operations
 */
export const useCompartments = (loadingUnitId?: number, filters?: CompartmentFilters) => {
  const [compartments, setCompartments] = useState<Compartment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Stable reference for loadingUnitId and filters to prevent infinite loops
  const filtersRef = useRef<string>('');
  const loadingUnitIdRef = useRef<number | undefined>(undefined);
  const currentFiltersStr = JSON.stringify({ loadingUnitId, filters });

  const fetchCompartments = useCallback(async () => {
    if (!loadingUnitId) {
      setCompartments([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await drawersApi.getCompartmentsByLoadingUnit(loadingUnitId, filters);
      setCompartments(response.items);
      setTotalCount(response.totalCount);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Errore nel caricamento degli scomparti');
      console.error('Error fetching compartments:', err);
    } finally {
      setLoading(false);
    }
  }, [loadingUnitId, filters]);

  const updateFillPercentage = useCallback(async (compartmentId: number, percentage: number): Promise<Compartment | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedCompartment = await drawersApi.updateCompartmentFillPercentage(compartmentId, percentage);
      await fetchCompartments(); // Refresh the list
      return updatedCompartment;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Errore nell\'aggiornamento della percentuale di riempimento');
      console.error('Error updating fill percentage:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCompartments]);

  const boxToCompartment = useCallback(async (compartmentId: number, barcode?: string, command?: number): Promise<Compartment | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedCompartment = await drawersApi.boxToCompartment(compartmentId, { barcode, command });
      await fetchCompartments(); // Refresh the list
      return updatedCompartment;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Errore nell\'operazione box-to-compartment');
      console.error('Error in box-to-compartment operation:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCompartments]);

  useEffect(() => {
    // Only fetch if loadingUnitId or filters actually changed
    if (filtersRef.current !== currentFiltersStr || loadingUnitIdRef.current !== loadingUnitId) {
      filtersRef.current = currentFiltersStr;
      loadingUnitIdRef.current = loadingUnitId;
      fetchCompartments();
    }
  }, [currentFiltersStr, loadingUnitId, fetchCompartments]);

  return {
    compartments,
    totalCount,
    loading,
    error,
    fetchCompartments,
    updateFillPercentage,
    boxToCompartment
  };
};

import { useCallback } from 'react';
import { PPC_BAY_NUMBER } from '../config/api';
import type { BayAccessories } from '../services/ppc/automationTypes';
import { useGetAccessoriesQuery } from '../services/api/ppcAutomationApi';

type PpcAccessoriesState = {
  accessories: BayAccessories | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const usePpcAccessories = (bayNumber: number = PPC_BAY_NUMBER): PpcAccessoriesState => {
  const query = useGetAccessoriesQuery(bayNumber, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    accessories: (query.data as BayAccessories | undefined) ?? null,
    isLoading: query.isFetching,
    error: query.error ? 'PPC accessories error' : null,
    refresh,
  };
};

export default usePpcAccessories;

import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface ListRow {
  id: number;
  numeroLista: number;
  numeroRiga: number;
  codiceArticolo: string;
  descrizioneArticolo: string;
  quantita: number;
  um: string;
  ubicazione?: string;
  lotto?: string;
  note?: string;
}

interface ListRowsResponse {
  success: boolean;
  items: ListRow[];
  totalCount: number;
  skip: number;
  take: number;
}

interface UseListRowsParams {
  listId: number;
  enabled?: boolean;
  skip?: number;
  take?: number;
}

export function useListRows({ listId, enabled = true, skip = 0, take = 100 }: UseListRowsParams) {
  return useQuery<ListRowsResponse>({
    queryKey: ['listRows', listId, skip, take],
    queryFn: async () => {
      const response = await api.get<ListRowsResponse>(
        `/api/item-lists/${listId}/items`,
        {
          params: { skip, take }
        }
      );
      return response.data;
    },
    enabled: enabled && listId > 0,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

// Hook per ottenere righe di più liste contemporaneamente
export function useMultipleListsRows(listIds: number[]) {
  return useQuery<{ [key: number]: ListRowsResponse }>({
    queryKey: ['multipleListsRows', listIds.sort()],
    queryFn: async () => {
      const results: { [key: number]: ListRowsResponse } = {};

      // Fetch in parallel
      const promises = listIds.map(async (listId) => {
        try {
          const response = await api.get<ListRowsResponse>(
            `/api/item-lists/${listId}/items`,
            {
              params: { skip: 0, take: 1000 }
            }
          );
          results[listId] = response.data;
        } catch (error) {
          console.error(`Error fetching rows for list ${listId}:`, error);
          results[listId] = {
            success: false,
            items: [],
            totalCount: 0,
            skip: 0,
            take: 0,
          };
        }
      });

      await Promise.all(promises);
      return results;
    },
    enabled: listIds.length > 0,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export type { ListRow, ListRowsResponse };

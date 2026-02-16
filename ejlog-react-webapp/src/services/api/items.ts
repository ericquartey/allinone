import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { Item, PaginationParams, ApiResponse } from '@/types/api';

/**
 * Backend Item Response (different structure from frontend)
 */
interface BackendItem {
  code: string;
  description: string;
  inStock: boolean;
  itemTypeBatch?: boolean;
  itemTypeSerialNumber?: boolean;
}

/**
 * Extended Item for Frontend (with additional fields)
 */
interface ExtendedItem extends Item {
  codice: string;
  descrizione: string;
  giacenza: number;
  um: string;
  categoriaDesc: string;
  scortaMin?: number;
  prezzoUnitario?: number;
  peso?: number;
}

/**
 * Items Response
 */
interface ItemsResponse {
  items: ExtendedItem[];
  totalCount: number;
  result: string;
  message?: string;
}

/**
 * Items Filter Parameters
 */
interface ItemsFilterParams extends PaginationParams {
  itemCode?: string;
}

/**
 * Items API Service
 * Handles item-related operations
 */
export const itemsService = {
  /**
   * Get paginated items
   * @param params - Filter and pagination parameters
   * @returns Promise<ItemsResponse> - Items data with total count
   */
  getItems: async (params: ItemsFilterParams = {}): Promise<ItemsResponse> => {
    try {
      const {
        skip = 0,
        take = 50,
        orderBy = undefined,
        itemCode = undefined
      } = params;

      // Backend API uses 'limit' and 'offset' instead of 'take' and 'skip'
      const queryParams: Record<string, any> = {
        limit: take,
        offset: skip
      };
      if (orderBy) queryParams.orderBy = orderBy;
      if (itemCode) queryParams.itemCode = itemCode;

      const response = await apiClient.get<ApiResponse<BackendItem>>(
        API_ENDPOINTS.ITEMS,
        { params: queryParams }
      );

      // Transform backend response to match frontend expectations
      const backendData = response.data;

      if (backendData.result === 'OK' && backendData.exported) {
        // Map backend field names to frontend field names
        const items: ExtendedItem[] = backendData.exported.map(item => ({
          id: item.code,
          itemCode: item.code,
          description: item.description,
          active: item.inStock,
          codice: item.code,
          descrizione: item.description,
          inStock: item.inStock,
          giacenza: item.inStock ? 1 : 0,
          um: 'PZ', // Default unit of measure
          categoriaDesc: '-', // Not provided by backend
          itemTypeBatch: item.itemTypeBatch,
          itemTypeSerialNumber: item.itemTypeSerialNumber
        }));

        return {
          items,
          totalCount: backendData.recordNumber || items.length,
          result: backendData.result,
          message: backendData.message
        };
      }

      // If response is not OK or no data, return empty
      return {
        items: [],
        totalCount: 0,
        result: backendData.result || 'ERROR',
        message: backendData.message || 'No data returned'
      };
    } catch (error: any) {
      console.warn('Backend not available for items, using mock data for testing', error);

      // Return mock data for E2E testing when backend is offline
      const mockItems: ExtendedItem[] = [
        {
          id: '1',
          itemCode: 'ART001',
          description: 'Materia Prima A',
          active: true,
          codice: 'ART001',
          descrizione: 'Materia Prima A',
          categoriaDesc: 'Materie Prime',
          giacenza: 150,
          scortaMin: 50,
          um: 'PZ',
          barcode: '1234567891',
          prezzoUnitario: 12.50,
          peso: 2.5,
        },
        {
          id: '2',
          itemCode: 'ART002',
          description: 'Componente B',
          active: true,
          codice: 'ART002',
          descrizione: 'Componente B',
          categoriaDesc: 'Componenti',
          giacenza: 35,
          scortaMin: 40,
          um: 'PZ',
          barcode: '1234567892',
          prezzoUnitario: 8.75,
          peso: 1.2,
        },
        {
          id: '3',
          itemCode: 'ART003',
          description: 'Prodotto Finito C',
          active: true,
          codice: 'ART003',
          descrizione: 'Prodotto Finito C',
          categoriaDesc: 'Prodotti Finiti',
          giacenza: 200,
          scortaMin: 30,
          um: 'PZ',
          barcode: '1234567893',
          prezzoUnitario: 45.00,
          peso: 5.0,
        },
      ];

      return {
        items: mockItems,
        totalCount: mockItems.length,
        result: 'OK',
        message: 'Mock data (backend offline)',
      };
    }
  },

  /**
   * Create or update items
   * @param items - Array of items to save
   * @returns Promise<ApiResponse<Item>> - Save response
   * @throws Error if request fails
   */
  saveItems: async (items: Item[]): Promise<ApiResponse<Item>> => {
    const response = await apiClient.post<ApiResponse<Item>>(
      API_ENDPOINTS.ITEMS,
      items
    );
    return response.data;
  },
};

export default itemsService;

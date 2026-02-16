import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { PaginationParams } from '@/types/api';

/**
 * Reservation Status Types
 */
export type ReservationStatus = 'ATTIVA' | 'COMPLETATA' | 'IN_PROGRESS' | 'CANCELLED';
export type ReservationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Reservation Interface
 */
export interface Reservation {
  id: number;
  articleCode: string;
  articleDescription: string;
  quantityReserved: number;
  quantityMoved: number;
  udc: string;
  udcBarcode?: string;
  locationSource: string;
  locationDestination: string;
  status: ReservationStatus;
  listId: number;
  listType: number;
  listDescription?: string;
  priority: ReservationPriority;
  assignedTo: string;
  createdDate: string;
  lastUpdate: string;
  notes?: string;
  history?: ReservationHistoryItem[];
}

/**
 * Reservation History Item
 */
export interface ReservationHistoryItem {
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

/**
 * Reservations Filter Parameters
 */
export interface ReservationsFilterParams extends PaginationParams {
  articleCode?: string;
  status?: ReservationStatus;
  dateFrom?: string;
  dateTo?: string;
  listId?: number;
}

/**
 * Reservations Response
 */
export interface ReservationsResponse {
  reservations: Reservation[];
  totalCount: number;
}

/**
 * Reservations API Service
 * Handles reservation-related operations (Prenotazioni)
 */
export const reservationsService = {
  /**
   * Get paginated reservations
   * @param params - Filter and pagination parameters
   * @returns Promise<ReservationsResponse> - Reservations data
   */
  getReservations: async (params: ReservationsFilterParams = {}): Promise<ReservationsResponse> => {
    try {
      const {
        skip = 0,
        take = 20,
        articleCode = undefined,
        status = undefined,
        dateFrom = undefined,
        dateTo = undefined,
        listId = undefined
      } = params;

      const queryParams: Record<string, any> = {
        limit: take,
        offset: skip
      };
      if (articleCode) queryParams.articleCode = articleCode;
      if (status) queryParams.status = status;
      if (dateFrom) queryParams.dateFrom = dateFrom;
      if (dateTo) queryParams.dateTo = dateTo;
      if (listId) queryParams.listId = listId;

      const response = await apiClient.get<ReservationsResponse>(
        API_ENDPOINTS.RESERVATIONS,
        { params: queryParams }
      );
      return response.data;
    } catch (error) {
      // Fallback to mock data if backend not available
      console.warn('Backend not available, using mock data for reservations');

      const mockReservations: Reservation[] = [
        {
          id: 1,
          articleCode: 'ART001',
          articleDescription: 'Articolo Test 1',
          quantityReserved: 100,
          quantityMoved: 25,
          udc: 'UDC001',
          locationSource: 'A-01-01',
          locationDestination: 'B-02-03',
          status: 'ATTIVA',
          listId: 1,
          listType: 0,
          priority: 'HIGH',
          assignedTo: 'operatore1',
          createdDate: '2025-11-25T10:00:00',
          lastUpdate: '2025-11-25T11:30:00',
        },
        {
          id: 2,
          articleCode: 'ART002',
          articleDescription: 'Articolo Test 2',
          quantityReserved: 50,
          quantityMoved: 50,
          udc: 'UDC002',
          locationSource: 'A-02-05',
          locationDestination: 'C-01-01',
          status: 'COMPLETATA',
          listId: 1,
          listType: 0,
          priority: 'MEDIUM',
          assignedTo: 'operatore1',
          createdDate: '2025-11-25T09:00:00',
          lastUpdate: '2025-11-25T10:45:00',
        },
        {
          id: 3,
          articleCode: 'ART003',
          articleDescription: 'Articolo Test 3',
          quantityReserved: 75,
          quantityMoved: 0,
          udc: 'UDC003',
          locationSource: 'B-03-02',
          locationDestination: 'D-01-04',
          status: 'ATTIVA',
          listId: 2,
          listType: 1,
          priority: 'LOW',
          assignedTo: 'operatore2',
          createdDate: '2025-11-25T08:00:00',
          lastUpdate: '2025-11-25T08:15:00',
        },
      ];

      // Apply filters to mock data
      let filteredReservations = [...mockReservations];

      if (articleCode) {
        filteredReservations = filteredReservations.filter(r =>
          r.articleCode.toLowerCase().includes(articleCode.toLowerCase())
        );
      }

      if (status) {
        filteredReservations = filteredReservations.filter(r => r.status === status);
      }

      if (listId) {
        filteredReservations = filteredReservations.filter(r => r.listId === listId);
      }

      // Apply pagination
      const paginatedReservations = filteredReservations.slice(skip, skip + take);

      return {
        reservations: paginatedReservations,
        totalCount: filteredReservations.length,
      };
    }
  },

  /**
   * Get single reservation details
   * @param id - Reservation ID
   * @returns Promise<Reservation> - Reservation details
   */
  getReservationById: async (id: number): Promise<Reservation> => {
    try {
      const response = await apiClient.get<Reservation>(
        `${API_ENDPOINTS.RESERVATIONS}/${id}`
      );
      return response.data;
    } catch (error) {
      // Fallback to mock data
      console.warn('Backend not available, using mock data for reservation details');

      return {
        id: id,
        articleCode: 'ART001',
        articleDescription: 'Articolo Test 1 - Descrizione Completa',
        quantityReserved: 100,
        quantityMoved: 25,
        udc: 'UDC001',
        udcBarcode: '1234567890123',
        locationSource: 'A-01-01',
        locationDestination: 'B-02-03',
        status: 'ATTIVA',
        listId: 1,
        listType: 0,
        listDescription: 'Lista picking magazzino A',
        priority: 'HIGH',
        assignedTo: 'operatore1',
        createdDate: '2025-11-25T10:00:00',
        lastUpdate: '2025-11-25T11:30:00',
        notes: 'Prenotazione di test per articolo prioritario',
        history: [
          {
            timestamp: '2025-11-25T10:00:00',
            action: 'CREATED',
            user: 'system',
            details: 'Prenotazione creata automaticamente dalla lista',
          },
          {
            timestamp: '2025-11-25T10:30:00',
            action: 'ASSIGNED',
            user: 'supervisor1',
            details: "Assegnata all'operatore1",
          },
          {
            timestamp: '2025-11-25T11:00:00',
            action: 'STARTED',
            user: 'operatore1',
            details: 'Prelievo iniziato',
          },
          {
            timestamp: '2025-11-25T11:30:00',
            action: 'PARTIAL_MOVE',
            user: 'operatore1',
            details: 'Movimentate 25 unità su 100',
          },
        ],
      };
    }
  },

  /**
   * Update reservation status
   * @param id - Reservation ID
   * @param status - New status
   * @returns Promise<Reservation> - Updated reservation
   */
  updateReservationStatus: async (id: number, status: ReservationStatus): Promise<Reservation> => {
    const response = await apiClient.patch<Reservation>(
      `${API_ENDPOINTS.RESERVATIONS}/${id}/status`,
      { status }
    );
    return response.data;
  },
};

export default reservationsService;

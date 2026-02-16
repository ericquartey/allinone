// ============================================================================
// EJLOG WMS - Dashboard API Service
// Servizio API per dati dashboard con mock data realistici
// ============================================================================

import { baseApi } from './baseApi';
import type {
  ProductsOverviewData,
  ItemsAnalyticsData,
  MovementsRealtimeData,
  LocationsHeatmapData,
  KPICardsData,
  DashboardFilters,
  DashboardApiResponse,
} from '../../features/dashboard/types/dashboard.types';

// ============================================================================
// MOCK DATA - Da sostituire con chiamate reali al backend
// ============================================================================

/**
 * Genera mock data per Products Overview
 */
const generateProductsOverviewMock = (): ProductsOverviewData => {
  return {
    totalProducts: 247,
    totalValue: 1254380.50,
    categories: [
      { category: 'Elettronica', count: 85, value: 456200.00, percentage: 34.4, color: '#3B82F6' },
      { category: 'Meccanica', count: 62, value: 325100.50, percentage: 25.1, color: '#10B981' },
      { category: 'Componenti', count: 48, value: 198750.00, percentage: 19.4, color: '#F59E0B' },
      { category: 'Materiali', count: 35, value: 165200.00, percentage: 14.2, color: '#EF4444' },
      { category: 'Altri', count: 17, value: 109130.00, percentage: 6.9, color: '#8B5CF6' },
    ],
    topProducts: [
      { id: 1, code: 'PROD-001', description: 'Motore elettrico 3kW', quantity: 145, value: 87000.00 },
      { id: 2, code: 'PROD-042', description: 'Scheda controllo PLC', quantity: 89, value: 53400.00 },
      { id: 3, code: 'PROD-128', description: 'Sensore laser alta precisione', quantity: 76, value: 91200.00 },
      { id: 4, code: 'PROD-089', description: 'Riduttore epicicloidale', quantity: 64, value: 38400.00 },
      { id: 5, code: 'PROD-215', description: 'Inverter trifase 5kW', quantity: 58, value: 46400.00 },
      { id: 6, code: 'PROD-167', description: 'Encoder ottico incrementale', quantity: 52, value: 31200.00 },
      { id: 7, code: 'PROD-093', description: 'Cilindro pneumatico Ø80', quantity: 47, value: 28200.00 },
      { id: 8, code: 'PROD-234', description: 'Valvola proporzionale 5/2', quantity: 42, value: 33600.00 },
      { id: 9, code: 'PROD-156', description: 'Servo motore brushless', quantity: 38, value: 45600.00 },
      { id: 10, code: 'PROD-201', description: 'PLC Siemens S7-1200', quantity: 35, value: 52500.00 },
    ],
    lastUpdate: new Date().toISOString(),
  };
};

/**
 * Genera mock data per Items Analytics
 */
const generateItemsAnalyticsMock = (): ItemsAnalyticsData => {
  const now = new Date();
  const weeklyTrend = [];
  const monthlyTrend = [];

  // Genera trend settimanale (ultimi 7 giorni)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    weeklyTrend.push({
      date: date.toISOString().split('T')[0],
      disponibili: 150 + Math.floor(Math.random() * 50),
      inTransito: 30 + Math.floor(Math.random() * 20),
      riservati: 40 + Math.floor(Math.random() * 15),
      bloccati: 5 + Math.floor(Math.random() * 5),
    });
  }

  // Genera trend mensile (ultimi 30 giorni)
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    monthlyTrend.push({
      date: date.toISOString().split('T')[0],
      disponibili: 140 + Math.floor(Math.random() * 60),
      inTransito: 25 + Math.floor(Math.random() * 25),
      riservati: 35 + Math.floor(Math.random() * 20),
      bloccati: 3 + Math.floor(Math.random() * 7),
    });
  }

  return {
    totalItems: 1847,
    averageStock: 156.4,
    byStatus: [
      { status: 'Disponibile' as any, count: 1245, percentage: 67.4, color: '#10B981' },
      { status: 'Riservato' as any, count: 342, percentage: 18.5, color: '#F59E0B' },
      { status: 'In Transito' as any, count: 215, percentage: 11.6, color: '#3B82F6' },
      { status: 'Bloccato' as any, count: 45, percentage: 2.5, color: '#EF4444' },
    ],
    weeklyTrend,
    monthlyTrend,
    lastUpdate: new Date().toISOString(),
  };
};

/**
 * Genera mock data per Movements Realtime
 */
const generateMovementsRealtimeMock = (): MovementsRealtimeData => {
  const now = new Date();
  const hourlyData = [];
  const dailyData = [];

  // Genera dati orari (ultime 24 ore)
  for (let i = 23; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(date.getHours() - i);
    const entrate = Math.floor(Math.random() * 15) + 5;
    const uscite = Math.floor(Math.random() * 12) + 3;
    const trasferimenti = Math.floor(Math.random() * 8) + 2;

    hourlyData.push({
      date: date.toISOString(),
      entrate,
      uscite,
      trasferimenti,
      total: entrate + uscite + trasferimenti,
    });
  }

  // Genera dati giornalieri (ultimi 30 giorni)
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const entrate = Math.floor(Math.random() * 120) + 50;
    const uscite = Math.floor(Math.random() * 100) + 40;
    const trasferimenti = Math.floor(Math.random() * 60) + 20;

    dailyData.push({
      date: date.toISOString().split('T')[0],
      entrate,
      uscite,
      trasferimenti,
      total: entrate + uscite + trasferimenti,
    });
  }

  return {
    totalToday: 342,
    hourlyData,
    dailyData,
    rotation: {
      hourly: 14.25,
      daily: 342,
      weekly: 2394,
      trend: 'up',
    },
    peaks: [
      { time: '09:00', count: 45, type: 'entrate' },
      { time: '14:30', count: 38, type: 'uscite' },
      { time: '16:00', count: 42, type: 'mixed' },
    ],
    lastUpdate: new Date().toISOString(),
  };
};

/**
 * Genera mock data per Locations Heatmap
 */
const generateLocationsHeatmapMock = (): LocationsHeatmapData => {
  const locations = [];
  const zones = [
    { zoneId: 1, zoneName: 'Zona A - Picking', totalLocations: 150, occupiedLocations: 127, averageOccupancy: 84.7, activityScore: 92 },
    { zoneId: 2, zoneName: 'Zona B - Stoccaggio', totalLocations: 200, occupiedLocations: 165, averageOccupancy: 82.5, activityScore: 68 },
    { zoneId: 3, zoneName: 'Zona C - Transit', totalLocations: 80, occupiedLocations: 58, averageOccupancy: 72.5, activityScore: 95 },
    { zoneId: 4, zoneName: 'Zona D - Quarantena', totalLocations: 50, occupiedLocations: 12, averageOccupancy: 24.0, activityScore: 15 },
  ];

  // Genera ubicazioni per ogni zona
  zones.forEach((zone) => {
    for (let i = 1; i <= zone.totalLocations; i++) {
      if (Math.random() < zone.occupiedLocations / zone.totalLocations) {
        const occupancyRate = Math.floor(Math.random() * 40) + 60;
        const activityLevel = occupancyRate > 85 ? 'high' : occupancyRate > 50 ? 'medium' : 'low';

        locations.push({
          locationId: zone.zoneId * 1000 + i,
          locationCode: `${zone.zoneName.charAt(5)}-${String(i).padStart(3, '0')}`,
          areaName: zone.zoneName,
          occupancyRate,
          itemCount: Math.floor(occupancyRate / 10),
          activityLevel: activityLevel as any,
          lastMovement: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }
  });

  const totalLocations = zones.reduce((sum, z) => sum + z.totalLocations, 0);
  const occupiedLocations = zones.reduce((sum, z) => sum + z.occupiedLocations, 0);

  return {
    totalLocations,
    occupiedLocations,
    averageOccupancy: (occupiedLocations / totalLocations) * 100,
    locations,
    zones,
    mostActiveZone: 'Zona C - Transit',
    leastActiveZone: 'Zona D - Quarantena',
    lastUpdate: new Date().toISOString(),
  };
};

/**
 * Genera mock data per KPI Cards
 */
const generateKPICardsMock = (): KPICardsData => {
  return {
    cards: [
      {
        id: 'total_products' as any,
        title: 'Totale Prodotti',
        value: 247,
        icon: 'package',
        color: 'blue',
        trend: {
          direction: 'up',
          percentage: 5.2,
          comparisonPeriod: 'vs mese scorso',
        },
        subtitle: '+12 questo mese',
      },
      {
        id: 'movements_today' as any,
        title: 'Movimenti Oggi',
        value: 342,
        icon: 'truck',
        color: 'green',
        trend: {
          direction: 'up',
          percentage: 12.5,
          comparisonPeriod: 'vs ieri',
        },
        subtitle: 'Media: 305/giorno',
      },
      {
        id: 'efficiency' as any,
        title: 'Efficienza Operativa',
        value: '94.5',
        unit: '%',
        icon: 'trending-up',
        color: 'purple',
        trend: {
          direction: 'stable',
          percentage: 0.8,
          comparisonPeriod: 'vs settimana scorsa',
        },
        subtitle: 'Obiettivo: 90%',
      },
      {
        id: 'alerts' as any,
        title: 'Alert Attivi',
        value: 7,
        icon: 'alert-triangle',
        color: 'yellow',
        trend: {
          direction: 'down',
          percentage: 22.2,
          comparisonPeriod: 'vs ieri',
        },
        subtitle: '2 critici',
      },
    ],
    lastUpdate: new Date().toISOString(),
  };
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/dashboard/products-overview
    getProductsOverview: builder.query<
      DashboardApiResponse<ProductsOverviewData>,
      DashboardFilters | void
    >({
      queryFn: async (filters) => {
        // Simula latenza di rete
        await new Promise((resolve) => setTimeout(resolve, 500));

        // TODO: Sostituire con chiamata reale
        // return { url: '/dashboard/products-overview', params: filters };

        return {
          data: {
            success: true,
            data: generateProductsOverviewMock(),
            timestamp: new Date().toISOString(),
          },
        };
      },
      providesTags: ['Dashboard'],
    }),

    // GET /api/dashboard/items-analytics
    getItemsAnalytics: builder.query<
      DashboardApiResponse<ItemsAnalyticsData>,
      DashboardFilters | void
    >({
      queryFn: async (filters) => {
        await new Promise((resolve) => setTimeout(resolve, 600));

        return {
          data: {
            success: true,
            data: generateItemsAnalyticsMock(),
            timestamp: new Date().toISOString(),
          },
        };
      },
      providesTags: ['Dashboard'],
    }),

    // GET /api/dashboard/movements-realtime
    getMovementsRealtime: builder.query<
      DashboardApiResponse<MovementsRealtimeData>,
      DashboardFilters | void
    >({
      queryFn: async (filters) => {
        await new Promise((resolve) => setTimeout(resolve, 400));

        return {
          data: {
            success: true,
            data: generateMovementsRealtimeMock(),
            timestamp: new Date().toISOString(),
          },
        };
      },
      providesTags: ['Dashboard'],
    }),

    // GET /api/dashboard/locations-heatmap
    getLocationsHeatmap: builder.query<
      DashboardApiResponse<LocationsHeatmapData>,
      DashboardFilters | void
    >({
      queryFn: async (filters) => {
        await new Promise((resolve) => setTimeout(resolve, 700));

        return {
          data: {
            success: true,
            data: generateLocationsHeatmapMock(),
            timestamp: new Date().toISOString(),
          },
        };
      },
      providesTags: ['Dashboard'],
    }),

    // GET /api/dashboard/kpis
    getKPIs: builder.query<
      DashboardApiResponse<KPICardsData>,
      DashboardFilters | void
    >({
      queryFn: async (filters) => {
        await new Promise((resolve) => setTimeout(resolve, 300));

        return {
          data: {
            success: true,
            data: generateKPICardsMock(),
            timestamp: new Date().toISOString(),
          },
        };
      },
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetProductsOverviewQuery,
  useGetItemsAnalyticsQuery,
  useGetMovementsRealtimeQuery,
  useGetLocationsHeatmapQuery,
  useGetKPIsQuery,
} = dashboardApi;

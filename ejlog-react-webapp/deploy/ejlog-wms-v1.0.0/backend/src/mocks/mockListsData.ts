// ============================================================================
// Mock Lists Data per Testing UI
// Dati fittizi per testare la pagina Gestione Liste senza backend
// ============================================================================

import type { List } from '../services/listsService';
import { ListType, ListStatus } from '../services/listsService';

export const MOCK_LISTS: List[] = [
  // Lista in esecuzione (Picking)
  {
    listHeader: {
      listNumber: 'LST-2024-001',
      listDescription: 'Picking Ordine Cliente Ferrari SRL',
      listType: ListType.PICKING,
      listStatus: ListStatus.IN_PROGRESS,
      priority: 90,
      orderNumber: 'ORD-2024-1234',
      createdDate: '2024-11-25T08:30:00',
      assignedUser: 'mario.rossi',
      warehouse: 'MAG-PRINCIPALE',
      area: 'ZONA-A',
    },
    listRows: [
      {
        rowNumber: 1,
        itemCode: 'ART-001',
        itemDescription: 'Articolo Test 1',
        quantity: 100,
        pickedQuantity: 75,
        location: 'A-01-01-A',
        status: 'IN_PROGRESS',
      },
      {
        rowNumber: 2,
        itemCode: 'ART-002',
        itemDescription: 'Articolo Test 2',
        quantity: 50,
        pickedQuantity: 50,
        location: 'A-01-02-B',
        status: 'COMPLETED',
      },
      {
        rowNumber: 3,
        itemCode: 'ART-003',
        itemDescription: 'Articolo Test 3',
        quantity: 200,
        pickedQuantity: 0,
        location: 'A-02-01-C',
        status: 'WAITING',
      },
    ],
  },

  // Lista in attesa (Picking)
  {
    listHeader: {
      listNumber: 'LST-2024-002',
      listDescription: 'Picking Ordine Rossi & Co.',
      listType: ListType.PICKING,
      listStatus: ListStatus.WAITING,
      priority: 70,
      orderNumber: 'ORD-2024-1235',
      createdDate: '2024-11-26T09:15:00',
      assignedUser: 'luigi.bianchi',
      warehouse: 'MAG-PRINCIPALE',
      area: 'ZONA-B',
    },
    listRows: [
      {
        rowNumber: 1,
        itemCode: 'ART-010',
        itemDescription: 'Prodotto Sample A',
        quantity: 80,
        pickedQuantity: 0,
        location: 'B-03-05-A',
        status: 'WAITING',
      },
      {
        rowNumber: 2,
        itemCode: 'ART-011',
        itemDescription: 'Prodotto Sample B',
        quantity: 120,
        pickedQuantity: 0,
        location: 'B-03-06-B',
        status: 'WAITING',
      },
    ],
  },

  // Lista completata (Picking)
  {
    listHeader: {
      listNumber: 'LST-2024-003',
      listDescription: 'Picking Urgente - Verdi SpA',
      listType: ListType.PICKING,
      listStatus: ListStatus.COMPLETED,
      priority: 100,
      orderNumber: 'ORD-2024-1220',
      createdDate: '2024-11-24T14:00:00',
      completedDate: '2024-11-24T16:30:00',
      assignedUser: 'giuseppe.verdi',
      warehouse: 'MAG-PRINCIPALE',
      area: 'ZONA-A',
    },
    listRows: [
      {
        rowNumber: 1,
        itemCode: 'ART-020',
        itemDescription: 'Componente X',
        quantity: 300,
        pickedQuantity: 300,
        location: 'A-05-01-A',
        status: 'COMPLETED',
      },
    ],
  },

  // Lista rifornimento in attesa
  {
    listHeader: {
      listNumber: 'LST-RIF-001',
      listDescription: 'Rifornimento Zone Picking da Riserva',
      listType: ListType.REFILLING,
      listStatus: ListStatus.WAITING,
      priority: 60,
      createdDate: '2024-11-26T10:00:00',
      assignedUser: 'carlo.neri',
      warehouse: 'MAG-PRINCIPALE',
    },
    listRows: [
      {
        rowNumber: 1,
        itemCode: 'ART-001',
        itemDescription: 'Articolo Test 1',
        quantity: 500,
        pickedQuantity: 0,
        location: 'RIS-01-01',
        destinationLocation: 'A-01-01-A',
        status: 'WAITING',
      },
      {
        rowNumber: 2,
        itemCode: 'ART-002',
        itemDescription: 'Articolo Test 2',
        quantity: 250,
        pickedQuantity: 0,
        location: 'RIS-01-02',
        destinationLocation: 'A-01-02-B',
        status: 'WAITING',
      },
    ],
  },

  // Lista rifornimento in esecuzione
  {
    listHeader: {
      listNumber: 'LST-RIF-002',
      listDescription: 'Rifornimento Urgente Zona A',
      listType: ListType.REFILLING,
      listStatus: ListStatus.IN_PROGRESS,
      priority: 85,
      createdDate: '2024-11-25T11:00:00',
      assignedUser: 'paolo.gialli',
      warehouse: 'MAG-PRINCIPALE',
    },
    listRows: [
      {
        rowNumber: 1,
        itemCode: 'ART-030',
        itemDescription: 'Pezzo Ricambio Y',
        quantity: 150,
        pickedQuantity: 100,
        location: 'RIS-02-03',
        destinationLocation: 'A-03-05-C',
        status: 'IN_PROGRESS',
      },
    ],
  },

  // Lista inventario programmato
  {
    listHeader: {
      listNumber: 'LST-INV-001',
      listDescription: 'Inventario Mensile Zona B',
      listType: ListType.INVENTORY,
      listStatus: ListStatus.WAITING,
      priority: 40,
      createdDate: '2024-11-26T06:00:00',
      assignedUser: 'anna.blu',
      warehouse: 'MAG-PRINCIPALE',
      area: 'ZONA-B',
    },
    listRows: [
      {
        rowNumber: 1,
        itemCode: 'ART-040',
        itemDescription: 'Materiale Consumo A',
        quantity: 0, // Inventario: quantità da contare
        pickedQuantity: 0,
        location: 'B-01-01-A',
        status: 'WAITING',
      },
      {
        rowNumber: 2,
        itemCode: 'ART-041',
        itemDescription: 'Materiale Consumo B',
        quantity: 0,
        pickedQuantity: 0,
        location: 'B-01-01-B',
        status: 'WAITING',
      },
      {
        rowNumber: 3,
        itemCode: 'ART-042',
        itemDescription: 'Materiale Consumo C',
        quantity: 0,
        pickedQuantity: 0,
        location: 'B-01-02-A',
        status: 'WAITING',
      },
    ],
  },

  // Lista inventario in corso
  {
    listHeader: {
      listNumber: 'LST-INV-002',
      listDescription: 'Inventario Spot Ubicazione Critica',
      listType: ListType.INVENTORY,
      listStatus: ListStatus.IN_PROGRESS,
      priority: 75,
      createdDate: '2024-11-26T08:00:00',
      assignedUser: 'maria.viola',
      warehouse: 'MAG-PRINCIPALE',
      area: 'ZONA-A',
    },
    listRows: [
      {
        rowNumber: 1,
        itemCode: 'ART-050',
        itemDescription: 'Componente Critico Z',
        quantity: 0,
        pickedQuantity: 47, // Quantità contata
        location: 'A-10-10-A',
        status: 'COMPLETED',
      },
    ],
  },

  // Lista inventario completato
  {
    listHeader: {
      listNumber: 'LST-INV-003',
      listDescription: 'Inventario Fine Anno - Zona C',
      listType: ListType.INVENTORY,
      listStatus: ListStatus.COMPLETED,
      priority: 50,
      createdDate: '2024-11-20T07:00:00',
      completedDate: '2024-11-20T18:00:00',
      assignedUser: 'francesco.arancio',
      warehouse: 'MAG-PRINCIPALE',
      area: 'ZONA-C',
    },
    listRows: [
      {
        rowNumber: 1,
        itemCode: 'ART-060',
        itemDescription: 'Scaffale C1 - Tutti gli articoli',
        quantity: 0,
        pickedQuantity: 1250,
        location: 'C-01-01-A',
        status: 'COMPLETED',
      },
    ],
  },

  // Altre liste per arrivare a un numero significativo
  {
    listHeader: {
      listNumber: 'LST-2024-004',
      listDescription: 'Picking Standard - Martini SRL',
      listType: ListType.PICKING,
      listStatus: ListStatus.WAITING,
      priority: 55,
      orderNumber: 'ORD-2024-1240',
      createdDate: '2024-11-26T11:00:00',
      warehouse: 'MAG-PRINCIPALE',
      area: 'ZONA-A',
    },
    listRows: [],
  },

  {
    listHeader: {
      listNumber: 'LST-2024-005',
      listDescription: 'Picking Express - Lamborghini & Figli',
      listType: ListType.PICKING,
      listStatus: ListStatus.WAITING,
      priority: 95,
      orderNumber: 'ORD-2024-1241',
      createdDate: '2024-11-26T12:30:00',
      warehouse: 'MAG-PRINCIPALE',
      area: 'ZONA-B',
    },
    listRows: [],
  },
];

/**
 * Stats calcolate dai dati mock
 */
export const MOCK_STATS = {
  total: MOCK_LISTS.length,
  picking: MOCK_LISTS.filter(l => l.listHeader.listType === ListType.PICKING).length,
  refilling: MOCK_LISTS.filter(l => l.listHeader.listType === ListType.REFILLING).length,
  inventory: MOCK_LISTS.filter(l => l.listHeader.listType === ListType.INVENTORY).length,
  waiting: MOCK_LISTS.filter(l => l.listHeader.listStatus === ListStatus.WAITING).length,
  inProgress: MOCK_LISTS.filter(l => l.listHeader.listStatus === ListStatus.IN_PROGRESS).length,
  completed: MOCK_LISTS.filter(l => l.listHeader.listStatus === ListStatus.COMPLETED).length,
};

/**
 * Log stats per debug
 */
console.log('📊 Mock Lists Stats:', MOCK_STATS);

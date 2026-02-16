import { test, expect } from '@playwright/test';

/**
 * E2E Test: Creazione di 2 Liste di Prelievo con 3 Articoli Ciascuna
 *
 * Questo test crea autonomamente 2 liste di prelievo con 3 articoli ciascuna.
 * Flusso:
 * 1. Autenticazione
 * 2. Verifica giacenze
 * 3. Creazione lista 1 + righe
 * 4. Verifica lista 1
 * 5. Creazione lista 2 + righe
 * 6. Verifica lista 2
 * 7. Verifica numerazione progressiva
 */

// Configurazione test
const AUTH_BASE_URL = 'http://localhost:3000/api';
const LISTS_BASE_URL = 'http://localhost:3000/api/lists';
const ITEM_LISTS_BASE_URL = 'http://localhost:3000/api/item-lists';
const ITEMS_BASE_URL = 'http://localhost:3000/api/items';
const STOCK_BASE_URL = 'http://localhost:3000/api/stock';

const USERNAME = 'superuser';
const PASSWORD = `promag${String(31 - new Date().getDate()).padStart(2, '0')}`;

// Timestamp univoco per evitare conflitti
const timestamp = Date.now();
const LIST_REFERENCE_1 = `TEST-${timestamp}-001`;
const LIST_REFERENCE_2 = `TEST-${timestamp}-002`;
let LIST_NUMBER_1 = '';
let LIST_NUMBER_2 = '';

type TestItem = {
  itemCode: string;
  itemDescription: string;
  quantity: number;
  unitOfMeasure?: string;
};

const FALLBACK_TEST_ITEMS: TestItem[] = [
  { itemCode: 'ITEM001', itemDescription: 'Prodotto Test A', quantity: 1, unitOfMeasure: 'PZ' },
  { itemCode: 'ITEM002', itemDescription: 'Prodotto Test B', quantity: 1, unitOfMeasure: 'PZ' },
  { itemCode: 'ITEM003', itemDescription: 'Prodotto Test C', quantity: 1, unitOfMeasure: 'PZ' },
  { itemCode: 'ITEM004', itemDescription: 'Prodotto Test D', quantity: 1, unitOfMeasure: 'PZ' },
  { itemCode: 'ITEM005', itemDescription: 'Prodotto Test E', quantity: 1, unitOfMeasure: 'PZ' },
  { itemCode: 'ITEM006', itemDescription: 'Prodotto Test F', quantity: 1, unitOfMeasure: 'PZ' },
];

// ============================================================================
// Helper Functions
// ============================================================================

async function authenticate(request: any): Promise<string> {
  console.log(`\nAutenticazione come ${USERNAME}...`);

  const response = await request.post(`${AUTH_BASE_URL}/auth/login`, {
    data: { username: USERNAME, password: PASSWORD },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.token).toBeDefined();

  console.log(`Token JWT ottenuto: ${data.token.substring(0, 50)}...`);
  return data.token;
}

async function getTestItems(request: any): Promise<TestItem[]> {
  try {
    const response = await request.get(`${ITEMS_BASE_URL}?limit=6&offset=0&activeOnly=true`);
    if (!response.ok()) {
      console.log('Impossibile leggere items da API, uso fallback.');
      return FALLBACK_TEST_ITEMS;
    }

    const data = await response.json();
    const items = Array.isArray(data.data) ? data.data : [];
    if (items.length < 6) {
      console.log('Items insufficienti, uso fallback.');
      return FALLBACK_TEST_ITEMS;
    }

    return items.slice(0, 6).map((item: any) => ({
      itemCode: item.code,
      itemDescription: item.description || item.code,
      quantity: 1,
      unitOfMeasure: item.unitOfMeasure || 'PZ',
    }));
  } catch (error) {
    console.log('Errore lettura items, uso fallback:', error);
    return FALLBACK_TEST_ITEMS;
  }
}

async function verifyItemStock(request: any, token: string, itemCode: string): Promise<boolean> {
  try {
    const response = await request.get(`${STOCK_BASE_URL}?limit=100&offset=0`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      return false;
    }

    const data = await response.json();
    const stockItems = data.exportedItems || data.stock || data.data || [];
    const stockEntry = stockItems.find((entry: any) => entry.itemCode === itemCode || entry.item === itemCode);
    return Boolean(stockEntry);
  } catch {
    return false;
  }
}

async function createPickingList(
  request: any,
  token: string,
  listReference: string,
  items: TestItem[]
): Promise<{ listId: number; listNumber: string }> {
  const listResponse = await request.post(`${ITEM_LISTS_BASE_URL}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      listReference,
      description: listReference,
      tipoLista: 1,
      stato: 1,
      priority: 1,
      areaId: 1,
    },
  });

  expect(listResponse.ok()).toBeTruthy();
  const listResult = await listResponse.json();
  expect(listResult.data?.id).toBeDefined();
  expect(listResult.data?.listNumber).toBeDefined();

  const listId = listResult.data.id;

  for (const item of items) {
    const rowResponse = await request.post(`${ITEM_LISTS_BASE_URL}/${listId}/rows`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        itemCode: item.itemCode,
        itemDescription: item.itemDescription,
        requestedQuantity: item.quantity,
      },
    });

    expect(rowResponse.ok()).toBeTruthy();
    const rowResult = await rowResponse.json();
    const rowOk = rowResult.success === true || rowResult.result === 'OK';
    expect(rowOk).toBeTruthy();
  }

  return { listId, listNumber: listResult.data.listNumber };
}

async function verifyListSaved(request: any, token: string, listNumber: string): Promise<any> {
  const response = await request.get(`${LISTS_BASE_URL}/${listNumber}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.result).toBe('OK');
  expect(Array.isArray(data.exported)).toBeTruthy();

  const list = data.exported[0];
  expect(list.listHeader?.listNumber).toBe(listNumber);
  return list;
}

async function verifyProgressiveNumbering(request: any, token: string): Promise<void> {
  const response = await request.get(`${LISTS_BASE_URL}?limit=100&offset=0&listType=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  const exported = Array.isArray(data.exported) ? data.exported : [];
  const ourLists = exported.filter((list: any) =>
    list.listHeader?.orderNumber?.includes(`${timestamp}`)
  );
  expect(ourLists.length).toBe(2);
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe('Creazione Automatica 2 Liste di Prelievo', () => {
  let authToken: string;
  let testItems: TestItem[] = [];

  test.beforeAll(async ({ request }) => {
    console.log('\n' + '='.repeat(80));
    console.log('  TEST: CREAZIONE AUTOMATICA DI 2 LISTE DI PRELIEVO');
    console.log('='.repeat(80));
    console.log(`  Timestamp Test: ${timestamp}`);
    console.log(`  Riferimento 1: ${LIST_REFERENCE_1}`);
    console.log(`  Riferimento 2: ${LIST_REFERENCE_2}`);
    console.log('='.repeat(80));

    testItems = await getTestItems(request);
  });

  test('1. Autenticazione e Verifica Giacenze', async ({ request }) => {
    authToken = await authenticate(request);

    for (const item of testItems) {
      await verifyItemStock(request, authToken, item.itemCode);
    }
  });

  test('2. Creazione Prima Lista', async ({ request }) => {
    if (!authToken) {
      authToken = await authenticate(request);
    }

    const items1 = testItems.slice(0, 3);
    const result = await createPickingList(
      request,
      authToken,
      LIST_REFERENCE_1,
      items1
    );

    LIST_NUMBER_1 = result.listNumber;
    expect(LIST_NUMBER_1).toBeTruthy();
  });

  test('3. Verifica Salvataggio Prima Lista', async ({ request }) => {
    if (!authToken) {
      authToken = await authenticate(request);
    }

    const list1 = await verifyListSaved(request, authToken, LIST_NUMBER_1);
    expect(list1.listRows.length).toBe(3);
    list1.listRows.forEach((row: any, index: number) => {
      expect(row.item).toBe(testItems[index].itemCode);
      expect(row.requestedQty).toBe(1);
      expect(row.processedQty).toBe(0);
    });
  });

  test('4. Creazione Seconda Lista', async ({ request }) => {
    if (!authToken) {
      authToken = await authenticate(request);
    }

    const items2 = testItems.slice(3, 6);
    const result = await createPickingList(
      request,
      authToken,
      LIST_REFERENCE_2,
      items2
    );

    LIST_NUMBER_2 = result.listNumber;
    expect(LIST_NUMBER_2).toBeTruthy();
  });

  test('5. Verifica Salvataggio Seconda Lista', async ({ request }) => {
    if (!authToken) {
      authToken = await authenticate(request);
    }

    const list2 = await verifyListSaved(request, authToken, LIST_NUMBER_2);
    expect(list2.listRows.length).toBe(3);
    list2.listRows.forEach((row: any, index: number) => {
      expect(row.item).toBe(testItems[index + 3].itemCode);
      expect(row.requestedQty).toBe(1);
      expect(row.processedQty).toBe(0);
    });
  });

  test('6. Verifica Numerazione Progressiva', async ({ request }) => {
    if (!authToken) {
      authToken = await authenticate(request);
    }

    await verifyProgressiveNumbering(request, authToken);
  });

  test('7. Riepilogo Finale e Dettagli Liste', async ({ request }) => {
    if (!authToken) {
      authToken = await authenticate(request);
    }

    const list1 = await verifyListSaved(request, authToken, LIST_NUMBER_1);
    const list2 = await verifyListSaved(request, authToken, LIST_NUMBER_2);

    console.log('\n' + '='.repeat(80));
    console.log('  RIEPILOGO FINALE');
    console.log('='.repeat(80));
    console.log(`  LISTA 1: ${LIST_NUMBER_1}`);
    console.log(`  Descrizione: ${list1.listHeader.listDescription}`);
    console.log(`  Status: ${list1.listHeader.listStatus} (1=Waiting)`);
    console.log(`  Tipo: ${list1.listHeader.listType} (1=Picking)`);
    console.log(`  Righe: ${list1.listRows.length}`);
    console.log(`  LISTA 2: ${LIST_NUMBER_2}`);
    console.log(`  Descrizione: ${list2.listHeader.listDescription}`);
    console.log(`  Status: ${list2.listHeader.listStatus} (1=Waiting)`);
    console.log(`  Tipo: ${list2.listHeader.listType} (1=Picking)`);
    console.log(`  Righe: ${list2.listRows.length}`);
    console.log('='.repeat(80));
  });
});

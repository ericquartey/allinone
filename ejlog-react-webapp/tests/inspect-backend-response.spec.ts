// ============================================================================
// Script Playwright per ispezionare la risposta reale del backend EjLog
// Endpoint: GET /EjLogHostVertimag/Stock
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('Backend API Response Inspector', () => {

  test('should inspect /EjLogHostVertimag/Stock response structure', async ({ request }) => {
    console.log('\n========================================');
    console.log('ISPEZIONANDO RISPOSTA BACKEND EJLOG');
    console.log('========================================\n');

    // Chiama l'API del backend (porta 3077)
    const response = await request.get('http://localhost:3077/EjLogHostVertimag/Stock', {
      params: {
        limit: 5,  // Solo 5 prodotti per semplicità
        skip: 0,
      },
    });

    console.log('Status:', response.status());
    expect(response.ok()).toBeTruthy();

    // Parse response
    const data = await response.json();

    console.log('\n--- STRUTTURA COMPLETA RISPOSTA ---');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n--- CHIAVI PRINCIPALI RISPOSTA ---');
    console.log('Keys:', Object.keys(data));

    // Verifica che ci siano prodotti
    if (data.exported && Array.isArray(data.exported) && data.exported.length > 0) {
      const firstProduct = data.exported[0];

      console.log('\n========================================');
      console.log('STRUTTURA PRIMO PRODOTTO');
      console.log('========================================\n');
      console.log(JSON.stringify(firstProduct, null, 2));

      console.log('\n--- CHIAVI LIVELLO ROOT DEL PRODOTTO ---');
      console.log('Keys:', Object.keys(firstProduct));

      // Verifica struttura 'item'
      if (firstProduct.item) {
        console.log('\n--- OGGETTO item (articolo) ---');
        console.log('item keys:', Object.keys(firstProduct.item));
        console.log('item.code:', firstProduct.item.code);
        console.log('item.description:', firstProduct.item.description);
        console.log('item.itemCategoryDescription:', firstProduct.item.itemCategoryDescription);
        console.log('item.measureUnitDescription:', firstProduct.item.measureUnitDescription);
        console.log('item.managementType:', firstProduct.item.managementType);
        console.log('item.quantitySignificantFigures:', firstProduct.item.quantitySignificantFigures);
      } else {
        console.log('\n⚠️  ATTENZIONE: item è NULL o undefined!');
      }

      // Verifica campi prodotto (giacenza)
      console.log('\n--- CAMPI PRODOTTO (GIACENZA) ---');
      console.log('stockedQuantity:', firstProduct.stockedQuantity);
      console.log('inventoryThreshold:', firstProduct.inventoryThreshold);
      console.log('lot:', firstProduct.lot);
      console.log('serialNumber:', firstProduct.serialNumber);
      console.log('expirationDate:', firstProduct.expirationDate);
      console.log('isBlocked:', firstProduct.isBlocked);

      // Verifica campi che potrebbero essere null/undefined
      console.log('\n--- ANALISI CAMPI NULL/UNDEFINED ---');
      const fieldsToCheck = [
        'item.code',
        'item.description',
        'item.itemCategoryDescription',
        'item.measureUnitDescription',
        'stockedQuantity',
        'lot',
        'serialNumber',
        'expirationDate',
      ];

      fieldsToCheck.forEach(field => {
        const value = field.includes('.')
          ? field.split('.').reduce((obj, key) => obj?.[key], firstProduct)
          : firstProduct[field];
        console.log(`${field}: ${value === null ? 'NULL' : value === undefined ? 'UNDEFINED' : 'PRESENTE'} (value: ${value})`);
      });

      console.log('\n========================================');
      console.log('ACCESSORKEY ATTUALI vs STRUTTURA REALE');
      console.log('========================================\n');

      const columnMappings = [
        { accessorKey: 'item.code', actualPath: 'item.code' },
        { accessorKey: 'item.description', actualPath: 'item.description' },
        { accessorKey: 'item.itemCategoryDescription', actualPath: 'item.itemCategoryDescription' },
        { accessorKey: 'item.measureUnitDescription', actualPath: 'item.measureUnitDescription' },
        { accessorKey: 'stockedQuantity', actualPath: 'stockedQuantity' },
        { accessorKey: 'lot', actualPath: 'lot' },
        { accessorKey: 'serialNumber', actualPath: 'serialNumber' },
        { accessorKey: 'expirationDate', actualPath: 'expirationDate' },
        { accessorKey: 'item.managementType', actualPath: 'item.managementType' },
        { accessorKey: 'isBlocked', actualPath: 'isBlocked' },
      ];

      columnMappings.forEach(({ accessorKey, actualPath }) => {
        const value = actualPath.includes('.')
          ? actualPath.split('.').reduce((obj, key) => obj?.[key], firstProduct)
          : firstProduct[actualPath];

        const status = value !== null && value !== undefined ? '✅ OK' : '❌ NULL/UNDEFINED';
        console.log(`${accessorKey.padEnd(35)} → ${status} (${value})`);
      });

    } else {
      console.log('\n⚠️  NESSUN PRODOTTO RESTITUITO DAL BACKEND!');
      console.log('data.exported:', data.exported);
    }

    console.log('\n========================================\n');
  });

  test('should check if transformResponse is working correctly', async ({ request }) => {
    const response = await request.get('http://localhost:3077/EjLogHostVertimag/Stock', {
      params: {
        limit: 1,
        skip: 0,
      },
    });

    const rawData = await response.json();

    console.log('\n========================================');
    console.log('VERIFICA transformResponse');
    console.log('========================================\n');

    console.log('Raw backend response keys:', Object.keys(rawData));
    console.log('exported array length:', rawData.exported?.length);
    console.log('recordNumber:', rawData.recordNumber);

    // Simula il transformResponse attuale
    const transformed = {
      data: rawData.exported || [],
      total: rawData.recordNumber || 0,
      page: 0,
      limit: rawData.recordNumber || 0,
    };

    console.log('\nTransformed response keys:', Object.keys(transformed));
    console.log('transformed.data length:', transformed.data.length);
    console.log('transformed.total:', transformed.total);

    if (transformed.data.length > 0) {
      console.log('\n✅ transformResponse sembra corretto');
      console.log('Primo elemento transformed.data[0]:');
      console.log(JSON.stringify(transformed.data[0], null, 2));
    } else {
      console.log('\n❌ transformResponse NON sta restituendo dati!');
    }

    console.log('\n========================================\n');
  });

});


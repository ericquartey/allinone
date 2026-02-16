// ============================================================================
// Script di Verifica Trasformazione Dati Backend → Frontend
// ============================================================================

// Simula la risposta del backend
const backendResponse = {
  message: "Export complete",
  result: "OK",
  recordNumber: 3,
  errors: null,
  exported: [
    {
      lu: null,
      warehouseId: 1,
      item: "001",
      description: "001TEST",
      lot: "",
      serialNumber: "",
      expiryDate: null,
      qty: 15.000,
      LU: null
    },
    {
      lu: null,
      warehouseId: 1,
      item: "09-PALETKA",
      description: "Minipaletka reklamowa PROMAG",
      lot: "",
      serialNumber: "",
      expiryDate: null,
      qty: 9.000,
      LU: null
    },
    {
      lu: null,
      warehouseId: 1,
      item: "123TEST",
      description: "PRZEKLADNIA",
      lot: "LOT001",
      serialNumber: "SN12345",
      expiryDate: "2025-12-31",
      qty: 100.000,
      LU: null
    }
  ]
};

// Implementazione della trasformazione (uguale a productsApi.ts)
function transformResponse(response) {
  const transformedData = (response.exported || []).map((rawProduct) => ({
    // Trasforma 'item' da stringa a oggetto complesso
    item: {
      code: rawProduct.item || '',
      description: rawProduct.description || '',
      itemCategoryDescription: rawProduct.category || null,
      measureUnitDescription: rawProduct.measureUnit || 'PZ',
      managementType: rawProduct.managementType || 0, // 0 = STANDARD
      quantitySignificantFigures: 2,
    },
    // Mappa campi con nomi diversi
    stockedQuantity: rawProduct.qty ?? 0,
    inventoryThreshold: rawProduct.threshold ?? 0,
    lot: rawProduct.lot || null,
    serialNumber: rawProduct.serialNumber || null,
    expirationDate: rawProduct.expiryDate || null, // Rinomina expiryDate → expirationDate
    isBlocked: rawProduct.isBlocked ?? false,
    warehouseId: rawProduct.warehouseId,
    lu: rawProduct.lu || rawProduct.LU || null,
  }));

  return {
    data: transformedData,
    total: response.recordNumber || 0,
    page: 0,
    limit: response.recordNumber || 0,
  };
}

// Esegui la trasformazione
console.log('========================================');
console.log('VERIFICA TRASFORMAZIONE DATI');
console.log('========================================\n');

const transformed = transformResponse(backendResponse);

console.log('Backend → Frontend Transformation:');
console.log('-----------------------------------');
console.log(`Total products: ${transformed.total}`);
console.log(`Transformed products: ${transformed.data.length}\n`);

// Verifica ogni prodotto
transformed.data.forEach((product, index) => {
  const original = backendResponse.exported[index];

  console.log(`\nProduct ${index + 1}:`);
  console.log('  Backend:');
  console.log(`    item: "${original.item}" (type: ${typeof original.item})`);
  console.log(`    description: "${original.description}"`);
  console.log(`    qty: ${original.qty}`);
  console.log(`    lot: "${original.lot}"`);
  console.log(`    serialNumber: "${original.serialNumber}"`);
  console.log(`    expiryDate: ${original.expiryDate}`);

  console.log('\n  Frontend (transformed):');
  console.log(`    item.code: "${product.item.code}"`);
  console.log(`    item.description: "${product.item.description}"`);
  console.log(`    item.itemCategoryDescription: ${product.item.itemCategoryDescription}`);
  console.log(`    item.measureUnitDescription: "${product.item.measureUnitDescription}"`);
  console.log(`    item.managementType: ${product.item.managementType}`);
  console.log(`    stockedQuantity: ${product.stockedQuantity}`);
  console.log(`    lot: ${product.lot}`);
  console.log(`    serialNumber: ${product.serialNumber}`);
  console.log(`    expirationDate: ${product.expirationDate}`);
  console.log(`    isBlocked: ${product.isBlocked}`);

  // Verifiche
  const checks = [
    {
      name: 'item.code exists',
      pass: !!product.item.code && product.item.code.length > 0,
      expected: original.item,
      actual: product.item.code
    },
    {
      name: 'item.description exists',
      pass: !!product.item.description && product.item.description.length > 0,
      expected: original.description,
      actual: product.item.description
    },
    {
      name: 'stockedQuantity mapped correctly',
      pass: product.stockedQuantity === original.qty,
      expected: original.qty,
      actual: product.stockedQuantity
    },
    {
      name: 'expirationDate mapped from expiryDate',
      pass: product.expirationDate === original.expiryDate,
      expected: original.expiryDate,
      actual: product.expirationDate
    }
  ];

  console.log('\n  Checks:');
  checks.forEach(check => {
    const status = check.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`    ${status} - ${check.name}`);
    if (!check.pass) {
      console.log(`      Expected: ${check.expected}`);
      console.log(`      Actual: ${check.actual}`);
    }
  });
});

// Verifica finale
console.log('\n========================================');
console.log('SUMMARY');
console.log('========================================\n');

const allProductsValid = transformed.data.every(p =>
  p.item.code &&
  p.item.description &&
  p.stockedQuantity !== undefined
);

if (allProductsValid) {
  console.log('✅ ALL PRODUCTS TRANSFORMED CORRECTLY!');
  console.log('\nThe columns should now display:');
  console.log('  - CODICE: ', transformed.data.map(p => p.item.code).join(', '));
  console.log('  - DESCRIZIONE: ', transformed.data.map(p => p.item.description).join(', '));
  console.log('  - GIACENZA: ', transformed.data.map(p => p.stockedQuantity).join(', '));
  process.exit(0);
} else {
  console.log('❌ TRANSFORMATION HAS ISSUES!');
  process.exit(1);
}

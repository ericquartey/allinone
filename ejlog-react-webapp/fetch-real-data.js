const http = require('http');

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    const items = await fetchJson('http://localhost:3077/EjLogHostVertimag/Items?skip=0&limit=200');
    const stock = await fetchJson('http://localhost:3077/EjLogHostVertimag/Stock?skip=0&limit=200');

    console.log('=== ITEMS ===');
    console.log('Record Number:', items.recordNumber);
    console.log('Exported count:', items.exported ? items.exported.length : 0);

    console.log('\n=== STOCK ===');
    console.log('Record Number:', stock.recordNumber);
    console.log('Exported count:', stock.exported ? stock.exported.length : 0);

    if (stock.exported && stock.exported.length > 0) {
      const totalQty = stock.exported.reduce((sum, item) => sum + (item.stockedQuantity || 0), 0);
      console.log('Total Quantity:', totalQty);

      const warehouses = {};
      stock.exported.forEach(item => {
        const wh = item.warehouse?.code || 'Unknown';
        if (!warehouses[wh]) warehouses[wh] = { count: 0, qty: 0 };
        warehouses[wh].count++;
        warehouses[wh].qty += (item.stockedQuantity || 0);
      });

      console.log('\n=== WAREHOUSES ===');
      Object.entries(warehouses).forEach(([code, data]) => {
        console.log(`${code}: ${data.count} items, ${data.qty} qty`);
      });
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
})();


const fs = require('fs');
const path = require('path');

const remaining = [
  'src/components/feedback/ToastContainer.test.jsx',
  'src/pages/Login.jsx',
  'src/pages/master-data/CustomersPage.jsx',
  'src/pages/master-data/ProductsPage.jsx',
  'src/pages/master-data/SuppliersPage.jsx',
  'src/pages/master-data/UDCPage.jsx',
  'src/pages/master-data/UsersPage.jsx',
  'src/pages/master-data/WorkstationsPage.jsx',
  'src/pages/MovementsPage.jsx',
  'src/pages/OperationalNotes.jsx',
  'src/pages/reservations/ReservationsPage.jsx',
  'src/pages/rf/RFOperationsPage.jsx',
  'src/pages/StockPage.jsx'
];

remaining.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const newPath = fullPath.replace('.jsx', '.tsx');
    fs.writeFileSync(newPath, content, 'utf8');
    fs.unlinkSync(fullPath);
    const shortName = file.replace('.jsx', '.tsx');
    console.log('Migrated: ' + shortName);
  }
});
console.log('\nAll remaining files migrated!');

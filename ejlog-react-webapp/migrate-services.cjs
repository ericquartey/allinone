const fs = require('fs');
const path = require('path');

const legacyServices = [
  'src/services/authService.js',
  'src/services/barcodeService.js',
  'src/services/itemService.js',
  'src/services/listService.js',
  'src/services/movementService.js',
  'src/services/orderService.js',
  'src/services/stockService.js'
];

console.log('Migrating legacy service files...\n');

let count = 0;
legacyServices.forEach(file => {
  const fullPath = path.join(__dirname, file);
  
  if (!fs.existsSync(fullPath)) {
    console.log('Not found: ' + file);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const newPath = fullPath.replace('.js', '.ts');
  
  fs.writeFileSync(newPath, content, 'utf8');
  fs.unlinkSync(fullPath);
  
  console.log('Migrated: ' + file.replace('.js', '.ts'));
  count++;
});

console.log('\nMigrated ' + count + ' files successfully!');

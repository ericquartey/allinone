const fs = require('fs');
const path = require('path');

const utilsFiles = [
  'src/utils/cn.js',
  'src/utils/errorHandler.js',
  'src/utils/errorHandler.test.js'
];

console.log('Migrating utils files to TypeScript...\n');

let count = 0;
utilsFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  
  if (!fs.existsSync(fullPath)) {
    console.log('Not found: ' + file);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const ext = file.endsWith('.test.js') ? '.test.ts' : '.ts';
  const newPath = fullPath.replace(/\.test\.js$/, '.test.ts').replace(/\.js$/, '.ts');
  
  fs.writeFileSync(newPath, content, 'utf8');
  fs.unlinkSync(fullPath);
  
  console.log('Migrated: ' + file + ' -> ' + file.replace('.js', ext));
  count++;
});

console.log('\nMigrated ' + count + ' utils files successfully!');

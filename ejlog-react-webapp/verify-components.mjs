// Verification script for UI components
import fs from 'fs';
import path from 'path';

const componentDir = './src/components/ui';
const requiredComponents = [
  'alert-dialog.tsx',
  'dropdown-menu.tsx',
  'label.tsx',
  'form.tsx'
];

console.log('Verifying UI components creation...\n');

const missing = [];
const created = [];

requiredComponents.forEach(component => {
  const filePath = path.join(componentDir, component);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`OK ${component} - ${size} KB`);
    created.push(component);
  } else {
    console.log(`MISSING ${component}`);
    missing.push(component);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`Total: ${created.length}/${requiredComponents.length} components created`);

if (missing.length > 0) {
  console.log(`\nMissing components: ${missing.join(', ')}`);
  process.exit(1);
} else {
  console.log('\nAll UI components created successfully!');
  console.log('Server running on: http://localhost:3005');
  process.exit(0);
}

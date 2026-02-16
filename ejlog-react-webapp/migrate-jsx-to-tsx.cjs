#!/usr/bin/env node

/**
 * EJLOG WMS - JSX to TSX Migration Script
 * Automatically converts .jsx files to .tsx with basic TypeScript typing
 */

const fs = require('fs');
const path = require('path');

// Files to migrate (remaining .jsx files)
const filesToMigrate = [
  'src/components/drawers/CompartmentEditor.jsx',
  'src/components/drawers/CompartmentView2D.jsx',
  'src/components/drawers/CompartmentView3D.jsx',
  'src/components/drawers/EditLoadingUnitModal.jsx',
  'src/components/feedback/ToastContainer.jsx',
  'src/components/lists/CreateListWizard.jsx',
  'src/components/lists/EditListModal.jsx',
  'src/components/lists/EditListRowsModal.jsx',
  'src/components/lists/ListDetailPanel.jsx',
  'src/components/lists/ListsTable.jsx',
  'src/components/notes/NoteCard.jsx',
  'src/components/notes/NoteModal.jsx',
  'src/components/reservations/ReservationDetailModal.jsx',
  'src/pages/ComponentTestPage.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/DrawerManagement.jsx',
  'src/pages/DrawerManagementPublic.jsx',
  'src/pages/ItemsPage.jsx',
  'src/pages/ListsManagement.jsx',
  'src/pages/ListsPage.jsx',
  'src/pages/hubs/AnalyticsHub.jsx',
  'src/pages/hubs/InventoryHub.jsx',
  'src/pages/hubs/OperationsHub.jsx',
  'src/pages/hubs/PlanningHub.jsx',
  'src/pages/items/ItemDetailPage.jsx',
  'src/pages/lists/management/ListDetailPage.jsx',
];

function applyBasicTypeScriptTransforms(content, filename) {
  let transformed = content;

  // Add React.FC type for functional components if they use arrow functions
  // Match: const ComponentName = () => {
  transformed = transformed.replace(
    /^(const|export const)\s+([A-Z][a-zA-Z0-9]*)\s*=\s*\(\s*\)\s*=>\s*\{/gm,
    '$1 $2: React.FC = () => {'
  );

  // Match: const ComponentName = (props) => {
  transformed = transformed.replace(
    /^(const|export const)\s+([A-Z][a-zA-Z0-9]*)\s*=\s*\(\s*\{([^}]+)\}\s*\)\s*=>\s*\{/gm,
    '$1 $2: React.FC<{ $3 }> = ({ $3 }) => {'
  );

  // Match: function ComponentName() {
  transformed = transformed.replace(
    /^(export\s+)?function\s+([A-Z][a-zA-Z0-9]*)\s*\(\s*\)\s*\{/gm,
    '$1function $2(): JSX.Element {'
  );

  // Match: function ComponentName(props) {
  transformed = transformed.replace(
    /^(export\s+)?function\s+([A-Z][a-zA-Z0-9]*)\s*\(\s*\{([^}]+)\}\s*\)\s*\{/gm,
    '$1function $2({ $3 }: any): JSX.Element {'
  );

  return transformed;
}

function migrateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const newPath = fullPath.replace(/\.jsx$/, '.tsx');

  // Apply basic TypeScript transforms
  const transformedContent = applyBasicTypeScriptTransforms(content, filePath);

  // Write .tsx file
  fs.writeFileSync(newPath, transformedContent, 'utf8');

  // Remove .jsx file
  fs.unlinkSync(fullPath);

  console.log(`✅ Migrated: ${filePath} -> ${filePath.replace('.jsx', '.tsx')}`);
  return true;
}

// Main execution
console.log('🚀 Starting JSX to TSX migration...\n');

let successCount = 0;
let failCount = 0;

filesToMigrate.forEach(file => {
  if (migrateFile(file)) {
    successCount++;
  } else {
    failCount++;
  }
});

console.log(`\n✨ Migration complete!`);
console.log(`   ✅ Success: ${successCount} files`);
console.log(`   ❌ Failed: ${failCount} files`);
console.log(`\n⚠️  Note: You may need to manually fix some TypeScript errors after migration.`);

const fs = require('fs');
const path = require('path');

// Fix ListsTable.tsx
const listsTablePath = path.join(__dirname, 'src/components/lists/ListsTable.tsx');
let content = fs.readFileSync(listsTablePath, 'utf8');

// Replace the problematic type definition
content = content.replace(
  /export const ListsTable: React\.FC<\{\s+lists = \[\],\s+selectedList,\s+onSelectList,\s+onDoubleClickList,\s+onSetWaiting,\s+onTerminate,\s+operationLoading = false\s+\}>/,
  `interface ListsTableProps {
  lists?: any[];
  selectedList?: any;
  onSelectList?: (list: any) => void;
  onDoubleClickList?: (list: any) => void;
  onSetWaiting?: (list: any) => void;
  onTerminate?: (list: any) => void;
  operationLoading?: boolean;
}

export const ListsTable: React.FC<ListsTableProps>`
);

fs.writeFileSync(listsTablePath, content, 'utf8');
console.log('✅ Fixed ListsTable.tsx');

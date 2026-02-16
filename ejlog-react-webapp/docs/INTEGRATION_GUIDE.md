# Guida Rapida all'Integrazione

## Quick Start

### 1. Attivare Menu Dinamico

**File da modificare**: `src/components/shared/AppLayout.tsx`

```typescript
// Prima
import Sidebar from './Sidebar';

// Dopo
import DynamicSidebar from './DynamicSidebar';

// Nel JSX, sostituire:
<Sidebar isOpen={sidebarOpen} />
// con:
<DynamicSidebar isOpen={sidebarOpen} />
```

### 2. Attivare Pagina Items Migliorata

**File da modificare**: `src/App.tsx`

```typescript
// Aggiungere import
import ItemsPageEnhanced from './pages/items/ItemsPageEnhanced';

// Sostituire nel routing
<Route path="items" element={<ItemsPageEnhanced />} />
```

### 3. Configurare Permessi Utente

Assicurarsi che il backend restituisca:

```json
{
  "user": {
    "id": 1,
    "userName": "admin",
    "displayName": "Admin User",
    "accessLevel": 3,
    "permissions": [
      "items.view",
      "items.create",
      "items.update",
      "items.delete",
      "lists.view",
      "lists.manage",
      "config.manage",
      "users.manage"
    ]
  },
  "token": "..."
}
```

---

## Usare DataTable in Nuove Pagine

### Esempio: Pagina Liste

```typescript
import React, { useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import { type ColumnDef } from '@tanstack/react-table';
import { useGetListsQuery } from '../../services/api/listsApi';
import type { ItemList } from '../../types/models';

const ListsPage: React.FC = () => {
  const [filters, setFilters] = useState({
    page: 0,
    pageSize: 25,
  });

  const { data, isLoading } = useGetListsQuery(filters);

  const columns: ColumnDef<ItemList>[] = [
    {
      accessorKey: 'code',
      header: 'Codice',
      enableSorting: true,
    },
    {
      accessorKey: 'description',
      header: 'Descrizione',
    },
    {
      accessorKey: 'status',
      header: 'Stato',
      cell: ({ row }) => {
        const statusLabels = {
          0: 'Da Evadere',
          1: 'In Esecuzione',
          2: 'Sospesa',
          3: 'Completata',
        };
        return <Badge>{statusLabels[row.original.status]}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestione Liste</h1>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        searchable
        exportable
        pagination={{
          pageIndex: filters.page,
          pageSize: filters.pageSize,
          totalPages: data?.totalPages || 1,
          totalItems: data?.total || 0,
          onPageChange: (page) => setFilters(prev => ({ ...prev, page })),
          onPageSizeChange: (pageSize) => setFilters(prev => ({ ...prev, pageSize })),
        }}
      />
    </div>
  );
};

export default ListsPage;
```

---

## Usare usePermissions Hook

### Esempio: Nascondere Button se no Permission

```typescript
import { usePermissions } from '../../hooks/usePermissions';

const ItemsToolbar = () => {
  const { hasPermission } = usePermissions();

  return (
    <div>
      {hasPermission('items.create') && (
        <Button onClick={handleCreate}>Nuovo Articolo</Button>
      )}

      {hasPermission('items.export') && (
        <Button onClick={handleExport}>Esporta</Button>
      )}
    </div>
  );
};
```

### Esempio: PermissionGuard Component

```typescript
import { PermissionGuard } from '../../hooks/usePermissions';

const AdminPanel = () => {
  return (
    <PermissionGuard
      requiredAccessLevel={UserAccessLevel.AMMINISTRATORE}
      fallback={<div>Accesso negato</div>}
    >
      <ConfigurationPanel />
    </PermissionGuard>
  );
};
```

---

## Aggiungere Nuova Voce di Menu

**File**: `src/config/menuConfig.ts`

```typescript
// Aggiungere nel menuConfig array:
{
  id: 'my-custom-module',
  icon: Boxes, // Importare da lucide-react
  label: 'Modulo Custom',
  path: '/custom',
  requiredAccessLevel: UserAccessLevel.SUPERVISORE,
  requiredPermissions: ['custom.view'],
},

// Con sottomenu:
{
  id: 'reports',
  icon: FileText,
  label: 'Report',
  requiredAccessLevel: UserAccessLevel.SUPERVISORE,
  children: [
    {
      id: 'reports-stock',
      icon: Database,
      label: 'Report Giacenze',
      path: '/reports/stock',
      requiredPermissions: ['reports.stock.view'],
    },
    {
      id: 'reports-movements',
      icon: BarChart3,
      label: 'Report Movimenti',
      path: '/reports/movements',
      requiredPermissions: ['reports.movements.view'],
    },
  ],
},
```

---

## Personalizzare Colori e Stili

### TailwindCSS Custom Colors

**File**: `tailwind.config.js`

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'ferretto-red': '#E31937',
        'ferretto-dark': '#1a1a1a',
        // Aggiungere custom colors
        'primary': '#0066CC',
        'secondary': '#6C757D',
      },
    },
  },
};
```

### Applicare ai Componenti

```typescript
// Badge personalizzato
<Badge className="bg-primary text-white">Custom</Badge>

// Button personalizzato
<Button className="bg-secondary hover:bg-secondary/90">
  Custom Button
</Button>
```

---

## Troubleshooting

### Menu non mostra voci

**Causa**: Utente non ha permessi configurati

**Soluzione**:
1. Verificare che backend restituisca `permissions` array
2. Controllare `localStorage` per vedere user salvato
3. Verificare `menuConfig.ts` per permessi richiesti

```typescript
// Debug in console
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('User permissions:', user.permissions);
```

### DataTable non ordina correttamente

**Causa**: Server-side sorting non implementato

**Soluzione**: Passare `manualSorting={false}` per sorting client-side:

```typescript
<DataTable
  data={data}
  columns={columns}
  // Rimuovere onSortChange per client-side sorting
/>
```

### Export CSV non funziona

**Causa**: Manca implementazione backend

**Soluzione temporanea**: Export client-side automatico

```typescript
<DataTable
  exportable
  // Non passare onExport, useràl'export client-side di default
/>
```

---

## Performance Tips

### 1. Memoizzare Columns Definition

```typescript
const columns = useMemo<ColumnDef<Item>[]>(
  () => [
    // ... colonne
  ],
  [/* dependencies */]
);
```

### 2. Debounce Search Input

```typescript
import { useMemo } from 'react';
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, 300),
  []
);
```

### 3. Paginazione Server-Side per Large Datasets

```typescript
const { data, isLoading } = useGetItemsQuery({
  page: filters.page,
  pageSize: filters.pageSize,
  // Backend deve supportare questi parametri
});
```

---

## Next Steps

1. **Test Integrazione**: Testare menu e permessi con utenti diversi
2. **Migrare Altre Pagine**: Usare DataTable per liste, UDC, movimenti
3. **Personalizzare Menu**: Adattare `menuConfig.ts` alle esigenze
4. **Implementare Export Backend**: API endpoint per export Excel/PDF
5. **Aggiungere Analytics**: Tracciare uso funzionalità per insights

---

## Supporto

Per problemi o domande:
- Consultare `UI_IMPROVEMENTS_REPORT.md` per dettagli tecnici
- Verificare esempi in questo file
- Controllare TypeScript errors per type safety

// ============================================================================
// EJLOG WMS - Components Demo Page
// Pagina di esempio per testare tutti i nuovi componenti
// ============================================================================

import React, { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../../components/shared/DataTable';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import { usePermissions, PermissionGuard } from '../../hooks/usePermissions';
import { Package, Users, Settings, Eye, Edit, Trash2 } from 'lucide-react';
import { UserAccessLevel } from '../../types/models';

// ============================================================================
// MOCK DATA
// ============================================================================

interface DemoItem {
  id: number;
  code: string;
  name: string;
  category: string;
  status: 'active' | 'inactive';
  quantity: number;
}

const mockData: DemoItem[] = [
  { id: 1, code: 'ITEM001', name: 'Articolo Test 1', category: 'Categoria A', status: 'active', quantity: 100 },
  { id: 2, code: 'ITEM002', name: 'Articolo Test 2', category: 'Categoria B', status: 'active', quantity: 50 },
  { id: 3, code: 'ITEM003', name: 'Articolo Test 3', category: 'Categoria A', status: 'inactive', quantity: 0 },
  { id: 4, code: 'ITEM004', name: 'Articolo Test 4', category: 'Categoria C', status: 'active', quantity: 200 },
  { id: 5, code: 'ITEM005', name: 'Articolo Test 5', category: 'Categoria B', status: 'active', quantity: 75 },
];

// ============================================================================
// COMPONENT
// ============================================================================

const ComponentsDemo: React.FC = () => {
  const permissions = usePermissions();
  const [selectedItems, setSelectedItems] = useState<DemoItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  // Columns definition
  const columns: ColumnDef<DemoItem>[] = [
    {
      accessorKey: 'code',
      header: 'Codice',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-ferretto-red" />
          <span className="font-mono font-semibold">{row.original.code}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'name',
      header: 'Nome',
      enableSorting: true,
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
    },
    {
      accessorKey: 'status',
      header: 'Stato',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'active' ? 'success' : 'secondary'}>
          {row.original.status === 'active' ? 'Attivo' : 'Inattivo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantità',
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.quantity}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Azioni',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Visualizza"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Modifica"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Elimina"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Demo Componenti</h1>
        <p className="text-gray-600 mt-1">
          Pagina di test per i nuovi componenti implementati
        </p>
      </div>

      {/* Permissions Demo */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-ferretto-red" />
            Demo Permessi Utente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Informazioni Utente</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Nome:</span>{' '}
                  {permissions.user?.displayName || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Username:</span>{' '}
                  {permissions.user?.userName || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Livello Accesso:</span>{' '}
                  <Badge>
                    {permissions.isAdmin
                      ? 'Amministratore'
                      : permissions.isSupervisor
                      ? 'Supervisore'
                      : permissions.isOperator
                      ? 'Operatore'
                      : 'System'}
                  </Badge>
                </p>
                <p>
                  <span className="font-medium">Permessi:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {permissions.permissions.length > 0 ? (
                      permissions.permissions.map((perm) => (
                        <Badge key={perm} variant="secondary" size="sm">
                          {perm}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500">Nessun permesso</span>
                    )}
                  </div>
                </p>
              </div>
            </div>

            {/* Permission Checks */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Test Permessi</h3>
              <div className="space-y-2 text-sm">
                <PermissionCheck
                  label="items.view"
                  hasPermission={permissions.hasPermission('items.view')}
                />
                <PermissionCheck
                  label="items.create"
                  hasPermission={permissions.hasPermission('items.create')}
                />
                <PermissionCheck
                  label="config.manage"
                  hasPermission={permissions.hasPermission('config.manage')}
                />
                <PermissionCheck
                  label="users.manage"
                  hasPermission={permissions.hasPermission('users.manage')}
                />
              </div>
            </div>
          </div>

          {/* Conditional Buttons */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-2">Buttons Condizionali</h3>
            <div className="flex flex-wrap gap-2">
              {permissions.hasPermission('items.view') && (
                <Button variant="ghost" icon={<Package className="w-4 h-4" />}>
                  Visualizza Articoli
                </Button>
              )}

              {permissions.hasPermission('items.create') && (
                <Button variant="primary" icon={<Package className="w-4 h-4" />}>
                  Crea Articolo
                </Button>
              )}

              {permissions.isAdmin && (
                <Button variant="danger" icon={<Settings className="w-4 h-4" />}>
                  Configurazione (Solo Admin)
                </Button>
              )}

              {!permissions.hasPermission('items.view') && (
                <p className="text-sm text-gray-500 py-2">
                  Nessun button visibile (mancano permessi)
                </p>
              )}
            </div>
          </div>

          {/* Permission Guard Demo */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-2">PermissionGuard Component</h3>
            <div className="space-y-2">
              <PermissionGuard
                requiredPermissions={['items.view']}
                fallback={
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                    Accesso negato: Richiede permesso "items.view"
                  </div>
                }
              >
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
                  Hai accesso! Permesso "items.view" presente.
                </div>
              </PermissionGuard>

              <PermissionGuard
                requiredAccessLevel={UserAccessLevel.AMMINISTRATORE}
                fallback={
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                    Accesso negato: Richiede livello Amministratore
                  </div>
                }
              >
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
                  Sei un Amministratore!
                </div>
              </PermissionGuard>
            </div>
          </div>
        </div>
      </Card>

      {/* DataTable Demo */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Demo DataTable Avanzata</h2>

          {selectedItems.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">{selectedItems.length}</span> elementi
                selezionati
              </p>
            </div>
          )}

          <DataTable
            data={mockData}
            columns={columns}
            searchable
            searchPlaceholder="Cerca per codice o nome..."
            exportable
            exportFilename="demo-export"
            selectable
            onSelectionChange={setSelectedItems}
            pagination={{
              pageIndex: currentPage,
              pageSize: 3,
              totalPages: Math.ceil(mockData.length / 3),
              totalItems: mockData.length,
              onPageChange: setCurrentPage,
              onPageSizeChange: (size) => console.log('Page size:', size),
            }}
            onRowClick={(item) => console.log('Clicked:', item)}
            striped
            hoverable
          />
        </div>
      </Card>

      {/* Badge Variants Demo */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Demo Badge Variants</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </div>
      </Card>

      {/* Button Variants Demo */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Demo Button Variants</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="md">
              Medium
            </Button>
            <Button variant="primary" size="lg">
              Large
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={<Package className="w-4 h-4" />}>
              With Icon
            </Button>
            <Button variant="secondary" icon={<Settings className="w-4 h-4" />} />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Helper Component
const PermissionCheck: React.FC<{ label: string; hasPermission: boolean }> = ({
  label,
  hasPermission,
}) => (
  <div className="flex items-center justify-between">
    <span className="font-mono text-xs">{label}</span>
    {hasPermission ? (
      <Badge variant="success" size="sm">
        ✓
      </Badge>
    ) : (
      <Badge variant="secondary" size="sm">
        ✗
      </Badge>
    )}
  </div>
);

export default ComponentsDemo;

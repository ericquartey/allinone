/**
 * UsersList Component
 * Main users list with TanStack Table, CRUD operations, filters
 */

import { FC, useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, UserFilters, UserDialogMode } from '@/types/user.types';
import { useUsers } from '@/hooks/useUsers';
import { UsersFilters } from './UsersFilters';
import { UserDialog } from './UserDialog';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { DeleteUserDialog } from './DeleteUserDialog';
import { UserGroupBadge } from './UserBadge';
import {
  UserPlus,
  RefreshCw,
  MoreVertical,
  UserCog,
  Key,
  Trash2,
  Printer,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface UsersListProps {
  currentUserId: number;
  isAdmin: boolean;
}

export const UsersList: FC<UsersListProps> = ({ currentUserId, isAdmin }) => {
  // Filters state
  const [filters, setFilters] = useState<UserFilters>({
    username: '',
    groupId: null,
    activeOnly: false,
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([]);

  // Dialog states
  const [userDialog, setUserDialog] = useState<{
    open: boolean;
    mode: UserDialogMode;
    user: User | null;
  }>({
    open: false,
    mode: 'create',
    user: null,
  });

  const [passwordDialog, setPasswordDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({
    open: false,
    user: null,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({
    open: false,
    user: null,
  });

  // Fetch users with filters
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useUsers({
    username: filters.username || undefined,
    groupId: filters.groupId || undefined,
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  });

  const users = usersResponse?.users || [];
  const totalUsers = usersResponse?.total || 0;

  // Permission checks
  const canEditUser = (user: User) => isAdmin || user.id === currentUserId;
  const canDeleteUser = (user: User) =>
    isAdmin && user.id !== currentUserId && user.utente.toLowerCase() !== 'superuser';

  // Table columns definition
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            ID
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => <div className="font-mono text-xs">#{row.getValue('id')}</div>,
        size: 80,
      },
      {
        accessorKey: 'utente',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Username
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => <div className="font-semibold">{row.getValue('utente')}</div>,
      },
      {
        id: 'gruppo',
        accessorFn: (row) => row.gruppoUtente.nome,
        header: 'Gruppo',
        cell: ({ row }) => <UserGroupBadge group={row.original.gruppoUtente} />,
      },
      {
        id: 'lingua',
        accessorFn: (row) => row.lingua.code,
        header: 'Lingua',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.lingua.code} - {row.original.lingua.name}
          </div>
        ),
      },
      {
        accessorKey: 'dataUltimoLogin',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Ultimo Login
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.getValue('dataUltimoLogin') as string | null;
          if (!date) return <span className="text-gray-400">Mai</span>;
          return (
            <div className="text-sm" title={new Date(date).toLocaleString('it-IT')}>
              {formatDistanceToNow(new Date(date), { addSuffix: true, locale: it })}
            </div>
          );
        },
      },
      {
        accessorKey: 'idPostazioneUltimoLogin',
        header: 'IP Login',
        cell: ({ row }) => {
          const ip = row.getValue('idPostazioneUltimoLogin') as number | null;
          return ip ? (
            <div className="font-mono text-xs">{ip}</div>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Azioni',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {canEditUser(user) && (
                  <DropdownMenuItem
                    onClick={() =>
                      setUserDialog({ open: true, mode: 'edit', user })
                    }
                  >
                    <UserCog className="h-4 w-4 mr-2" />
                    Modifica
                  </DropdownMenuItem>
                )}

                {(isAdmin || user.id === currentUserId) && (
                  <DropdownMenuItem
                    onClick={() => setPasswordDialog({ open: true, user })}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Cambia Password
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem disabled>
                  <Printer className="h-4 w-4 mr-2" />
                  Stampa Badge
                </DropdownMenuItem>

                {canDeleteUser(user) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialog({ open: true, user })}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 80,
      },
    ],
    [isAdmin, currentUserId]
  );

  // TanStack Table instance
  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalUsers / pagination.pageSize),
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Errore nel caricamento degli utenti: {error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <UsersFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista Utenti</CardTitle>
                  <CardDescription>
                    {totalUsers} utent{totalUsers === 1 ? 'e' : 'i'} trovat
                    {totalUsers === 1 ? 'o' : 'i'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                    Aggiorna
                  </Button>
                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={() => setUserDialog({ open: true, mode: 'create', user: null })}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Nuovo Utente
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <div className="animate-spin text-4xl">⏳</div>
                    <p className="text-gray-600 dark:text-gray-400">Caricamento utenti...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id} style={{ width: header.getSize() }}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows.length > 0 ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={columns.length} className="text-center py-8">
                              <div className="text-gray-500">Nessun utente trovato</div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalUsers > pagination.pageSize && (
                    <div className="flex items-center justify-between border-t px-4 py-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Pagina {table.getState().pagination.pageIndex + 1} di{' '}
                        {table.getPageCount()} ({totalUsers} totali)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => table.previousPage()}
                          disabled={!table.getCanPreviousPage()}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Precedente
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => table.nextPage()}
                          disabled={!table.getCanNextPage()}
                        >
                          Successivo
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <UserDialog
        mode={userDialog.mode}
        user={userDialog.user}
        open={userDialog.open}
        onOpenChange={(open) => setUserDialog({ ...userDialog, open })}
      />

      <ChangePasswordDialog
        user={passwordDialog.user}
        currentUserId={currentUserId}
        open={passwordDialog.open}
        onOpenChange={(open) => setPasswordDialog({ ...passwordDialog, open })}
      />

      <DeleteUserDialog
        user={deleteDialog.user}
        currentUserId={currentUserId}
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        canDelete={isAdmin}
      />
    </div>
  );
};

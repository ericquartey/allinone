/**
 * UserGroupsTab Component
 * Read-only view of user groups (future: CRUD functionality)
 */

import { FC } from 'react';
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
import { useUserGroups } from '@/hooks/useUsers';
import { PrivilegeLevelBadge } from './UserBadge';
import { Shield, Plus, RefreshCw, Info } from 'lucide-react';

export const UserGroupsTab: FC = () => {
  const { data: groups, isLoading, error, refetch, isRefetching } = useUserGroups();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin text-4xl">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Caricamento gruppi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Errore nel caricamento dei gruppi: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Gruppi Utenti
              </CardTitle>
              <CardDescription>
                Visualizza i gruppi utenti e i loro livelli di privilegi
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
              <Button size="sm" disabled className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Gruppo
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          La gestione completa dei gruppi (creazione, modifica, eliminazione) sarà disponibile in
          una versione futura. Per ora è possibile solo visualizzare i gruppi esistenti.
        </AlertDescription>
      </Alert>

      {/* Groups Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead className="w-[150px]">Livello Privilegi</TableHead>
                  <TableHead className="w-[100px] text-center">Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups && groups.length > 0 ? (
                  groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-mono text-xs">#{group.id}</TableCell>
                      <TableCell className="font-semibold">{group.nome}</TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {group.descrizione || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{group.livelloPrivilegi}</span>
                          <span className="text-xs text-gray-500">
                            {group.livelloPrivilegi === 0
                              ? '(Superuser)'
                              : group.livelloPrivilegi === 1
                              ? '(Admin)'
                              : '(User)'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <PrivilegeLevelBadge level={group.livelloPrivilegi} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Nessun gruppo trovato
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      {groups && groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legenda Livelli Privilegi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <PrivilegeLevelBadge level={0} />
                <div className="text-sm">
                  <div className="font-medium">Superuser</div>
                  <div className="text-xs text-gray-500">Accesso completo al sistema</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PrivilegeLevelBadge level={1} />
                <div className="text-sm">
                  <div className="font-medium">Admin</div>
                  <div className="text-xs text-gray-500">Gestione utenti e configurazioni</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PrivilegeLevelBadge level={2} />
                <div className="text-sm">
                  <div className="font-medium">User</div>
                  <div className="text-xs text-gray-500">Operazioni standard</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

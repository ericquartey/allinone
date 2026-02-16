/**
 * LoginHistoryTab Component
 * View login attempts history with filters and auto-refresh
 */

import { FC, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLoginHistory } from '@/hooks/useUsers';
import { LoginSuccessBadge } from './UserBadge';
import { LogIn, RefreshCw, Filter, Calendar, Search } from 'lucide-react';
import { LoginHistoryFilters } from '@/types/user.types';

export const LoginHistoryTab: FC = () => {
  const [filters, setFilters] = useState<LoginHistoryFilters>({
    username: '',
    dateFrom: '',
    dateTo: '',
    limit: 50,
    offset: 0,
  });

  const [localUsername, setLocalUsername] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  const { data: loginAttempts, isLoading, error, refetch, isRefetching } = useLoginHistory(
    undefined,
    filters
  );

  const handleApplyFilters = () => {
    setFilters({
      ...filters,
      username: localUsername,
      successOnly: statusFilter === 'success',
      failedOnly: statusFilter === 'failed',
    });
  };

  const handleResetFilters = () => {
    setLocalUsername('');
    setStatusFilter('all');
    setFilters({
      username: '',
      dateFrom: '',
      dateTo: '',
      limit: 50,
      offset: 0,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: it });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin text-4xl">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Caricamento storico accessi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Errore nel caricamento dello storico: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const successAttempts = loginAttempts?.filter((a) => a.success).length || 0;
  const failedAttempts = loginAttempts?.filter((a) => !a.success).length || 0;

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-blue-600" />
                Storico Accessi
              </CardTitle>
              <CardDescription>
                Visualizza tutti i tentativi di login (aggiornamento automatico ogni 30 secondi)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totali</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loginAttempts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Successo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successAttempts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Falliti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedAttempts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Username Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-username">Username</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="filter-username"
                  placeholder="Cerca username..."
                  value={localUsername}
                  onChange={(e) => setLocalUsername(e.target.value)}
                  className="pl-9"
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="filter-status">Stato</Label>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger id="filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="success">Solo Successo</SelectItem>
                  <SelectItem value="failed">Solo Falliti</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="filter-date-from">Da Data</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="filter-date-from"
                  type="datetime-local"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="filter-date-to">A Data</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="filter-date-to"
                  type="datetime-local"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" />
              Applica Filtri
            </Button>
            <Button onClick={handleResetFilters} size="sm" variant="outline">
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Login Attempts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Username</TableHead>
                  <TableHead className="w-[180px]">Data/Ora</TableHead>
                  <TableHead className="w-[120px]">IP Address</TableHead>
                  <TableHead className="w-[100px] text-center">Stato</TableHead>
                  <TableHead className="w-[200px]">Motivo Fallimento</TableHead>
                  <TableHead>User Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginAttempts && loginAttempts.length > 0 ? (
                  loginAttempts.map((attempt) => (
                    <TableRow
                      key={attempt.id}
                      className={!attempt.success ? 'bg-red-50 dark:bg-red-950/20' : ''}
                    >
                      <TableCell className="font-semibold">{attempt.username}</TableCell>
                      <TableCell title={formatFullDate(attempt.attemptTimestamp)}>
                        <div className="text-sm">{formatDate(attempt.attemptTimestamp)}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(attempt.attemptTimestamp).toLocaleTimeString('it-IT')}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{attempt.ipAddress}</TableCell>
                      <TableCell className="text-center">
                        <LoginSuccessBadge success={attempt.success} />
                      </TableCell>
                      <TableCell className="text-sm text-red-600 dark:text-red-400">
                        {attempt.failureReason || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 dark:text-gray-400 max-w-[300px] truncate">
                        {attempt.userAgent}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nessun tentativo di login trovato
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination (future enhancement) */}
      {loginAttempts && loginAttempts.length >= filters.limit! && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({ ...filters, offset: Math.max(0, (filters.offset || 0) - 50) })
                }
                disabled={!filters.offset || filters.offset === 0}
              >
                Precedente
              </Button>
              <span className="text-sm text-gray-600">
                Visualizzati: {loginAttempts.length} record
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, offset: (filters.offset || 0) + 50 })}
              >
                Successivo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

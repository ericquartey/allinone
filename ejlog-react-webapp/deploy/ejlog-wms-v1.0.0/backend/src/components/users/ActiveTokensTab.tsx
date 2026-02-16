/**
 * ActiveTokensTab Component
 * View and manage active JWT tokens with auto-refresh
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useActiveTokens, useRevokeToken, useRevokeUserTokens } from '@/hooks/useUsers';
import { TokenStatusBadge } from './UserBadge';
import { Shield, Ban, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

export const ActiveTokensTab: FC = () => {
  const { data: tokens, isLoading, error, refetch, isRefetching } = useActiveTokens();
  const revokeTokenMutation = useRevokeToken();
  const revokeUserTokensMutation = useRevokeUserTokens();

  const [tokenToRevoke, setTokenToRevoke] = useState<string | null>(null);
  const [userToRevokeTokens, setUserToRevokeTokens] = useState<{
    userId: number;
    username: string;
  } | null>(null);

  const handleRevokeToken = async (tokenId: string) => {
    try {
      await revokeTokenMutation.mutateAsync(tokenId);
      setTokenToRevoke(null);
    } catch (error) {
      console.error('Revoke token error:', error);
    }
  };

  const handleRevokeUserTokens = async (userId: number) => {
    try {
      await revokeUserTokensMutation.mutateAsync(userId);
      setUserToRevokeTokens(null);
    } catch (error) {
      console.error('Revoke user tokens error:', error);
    }
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
          <p className="text-gray-600 dark:text-gray-400">Caricamento token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Errore nel caricamento dei token: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const activeTokens = tokens?.filter((t) => !t.isRevoked) || [];
  const revokedTokens = tokens?.filter((t) => t.isRevoked) || [];

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Token Attivi
              </CardTitle>
              <CardDescription>
                Gestisci i token JWT attivi e revocati (aggiornamento automatico ogni 60 secondi)
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
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totali</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokens?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attivi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tokens?.filter((t) => t.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Scadenza</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {tokens?.filter((t) => t.status === 'expiring').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revocati</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {revokedTokens.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Tokens Table */}
      {activeTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Token Attivi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Username</TableHead>
                    <TableHead className="w-[250px]">Token ID</TableHead>
                    <TableHead className="w-[150px]">Creato</TableHead>
                    <TableHead className="w-[150px]">Scadenza</TableHead>
                    <TableHead className="w-[120px]">IP Client</TableHead>
                    <TableHead className="w-[120px] text-center">Stato</TableHead>
                    <TableHead className="w-[100px] text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell className="font-semibold">{token.username}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {token.tokenId.substring(0, 30)}...
                      </TableCell>
                      <TableCell className="text-sm" title={formatFullDate(token.issuedAt)}>
                        {formatDate(token.issuedAt)}
                      </TableCell>
                      <TableCell className="text-sm" title={formatFullDate(token.expiresAt)}>
                        <div className="flex items-center gap-1">
                          {token.status === 'expiring' && (
                            <Clock className="h-3 w-3 text-yellow-600" />
                          )}
                          {formatDate(token.expiresAt)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{token.clientIp}</TableCell>
                      <TableCell className="text-center">
                        <TokenStatusBadge
                          status={token.status}
                          expiresInMinutes={token.expiresInMinutes}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTokenToRevoke(token.tokenId)}
                          disabled={revokeTokenMutation.isPending}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Revoca
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revoked Tokens Table (collapsed) */}
      {revokedTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Token Revocati ({revokedTokens.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Token ID</TableHead>
                    <TableHead>Creato</TableHead>
                    <TableHead>Revocato</TableHead>
                    <TableHead className="text-center">Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revokedTokens.map((token) => (
                    <TableRow key={token.id} className="opacity-60">
                      <TableCell className="font-semibold">{token.username}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {token.tokenId.substring(0, 30)}...
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(token.issuedAt)}</TableCell>
                      <TableCell className="text-sm">
                        {token.lastUsedAt ? formatDate(token.lastUsedAt) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <TokenStatusBadge status={token.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Tokens */}
      {!tokens || tokens.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nessun token trovato
          </CardContent>
        </Card>
      )}

      {/* Revoke Token Confirmation Dialog */}
      <AlertDialog open={!!tokenToRevoke} onOpenChange={() => setTokenToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-600" />
              Revoca Token
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler revocare questo token? L'utente dovrà effettuare nuovamente il
              login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => tokenToRevoke && handleRevokeToken(tokenToRevoke)}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoca Token
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke User Tokens Confirmation Dialog */}
      <AlertDialog
        open={!!userToRevokeTokens}
        onOpenChange={() => setUserToRevokeTokens(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Revoca Tutti i Token Utente
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler revocare tutti i token dell'utente{' '}
              <span className="font-bold">{userToRevokeTokens?.username}</span>? L'utente dovrà
              effettuare nuovamente il login su tutti i dispositivi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                userToRevokeTokens && handleRevokeUserTokens(userToRevokeTokens.userId)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Revoca Tutti i Token
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

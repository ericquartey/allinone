/**
 * DeleteUserDialog Component
 * Confirmation dialog for user deletion with safety checks
 */

import { FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User } from '@/types/user.types';
import { useDeleteUser } from '@/hooks/useUsers';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteUserDialogProps {
  user: User | null;
  currentUserId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canDelete: boolean;
}

export const DeleteUserDialog: FC<DeleteUserDialogProps> = ({
  user,
  currentUserId,
  open,
  onOpenChange,
  canDelete,
}) => {
  const deleteUserMutation = useDeleteUser();

  if (!user) return null;

  // Safety checks
  const isSelf = user.id === currentUserId;
  const isSuperuser = user.utente.toLowerCase() === 'superuser';
  const isBlocked = !canDelete || isSelf || isSuperuser;

  const getWarningMessage = (): string => {
    if (!canDelete) {
      return 'Non hai i permessi necessari per eliminare utenti.';
    }
    if (isSelf) {
      return 'Non puoi eliminare il tuo account. Contatta un altro amministratore.';
    }
    if (isSuperuser) {
      return 'L\'utente Superuser non può essere eliminato per motivi di sicurezza.';
    }
    return '';
  };

  const handleDelete = async () => {
    if (isBlocked) return;

    try {
      await deleteUserMutation.mutateAsync(user.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation onError
      console.error('Delete user error:', error);
    }
  };

  const warningMessage = getWarningMessage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Elimina Utente
          </DialogTitle>
          <DialogDescription>
            Questa azione è irreversibile. Tutti i dati associati all'utente saranno eliminati.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          {warningMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{warningMessage}</AlertDescription>
            </Alert>
          )}

          {/* User Info */}
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Username:
                </span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                  {user.utente}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Gruppo:
                </span>
                <span className="text-sm font-semibold">
                  {user.gruppoUtente.nome}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ID:
                </span>
                <span className="text-sm font-mono">#{user.id}</span>
              </div>
            </div>
          </div>

          {/* Confirmation Text */}
          {!isBlocked && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Sei sicuro di voler eliminare l'utente{' '}
              <span className="font-bold text-red-600 dark:text-red-400">
                {user.utente}
              </span>
              ?
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteUserMutation.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Annulla
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isBlocked || deleteUserMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteUserMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Eliminazione...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina Utente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

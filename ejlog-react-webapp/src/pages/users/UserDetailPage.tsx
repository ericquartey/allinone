// ============================================================================
// EJLOG WMS - User Detail Page (new API /api/users)
// Visualizzazione e modifica dettagli utente
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import toast from 'react-hot-toast';
import { useUser, useUpdateUser, useChangePassword, useDeleteUser } from '../../hooks/useUsers';
import type { User } from '../../types/user.types';

const UserDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = useMemo(() => Number(id || 0), [id]);

  const { data: user, isLoading, error } = useUser(userId);
  const updateUser = useUpdateUser();
  const changePassword = useChangePassword();
  const deleteUser = useDeleteUser();

  const [draft, setDraft] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && !draft) {
      setDraft(user);
    }
  }, [user, draft]);

  const getAccessLevelBadge = (level: number) => {
    const levelLabel = level === 0 ? 'Super Amministratore' : level === 1 ? 'Amministratore' : 'Utente';

    switch (level) {
      case 0:
        return <Badge variant="danger">{levelLabel.toUpperCase()}</Badge>;
      case 1:
        return <Badge variant="warning">{levelLabel.toUpperCase()}</Badge>;
      case 2:
        return <Badge variant="primary">{levelLabel.toUpperCase()}</Badge>;
      default:
        return <Badge variant="secondary">{levelLabel.toUpperCase()}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !user || !draft) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error?.message || 'Utente non trovato'}</p>
            <Button onClick={() => navigate('/users')} className="mt-4">
              Torna all'elenco
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dettagli Utente</h1>
          <p className="text-gray-600 mt-1">{user.utente}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/users')}>Indietro</Button>
          <Button onClick={() => setIsEditing(!isEditing)} disabled={isSaving}>
            {isEditing ? 'Annulla Modifiche' : 'Modifica'}
          </Button>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold">Informazioni Utente</h2>
            {getAccessLevelBadge(draft.gruppoUtente.livelloPrivilegi)}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Utente</label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                <p className="font-semibold">{draft.utente}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
              {isEditing ? (
                <input
                  type="text"
                  value={draft.barcode || ''}
                  onChange={(e) => setDraft({ ...draft, barcode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Barcode utente"
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <p>{draft.barcode || <span className="text-gray-400">-</span>}</p>
                </div>
              )}
            </div>

            {/* Access Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Livello Accesso</label>
              {isEditing ? (
                <select
                  value={draft.gruppoUtente?.livelloPrivilegi ?? 2}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      gruppoUtente: {
                        ...draft.gruppoUtente,
                        livelloPrivilegi: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={2}>Utente</option>
                  <option value={1}>Amministratore</option>
                  <option value={0}>Super Amministratore</option>
                </select>
              ) : (
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <p>{getAccessLevelBadge(draft.gruppoUtente?.livelloPrivilegi ?? 2)}</p>
                </div>
              )}
            </div>

            {/* Lock PPC Login */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accesso PPC</label>
              <div className="flex items-center h-full">
                {isEditing ? (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.lockPpcLogin || false}
                      onChange={(e) => setDraft({ ...draft, lockPpcLogin: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Blocca accesso PPC</span>
                  </label>
                ) : (
                  <div className="flex items-center gap-2">
                    {draft.lockPpcLogin === true ? (
                      <Badge variant="danger">BLOCCATO</Badge>
                    ) : (
                      <Badge variant="success">ATTIVO</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await updateUser.mutateAsync({
                            id: draft.id,
                            data: {
                              groupId: draft.gruppoUtente.id,
                              languageId: draft.lingua.id,
                              barcode: draft.barcode || undefined,
                              lockPpcLogin: !draft.lockPpcLogin,
                            },
                          });
                          setDraft({ ...draft, lockPpcLogin: !draft.lockPpcLogin });
                          toast.success(draft.lockPpcLogin ? 'PPC sbloccato' : 'PPC bloccato');
                        } catch (err) {
                          console.error('[UserDetailPage] Toggle PPC error:', err);
                          toast.error('Errore aggiornamento PPC');
                        }
                      }}
                    >
                      {draft.lockPpcLogin ? 'Sblocca PPC' : 'Blocca PPC'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Annulla
              </Button>
              <Button
                disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await updateUser.mutateAsync({
                      id: draft.id,
                      data: {
                        groupId: draft.gruppoUtente.id,
                        languageId: draft.lingua.id,
                        barcode: draft.barcode || undefined,
                        lockPpcLogin: draft.lockPpcLogin,
                      },
                    });
                    toast.success('Modifiche salvate');
                    setIsEditing(false);
                  } catch (err) {
                    console.error('[UserDetailPage] Update error:', err);
                    toast.error('Errore nel salvataggio');
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Permissions Card */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-4">Permessi e Privilegi</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Gestione Utenti</span>
              {draft.gruppoUtente.livelloPrivilegi <= 1 ? (
                <Badge variant="success">ABILITATO</Badge>
              ) : (
                <Badge variant="secondary">DISABILITATO</Badge>
              )}
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Configurazione Sistema</span>
              {draft.gruppoUtente.livelloPrivilegi === 0 ? (
                <Badge variant="success">ABILITATO</Badge>
              ) : (
                <Badge variant="secondary">DISABILITATO</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-red-600 border-b pb-4">Zona Pericolosa</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Reset Password</p>
                <p className="text-sm text-gray-600">
                  Reimposta la password dell'utente a quella predefinita (promag)
                </p>
              </div>
              <Button
                variant="warning"
                size="sm"
                onClick={async () => {
                  if (!window.confirm(`Reimpostare la password di ${draft.utente} a 'promag'?`)) return;
                  try {
                    await changePassword.mutateAsync({
                      id: draft.id,
                      data: { newPassword: 'promag' },
                    });
                    toast.success('Password reimpostata');
                  } catch (err) {
                    console.error('[UserDetailPage] Reset password error:', err);
                    toast.error('Errore reset password');
                  }
                }}
              >
                Reset Password
              </Button>
            </div>

            <div className="flex items-center justify-between py-2 pt-4 border-t">
              <div>
                <p className="font-medium text-red-600">Elimina Utente</p>
                <p className="text-sm text-gray-600">
                  Questa azione e' irreversibile e cancellera' permanentemente l'utente
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  if (!window.confirm(`Eliminare definitivamente ${draft.utente}?`)) return;
                  try {
                    await deleteUser.mutateAsync(draft.id);
                    toast.success('Utente eliminato');
                    navigate('/users');
                  } catch (err) {
                    console.error('[UserDetailPage] Delete error:', err);
                    toast.error('Errore eliminazione utente');
                  }
                }}
              >
                Elimina
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserDetailPage;

// ============================================================================
// EJLOG WMS - User Detail Page
// Visualizzazione e modifica dettagli utente
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import * as UsersService from '../../services/usersService';
import type { UserClaims } from '../../services/usersService';

const UserDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();

  // State
  const [user, setUser] = useState<UserClaims | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load user on mount
  useEffect(() => {
    if (username) {
      loadUser();
    }
  }, [username]);

  const loadUser = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!username) {
        throw new Error('Username non specificato');
      }

      const userData = await UsersService.getUserByUsername(username);

      if (userData) {
        setUser(userData);
      } else {
        setError('Utente non trovato');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento utente');
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get access level badge
  const getAccessLevelBadge = (level: UsersService.UserAccessLevel) => {
    const levelLabel = UsersService.getAccessLevelLabel(level);

    switch (level) {
      case UsersService.UserAccessLevel.SUPERUSERS:
        return <Badge variant="danger">{levelLabel.toUpperCase()}</Badge>;
      case UsersService.UserAccessLevel.ADMINS:
        return <Badge variant="warning">{levelLabel.toUpperCase()}</Badge>;
      case UsersService.UserAccessLevel.USERS:
        return <Badge variant="primary">{levelLabel.toUpperCase()}</Badge>;
      default:
        return <Badge variant="secondary">{levelLabel.toUpperCase()}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error || 'Utente non trovato'}</p>
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
          <p className="text-gray-600 mt-1">{user.userName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/users')}>
            Indietro
          </Button>
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Annulla Modifiche' : 'Modifica'}
          </Button>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold">Informazioni Utente</h2>
            {getAccessLevelBadge(user.accessLevel)}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Utente
              </label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                <p className="font-semibold">{user.userName}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={user.description || ''}
                  onChange={(e) =>
                    setUser({ ...user, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrizione utente"
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <p>{user.description || <span className="text-gray-400">-</span>}</p>
                </div>
              )}
            </div>

            {/* Access Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Livello Accesso
              </label>
              {isEditing ? (
                <select
                  value={user.accessLevel}
                  onChange={(e) =>
                    setUser({
                      ...user,
                      accessLevel: parseInt(e.target.value) as UsersService.UserAccessLevel,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={UsersService.UserAccessLevel.USERS}>
                    {UsersService.getAccessLevelLabel(UsersService.UserAccessLevel.USERS)}
                  </option>
                  <option value={UsersService.UserAccessLevel.ADMINS}>
                    {UsersService.getAccessLevelLabel(UsersService.UserAccessLevel.ADMINS)}
                  </option>
                  <option value={UsersService.UserAccessLevel.SUPERUSERS}>
                    {UsersService.getAccessLevelLabel(
                      UsersService.UserAccessLevel.SUPERUSERS
                    )}
                  </option>
                </select>
              ) : (
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <p>{UsersService.getAccessLevelLabel(user.accessLevel)}</p>
                </div>
              )}
            </div>

            {/* Lock PPC Login */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accesso PPC
              </label>
              <div className="flex items-center h-full">
                {isEditing ? (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={user.lockPpcLogin || false}
                      onChange={(e) =>
                        setUser({ ...user, lockPpcLogin: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Blocca accesso PPC
                    </span>
                  </label>
                ) : (
                  <div>
                    {user.lockPpcLogin === true ? (
                      <Badge variant="danger">BLOCCATO</Badge>
                    ) : (
                      <Badge variant="success">ATTIVO</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Informazioni:</strong>
                  <ul className="list-disc list-inside mt-2">
                    <li>Gli utenti con livello "Utente" hanno accesso limitato al sistema</li>
                    <li>Gli "Amministratori" possono gestire configurazioni e utenti</li>
                    <li>
                      I "Super Amministratori" hanno accesso completo a tutte le
                      funzionalità
                    </li>
                    <li>
                      Il blocco PPC impedisce l'accesso da terminali palmari
                    </li>
                  </ul>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Annulla
              </Button>
              <Button
                onClick={() => {
                  alert('Funzionalità da implementare: Salva modifiche utente');
                  setIsEditing(false);
                }}
              >
                Salva Modifiche
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
              <span className="text-sm font-medium">Accesso Dashboard</span>
              <Badge variant="success">ABILITATO</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Gestione Articoli</span>
              <Badge variant="success">ABILITATO</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Gestione Utenti</span>
              {UsersService.isAdmin(user) ? (
                <Badge variant="success">ABILITATO</Badge>
              ) : (
                <Badge variant="secondary">DISABILITATO</Badge>
              )}
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Configurazione Sistema</span>
              {UsersService.isSuperUser(user) ? (
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
          <h2 className="text-xl font-semibold text-red-600 border-b pb-4">
            Zona Pericolosa
          </h2>

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
                onClick={() => alert('Funzionalità da implementare: Reset password')}
              >
                Reset Password
              </Button>
            </div>

            <div className="flex items-center justify-between py-2 pt-4 border-t">
              <div>
                <p className="font-medium text-red-600">Elimina Utente</p>
                <p className="text-sm text-gray-600">
                  Questa azione è irreversibile e cancellerà permanentemente l'utente
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  alert('Funzionalità da implementare: Elimina utente')
                }
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

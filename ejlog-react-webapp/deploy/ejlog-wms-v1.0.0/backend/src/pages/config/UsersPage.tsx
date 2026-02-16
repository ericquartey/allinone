// ============================================================================
// EJLOG WMS - Users Configuration Page
// Configurazione utenti di sistema - Dati reali dal database SQL Server
// ============================================================================

import { Users, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { useGetUsersQuery } from '../../services/api/usersApi';

export default function UsersPage() {
  const { data: users, isLoading, error, refetch } = useGetUsersQuery();

  // Mappiamo groupLevel a ruolo leggibile
  const getRoleName = (groupLevel: number) => {
    switch (groupLevel) {
      case 0:
        return 'Superuser';
      case 1:
        return 'Administrator';
      case 2:
        return 'Operator';
      default:
        return 'User';
    }
  };

  // Mappiamo groupLevel a colore badge
  const getRoleColor = (groupLevel: number) => {
    switch (groupLevel) {
      case 0:
        return 'bg-red-100 text-red-800';
      case 1:
        return 'bg-purple-100 text-purple-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-ferretto-red" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestione Utenti</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestione utenti e permessi di sistema - Database SQL Server
              </p>
              {users && (
                <p className="text-xs text-gray-500 mt-1">
                  {users.length} utenti totali dal database
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Aggiorna</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-ferretto-red text-white rounded-lg hover:bg-red-700">
              <Plus className="w-4 h-4" />
              <span>Nuovo Utente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Errore caricamento utenti</h3>
              <p className="text-sm text-red-700 mt-1">
                {'status' in error && error.status === 401
                  ? 'Autenticazione richiesta. Effettua il login per visualizzare gli utenti.'
                  : 'Impossibile caricare la lista utenti dal database. Verifica la connessione al backend.'}
              </p>
              <p className="text-xs text-red-600 mt-2">
                Backend: http://localhost:3077/EjLogHostVertimag/User
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-12 h-12 text-gray-400 animate-spin" />
            <p className="text-gray-600">Caricamento utenti dal database...</p>
          </div>
        </div>
      )}

      {/* Users List */}
      {!isLoading && !error && users && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruolo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livello Accesso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gruppo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user, index) => (
                <tr key={user.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    {user.barcode && (
                      <div className="text-xs text-gray-500">Badge: {user.barcode}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.groupLevel)}`}
                    >
                      {getRoleName(user.groupLevel)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">Level {user.groupLevel}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.groupName || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-ferretto-red hover:text-red-700 mr-3">Modifica</button>
                    <button className="text-gray-600 hover:text-gray-900">Permessi</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && users && users.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Users className="w-16 h-16 text-gray-300" />
            <div className="text-center">
              <p className="text-gray-600 font-medium">Nessun utente trovato</p>
              <p className="text-sm text-gray-500 mt-1">
                Crea un nuovo utente per iniziare
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


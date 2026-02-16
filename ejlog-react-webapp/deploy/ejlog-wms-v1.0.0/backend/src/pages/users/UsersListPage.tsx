// ============================================================================
// EJLOG WMS - Users List Page
// Gestione completa Utenti con filtri avanzati
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Table from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import * as UsersService from '../../services/usersService';
import type { UserClaims, UserAccessLevel } from '../../services/usersService';

const UsersListPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState<UserClaims[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [accessLevelFilter, setAccessLevelFilter] = useState<UserAccessLevel | 'ALL'>('ALL');

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await UsersService.getUsers();

      if (response.result === 'OK' && response.exportedItems) {
        setUsers(response.exportedItems);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento utenti');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply search and access level filters - MEMOIZED for performance
  const filteredUsers = useMemo(() => {
    let filtered = UsersService.filterUsersBySearch(users, searchTerm);

    if (accessLevelFilter !== 'ALL') {
      filtered = filtered.filter(user => user.accessLevel === accessLevelFilter);
    }

    return UsersService.sortUsers(filtered, true);
  }, [users, searchTerm, accessLevelFilter]);

  // Statistics - MEMOIZED for performance
  const stats = useMemo(() => {
    return {
      total: users.length,
      superUsers: users.filter(u => u.accessLevel === UsersService.UserAccessLevel.SUPERUSERS).length,
      admins: users.filter(u => u.accessLevel === UsersService.UserAccessLevel.ADMINS).length,
      regularUsers: users.filter(u => u.accessLevel === UsersService.UserAccessLevel.USERS).length,
      locked: users.filter(u => u.lockPpcLogin === true).length,
    };
  }, [users]);

  // Badge rendering functions - MEMOIZED with useCallback
  const getAccessLevelBadge = useCallback((level: UserAccessLevel) => {
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
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error}</p>
            <Button onClick={loadUsers} className="mt-4">Riprova</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestione Utenti</h1>
          <p className="text-gray-600 mt-1">
            {filteredUsers.length} utenti trovati
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/users/create')}>
            Nuovo Utente
          </Button>
          <Button variant="ghost" onClick={loadUsers}>
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Totale Utenti</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Super Admin</p>
            <p className="text-3xl font-bold text-red-600">{stats.superUsers}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Amministratori</p>
            <p className="text-3xl font-bold text-orange-600">{stats.admins}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Utenti Normali</p>
            <p className="text-3xl font-bold text-green-600">{stats.regularUsers}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Bloccati PPC</p>
            <p className="text-3xl font-bold text-gray-600">{stats.locked}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cerca Utente
            </label>
            <input
              type="text"
              placeholder="Nome utente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Livello Accesso
            </label>
            <select
              value={accessLevelFilter}
              onChange={(e) => setAccessLevelFilter(e.target.value as UserAccessLevel | 'ALL')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti i livelli</option>
              <option value={UsersService.UserAccessLevel.SUPERUSERS}>Super Amministratore</option>
              <option value={UsersService.UserAccessLevel.ADMINS}>Amministratore</option>
              <option value={UsersService.UserAccessLevel.USERS}>Utente</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Elenco Utenti</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => {
              setSearchTerm('');
              setAccessLevelFilter('ALL');
            }}>
              Reset Filtri
            </Button>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Nessun utente trovato</p>
            <p className="text-sm mt-2">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <Table
            columns={[
              {
                key: 'userName',
                label: 'Nome Utente',
                render: (row) => (
                  <div className="font-semibold text-gray-900">
                    {row.userName}
                  </div>
                ),
              },
              {
                key: 'description',
                label: 'Descrizione',
                render: (row) => (
                  <span className="text-sm text-gray-600">
                    {row.description || <span className="text-gray-400">-</span>}
                  </span>
                ),
              },
              {
                key: 'accessLevel',
                label: 'Livello Accesso',
                render: (row) => getAccessLevelBadge(row.accessLevel),
              },
              {
                key: 'lockPpcLogin',
                label: 'Blocco PPC',
                render: (row) => (
                  <div>
                    {row.lockPpcLogin === true ? (
                      <Badge variant="danger" size="sm">BLOCCATO</Badge>
                    ) : (
                      <Badge variant="success" size="sm">ATTIVO</Badge>
                    )}
                  </div>
                ),
              },
              {
                key: 'actions',
                label: 'Azioni',
                render: (row) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/users/${row.userName}`)}
                    >
                      Dettagli
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredUsers}
          />
        )}
      </Card>
    </div>
  );
};

export default UsersListPage;

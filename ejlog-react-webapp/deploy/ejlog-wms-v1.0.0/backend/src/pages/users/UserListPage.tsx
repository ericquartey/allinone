// ============================================================================
// EJLOG WMS - User List Page
// Gestione Utenti e Operatori del sistema
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Table from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

// Mock data - sostituire con chiamate API reali
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    firstName: 'Admin',
    lastName: 'Sistema',
    email: 'admin@ejlog.com',
    role: 'ADMIN',
    operatorCode: null,
    isActive: true,
    isOperator: false,
    lastLogin: '2025-11-20T09:30:00',
    createdAt: '2024-01-01T08:00:00',
    permissions: ['ALL'],
  },
  {
    id: 2,
    username: 'mrossi',
    firstName: 'Mario',
    lastName: 'Rossi',
    email: 'mario.rossi@ejlog.com',
    role: 'OPERATOR',
    operatorCode: 'OPER01',
    isActive: true,
    isOperator: true,
    lastLogin: '2025-11-20T08:30:00',
    createdAt: '2024-02-15T10:00:00',
    permissions: ['PICKING', 'REFILLING', 'INVENTORY'],
  },
  {
    id: 3,
    username: 'lbianchi',
    firstName: 'Laura',
    lastName: 'Bianchi',
    email: 'laura.bianchi@ejlog.com',
    role: 'OPERATOR',
    operatorCode: 'OPER02',
    isActive: true,
    isOperator: true,
    lastLogin: '2025-11-20T09:00:00',
    createdAt: '2024-03-10T14:00:00',
    permissions: ['PICKING', 'REFILLING'],
  },
  {
    id: 4,
    username: 'gverdi',
    firstName: 'Giuseppe',
    lastName: 'Verdi',
    email: 'giuseppe.verdi@ejlog.com',
    role: 'SUPERVISOR',
    operatorCode: 'OPER03',
    isActive: true,
    isOperator: true,
    lastLogin: '2025-11-19T17:30:00',
    createdAt: '2024-03-20T09:00:00',
    permissions: ['PICKING', 'REFILLING', 'INVENTORY', 'LIST_MANAGEMENT'],
  },
  {
    id: 5,
    username: 'arusso',
    firstName: 'Anna',
    lastName: 'Russo',
    email: 'anna.russo@ejlog.com',
    role: 'OPERATOR',
    operatorCode: 'OPER04',
    isActive: false,
    isOperator: true,
    lastLogin: '2025-11-15T16:00:00',
    createdAt: '2024-04-05T11:00:00',
    permissions: ['PICKING'],
  },
  {
    id: 6,
    username: 'pferrari',
    firstName: 'Paolo',
    lastName: 'Ferrari',
    email: 'paolo.ferrari@ejlog.com',
    role: 'MANAGER',
    operatorCode: null,
    isActive: true,
    isOperator: false,
    lastLogin: '2025-11-20T07:00:00',
    createdAt: '2024-01-10T08:00:00',
    permissions: ['REPORTS', 'CONFIGURATION', 'USER_MANAGEMENT', 'LIST_MANAGEMENT'],
  },
];

const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [operatorFilter, setOperatorFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isLoading = false;

  // Filter logic
  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.operatorCode?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && user.isActive) ||
      (statusFilter === 'INACTIVE' && !user.isActive);
    const matchesOperator =
      operatorFilter === 'ALL' ||
      (operatorFilter === 'YES' && user.isOperator) ||
      (operatorFilter === 'NO' && !user.isOperator);

    return matchesSearch && matchesRole && matchesStatus && matchesOperator;
  });

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="danger">ADMIN</Badge>;
      case 'MANAGER':
        return <Badge variant="primary">MANAGER</Badge>;
      case 'SUPERVISOR':
        return <Badge variant="info">SUPERVISOR</Badge>;
      case 'OPERATOR':
        return <Badge variant="success">OPERATORE</Badge>;
      case 'VIEWER':
        return <Badge variant="secondary">VISUALIZZATORE</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  // Handle user actions
  const handleDeactivateUser = (userId: number) => {
    if (confirm('Sei sicuro di voler disattivare questo utente?')) {
      alert(`Utente ${userId} disattivato`);
    }
  };

  const handleActivateUser = (userId: number) => {
    alert(`Utente ${userId} attivato`);
  };

  const handleResetPassword = (userId: number) => {
    if (confirm('Inviare email di reset password all\'utente?')) {
      alert(`Email di reset password inviata all'utente ${userId}`);
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('ATTENZIONE: Eliminare definitivamente questo utente? Questa azione è irreversibile!')) {
      alert(`Utente ${userId} eliminato`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
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
            Utenti e operatori del sistema - {filteredUsers.length} risultati
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/users/roles')}>
            Gestione Ruoli
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            Nuovo Utente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Totale Utenti</p>
            <p className="text-3xl font-bold text-blue-600">{mockUsers.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Utenti Attivi</p>
            <p className="text-3xl font-bold text-green-600">
              {mockUsers.filter((u) => u.isActive).length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Operatori</p>
            <p className="text-3xl font-bold text-purple-600">
              {mockUsers.filter((u) => u.isOperator).length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Amministratori</p>
            <p className="text-3xl font-bold text-red-600">
              {mockUsers.filter((u) => u.role === 'ADMIN').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Utenti Inattivi</p>
            <p className="text-3xl font-bold text-gray-600">
              {mockUsers.filter((u) => !u.isActive).length}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cerca Utente
            </label>
            <input
              type="text"
              placeholder="Username, nome, email, codice operatore..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ruolo</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti i ruoli</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="OPERATOR">Operatore</option>
              <option value="VIEWER">Visualizzatore</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti</option>
              <option value="ACTIVE">Attivi</option>
              <option value="INACTIVE">Inattivi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              È Operatore?
            </label>
            <select
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti</option>
              <option value="YES">Solo operatori</option>
              <option value="NO">Solo utenti</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Utenti</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('ALL');
                setStatusFilter('ALL');
                setOperatorFilter('ALL');
              }}
            >
              Reset Filtri
            </Button>
            <Button size="sm" variant="ghost">
              Esporta Excel
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
                key: 'username',
                label: 'Username',
                render: (row) => (
                  <button
                    className="text-blue-600 hover:underline font-semibold"
                    onClick={() => navigate(`/users/${row.id}`)}
                  >
                    {row.username}
                  </button>
                ),
              },
              {
                key: 'name',
                label: 'Nome Completo',
                render: (row) => (
                  <div>
                    <p className="font-semibold">
                      {row.firstName} {row.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{row.email}</p>
                  </div>
                ),
              },
              {
                key: 'role',
                label: 'Ruolo',
                render: (row) => getRoleBadge(row.role),
              },
              {
                key: 'operatorCode',
                label: 'Codice Operatore',
                render: (row) =>
                  row.operatorCode ? (
                    <span className="font-mono font-semibold text-purple-600">
                      {row.operatorCode}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  ),
              },
              {
                key: 'isOperator',
                label: 'Operatore RF',
                render: (row) =>
                  row.isOperator ? (
                    <Badge variant="success">SÌ</Badge>
                  ) : (
                    <Badge variant="secondary">NO</Badge>
                  ),
              },
              {
                key: 'status',
                label: 'Stato',
                render: (row) =>
                  row.isActive ? (
                    <Badge variant="success">ATTIVO</Badge>
                  ) : (
                    <Badge variant="danger">DISATTIVATO</Badge>
                  ),
              },
              {
                key: 'lastLogin',
                label: 'Ultimo Accesso',
                render: (row) => (
                  <span className="text-sm text-gray-600">
                    {new Date(row.lastLogin).toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'permissions',
                label: 'Permessi',
                render: (row) => (
                  <span className="text-xs text-gray-600" title={row.permissions.join(', ')}>
                    {row.permissions.length === 1 && row.permissions[0] === 'ALL'
                      ? 'Tutti'
                      : `${row.permissions.length} permessi`}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'Azioni',
                render: (row) => (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/users/${row.id}`)}
                    >
                      Modifica
                    </Button>
                    {row.isActive ? (
                      <Button
                        size="sm"
                        variant="warning"
                        onClick={() => handleDeactivateUser(row.id)}
                      >
                        Disattiva
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleActivateUser(row.id)}
                      >
                        Attiva
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleResetPassword(row.id)}
                    >
                      Reset Password
                    </Button>
                    {row.role !== 'ADMIN' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteUser(row.id)}
                      >
                        Elimina
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={filteredUsers}
          />
        )}
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Crea Nuovo Utente</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    placeholder="username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="user@ejlog.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    placeholder="Mario"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    placeholder="Rossi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conferma Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Role and Operator */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ruolo *
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Seleziona ruolo...</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="OPERATOR">Operatore</option>
                    <option value="VIEWER">Visualizzatore</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Codice Operatore
                  </label>
                  <input
                    type="text"
                    placeholder="OPER01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Solo per utenti che lavorano su RF
                  </p>
                </div>
              </div>

              {/* Operator Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isOperator"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isOperator" className="ml-2 text-sm text-gray-700">
                  Abilita operatore RF (può eseguire liste su terminale)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Utente attivo
                </label>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permessi
                </label>
                <div className="grid grid-cols-2 gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Picking</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Stoccaggio</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Inventario</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Trasferimenti</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Gestione Liste</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Gestione Utenti</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Configurazione</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Reports</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Annulla
              </Button>
              <Button
                onClick={() => {
                  alert('Funzionalità da implementare: Crea utente');
                  setShowCreateModal(false);
                }}
              >
                Crea Utente
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UserListPage;

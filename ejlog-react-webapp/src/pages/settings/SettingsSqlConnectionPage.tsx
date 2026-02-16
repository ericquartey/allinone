// ============================================================================
// EJLOG WMS - SQL Connection Settings Page
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Database, Save } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import Badge from '../../components/shared/Badge';

const SettingsSqlConnectionPage: React.FC = () => {
  const [dbHostInput, setDbHostInput] = useState('localhost');
  const [dbInstanceInput, setDbInstanceInput] = useState('SQL2019');
  const [dbDatabaseInput, setDbDatabaseInput] = useState('promag');
  const [dbUserInput, setDbUserInput] = useState('sa');
  const [dbPasswordInput, setDbPasswordInput] = useState('');
  const [dbPortInput, setDbPortInput] = useState('');
  const [dbHasPassword, setDbHasPassword] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbSaving, setDbSaving] = useState(false);
  const [dbTesting, setDbTesting] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbSuccessMessage, setDbSuccessMessage] = useState<string | null>(null);
  const [dbHasChanges, setDbHasChanges] = useState(false);

  useEffect(() => {
    loadDbConfig();
  }, []);

  const normalizeDbServer = (host: string, instance: string) => {
    const trimmedHost = host.trim() || 'localhost';
    const trimmedInstance = instance.trim();
    if (!trimmedInstance) return '';
    if (trimmedInstance.includes('\\') || trimmedInstance.includes(',') || trimmedInstance.includes(':')) {
      return trimmedInstance;
    }
    return `${trimmedHost}\\${trimmedInstance}`;
  };

  const handleDbServerChange = (value: string, setter: (next: string) => void) => {
    setter(value);
    setDbHasChanges(true);
    setDbSuccessMessage(null);
  };

  const loadDbConfig = async () => {
    setDbLoading(true);
    setDbError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/db-config', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.config?.server) {
        setDbHostInput(data.config.host || 'localhost');
        setDbInstanceInput(data.config.instanceName || 'SQL2019');
        setDbDatabaseInput(data.config.database || 'promag');
        setDbUserInput(data.config.user || 'sa');
        setDbPortInput(data.config.port ? String(data.config.port) : '');
        setDbHasPassword(Boolean(data.config.hasPassword));
        setDbHasChanges(false);
      }
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Errore nel caricamento database');
      console.error('Error loading db config:', err);
    } finally {
      setDbLoading(false);
    }
  };

  const handleSaveDbConfig = async () => {
    const normalizedServer = normalizeDbServer(dbHostInput, dbInstanceInput);
    if (!normalizedServer || !dbDatabaseInput.trim()) {
      setDbError('Inserisci host, istanza e database validi');
      return;
    }

    setDbSaving(true);
    setDbError(null);
    setDbSuccessMessage(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/db-config', {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server: normalizedServer,
          host: dbHostInput.trim() || 'localhost',
          instanceName: dbInstanceInput.trim(),
          database: dbDatabaseInput.trim(),
          user: dbUserInput.trim(),
          password: dbPasswordInput,
          port: dbPortInput ? Number(dbPortInput) : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setDbHostInput(data.config?.host || 'localhost');
        setDbInstanceInput(data.config?.instanceName || dbInstanceInput);
        setDbDatabaseInput(data.config?.database || dbDatabaseInput);
        setDbUserInput(data.config?.user || dbUserInput);
        setDbPortInput(data.config?.port ? String(data.config.port) : '');
        setDbHasPassword(Boolean(data.config?.hasPassword));
        setDbPasswordInput('');
        setDbSuccessMessage('Connessione SQL aggiornata.');
        setDbHasChanges(false);
      } else {
        throw new Error(data.message || 'Errore nel salvataggio');
      }
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Errore nel salvataggio database');
      console.error('Error saving db config:', err);
    } finally {
      setDbSaving(false);
    }
  };

  const handleTestDbConfig = async () => {
    const normalizedServer = normalizeDbServer(dbHostInput, dbInstanceInput);
    if (!normalizedServer || !dbDatabaseInput.trim()) {
      setDbError('Inserisci host, istanza e database validi');
      return;
    }

    setDbTesting(true);
    setDbError(null);
    setDbSuccessMessage(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/db-config/test', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server: normalizedServer,
          host: dbHostInput.trim() || 'localhost',
          instanceName: dbInstanceInput.trim(),
          database: dbDatabaseInput.trim(),
          user: dbUserInput.trim(),
          password: dbPasswordInput,
          port: dbPortInput ? Number(dbPortInput) : null,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      setDbSuccessMessage('Connessione SQL riuscita.');
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Connessione SQL fallita');
      console.error('Error testing db config:', err);
    } finally {
      setDbTesting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Database className="w-7 h-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connessione SQL</h1>
          <p className="text-gray-600">Configura i parametri di connessione al database EJLOG.</p>
        </div>
      </div>

      <Card>
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold">Database EJLOG</h2>
            <Badge variant="primary">Database</Badge>
          </div>
          {dbLoading ? (
            <div className="flex items-center">
              <Spinner size="sm" className="mr-2" />
              <span className="text-sm text-gray-600">Caricamento configurazione...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dbHostInput}
                  onChange={(e) => handleDbServerChange(e.target.value, setDbHostInput)}
                  placeholder="localhost"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Istanza SQL</label>
                <input
                  list="sql-instances"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dbInstanceInput}
                  onChange={(e) => handleDbServerChange(e.target.value, setDbInstanceInput)}
                  placeholder="SQL2022 / SQL2019"
                />
                <datalist id="sql-instances">
                  <option value="SQL2022" />
                  <option value="SQL2019" />
                  <option value="SQL2017" />
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dbDatabaseInput}
                  onChange={(e) => handleDbServerChange(e.target.value, setDbDatabaseInput)}
                  placeholder="promag"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utente</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dbUserInput}
                  onChange={(e) => handleDbServerChange(e.target.value, setDbUserInput)}
                  placeholder="sa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dbPasswordInput}
                  onChange={(e) => handleDbServerChange(e.target.value, setDbPasswordInput)}
                  placeholder={dbHasPassword ? 'Password salvata' : 'Inserisci password'}
                />
                {dbHasPassword && dbPasswordInput.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Password già salvata. Lascia vuoto per mantenerla.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Porta (opzionale)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dbPortInput}
                  onChange={(e) => handleDbServerChange(e.target.value, setDbPortInput)}
                  placeholder="1433"
                />
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-3 md:justify-end">
                <Button
                  variant="secondary"
                  onClick={handleTestDbConfig}
                  disabled={dbTesting}
                >
                  {dbTesting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Test...
                    </>
                  ) : (
                    'Test Connessione'
                  )}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveDbConfig}
                  disabled={!dbHasChanges || dbSaving}
                >
                  {dbSaving ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salva Connessione
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          {dbError && <p className="text-sm text-red-600 mt-2">{dbError}</p>}
          {dbSuccessMessage && (
            <p className="text-sm text-green-600 mt-2">{dbSuccessMessage}</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SettingsSqlConnectionPage;

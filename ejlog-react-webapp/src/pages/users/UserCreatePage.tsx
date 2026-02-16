// ============================================================================
// EJLOG WMS - User Create Page
// Form per la creazione di nuovi utenti
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import * as UsersService from '../../services/usersService';
import type { User, UserAccessLevel } from '../../services/usersService';

const UserCreatePage: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<Partial<User>>({
    userName: '',
    description: '',
    accessLevel: UsersService.UserAccessLevel.USERS,
    lockPpcLogin: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (field: keyof User, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    const errors = UsersService.validateUserCreation(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const user: User = {
        userName: formData.userName!,
        description: formData.description || null,
        accessLevel: formData.accessLevel!,
        lockPpcLogin: formData.lockPpcLogin || false,
      };

      const response = await UsersService.createUser(user);

      if (response.result === 'OK') {
        // Success - navigate back to list
        navigate('/users');
      } else {
        setError(response.message || 'Errore durante la creazione utente');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la creazione utente');
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Nuovo Utente</h1>
          <p className="text-gray-600 mt-1">
            Crea un nuovo utente del sistema
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/users')}>
          Annulla
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card>
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Name */}
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Utente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="userName"
              value={formData.userName}
              onChange={(e) => handleInputChange('userName', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.userName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="es. mario.rossi"
              maxLength={250}
              disabled={loading}
            />
            {validationErrors.userName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.userName}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Username univoco per l'autenticazione
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <input
              type="text"
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="es. Mario Rossi - Operatore"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Descrizione opzionale per identificare l'utente
            </p>
          </div>

          {/* Access Level */}
          <div>
            <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-700 mb-2">
              Livello Accesso <span className="text-red-500">*</span>
            </label>
            <select
              id="accessLevel"
              value={formData.accessLevel}
              onChange={(e) => handleInputChange('accessLevel', parseInt(e.target.value) as UserAccessLevel)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.accessLevel ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              <option value={UsersService.UserAccessLevel.USERS}>
                {UsersService.getAccessLevelLabel(UsersService.UserAccessLevel.USERS)}
              </option>
              <option value={UsersService.UserAccessLevel.ADMINS}>
                {UsersService.getAccessLevelLabel(UsersService.UserAccessLevel.ADMINS)}
              </option>
              <option value={UsersService.UserAccessLevel.SUPERUSERS}>
                {UsersService.getAccessLevelLabel(UsersService.UserAccessLevel.SUPERUSERS)}
              </option>
            </select>
            {validationErrors.accessLevel && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.accessLevel}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Determina i privilegi dell'utente nel sistema
            </p>
          </div>

          {/* Lock PPC Login */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="lockPpcLogin"
                type="checkbox"
                checked={formData.lockPpcLogin || false}
                onChange={(e) => handleInputChange('lockPpcLogin', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="lockPpcLogin" className="font-medium text-gray-700">
                Blocca accesso PPC
              </label>
              <p className="text-gray-500">
                Se selezionato, l'utente non potrà accedere tramite terminali PPC
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Nota:</strong> La password predefinita per i nuovi utenti è <code className="bg-blue-100 px-1 py-0.5 rounded">promag</code>.
                  L'utente dovrebbe cambiarla al primo accesso.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/users')}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Creazione in corso...</span>
                </div>
              ) : (
                'Crea Utente'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UserCreatePage;

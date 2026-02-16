// ============================================================================
// EJLOG WMS - Login Page
// Pagina di login con username/password
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../services/api/usersApi';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login: loginToStore } = useAuthStore();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');

  // Debug log per identificare quale Login è in uso
  console.log('[LOGIN] Component: src/pages/auth/LoginPage.tsx (Redux version)');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await login(formData).unwrap();

      if (result.success && result.user && result.token) {
        // Fetch complete user data with firstName/lastName
        const userDetailsResponse = await fetch(`http://localhost:3077/api/users/${result.user.id}`);
        const userDetails = userDetailsResponse.ok ? await userDetailsResponse.json() : result.user;

        // Mappa groupLevel a ruoli leggibili
        const mapGroupLevelToRole = (level: number): string => {
          if (level === 0) return 'ADMIN'; // SUPERUSER mapped to ADMIN for accessLevel
          if (level === 1) return 'ADMIN';
          if (level === 2) return 'OPERATOR';
          return 'VIEWER';
        };

        // Mappa la risposta del backend al formato User di authStore
        const userClaims = {
          id: result.user.id.toString(),
          username: result.user.username,
          email: `${result.user.username}@ferretto.it`,
          firstName: userDetails.firstName || undefined,
          lastName: userDetails.lastName || undefined,
          fullName: userDetails.firstName && userDetails.lastName
            ? `${userDetails.firstName} ${userDetails.lastName}`
            : result.user.username,
          roles: result.user.groupName
            ? [result.user.groupName]
            : [],
          accessLevel: mapGroupLevelToRole(result.user.groupLevel),
          permissions: result.user.groupLevel === 0 ? ['*'] : [],
          active: true,
        };

        loginToStore(userClaims, result.token);

        console.log('Login riuscito:', {
          username: result.user.username,
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          groupName: result.user.groupName,
          groupLevel: result.user.groupLevel,
          isSuperuser: (result as any).isSuperuser,
        });

        // Redirect to home after successful login (Playwright tests expect this)
        navigate('/');
      } else {
        setError(result.message || 'Credenziali non valide');
      }
    } catch (err: any) {
      console.error('Errore login:', err);
      const errorMessage = err.data?.detail || err.data?.message || err.message || 'Errore durante il login';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ferrGray to-gray-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo e Titolo */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-ferrRed rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-4xl">F</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">EjLog WMS</h2>
          <p className="mt-2 text-sm text-gray-300">Sistema di Gestione Magazzino Ferretto</p>
        </div>

        {/* Form Login */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Username"
              name="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              autoFocus
              autoComplete="username"
              icon={
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              autoComplete="current-password"
              icon={
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
            >
              Accedi
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => navigate('/login/badge')}
                className="block w-full text-sm text-ferrRed hover:text-red-700"
              >
                Accedi con Badge
              </button>
              <a
                href="/users-list"
                target="_blank"
                className="block w-full text-sm text-blue-600 hover:text-blue-800"
              >
                Visualizza Utenti Database
              </a>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Utenti trovati nel database: 35</p>
          <p>Clicca su "Visualizza Utenti Database" per vedere l'elenco completo degli utenti disponibili.</p>
        </div>

        {/* Password Hint Box per Superuser */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          <p className="font-semibold mb-1">Password Superuser Dinamica</p>
          <p className="mb-1">
            Username: <span className="font-mono font-bold">superuser</span>
          </p>
          <p className="mb-1">
            Password oggi ({new Date().getDate()}/{new Date().getMonth() + 1}):
            <span className="font-mono font-bold ml-1">
              promag{(31 - new Date().getDate()).toString().padStart(2, '0')}
            </span>
          </p>
          <p className="text-xs mt-2 text-green-700">
            Formula: promag + (31 - giorno_corrente)
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-300">
          Ferretto Group {new Date().getFullYear()} - Tutti i diritti riservati
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


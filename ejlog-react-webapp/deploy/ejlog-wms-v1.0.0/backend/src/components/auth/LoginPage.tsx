// ============================================================================
// EJLOG WMS - Login Page
// Authentication page with Ferretto branding
// ============================================================================

import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import Button from '../common/Button';
import Loading from '../common/Loading';

// Login form data interface
interface LoginFormData {
  username: string;
  password: string;
}

function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });

  // Debug log per identificare quale Login è in uso
  console.log('[LOGIN] Component: src/components/auth/LoginPage.tsx (Zustand store version)');

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      toast.error('Compilare tutti i campi');
      return;
    }

    const result = await login(formData);

    if (result.success) {
      toast.success('Login effettuato con successo');
      navigate('/');
    } else {
      toast.error(result.error || 'Credenziali non valide');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Ferretto Branding */}
          <div className="bg-gradient-to-r from-ferretto-red to-red-700 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <span className="text-4xl font-bold text-ferretto-red">E</span>
            </div>
            <h1 className="text-3xl font-bold text-white">EjLog</h1>
            <p className="text-red-100 mt-2">Sistema di Gestione Logistica</p>
          </div>

          {/* Login Form */}
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Accedi
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent transition-all"
                  placeholder="Inserisci il tuo username"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent transition-all"
                  placeholder="Inserisci la tua password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-ferretto-red border-gray-300 rounded focus:ring-ferretto-red"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Ricordami
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm text-ferretto-red hover:text-red-700 font-medium"
                  onClick={(e) => e.preventDefault()}
                >
                  Password dimenticata?
                </a>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loading size="sm" />
                    <span className="ml-2">Accesso in corso...</span>
                  </div>
                ) : (
                  'Accedi'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Non hai un account?{' '}
                <a
                  href="#"
                  className="text-ferretto-red hover:text-red-700 font-medium"
                  onClick={(e) => e.preventDefault()}
                >
                  Contatta l'amministratore
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Ferretto Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Ferretto Group - Warehouse Management System</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/api/auth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Debug log per identificare quale Login è in uso
  console.log('[LOGIN] Component: src/pages/Login.tsx (Zustand version)');

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username obbligatorio';
    }

    // Password validation - solo check se vuota, nessun vincolo di complessità
    if (!formData.password) {
      newErrors.password = 'Password obbligatoria';
    }
    // Password valida: qualsiasi lunghezza >= 1 carattere

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.login(formData.username, formData.password);

      console.log('[LOGIN] Authentication successful', {
        username: result.user.username,
        accessLevel: result.user.accessLevel,
        roles: result.user.roles,
      });

      // Update Zustand store with user data and token
      login(result.user, result.token);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('[LOGIN] Authentication failed', error);
      setApiError(error.message || 'Errore durante il login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    // Clear API error
    if (apiError) {
      setApiError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ferretto-dark via-gray-800 to-ferretto-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-ferretto-red rounded-full mb-4">
            <span className="text-white text-4xl font-bold">E</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">EjLog WMS</h1>
          <p className="text-gray-400 text-lg">Warehouse Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Accedi al Sistema
          </h2>

          {/* API Error Alert */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Errore</p>
                <p className="text-sm text-red-700 mt-1">{apiError}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              placeholder="Inserisci username"
              required
              autoFocus
              disabled={isLoading}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Inserisci password"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                'Accesso in corso...'
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Accedi
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Versione 1.0.0 - 2025 EjLog
            </p>
          </div>
        </div>

        {/* Development Info */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-medium text-yellow-800 mb-2">Development Mode</p>
            <p className="text-xs text-yellow-700">
              Default credentials: <code className="bg-yellow-100 px-1 rounded">admin / admin</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

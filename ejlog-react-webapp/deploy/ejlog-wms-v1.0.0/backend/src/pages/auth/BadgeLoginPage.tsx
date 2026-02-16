// ============================================================================
// EJLOG WMS - Badge Login Page
// Login con badge RFID
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticateWithBadgeMutation } from '../../services/api/usersApi';
import { useAppDispatch } from '../../app/hooks';
import { setCredentials } from '../../features/auth/authSlice';
import Button from '../../components/shared/Button';

const BadgeLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [authenticateWithBadge, { isLoading }] = useAuthenticateWithBadgeMutation();

  const [badgeCode, setBadgeCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus sull'input per scanner badge
    inputRef.current?.focus();
  }, []);

  const handleBadgeScan = async (code: string) => {
    setError('');

    try {
      const result = await authenticateWithBadge({ badgeCode: code }).unwrap();

      if (result.success && result.user) {
        dispatch(setCredentials({
          user: result.user,
          token: result.user.token,
        }));
        navigate('/');
      } else {
        setError(result.message || 'Badge non valido');
        setBadgeCode('');
        inputRef.current?.focus();
      }
    } catch (err: any) {
      setError(err.data?.message || 'Errore durante l\'autenticazione');
      setBadgeCode('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && badgeCode.trim()) {
      handleBadgeScan(badgeCode.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ferrGray to-gray-700 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-ferrRed rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-4xl">F</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">Accesso con Badge</h2>
          <p className="mt-2 text-sm text-gray-300">Avvicina il badge al lettore</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="text-center mb-6">
            <svg
              className={`mx-auto h-24 w-24 ${isLoading ? 'text-ferrRed animate-pulse' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="password"
            value={badgeCode}
            onChange={(e) => setBadgeCode(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-ferrRed"
            placeholder="••••••"
            autoComplete="off"
            disabled={isLoading}
          />

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-ferrRed hover:text-red-700"
            >
              Accedi con Username e Password
            </button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-300">
          Ferretto Group {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default BadgeLoginPage;

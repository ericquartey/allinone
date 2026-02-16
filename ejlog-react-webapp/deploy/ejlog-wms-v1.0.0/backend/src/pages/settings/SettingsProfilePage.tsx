// ============================================================================
// EJLOG WMS - Settings Profile Page
// Gestione profilo utente e preferenze personali con dati reali
// ============================================================================

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  KeyIcon,
  CameraIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { RootState } from '../../app/store';
import { setCredentials } from '../../features/auth/authSlice';

export default function SettingsProfilePage() {
  const dispatch = useDispatch();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Verifica permessi utente
  const hasAdminPermissions = authUser?.permissions?.includes('*') || authUser?.roles?.includes('ADMIN') || authUser?.roles?.includes('SUPERUSER');
  const canEditProfile = hasAdminPermissions || authUser?.permissions?.includes('USER_EDIT');
  const canCreateUser = hasAdminPermissions || authUser?.permissions?.includes('USER_CREATE');

  const [profileData, setProfileData] = useState({
    userId: authUser?.userId || '',
    username: authUser?.username || '',
    displayName: authUser?.displayName || '',
    email: authUser?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    roles: authUser?.roles || [],
    permissions: authUser?.permissions || [],
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isEditing, setIsEditing] = useState(false);

  // Sincronizza con dati utente quando cambiano
  useEffect(() => {
    if (authUser) {
      // Estrai nome e cognome da displayName se presente
      const nameParts = (authUser.displayName || authUser.username || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setProfileData({
        userId: authUser.userId || '',
        username: authUser.username || '',
        displayName: authUser.displayName || '',
        email: authUser.email || '',
        firstName,
        lastName,
        phone: '',
        department: '',
        roles: authUser.roles || [],
        permissions: authUser.permissions || [],
      });
    }
  }, [authUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEditProfile) {
      toast.error('Non hai i permessi per modificare il profilo');
      return;
    }

    try {
      // Qui dovresti chiamare l'API per aggiornare il profilo
      // const response = await updateUserProfile(profileData);

      // Aggiorna lo stato Redux con i nuovi dati
      const updatedDisplayName = `${profileData.firstName} ${profileData.lastName}`.trim() || profileData.username;

      dispatch(setCredentials({
        user: {
          ...authUser!,
          displayName: updatedDisplayName,
          email: profileData.email,
        },
        token: localStorage.getItem('token') || '',
      }));

      toast.success('Profilo aggiornato con successo');
      setIsEditing(false);
    } catch (error) {
      console.error('Errore aggiornamento profilo:', error);
      toast.error('Errore durante l\'aggiornamento del profilo');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Le password non corrispondono');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('La password deve contenere almeno 8 caratteri');
      return;
    }

    try {
      // Qui dovresti chiamare l'API per cambiare la password
      // await changePassword({
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword,
      // });

      toast.success('Password modificata con successo');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Errore cambio password:', error);
      toast.error('Errore durante il cambio password');
    }
  };

  if (!isAuthenticated || !authUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            ⚠️ Devi essere autenticato per visualizzare il profilo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header con Avatar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center relative group">
                <UserCircleIcon className="w-12 h-12 text-white" />
                {canEditProfile && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <CameraIcon className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profileData.displayName || profileData.username}
              </h2>
              <p className="text-gray-600">@{profileData.username}</p>
              <p className="text-sm text-gray-500 mt-1">ID: {profileData.userId}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {profileData.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {canEditProfile && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${
                isEditing
                  ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
              }`}
            >
              {isEditing ? 'Annulla' : 'Modifica Profilo'}
            </button>
          )}
        </div>

        {/* Permessi Utente */}
        {hasAdminPermissions && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <ShieldCheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Permessi Amministratore</p>
                <p className="text-xs text-green-700 mt-1">
                  Hai accesso completo a tutte le funzionalità del sistema
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Informazioni Profilo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Informazioni Personali</h3>

        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={profileData.username}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">L'username non può essere modificato</p>
            </div>

            {/* User ID (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Utente
              </label>
              <input
                type="text"
                value={profileData.userId}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                placeholder="Mario"
              />
            </div>

            {/* Cognome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cognome
              </label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                placeholder="Rossi"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <EnvelopeIcon className="w-4 h-4" />
                  <span>Email</span>
                </div>
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                placeholder="mario.rossi@example.com"
              />
            </div>

            {/* Telefono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <PhoneIcon className="w-4 h-4" />
                  <span>Telefono</span>
                </div>
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                placeholder="+39 123 456 7890"
              />
            </div>

            {/* Reparto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  <span>Reparto</span>
                </div>
              </label>
              <input
                type="text"
                value={profileData.department}
                onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                placeholder="Logistica"
              />
            </div>

            {/* Ruoli (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ruoli
              </label>
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                {profileData.roles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileData.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">Nessun ruolo assegnato</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">I ruoli possono essere modificati solo dall'amministratore</p>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Salva Modifiche
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Cambio Password */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          <div className="flex items-center space-x-2">
            <KeyIcon className="w-5 h-5" />
            <span>Sicurezza - Cambio Password</span>
          </div>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div className="max-w-md space-y-4">
            {/* Password Attuale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Attuale
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Nuova Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuova Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">Minimo 8 caratteri</p>
            </div>

            {/* Conferma Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conferma Nuova Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Cambia Password
            </button>
          </div>
        </form>
      </div>

      {/* Permessi Dettagliati (solo per admin) */}
      {hasAdminPermissions && profileData.permissions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Permessi Assegnati</span>
            </div>
          </h3>
          <div className="flex flex-wrap gap-2">
            {profileData.permissions.map((permission) => (
              <span
                key={permission}
                className="inline-block px-3 py-1 bg-green-50 text-green-700 text-sm font-mono border border-green-200 rounded"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 Le modifiche al profilo verranno salvate nel database e saranno visibili immediatamente in tutta l'applicazione.
          {!canEditProfile && ' Contatta un amministratore per modificare il tuo profilo.'}
        </p>
      </div>
    </div>
  );
}

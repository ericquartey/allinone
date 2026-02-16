// ============================================================================
// EJLOG WMS - Settings Notifications Page
// Gestione preferenze notifiche
// ============================================================================

import { BellIcon } from '@heroicons/react/24/outline';

export default function SettingsNotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Configurazione Notifiche
          </h3>
          <p className="text-gray-600">
            Questa sezione è in fase di sviluppo.
            <br />
            Qui potrai configurare le notifiche push, email e SMS.
          </p>
        </div>
      </div>
    </div>
  );
}

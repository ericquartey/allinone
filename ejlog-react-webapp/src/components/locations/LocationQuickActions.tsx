// ============================================================================
// EJLOG WMS - Location Quick Actions Component
// Quick action buttons for common location operations
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../shared/Button';
import Alert from '../shared/Alert';
import {
  useReserveLocationMutation,
  useUnreserveLocationMutation,
  useBlockLocationMutation,
  useUnblockLocationMutation,
  useTriggerInventoryCheckMutation,
} from '../../services/api/locationApi';
import { Location } from '../../types/location';

interface LocationQuickActionsProps {
  location: Location;
  onSuccess?: () => void;
  compact?: boolean;
  showNavigate?: boolean;
}

const LocationQuickActions: React.FC<LocationQuickActionsProps> = ({
  location,
  onSuccess,
  compact = false,
  showNavigate = true,
}) => {
  const navigate = useNavigate();
  const [actionResult, setActionResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Mutations
  const [reserveLocation, { isLoading: isReserving }] = useReserveLocationMutation();
  const [unreserveLocation, { isLoading: isUnreserving }] = useUnreserveLocationMutation();
  const [blockLocation, { isLoading: isBlocking }] = useBlockLocationMutation();
  const [unblockLocation, { isLoading: isUnblocking }] = useUnblockLocationMutation();
  const [triggerInventory, { isLoading: isTriggeringInventory }] = useTriggerInventoryCheckMutation();

  const handleAction = async (
    action: () => Promise<any>,
    successMessage: string
  ) => {
    try {
      await action();
      setActionResult({ type: 'success', message: successMessage });
      if (onSuccess) onSuccess();
      // Clear message after 3 seconds
      setTimeout(() => setActionResult(null), 3000);
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Operation failed',
      });
      setTimeout(() => setActionResult(null), 5000);
    }
  };

  const handleReserve = () => {
    const hours = prompt('Durata riservazione (ore):', '24');
    if (!hours) return;

    const reason = prompt('Motivo riservazione:', 'Operazione manuale');
    if (!reason) return;

    handleAction(
      () =>
        reserveLocation({
          locationId: location.id,
          reservedBy: 'CURRENT_USER', // TODO: Get from auth
          reservedUntil: new Date(Date.now() + parseInt(hours) * 60 * 60 * 1000),
          reason,
        }).unwrap(),
      'Ubicazione riservata con successo'
    );
  };

  const handleUnreserve = () => {
    const reason = prompt('Motivo rimozione riservazione:', 'Operazione manuale');
    if (!reason) return;

    handleAction(
      () =>
        unreserveLocation({
          locationId: location.id,
          reason,
        }).unwrap(),
      'Riservazione rimossa con successo'
    );
  };

  const handleBlock = () => {
    const reason = prompt('Motivo blocco:', '');
    if (!reason) return;

    handleAction(
      () =>
        blockLocation({
          locationId: location.id,
          reason,
          blockedBy: 'CURRENT_USER', // TODO: Get from auth
        }).unwrap(),
      'Ubicazione bloccata con successo'
    );
  };

  const handleUnblock = () => {
    const reason = prompt('Motivo sblocco:', 'Operazione completata');
    if (!reason) return;

    handleAction(
      () =>
        unblockLocation({
          locationId: location.id,
          reason,
        }).unwrap(),
      'Ubicazione sbloccata con successo'
    );
  };

  const handleInventory = () => {
    const confirm = window.confirm(
      `Avviare controllo inventario per ubicazione ${location.code}?`
    );
    if (!confirm) return;

    handleAction(
      () =>
        triggerInventory({
          locationId: location.id,
          userId: 'CURRENT_USER', // TODO: Get from auth
          notes: 'Controllo inventario manuale',
        }).unwrap(),
      'Controllo inventario avviato'
    );
  };

  const size = compact ? 'sm' : 'md';

  return (
    <div className="space-y-2">
      {actionResult && (
        <Alert variant={actionResult.type === 'success' ? 'success' : 'danger'}>
          {actionResult.message}
        </Alert>
      )}

      <div className={`flex ${compact ? 'flex-col' : 'flex-wrap'} gap-2`}>
        {/* Reserve/Unreserve */}
        {location.status === 'AVAILABLE' && (
          <Button
            variant="secondary"
            size={size}
            onClick={handleReserve}
            loading={isReserving}
            className={compact ? 'w-full' : ''}
          >
            🔒 Riserva
          </Button>
        )}

        {location.status === 'RESERVED' && (
          <Button
            variant="secondary"
            size={size}
            onClick={handleUnreserve}
            loading={isUnreserving}
            className={compact ? 'w-full' : ''}
          >
            🔓 Libera
          </Button>
        )}

        {/* Block/Unblock */}
        {location.status !== 'BLOCKED' && (
          <Button
            variant="danger"
            size={size}
            onClick={handleBlock}
            loading={isBlocking}
            className={compact ? 'w-full' : ''}
          >
            ⛔ Blocca
          </Button>
        )}

        {location.status === 'BLOCKED' && (
          <Button
            variant="success"
            size={size}
            onClick={handleUnblock}
            loading={isUnblocking}
            className={compact ? 'w-full' : ''}
          >
            ✓ Sblocca
          </Button>
        )}

        {/* Inventory */}
        <Button
          variant="primary"
          size={size}
          onClick={handleInventory}
          loading={isTriggeringInventory}
          className={compact ? 'w-full' : ''}
        >
          📋 Inventario
        </Button>

        {/* Navigate Actions */}
        {showNavigate && (
          <>
            <Button
              variant="ghost"
              size={size}
              onClick={() => navigate(`/locations/${location.code}`)}
              className={compact ? 'w-full' : ''}
            >
              📄 Dettagli
            </Button>
            <Button
              variant="ghost"
              size={size}
              onClick={() => navigate(`/locations/debug/${location.code}`)}
              className={compact ? 'w-full' : ''}
            >
              🔧 Debug
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationQuickActions;

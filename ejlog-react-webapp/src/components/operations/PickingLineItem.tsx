// ============================================================================
// EJLOG WMS - Picking Line Item Component
// Componente per visualizzare una singola riga di picking
// ============================================================================

import React from 'react';
import { CheckCircle, Circle, AlertTriangle, Package, MapPin, Calendar } from 'lucide-react';
import Badge from '../shared/Badge';
import type { PickingOperation } from '../../types/operations';

interface PickingLineItemProps {
  operation: PickingOperation;
  isActive?: boolean;
  onClick?: () => void;
  showDetails?: boolean;
}

const PickingLineItem: React.FC<PickingLineItemProps> = ({
  operation,
  isActive = false,
  onClick,
  showDetails = false,
}) => {
  const getStatusColor = () => {
    if (operation.isCompleted) return 'text-green-600';
    if (operation.canBeExecuted) return 'text-blue-600';
    return 'text-gray-400';
  };

  const getStatusIcon = () => {
    if (operation.isCompleted) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (operation.canBeExecuted) return <Circle className="w-5 h-5 text-blue-600" />;
    return <AlertTriangle className="w-5 h-5 text-gray-400" />;
  };

  const getProgressPercentage = () => {
    if (operation.requestedQuantity === 0) return 0;
    return (operation.processedQuantity / operation.requestedQuantity) * 100;
  };

  return (
    <div
      onClick={onClick}
      className={`
        border rounded-lg p-4 transition-all cursor-pointer
        ${isActive ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}
        ${!operation.canBeExecuted && !operation.isCompleted ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        {/* Status Icon */}
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h4 className={`font-semibold ${getStatusColor()}`}>
              {operation.itemCode}
            </h4>
            <p className="text-sm text-gray-600">{operation.itemDescription}</p>
          </div>
        </div>

        {/* Status Badge */}
        <Badge variant={operation.isCompleted ? 'success' : operation.canBeExecuted ? 'info' : 'warning'}>
          {operation.isCompleted ? 'Completata' : operation.canBeExecuted ? 'Da eseguire' : 'In attesa'}
        </Badge>
      </div>

      {/* Quantity Info */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <label className="text-xs text-gray-500">Richiesta</label>
          <p className="text-lg font-bold text-blue-600">
            {operation.requestedQuantity} <span className="text-sm font-normal">{operation.itemUm}</span>
          </p>
        </div>
        <div>
          <label className="text-xs text-gray-500">Processata</label>
          <p className="text-lg font-semibold">
            {operation.processedQuantity} <span className="text-sm font-normal">{operation.itemUm}</span>
          </p>
        </div>
        <div>
          <label className="text-xs text-gray-500">Disponibile</label>
          <p className="text-lg font-semibold">
            {operation.availableQuantity} <span className="text-sm font-normal">{operation.itemUm}</span>
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              operation.isCompleted ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Location Info */}
      <div className="flex items-center gap-4 text-sm mb-2">
        <div className="flex items-center gap-1 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="font-mono">{operation.locationCode}</span>
        </div>
        {operation.udcBarcode && (
          <div className="flex items-center gap-1 text-gray-600">
            <Package className="w-4 h-4" />
            <span className="font-mono">{operation.udcBarcode}</span>
          </div>
        )}
      </div>

      {/* Lot/Serial/Expiry Info */}
      {showDetails && (operation.lot || operation.serialNumber || operation.expiryDate) && (
        <div className="border-t pt-3 mt-3 grid grid-cols-3 gap-2 text-sm">
          {operation.lot && (
            <div>
              <label className="text-xs text-gray-500">Lotto</label>
              <p className="font-semibold">{operation.lot}</p>
            </div>
          )}
          {operation.serialNumber && (
            <div>
              <label className="text-xs text-gray-500">Matricola</label>
              <p className="font-semibold">{operation.serialNumber}</p>
            </div>
          )}
          {operation.expiryDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <label className="text-xs text-gray-500">Scadenza</label>
                <p className="font-semibold">
                  {new Date(operation.expiryDate).toLocaleDateString('it-IT')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Required Fields Badges */}
      {showDetails && (operation.requiresLot || operation.requiresSerialNumber || operation.requiresExpiryDate) && (
        <div className="flex gap-2 mt-3">
          {operation.requiresLot && (
            <Badge variant="warning" size="sm">
              Lotto richiesto
            </Badge>
          )}
          {operation.requiresSerialNumber && (
            <Badge variant="warning" size="sm">
              Matricola richiesta
            </Badge>
          )}
          {operation.requiresExpiryDate && (
            <Badge variant="warning" size="sm">
              Scadenza richiesta
            </Badge>
          )}
        </div>
      )}

      {/* Completed Info */}
      {operation.isCompleted && operation.completedAt && (
        <div className="border-t pt-2 mt-3 text-xs text-gray-500">
          Completata il {new Date(operation.completedAt).toLocaleString('it-IT')}
          {operation.completedBy && ` da ${operation.completedBy}`}
        </div>
      )}
    </div>
  );
};

export default PickingLineItem;

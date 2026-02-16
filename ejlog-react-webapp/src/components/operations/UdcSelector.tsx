// =======================================================================
// EJLOG WMS - UDC Selector Component
// Component for selecting UDC and compartment for refilling operations
// =======================================================================

import React, { useState, useEffect } from 'react';
import type { UdcOption, CompartmentOption } from '../../types/operations';
import { Package, Inbox, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface UdcSelectorProps {
  availableUdcs: UdcOption[];
  selectedUdc: UdcOption | null;
  selectedCompartment: CompartmentOption | null;
  itemCode: string;
  lot?: string;
  onSelectUdc: (udc: UdcOption) => void;
  onSelectCompartment: (compartment: CompartmentOption) => void;
  canMerge?: boolean;
  mergeReason?: string;
  isLoading?: boolean;
}

export const UdcSelector: React.FC<UdcSelectorProps> = ({
  availableUdcs,
  selectedUdc,
  selectedCompartment,
  itemCode,
  lot,
  onSelectUdc,
  onSelectCompartment,
  canMerge = false,
  mergeReason,
  isLoading = false,
}) => {
  const [expandedUdc, setExpandedUdc] = useState<number | null>(null);

  useEffect(() => {
    if (selectedUdc) {
      setExpandedUdc(selectedUdc.id);
    }
  }, [selectedUdc]);

  const getCompartmentStatusColor = (compartment: CompartmentOption): string => {
    if (!compartment.productCode) return 'bg-green-100 border-green-300';
    if (compartment.productCode === itemCode) {
      if (!lot || !compartment.lot || compartment.lot === lot) {
        return 'bg-blue-100 border-blue-300';
      }
      return 'bg-yellow-100 border-yellow-300';
    }
    return 'bg-red-100 border-red-300';
  };

  const getCompartmentStatusIcon = (compartment: CompartmentOption) => {
    if (!compartment.productCode) return <Inbox className="w-5 h-5 text-green-600" />;
    if (compartment.productCode === itemCode) {
      if (!lot || !compartment.lot || compartment.lot === lot) {
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      }
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const isCompartmentSelectable = (compartment: CompartmentOption): boolean => {
    if (!compartment.productCode) return true;
    if (compartment.productCode !== itemCode) return false;
    if (lot && compartment.lot && compartment.lot !== lot) return false;
    if (compartment.maxQuantity && compartment.currentQuantity >= compartment.maxQuantity)
      return false;
    return true;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (availableUdcs.length === 0) {
    return (
      <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">Nessuna UDC disponibile</p>
        <p className="text-sm text-gray-600 mt-1">
          Non ci sono UDC disponibili per questa operazione di refilling
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">
          Seleziona UDC e Scomparto di Destinazione
        </h3>
      </div>

      {canMerge && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Merge consentito</p>
              <p className="text-sm text-blue-700 mt-1">
                Puoi unire la merce con il prodotto esistente nello scomparto selezionato
              </p>
            </div>
          </div>
        </div>
      )}

      {!canMerge && mergeReason && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Merge non consentito</p>
              <p className="text-sm text-yellow-700 mt-1">{mergeReason}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {availableUdcs.map((udc) => (
          <div key={udc.id} className="border border-gray-300 rounded-lg overflow-hidden">
            {/* UDC Header */}
            <div
              className={`p-4 cursor-pointer transition-colors ${
                selectedUdc?.id === udc.id
                  ? 'bg-blue-50 border-b-2 border-blue-600'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => {
                onSelectUdc(udc);
                setExpandedUdc(expandedUdc === udc.id ? null : udc.id);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{udc.barcode}</p>
                    {udc.location && (
                      <p className="text-sm text-gray-600">Ubicazione: {udc.location}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(udc.fillPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round(udc.fillPercentage)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {udc.compartments.length} scomparti
                  </p>
                </div>
              </div>
            </div>

            {/* Compartments List */}
            {expandedUdc === udc.id && (
              <div className="bg-white p-4 space-y-2">
                {udc.compartments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nessuno scomparto disponibile</p>
                ) : (
                  udc.compartments.map((compartment) => {
                    const selectable = isCompartmentSelectable(compartment);
                    const isSelected = selectedCompartment?.id === compartment.id;

                    return (
                      <div
                        key={compartment.id}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : selectable
                            ? `${getCompartmentStatusColor(compartment)} cursor-pointer hover:shadow-md`
                            : 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (selectable) {
                            onSelectCompartment(compartment);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getCompartmentStatusIcon(compartment)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  Scomparto {compartment.position}
                                </span>
                                {compartment.barcode && (
                                  <span className="text-xs text-gray-500 font-mono">
                                    {compartment.barcode}
                                  </span>
                                )}
                              </div>
                              {compartment.productCode && (
                                <div className="text-sm mt-1">
                                  <p className="text-gray-700">Prodotto: {compartment.productCode}</p>
                                  {compartment.lot && (
                                    <p className="text-gray-600">Lotto: {compartment.lot}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {compartment.currentQuantity}
                              {compartment.maxQuantity && ` / ${compartment.maxQuantity}`}
                            </p>
                            {compartment.maxQuantity && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-green-600 h-1.5 rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(compartment.fillPercentage, 100)}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600">
                                  {Math.round(compartment.fillPercentage)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedUdc && selectedCompartment && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Selezione confermata</p>
              <p className="text-sm text-green-700 mt-1">
                UDC: {selectedUdc.barcode} - Scomparto {selectedCompartment.position}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UdcSelector;

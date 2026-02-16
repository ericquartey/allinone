// ============================================================================
// EJLOG WMS - Location Search Modal Component
// Global location search with keyboard shortcuts and quick navigation
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Spinner from '../shared/Spinner';
import { useGetLocationsQuery } from '../../services/api/locationApi';
import { Location, LocationTypeLabels, LocationStatusLabels } from '../../types/location';

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LocationSearchModal: React.FC<LocationSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // API query with debounce
  const {
    data: locationsData,
    isLoading,
  } = useGetLocationsQuery(
    {
      search: searchTerm,
      pageSize: 10,
    },
    {
      skip: !isOpen || searchTerm.length < 2,
    }
  );

  const locations = locationsData?.locations || [];

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [locations]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, locations.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (locations[selectedIndex]) {
            handleSelectLocation(locations[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, locations, selectedIndex]);

  const handleSelectLocation = (location: Location) => {
    navigate(`/locations/${location.code}`);
    onClose();
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      AVAILABLE: 'bg-green-100 text-green-800',
      OCCUPIED: 'bg-blue-100 text-blue-800',
      RESERVED: 'bg-yellow-100 text-yellow-800',
      BLOCKED: 'bg-red-100 text-red-800',
      MAINTENANCE: 'bg-orange-100 text-orange-800',
      DAMAGED: 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[600px] flex flex-col">
        {/* Header with Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca ubicazione per codice, barcode, o descrizione..."
                className="w-full pr-10"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Spinner size="sm" />
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕ ESC
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {searchTerm.length < 2 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-lg font-medium">Cerca Ubicazione</p>
              <p className="text-sm mt-2">
                Inserisci almeno 2 caratteri per iniziare la ricerca
              </p>
              <div className="mt-6 space-y-2 text-xs text-gray-400">
                <p>Puoi cercare per:</p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <span className="px-2 py-1 bg-gray-100 rounded">Codice (A01-02-03)</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">Barcode</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">Magazzino</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">Zona</span>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <Spinner size="lg" />
              <p className="text-sm text-gray-500 mt-3">Ricerca in corso...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">😕</div>
              <p className="text-lg font-medium">Nessun risultato</p>
              <p className="text-sm mt-2">
                Nessuna ubicazione trovata per "{searchTerm}"
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location, index) => (
                <div
                  key={location.id}
                  className={`
                    p-4 rounded-lg cursor-pointer transition-all
                    ${
                      index === selectedIndex
                        ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleSelectLocation(location)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Location Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {location.code}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                            location.status
                          )}`}
                        >
                          {LocationStatusLabels[location.status]}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          {LocationTypeLabels[location.type]}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          📍 {location.warehouseName} → {location.zoneName}
                        </p>
                        <p className="font-mono text-xs">{location.barcode}</p>
                        {location.isOccupied && location.occupancy && (
                          <p className="text-blue-600">
                            📦 {location.occupancy.udcBarcode} ({location.occupancy.itemCode})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Utilization */}
                    <div className="text-right min-w-[80px]">
                      <p className="text-xs text-gray-500 mb-1">Utilizzo</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {location.capacity.utilizationPercent.toFixed(0)}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${location.capacity.utilizationPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {locations.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-xs text-gray-500">
              Trovati {locationsData?.total || 0} risultati
              {locationsData?.total && locationsData.total > 10 && (
                <span className="ml-2">
                  • Mostrando i primi 10 •{' '}
                  <button
                    onClick={() => {
                      navigate(`/locations?search=${searchTerm}`);
                      onClose();
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Vedi tutti
                  </button>
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSearchModal;

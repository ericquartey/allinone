// Versione pubblica della pagina gestione cassetti con AUTO-LOGIN integrato

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  CubeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  PlusIcon,
  Squares2X2Icon,
  CubeTransparentIcon
} from '@heroicons/react/24/outline';
import { useDrawers, useCompartments } from '../hooks/useDrawers';
import { CompartmentView2D } from '../components/drawers/CompartmentView2D';
import { CompartmentView3D } from '../components/drawers/CompartmentView3D';
import axios from 'axios';

/**
 * Genera la password del giorno per superuser
 * Formato: promag + (31 - giorno del mese)
 */
const getDailyPassword = () => {
  const today = new Date();
  const day = today.getDate();
  const passwordNumber = (31 - day).toString().padStart(2, '0');
  return `promag${passwordNumber}`;
};

/**
 * Drawer Management Page - Public Version with Auto-Login
 */
export default function DrawerManagementPublic() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrawer, setSelectedDrawer] = useState(null);
  const [selectedCompartment, setSelectedCompartment] = useState(null);
  const [visualizationMode, setVisualizationMode] = useState('2d');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Auto-login al caricamento
  useEffect(() => {
    const performAutoLogin = async () => {
      try {
        const password = getDailyPassword();
        console.log(`[AUTO-LOGIN] Attempting with superuser / ${password}`);

        // MOCK LOGIN per development
        const isDevelopment = import.meta.env.DEV;

        if (isDevelopment) {
          console.log('[AUTO-LOGIN] Using mock token for development');
          const mockToken = 'dev-mock-token-' + Date.now();

          localStorage.setItem('token', mockToken);
          localStorage.setItem('auth_token', mockToken);
          localStorage.setItem('ejlog_auth_token', mockToken);

          setAuthReady(true);
        } else {
          // Production: login reale con nuovo endpoint
          const response = await axios.post('/api/auth/login', {
            username: 'superuser',
            password
          });

          if (response.data && response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('auth_token', response.data.token);
            localStorage.setItem('ejlog_auth_token', response.data.token);
            setAuthReady(true);
          }
        }
      } catch (err) {
        console.error('[AUTO-LOGIN] Failed:', err);
        setAuthReady(true); // Continua comunque
      }
    };

    performAutoLogin();
  }, []);

  // Memoize filters
  const drawerFilters = useMemo(() => ({
    search: searchTerm || undefined
  }), [searchTerm]);

  // Fetch drawers
  const { drawers, loading: drawersLoading, error: drawersError } = useDrawers(drawerFilters);

  // Fetch compartments
  const {
    compartments,
    loading: compartmentsLoading,
  } = useCompartments(selectedDrawer?.id);

  const handleDrawerSelect = (drawer) => {
    setSelectedDrawer(drawer);
    setSelectedCompartment(null);
  };

  const handleCompartmentSelect = (compartment) => {
    setSelectedCompartment(compartment);
  };

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  if (!authReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Autenticazione in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Cassetti</h1>
            <p className="text-sm text-gray-500 mt-1">
              Visualizza e gestisci cassetti e scomparti
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <PlusIcon className="h-5 w-5" />
              Nuovo Cassetto
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Drawer List */}
        <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        }`}>
          <div className="p-4 border-b border-gray-200">
            {!sidebarCollapsed && (
              <>
                <h2 className="font-semibold text-gray-900 mb-3">Ricerca Cassetti</h2>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Cerca cassetto..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="mt-3 w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="flex-1 overflow-y-auto">
                {drawersLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : drawersError ? (
                  <div className="p-4 text-sm text-red-600">{drawersError}</div>
                ) : !drawers || drawers.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    Nessun cassetto trovato
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {drawers.map((drawer) => (
                      <button
                        key={drawer.id}
                        onClick={() => handleDrawerSelect(drawer)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          selectedDrawer?.id === drawer.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <CubeIcon className={`h-5 w-5 mt-0.5 ${
                            selectedDrawer?.id === drawer.id ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {drawer.code}
                            </div>
                            {drawer.locationCode && (
                              <div className="text-xs text-gray-500 truncate">
                                📍 {drawer.locationCode}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                              <span>{drawer.compartmentCount || 0} scomparti</span>
                              {drawer.emptyCompartmentCount !== undefined && (
                                <span>• {drawer.emptyCompartmentCount} vuoti</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 p-4 space-y-2">
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Operazioni
                </div>

                <button
                  disabled={!selectedDrawer}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Modifica UDC
                </button>

                <button
                  disabled={!selectedDrawer}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowsPointingOutIcon className="h-4 w-4" />
                  Estrai UDC
                </button>

                <button
                  disabled={!selectedCompartment}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-4 w-4" />
                  Associazione Statica
                </button>

                <button
                  disabled={!selectedCompartment}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="h-4 w-4" />
                  Elimina Associazione
                </button>
              </div>
            </>
          )}
        </div>

        {/* Center Panel - Visualization */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVisualizationMode('2d')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  visualizationMode === '2d'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Squares2X2Icon className="h-5 w-5" />
                Vista 2D
              </button>

              <button
                onClick={() => setVisualizationMode('3d')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  visualizationMode === '3d'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <CubeTransparentIcon className="h-5 w-5" />
                Vista 3D
              </button>
            </div>

            {selectedDrawer && (
              <div className="text-sm text-gray-600">
                {compartmentsLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Caricamento scomparti...
                  </span>
                ) : (
                  <span>{compartments?.length || 0} scomparti caricati</span>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {visualizationMode === '2d' ? (
              <CompartmentView2D
                loadingUnit={selectedDrawer}
                compartments={compartments}
                onCompartmentSelect={handleCompartmentSelect}
              />
            ) : (
              <CompartmentView3D
                loadingUnit={selectedDrawer}
                compartments={compartments}
                onCompartmentSelect={handleCompartmentSelect}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar - Compartment Details */}
        {selectedCompartment && (
          <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dettagli Scomparto
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">ID</label>
                <div className="mt-1 text-sm font-mono text-gray-900">{selectedCompartment.id}</div>
              </div>

              {selectedCompartment.barcode && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Barcode</label>
                  <div className="mt-1 text-sm font-mono text-gray-900">{selectedCompartment.barcode}</div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Posizione</label>
                <div className="mt-1 text-sm text-gray-900">
                  X: {selectedCompartment.xPosition} mm, Y: {selectedCompartment.yPosition} mm
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Dimensioni</label>
                <div className="mt-1 text-sm text-gray-900">
                  {selectedCompartment.width} x {selectedCompartment.depth} mm
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Riempimento</label>
                <div className="mt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${selectedCompartment.fillPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedCompartment.fillPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {selectedCompartment.products && selectedCompartment.products.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                    Prodotti ({selectedCompartment.products.length})
                  </label>
                  <div className="space-y-2">
                    {selectedCompartment.products.map((product, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {product.articleCode || `Art. ${product.articleId}`}
                        </div>
                        {product.articleDescription && (
                          <div className="text-xs text-gray-600 mt-1">
                            {product.articleDescription}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Qtà: {product.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 space-y-2">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Modifica Riempimento
                </button>
                <button className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Visualizza Prodotti
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

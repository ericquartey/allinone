// src/pages/DrawerManagement.jsx

import React, { useState, useCallback, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  CubeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  PlusIcon,
  EyeIcon,
  Squares2X2Icon,
  CubeTransparentIcon
} from '@heroicons/react/24/outline';
import { useDrawers, useCompartments } from '../hooks/useDrawers';
import { CompartmentView2D } from '../components/drawers/CompartmentView2D';
import { CompartmentView3D } from '../components/drawers/CompartmentView3D';
import { EditLoadingUnitModal } from '../components/drawers/EditLoadingUnitModal';
import { CompartmentEditor } from '../components/drawers/CompartmentEditor';
import { drawersApi } from '../services/drawersApi';

/**
 * Drawer Management Page
 * Replicates Swing UI: RicercaCassettoPanel with UdcScompartazione
 * Features:
 * - Left sidebar with drawer list and tools (TaskPane)
 * - Center panel with 2D/3D compartment visualization
 * - Right panel with compartment details
 */
export default function DrawerManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrawer, setSelectedDrawer] = useState(null);
  const [selectedCompartment, setSelectedCompartment] = useState(null);
  const [visualizationMode, setVisualizationMode] = useState('2d'); // '2d' or '3d'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditingCompartments, setIsEditingCompartments] = useState(false);
  const [showAllProductsModal, setShowAllProductsModal] = useState(false);
  const [showVolumeModal, setShowVolumeModal] = useState(false);

  // Volume calculation functions
  const calculateVolume = useCallback((width, depth, height) => {
    if (!width || !depth || !height) return 0;
    // Convert cm to m and calculate volume in m³
    return (width * depth * height) / 1000000;
  }, []);

  const formatVolume = useCallback((volumeM3) => {
    if (volumeM3 === 0) return '0 m³';
    if (volumeM3 < 0.001) {
      // Show in cm³ for very small volumes
      return `${(volumeM3 * 1000000).toFixed(0)} cm³`;
    }
    return `${volumeM3.toFixed(3)} m³`;
  }, []);

  // Calculate drawer volume
  const drawerVolume = useMemo(() => {
    if (!selectedDrawer) return 0;
    return calculateVolume(selectedDrawer.width, selectedDrawer.depth, selectedDrawer.height);
  }, [selectedDrawer, calculateVolume]);

  // Memoize filters to prevent infinite loops
  const drawerFilters = useMemo(() => ({
    search: searchTerm || undefined
  }), [searchTerm]);

  // Fetch drawers with search filter
  const { drawers, loading: drawersLoading, error: drawersError, fetchDrawers } = useDrawers(drawerFilters);

  // Fetch compartments for selected drawer
  const {
    compartments,
    loading: compartmentsLoading,
    updateFillPercentage,
    boxToCompartment,
    fetchCompartments
  } = useCompartments(selectedDrawer?.id);

  // Calculate total compartments volume (MUST be after compartments is defined)
  const compartmentsVolume = useMemo(() => {
    if (!compartments || compartments.length === 0) return 0;
    return compartments.reduce((sum, comp) => {
      return sum + calculateVolume(comp.width, comp.depth, comp.height);
    }, 0);
  }, [compartments, calculateVolume]);

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

  const handleEditDrawer = useCallback(() => {
    if (selectedDrawer) {
      setIsEditModalOpen(true);
    }
  }, [selectedDrawer]);

  const handleSaveDrawer = useCallback(async (id, updateRequest) => {
    await drawersApi.updateLoadingUnit(id, updateRequest);
    // Refresh drawer list after successful update
    await fetchDrawers();
    // If we're editing the currently selected drawer, update the selection
    if (selectedDrawer && selectedDrawer.id === id) {
      const updatedDrawer = await drawersApi.getLoadingUnitById(id);
      setSelectedDrawer(updatedDrawer);
    }
  }, [fetchDrawers, selectedDrawer]);

  const handleEditCompartments = useCallback(() => {
    if (selectedDrawer) {
      setIsEditingCompartments(true);
    }
  }, [selectedDrawer]);

  // Raccoglie tutti i prodotti da tutti gli scomparti dell'UDC
  const allProducts = useMemo(() => {
    if (!compartments || compartments.length === 0) return [];

    const products = [];
    compartments.forEach((compartment, compartmentIndex) => {
      if (compartment.products && compartment.products.length > 0) {
        compartment.products.forEach(product => {
          products.push({
            ...product,
            compartmentId: compartment.id,
            compartmentBarcode: compartment.barcode,
            compartmentPosition: `${compartment.row || '?'}-${compartment.column || '?'}`,
            compartmentIndex: compartmentIndex + 1
          });
        });
      }
    });

    return products;
  }, [compartments]);

  const handleShowAllProducts = useCallback(() => {
    setShowAllProductsModal(true);
  }, []);

  const handleSaveCompartments = useCallback(async (newCompartments) => {
    if (!selectedDrawer || newCompartments.length === 0) {
      setIsEditingCompartments(false);
      return;
    }

    try {
      console.log(`Saving ${newCompartments.length} new compartments for drawer ${selectedDrawer.id}...`);

      // Create all compartments sequentially
      const createdCompartments = [];
      for (const compartment of newCompartments) {
        const created = await drawersApi.createCompartment(selectedDrawer.id, {
          xPosition: Math.round(compartment.xPosition),
          yPosition: Math.round(compartment.yPosition),
          width: Math.round(compartment.width),
          depth: Math.round(compartment.depth)
        });
        createdCompartments.push(created);
      }

      console.log(`Successfully created ${createdCompartments.length} compartments`);

      // Refresh the compartments list
      await fetchCompartments();

      // Show success message
      alert(`Suddivisione completata con successo!\n${createdCompartments.length} ${createdCompartments.length === 1 ? 'scomparto creato' : 'scomparti creati'}.`);

      setIsEditingCompartments(false);
    } catch (error) {
      console.error('Error creating compartments:', error);
      alert(`Errore durante la creazione degli scomparti:\n${error.message || 'Errore sconosciuto'}`);
    }
  }, [selectedDrawer, fetchCompartments]);

  const handleCancelCompartmentEdit = useCallback(() => {
    setIsEditingCompartments(false);
  }, []);

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
        {/* Left Sidebar - Drawer List & Tools (TaskPane) */}
        <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            {!sidebarCollapsed && (
              <>
                <h2 className="font-semibold text-gray-900 mb-3">Ricerca Cassetti</h2>

                {/* Search */}
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
              {/* Drawer List */}
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

              {/* Tools Panel (TaskPane) */}
              <div className="border-t border-gray-200 p-4 space-y-2">
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Operazioni
                </div>

                <button
                  onClick={handleEditDrawer}
                  disabled={!selectedDrawer}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Modifica UDC
                </button>

                <button
                  onClick={handleEditCompartments}
                  disabled={!selectedDrawer}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Squares2X2Icon className="h-4 w-4" />
                  Suddividi Cassetto
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

                <div className="border-t border-gray-200 pt-2 mt-2">
                  <button
                    onClick={() => setShowVolumeModal(true)}
                    disabled={!selectedDrawer}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CubeTransparentIcon className="h-4 w-4" />
                    Calcolo Volumetrico
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Center Panel - Visualization */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Visualization Mode Toggle */}
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

          {/* Visualization Component */}
          <div className="flex-1 overflow-hidden">
            {isEditingCompartments ? (
              <CompartmentEditor
                loadingUnit={selectedDrawer}
                compartments={compartments}
                onSave={handleSaveCompartments}
                onCancel={handleCancelCompartmentEdit}
              />
            ) : (
              <>
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
              </>
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
              {/* ID & Barcode */}
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

              {/* Position */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Posizione</label>
                <div className="mt-1 text-sm text-gray-900">
                  X: {selectedCompartment.xPosition} mm, Y: {selectedCompartment.yPosition} mm
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Dimensioni</label>
                <div className="mt-1 text-sm text-gray-900">
                  {selectedCompartment.width} x {selectedCompartment.depth} mm
                </div>
              </div>

              {/* Fill Percentage */}
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

              {/* Products */}
              {selectedCompartment.products && selectedCompartment.products.length > 0 ? (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                    Prodotti ({selectedCompartment.products.length})
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedCompartment.products.map((product, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {product.item?.code || 'N/D'}
                            </div>
                            {product.item?.description && (
                              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {product.item.description}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Qtà: {product.stockedQuantity || 0}
                            </span>
                          </div>
                        </div>

                        {/* Additional product info */}
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          {product.lot && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Lotto:</span>
                              <span className="font-mono text-gray-900">{product.lot}</span>
                            </div>
                          )}
                          {product.serialNumber && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">S/N:</span>
                              <span className="font-mono text-gray-900">{product.serialNumber}</span>
                            </div>
                          )}
                          {product.sscc && (
                            <div className="flex items-center gap-1 col-span-2">
                              <span className="text-gray-500">SSCC:</span>
                              <span className="font-mono text-gray-900">{product.sscc}</span>
                            </div>
                          )}
                          {product.expirationDate && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Scad:</span>
                              <span className="text-gray-900">{new Date(product.expirationDate).toLocaleDateString('it-IT')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                    Prodotti
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <CubeTransparentIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Scomparto vuoto</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Modifica Riempimento
                </button>
                <button
                  onClick={handleShowAllProducts}
                  disabled={!selectedDrawer || allProducts.length === 0}
                  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <EyeIcon className="h-5 w-5" />
                  Visualizza Tutti i Prodotti ({allProducts.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Loading Unit Modal */}
      <EditLoadingUnitModal
        loadingUnit={selectedDrawer}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveDrawer}
      />

      {/* All Products Modal */}
      {showAllProductsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowAllProductsModal(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Tutti i Prodotti nell'UDC
                    </h2>
                    {selectedDrawer && (
                      <p className="text-sm text-gray-600 mt-1">
                        UDC: <span className="font-mono font-semibold">{selectedDrawer.barcode || selectedDrawer.id}</span>
                        {' • '}
                        {allProducts.length} prodott{allProducts.length === 1 ? 'o' : 'i'} in {compartments?.length || 0} scompart{compartments?.length === 1 ? 'o' : 'i'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAllProductsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Products List */}
              <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                {allProducts.length > 0 ? (
                  <div className="space-y-3">
                    {allProducts.map((product, index) => (
                      <div
                        key={`${product.compartmentId}-${product.id || index}`}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          {/* Product Icon */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <CubeIcon className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {product.item?.code || 'N/D'}
                                </div>
                                {product.item?.description && (
                                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {product.item.description}
                                  </div>
                                )}
                              </div>

                              {/* Quantity Badge */}
                              <div className="flex-shrink-0">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                  Qtà: {product.stockedQuantity || 0}
                                </span>
                              </div>
                            </div>

                            {/* Compartment Info */}
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                              <Squares2X2Icon className="w-4 h-4" />
                              <span>
                                Scomparto #{product.compartmentIndex}
                                {product.compartmentBarcode && (
                                  <span className="font-mono ml-1">({product.compartmentBarcode})</span>
                                )}
                                {product.compartmentPosition && product.compartmentPosition !== '?-?' && (
                                  <span className="ml-1">• Pos: {product.compartmentPosition}</span>
                                )}
                              </span>
                            </div>

                            {/* Additional Product Details */}
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              {product.lot && (
                                <div className="flex flex-col">
                                  <span className="text-gray-500">Lotto</span>
                                  <span className="font-mono text-gray-900 font-medium">{product.lot}</span>
                                </div>
                              )}
                              {product.serialNumber && (
                                <div className="flex flex-col">
                                  <span className="text-gray-500">Serial Number</span>
                                  <span className="font-mono text-gray-900 font-medium">{product.serialNumber}</span>
                                </div>
                              )}
                              {product.sscc && (
                                <div className="flex flex-col col-span-2">
                                  <span className="text-gray-500">SSCC</span>
                                  <span className="font-mono text-gray-900 font-medium">{product.sscc}</span>
                                </div>
                              )}
                              {product.expirationDate && (
                                <div className="flex flex-col">
                                  <span className="text-gray-500">Scadenza</span>
                                  <span className="text-gray-900 font-medium">
                                    {new Date(product.expirationDate).toLocaleDateString('it-IT')}
                                  </span>
                                </div>
                              )}
                              {product.weight && (
                                <div className="flex flex-col">
                                  <span className="text-gray-500">Peso</span>
                                  <span className="text-gray-900 font-medium">{product.weight} kg</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CubeTransparentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nessun prodotto presente nell'UDC</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setShowAllProductsModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Volume Modal */}
      {showVolumeModal && selectedDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CubeTransparentIcon className="h-8 w-8" />
                  <div>
                    <h2 className="text-xl font-bold">Calcolo Volumetrico</h2>
                    <p className="text-sm text-purple-100">
                      {selectedDrawer.code} - Analisi dettagliata volumi
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVolumeModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <CubeIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Volume Cassetto</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatVolume(drawerVolume)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedDrawer.width} × {selectedDrawer.depth} × {selectedDrawer.height} cm
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Squares2X2Icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Volume Scomparti</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatVolume(compartmentsVolume)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {compartments?.length || 0} scomparti
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="h-8 w-8 mx-auto mb-2 text-2xl">📊</div>
                  <p className="text-sm text-gray-600">Utilizzo</p>
                  <p className="text-2xl font-bold text-green-600">
                    {drawerVolume > 0
                      ? `${((compartmentsVolume / drawerVolume) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Efficienza suddivisione
                  </p>
                </div>
              </div>

              {/* Compartments Table */}
              {compartments && compartments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Squares2X2Icon className="h-5 w-5 text-purple-600" />
                    Dettaglio Scomparti
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Scomparto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Posizione
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Dimensioni (cm)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Volume
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Riempimento
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {compartments
                          .sort((a, b) => {
                            const volA = calculateVolume(a.width, a.depth, a.height);
                            const volB = calculateVolume(b.width, b.depth, b.height);
                            return volB - volA;
                          })
                          .map((comp, index) => {
                            const volume = calculateVolume(comp.width, comp.depth, comp.height);
                            return (
                              <tr key={comp.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      #{index + 1}
                                    </span>
                                    {comp.barcode && (
                                      <span className="text-xs font-mono text-gray-500">
                                        {comp.barcode}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {comp.row !== undefined && comp.column !== undefined
                                    ? `${comp.row}-${comp.column}`
                                    : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {comp.width} × {comp.depth} × {comp.height || '?'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="font-semibold text-purple-600">
                                    {formatVolume(volume)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                      <div
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(comp.fillPercentage || 0, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-600 min-w-[40px] text-right">
                                      {(comp.fillPercentage || 0).toFixed(0)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Informazioni sul Calcolo
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs text-blue-800">
                  <div>
                    <strong>Formula:</strong> Larghezza × Profondità × Altezza
                  </div>
                  <div>
                    <strong>Unità:</strong> 1 m³ = 1,000,000 cm³
                  </div>
                  <div>
                    <strong>Volume Cassetto:</strong> Volume teorico completo dell'UDC
                  </div>
                  <div>
                    <strong>Volume Scomparti:</strong> Somma dei volumi di tutti gli scomparti
                  </div>
                  <div className="col-span-2">
                    <strong>Utilizzo:</strong> Percentuale di volume cassetto occupato dagli scomparti.
                    Un valore inferiore al 100% indica spazio non suddiviso.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                onClick={() => setShowVolumeModal(false)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

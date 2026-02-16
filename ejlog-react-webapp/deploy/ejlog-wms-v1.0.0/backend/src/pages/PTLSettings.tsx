/**
 * PTL Settings Page - Complete Configuration UI
 * Feature C - Sistema PTL Configuration Management
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RotateCcw, Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';

interface PTLConfig {
  enabled: boolean;
  systemType: number;
  warehouseId: number | null;
  locations: {
    pre: number | null;
    post: number | null;
  };
  container: {
    types: number[];
    recycleEnabled: boolean;
    autoEmpty: boolean;
  };
  workflow: {
    pickReasons: number[];
    boxOpeningRequired: boolean;
    sumQuantities: boolean;
  };
  barcode: {
    locationPrefix: string;
    discharge: string;
    commands: {
      openBox: string;
      saturate: string;
    };
  };
  reports: {
    containerLabel: boolean;
    packingList: boolean;
  };
  hardware: {
    defaultColor: string;
    defaultBlinkMode: string;
    timeout: number;
    retries: number;
  };
  maintenance: {
    cleanupInterval: number;
    udcRetentionDays: number;
  };
  messages: {
    openBox: string;
    closeBox: string;
  };
}

export const PTLSettings: React.FC = () => {
  const [config, setConfig] = useState<PTLConfig | null>(null);
  const [activeTab, setActiveTab] = useState('core');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ptl-config');
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/ptl-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Errore nel salvataggio della configurazione');
    } finally {
      setIsSaving(false);
    }
  };

  const resetConfig = async () => {
    if (!confirm('Sei sicuro di voler ripristinare la configurazione predefinita?')) return;

    try {
      const response = await fetch('/api/ptl-config/reset', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
        alert('Configurazione ripristinata ai valori predefiniti!');
      }
    } catch (error) {
      console.error('Error resetting config:', error);
    }
  };

  const exportConfig = async () => {
    try {
      const response = await fetch('/api/ptl-config/export/json');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ptl-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting config:', error);
    }
  };

  if (isLoading || !config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento configurazione PTL...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'core', label: 'Base', icon: '⚙️' },
    { id: 'locations', label: 'Ubicazioni', icon: '📍' },
    { id: 'container', label: 'Contenitori', icon: '📦' },
    { id: 'workflow', label: 'Workflow', icon: '🔄' },
    { id: 'barcode', label: 'Barcode', icon: '🔖' },
    { id: 'reports', label: 'Report', icon: '📊' },
    { id: 'hardware', label: 'Hardware', icon: '💡' },
    { id: 'maintenance', label: 'Manutenzione', icon: '🔧' },
    { id: 'messages', label: 'Messaggi', icon: '💬' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configurazione PTL</h1>
              <p className="text-gray-600">Gestione completa del sistema Pick-to-Light</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportConfig}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
              title="Esporta configurazione"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Esporta</span>
            </button>
            <button
              onClick={resetConfig}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center gap-2 transition-colors"
              title="Ripristina valori predefiniti"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg font-semibold"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Salvato!
                </>
              ) : isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salva
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            config.enabled
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {config.enabled ? '✅ Sistema Attivo' : '⛔ Sistema Disabilitato'}
          </span>
          <span className="text-sm text-gray-600">
            • Warehouse ID: {config.warehouseId || 'Non configurato'}
          </span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-all whitespace-nowrap rounded-lg flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        {/* CORE TAB */}
        {activeTab === 'core' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              ⚙️ Impostazioni Base
            </h2>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-blue-800 text-sm">
                Configura le impostazioni fondamentali del sistema PTL. Queste impostazioni determinano il comportamento generale del sistema.
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-6 h-6 text-blue-600 rounded"
                id="enabled"
              />
              <label htmlFor="enabled" className="text-gray-900 font-semibold text-lg cursor-pointer">
                Sistema PTL Abilitato
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID Magazzino PTL
                </label>
                <input
                  type="number"
                  value={config.warehouseId || ''}
                  onChange={(e) => setConfig({ ...config, warehouseId: parseInt(e.target.value) || null })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="es. 50001"
                />
                <p className="text-xs text-gray-500 mt-1">ID del magazzino configurato per PTL</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo Sistema
                </label>
                <select
                  value={config.systemType}
                  onChange={(e) => setConfig({ ...config, systemType: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>AblePick (Standard)</option>
                  <option value={2}>Sistema Personalizzato</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Hardware PTL utilizzato</p>
              </div>
            </div>
          </div>
        )}

        {/* LOCATIONS TAB */}
        {activeTab === 'locations' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              📍 Gestione Ubicazioni
            </h2>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
              <p className="text-purple-800 text-sm">
                Configura le ubicazioni di staging pre e post PTL per il flusso logistico.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ubicazione Pre-PTL (Staging Input)
                </label>
                <input
                  type="number"
                  value={config.locations.pre || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    locations: { ...config.locations, pre: parseInt(e.target.value) || null }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="ID ubicazione input"
                />
                <p className="text-xs text-gray-500 mt-1">Ubicazione dove arrivano gli articoli prima del PTL</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ubicazione Post-PTL (Staging Output)
                </label>
                <input
                  type="number"
                  value={config.locations.post || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    locations: { ...config.locations, post: parseInt(e.target.value) || null }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="ID ubicazione output"
                />
                <p className="text-xs text-gray-500 mt-1">Ubicazione dove vanno gli articoli dopo il PTL</p>
              </div>
            </div>
          </div>
        )}

        {/* CONTAINER TAB */}
        {activeTab === 'container' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              📦 Gestione Contenitori
            </h2>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-800 text-sm">
                Configura come il sistema gestisce i contenitori (UDC) durante le operazioni PTL.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={config.container.recycleEnabled}
                  onChange={(e) => setConfig({
                    ...config,
                    container: { ...config.container, recycleEnabled: e.target.checked }
                  })}
                  className="w-5 h-5 text-green-600 rounded"
                  id="recycleEnabled"
                />
                <label htmlFor="recycleEnabled" className="text-gray-900 font-medium cursor-pointer">
                  Riciclo Contenitori Abilitato
                </label>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={config.container.autoEmpty}
                  onChange={(e) => setConfig({
                    ...config,
                    container: { ...config.container, autoEmpty: e.target.checked }
                  })}
                  className="w-5 h-5 text-green-600 rounded"
                  id="autoEmpty"
                />
                <label htmlFor="autoEmpty" className="text-gray-900 font-medium cursor-pointer">
                  Svuotamento Automatico all'Apertura Collo
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipi Contenitore Supportati
              </label>
              <input
                type="text"
                value={config.container.types.join(', ')}
                onChange={(e) => setConfig({
                  ...config,
                  container: {
                    ...config.container,
                    types: e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
                  }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="es. 1, 2, 3"
              />
              <p className="text-xs text-gray-500 mt-1">Lista di ID tipi contenitore separati da virgola</p>
            </div>
          </div>
        )}

        {/* WORKFLOW TAB */}
        {activeTab === 'workflow' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              🔄 Flusso di Lavoro
            </h2>

            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
              <p className="text-orange-800 text-sm">
                Configura il comportamento del workflow PTL durante le operazioni di picking.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={config.workflow.boxOpeningRequired}
                  onChange={(e) => setConfig({
                    ...config,
                    workflow: { ...config.workflow, boxOpeningRequired: e.target.checked }
                  })}
                  className="w-5 h-5 text-orange-600 rounded"
                  id="boxOpeningRequired"
                />
                <label htmlFor="boxOpeningRequired" className="text-gray-900 font-medium cursor-pointer">
                  Richiedi Apertura Collo Obbligatoria
                </label>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={config.workflow.sumQuantities}
                  onChange={(e) => setConfig({
                    ...config,
                    workflow: { ...config.workflow, sumQuantities: e.target.checked }
                  })}
                  className="w-5 h-5 text-orange-600 rounded"
                  id="sumQuantities"
                />
                <label htmlFor="sumQuantities" className="text-gray-900 font-medium cursor-pointer">
                  Somma Quantità nello Stesso Vano
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motivi Prelievo Consentiti
              </label>
              <input
                type="text"
                value={config.workflow.pickReasons.join(', ')}
                onChange={(e) => setConfig({
                  ...config,
                  workflow: {
                    ...config.workflow,
                    pickReasons: e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
                  }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="es. 1, 2, 3"
              />
              <p className="text-xs text-gray-500 mt-1">Lista di ID motivi prelievo separati da virgola</p>
            </div>
          </div>
        )}

        {/* BARCODE TAB */}
        {activeTab === 'barcode' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              🔖 Configurazione Barcode
            </h2>

            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6">
              <p className="text-indigo-800 text-sm">
                Configura i prefissi barcode e i comandi speciali per il sistema PTL.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prefisso Ubicazione
                </label>
                <input
                  type="text"
                  value={config.barcode.locationPrefix}
                  onChange={(e) => setConfig({
                    ...config,
                    barcode: { ...config.barcode, locationPrefix: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="@"
                />
                <p className="text-xs text-gray-500 mt-1">Carattere che precede il codice ubicazione</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Codice Scarico Temporaneo
                </label>
                <input
                  type="text"
                  value={config.barcode.discharge}
                  onChange={(e) => setConfig({
                    ...config,
                    barcode: { ...config.barcode, discharge: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="#TMP0000000000"
                />
                <p className="text-xs text-gray-500 mt-1">Barcode per scarico in ubicazione temporanea</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Comando Apertura Collo
                </label>
                <input
                  type="text"
                  value={config.barcode.commands.openBox}
                  onChange={(e) => setConfig({
                    ...config,
                    barcode: {
                      ...config.barcode,
                      commands: { ...config.barcode.commands, openBox: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="$APERTURACOLLO"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Comando Saturazione Collo
                </label>
                <input
                  type="text"
                  value={config.barcode.commands.saturate}
                  onChange={(e) => setConfig({
                    ...config,
                    barcode: {
                      ...config.barcode,
                      commands: { ...config.barcode.commands, saturate: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="$SATURAZIONECOLLO"
                />
              </div>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              📊 Configurazione Report
            </h2>

            <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mb-6">
              <p className="text-pink-800 text-sm">
                Abilita o disabilita la stampa automatica di etichette e liste.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={config.reports.containerLabel}
                  onChange={(e) => setConfig({
                    ...config,
                    reports: { ...config.reports, containerLabel: e.target.checked }
                  })}
                  className="w-5 h-5 text-pink-600 rounded"
                  id="containerLabel"
                />
                <label htmlFor="containerLabel" className="text-gray-900 font-medium cursor-pointer">
                  Stampa Etichetta Contenitore
                </label>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={config.reports.packingList}
                  onChange={(e) => setConfig({
                    ...config,
                    reports: { ...config.reports, packingList: e.target.checked }
                  })}
                  className="w-5 h-5 text-pink-600 rounded"
                  id="packingList"
                />
                <label htmlFor="packingList" className="text-gray-900 font-medium cursor-pointer">
                  Stampa Packing List
                </label>
              </div>
            </div>
          </div>
        )}

        {/* HARDWARE TAB */}
        {activeTab === 'hardware' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              💡 Configurazione Hardware PTL
            </h2>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                Configura i parametri hardware dei dispositivi PTL: colori LED, modalità blink, timeout e retry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Colore LED Predefinito
                </label>
                <select
                  value={config.hardware.defaultColor}
                  onChange={(e) => setConfig({
                    ...config,
                    hardware: { ...config.hardware, defaultColor: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="red">🔴 Rosso</option>
                  <option value="green">🟢 Verde</option>
                  <option value="orange">🟠 Arancione</option>
                  <option value="blue">🔵 Blu</option>
                  <option value="pink">🩷 Rosa</option>
                  <option value="cyan">🔷 Ciano</option>
                  <option value="yellow">🟡 Giallo</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">7 colori disponibili (più del legacy!)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Modalità Blink Predefinita
                </label>
                <select
                  value={config.hardware.defaultBlinkMode}
                  onChange={(e) => setConfig({
                    ...config,
                    hardware: { ...config.hardware, defaultBlinkMode: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="fixed">Fisso (sempre acceso)</option>
                  <option value="blink_2000">Lento (2000ms)</option>
                  <option value="blink_1000">Normale (1000ms)</option>
                  <option value="blink_500">Veloce (500ms)</option>
                  <option value="blink_250">Rapido (250ms)</option>
                  <option value="blink">Blink Standard</option>
                  <option value="solid">Solido</option>
                  <option value="pulse">Pulse (effetto pulsante)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">8 modalità disponibili (più del legacy!)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Timeout Comando (ms)
                </label>
                <input
                  type="number"
                  value={config.hardware.timeout}
                  onChange={(e) => setConfig({
                    ...config,
                    hardware: { ...config.hardware, timeout: parseInt(e.target.value) || 5000 }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  min="1000"
                  max="30000"
                />
                <p className="text-xs text-gray-500 mt-1">Timeout per comunicazione con hardware (1000-30000ms)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Numero Tentativi
                </label>
                <input
                  type="number"
                  value={config.hardware.retries}
                  onChange={(e) => setConfig({
                    ...config,
                    hardware: { ...config.hardware, retries: parseInt(e.target.value) || 3 }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  min="0"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">Numero di retry in caso di errore (0-10)</p>
              </div>
            </div>
          </div>
        )}

        {/* MAINTENANCE TAB */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              🔧 Manutenzione Sistema
            </h2>

            <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 mb-6">
              <p className="text-cyan-800 text-sm">
                Configura le politiche di pulizia automatica e retention dei dati.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Intervallo Pulizia Automatica (ms)
                </label>
                <input
                  type="number"
                  value={config.maintenance.cleanupInterval}
                  onChange={(e) => setConfig({
                    ...config,
                    maintenance: { ...config.maintenance, cleanupInterval: parseInt(e.target.value) || 86400000 }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: 86400000ms (24 ore). Intervallo per pulizia dati obsoleti.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Retention UDC (giorni)
                </label>
                <input
                  type="number"
                  value={config.maintenance.udcRetentionDays}
                  onChange={(e) => setConfig({
                    ...config,
                    maintenance: { ...config.maintenance, udcRetentionDays: parseInt(e.target.value) || 30 }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  min="1"
                  max="365"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Giorni di conservazione dati UDC (1-365)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              💬 Messaggi Utente
            </h2>

            <div className="bg-teal-50 border-l-4 border-teal-500 p-4 mb-6">
              <p className="text-teal-800 text-sm">
                Personalizza i messaggi mostrati agli operatori durante le operazioni PTL.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Messaggio Apertura Collo
                </label>
                <textarea
                  value={config.messages.openBox}
                  onChange={(e) => setConfig({
                    ...config,
                    messages: { ...config.messages, openBox: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  placeholder="Messaggio mostrato durante apertura collo..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Messaggio Chiusura Collo
                </label>
                <textarea
                  value={config.messages.closeBox}
                  onChange={(e) => setConfig({
                    ...config,
                    messages: { ...config.messages, closeBox: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  placeholder="Messaggio mostrato durante chiusura collo..."
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Footer Info */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Backend API: <strong>/api/ptl-config</strong></span>
          </div>
          <div className="flex items-center gap-4">
            <span>Endpoint: 8 disponibili</span>
            <span>•</span>
            <span>Auto-creation: ✅</span>
            <span>•</span>
            <span>Export/Import: ✅</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PTLSettings;

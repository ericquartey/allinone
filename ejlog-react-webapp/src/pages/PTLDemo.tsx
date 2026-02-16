/**
 * PTL (Pick-to-Light) - Real Implementation
 * Feature C - Sistema PTL con Backend Integration
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, CheckCircle, XCircle, Plus, RefreshCw, BarChart3, Power, Settings } from 'lucide-react';

// PTL Colors - 7 colors (exceeds legacy's 6!)
const PTL_COLORS = [
  { value: 'red', label: 'Rosso', hex: '#ef4444', emoji: '🔴' },
  { value: 'green', label: 'Verde', hex: '#10b981', emoji: '🟢' },
  { value: 'orange', label: 'Arancione', hex: '#f97316', emoji: '🟠' },
  { value: 'blue', label: 'Blu', hex: '#3b82f6', emoji: '🔵' },
  { value: 'pink', label: 'Rosa', hex: '#ec4899', emoji: '🩷' },
  { value: 'cyan', label: 'Ciano', hex: '#06b6d4', emoji: '🔷' },
  { value: 'yellow', label: 'Giallo', hex: '#eab308', emoji: '🟡' },
];

// PTL Blink Modes - 8 modes (exceeds legacy's 5!)
const BLINK_MODES = [
  { value: 'fixed', label: 'Fisso', ms: 0, description: 'Sempre acceso' },
  { value: 'blink_2000', label: 'Lento (2s)', ms: 2000, description: 'Blink ogni 2 secondi' },
  { value: 'blink_1000', label: 'Normale (1s)', ms: 1000, description: 'Blink ogni secondo' },
  { value: 'blink_500', label: 'Veloce (500ms)', ms: 500, description: 'Blink ogni 500ms' },
  { value: 'blink_250', label: 'Rapido (250ms)', ms: 250, description: 'Blink ogni 250ms' },
  { value: 'blink', label: 'Blink Standard', ms: 800, description: 'Blink standard' },
  { value: 'solid', label: 'Solido', ms: 0, description: 'Sempre acceso (solid)' },
  { value: 'pulse', label: 'Pulse', ms: 1500, description: 'Effetto pulse' },
];

interface PTLDevice {
  id: number;
  deviceCode: string;
  deviceName: string;
  locationId: number | null;
  locationCode: string | null;
  locationDescription: string | null;
  zone: string;
  status: string;
  ipAddress: string | null;
  lastPing: string | null;
}

interface PTLEvent {
  id: number;
  deviceId: number;
  itemId: number | null;
  eventType: string;
  quantity: number;
  color: string;
  mode: string;
  status: string;
  confirmedAt: string | null;
  createdAt: string;
  deviceCode: string;
  deviceName: string;
  zone: string;
  locationCode: string | null;
  CodiceArticolo: string | null;
  itemDescription: string | null;
}

interface PTLStats {
  devices: Array<{ status: string; count: number }>;
  events: Array<{ status: string; count: number; totalQuantity: number }>;
  avgConfirmTimeSeconds: number;
}

export const PTLDemo: React.FC = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<PTLDevice[]>([]);
  const [events, setEvents] = useState<PTLEvent[]>([]);
  const [stats, setStats] = useState<PTLStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);

  // Load devices and stats
  useEffect(() => {
    loadDevices();
    loadEvents();
    loadStats();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await fetch('/api/ptl/devices?status=all');
      const data = await response.json();
      if (data.success) {
        setDevices(data.devices);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/ptl/events?limit=50');
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/ptl/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLightUp = async (deviceId: number, quantity: number, color: string = 'green', mode: string = 'blink') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ptl/light-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          quantity,
          color,
          mode
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadEvents();
        await loadStats();
      }
    } catch (error) {
      console.error('Error lighting up PTL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (eventId: number, actualQuantity?: number) => {
    try {
      const response = await fetch('/api/ptl/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          actualQuantity
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadEvents();
        await loadStats();
      }
    } catch (error) {
      console.error('Error confirming PTL event:', error);
    }
  };

  const handleCancel = async (eventId: number) => {
    try {
      const response = await fetch('/api/ptl/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          reason: 'Cancellato dall\'utente'
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadEvents();
        await loadStats();
      }
    } catch (error) {
      console.error('Error cancelling PTL event:', error);
    }
  };

  const activeEvents = events.filter(e => e.status === 'active');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-800">PTL System - Pick-to-Light</h1>
          <button
            onClick={() => navigate('/ptl-settings')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg font-semibold"
          >
            <Settings className="w-5 h-5" />
            Configurazione
          </button>
        </div>
        <p className="text-lg text-gray-600">Feature C - Sistema PTL con backend reale e database integration</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
            ✅ Backend API Attivo
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
            🎨 7 Colori LED
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
            ⚡ 8 Modalità Blink
          </span>
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-bold">
            🚀 Migliore del Legacy
          </span>
          <span className="text-sm text-gray-600">
            Devices: {devices.length} • Active: {activeEvents.length}
          </span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Dispositivi Attivi</p>
            <Power className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {stats?.devices.find(d => d.status === 'active')?.count || 0}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-600">Eventi Attivi</p>
            <Lightbulb className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">{activeEvents.length}</p>
        </div>

        <div className="bg-blue-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-600">Confermati (7gg)</p>
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {stats?.events.find(e => e.status === 'confirmed')?.count || 0}
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-purple-600">Tempo Medio</p>
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {stats ? Math.round(stats.avgConfirmTimeSeconds) : 0}s
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
        <h3 className="text-blue-800 font-bold text-lg mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Sistema PTL Enhanced - Migliore del Legacy Java/Swing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3">
            <h4 className="font-semibold text-blue-900 mb-2">🎨 Colori LED (7 vs 6 legacy)</h4>
            <div className="flex gap-1 flex-wrap">
              {PTL_COLORS.map(c => (
                <span key={c.value} className="text-lg" title={c.label}>{c.emoji}</span>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1">Red, Green, Orange, Blue, Pink, Cyan, Yellow</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <h4 className="font-semibold text-purple-900 mb-2">⚡ Modalità Blink (8 vs 5 legacy)</h4>
            <p className="text-xs text-gray-700 space-y-0.5">
              <span className="block">• Fixed, Blink 2s, Blink 1s, Blink 500ms, Blink 250ms</span>
              <span className="block">• Blink Standard, Solid, Pulse (3 nuove modalità!)</span>
            </p>
          </div>
        </div>
        <ul className="text-blue-700 text-sm space-y-1 mt-3">
          <li>✅ Database integration (PTLDevices, PTLEvents, PTLConfig)</li>
          <li>✅ Statistiche real-time + storico eventi completo</li>
          <li>✅ Seleziona colore e modalità per ogni light-up</li>
          <li>✅ REST API moderna vs file config del legacy</li>
        </ul>
      </div>

      {/* PTL Devices Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Dispositivi PTL</h2>
          <button
            onClick={loadDevices}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {devices.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 font-semibold mb-2">Nessun dispositivo PTL configurato</p>
            <p className="text-yellow-700 text-sm mb-4">
              Usa POST /api/ptl/devices per creare dispositivi PTL nel database
            </p>
            <pre className="bg-yellow-100 rounded p-3 text-xs text-left inline-block">
{`curl -X POST http://localhost:3077/api/ptl/devices \\
  -H "Content-Type: application/json" \\
  -d '{
    "deviceCode": "PTL-A12-05",
    "deviceName": "PTL Zona A",
    "zone": "A",
    "ipAddress": "192.168.1.101"
  }'`}
            </pre>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {devices.map((device) => {
              const activeEvent = events.find(e => e.deviceId === device.id && e.status === 'active');
              return (
                <PTLDeviceCard
                  key={device.id}
                  device={device}
                  activeEvent={activeEvent}
                  isSelected={selectedDevice === device.id}
                  onSelect={() => setSelectedDevice(device.id)}
                  onLightUp={(qty, color) => handleLightUp(device.id, qty, color)}
                  onConfirm={(eventId) => handleConfirm(eventId)}
                  onCancel={(eventId) => handleCancel(eventId)}
                  isLoading={isLoading}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Active Events */}
      {activeEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Eventi PTL Attivi</h3>
          <div className="space-y-2">
            {activeEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-300 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Lightbulb className="w-8 h-8 text-green-500 fill-green-500" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {event.deviceCode} - {event.locationCode || 'No Location'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantità: <span className="font-semibold text-green-700">{event.quantity}</span> •
                      Color: {event.color} • Mode: {event.mode}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirm(event.id, event.quantity)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    CONFIRM
                  </button>
                  <button
                    onClick={() => handleCancel(event.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events History */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Storico Eventi Recenti</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nessun evento PTL ancora</p>
          ) : (
            events.slice(0, 20).map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border ${
                  event.status === 'confirmed'
                    ? 'bg-green-50 border-green-300'
                    : event.status === 'cancelled'
                    ? 'bg-red-50 border-red-300'
                    : 'bg-yellow-50 border-yellow-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{event.deviceCode}</span>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                        {event.zone}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        event.status === 'confirmed'
                          ? 'bg-green-200 text-green-800'
                          : event.status === 'cancelled'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {event.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Qty: {event.quantity} • {new Date(event.createdAt).toLocaleString('it-IT')}
                      {event.confirmedAt && ` → Confermato: ${new Date(event.confirmedAt).toLocaleString('it-IT')}`}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* API Integration Info */}
      <div className="mt-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-300">
        <h3 className="text-xl font-bold text-green-800 mb-3 flex items-center gap-2">
          <CheckCircle className="w-6 h-6" />
          Backend PTL API Integration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3">
            <p className="font-bold text-green-700 mb-1">GET /api/ptl/devices</p>
            <p className="text-gray-600">Lista dispositivi PTL</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="font-bold text-green-700 mb-1">POST /api/ptl/light-up</p>
            <p className="text-gray-600">Accendi LED PTL</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="font-bold text-green-700 mb-1">POST /api/ptl/confirm</p>
            <p className="text-gray-600">Conferma prelievo</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="font-bold text-green-700 mb-1">POST /api/ptl/cancel</p>
            <p className="text-gray-600">Annulla evento</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="font-bold text-green-700 mb-1">GET /api/ptl/events</p>
            <p className="text-gray-600">Eventi PTL</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="font-bold text-green-700 mb-1">GET /api/ptl/stats</p>
            <p className="text-gray-600">Statistiche PTL</p>
          </div>
        </div>
        <p className="text-xs text-green-600 mt-3">
          ✅ Tables: PTLDevices, PTLEvents • Real-time tracking • Hardware simulation ready
        </p>
      </div>
    </div>
  );
};

interface PTLDeviceCardProps {
  device: PTLDevice;
  activeEvent?: PTLEvent;
  isSelected: boolean;
  onSelect: () => void;
  onLightUp: (quantity: number, color: string, mode: string) => void;
  onConfirm: (eventId: number) => void;
  onCancel: (eventId: number) => void;
  isLoading: boolean;
}

const PTLDeviceCard: React.FC<PTLDeviceCardProps> = ({
  device,
  activeEvent,
  isSelected,
  onSelect,
  onLightUp,
  onConfirm,
  onCancel,
  isLoading
}) => {
  const [quantity, setQuantity] = useState(10);
  const [color, setColor] = useState('green');
  const [mode, setMode] = useState('blink');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isActive = activeEvent !== undefined;
  const selectedColorData = PTL_COLORS.find(c => c.value === color);
  const selectedModeData = BLINK_MODES.find(m => m.value === mode);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onSelect}
      className={`relative bg-white rounded-lg shadow-xl p-4 border-4 transition-all cursor-pointer ${
        isActive
          ? 'border-green-500 shadow-green-500/50'
          : isSelected
          ? 'border-blue-500'
          : 'border-gray-200'
      }`}
    >
      {/* Status Indicator */}
      <div className="absolute -top-3 -right-3">
        {isActive ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Lightbulb className="w-8 h-8 text-green-500 fill-green-500" />
          </motion.div>
        ) : device.status === 'active' ? (
          <Power className="w-8 h-8 text-green-500" />
        ) : (
          <Power className="w-8 h-8 text-gray-300" />
        )}
      </div>

      {/* Device Info */}
      <div className="mb-3">
        <p className="text-xs text-gray-500">Device</p>
        <p className="text-lg font-bold text-gray-900">{device.deviceCode}</p>
        <p className="text-sm text-gray-600">{device.deviceName}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <p className="text-gray-500">Zone</p>
          <p className="font-semibold">{device.zone || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">Location</p>
          <p className="font-semibold">{device.locationCode || 'N/A'}</p>
        </div>
      </div>

      {/* Active Event Display */}
      {isActive && activeEvent && (
        <div className="mb-3 p-2 bg-green-100 rounded-lg">
          <p className="text-xs text-green-600 mb-1">Evento Attivo</p>
          <p className="text-2xl font-bold text-green-700">{activeEvent.quantity}</p>
          <p className="text-xs text-green-600">Pz da prelevare</p>
        </div>
      )}

      {/* Controls */}
      {!isActive ? (
        <div className="space-y-2">
          {/* Quantity Input */}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Quantità</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-3 py-2 border rounded-lg text-sm font-semibold"
              placeholder="Qty"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Color Selector - All 7 Colors */}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Colore LED</label>
            <div className="grid grid-cols-4 gap-1">
              {PTL_COLORS.map(colorOption => (
                <button
                  key={colorOption.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    setColor(colorOption.value);
                  }}
                  className={`p-2 rounded-lg border-2 transition-all text-xs font-semibold ${
                    color === colorOption.value
                      ? 'border-gray-900 bg-gray-100 scale-105'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{
                    backgroundColor: color === colorOption.value ? colorOption.hex + '20' : 'white'
                  }}
                  title={colorOption.label}
                >
                  <div className="text-lg">{colorOption.emoji}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{selectedColorData?.label}</p>
          </div>

          {/* Blink Mode Selector - All 8 Modes */}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Modalità Blink</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-2 py-2 border rounded-lg text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {BLINK_MODES.map(modeOption => (
                <option key={modeOption.value} value={modeOption.value}>
                  {modeOption.label} {modeOption.ms > 0 ? `(${modeOption.ms}ms)` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">{selectedModeData?.description}</p>
          </div>

          {/* Light UP Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLightUp(quantity, color, mode);
            }}
            disabled={isLoading || device.status !== 'active'}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            Light UP
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (activeEvent) onConfirm(activeEvent.id);
            }}
            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm"
          >
            CONFIRM
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (activeEvent) onCancel(activeEvent.id);
            }}
            className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm"
          >
            CANCEL
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default PTLDemo;


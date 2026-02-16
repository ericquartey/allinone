/**
 * Barcode Scanner - Real Implementation
 * Feature F - Integrazione Barcode Scanner con Backend
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, Camera, Keyboard, CheckCircle, XCircle, AlertCircle, Package, MapPin, Box } from 'lucide-react';

interface ScanResult {
  barcode: string;
  timestamp: Date;
  isValid: boolean;
  found: boolean;
  entityType: 'item' | 'location' | 'udc' | null;
  data: any;
}

export const BarcodeDemo: React.FC = () => {
  const [scannedCode, setScannedCode] = useState('');
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [buffer, setBuffer] = useState('');
  const [isListening, setIsListening] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);

  // Simulate hardware barcode scanner (keyboard wedge)
  useEffect(() => {
    if (!isListening) return;

    let timeout: NodeJS.Timeout;
    let inputBuffer = '';

    function handleKeyPress(event: KeyboardEvent) {
      // Ignore if typing in input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Barcode scanner sends Enter at end
      if (event.key === 'Enter') {
        if (inputBuffer.length > 0) {
          handleScan(inputBuffer);
          inputBuffer = '';
        }
      } else if (event.key.length === 1) {
        // Accumulate characters
        inputBuffer += event.key;
        setBuffer(inputBuffer);

        // Reset buffer after 100ms of inactivity
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          inputBuffer = '';
          setBuffer('');
        }, 100);
      }
    }

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(timeout);
    };
  }, [isListening]);

  const handleScan = async (code: string) => {
    if (!code.trim()) return;

    setIsScanning(true);
    setScannedCode(code);

    try {
      // Call real backend API
      const response = await fetch('/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: code,
          userId: 1, // TODO: Get from auth context
          context: 'general'
        })
      });

      const result = await response.json();

      const scanResult: ScanResult = {
        barcode: code,
        timestamp: new Date(),
        isValid: result.isValid || false,
        found: result.found || false,
        entityType: result.entityType || null,
        data: result.data || null
      };

      setCurrentScan(scanResult);
      setScanHistory((prev) => [scanResult, ...prev.slice(0, 19)]); // Keep last 20

      // Auto-clear after 5 seconds
      setTimeout(() => {
        setScannedCode('');
        setCurrentScan(null);
      }, 5000);

    } catch (error) {
      console.error('Scan error:', error);

      const scanResult: ScanResult = {
        barcode: code,
        timestamp: new Date(),
        isValid: false,
        found: false,
        entityType: null,
        data: null
      };

      setCurrentScan(scanResult);
      setScanHistory((prev) => [scanResult, ...prev.slice(0, 19)]);

      setTimeout(() => {
        setScannedCode('');
        setCurrentScan(null);
      }, 5000);
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualScan = () => {
    if (scannedCode.trim()) {
      handleScan(scannedCode);
    }
  };

  const getEntityIcon = (type: string | null) => {
    switch (type) {
      case 'item': return Package;
      case 'location': return MapPin;
      case 'udc': return Box;
      default: return AlertCircle;
    }
  };

  const getEntityLabel = (type: string | null) => {
    switch (type) {
      case 'item': return 'Articolo';
      case 'location': return 'Ubicazione';
      case 'udc': return 'UDC';
      default: return 'Sconosciuto';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Barcode Scanner Integration</h1>
        <p className="text-lg text-gray-600">Feature F - Integrazione lettore barcode con backend reale</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
            ✅ Backend API Attivo
          </span>
          <span className="text-sm text-gray-600">
            Endpoint: /api/barcode/scan, /api/barcode/history, /api/barcode/validate
          </span>
        </div>
      </motion.div>

      {/* Scanner Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Hardware Scanner</h3>
            <div className={`flex items-center gap-2 ${isListening ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">{isListening ? 'LISTENING' : 'STOPPED'}</span>
            </div>
          </div>
          <button
            onClick={() => setIsListening(!isListening)}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>
          <p className="text-xs text-gray-500 mt-2">Keyboard wedge scanner - Scansiona con lettore barcode fisico</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Camera Scanner</h3>
          <button
            disabled
            className="w-full py-3 bg-gray-300 text-gray-600 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Camera className="w-5 h-5" />
            Camera Scanner (Coming Soon)
          </button>
          <p className="text-xs text-gray-500 mt-2">Future: Usa libreria @zxing/library per scanning camera</p>
        </div>
      </div>

      {/* Current Scan Display */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h3 className="text-lg font-semibold text-gray-600 mb-2 text-center">Codice Scansionato</h3>
        <div className={`rounded-lg p-6 mb-4 transition-colors ${
          currentScan
            ? currentScan.found
              ? 'bg-green-900'
              : currentScan.isValid
              ? 'bg-yellow-900'
              : 'bg-red-900'
            : 'bg-gray-900'
        }`}>
          <p className={`text-4xl font-mono text-center tracking-wider ${
            currentScan
              ? currentScan.found
                ? 'text-green-400'
                : currentScan.isValid
                ? 'text-yellow-400'
                : 'text-red-400'
              : 'text-green-400'
          }`}>
            {isScanning ? '⏳ Scanning...' : scannedCode || buffer || '_____________________'}
          </p>
        </div>

        {/* Scan Result Details */}
        {currentScan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border-2 mb-4 ${
              currentScan.found
                ? 'bg-green-50 border-green-300'
                : currentScan.isValid
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-red-50 border-red-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              {currentScan.found ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : currentScan.isValid ? (
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <p className="font-bold text-lg">
                  {currentScan.found
                    ? `${getEntityLabel(currentScan.entityType)} Trovato!`
                    : currentScan.isValid
                    ? 'Barcode valido ma non trovato nel database'
                    : 'Barcode non valido'}
                </p>
                <p className="text-sm text-gray-600">Barcode: {currentScan.barcode}</p>
              </div>
            </div>

            {currentScan.found && currentScan.data && (
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  {React.createElement(getEntityIcon(currentScan.entityType), { className: 'w-5 h-5 text-blue-600' })}
                  <h4 className="font-bold text-blue-700">Dettagli {getEntityLabel(currentScan.entityType)}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {currentScan.entityType === 'item' && (
                    <>
                      <div>
                        <span className="text-gray-600">Codice:</span>
                        <p className="font-semibold">{currentScan.data.CodiceArticolo}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Descrizione:</span>
                        <p className="font-semibold">{currentScan.data.Descrizione}</p>
                      </div>
                    </>
                  )}
                  {currentScan.entityType === 'location' && (
                    <>
                      <div>
                        <span className="text-gray-600">Ubicazione:</span>
                        <p className="font-semibold">{currentScan.data.CodiceUbicazione}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Descrizione:</span>
                        <p className="font-semibold">{currentScan.data.Descrizione}</p>
                      </div>
                    </>
                  )}
                  {currentScan.entityType === 'udc' && (
                    <>
                      <div>
                        <span className="text-gray-600">UDC:</span>
                        <p className="font-semibold">{currentScan.data.CodiceUDC}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Stato:</span>
                        <p className="font-semibold">{currentScan.data.Stato}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Manual Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
              placeholder="Oppure inserisci manualmente..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono uppercase"
              disabled={isScanning}
            />
          </div>
          <button
            onClick={handleManualScan}
            disabled={isScanning}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScanning ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Totale Scansioni</p>
          <p className="text-2xl font-bold text-gray-800">{scanHistory.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-green-600 mb-1">Trovati</p>
          <p className="text-2xl font-bold text-green-700">
            {scanHistory.filter(s => s.found).length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <p className="text-sm text-yellow-600 mb-1">Validi</p>
          <p className="text-2xl font-bold text-yellow-700">
            {scanHistory.filter(s => s.isValid && !s.found).length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-sm text-red-600 mb-1">Non Validi</p>
          <p className="text-2xl font-bold text-red-700">
            {scanHistory.filter(s => !s.isValid).length}
          </p>
        </div>
      </div>

      {/* Scan History */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Storico Scansioni</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {scanHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ScanLine className="w-16 h-16 mx-auto mb-2" />
              <p>Nessuna scansione ancora</p>
            </div>
          ) : (
            scanHistory.map((scan, index) => {
              const EntityIcon = getEntityIcon(scan.entityType);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                    scan.found
                      ? 'bg-green-50 border-green-300'
                      : scan.isValid
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-red-50 border-red-300'
                  }`}
                >
                  {scan.found ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <EntityIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    </div>
                  ) : scan.isValid ? (
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono font-bold text-gray-900">{scan.barcode}</p>
                      {scan.found && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                          {getEntityLabel(scan.entityType)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{scan.timestamp.toLocaleTimeString('it-IT')}</span>
                      {scan.found && scan.data && (
                        <span className="font-medium">
                          {scan.entityType === 'item' && scan.data.Descrizione}
                          {scan.entityType === 'location' && scan.data.CodiceUbicazione}
                          {scan.entityType === 'udc' && scan.data.CodiceUDC}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    scan.found
                      ? 'bg-green-200 text-green-800'
                      : scan.isValid
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {scan.found ? 'FOUND' : scan.isValid ? 'VALID' : 'INVALID'}
                  </span>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Test Barcodes */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Test Barcodes</h3>
        <p className="text-sm text-gray-600 mb-4">
          Clicca sui barcode di test per simulare una scansione (questi cercheranno nel database reale)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { code: 'ART-12345', label: 'Articolo Test' },
            { code: 'LOC-A1205', label: 'Ubicazione Test' },
            { code: 'UDC-99887', label: 'UDC Test' },
            { code: 'INVALID', label: 'Non Valido' },
            { code: '8001234567890', label: 'EAN-13 Test' },
            { code: 'TEST123', label: 'Corto' },
          ].map((item) => (
            <button
              key={item.code}
              onClick={() => handleScan(item.code)}
              disabled={isScanning}
              className="p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <p className="font-mono font-bold text-sm mb-1">{item.code}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* API Integration Info */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-300">
        <h3 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
          <CheckCircle className="w-6 h-6" />
          Backend API Integration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3">
            <p className="font-bold text-blue-700 mb-1">POST /api/barcode/scan</p>
            <p className="text-gray-600">Scansiona e valida barcode</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="font-bold text-blue-700 mb-1">GET /api/barcode/history</p>
            <p className="text-gray-600">Storico scansioni</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="font-bold text-blue-700 mb-1">POST /api/barcode/validate</p>
            <p className="text-gray-600">Valida formato barcode</p>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-3">
          ✅ Cerca in: Articoli, Ubicazioni, UDC • Salva in BarcodeScanHistory • Validazione formato
        </p>
      </div>
    </div>
  );
};

export default BarcodeDemo;

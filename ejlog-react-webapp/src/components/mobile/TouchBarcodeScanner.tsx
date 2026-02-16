import React, { FC, useState, useRef, useEffect } from 'react';
import {
  Camera, ScanLine, X, FlashlightOff, Flashlight,
  Keyboard, CheckCircle, XCircle, Volume2, VolumeX
} from 'lucide-react';

// Types
interface TouchBarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
  title?: string;
  placeholder?: string;
  vibrationEnabled?: boolean;
  soundEnabled?: boolean;
}

interface ScanResult {
  barcode: string;
  timestamp: Date;
  method: 'camera' | 'manual';
  status: 'success' | 'error';
}

export const TouchBarcodeScanner: FC<TouchBarcodeScannerProps> = ({
  onScan,
  onClose,
  title = 'Scansiona Barcode',
  placeholder = 'Inserisci o scansiona barcode',
  vibrationEnabled = true,
  soundEnabled = true
}) => {
  // State
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [vibration, setVibration] = useState(vibrationEnabled);
  const [sound, setSound] = useState(soundEnabled);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera
  useEffect(() => {
    if (scanMode === 'camera' && !isCameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanMode]);

  // Auto-focus manual input
  useEffect(() => {
    if (scanMode === 'manual' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera non disponibile su questo device');
        return;
      }

      // Request camera permission
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }

      // Check flash capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (!capabilities?.torch) {
        // Flash not available on this device
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Impossibile accedere alla camera. Verifica i permessi.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsFlashOn(false);
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;

      if (capabilities?.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !isFlashOn } as any]
        });
        setIsFlashOn(!isFlashOn);
      }
    } catch (error) {
      console.error('Flash error:', error);
    }
  };

  const handleScan = (barcode: string, method: 'camera' | 'manual') => {
    if (!barcode || barcode.trim().length === 0) return;

    const cleanBarcode = barcode.trim().toUpperCase();

    // Validate barcode (basic check)
    if (cleanBarcode.length < 3) {
      provideFeedback('error');
      addScanResult(cleanBarcode, method, 'error');
      return;
    }

    // Success feedback
    provideFeedback('success');
    addScanResult(cleanBarcode, method, 'success');

    // Call parent handler
    onScan(cleanBarcode);

    // Reset manual input
    if (method === 'manual') {
      setManualInput('');
      inputRef.current?.focus();
    }
  };

  const provideFeedback = (type: 'success' | 'error') => {
    // Haptic feedback (vibration)
    if (vibration && 'vibrate' in navigator) {
      if (type === 'success') {
        navigator.vibrate(100); // Single short vibration
      } else {
        navigator.vibrate([100, 50, 100]); // Double vibration for error
      }
    }

    // Audio feedback
    if (sound) {
      playBeep(type);
    }
  };

  const playBeep = (type: 'success' | 'error') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for success/error
    oscillator.frequency.value = type === 'success' ? 1000 : 400;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const addScanResult = (barcode: string, method: 'camera' | 'manual', status: 'success' | 'error') => {
    const result: ScanResult = {
      barcode,
      timestamp: new Date(),
      method,
      status
    };
    setRecentScans(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(manualInput, 'manual');
  };

  // Simulate camera scan (in production, use a barcode detection library)
  const simulateCameraScan = () => {
    // In real implementation, you would use:
    // - BarcodeDetector API (Chrome/Edge)
    // - ZXing library
    // - Quagga.js library
    // - html5-qrcode library

    const mockBarcode = 'DEMO' + Math.random().toString(36).substr(2, 9).toUpperCase();
    handleScan(mockBarcode, 'camera');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScanLine className="w-6 h-6" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle Sound */}
          <button
            onClick={() => setSound(!sound)}
            className="p-2 rounded-lg hover:bg-gray-800 active:bg-gray-700"
          >
            {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 active:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector */}
      <div className="bg-gray-900 px-4 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => {
              stopCamera();
              setScanMode('camera');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition ${
              scanMode === 'camera'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Camera className="w-5 h-5" />
            Camera
          </button>
          <button
            onClick={() => {
              stopCamera();
              setScanMode('manual');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition ${
              scanMode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Keyboard className="w-5 h-5" />
            Manuale
          </button>
        </div>
      </div>

      {/* Camera Mode */}
      {scanMode === 'camera' && (
        <div className="flex-1 relative bg-black">
          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="bg-gray-900 rounded-lg p-6 text-center max-w-md">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-white mb-4">{cameraError}</p>
                <button
                  onClick={() => setScanMode('manual')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
                >
                  Usa Input Manuale
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Video Preview */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />

              {/* Scanning Frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-48">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>

                  {/* Animated scan line */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="w-full h-0.5 bg-blue-500 animate-scan-line shadow-lg shadow-blue-500/50"></div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute top-4 left-0 right-0 text-center">
                <p className="text-white text-lg font-medium bg-black bg-opacity-50 inline-block px-6 py-2 rounded-lg">
                  Inquadra il barcode
                </p>
              </div>

              {/* Flash Toggle */}
              <div className="absolute bottom-24 left-0 right-0 flex justify-center">
                <button
                  onClick={toggleFlash}
                  className={`p-4 rounded-full transition ${
                    isFlashOn
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-800 bg-opacity-75 text-white'
                  }`}
                >
                  {isFlashOn ? <Flashlight className="w-6 h-6" /> : <FlashlightOff className="w-6 h-6" />}
                </button>
              </div>

              {/* Demo Scan Button (remove in production) */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button
                  onClick={simulateCameraScan}
                  className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg shadow-lg"
                >
                  Simula Scansione (Demo)
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Manual Mode */}
      {scanMode === 'manual' && (
        <div className="flex-1 bg-gray-900 p-6 flex flex-col">
          <form onSubmit={handleManualSubmit} className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              Inserisci Barcode Manualmente
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                placeholder={placeholder}
                className="flex-1 px-4 py-4 text-lg rounded-lg border-2 border-gray-700 bg-gray-800 text-white focus:border-blue-500 focus:outline-none"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
              />
              <button
                type="submit"
                disabled={manualInput.trim().length === 0}
                className="px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-700 disabled:text-gray-500"
              >
                Conferma
              </button>
            </div>
          </form>

          {/* Keyboard Hint */}
          <div className="bg-gray-800 rounded-lg p-4 text-center mb-6">
            <Keyboard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              Usa la tastiera per inserire il codice
            </p>
          </div>
        </div>
      )}

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="bg-gray-900 border-t border-gray-800 p-4 max-h-48 overflow-y-auto">
          <h3 className="text-white text-sm font-medium mb-2">Scansioni Recenti</h3>
          <div className="space-y-2">
            {recentScans.map((scan, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  scan.status === 'success' ? 'bg-green-900 bg-opacity-30' : 'bg-red-900 bg-opacity-30'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {scan.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <span className="text-white font-mono text-sm truncate">{scan.barcode}</span>
                </div>
                <span className="text-gray-400 text-xs ml-2">
                  {scan.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add scanning animation CSS */}
      <style>{`
        @keyframes scan-line {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(192px);
          }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

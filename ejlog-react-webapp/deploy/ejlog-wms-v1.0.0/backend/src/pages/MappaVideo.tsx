// ============================================================================
// EJLOG WMS - Mappa Video Cassetti
// Sistema di rilevamento automatico scompartimenti tramite webcam
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  VideoCameraIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { drawersApi } from '../services/drawersApi';

interface Point {
  x: number;
  y: number;
}

interface Compartment {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
}

export default function MappaVideo() {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [corners, setCorners] = useState<Point[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [compartments, setCompartments] = useState<Compartment[]>([]);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(4);
  const [drawerWidth, setDrawerWidth] = useState(100);
  const [drawerDepth, setDrawerDepth] = useState(60);
  const [selectedDrawerId, setSelectedDrawerId] = useState<number | null>(
    location.state?.drawerId || null
  );
  const [isSaving, setIsSaving] = useState(false);

  // Avvia la webcam
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment', // Usa camera posteriore su mobile
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Errore accesso webcam:', err);
      alert('Impossibile accedere alla webcam. Verifica i permessi del browser.');
    }
  }, []);

  // Ferma la webcam
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Avvia la camera quando il componente viene montato
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Gestisce il click sul video per catturare i 4 angoli
  const handleVideoClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (corners.length >= 4) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCorners([...corners, { x, y }]);
  };

  // Disegna i punti e le linee sul canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = () => {
      // Disegna il video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Disegna i punti catturati
      corners.forEach((point, index) => {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
        ctx.fill();

        // Numera i punti
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`${index + 1}`, point.x - 5, point.y + 5);
      });

      // Disegna le linee tra i punti
      if (corners.length > 1) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < corners.length; i++) {
          ctx.lineTo(corners[i].x, corners[i].y);
        }
        if (corners.length === 4) {
          ctx.closePath();
        }
        ctx.stroke();
      }

      // Disegna la griglia degli scompartimenti se i 4 angoli sono definiti
      if (corners.length === 4 && compartments.length > 0) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        compartments.forEach(comp => {
          const p1 = transformPoint(comp.x, comp.y);
          const p2 = transformPoint(comp.x + comp.width, comp.y);
          const p3 = transformPoint(comp.x + comp.width, comp.y + comp.height);
          const p4 = transformPoint(comp.x, comp.y + comp.height);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();
          ctx.stroke();

          // Numero scomparto
          const center = transformPoint(comp.x + comp.width / 2, comp.y + comp.height / 2);
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(`${comp.row}-${comp.col}`, center.x - 15, center.y + 5);
        });
      }

      requestAnimationFrame(drawFrame);
    };

    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      drawFrame();
    }
  }, [corners, compartments]);

  // Trasforma coordinate reali in coordinate prospettiche
  const transformPoint = (x: number, y: number): Point => {
    if (corners.length !== 4) return { x: 0, y: 0 };

    // Interpolazione bilineare per trasformazione prospettica
    const normalizedX = x / drawerWidth;
    const normalizedY = y / drawerDepth;

    const topLeft = corners[0];
    const topRight = corners[1];
    const bottomRight = corners[2];
    const bottomLeft = corners[3];

    const top = {
      x: topLeft.x + (topRight.x - topLeft.x) * normalizedX,
      y: topLeft.y + (topRight.y - topLeft.y) * normalizedX,
    };

    const bottom = {
      x: bottomLeft.x + (bottomRight.x - bottomLeft.x) * normalizedX,
      y: bottomLeft.y + (bottomRight.y - bottomLeft.y) * normalizedX,
    };

    return {
      x: top.x + (bottom.x - top.x) * normalizedY,
      y: top.y + (bottom.y - top.y) * normalizedY,
    };
  };

  // Calcola gli scompartimenti in base ai 4 angoli
  const calculateCompartments = () => {
    if (corners.length !== 4) {
      alert('Devi selezionare tutti e 4 gli angoli del cassetto!');
      return;
    }

    const comps: Compartment[] = [];
    const compWidth = drawerWidth / cols;
    const compHeight = drawerDepth / rows;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        comps.push({
          x: col * compWidth,
          y: row * compHeight,
          width: compWidth,
          height: compHeight,
          row: row + 1,
          col: col + 1,
        });
      }
    }

    setCompartments(comps);
    setIsCapturing(true);
  };

  // Reset
  const reset = () => {
    setCorners([]);
    setCompartments([]);
    setIsCapturing(false);
  };

  // Conferma e salva la suddivisione
  const confirmCompartments = async () => {
    if (compartments.length === 0) {
      alert('Nessuno scomparto da salvare!');
      return;
    }

    if (!selectedDrawerId) {
      alert('Nessun cassetto selezionato! Inserisci l\'ID del cassetto (UDC) prima di confermare.');
      return;
    }

    setIsSaving(true);
    console.log('Scompartimenti da salvare:', compartments);
    console.log('Dimensioni cassetto:', { width: drawerWidth, depth: drawerDepth });

    try {
      // Salva ogni scomparto tramite API
      const savedCompartments = [];
      for (const comp of compartments) {
        try {
          const result = await drawersApi.createCompartment(selectedDrawerId, {
            xPosition: Math.round(comp.x * 10), // Convert cm to mm
            yPosition: Math.round(comp.y * 10), // Convert cm to mm
            width: Math.round(comp.width * 10), // Convert cm to mm
            depth: Math.round(comp.height * 10), // Convert cm to mm
          });
          savedCompartments.push(result);
          console.log(`✅ Scomparto ${comp.row},${comp.col} salvato:`, result);
        } catch (err) {
          console.error(`❌ Errore salvando scomparto ${comp.row},${comp.col}:`, err);
        }
      }

      alert(
        `Suddivisione completata!\n\n` +
        `✅ ${savedCompartments.length} scomparti salvati su ${compartments.length}\n` +
        `📐 Griglia: ${rows} righe × ${cols} colonne\n` +
        `📦 UDC: ${selectedDrawerId}`
      );

      // Torna alla pagina di gestione cassetti
      navigate('/drawers');
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      alert('Errore durante il salvataggio degli scompartimenti. Controlla la console per i dettagli.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CameraIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mappa Video Cassetti</h1>
                <p className="text-sm text-gray-600">
                  Rileva automaticamente gli scompartimenti usando la webcam
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/drawers')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
              Chiudi
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Feed Webcam
              {corners.length < 4 && (
                <span className="ml-3 text-sm text-blue-600">
                  Clicca sui 4 angoli del cassetto ({corners.length}/4)
                </span>
              )}
            </h2>

            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
                style={{ display: 'none' }}
              />
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                onClick={handleVideoClick}
                className="w-full h-auto cursor-crosshair"
              />

              {/* Overlay istruzioni */}
              {corners.length < 4 && (
                <div className="absolute top-4 left-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg">
                  <p className="font-semibold">
                    📍 Clicca sui 4 angoli del cassetto nell'ordine:
                  </p>
                  <ol className="mt-2 space-y-1 text-sm">
                    <li className={corners.length >= 1 ? 'opacity-50' : ''}>1. Angolo in alto a sinistra</li>
                    <li className={corners.length >= 2 ? 'opacity-50' : corners.length < 1 ? 'opacity-50' : ''}>
                      2. Angolo in alto a destra
                    </li>
                    <li className={corners.length >= 3 ? 'opacity-50' : corners.length < 2 ? 'opacity-50' : ''}>
                      3. Angolo in basso a destra
                    </li>
                    <li className={corners.length >= 4 ? 'opacity-50' : corners.length < 3 ? 'opacity-50' : ''}>
                      4. Angolo in basso a sinistra
                    </li>
                  </ol>
                </div>
              )}

              {/* Status badge */}
              {isCapturing && (
                <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                  <CheckIcon className="h-5 w-5" />
                  Scomparti rilevati
                </div>
              )}
            </div>

            {/* Azioni video */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Reset
              </button>

              <button
                onClick={calculateCompartments}
                disabled={corners.length !== 4}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Squares2X2Icon className="h-5 w-5" />
                Calcola Scomparti
              </button>

              <button
                onClick={confirmCompartments}
                disabled={compartments.length === 0 || isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckIcon className="h-5 w-5" />
                {isSaving ? 'Salvataggio...' : 'Conferma'}
              </button>
            </div>
          </div>

          {/* Configurazione */}
          <div className="space-y-6">
            {/* ID Cassetto */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cassetto (UDC)</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Cassetto / UDC
                </label>
                <input
                  type="number"
                  value={selectedDrawerId || ''}
                  onChange={(e) => setSelectedDrawerId(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Es: 1001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Inserisci l'ID del cassetto (UDC) per salvare gli scompartimenti rilevati
                </p>
              </div>
            </div>

            {/* Dimensioni cassetto */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dimensioni Cassetto</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Larghezza (cm)
                  </label>
                  <input
                    type="number"
                    value={drawerWidth}
                    onChange={(e) => setDrawerWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profondità (cm)
                  </label>
                  <input
                    type="number"
                    value={drawerDepth}
                    onChange={(e) => setDrawerDepth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Configurazione griglia */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Griglia Scomparti</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numero Righe
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rows}
                    onChange={(e) => setRows(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numero Colonne
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={cols}
                    onChange={(e) => setCols(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Totale scomparti:</span> {rows * cols}
                  </p>
                </div>
              </div>
            </div>

            {/* Riepilogo */}
            {compartments.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  Scomparti Rilevati
                </h3>
                <div className="space-y-2 text-sm text-green-800">
                  <p>
                    <span className="font-semibold">Totale:</span> {compartments.length}
                  </p>
                  <p>
                    <span className="font-semibold">Griglia:</span> {rows} x {cols}
                  </p>
                  <p>
                    <span className="font-semibold">Dimensioni cassetto:</span>{' '}
                    {drawerWidth} x {drawerDepth} cm
                  </p>
                  <p>
                    <span className="font-semibold">Dimensioni scomparto:</span>{' '}
                    {(drawerWidth / cols).toFixed(1)} x {(drawerDepth / rows).toFixed(1)} cm
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

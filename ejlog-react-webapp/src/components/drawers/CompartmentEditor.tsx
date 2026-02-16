// src/components/drawers/CompartmentEditor.jsx

import React, { useState, useRef, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  CheckIcon,
  XMarkIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { GridSubdivisionDialog } from './GridSubdivisionDialog';
import { generateGridCompartments, getCompartmentFillColor } from '../../utils/compartmentGrid';

/**
 * Compartment Editor for UDC Subdivision
 * Allows drawing new compartments on a loading unit in 2D view
 * Replicates Swing UI: UdcScompartazione functionality
 */
export function CompartmentEditor({  loadingUnit, compartments, onSave, onCancel  }: any): JSX.Element {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);
  const [draftCompartments, setDraftCompartments] = useState([]);
  const [selectedCompartmentIndex, setSelectedCompartmentIndex] = useState(null);
  const [mode, setMode] = useState('draw'); // 'draw', 'select', 'delete'
  const [showGridDialog, setShowGridDialog] = useState(false);

  const PADDING = 40;
  const MIN_COMPARTMENT_SIZE = 20; // Minimum size in pixels

  useEffect(() => {
    // Initialize draft compartments from existing ones
    if (compartments && compartments.length > 0) {
      setDraftCompartments(compartments.map(c => ({
        id: c.id,
        xPosition: c.xPosition,
        yPosition: c.yPosition,
        width: c.width,
        depth: c.depth,
        isNew: false
      })));
    }
  }, [compartments]);

  useEffect(() => {
    if (!canvasRef.current || !loadingUnit) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale - MUST MATCH CompartmentView2D.tsx scale calculation
    const availableWidth = canvas.width - (PADDING * 2);
    const availableHeight = canvas.height - (PADDING * 2);
    const scaleX = availableWidth / loadingUnit.width;
    const scaleY = availableHeight / loadingUnit.depth;
    // Use 98% of the minimum scale for maximum space usage while maintaining aspect ratio
    const scale = Math.min(scaleX, scaleY) * 0.98;

    // Draw loading unit outline
    const unitWidth = loadingUnit.width * scale;
    const unitDepth = loadingUnit.depth * scale;
    const unitX = PADDING;
    const unitY = PADDING;

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(unitX, unitY, unitWidth, unitDepth);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const gridStep = 50; // mm
    for (let x = gridStep; x < loadingUnit.width; x += gridStep) {
      const canvasX = unitX + (x * scale);
      ctx.beginPath();
      ctx.moveTo(canvasX, unitY);
      ctx.lineTo(canvasX, unitY + unitDepth);
      ctx.stroke();
    }
    for (let y = gridStep; y < loadingUnit.depth; y += gridStep) {
      const canvasY = unitY + (y * scale);
      ctx.beginPath();
      ctx.moveTo(unitX, canvasY);
      ctx.lineTo(unitX + unitWidth, canvasY);
      ctx.stroke();
    }

    // Draw existing compartments
    draftCompartments.forEach((compartment, index) => {
      const x = unitX + (compartment.xPosition * scale);
      const y = unitY + (compartment.yPosition * scale);
      const w = compartment.width * scale;
      const h = compartment.depth * scale;

      // Fill
      if (selectedCompartmentIndex === index) {
        ctx.fillStyle = compartment.isNew ? '#dbeafe' : '#fef3c7';
      } else {
        ctx.fillStyle = compartment.isNew ? '#eff6ff' : '#fef9c3';
      }
      ctx.fillRect(x, y, w, h);

      // Border
      ctx.strokeStyle = compartment.isNew ? '#3b82f6' : '#f59e0b';
      ctx.lineWidth = selectedCompartmentIndex === index ? 3 : 1.5;
      ctx.strokeRect(x, y, w, h);

      // Label
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = compartment.isNew ? 'NEW' : `#${compartment.id}`;
      ctx.fillText(label, x + w / 2, y + h / 2);
    });

    // Draw current drawing rectangle
    if (isDrawing && drawStart && drawCurrent) {
      const startX = Math.min(drawStart.x, drawCurrent.x);
      const startY = Math.min(drawStart.y, drawCurrent.y);
      const width = Math.abs(drawCurrent.x - drawStart.x);
      const height = Math.abs(drawCurrent.y - drawStart.y);

      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(startX, startY, width, height);

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(startX, startY, width, height);
      ctx.setLineDash([]);
    }

    // Draw dimensions
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${loadingUnit.width} mm`, unitX + unitWidth / 2, canvas.height - 10);
    ctx.save();
    ctx.translate(10, unitY + unitDepth / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${loadingUnit.depth} mm`, 0, 0);
    ctx.restore();

  }, [loadingUnit, draftCompartments, selectedCompartmentIndex, isDrawing, drawStart, drawCurrent]);

  const getCanvasCoords = (e) => {
    if (!canvasRef.current || !loadingUnit) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const availableWidth = canvas.width - (PADDING * 2);
    const availableHeight = canvas.height - (PADDING * 2);
    const scaleX = availableWidth / loadingUnit.width;
    const scaleY = availableHeight / loadingUnit.depth;
    // MUST MATCH the scale calculation in rendering - use 98% factor
    const scale = Math.min(scaleX, scaleY) * 0.98;

    const unitX = PADDING;
    const unitY = PADDING;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to loading unit coordinates (mm)
    const xMM = Math.max(0, Math.min(loadingUnit.width, (x - unitX) / scale));
    const yMM = Math.max(0, Math.min(loadingUnit.depth, (y - unitY) / scale));

    return { canvas: { x, y }, mm: { x: xMM, y: yMM }, scale };
  };

  const handleMouseDown = (e) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    if (mode === 'draw') {
      setIsDrawing(true);
      setDrawStart(coords.canvas);
      setDrawCurrent(coords.canvas);
    } else if (mode === 'select' || mode === 'delete') {
      // Find clicked compartment
      const clickedIndex = findCompartmentAtPoint(coords.mm.x, coords.mm.y);
      if (clickedIndex !== null) {
        if (mode === 'delete') {
          handleDeleteCompartment(clickedIndex);
        } else {
          setSelectedCompartmentIndex(clickedIndex);
        }
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    if (coords) {
      setDrawCurrent(coords.canvas);
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !drawStart || !drawCurrent) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const { scale } = coords;
    const unitX = PADDING;
    const unitY = PADDING;

    // Calculate compartment rectangle in canvas coordinates
    const canvasStartX = Math.min(drawStart.x, drawCurrent.x);
    const canvasStartY = Math.min(drawStart.y, drawCurrent.y);
    const canvasWidth = Math.abs(drawCurrent.x - drawStart.x);
    const canvasHeight = Math.abs(drawCurrent.y - drawStart.y);

    // Check minimum size in pixels
    if (canvasWidth >= MIN_COMPARTMENT_SIZE && canvasHeight >= MIN_COMPARTMENT_SIZE) {
      // Convert to mm coordinates relative to loading unit (0,0)
      const xPositionMM = (canvasStartX - unitX) / scale;
      const yPositionMM = (canvasStartY - unitY) / scale;
      const widthMM = canvasWidth / scale;
      const depthMM = canvasHeight / scale;

      // VALIDATION: Ensure compartment is fully contained within loading unit boundaries
      const clampedX = Math.max(0, Math.min(xPositionMM, loadingUnit.width));
      const clampedY = Math.max(0, Math.min(yPositionMM, loadingUnit.depth));

      // Calculate maximum allowed dimensions based on position
      const maxWidth = loadingUnit.width - clampedX;
      const maxDepth = loadingUnit.depth - clampedY;

      const clampedWidth = Math.max(1, Math.min(widthMM, maxWidth));
      const clampedDepth = Math.max(1, Math.min(depthMM, maxDepth));

      // Only create compartment if it has valid dimensions after clamping
      if (clampedWidth >= 10 && clampedDepth >= 10) { // Minimum 10mm in each dimension
        const newCompartment = {
          id: null, // Will be assigned by backend
          xPosition: Math.round(clampedX),
          yPosition: Math.round(clampedY),
          width: Math.round(clampedWidth),
          depth: Math.round(clampedDepth),
          isNew: true
        };

        // Final validation: check bounds one more time
        if (newCompartment.xPosition + newCompartment.width <= loadingUnit.width &&
            newCompartment.yPosition + newCompartment.depth <= loadingUnit.depth) {
          setDraftCompartments(prev => [...prev, newCompartment]);
        }
      }
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const findCompartmentAtPoint = (xMM, yMM) => {
    for (let i = draftCompartments.length - 1; i >= 0; i--) {
      const comp = draftCompartments[i];
      if (
        xMM >= comp.xPosition &&
        xMM <= comp.xPosition + comp.width &&
        yMM >= comp.yPosition &&
        yMM <= comp.yPosition + comp.depth
      ) {
        return i;
      }
    }
    return null;
  };

  const handleDeleteCompartment = (index) => {
    setDraftCompartments(prev => prev.filter((_, i) => i !== index));
    setSelectedCompartmentIndex(null);
  };

  const handleSave = () => {
    // Filter out only new compartments for saving
    const newCompartments = draftCompartments.filter(c => c.isNew);
    onSave(newCompartments);
  };

  const handleClear = () => {
    setDraftCompartments(draftCompartments.filter(c => !c.isNew));
    setSelectedCompartmentIndex(null);
  };

  const handleGridSubdivision = (rows: number, columns: number) => {
    const gridCompartments = generateGridCompartments(loadingUnit, { rows, columns });
    setDraftCompartments(prev => [...prev, ...gridCompartments]);
    setShowGridDialog(false);
  };

  if (!loadingUnit) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <Squares2X2Icon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Seleziona un cassetto per iniziare</p>
        </div>
      </div>
    );
  }

  const newCompartmentsCount = draftCompartments.filter(c => c.isNew).length;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Modalità:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setMode('draw')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  mode === 'draw'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <PlusIcon className="h-4 w-4 inline mr-1" />
                Disegna
              </button>
              <button
                onClick={() => setMode('select')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  mode === 'select'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ArrowsPointingOutIcon className="h-4 w-4 inline mr-1" />
                Seleziona
              </button>
              <button
                onClick={() => setMode('delete')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  mode === 'delete'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <TrashIcon className="h-4 w-4 inline mr-1" />
                Elimina
              </button>
              <button
                onClick={() => setShowGridDialog(true)}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ml-2"
              >
                <Squares2X2Icon className="h-4 w-4 inline mr-1" />
                Suddivisione Griglia
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {newCompartmentsCount} {newCompartmentsCount === 1 ? 'nuovo scomparto' : 'nuovi scomparti'}
            </span>
            {newCompartmentsCount > 0 && (
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancella Nuovi
              </button>
            )}
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <XMarkIcon className="h-4 w-4 inline mr-1" />
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={newCompartmentsCount === 0}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon className="h-4 w-4 inline mr-1" />
              Salva Suddivisione
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-2 text-xs text-gray-600">
          {mode === 'draw' && '✏️ Clicca e trascina per disegnare un nuovo scomparto'}
          {mode === 'select' && '👆 Clicca su uno scomparto per selezionarlo'}
          {mode === 'delete' && '🗑️ Clicca su uno scomparto per eliminarlo'}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4 overflow-auto">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-300 rounded-lg shadow-sm cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDrawing) {
              setIsDrawing(false);
              setDrawStart(null);
              setDrawCurrent(null);
            }
          }}
        />
      </div>

      {/* Info Panel */}
      {selectedCompartmentIndex !== null && (
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Scomparto Selezionato:</span>
            <div className="mt-2 grid grid-cols-4 gap-4">
              <div>
                <span className="text-gray-500">X:</span>
                <span className="ml-2 font-mono text-gray-900">
                  {draftCompartments[selectedCompartmentIndex].xPosition} mm
                </span>
              </div>
              <div>
                <span className="text-gray-500">Y:</span>
                <span className="ml-2 font-mono text-gray-900">
                  {draftCompartments[selectedCompartmentIndex].yPosition} mm
                </span>
              </div>
              <div>
                <span className="text-gray-500">Larghezza:</span>
                <span className="ml-2 font-mono text-gray-900">
                  {draftCompartments[selectedCompartmentIndex].width} mm
                </span>
              </div>
              <div>
                <span className="text-gray-500">Profondità:</span>
                <span className="ml-2 font-mono text-gray-900">
                  {draftCompartments[selectedCompartmentIndex].depth} mm
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Subdivision Dialog */}
      {showGridDialog && (
        <GridSubdivisionDialog
          loadingUnit={loadingUnit}
          onConfirm={handleGridSubdivision}
          onCancel={() => setShowGridDialog(false)}
        />
      )}
    </div>
  );
}

export default CompartmentEditor;

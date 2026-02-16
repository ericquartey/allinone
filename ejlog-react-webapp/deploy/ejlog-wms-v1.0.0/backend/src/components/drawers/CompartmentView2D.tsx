// src/components/drawers/CompartmentView2D.jsx

import React, { useState, useRef, useEffect } from 'react';
import { drawersApi } from '../../services/drawersApi';
import { getCompartmentColor, getCompartmentBorderColor, getContrastTextColor } from '../../utils/compartmentColors';

/**
 * 2D Compartment Visualization Component
 * Replicates Swing UI: UdcScompartazione
 * Renders compartments as rectangles with interactive features
 */
export function CompartmentView2D({  loadingUnit, compartments, onCompartmentSelect, onCompartmentUpdate  }: any): JSX.Element {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedCompartment, setSelectedCompartment] = useState(null);
  const [hoveredCompartment, setHoveredCompartment] = useState(null);
  const [showDimensions, setShowDimensions] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  // Dynamic canvas dimensions based on container - maximize space usage
  const padding = 40;

  // Update canvas dimensions when container resizes
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      // Use 95% of available space to maximize canvas size while ensuring visibility
      const maxWidth = Math.floor(rect.width - 40); // 40px margin total
      const maxHeight = Math.floor(rect.height - 40); // 40px margin total

      const width = Math.max(600, Math.min(1200, Math.floor(rect.width * 0.95)));
      const height = Math.max(450, Math.min(900, Math.floor(rect.height * 0.95)));

      setCanvasDimensions({
        width: Math.min(width, maxWidth),
        height: Math.min(height, maxHeight)
      });
    };

    // Initial dimensions with slight delay to ensure container is rendered
    setTimeout(updateDimensions, 100);

    // Listen for resize events
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    // Also listen for window resize
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const canvasWidth = canvasDimensions.width;
  const canvasHeight = canvasDimensions.height;

  useEffect(() => {
    if (!loadingUnit || !compartments || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Calculate scale to fit loading unit in canvas with proper margins
    const availableWidth = canvasWidth - 2 * padding;
    const availableHeight = canvasHeight - 2 * padding;

    // Use the actual loading unit dimensions (width and depth are in mm)
    const unitWidth = loadingUnit.width || 1000; // Default 1000mm if not set
    const unitDepth = loadingUnit.depth || 1000; // Default 1000mm if not set

    const scaleX = availableWidth / unitWidth;
    const scaleY = availableHeight / unitDepth;

    // Use 98% of the minimum scale for maximum space usage while maintaining aspect ratio
    const scale = Math.min(scaleX, scaleY) * 0.98;

    // Draw loading unit border (centered in canvas)
    const unitDrawWidth = unitWidth * scale;
    const unitDrawHeight = unitDepth * scale;
    const offsetX = padding + (availableWidth - unitDrawWidth) / 2;
    const offsetY = padding + (availableHeight - unitDrawHeight) / 2;

    ctx.strokeStyle = '#1f2937'; // gray-800
    ctx.lineWidth = 8; // Increased to 8 for very thick and visible border
    ctx.strokeRect(offsetX, offsetY, unitDrawWidth, unitDrawHeight);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb'; // gray-200
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      // Vertical grid lines every 100mm
      for (let x = 100; x < unitWidth; x += 100) {
        const pixelX = offsetX + x * scale;
        ctx.beginPath();
        ctx.moveTo(pixelX, offsetY);
        ctx.lineTo(pixelX, offsetY + unitDrawHeight);
        ctx.stroke();
      }

      // Horizontal grid lines every 100mm
      for (let y = 100; y < unitDepth; y += 100) {
        const pixelY = offsetY + y * scale;
        ctx.beginPath();
        ctx.moveTo(offsetX, pixelY);
        ctx.lineTo(offsetX + unitDrawWidth, pixelY);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

    // Draw compartments with proper scaling and clipping to loading unit boundaries
    if (compartments && compartments.length > 0) {
      // Save canvas state before clipping
      ctx.save();

      // Create clipping region for loading unit boundary
      ctx.beginPath();
      ctx.rect(offsetX, offsetY, unitDrawWidth, unitDrawHeight);
      ctx.clip();

      compartments.forEach((compartment, index) => {
        // Calculate compartment position and size with scale
        const compX = compartment.xPosition * scale;
        const compY = compartment.yPosition * scale;
        const compWidth = compartment.width * scale;
        const compHeight = compartment.depth * scale;

        // Skip compartments with invalid dimensions
        if (compWidth <= 0 || compHeight <= 0) {
          return;
        }

        // Final position with offset
        const x = offsetX + compX;
        const y = offsetY + compY;

        // Check if compartment has articles
        const hasArticles = (compartment.currentQuantity && compartment.currentQuantity > 0) ||
                           (compartment.products && compartment.products.length > 0) ||
                           (compartment.articleCode && compartment.articleCode.length > 0);

        // Get compartment color based on index and fill percentage
        const fillPercentage = compartment.fillPercentage || 0;
        const bgColor = getCompartmentColor(index, fillPercentage, hasArticles);
        const borderColor = hasArticles ? getCompartmentBorderColor(index) : '#9ca3af'; // gray-400 for empty
        const textColor = getContrastTextColor(bgColor);

        // Draw compartment background with color
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, compWidth, compHeight);

        // Draw compartment border (darker color for emphasis)
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, compWidth, compHeight);

        // Draw fill percentage indicator (darker overlay on bottom portion)
        if (fillPercentage > 0) {
          const fillHeight = (compHeight * fillPercentage) / 100;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Semi-transparent black overlay
          ctx.fillRect(x, y + compHeight - fillHeight, compWidth, fillHeight);
        }

        // Draw barcode and fill percentage text (centered in compartment)
        const fontSize = Math.max(10, Math.min(14, compWidth / 10));
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw barcode
        if (compartment.barcode || compartment.coordinate) {
          ctx.fillStyle = textColor;
          ctx.fillText(
            compartment.barcode || compartment.coordinate,
            x + compWidth / 2,
            y + compHeight / 2 - fontSize / 2
          );
        }

        // Draw fill percentage below barcode
        ctx.fillStyle = textColor;
        ctx.font = `${Math.max(9, fontSize - 2)}px sans-serif`;
        ctx.fillText(
          `${Math.round(fillPercentage)}%`,
          x + compWidth / 2,
          y + compHeight / 2 + fontSize / 2 + 4
        );

        // Highlight selected or hovered compartment
        if (selectedCompartment?.id === compartment.id) {
          ctx.strokeStyle = '#fbbf24'; // yellow-400
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, compWidth, compHeight);
        } else if (hoveredCompartment?.id === compartment.id) {
          ctx.strokeStyle = '#60a5fa'; // blue-400
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(x, y, compWidth, compHeight);
          ctx.setLineDash([]);
        }
      });

      // Restore canvas state (remove clipping)
      ctx.restore();
    }

    // Draw real dimensions on the canvas
    ctx.fillStyle = '#1f2937'; // gray-800
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw width dimension below the unit
    const widthText = `${unitWidth} mm`;
    ctx.fillText(widthText, offsetX + unitDrawWidth / 2, offsetY + unitDrawHeight + 20);

    // Draw depth dimension on the left side
    ctx.save();
    ctx.translate(offsetX - 20, offsetY + unitDrawHeight / 2);
    ctx.rotate(-Math.PI / 2);
    const depthText = `${unitDepth} mm`;
    ctx.fillText(depthText, 0, 0);
    ctx.restore();

    // Draw height dimension (if available) on the right side
    if (loadingUnit.height && loadingUnit.height > 0) {
      ctx.save();
      ctx.translate(offsetX + unitDrawWidth + 20, offsetY + unitDrawHeight / 2);
      ctx.rotate(-Math.PI / 2);
      const heightText = `H: ${loadingUnit.height} mm`;
      ctx.fillText(heightText, 0, 0);
      ctx.restore();
    }

  }, [loadingUnit, compartments, selectedCompartment, hoveredCompartment, showDimensions, showGrid, canvasWidth, canvasHeight]);

  const handleCanvasClick = (e) => {
    if (!loadingUnit || !compartments) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const availableWidth = canvasWidth - 2 * padding;
    const availableHeight = canvasHeight - 2 * padding;

    const unitWidth = loadingUnit.width || 1000;
    const unitDepth = loadingUnit.depth || 1000;

    const scaleX = availableWidth / unitWidth;
    const scaleY = availableHeight / unitDepth;
    const scale = Math.min(scaleX, scaleY) * 0.98;

    const unitDrawWidth = unitWidth * scale;
    const unitDrawHeight = unitDepth * scale;
    const offsetX = padding + (availableWidth - unitDrawWidth) / 2;
    const offsetY = padding + (availableHeight - unitDrawHeight) / 2;

    // Find clicked compartment
    for (const compartment of compartments) {
      const compX = compartment.xPosition * scale;
      const compY = compartment.yPosition * scale;
      const compWidth = compartment.width * scale;
      const compHeight = compartment.depth * scale;

      // Skip compartments with invalid dimensions
      if (compWidth <= 0 || compHeight <= 0) continue;

      const cx = offsetX + compX;
      const cy = offsetY + compY;

      if (x >= cx && x <= cx + compWidth && y >= cy && y <= cy + compHeight) {
        setSelectedCompartment(compartment);
        if (onCompartmentSelect) {
          onCompartmentSelect(compartment);
        }
        return;
      }
    }

    // Clicked outside compartments
    setSelectedCompartment(null);
    if (onCompartmentSelect) {
      onCompartmentSelect(null);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!loadingUnit || !compartments) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const availableWidth = canvasWidth - 2 * padding;
    const availableHeight = canvasHeight - 2 * padding;

    const unitWidth = loadingUnit.width || 1000;
    const unitDepth = loadingUnit.depth || 1000;

    const scaleX = availableWidth / unitWidth;
    const scaleY = availableHeight / unitDepth;
    const scale = Math.min(scaleX, scaleY) * 0.98;

    const unitDrawWidth = unitWidth * scale;
    const unitDrawHeight = unitDepth * scale;
    const offsetX = padding + (availableWidth - unitDrawWidth) / 2;
    const offsetY = padding + (availableHeight - unitDrawHeight) / 2;

    // Find hovered compartment with boundary validation
    let found = false;
    for (const compartment of compartments) {
      const compX = compartment.xPosition * scale;
      const compY = compartment.yPosition * scale;
      const compWidth = compartment.width * scale;
      const compHeight = compartment.depth * scale;

      // Skip compartments with invalid dimensions
      if (compWidth <= 0 || compHeight <= 0) continue;

      const cx = offsetX + compX;
      const cy = offsetY + compY;

      if (x >= cx && x <= cx + compWidth && y >= cy && y <= cy + compHeight) {
        setHoveredCompartment(compartment);
        canvas.style.cursor = 'pointer';
        found = true;
        return;
      }
    }

    if (!found) {
      setHoveredCompartment(null);
      canvas.style.cursor = 'default';
    }
  };

  if (!loadingUnit) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">Seleziona un cassetto per visualizzare gli scomparti</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900">
              {loadingUnit.code} - {loadingUnit.description || 'Cassetto'}
            </h3>
            <span className="text-sm text-gray-500">
              {compartments?.length || 0} scomparti
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                showGrid
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Griglia
            </button>
            <button
              onClick={() => setShowDimensions(!showDimensions)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                showDimensions
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dimensioni
            </button>
          </div>
        </div>

        {/* Dimensioni reali cassetto dal database */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">Dimensioni:</span>
            <span className="font-mono">
              {loadingUnit.width || 0} × {loadingUnit.depth || 0} × {loadingUnit.height || 0} mm
            </span>
            <span className="text-gray-400">(L × P × H)</span>
          </div>
          {loadingUnit.weight && loadingUnit.weight > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Peso:</span>
              <span className="font-mono">{loadingUnit.weight} kg</span>
            </div>
          )}
          {loadingUnit.productsCount && loadingUnit.productsCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Prodotti:</span>
              <span className="font-mono">{loadingUnit.productsCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 p-4 flex items-center justify-center"
        style={{
          overflow: 'hidden',
          minHeight: 0,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          className="border border-gray-300 rounded-lg shadow-sm"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'block'
          }}
        />
      </div>

      {/* Selected compartment info */}
      {selectedCompartment && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">ID:</span>
              <span className="ml-2 text-gray-900">{selectedCompartment.id}</span>
            </div>
            {selectedCompartment.barcode && (
              <div>
                <span className="font-medium text-gray-700">Barcode:</span>
                <span className="ml-2 text-gray-900 font-mono">{selectedCompartment.barcode}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Posizione:</span>
              <span className="ml-2 text-gray-900">
                X:{selectedCompartment.xPosition} Y:{selectedCompartment.yPosition}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Dimensioni:</span>
              <span className="ml-2 text-gray-900">
                {selectedCompartment.width}x{selectedCompartment.depth} mm
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Riempimento:</span>
              <span className="ml-2 text-gray-900">{selectedCompartment.fillPercentage}%</span>
            </div>
            {selectedCompartment.products && (
              <div>
                <span className="font-medium text-gray-700">Prodotti:</span>
                <span className="ml-2 text-gray-900">{selectedCompartment.products.length}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

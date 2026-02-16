// ============================================================================
// EJLOG WMS - Warehouse Map Viewer Component
// Interactive SVG-based warehouse map with occupancy heatmap and navigation
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../shared/Button';
import Select from '../shared/Select';
import Spinner from '../shared/Spinner';
import Alert from '../shared/Alert';
import {
  useGetWarehouseMapQuery,
  useGetOccupancyHeatmapQuery,
} from '../../services/api/locationApi';
import { Location, Zone, LocationStatusColors } from '../../types/location';

interface WarehouseMapViewerProps {
  warehouseId: string;
  zoneId?: string;
  showOccupancyHeatmap?: boolean;
  onLocationClick?: (location: Location) => void;
}

type ViewMode = 'zones' | 'locations' | 'heatmap';

const WarehouseMapViewer: React.FC<WarehouseMapViewerProps> = ({
  warehouseId,
  zoneId,
  showOccupancyHeatmap = true,
  onLocationClick,
}) => {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('zones');
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>(zoneId);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // API queries
  const {
    data: mapData,
    isLoading,
    error,
  } = useGetWarehouseMapQuery({
    warehouseId,
    zoneId: selectedZoneId,
    includeOccupancy: true,
    includeSignals: false,
  });

  const {
    data: heatmapData,
  } = useGetOccupancyHeatmapQuery(
    { warehouseId, zoneId: selectedZoneId },
    { skip: !showOccupancyHeatmap || viewMode !== 'heatmap' }
  );

  // SVG viewport dimensions
  const viewportWidth = 1200;
  const viewportHeight = 800;
  const padding = 50;

  // Calculate bounds from map data
  const calculateBounds = () => {
    if (!mapData || mapData.locations.length === 0) {
      return { minX: 0, minY: 0, maxX: viewportWidth, maxY: viewportHeight };
    }

    const xs = mapData.locations.map(l => l.coordinates.x);
    const ys = mapData.locations.map(l => l.coordinates.y);

    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };
  };

  const bounds = calculateBounds();
  const worldWidth = bounds.maxX - bounds.minX || viewportWidth;
  const worldHeight = bounds.maxY - bounds.minY || viewportHeight;

  // Transform world coordinates to SVG coordinates
  const worldToSVG = (x: number, y: number) => {
    const scaleX = (viewportWidth - 2 * padding) / worldWidth;
    const scaleY = (viewportHeight - 2 * padding) / worldHeight;
    const scale = Math.min(scaleX, scaleY);

    return {
      x: padding + (x - bounds.minX) * scale,
      y: padding + (y - bounds.minY) * scale,
    };
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.5));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Get color for occupancy heatmap
  const getHeatmapColor = (occupancyPercent: number): string => {
    if (occupancyPercent >= 90) return '#dc2626'; // red-600
    if (occupancyPercent >= 75) return '#f59e0b'; // amber-500
    if (occupancyPercent >= 50) return '#fbbf24'; // yellow-400
    if (occupancyPercent >= 25) return '#34d399'; // green-400
    return '#10b981'; // green-500
  };

  // Get status color
  const getStatusColor = (location: Location): string => {
    const color = LocationStatusColors[location.status];
    const colorMap = {
      green: '#10b981',
      blue: '#3b82f6',
      yellow: '#fbbf24',
      red: '#ef4444',
      orange: '#f97316',
      purple: '#a855f7',
    };
    return colorMap[color] || '#6b7280';
  };

  // Render zone rectangles
  const renderZones = () => {
    if (!mapData || !mapData.zones) return null;

    return mapData.zones.map((zone) => {
      const topLeft = worldToSVG(zone.coordinates.x1, zone.coordinates.y1);
      const bottomRight = worldToSVG(zone.coordinates.x2, zone.coordinates.y2);
      const width = bottomRight.x - topLeft.x;
      const height = bottomRight.y - topLeft.y;

      return (
        <g key={zone.id}>
          <rect
            x={topLeft.x}
            y={topLeft.y}
            width={width}
            height={height}
            fill={zone.color || '#e5e7eb'}
            fillOpacity="0.3"
            stroke="#374151"
            strokeWidth="2"
            className="cursor-pointer hover:fill-opacity-50 transition-all"
            onClick={() => {
              setSelectedZoneId(zone.id);
              setViewMode('locations');
            }}
          />
          <text
            x={topLeft.x + width / 2}
            y={topLeft.y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="18"
            fontWeight="bold"
            fill="#1f2937"
            className="pointer-events-none"
          >
            {zone.name}
          </text>
          <text
            x={topLeft.x + width / 2}
            y={topLeft.y + height / 2 + 25}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
            className="pointer-events-none"
          >
            {zone.availableLocations}/{zone.totalLocations} disponibili
          </text>
        </g>
      );
    });
  };

  // Render location markers
  const renderLocations = () => {
    if (!mapData || !mapData.locations) return null;

    const locationSize = 20 / zoom; // Scale inversely with zoom

    return mapData.locations.map((location) => {
      const pos = worldToSVG(location.coordinates.x, location.coordinates.y);
      const color = getStatusColor(location);

      return (
        <g key={location.id}>
          <circle
            cx={pos.x}
            cy={pos.y}
            r={locationSize}
            fill={color}
            stroke="#ffffff"
            strokeWidth="2"
            className="cursor-pointer hover:stroke-black transition-all"
            onClick={() => {
              if (onLocationClick) {
                onLocationClick(location);
              } else {
                navigate(`/locations/${location.code}`);
              }
            }}
          >
            <title>
              {location.code}
              {'\n'}Status: {location.status}
              {'\n'}Utilization: {location.capacity.utilizationPercent.toFixed(1)}%
              {location.isOccupied && location.occupancy
                ? `\nUDC: ${location.occupancy.udcBarcode}`
                : ''}
            </title>
          </circle>
          {zoom > 1.5 && (
            <text
              x={pos.x}
              y={pos.y + locationSize + 15}
              textAnchor="middle"
              fontSize={Math.max(10, 12 / zoom)}
              fill="#1f2937"
              className="pointer-events-none"
            >
              {location.code}
            </text>
          )}
        </g>
      );
    });
  };

  // Render occupancy heatmap
  const renderHeatmap = () => {
    if (!mapData || !heatmapData) return null;

    return mapData.locations.map((location) => {
      const heatmapEntry = heatmapData.find(h => h.locationId === location.id);
      const occupancyPercent = heatmapEntry?.occupancyPercent || 0;
      const pos = worldToSVG(location.coordinates.x, location.coordinates.y);
      const color = getHeatmapColor(occupancyPercent);
      const size = 25 / zoom;

      return (
        <g key={location.id}>
          <rect
            x={pos.x - size / 2}
            y={pos.y - size / 2}
            width={size}
            height={size}
            fill={color}
            fillOpacity="0.8"
            stroke="#ffffff"
            strokeWidth="1"
            className="cursor-pointer hover:stroke-black transition-all"
            onClick={() => {
              if (onLocationClick) {
                onLocationClick(location);
              } else {
                navigate(`/locations/${location.code}`);
              }
            }}
          >
            <title>
              {location.code}
              {'\n'}Occupancy: {occupancyPercent.toFixed(1)}%
            </title>
          </rect>
        </g>
      );
    });
  };

  // Render legend
  const renderLegend = () => {
    if (viewMode === 'heatmap') {
      return (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">Occupancy Heatmap</p>
          <div className="space-y-1">
            {[
              { label: '0-25%', color: '#10b981' },
              { label: '25-50%', color: '#34d399' },
              { label: '50-75%', color: '#fbbf24' },
              { label: '75-90%', color: '#f59e0b' },
              { label: '90-100%', color: '#dc2626' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-2">Status Legend</p>
        <div className="space-y-1">
          {[
            { label: 'Available', color: '#10b981' },
            { label: 'Occupied', color: '#3b82f6' },
            { label: 'Reserved', color: '#fbbf24' },
            { label: 'Blocked', color: '#ef4444' },
            { label: 'Maintenance', color: '#f97316' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <p className="font-semibold">Error loading warehouse map</p>
        <p className="text-sm mt-1">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </Alert>
    );
  }

  if (!mapData) {
    return (
      <Alert variant="warning">
        <p className="font-semibold">No map data available</p>
        <p className="text-sm mt-1">Please select a warehouse</p>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">View Mode</label>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'zones' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('zones')}
              >
                🗺️ Zones
              </Button>
              <Button
                variant={viewMode === 'locations' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('locations')}
                disabled={!selectedZoneId}
              >
                📍 Locations
              </Button>
              <Button
                variant={viewMode === 'heatmap' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('heatmap')}
                disabled={!selectedZoneId}
              >
                🔥 Heatmap
              </Button>
            </div>
          </div>

          {selectedZoneId && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Zone</label>
              <Select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value || undefined)}
                options={[
                  { value: '', label: 'All zones' },
                  ...(mapData.zones?.map(z => ({ value: z.id, label: z.name })) || []),
                ]}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Zoom Controls</label>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleZoomOut}>
              ➖ Out
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomReset}>
              ↻ Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomIn}>
              ➕ In
            </Button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          width="100%"
          height={viewportHeight}
          viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
          className="cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Background grid */}
            <defs>
              <pattern
                id="grid"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width={viewportWidth} height={viewportHeight} fill="url(#grid)" />

            {/* Content based on view mode */}
            {viewMode === 'zones' && renderZones()}
            {viewMode === 'locations' && renderLocations()}
            {viewMode === 'heatmap' && renderHeatmap()}
          </g>
        </svg>

        {/* Legend */}
        {renderLegend()}

        {/* Info Overlay */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-gray-900">{mapData.warehouse.name}</p>
            <p className="text-gray-600">
              Total Locations: {mapData.warehouse.totalLocations}
            </p>
            <p className="text-gray-600">
              Available: {mapData.warehouse.availableLocations}
            </p>
            <p className="text-gray-600">
              Occupied: {mapData.warehouse.occupiedLocations}
            </p>
            <p className="text-gray-500 mt-2">
              Zoom: {zoom.toFixed(1)}x | Pan: ({pan.x.toFixed(0)}, {pan.y.toFixed(0)})
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600">Total Zones</p>
          <p className="text-xl font-bold text-blue-900">{mapData.zones?.length || 0}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600">Total Locations</p>
          <p className="text-xl font-bold text-green-900">{mapData.locations.length}</p>
        </div>
        <div className="p-3 bg-orange-50 rounded-lg">
          <p className="text-xs text-orange-600">Avg Occupancy</p>
          <p className="text-xl font-bold text-orange-900">
            {mapData.locations.length > 0
              ? (
                  mapData.locations.reduce(
                    (sum, l) => sum + l.capacity.utilizationPercent,
                    0
                  ) / mapData.locations.length
                ).toFixed(1)
              : 0}
            %
          </p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-purple-600">Occupied</p>
          <p className="text-xl font-bold text-purple-900">
            {mapData.locations.filter(l => l.isOccupied).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WarehouseMapViewer;

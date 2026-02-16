// src/components/drawers/CompartmentView3D.jsx

import React, { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Text, Html } from '@react-three/drei';
import { drawersApi } from '../../services/drawersApi';
import { getCompartmentColor, getCompartmentBorderColor } from '../../utils/compartmentColors';
import * as THREE from 'three';

/**
 * Individual 3D Compartment Component
 */
function Compartment3DBox({  compartment, compartmentIndex, isSelected, isHovered, onClick, scale = 0.01, loadingUnit  }: any): JSX.Element {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Check if compartment has articles
  const hasArticles = (compartment.currentQuantity && compartment.currentQuantity > 0) ||
                     (compartment.products && compartment.products.length > 0) ||
                     (compartment.articleCode && compartment.articleCode.length > 0);

  // Get color based on compartment index and fill percentage
  const fillPercentage = compartment.fillPercentage || 0;
  const bgColor = getCompartmentColor(compartmentIndex, fillPercentage, hasArticles);
  const borderColor = hasArticles ? getCompartmentBorderColor(compartmentIndex) : '#9ca3af';

  // Pulse animation for selected compartment
  useFrame((state) => {
    if (isSelected && meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.05 + 1;
      meshRef.current.scale.set(pulse, pulse, pulse);
    } else if (meshRef.current) {
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  // Validate and clamp compartment dimensions to stay within loading unit bounds
  const maxWidth = loadingUnit.width;
  const maxDepth = loadingUnit.depth;

  // Ensure compartment doesn't exceed loading unit boundaries
  const clampedXPos = Math.max(0, Math.min(compartment.xPosition, maxWidth - compartment.width));
  const clampedYPos = Math.max(0, Math.min(compartment.yPosition, maxDepth - compartment.depth));
  const clampedWidth = Math.min(compartment.width, maxWidth - clampedXPos);
  const clampedDepth = Math.min(compartment.depth, maxDepth - clampedYPos);

  const position = [
    (clampedXPos + clampedWidth / 2) * scale,
    50 * scale, // Fixed height for all compartments
    (clampedYPos + clampedDepth / 2) * scale
  ];

  const size = [
    clampedWidth * scale,
    100 * scale, // Fixed height
    clampedDepth * scale
  ];

  return (
    <group>
      <Box
        ref={meshRef}
        args={size}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onClick(compartment);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={bgColor}
          opacity={isHovered || hovered ? 0.95 : 0.85}
          transparent
          emissive={isSelected ? '#fbbf24' : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0}
          roughness={0.7}
          metalness={0.2}
        />
      </Box>

      {/* Edge wireframe */}
      <Box
        args={size}
        position={position}
      >
        <meshBasicMaterial
          color={isSelected ? '#fbbf24' : isHovered || hovered ? '#60a5fa' : borderColor}
          wireframe
          opacity={0.8}
          transparent
        />
      </Box>

      {/* Fill percentage label */}
      {(isHovered || hovered || isSelected) && (
        <Html position={[position[0], position[1] + size[1] / 2 + 20 * scale, position[2]]}>
          <div className="bg-white px-2 py-1 rounded shadow-lg border border-gray-200 text-xs whitespace-nowrap">
            <div className="font-bold">{compartment.fillPercentage}%</div>
            {compartment.barcode && (
              <div className="text-gray-600 font-mono">{compartment.barcode}</div>
            )}
            {compartment.products && compartment.products.length > 0 && (
              <div className="text-gray-500">{compartment.products.length} prodotti</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Loading Unit 3D Frame
 */
function LoadingUnit3DFrame({  loadingUnit, scale = 0.01  }: any): JSX.Element {
  const width = loadingUnit.width * scale;
  const height = 200 * scale; // Fixed height for visualization
  const depth = loadingUnit.depth * scale;

  // Frame edges
  const frameColor = '#1f2937';
  const frameThickness = 2 * scale;

  return (
    <group>
      {/* Bottom frame */}
      <Box args={[width, frameThickness, frameThickness]} position={[width / 2, 0, 0]}>
        <meshBasicMaterial color={frameColor} />
      </Box>
      <Box args={[width, frameThickness, frameThickness]} position={[width / 2, 0, depth]}>
        <meshBasicMaterial color={frameColor} />
      </Box>
      <Box args={[frameThickness, frameThickness, depth]} position={[0, 0, depth / 2]}>
        <meshBasicMaterial color={frameColor} />
      </Box>
      <Box args={[frameThickness, frameThickness, depth]} position={[width, 0, depth / 2]}>
        <meshBasicMaterial color={frameColor} />
      </Box>

      {/* Top frame */}
      <Box args={[width, frameThickness, frameThickness]} position={[width / 2, height, 0]}>
        <meshBasicMaterial color={frameColor} />
      </Box>
      <Box args={[width, frameThickness, frameThickness]} position={[width / 2, height, depth]}>
        <meshBasicMaterial color={frameColor} />
      </Box>
      <Box args={[frameThickness, frameThickness, depth]} position={[0, height, depth / 2]}>
        <meshBasicMaterial color={frameColor} />
      </Box>
      <Box args={[frameThickness, frameThickness, depth]} position={[width, height, depth / 2]}>
        <meshBasicMaterial color={frameColor} />
      </Box>

      {/* Vertical edges */}
      <Box args={[frameThickness, height, frameThickness]} position={[0, height / 2, 0]}>
        <meshBasicMaterial color={frameColor} />
      </Box>
      <Box args={[frameThickness, height, frameThickness]} position={[width, height / 2, 0]}>
        <meshBasicMaterial color={frameColor} />
      </Box>
      <Box args={[frameThickness, height, frameThickness]} position={[0, height / 2, depth]}>
        <meshBasicMaterial color={frameColor} />
      </Box>
      <Box args={[frameThickness, height, frameThickness]} position={[width, height / 2, depth]}>
        <meshBasicMaterial color={frameColor} />
      </Box>

      {/* Dimension labels */}
      <Html position={[width / 2, -10 * scale, -10 * scale]}>
        <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-mono">
          {loadingUnit.width} mm
        </div>
      </Html>
      <Html position={[-10 * scale, -10 * scale, depth / 2]}>
        <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-mono">
          {loadingUnit.depth} mm
        </div>
      </Html>
    </group>
  );
}

/**
 * Grid Helper
 */
function GridFloor({  loadingUnit, scale = 0.01  }: any): JSX.Element {
  const gridSize = Math.max(loadingUnit.width, loadingUnit.depth) * scale * 1.5;
  const divisions = 20;

  return (
    <gridHelper
      args={[gridSize, divisions, '#9ca3af', '#d1d5db']}
      position={[loadingUnit.width * scale / 2, 0, loadingUnit.depth * scale / 2]}
    />
  );
}

/**
 * Main 3D Visualization Scene
 */
function Scene({  loadingUnit, compartments, selectedCompartment, hoveredCompartment, onCompartmentClick  }: any): JSX.Element {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, 10, -5]} intensity={0.4} />
      <pointLight position={[0, 20, 0]} intensity={0.5} />

      {/* Grid */}
      <GridFloor loadingUnit={loadingUnit} />

      {/* Loading Unit Frame */}
      <LoadingUnit3DFrame loadingUnit={loadingUnit} />

      {/* Compartments */}
      {compartments && compartments.map((compartment, index) => (
        <Compartment3DBox
          key={compartment.id}
          compartment={compartment}
          compartmentIndex={index}
          loadingUnit={loadingUnit}
          isSelected={selectedCompartment?.id === compartment.id}
          isHovered={hoveredCompartment?.id === compartment.id}
          onClick={onCompartmentClick}
        />
      ))}

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

/**
 * Main 3D Compartment View Component
 */
export function CompartmentView3D({  loadingUnit, compartments, onCompartmentSelect  }: any): JSX.Element {
  const [selectedCompartment, setSelectedCompartment] = useState(null);
  const [hoveredCompartment, setHoveredCompartment] = useState(null);
  const [viewMode, setViewMode] = useState('perspective'); // perspective, top, front, side

  const handleCompartmentClick = (compartment) => {
    setSelectedCompartment(compartment);
    if (onCompartmentSelect) {
      onCompartmentSelect(compartment);
    }
  };

  if (!loadingUnit) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">Seleziona un cassetto per visualizzare in 3D</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-900">Vista 3D</h3>
          <span className="text-sm text-gray-500">
            {compartments?.length || 0} scomparti
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('perspective')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === 'perspective'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            3D
          </button>
          <button
            onClick={() => setViewMode('top')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === 'top'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Dall'alto
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 bg-gradient-to-b from-gray-50 to-gray-100">
        <Canvas
          camera={{
            position: viewMode === 'top'
              ? [loadingUnit.width * 0.005, 20, loadingUnit.depth * 0.005]
              : [loadingUnit.width * 0.015, 10, loadingUnit.depth * 0.015],
            fov: 50
          }}
          shadows
        >
          <Suspense fallback={null}>
            <Scene
              loadingUnit={loadingUnit}
              compartments={compartments}
              selectedCompartment={selectedCompartment}
              hoveredCompartment={hoveredCompartment}
              onCompartmentClick={handleCompartmentClick}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Controls help */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-6 text-xs text-gray-600">
          <span>🖱️ Click sinistro + trascina: ruota</span>
          <span>🖱️ Click destro + trascina: sposta</span>
          <span>⚙️ Scroll: zoom</span>
        </div>
      </div>

      {/* Selected compartment info */}
      {selectedCompartment && (
        <div className="px-4 py-3 border-t border-gray-200 bg-blue-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="font-medium text-blue-900">ID:</span>
              <span className="ml-2 text-blue-700">{selectedCompartment.id}</span>
            </div>
            {selectedCompartment.barcode && (
              <div>
                <span className="font-medium text-blue-900">Barcode:</span>
                <span className="ml-2 text-blue-700 font-mono">{selectedCompartment.barcode}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-blue-900">Riempimento:</span>
              <span className="ml-2 text-blue-700">{selectedCompartment.fillPercentage}%</span>
            </div>
            {selectedCompartment.products && (
              <div>
                <span className="font-medium text-blue-900">Prodotti:</span>
                <span className="ml-2 text-blue-700">{selectedCompartment.products.length}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

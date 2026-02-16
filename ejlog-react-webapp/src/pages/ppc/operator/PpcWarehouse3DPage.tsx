/**
 * =============================================================================
 * Ferretto Vertical Warehouse 3D Visualization
 * =============================================================================
 *
 * Visualizzazione 3D isometrica del magazzino verticale Ferretto
 * Basato su: C:\F_WMS\VerticalWarehouses XAML project
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetMissionsQuery,
  useGetCellsQuery,
  useGetElevatorPositionQuery,
} from '../../../services/api/ppcAutomationApi';
import type { Mission, Cell as ApiCell, ElevatorPosition } from '../../../services/ppc/automationTypes';

// =============================================================================
// CONFIGURAZIONE MAGAZZINO
// =============================================================================

const WAREHOUSE = {
  // Dimensioni in millimetri
  width: 2000,      // Larghezza (asse Z)
  depth: 1600,      // Profondità (asse X)
  height: 12000,    // Altezza totale (asse Y)

  // Configurazione celle
  numCells: 40,
  cellHeight: 300,  // Altezza di ogni cella

  // Configurazione piani
  numFloors: 10,
  floorHeight: 1200, // Altezza piano

  // Scala rendering (pixel per mm)
  scale: 0.05,
};

// =============================================================================
// FUNZIONI ISOMETRICHE
// =============================================================================

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Point2D {
  x: number;
  y: number;
}

/**
 * Converte coordinate 3D in coordinate 2D isometriche
 */
const toIsometric = (x: number, y: number, z: number): Point2D => {
  const angle = Math.PI / 6; // 30 gradi

  // Scala da mm a pixel
  const px = x * WAREHOUSE.scale;
  const py = y * WAREHOUSE.scale;
  const pz = z * WAREHOUSE.scale;

  // Proiezione isometrica
  const isoX = (px - pz) * Math.cos(angle);
  const isoY = (px + pz) * Math.sin(angle) - py;

  // Offset per centrare nella vista
  return {
    x: isoX + 600,
    y: 700 - isoY,
  };
};

// =============================================================================
// COMPONENTE PRINCIPALE
// =============================================================================

const PpcWarehouse3DPage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const [animationFrame, setAnimationFrame] = useState(0);

  // Fetch dati reali
  const { data: missions = [] } = useGetMissionsQuery(undefined, {
    pollingInterval: 2000,
  });

  const { data: cells = [] } = useGetCellsQuery(undefined, {
    pollingInterval: 5000,
  });

  const { data: elevatorPos } = useGetElevatorPositionQuery(undefined, {
    pollingInterval: 1000,
  });

  // Trova missione corrente
  const mission = missions.find(m => m.Id === parseInt(missionId ?? '0', 10)) ?? null;

  // Animazione a 30 FPS
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 3600);
    }, 33);
    return () => clearInterval(interval);
  }, []);

  if (!mission) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
        <h2>Missione non trovata</h2>
        <button onClick={() => navigate('/ppc/operator/missions')} style={{ marginTop: '20px', padding: '10px 20px' }}>
          ← Torna alle Missioni
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/ppc/operator/missions')}
          style={{
            padding: '10px 20px',
            background: '#2a2d4a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          ← Torna alle Missioni
        </button>
        <h1 style={{ color: '#fff', margin: 0 }}>Magazzino Verticale 3D - Missione #{mission.Id}</h1>
        <div style={{ padding: '10px 20px', background: '#4caf50', borderRadius: '20px', color: '#fff', fontWeight: 'bold' }}>
          ATTIVA
        </div>
      </div>

      {/* Canvas 3D */}
      <div style={{
        background: 'linear-gradient(135deg, #1e2139 0%, #2a2d4a 100%)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
      }}>
        <svg width="1200" height="800" style={{ display: 'block', margin: '0 auto' }}>
          <defs>
            {/* Gradients per elevatore */}
            <linearGradient id="elevatorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#607d8b" />
              <stop offset="100%" stopColor="#37474f" />
            </linearGradient>
          </defs>

          {/* STRUTTURA SCHELETRICA */}
          <WarehouseStructure />

          {/* CELLE */}
          <Cells cells={cells} mission={mission} />

          {/* ELEVATORE */}
          <Elevator mission={mission} elevatorPos={elevatorPos} animationFrame={animationFrame} />

          {/* BAIE */}
          <Bays mission={mission} />
        </svg>

        {/* Info missione */}
        <div style={{ marginTop: '20px', color: '#fff', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ padding: '15px', background: 'rgba(13, 110, 253, 0.2)', borderRadius: '10px', flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#adb5bd', marginBottom: '5px' }}>STEP CORRENTE</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{mission.Step ?? 'N/A'}</div>
          </div>
          <div style={{ padding: '15px', background: 'rgba(13, 110, 253, 0.2)', borderRadius: '10px', flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#adb5bd', marginBottom: '5px' }}>ELEVATORE Y</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{elevatorPos?.Vertical ?? 0} mm</div>
          </div>
          <div style={{ padding: '15px', background: 'rgba(13, 110, 253, 0.2)', borderRadius: '10px', flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#adb5bd', marginBottom: '5px' }}>ELEVATORE X</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{elevatorPos?.Horizontal ?? 0} mm</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: STRUTTURA SCHELETRICA
// =============================================================================

const WarehouseStructure: React.FC = () => {
  const { width, depth, height, numFloors, floorHeight } = WAREHOUSE;

  // 4 colonne verticali (angoli)
  const columns: Point3D[] = [
    { x: -depth/2, y: 0, z: -width/2 },
    { x: -depth/2, y: 0, z: width/2 },
    { x: depth/2, y: 0, z: -width/2 },
    { x: depth/2, y: 0, z: width/2 },
  ];

  return (
    <g opacity="0.4">
      {/* COLONNE VERTICALI */}
      {columns.map((col, idx) => {
        const bottom = toIsometric(col.x, 0, col.z);
        const top = toIsometric(col.x, height, col.z);

        return (
          <line
            key={`col-${idx}`}
            x1={bottom.x}
            y1={bottom.y}
            x2={top.x}
            y2={top.y}
            stroke="#888"
            strokeWidth="2"
          />
        );
      })}

      {/* TRAVI ORIZZONTALI - Ogni piano */}
      {Array.from({ length: numFloors + 1 }).map((_, floorIdx) => {
        const y = floorIdx * floorHeight;

        return (
          <g key={`floor-${floorIdx}`}>
            {/* Trave frontale */}
            {(() => {
              const p1 = toIsometric(-depth/2, y, -width/2);
              const p2 = toIsometric(-depth/2, y, width/2);
              return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#666" strokeWidth="1.5" />;
            })()}

            {/* Trave posteriore */}
            {(() => {
              const p1 = toIsometric(depth/2, y, -width/2);
              const p2 = toIsometric(depth/2, y, width/2);
              return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#555" strokeWidth="1.5" />;
            })()}

            {/* Trave sinistra */}
            {(() => {
              const p1 = toIsometric(-depth/2, y, -width/2);
              const p2 = toIsometric(depth/2, y, -width/2);
              return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#555" strokeWidth="1.5" />;
            })()}

            {/* Trave destra */}
            {(() => {
              const p1 = toIsometric(-depth/2, y, width/2);
              const p2 = toIsometric(depth/2, y, width/2);
              return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#555" strokeWidth="1.5" />;
            })()}
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// COMPONENTE: CELLE
// =============================================================================

interface CellsProps {
  cells: ApiCell[];
  mission: Mission;
}

const Cells: React.FC<CellsProps> = ({ cells, mission }) => {
  const { numCells, cellHeight, depth } = WAREHOUSE;

  return (
    <g>
      {Array.from({ length: numCells }).map((_, idx) => {
        const cellId = idx + 1;
        const yPos = idx * cellHeight + 500; // Start 500mm from bottom

        // Alterna fronte/retro
        const isFront = idx % 2 === 0;
        const xPos = isFront ? -depth/2 + 100 : depth/2 - 100;

        const iso = toIsometric(xPos, yPos, 0);

        // Stato cella dall'API
        const apiCell = cells[idx];
        const isFree = apiCell?.IsFree ?? true;
        const isTarget = cellId === mission.CellId;

        // Colore
        let color = '#555'; // Default
        if (isTarget) color = '#4caf50'; // Target verde
        else if (!isFree) color = '#ff9800'; // Occupata arancione

        return (
          <g key={`cell-${cellId}`}>
            {/* Ripiano cella */}
            <line
              x1={iso.x - 20}
              y1={iso.y}
              x2={iso.x + 20}
              y2={iso.y}
              stroke={color}
              strokeWidth={isTarget ? 3 : 2}
              opacity={isTarget ? 1 : 0.6}
            />

            {/* ID cella */}
            <text
              x={iso.x + 30}
              y={iso.y + 4}
              fill="#aaa"
              fontSize="10"
            >
              {cellId}
            </text>

            {/* Indicatore target */}
            {isTarget && (
              <circle
                cx={iso.x}
                cy={iso.y}
                r="25"
                fill="none"
                stroke="#4caf50"
                strokeWidth="2"
                strokeDasharray="4 2"
              >
                <animate attributeName="r" values="25;30;25" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// COMPONENTE: ELEVATORE
// =============================================================================

interface ElevatorProps {
  mission: Mission;
  elevatorPos: ElevatorPosition | null;
  animationFrame: number;
}

const Elevator: React.FC<ElevatorProps> = ({ mission, elevatorPos, animationFrame }) => {
  // Posizione reale o simulata
  const yPos = elevatorPos?.Vertical ?? 1000;
  const xPos = elevatorPos?.Horizontal ?? 0;

  const iso = toIsometric(0, yPos, 0);

  // Dimensioni cabina (in pixel già scalati)
  const cabinW = 100;
  const cabinH = 80;

  // Catene animate
  const chainOffset = (animationFrame % 20) * 3;

  return (
    <g>
      {/* CATENE VERTICALI */}
      {/* Catena sinistra */}
      <line
        x1={iso.x - 50}
        y1={50}
        x2={iso.x - 50}
        y2={iso.y}
        stroke="#666"
        strokeWidth="3"
        strokeDasharray="8 4"
        strokeDashoffset={chainOffset}
      />

      {/* Catena destra */}
      <line
        x1={iso.x + 50}
        y1={50}
        x2={iso.x + 50}
        y2={iso.y}
        stroke="#666"
        strokeWidth="3"
        strokeDasharray="8 4"
        strokeDashoffset={chainOffset}
      />

      {/* CABINA ELEVATORE */}
      {/* Fronte */}
      <rect
        x={iso.x - cabinW/2}
        y={iso.y - cabinH/2}
        width={cabinW}
        height={cabinH}
        fill="url(#elevatorGradient)"
        stroke="#455a64"
        strokeWidth="2"
        rx="4"
      />

      {/* Lato destro (prospettiva) */}
      <polygon
        points={`${iso.x + cabinW/2},${iso.y - cabinH/2} ${iso.x + cabinW/2 + 20},${iso.y - cabinH/2 - 10} ${iso.x + cabinW/2 + 20},${iso.y + cabinH/2 - 10} ${iso.x + cabinW/2},${iso.y + cabinH/2}`}
        fill="#546e7a"
        stroke="#455a64"
        strokeWidth="1"
      />

      {/* Top */}
      <polygon
        points={`${iso.x - cabinW/2},${iso.y - cabinH/2} ${iso.x + cabinW/2},${iso.y - cabinH/2} ${iso.x + cabinW/2 + 20},${iso.y - cabinH/2 - 10} ${iso.x - cabinW/2 + 20},${iso.y - cabinH/2 - 10}`}
        fill="#78909c"
        stroke="#455a64"
        strokeWidth="1"
      />

      {/* Dettagli cabina */}
      <rect
        x={iso.x - 30}
        y={iso.y - 20}
        width="60"
        height="40"
        fill="#37474f"
        rx="2"
      />

      {/* Indicatore posizione */}
      <text
        x={iso.x}
        y={iso.y + 5}
        textAnchor="middle"
        fill="#fff"
        fontSize="12"
        fontWeight="bold"
      >
        {Math.round(yPos)}mm
      </text>
    </g>
  );
};

// =============================================================================
// COMPONENTE: BAIE
// =============================================================================

interface BaysProps {
  mission: Mission;
}

const Bays: React.FC<BaysProps> = ({ mission }) => {
  const activeBay = mission.TargetBay ?? 1;
  const { depth } = WAREHOUSE;

  // 3 baie davanti al magazzino
  const bays = [1, 2, 3];

  return (
    <g>
      {bays.map(bayNum => {
        const xPos = -depth/2 - 300; // Davanti alla struttura
        const yPos = 700; // Altezza baia
        const zPos = (bayNum - 2) * 600; // Distribuite: -600, 0, +600

        const iso = toIsometric(xPos, yPos, zPos);
        const isActive = bayNum === activeBay;

        return (
          <g key={`bay-${bayNum}`}>
            {/* Piattaforma baia */}
            <rect
              x={iso.x - 40}
              y={iso.y - 25}
              width="80"
              height="50"
              fill={isActive ? '#4caf50' : '#607d8b'}
              stroke="#fff"
              strokeWidth={isActive ? 3 : 1}
              opacity={isActive ? 0.9 : 0.5}
              rx="5"
            />

            {/* Label */}
            <text
              x={iso.x}
              y={iso.y + 5}
              textAnchor="middle"
              fill="#fff"
              fontSize="14"
              fontWeight="bold"
            >
              B{bayNum}
            </text>

            {/* Indicatore attiva */}
            {isActive && (
              <circle
                cx={iso.x + 50}
                cy={iso.y}
                r="6"
                fill="#4caf50"
              >
                <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </g>
  );
};

export default PpcWarehouse3DPage;

import React, { useMemo, useEffect, useState } from 'react';
import type { Mission } from '../../services/ppc/automationTypes';
import { ppcT } from '../../features/ppc/ppcStrings';

interface Warehouse3DVisualizationProps {
  mission: Mission & {
    Step?: string | number | null;
    Status?: string | number | null;
    TargetBay?: string | number | null;
    SourceCell?: string | null;
    TargetCell?: string | null;
  };
}

// Configurazione magazzino 3D
const WAREHOUSE_CONFIG = {
  width: 800,
  height: 600,
  // Dimensioni fisiche (isometrico)
  cellWidth: 40,
  cellHeight: 30,
  cellDepth: 25,
  floors: 10,
  columns: 8,
  bays: 3,
  // Angolo isometrico (30°)
  isoAngle: Math.PI / 6,
};

// Funzione per convertire coordinate 3D in isometriche 2D
const toIsometric = (x: number, y: number, z: number) => {
  const isoX = (x - y) * Math.cos(WAREHOUSE_CONFIG.isoAngle);
  const isoY = (x + y) * Math.sin(WAREHOUSE_CONFIG.isoAngle) - z;
  return { x: isoX, y: isoY };
};

// Mappa step missione a posizione/azione
const getStepAnimation = (step: number | string) => {
  const stepNum = typeof step === 'string' ? parseInt(step, 10) : step;

  switch (stepNum) {
    case 1: // New
    case 2: // Start
      return { action: 'waiting', position: 'bay', label: 'In Attesa' };
    case 3: // LoadElevator
      return { action: 'loading', position: 'bay', label: 'Caricamento Elevatore' };
    case 4: // ToTarget
      return { action: 'moving', position: 'transit', label: 'Verso Destinazione' };
    case 5: // DepositUnit
      return { action: 'depositing', position: 'cell', label: 'Deposito in Cella' };
    case 6: // WaitPick
      return { action: 'waiting', position: 'bay', label: 'Attesa Prelievo' };
    case 7: // BayChain
    case 8: // CloseShutter
    case 9: // BackToBay
      return { action: 'returning', position: 'bay', label: 'Ritorno a Baia' };
    case 18: // End
      return { action: 'completed', position: 'bay', label: 'Completato' };
    case 101: // Error
    case 102: // ErrorLoad
    case 103: // ErrorDeposit
      return { action: 'error', position: 'bay', label: 'Errore' };
    default:
      return { action: 'idle', position: 'bay', label: 'Sconosciuto' };
  }
};

const Warehouse3DVisualization: React.FC<Warehouse3DVisualizationProps> = ({ mission }) => {
  const [animationFrame, setAnimationFrame] = useState(0);

  // Animazione continua
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 360);
    }, 50); // 20 FPS
    return () => clearInterval(interval);
  }, []);

  const stepInfo = useMemo(() => {
    return getStepAnimation(mission.Step ?? 0);
  }, [mission.Step]);

  const isActive = mission.Status === 'Executing' || mission.Status === 2;
  const isError = mission.Status === 'Aborted' || mission.Status === 5;

  // Calcola posizione elevatore basata sullo step
  const elevatorPosition = useMemo(() => {
    const stepNum = typeof mission.Step === 'string' ? parseInt(mission.Step, 10) : (mission.Step ?? 0);
    const bay = typeof mission.TargetBay === 'string' ? parseInt(mission.TargetBay, 10) : (mission.TargetBay ?? 1);

    let x = 50 + (bay - 1) * 250;
    let y = 400;
    let z = 0;

    // Animazione basata sullo step
    if (stepInfo.action === 'loading') {
      z = Math.sin(animationFrame / 10) * 5; // Movimento su/giù
    } else if (stepInfo.action === 'moving') {
      // Movimento verso le celle
      const progress = (animationFrame % 100) / 100;
      y = 400 - (progress * 200); // Movimento verticale
      z = Math.sin(progress * Math.PI) * 20; // Arco
    } else if (stepInfo.action === 'depositing') {
      z = 10 + Math.sin(animationFrame / 15) * 3; // Deposito
    } else if (stepInfo.action === 'returning') {
      const progress = (animationFrame % 100) / 100;
      y = 200 + (progress * 200); // Ritorno
    }

    return { x, y, z };
  }, [mission.Step, mission.TargetBay, stepInfo, animationFrame]);

  // Disegna cella storage
  const renderCell = (floor: number, column: number, bay: number, isTarget: boolean) => {
    const x = 100 + column * 80;
    const y = 100 + floor * 50;
    const depth = bay * 40;

    const iso = toIsometric(x, y + depth, 0);
    const cellWidth = WAREHOUSE_CONFIG.cellWidth;
    const cellHeight = WAREHOUSE_CONFIG.cellHeight;

    const points = [
      toIsometric(x, y + depth, 0),
      toIsometric(x + cellWidth, y + depth, 0),
      toIsometric(x + cellWidth, y + depth, cellHeight),
      toIsometric(x, y + depth, cellHeight),
    ];

    const pathD = `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y} L ${points[2].x},${points[2].y} L ${points[3].x},${points[3].y} Z`;

    return (
      <g key={`cell-${floor}-${column}-${bay}`}>
        <path
          d={pathD}
          fill={isTarget ? '#ffc107' : '#e9ecef'}
          stroke={isTarget ? '#ff9800' : '#ced4da'}
          strokeWidth="1"
          opacity={isTarget ? 0.9 : 0.6}
        />
        {isTarget && (
          <circle
            cx={iso.x + cellWidth / 2}
            cy={iso.y + cellHeight / 2}
            r="3"
            fill="#ff9800"
            opacity={0.5 + Math.sin(animationFrame / 10) * 0.3}
          />
        )}
      </g>
    );
  };

  // Disegna elevatore 3D
  const renderElevator = () => {
    const { x, y, z } = elevatorPosition;
    const w = 60;
    const h = 80;
    const d = 40;

    // Base elevatore (cubo isometrico)
    const base = toIsometric(x, y, z);
    const top = toIsometric(x, y, z + h);
    const right = toIsometric(x + w, y, z);
    const back = toIsometric(x, y + d, z);

    // Lati del cubo
    const frontFace = `M ${base.x},${base.y} L ${right.x},${right.y} L ${toIsometric(x + w, y, z + h).x},${toIsometric(x + w, y, z + h).y} L ${top.x},${top.y} Z`;
    const sideFace = `M ${base.x},${base.y} L ${back.x},${back.y} L ${toIsometric(x, y + d, z + h).x},${toIsometric(x, y + d, z + h).y} L ${top.x},${top.y} Z`;
    const topFace = `M ${top.x},${top.y} L ${toIsometric(x + w, y, z + h).x},${toIsometric(x + w, y, z + h).y} L ${toIsometric(x + w, y + d, z + h).x},${toIsometric(x + w, y + d, z + h).y} L ${toIsometric(x, y + d, z + h).x},${toIsometric(x, y + d, z + h).y} Z`;

    const color = isError ? '#dc3545' : isActive ? '#0d6efd' : '#6c757d';
    const glowIntensity = isActive ? 0.3 + Math.sin(animationFrame / 10) * 0.2 : 0;

    return (
      <g className="elevator" filter={isActive ? 'url(#elevatorGlow)' : undefined}>
        {/* Ombra */}
        <ellipse
          cx={base.x + 30}
          cy={y + 90}
          rx="40"
          ry="10"
          fill="rgba(0,0,0,0.2)"
          opacity={0.4}
        />

        {/* Facce elevatore */}
        <path d={frontFace} fill={color} stroke="#212529" strokeWidth="2" opacity={0.9} />
        <path d={sideFace} fill={color} stroke="#212529" strokeWidth="2" opacity={0.7} filter="brightness(0.8)" />
        <path d={topFace} fill={color} stroke="#212529" strokeWidth="2" opacity={0.95} filter="brightness(1.1)" />

        {/* Dettagli elevatore */}
        <circle cx={base.x + 20} cy={base.y + 20} r="4" fill="#ffc107" opacity={glowIntensity + 0.5} />
        <circle cx={base.x + 40} cy={base.y + 20} r="4" fill="#ffc107" opacity={glowIntensity + 0.5} />

        {/* Cassetto se caricato */}
        {mission.LoadUnitId && stepInfo.action !== 'completed' && (
          <rect
            x={base.x + 10}
            y={base.y + 30}
            width="40"
            height="20"
            fill="#ff9800"
            stroke="#e65100"
            strokeWidth="1"
            rx="2"
            opacity={0.9}
          />
        )}
      </g>
    );
  };

  // Disegna baia di carico/scarico
  const renderBay = (bayNumber: number) => {
    const x = 50 + (bayNumber - 1) * 250;
    const y = 450;
    const w = 100;
    const h = 60;

    const iso = toIsometric(x, y, 0);
    const isoTop = toIsometric(x, y, h);
    const isoRight = toIsometric(x + w, y, 0);

    const isTargetBay = mission.TargetBay === bayNumber || mission.TargetBay === `Bay${bayNumber}` || mission.TargetBay === bayNumber.toString();
    const color = isTargetBay ? '#198754' : '#495057';

    return (
      <g key={`bay-${bayNumber}`}>
        {/* Base baia */}
        <path
          d={`M ${iso.x},${iso.y} L ${isoRight.x},${isoRight.y} L ${toIsometric(x + w, y, h).x},${toIsometric(x + w, y, h).y} L ${isoTop.x},${isoTop.y} Z`}
          fill={color}
          stroke="#212529"
          strokeWidth="2"
          opacity={0.8}
        />

        {/* Label */}
        <text
          x={iso.x + 30}
          y={iso.y + 30}
          fill="white"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
        >
          BAY {bayNumber}
        </text>

        {/* Indicatore target */}
        {isTargetBay && (
          <circle
            cx={iso.x + 50}
            cy={iso.y - 20}
            r="8"
            fill="#198754"
            stroke="#fff"
            strokeWidth="2"
            opacity={0.6 + Math.sin(animationFrame / 8) * 0.4}
          />
        )}
      </g>
    );
  };

  return (
    <div className="warehouse-3d">
      <div className="warehouse-3d__header">
        <h3 className="warehouse-3d__title">
          {ppcT('OperatorApp.WarehouseVisualization', 'Visualizzazione 3D Magazzino')}
        </h3>
        <div className="warehouse-3d__status">
          <span className={`warehouse-3d__badge warehouse-3d__badge--${isError ? 'error' : isActive ? 'active' : 'idle'}`}>
            {stepInfo.label}
          </span>
          <span className="warehouse-3d__mission-id">
            Missione #{mission.Id || '?'}
          </span>
        </div>
      </div>

      <div className="warehouse-3d__canvas-container">
        <svg
          viewBox="0 0 800 600"
          className="warehouse-3d__canvas"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
        >
          <defs>
            {/* Gradiente per illuminazione */}
            <radialGradient id="lighting" cx="50%" cy="30%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>

            {/* Filtro glow per elevatore */}
            <filter id="elevatorGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Ombra */}
            <filter id="shadow">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.4"/>
            </filter>
          </defs>

          {/* Illuminazione globale */}
          <ellipse cx="400" cy="150" rx="300" ry="200" fill="url(#lighting)" />

          {/* Griglia pavimento */}
          <g opacity="0.1">
            {Array.from({ length: 10 }).map((_, i) => (
              <line
                key={`grid-h-${i}`}
                x1="50"
                y1={50 + i * 50}
                x2="750"
                y2={50 + i * 50}
                stroke="#fff"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: 15 }).map((_, i) => (
              <line
                key={`grid-v-${i}`}
                x1={50 + i * 50}
                y1="50"
                x2={50 + i * 50}
                y2="550"
                stroke="#fff"
                strokeWidth="0.5"
              />
            ))}
          </g>

          {/* Struttura magazzino - Scaffalature */}
          <g opacity="0.7">
            {Array.from({ length: 10 }).map((_, floor) =>
              Array.from({ length: 8 }).map((_, column) =>
                Array.from({ length: 2 }).map((_, bay) => {
                  const isTarget = false; // TODO: parse TargetCell
                  return renderCell(floor, column, bay, isTarget);
                })
              )
            )}
          </g>

          {/* Baie di carico */}
          {[1, 2, 3].map(bayNum => renderBay(bayNum))}

          {/* Elevatore (sempre in primo piano) */}
          {renderElevator()}

          {/* Particelle movimento (se attivo) */}
          {isActive && stepInfo.action === 'moving' && (
            <g opacity="0.6">
              {Array.from({ length: 5 }).map((_, i) => {
                const offset = (animationFrame + i * 20) % 100;
                const x = elevatorPosition.x + 30;
                const y = elevatorPosition.y - offset * 2;
                return (
                  <circle
                    key={`particle-${i}`}
                    cx={x}
                    cy={y}
                    r="2"
                    fill="#0dcaf0"
                    opacity={1 - offset / 100}
                  />
                );
              })}
            </g>
          )}

          {/* Indicatori di direzione */}
          {isActive && stepInfo.action === 'moving' && (
            <g>
              <path
                d={`M ${elevatorPosition.x + 30} ${elevatorPosition.y - 100} L ${elevatorPosition.x + 30} ${elevatorPosition.y - 120}`}
                stroke="#0dcaf0"
                strokeWidth="3"
                strokeLinecap="round"
                opacity={0.6 + Math.sin(animationFrame / 5) * 0.4}
              />
              <path
                d={`M ${elevatorPosition.x + 30} ${elevatorPosition.y - 120} L ${elevatorPosition.x + 25} ${elevatorPosition.y - 115}`}
                stroke="#0dcaf0"
                strokeWidth="3"
                strokeLinecap="round"
                opacity={0.6 + Math.sin(animationFrame / 5) * 0.4}
              />
              <path
                d={`M ${elevatorPosition.x + 30} ${elevatorPosition.y - 120} L ${elevatorPosition.x + 35} ${elevatorPosition.y - 115}`}
                stroke="#0dcaf0"
                strokeWidth="3"
                strokeLinecap="round"
                opacity={0.6 + Math.sin(animationFrame / 5) * 0.4}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Info pannello */}
      <div className="warehouse-3d__info">
        <div className="warehouse-3d__info-item">
          <span className="warehouse-3d__info-label">Cassetto:</span>
          <span className="warehouse-3d__info-value">{mission.LoadUnitId || '--'}</span>
        </div>
        <div className="warehouse-3d__info-item">
          <span className="warehouse-3d__info-label">Baia Target:</span>
          <span className="warehouse-3d__info-value">
            {mission.TargetBay ? `Bay ${mission.TargetBay}` : '--'}
          </span>
        </div>
        <div className="warehouse-3d__info-item">
          <span className="warehouse-3d__info-label">Azione:</span>
          <span className="warehouse-3d__info-value warehouse-3d__info-value--highlight">
            {stepInfo.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Warehouse3DVisualization;

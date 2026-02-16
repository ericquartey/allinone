import React, { useMemo } from 'react';
import type { Mission } from '../../services/ppc/automationTypes';
import { ppcT } from '../../features/ppc/ppcStrings';

interface MissionVisualizationProps {
  mission: Mission & {
    Step?: string | number | null;
    Status?: string | number | null;
    TargetBay?: string | number | null;
  };
}

// Mappa degli step delle missioni con coordinate visuali
const MISSION_STEPS = [
  { id: 0, name: 'NotDefined', label: 'Non Definito', position: { x: 5, y: 50 }, color: '#6c757d' },
  { id: 1, name: 'New', label: 'Nuova', position: { x: 10, y: 50 }, color: '#0d6efd' },
  { id: 2, name: 'Start', label: 'Avvio', position: { x: 20, y: 50 }, color: '#0d6efd' },
  { id: 3, name: 'LoadElevator', label: 'Caricamento Elevatore', position: { x: 30, y: 50 }, color: '#0dcaf0' },
  { id: 4, name: 'ToTarget', label: 'Verso Destinazione', position: { x: 40, y: 35 }, color: '#0dcaf0' },
  { id: 5, name: 'DepositUnit', label: 'Deposito Unità', position: { x: 50, y: 25 }, color: '#198754' },
  { id: 6, name: 'WaitPick', label: 'Attesa Prelievo', position: { x: 55, y: 30 }, color: '#ffc107' },
  { id: 7, name: 'BayChain', label: 'Catena Baia', position: { x: 60, y: 35 }, color: '#0dcaf0' },
  { id: 8, name: 'CloseShutter', label: 'Chiusura Serranda', position: { x: 65, y: 40 }, color: '#0dcaf0' },
  { id: 9, name: 'BackToBay', label: 'Ritorno a Baia', position: { x: 70, y: 45 }, color: '#0dcaf0' },
  { id: 10, name: 'WaitChain', label: 'Attesa Catena', position: { x: 72, y: 50 }, color: '#ffc107' },
  { id: 11, name: 'WaitDepositCell', label: 'Attesa Deposito Cella', position: { x: 74, y: 55 }, color: '#ffc107' },
  { id: 12, name: 'WaitDepositExternalBay', label: 'Attesa Deposito Bay Est.', position: { x: 76, y: 60 }, color: '#ffc107' },
  { id: 13, name: 'WaitDepositInternalBay', label: 'Attesa Deposito Bay Int.', position: { x: 78, y: 62 }, color: '#ffc107' },
  { id: 14, name: 'WaitDepositBay', label: 'Attesa Deposito Bay', position: { x: 80, y: 64 }, color: '#ffc107' },
  { id: 15, name: 'DoubleExtBay', label: 'Bay Esterno Doppio', position: { x: 82, y: 66 }, color: '#6610f2' },
  { id: 16, name: 'ExtBay', label: 'Bay Esterno', position: { x: 84, y: 68 }, color: '#6610f2' },
  { id: 17, name: 'ElevatorBayUp', label: 'Elevatore Bay Su', position: { x: 86, y: 70 }, color: '#0dcaf0' },
  { id: 18, name: 'End', label: 'Fine', position: { x: 92, y: 75 }, color: '#198754' },
  { id: 101, name: 'Error', label: 'Errore', position: { x: 50, y: 85 }, color: '#dc3545' },
  { id: 102, name: 'ErrorLoad', label: 'Errore Caricamento', position: { x: 40, y: 90 }, color: '#dc3545' },
  { id: 103, name: 'ErrorDeposit', label: 'Errore Deposito', position: { x: 60, y: 90 }, color: '#dc3545' },
];

const MissionVisualization: React.FC<MissionVisualizationProps> = ({ mission }) => {
  const currentStep = useMemo(() => {
    const stepValue = String(mission.Step ?? 0);
    const stepNum = parseInt(stepValue, 10);
    return MISSION_STEPS.find(s => s.id === stepNum) || MISSION_STEPS[0];
  }, [mission.Step]);

  const isActive = mission.Status === 'Executing' || mission.Status === 2;
  const isCompleted = mission.Status === 'Completed' || mission.Status === 4;
  const isError = mission.Status === 'Aborted' || mission.Status === 5;

  // Genera il percorso visivo della missione (linea connettente gli step)
  const pathPoints = useMemo(() => {
    const currentStepIndex = MISSION_STEPS.findIndex(s => s.id === currentStep.id);
    if (currentStepIndex < 0) return [];

    // Prendi tutti gli step fino allo step corrente
    return MISSION_STEPS.slice(0, currentStepIndex + 1);
  }, [currentStep]);

  // Genera le coordinate SVG per la linea del percorso
  const pathD = useMemo(() => {
    if (pathPoints.length < 2) return '';

    const points = pathPoints.map(p => `${p.position.x},${p.position.y}`).join(' L ');
    return `M ${points}`;
  }, [pathPoints]);

  return (
    <div className="mission-visualization">
      <div className="mission-visualization__header">
        <h3 className="mission-visualization__title">
          {ppcT('OperatorApp.MissionVisualization', 'Visualizzazione Missione')} #{mission.Id || '?'}
        </h3>
        <div className="mission-visualization__status">
          <span className={`mission-visualization__badge mission-visualization__badge--${isError ? 'error' : isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}>
            {isError ? ppcT('OperatorApp.StatusAborted', 'Interrotta') :
             isCompleted ? ppcT('OperatorApp.StatusCompleted', 'Completata') :
             isActive ? ppcT('OperatorApp.StatusExecuting', 'In Esecuzione') :
             ppcT('OperatorApp.StatusNew', 'Nuova')}
          </span>
        </div>
      </div>

      <div className="mission-visualization__info">
        <div className="mission-visualization__info-item">
          <span className="mission-visualization__info-label">{ppcT('OperatorApp.LoadingUnitId', 'Cassetto')}:</span>
          <span className="mission-visualization__info-value">{mission.LoadUnitId || '--'}</span>
        </div>
        <div className="mission-visualization__info-item">
          <span className="mission-visualization__info-label">{ppcT('OperatorApp.BayTarget', 'Baia Target')}:</span>
          <span className="mission-visualization__info-value">
            {mission.TargetBay === 1 || mission.TargetBay === 'BayOne' ? 'Bay 1' :
             mission.TargetBay === 2 || mission.TargetBay === 'BayTwo' ? 'Bay 2' :
             mission.TargetBay === 3 || mission.TargetBay === 'BayThree' ? 'Bay 3' : '--'}
          </span>
        </div>
        <div className="mission-visualization__info-item">
          <span className="mission-visualization__info-label">{ppcT('OperatorApp.MissionStep', 'Step Corrente')}:</span>
          <span className="mission-visualization__info-value mission-visualization__info-value--highlight">
            {currentStep.label}
          </span>
        </div>
      </div>

      <div className="mission-visualization__canvas">
        <svg viewBox="0 0 100 100" className="mission-visualization__svg">
          {/* Griglia di sfondo */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
            </pattern>

            {/* Gradiente per la linea del percorso */}
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0d6efd" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#198754" stopOpacity="0.8" />
            </linearGradient>

            {/* Filtro per ombra */}
            <filter id="shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3"/>
            </filter>

            {/* Animazione pulsante */}
            <radialGradient id="pulseGradient">
              <stop offset="0%" stopColor={currentStep.color} stopOpacity="0.8">
                <animate attributeName="stop-opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor={currentStep.color} stopOpacity="0">
                <animate attributeName="offset" values="50%;100%;50%" dur="2s" repeatCount="indefinite" />
              </stop>
            </radialGradient>
          </defs>

          {/* Griglia di sfondo */}
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Linea del percorso percorso */}
          {pathD && (
            <>
              {/* Linea sottostante più spessa per effetto ombra */}
              <path
                d={pathD}
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="translate(0.3, 0.3)"
              />
              {/* Linea principale del percorso */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mission-visualization__path"
              />
              {/* Linea animata sopra */}
              {isActive && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={currentStep.color}
                  strokeWidth="0.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2,2"
                  className="mission-visualization__path-animated"
                />
              )}
            </>
          )}

          {/* Step completati */}
          {pathPoints.map((step, index) => {
            const isCurrentStep = step.id === currentStep.id;
            const isPastStep = index < pathPoints.length - 1;

            return (
              <g key={step.id} className="mission-visualization__step-group">
                {/* Cerchio esterno pulsante per step corrente */}
                {isCurrentStep && isActive && (
                  <circle
                    cx={step.position.x}
                    cy={step.position.y}
                    r="0"
                    fill="url(#pulseGradient)"
                    className="mission-visualization__pulse"
                  >
                    <animate attributeName="r" values="0;4;0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Cerchio step */}
                <circle
                  cx={step.position.x}
                  cy={step.position.y}
                  r={isCurrentStep ? 2.5 : 1.5}
                  fill={isPastStep ? '#198754' : step.color}
                  stroke="white"
                  strokeWidth="0.5"
                  filter="url(#shadow)"
                  className={isCurrentStep ? 'mission-visualization__current-step' : ''}
                />

                {/* Etichetta step (solo per step corrente o importanti) */}
                {(isCurrentStep || step.id === 1 || step.id === 18 || step.id >= 101) && (
                  <text
                    x={step.position.x}
                    y={step.position.y - 4}
                    fontSize="2.5"
                    fill={isCurrentStep ? step.color : '#6c757d'}
                    textAnchor="middle"
                    fontWeight={isCurrentStep ? 'bold' : 'normal'}
                    className="mission-visualization__label"
                  >
                    {step.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Indicatore animato di movimento (solo se in esecuzione) */}
          {isActive && pathD && (
            <circle
              r="1"
              fill={currentStep.color}
              filter="url(#shadow)"
            >
              <animateMotion
                dur="4s"
                repeatCount="indefinite"
                path={pathD}
              />
            </circle>
          )}
        </svg>
      </div>

      {/* Legenda */}
      <div className="mission-visualization__legend">
        <div className="mission-visualization__legend-item">
          <div className="mission-visualization__legend-color" style={{ backgroundColor: '#198754' }}></div>
          <span>{ppcT('OperatorApp.Completed', 'Completato')}</span>
        </div>
        <div className="mission-visualization__legend-item">
          <div className="mission-visualization__legend-color" style={{ backgroundColor: '#0dcaf0' }}></div>
          <span>{ppcT('OperatorApp.InProgress', 'In Corso')}</span>
        </div>
        <div className="mission-visualization__legend-item">
          <div className="mission-visualization__legend-color" style={{ backgroundColor: '#ffc107' }}></div>
          <span>{ppcT('OperatorApp.Waiting', 'In Attesa')}</span>
        </div>
        <div className="mission-visualization__legend-item">
          <div className="mission-visualization__legend-color" style={{ backgroundColor: '#dc3545' }}></div>
          <span>{ppcT('General.Error', 'Errore')}</span>
        </div>
      </div>

      {/* Barra di progresso */}
      <div className="mission-visualization__progress">
        <div className="mission-visualization__progress-label">
          {ppcT('OperatorApp.Progress', 'Progresso')}: {Math.round((pathPoints.length / 19) * 100)}%
        </div>
        <div className="mission-visualization__progress-bar">
          <div
            className="mission-visualization__progress-fill"
            style={{
              width: `${(pathPoints.length / 19) * 100}%`,
              backgroundColor: isError ? '#dc3545' : isCompleted ? '#198754' : '#0d6efd'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MissionVisualization;

import React, { useMemo, useState } from 'react';
import PpcLabeledText from '../../../components/ppc/PpcLabeledText';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcSensorCard from '../../../components/ppc/PpcSensorCard';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcMachineStatus from '../../../hooks/usePpcMachineStatus';
import ppcAutomationService from '../../../services/ppc/automationService';

const PpcErrorLoadunitMissingPage: React.FC = () => {
  const { errors, refresh } = usePpcMachineStatus();
  const [isResolving, setIsResolving] = useState(false);
  const machineError = useMemo(() => errors[0] ?? null, [errors]);
  const description = machineError?.Description || ppcT('ErrorsApp.CheckUnit', 'Check unit');
  const reason = machineError?.Reason || ppcT('ErrorsApp.ErrorReason', 'Error reason');
  const firstSeen = machineError?.OccurrenceDate
    ? new Date(machineError.OccurrenceDate).toLocaleString('it-IT')
    : '--';
  const errorId = machineError?.Id ?? '--';
  const errorCode = machineError?.Code ?? '--';

  const steps = [
    { label: '1', active: true },
    { label: '2', active: true },
    { label: '3', active: false },
    { label: '4', active: false },
    { label: '5', active: false },
    { label: '6', active: false },
  ];

  const handleResolve = async () => {
    if (!machineError?.Id) {
      return;
    }
    try {
      setIsResolving(true);
      await ppcAutomationService.resolveAllErrors();
      await refresh();
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="ppc-page ppc-error-wizard">
      <div className="ppc-error-wizard__title">{description}</div>
      <div className="ppc-error-wizard__description">{reason}</div>

      <div className="ppc-error-wizard__layout">
        <div className="ppc-wizard">
          <div className="ppc-wizard__timeline">
            {steps.map((step) => (
              <div
                key={step.label}
                className={`ppc-wizard__step${step.active ? ' is-active' : ''}`}
              >
                <div className="ppc-wizard__step-circle">{step.label}</div>
              </div>
            ))}
          </div>

          <div className="ppc-wizard__panel">
            <div className="ppc-wizard__panel-header">
              <div className="ppc-wizard__panel-title">
                {ppcT('ErrorsApp.CheckUnit', 'Check unit')}
              </div>
              <div className="ppc-wizard__panel-code">
                <div className="ppc-error-details__label">
                  {ppcT('ErrorsApp.ErrorCode', 'Error code')}
                </div>
                <div className="ppc-error-details__chip ppc-error-details__chip--danger">
                  {errorCode}
                </div>
              </div>
            </div>

            <div className="ppc-wizard__panel-grid">
              <PpcLabeledText
                label={ppcT('ErrorsApp.Id', 'Id')}
                value={errorId}
              />
              <PpcLabeledText
                label={ppcT('ErrorsApp.ErrorDescription', 'Error description')}
                value={description}
              />
              <PpcLabeledText
                label={ppcT('ErrorsApp.FirstSeen', 'First seen')}
                value={firstSeen}
                align="right"
              />
              <PpcLabeledText
                label={ppcT('ErrorsApp.ErrorReason', 'Error reason')}
                value={reason}
                className="ppc-wizard__panel-wide"
              />
            </div>

            <img
              className="ppc-wizard__panel-image"
              src="/ppc-assets/Mappa_Cassetto_2.png"
              alt="Drawer map"
            />

            <div className="ppc-wizard__panel-actions">
              <PpcActionButton
                label={ppcT('ErrorsApp.MarkAsResolved', 'Mark as resolved')}
                onClick={handleResolve}
                disabled={!machineError?.Id || isResolving}
              />
            </div>
          </div>
        </div>

        <div className="ppc-error-wizard__side">
          <PpcSensorCard
            title={ppcT('SensorCard.Position', 'Position')}
            lines={['Bay 1 / Upper', 'Bay 1 / Lower']}
          />
          <PpcSensorCard
            title={ppcT('SensorCard.AxisVertical', 'Axis vertical')}
            lines={['P 0.92', 'S 0.64']}
          />
          <PpcSensorCard
            title={ppcT('SensorCard.AxisHorizontal', 'Axis horizontal')}
            lines={['P 0.11', 'S 0.05']}
          />
          <PpcSensorCard
            title={ppcT('SensorCard.Shutter', 'Shutter')}
            lines={[ppcT('SensorCard.Open', 'Open')]}
          />
        </div>
      </div>
    </div>
  );
};

export default PpcErrorLoadunitMissingPage;

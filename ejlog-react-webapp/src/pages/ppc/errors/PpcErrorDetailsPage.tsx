import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PpcLabeledText from '../../../components/ppc/PpcLabeledText';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcMachineStatus from '../../../hooks/usePpcMachineStatus';
import ppcAutomationService from '../../../services/ppc/automationService';
import { MachineErrorCode } from '../../../services/ppc/automationTypes';

const PpcErrorDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { errors, refresh } = usePpcMachineStatus();
  const [isResolving, setIsResolving] = useState(false);

  const error = useMemo(() => errors[0] ?? null, [errors]);
  const errorCode = error?.Code ?? '--';
  const errorDescription = error?.Description || ppcT('ErrorsApp.ErrorDescription', 'Error description');
  const errorReason = error?.Reason || ppcT('ErrorsApp.ErrorReason', 'Error reason');
  const errorAdditional =
    error?.AdditionalText || ppcT('OperatorApp.AdditionalText', 'Additional text');
  const firstSeen = error?.OccurrenceDate
    ? new Date(error.OccurrenceDate).toLocaleString('it-IT')
    : '--';
  const errorId = error?.Id ?? '--';
  const bayLabel = error?.BayNumber
    ? `${ppcT('General.Bay', 'Bay')} ${error.BayNumber}`
    : '--';
  const showResolveAndGo = error?.Code === MachineErrorCode.WarehouseIsFull;
  const showTopLevelBayImage =
    error?.Code === MachineErrorCode.TopLevelBayOccupied ||
    error?.Code === MachineErrorCode.TopLevelBayEmpty;

  const handleResolve = async () => {
    if (!error?.Id) {
      return;
    }
    try {
      setIsResolving(true);
      await ppcAutomationService.resolveError(error.Id);
      await refresh();
    } finally {
      setIsResolving(false);
    }
  };

  const handleResolveAndGo = async () => {
    await handleResolve();
    if (showResolveAndGo) {
      navigate('/ppc/operator/drawer-compacting');
    }
  };

  return (
    <div className="ppc-page ppc-error-details">
      <div className="ppc-error-details__grid">
        <div className="ppc-error-details__content">
          <div className="ppc-error-details__title">
            {ppcT('ErrorsApp.ErrorRecoveryProcedure', 'Error recovery procedure')}
          </div>

          <div className="ppc-error-details__code">
            <div className="ppc-error-details__label">
              {ppcT('ErrorsApp.ErrorCode', 'Error code')}
            </div>
            <div className="ppc-error-details__chip ppc-error-details__chip--danger">
              {errorCode}
            </div>
          </div>

          {error?.BayNumber && (
            <div className="ppc-error-details__bay">
              <div className="ppc-error-details__label">
                {ppcT('General.Bay', 'Bay')}
              </div>
              <div className="ppc-error-details__chip ppc-error-details__chip--info">{bayLabel}</div>
            </div>
          )}

          <PpcLabeledText
            label={ppcT('ErrorsApp.ErrorDescription', 'Error description')}
            value={errorDescription}
            className="ppc-error-details__labeled"
          />

          <PpcLabeledText
            label={ppcT('ErrorsApp.ErrorReason', 'Error reason')}
            value={errorReason}
            className="ppc-error-details__labeled ppc-error-details__wide"
          />

          <PpcLabeledText
            label={ppcT('OperatorApp.AdditionalText', 'Additional text')}
            value={errorAdditional}
            className="ppc-error-details__labeled ppc-error-details__wide"
          />

          <PpcLabeledText
            label={ppcT('ErrorsApp.FirstSeen', 'First seen')}
            value={firstSeen}
            className="ppc-error-details__labeled"
          />

          <PpcLabeledText
            label={ppcT('ErrorsApp.Id', 'Id')}
            value={errorId}
            className="ppc-error-details__labeled"
          />

          <div className="ppc-error-details__actions">
            <PpcActionButton
              label={ppcT('ErrorsApp.MarkAsResolved', 'Mark as resolved')}
              onClick={handleResolve}
              disabled={!error?.Id || isResolving}
            />
            {showResolveAndGo && (
              <PpcActionButton
                label={ppcT('OperatorApp.MarkAsResolvedAndGo', 'Mark as resolved and go')}
                tone="warning"
                onClick={handleResolveAndGo}
                disabled={!error?.Id || isResolving}
              />
            )}
          </div>

          {showTopLevelBayImage && (
            <img
              className="ppc-error-details__image"
              src="/ppc-assets/ErrorTopLevelBayOccupiedEmpty.png"
              alt="Error bay layout"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PpcErrorDetailsPage;

import React, { useMemo, useState } from 'react';
import PpcLabeledText from '../../../components/ppc/PpcLabeledText';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcMachineStatus from '../../../hooks/usePpcMachineStatus';
import ppcAutomationService from '../../../services/ppc/automationService';

const PpcErrorInverterFaultPage: React.FC = () => {
  const { errors, refresh } = usePpcMachineStatus();
  const [isResolving, setIsResolving] = useState(false);

  const error = useMemo(() => errors[0] ?? null, [errors]);
  const errorCode = error?.Code ?? '--';
  const inverterLabel = useMemo(() => {
    if (error?.InverterIndex === undefined || error?.InverterIndex === null) {
      return '--';
    }
    const normalizedIndex = error.InverterIndex === 0 ? 255 : error.InverterIndex - 1;
    switch (normalizedIndex) {
      case 0:
        return 'MainInverter';
      case 1:
        return 'Slave1';
      case 2:
        return 'Slave2';
      case 3:
        return 'Slave3';
      case 4:
        return 'Slave4';
      case 5:
        return 'Slave5';
      case 6:
        return 'Slave6';
      case 7:
        return 'Slave7';
      case 16:
        return ppcT('OperatorApp.BayNumberAll', 'All');
      case 255:
        return ppcT('InstallationApp.None', 'None');
      default:
        return `${error.InverterIndex}`;
    }
  }, [error?.InverterIndex]);
  const detailCode = error?.DetailCode !== undefined && error?.DetailCode !== null
    ? `0x${error.DetailCode.toString(16).toUpperCase().padStart(4, '0')}`
    : '--';
  const description = error?.Description || ppcT('ErrorsApp.ErrorDescription', 'Error description');
  const reason = error?.Reason || ppcT('ErrorsApp.ErrorReason', 'Error reason');
  const additionalText =
    error?.AdditionalText || ppcT('OperatorApp.AdditionalText', 'Additional text');
  const firstSeen = error?.OccurrenceDate
    ? new Date(error.OccurrenceDate).toLocaleString('it-IT')
    : '--';
  const errorId = error?.Id ?? '--';

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

  return (
    <div className="ppc-page ppc-error-details">
      <div className="ppc-error-details__grid">
        <div className="ppc-error-details__content">
          <div className="ppc-error-details__title">
            {ppcT('ErrorsApp.InverterFaultErrorRestore', 'Inverter fault restore')}
          </div>

          <div className="ppc-error-details__code">
            <div className="ppc-error-details__label">
              {ppcT('ErrorsApp.ErrorCode', 'Error code')}
            </div>
            <div className="ppc-error-details__chip ppc-error-details__chip--danger">{errorCode}</div>
          </div>

          <div className="ppc-error-details__bay">
            <div className="ppc-error-details__label">
              {ppcT('ErrorsApp.Inverter', 'Inverter')}
            </div>
            <div className="ppc-error-details__chip ppc-error-details__chip--danger">{inverterLabel}</div>
          </div>

          <PpcLabeledText
            label={ppcT('ErrorsApp.ErrorDescription', 'Error description')}
            value={description}
            className="ppc-error-details__labeled"
          />

          <PpcLabeledText
            label={ppcT('ErrorsApp.ErrorReason', 'Error reason')}
            value={reason}
            className="ppc-error-details__labeled ppc-error-details__wide"
          />

          <PpcLabeledText
            label={ppcT('OperatorApp.AdditionalText', 'Additional text')}
            value={additionalText}
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

          <div className="ppc-error-details__code ppc-error-details__code--detail">
            <div className="ppc-error-details__label">
              {ppcT('ErrorsApp.DetailCode', 'Detail code')}
            </div>
            <div className="ppc-error-details__chip ppc-error-details__chip--danger">{detailCode}</div>
          </div>

          <div className="ppc-error-details__actions">
            <PpcActionButton
              label={ppcT('ErrorsApp.MarkAsResolved', 'Mark as resolved')}
              onClick={handleResolve}
              disabled={!error?.Id || isResolving}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PpcErrorInverterFaultPage;

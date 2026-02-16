import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcMachineStatus from '../../../hooks/usePpcMachineStatus';
import { useGetMissionsQuery } from '../../../services/api/ppcAutomationApi';
import { ppcAutomationService } from '../../../services/ppc/automationService';
import type { Mission } from '../../../services/ppc/automationTypes';

const missionStepTranslationKeys: Record<string, string> = {
  NotDefined: 'OperatorApp.MisionStateNotDefined',
  '0': 'OperatorApp.MisionStateNotDefined',
  New: 'OperatorApp.MissionStateNew',
  '1': 'OperatorApp.MissionStateNew',
  Start: 'OperatorApp.MissionStateStart',
  '2': 'OperatorApp.MissionStateStart',
  LoadElevator: 'OperatorApp.MissionStateLoadElevator',
  '3': 'OperatorApp.MissionStateLoadElevator',
  ToTarget: 'OperatorApp.MissionStateToTarget',
  '4': 'OperatorApp.MissionStateToTarget',
  DepositUnit: 'OperatorApp.MissionStateDepositUnit',
  '5': 'OperatorApp.MissionStateDepositUnit',
  WaitPick: 'OperatorApp.MissionStateWaitPick',
  '6': 'OperatorApp.MissionStateWaitPick',
  BayChain: 'OperatorApp.MissionStateBayChain',
  '7': 'OperatorApp.MissionStateBayChain',
  CloseShutter: 'OperatorApp.MissionStateCloseShutter',
  '8': 'OperatorApp.MissionStateCloseShutter',
  BackToBay: 'OperatorApp.MissionStateBackToBay',
  '9': 'OperatorApp.MissionStateBackToBay',
  WaitChain: 'OperatorApp.MissionStateWaitChain',
  '10': 'OperatorApp.MissionStateWaitChain',
  WaitDepositCell: 'OperatorApp.MissionStateWaitDepositCell',
  '11': 'OperatorApp.MissionStateWaitDepositCell',
  WaitDepositExternalBay: 'OperatorApp.MissionStateWaitDepositExternalBay',
  '12': 'OperatorApp.MissionStateWaitDepositExternalBay',
  WaitDepositInternalBay: 'OperatorApp.MissionStateWaitDepositInternalBay',
  '13': 'OperatorApp.MissionStateWaitDepositInternalBay',
  WaitDepositBay: 'OperatorApp.MissionStateWaitDepositBay',
  '14': 'OperatorApp.MissionStateWaitDepositBay',
  DoubleExtBay: 'OperatorApp.MissionStateDoubleExtBay',
  '15': 'OperatorApp.MissionStateDoubleExtBay',
  ExtBay: 'OperatorApp.MissionStateExtBay',
  '16': 'OperatorApp.MissionStateExtBay',
  ElevatorBayUp: 'OperatorApp.MissionStateElevatorBayUp',
  '17': 'OperatorApp.MissionStateElevatorBayUp',
  End: 'OperatorApp.MissionStateEnd',
  '18': 'OperatorApp.MissionStateEnd',
  Error: 'OperatorApp.MissionStateError',
  '101': 'OperatorApp.MissionStateError',
  ErrorLoad: 'OperatorApp.MissionStateErrorLoad',
  '102': 'OperatorApp.MissionStateErrorLoad',
  ErrorDeposit: 'OperatorApp.MissionStateErrorDeposit',
  '103': 'OperatorApp.MissionStateErrorDeposit',
};

const missionStatusTranslationKeys: Record<string, string> = {
  New: 'OperatorApp.StatusNew',
  Executing: 'OperatorApp.StatusExecuting',
  Waiting: 'OperatorApp.StatusWaiting',
  Completed: 'OperatorApp.StatusCompleted',
  Aborted: 'OperatorApp.StatusAborted',
  Completing: 'OperatorApp.StatusCompleting',
};

const missionTypeTranslationKeys: Record<string, string> = {
  NoType: 'OperatorApp.MissionTypeNoType',
  Manual: 'OperatorApp.MissionTypeManual',
  LoadUnitOperation: 'OperatorApp.MissionTypeLoadUnitOperation',
  WMS: 'OperatorApp.MissionTypeWms',
  IN: 'OperatorApp.MissionTypeIn',
  OUT: 'OperatorApp.MissionTypeOut',
  FirstTest: 'OperatorApp.MissionTypeFirstTest',
  FullTestIN: 'OperatorApp.MissionTypeFullTestIN',
  FullTestOUT: 'OperatorApp.MissionTypeFullTestOUT',
  Compact: 'OperatorApp.MissionTypeCompact',
};

const bayTranslationKeys: Record<string, string> = {
  None: 'OperatorApp.BayNumberBayNone',
  BayOne: 'OperatorApp.BayNumberBayOne',
  BayTwo: 'OperatorApp.BayNumberBayTwo',
  BayThree: 'OperatorApp.BayNumberBayThree',
};

const stopReasonTranslationKeys: Record<string, string> = {
  NoReason: 'OperatorApp.NoReason',
  Stop: 'InstallationApp.Stop',
  Error: 'General.Error',
  Abort: 'OperatorApp.StatusAborted',
  RunningStateChanged: 'OperatorApp.RunningStateChanged',
  FaultStateChanged: 'OperatorApp.FaultStateChanged',
  UdcSensorError: 'OperatorApp.UdcSensorError',
  AbortForTrolley: 'OperatorApp.AbortForTrolley',
};

const openShutterPositionKeys: Record<string, string> = {
  NotSpecified: 'OperatorApp.ItemListType_NotSpecified',
  Opened: 'InstallationApp.ShutterOpen',
  Half: 'InstallationApp.ShutterMidWay',
  Closed: 'InstallationApp.ShutterClosed',
  Intermediate: 'OperatorApp.Intermediate',
};

const formatLabel = (value: string | number | undefined | null, map: Record<string, string>): string => {
  if (value === null || value === undefined) {
    return '--';
  }
  const key = String(value);
  const translationKey = map[key];
  if (translationKey) {
    return ppcT(translationKey, key);
  }
  return key;
};

const formatDateTime = (value?: string | number | null) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('it-IT', { hour12: false });
};

const getYesNo = (value?: boolean | null) => (value ? ppcT('General.Yes', 'Sì') : ppcT('General.No', 'No'));

type ExtendedMission = Mission & {
  Step?: string | number | null;
  Status?: string | number | null;
  MissionType?: string | number | null;
  TargetBay?: string | number | null;
  NeedMovingBackward?: boolean | null;
  OpenShutterPosition?: string | number | null;
  Priority?: number | null;
  RestoreConditions?: boolean | null;
  RestoreStep?: string | number | null;
  StepTime?: string | number | null;
  StopReason?: string | number | null;
};

const PpcOperatorMissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: missions = [], refetch, isFetching } = useGetMissionsQuery(undefined, {
    pollingInterval: 3000,
    refetchOnFocus: true,
  });
  const { bayNumber, isManual } = usePpcMachineStatus({ pollIntervalMs: 3000 });
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!selectedMissionId && missions.length) {
      const first = missions[0];
      if (first?.Id) {
        setSelectedMissionId(first.Id);
      }
    } else if (
      selectedMissionId &&
      !missions.some((mission) => mission.Id === selectedMissionId)
    ) {
      setSelectedMissionId(null);
    }
  }, [missions, selectedMissionId]);

  const selectedMission = useMemo(
    () => (selectedMissionId ? missions.find((mission) => mission.Id === selectedMissionId) ?? null : null),
    [missions, selectedMissionId]
  ) as ExtendedMission | null;

  const handleRowClick = useCallback((mission: ExtendedMission) => {
    if (mission.Id) {
      setSelectedMissionId(mission.Id);
    }
  }, []);

  const handleView3D = useCallback(() => {
    if (selectedMissionId) {
      navigate(`/ppc/operator/warehouse3d/${selectedMissionId}`);
    }
  }, [selectedMissionId, navigate]);

  const handleAbortMission = useCallback(async () => {
    if (!selectedMission?.Id) {
      return;
    }
    setIsProcessing(true);
    try {
      await ppcAutomationService.abortMission(
        selectedMission.Id,
        selectedMission.TargetBay ?? bayNumber
      );
      await refetch();
    } finally {
      setIsProcessing(false);
    }
  }, [selectedMission, bayNumber, refetch]);

  const handleAbortAll = useCallback(async () => {
    if (!isManual || !missions.length) {
      return;
    }
    if (!window.confirm(ppcT('OperatorApp.ConfirmDeleteAllMission', 'Eliminare tutte le missioni?'))) {
      return;
    }
    setIsProcessing(true);
    try {
      await ppcAutomationService.abortMissions(missions as ExtendedMission[]);
      await refetch();
    } finally {
      setIsProcessing(false);
    }
  }, [isManual, missions, refetch]);

  const canAbortSelected = Boolean(selectedMission?.Id) && isManual && !isProcessing;
  const canAbortAll = Boolean(missions.length) && isManual && !isProcessing;

  return (
    <div className="ppc-missions">
      <div className="ppc-missions__header">
        <div>
          <div className="ppc-missions__title">{ppcT('OperatorApp.Missions', 'Missioni')}</div>
          <div className="ppc-missions__subtitle">
            {ppcT('OperatorApp.MissionsSubtitle', 'Missioni attive: {0}', missions.length)}
          </div>
        </div>
        {isFetching && (
          <div className="ppc-missions__loading">{ppcT('General.Loading', 'Caricamento...')}</div>
        )}
      </div>

      <div className="ppc-missions__table-wrapper">
        {missions.length === 0 ? (
          <div className="ppc-missions__empty">{ppcT('OperatorApp.NoMissions', 'Nessuna missione attiva')}</div>
        ) : (
          <table className="ppc-missions__table">
            <thead>
              <tr>
                <th>{ppcT('OperatorApp.WaitingListDetailDataGridHeaderRow', 'Id')}</th>
                <th>{ppcT('OperatorApp.LoadingUnitId', 'Cassetto')}</th>
                <th>{ppcT('OperatorApp.MissionStep', 'Step')}</th>
                <th>{ppcT('OperatorApp.MissionStatus', 'Condizione')}</th>
                <th>{ppcT('OperatorApp.MissionType', 'Tipo')}</th>
                <th>{ppcT('OperatorApp.BayTarget', 'Baia')}</th>
                <th>{ppcT('OperatorApp.NeedMovingBackward', 'Molto indietro')}</th>
                <th>{ppcT('OperatorApp.OpenShutterPosition', 'Posizione serranda')}</th>
                <th>{ppcT('InstallationApp.Priority', 'Priorità')}</th>
                <th>{ppcT('OperatorApp.RestoreConditions', 'Ripristino')}</th>
                <th>{ppcT('OperatorApp.RestoreStep', 'Step ripristino')}</th>
                <th>{ppcT('OperatorApp.StepTime', 'Ora')}</th>
                <th>{ppcT('OperatorApp.StopReason', 'Causa Stop')}</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((mission, index) => {
                const extended = mission as ExtendedMission;
                const isSelected = extended.Id === selectedMissionId;
                const rowKey = extended.Id ?? extended.LoadUnitId ?? index;
                return (
                  <tr
                    key={rowKey}
                    className={`ppc-missions__row${isSelected ? ' ppc-missions__row--active' : ''}`}
                    onClick={() => handleRowClick(extended)}
                  >
                    <td>{extended.Id ?? '--'}</td>
                    <td>{extended.LoadUnitId ?? '--'}</td>
                    <td>{formatLabel(extended.Step, missionStepTranslationKeys)}</td>
                    <td>{formatLabel(extended.Status, missionStatusTranslationKeys)}</td>
                    <td>{formatLabel(extended.MissionType, missionTypeTranslationKeys)}</td>
                    <td>{formatLabel(extended.TargetBay, bayTranslationKeys)}</td>
                    <td>
                      <span
                        className={`ppc-missions__badge ${
                          extended.NeedMovingBackward ? 'ppc-missions__badge--active' : 'ppc-missions__badge--muted'
                        }`}
                      >
                        {getYesNo(extended.NeedMovingBackward)}
                      </span>
                    </td>
                    <td>{formatLabel(extended.OpenShutterPosition, openShutterPositionKeys)}</td>
                    <td>{extended.Priority ?? '--'}</td>
                    <td>{getYesNo(extended.RestoreConditions)}</td>
                    <td>{formatLabel(extended.RestoreStep, missionStepTranslationKeys)}</td>
                    <td>{formatDateTime(extended.StepTime)}</td>
                    <td>{formatLabel(extended.StopReason, stopReasonTranslationKeys)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="ppc-missions__footer">
        <button
          type="button"
          className="ppc-action-button ppc-action-button--primary"
          onClick={handleView3D}
          disabled={!selectedMissionId}
        >
          {ppcT('OperatorApp.View3D', 'Vista 3D Magazzino')}
        </button>
        <button
          type="button"
          className="ppc-action-button"
          onClick={handleAbortMission}
          disabled={!canAbortSelected}
        >
          {ppcT('OperatorApp.DeleteMission', 'Cancella missione')}
        </button>
        <button
          type="button"
          className="ppc-action-button ppc-action-button--warning"
          onClick={handleAbortAll}
          disabled={!canAbortAll}
        >
          {ppcT('OperatorApp.DeleteAllMission', 'Elimina tutto')}
        </button>
      </div>
    </div>
  );
};

export default PpcOperatorMissionsPage;

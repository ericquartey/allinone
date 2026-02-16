import React, { useCallback, useMemo } from 'react';
import { Info, LayoutGrid, Printer } from 'lucide-react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useNavigate } from 'react-router-dom';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcMachineStatus from '../../../hooks/usePpcMachineStatus';
import { useGetItemListsQuery } from '../../../services/api/ejlogAdapterApi';
import { useGetAreaItemListsQuery } from '../../../services/api/areasApi';
import {
  useGetElevatorPositionQuery,
  useGetLoadingUnitsQuery,
  useGetMachineConfigQuery,
  useGetMissionsQuery,
} from '../../../services/api/ppcAutomationApi';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import { ItemListStatus, ItemListType } from '../../../types/models';
import { isAdapterEnabled } from '../../../utils/adapterConfig';
import {
  mapAutomationLoadingUnit,
  mapMissionLike,
  UnifiedMissionType,
} from '../../../utils/ppc/ppcMappers';

const formatTemplate = (template: string, ...values: Array<string | number>) =>
  template.replace(/\{(\d+)\}/g, (_match, index) => {
    const value = values[Number(index)];
    return value === undefined ? '' : String(value);
  });

const resolveListTypeLabel = (value?: ItemListType) => {
  switch (value) {
    case ItemListType.PICKING:
      return ppcT('OperatorApp.MissionTypeOut', 'Uscita');
    case ItemListType.REFILLING:
      return ppcT('OperatorApp.MissionTypeIn', 'Entrata');
    case ItemListType.INVENTARIO:
      return ppcT('OperatorApp.MissionType', 'Inventario');
    default:
      return ppcT('OperatorApp.MissionTypeNoType', 'Nessun tipo');
  }
};

const resolveMissionTypeLabel = (value?: UnifiedMissionType) => {
  switch (value) {
    case 'IN':
      return ppcT('OperatorApp.MissionTypeIn', 'Entrata');
    case 'OUT':
      return ppcT('OperatorApp.MissionTypeOut', 'Uscita');
    case 'WMS':
      return ppcT('OperatorApp.MissionTypeWms', 'Wms');
    case 'UNKNOWN':
    default:
      return ppcT('OperatorApp.MissionTypeNoType', 'Nessun tipo');
  }
};

const formatNumber = (value?: number | null, decimals = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toFixed(decimals);
};

const PpcOperatorItemOperationWaitPage: React.FC = () => {
  const navigate = useNavigate();
  const adapterEnabled = isAdapterEnabled();
  const { identity, bayNumber } = usePpcMachineStatus({ pollIntervalMs: 2000 });
  const machineId = identity?.Id ?? null;
  const areaId = identity?.AreaId ?? null;
  const { data: machineConfig } = useGetMachineConfigQuery(undefined, {
    refetchOnFocus: true,
  });
  const machineHeight =
    (machineConfig as { Height?: number })?.Height ??
    (machineConfig as { height?: number })?.height ??
    null;
  const animationEnabled =
    Boolean((machineConfig as { EnableAnimation?: boolean })?.EnableAnimation) ||
    Boolean((machineConfig as { enableAnimation?: boolean })?.enableAnimation);
  const elevatorQuery = useGetElevatorPositionQuery(undefined, {
    pollingInterval: animationEnabled && machineHeight ? 500 : 0,
    refetchOnFocus: true,
    skip: !animationEnabled || !machineHeight,
  });

  const { data: missions = [] } = useGetMissionsQuery(undefined, {
    pollingInterval: 1000,
    refetchOnFocus: true,
  });
  const { data: loadingUnits = [] } = useGetLoadingUnitsQuery(undefined, {
    pollingInterval: 1500,
    refetchOnFocus: true,
  });
  const { data: areaItemLists } = useGetAreaItemListsQuery(areaId ?? skipToken, {
    pollingInterval: 2000,
    refetchOnFocus: true,
  });
  const { data: allItemLists = [] } = useGetItemListsQuery(undefined, {
    pollingInterval: adapterEnabled ? 2000 : 0,
    refetchOnFocus: adapterEnabled,
    skip: !adapterEnabled || (areaId !== null && areaId !== undefined),
  });
  const itemLists = areaItemLists ?? allItemLists;

  const elevatorY = useMemo(() => {
    if (!animationEnabled || !machineHeight || !elevatorQuery.data) return null;
    const raw = elevatorQuery.data.Vertical ?? 0;
    let minPoint = 90;
    let maxPoint = 235;
    if (machineHeight > 9000) {
      minPoint = 0;
      maxPoint = 375;
    } else if (machineHeight > 7000) {
      minPoint = 20;
      maxPoint = 325;
    } else if (machineHeight > 5000) {
      minPoint = 55;
      maxPoint = 275;
    }
    const range = maxPoint - minPoint;
    return (maxPoint - (raw / machineHeight) * range) + minPoint;
  }, [animationEnabled, machineHeight, elevatorQuery.data]);

  const missionBuckets = useMemo(() => {
    const outUnits = new Set<number>();
    const inUnits = new Set<number>();
    (missions as Array<Record<string, unknown>>).forEach((mission) => {
      const mapped = mapMissionLike(mission);
      if (bayNumber && mapped.bayNumber !== bayNumber) return;
      if (!mapped.loadingUnitId) return;
      if (mapped.type === 'OUT' || mapped.type === 'WMS') outUnits.add(mapped.loadingUnitId);
      if (mapped.type === 'IN' || mapped.type === 'WMS') inUnits.add(mapped.loadingUnitId);
    });
    return { outUnits, inUnits };
  }, [missions, bayNumber]);

  const mappedLoadingUnits = useMemo(
    () => loadingUnits.map(mapAutomationLoadingUnit),
    [loadingUnits]
  );

  const loadingUnitsToMove = useMemo(() => {
    if (!missionBuckets.outUnits.size) return [];
    return mappedLoadingUnits.filter((unit) => missionBuckets.outUnits.has(unit.id));
  }, [mappedLoadingUnits, missionBuckets.outUnits]);

  const moveUnits = useMemo(() => {
    if (!missionBuckets.inUnits.size) return [];
    return mappedLoadingUnits.filter(
      (unit) => missionBuckets.inUnits.has(unit.id) && !missionBuckets.outUnits.has(unit.id)
    );
  }, [mappedLoadingUnits, missionBuckets.inUnits, missionBuckets.outUnits]);

  const waitingLists = useMemo(() => {
    const baseLists = itemLists.filter((list) => list.status === ItemListStatus.IN_ATTESA);
    if (!machineId && !bayNumber) {
      return baseLists;
    }
    return baseLists.filter((list) => {
      if (!list.machines || list.machines.length === 0) return true;
      return list.machines.some((machine) => {
        if (machineId && machine.id !== machineId) return false;
        if (bayNumber && machine.bayNumber !== bayNumber) return false;
        return true;
      });
    });
  }, [itemLists, machineId, bayNumber]);

  const loadingUnitsInfo = useMemo(() => {
    if (!bayNumber) {
      return ppcT('OperatorApp.NoLoadingUnitsToMove', 'Non ci sono cassetti da movimentare');
    }
    if (loadingUnitsToMove.length === 0) {
      return formatTemplate(
        ppcT('OperatorApp.NoLoadingUnitsToMove', 'Non ci sono cassetti da movimentare in baia {0}'),
        bayNumber
      );
    }
    if (loadingUnitsToMove.length === 1) {
      return formatTemplate(
        ppcT('OperatorApp.LoadingUnitSendToBay', "C'è un cassetto da portare in baia {0}"),
        bayNumber
      );
    }
    return formatTemplate(
      ppcT('OperatorApp.LoadingUnitsSendToBay', 'Ci sono {0} cassetti da portare in baia {1}'),
      loadingUnitsToMove.length,
      bayNumber
    );
  }, [loadingUnitsToMove.length, bayNumber]);

  const primaryUnit = loadingUnitsToMove[0] ?? moveUnits[0] ?? null;
  const normalizedMissions = useMemo(
    () => (missions as Array<Record<string, unknown>>).map((mission) => mapMissionLike(mission)),
    [missions]
  );
  const activeMission =
    normalizedMissions.find((mission) => (bayNumber ? mission.bayNumber === bayNumber : true)) ??
    normalizedMissions[0] ??
    null;
  const missionTypeLabel = resolveMissionTypeLabel(activeMission?.type);
  const stageTitle = primaryUnit
    ? formatTemplate(ppcT('OperatorApp.DrawerPresent', 'Cassetto {0} presente'), primaryUnit.code)
    : ppcT('OperatorApp.DrawerAbsent', 'Nessun cassetto presente');
  const stageMeta = primaryUnit
    ? [
        `${ppcT('OperatorApp.Height', 'Altezza')} ${formatNumber(primaryUnit.height)} mm`,
        `${ppcT('OperatorApp.Weight', 'Peso')} ${formatNumber(primaryUnit.weight)} kg`,
      ].join(' · ')
    : null;
  const stageStatus = primaryUnit?.status ?? ppcT('OperatorApp.DrawerStatusUnknown', 'Stato sconosciuto');
  const elevatorPositionValue = elevatorQuery.data?.Vertical ?? null;
  const elevatorDistance =
    elevatorPositionValue !== null
      ? `${Math.round(elevatorPositionValue)}`
      : ppcT('OperatorApp.ElevatorPositionUnknown', 'Posizione elevatore non disponibile');
  const elevatorCellLabel = elevatorQuery.data?.CellId
    ? `${ppcT('OperatorApp.Cell', 'Cella')} ${elevatorQuery.data.CellId}`
    : null;
  const movementStatusText = useMemo(() => {
    if (!activeMission) {
      return ppcT('OperatorApp.MovementIdle', 'Nessun movimento in corso');
    }
    return formatTemplate(
      ppcT(
        'OperatorApp.MovementInProgress',
        'Movimento in corso... (Missione: {0}, Cassetto: {1}, Stato: {2})'
      ),
      activeMission.id ?? '--',
      primaryUnit?.code ?? '--',
      missionTypeLabel
    );
  }, [activeMission, missionTypeLabel, primaryUnit]);

  const drawerPresentLabel = primaryUnit
    ? formatTemplate(
        ppcT('OperatorApp.DrawerPresentCenter', 'Cassetto {0} presente'),
        primaryUnit.code ?? '--'
      )
    : ppcT('OperatorApp.DrawerAbsent', 'Nessun cassetto presente');
  const handleGoToMissions = useCallback(() => {
    navigate('/ppc/operator/missions');
  }, [navigate]);

  const handleGoBack = useCallback(() => {
    navigate('/ppc/operator/operator-menu');
  }, [navigate]);

  const movementDetailText = primaryUnit
    ? formatTemplate(
        ppcT('OperatorApp.MovementDetail', 'Movimento: da {0} a {1}'),
        primaryUnit.status ?? ppcT('OperatorApp.StateUnknown', 'Sconosciuto'),
        bayNumber ? `${ppcT('General.Bay', 'Baia')} ${bayNumber}` : ppcT('OperatorApp.BayUnknown', 'Baia --')
      )
    : ppcT('OperatorApp.MovementPositionUnknown', 'Posizione movimento non disponibile');

  return (
    <div className="ppc-operation-wait">
      <div className="ppc-operation-wait__stage-layout">
        <div className="ppc-operation-wait__stage-main">
          <div className="ppc-operation-wait__stage-card">
            <div className="ppc-operation-wait__stage-head">
              <div>
                <div className="ppc-operation-wait__stage-title">{stageTitle}</div>
                {stageMeta && (
                  <div className="ppc-operation-wait__stage-meta">{stageMeta}</div>
                )}
              </div>
              <div className="ppc-operation-wait__stage-status">{stageStatus}</div>
            </div>
            <div className="ppc-operation-wait__stage-visual">
              <div className="ppc-operation-wait__stage-visual-inner">
                <div className="ppc-operation-wait__stage-center-label">{stageTitle}</div>
                {stageMeta && (
                  <div className="ppc-operation-wait__stage-center-sub">{stageMeta}</div>
                )}
              </div>
            </div>
            <div className="ppc-operation-wait__stage-attributes">
              <div className="ppc-operation-wait__stage-attribute">
                <span>{ppcT('OperatorApp.Height', 'Altezza')}</span>
                <strong>{`${formatNumber(primaryUnit?.height)} mm`}</strong>
              </div>
              <div className="ppc-operation-wait__stage-attribute">
                <span>{ppcT('OperatorApp.Weight', 'Peso')}</span>
                <strong>{`${formatNumber(primaryUnit?.weight)} kg`}</strong>
              </div>
              <div className="ppc-operation-wait__stage-attribute">
                <span>{ppcT('OperatorApp.State', 'Stato')}</span>
                <strong>{primaryUnit?.status ?? '--'}</strong>
              </div>
            </div>
            <div className="ppc-operation-wait__stage-detail">{movementDetailText}</div>
          </div>
        </div>

        <aside className="ppc-operation-wait__stage-sidebar">
          <div className="ppc-operation-wait__sidebar-icons">
            <button type="button" className="ppc-operation-wait__sidebar-icon-button" aria-label="Grid">
              <LayoutGrid size={22} />
            </button>
            <button type="button" className="ppc-operation-wait__sidebar-icon-button" aria-label="Print">
              <Printer size={22} />
            </button>
          </div>
          <div className="ppc-operation-wait__sidebar-info">
            <div className="ppc-operation-wait__sidebar-info-title">{drawerPresentLabel}</div>
            <div className="ppc-operation-wait__sidebar-info-row">
              <span>{ppcT('OperatorApp.Height', 'Altezza')}</span>
              <strong>{primaryUnit ? `${formatNumber(primaryUnit.height)} mm` : '--'}</strong>
            </div>
            <div className="ppc-operation-wait__sidebar-info-row">
              <span>{ppcT('OperatorApp.Weight', 'Peso')}</span>
              <strong>{primaryUnit ? `${formatNumber(primaryUnit.weight)} kg` : '--'}</strong>
            </div>
            <div className="ppc-operation-wait__sidebar-info-row">
              <span>{ppcT('OperatorApp.Mission', 'Missione')}</span>
              <strong>{activeMission?.id ?? '--'}</strong>
            </div>
            <div className="ppc-operation-wait__sidebar-info-row">
              <span>{ppcT('OperatorApp.ElevatorPosition', 'Posizione elevatore')}</span>
              <strong>{elevatorDistance}</strong>
            </div>
            {elevatorCellLabel && (
              <div className="ppc-operation-wait__sidebar-info-row">
                <span>{ppcT('OperatorApp.Cell', 'Cella')}</span>
                <strong>{elevatorCellLabel}</strong>
              </div>
            )}
          </div>
          <div className="ppc-operation-wait__sidebar-actions">
            <PpcActionButton label={ppcT('General.Modify', 'Modifica')} />
            <PpcActionButton
              label={ppcT('OperatorApp.DrawerRecall', 'Rientro cassetto')}
              tone="warning"
            />
            <PpcActionButton
              label={ppcT('OperatorApp.Missions', 'Missioni')}
              onClick={handleGoToMissions}
              className="ppc-operation-wait__mission-button"
            />
            <PpcActionButton label={ppcT('General.Back', 'Indietro')} onClick={handleGoBack} />
          </div>
          <div className="ppc-operation-wait__sidebar-machine">
            {!animationEnabled && (
              <img
                className="ppc-operation-wait__machine-compact"
                src="/ppc-assets/Vertimag_Baia_Ergo_Scontorno.png"
                alt="Vertimag"
              />
            )}
            {animationEnabled && (
              <div className="ppc-operation-wait__machine-compact-anim">
                <img
                  className="ppc-operation-wait__machine-compact"
                  src="/ppc-assets/Vertimag_Baia_Ergo_Scontorno.png"
                  alt="Vertimag"
                />
                {elevatorY !== null && (
                  <img
                    className="ppc-operation-wait__elevator-compact"
                    src="/ppc-assets/Elevator.png"
                    alt="Elevator"
                    style={{ transform: `translateY(${elevatorY}px)` }}
                  />
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="ppc-operation-wait__details-grid">
        <div className="ppc-operation-wait__section">
          <div className="ppc-operation-wait__section-title">{loadingUnitsInfo}</div>
          {loadingUnitsToMove.length > 0 && (
            <div className="ppc-operation-wait__table-wrapper">
              <table className="ppc-operation-wait__table">
                <thead>
                  <tr>
                    <th>{ppcT('OperatorApp.OtherDrawerDataGridHeaderDrawer', 'Cassetto')}</th>
                    <th>{ppcT('OperatorApp.OtherDrawerDataGridHeaderHeight', 'Altezza')}</th>
                    <th>{ppcT('OperatorApp.OtherDrawerDataGridHeaderWeight', 'Peso')}</th>
                    <th>{ppcT('OperatorApp.OtherDrawerDataGridHeaderState', 'Stato')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUnitsToMove.map((unit) => (
                    <tr key={unit.id}>
                      <td>{unit.code}</td>
                      <td>{formatNumber(unit.height)}</td>
                      <td>{formatNumber(unit.weight)}</td>
                      <td>{unit.status ?? '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {moveUnits.length > 0 && (
          <div className="ppc-operation-wait__section">
            <div className="ppc-operation-wait__section-title">
              {ppcT('OperatorApp.DrawerActivityLocalCallGoBack', 'Rientro cassetto')}
            </div>
            <div className="ppc-operation-wait__table-wrapper">
              <table className="ppc-operation-wait__table">
                <thead>
                  <tr>
                    <th>{ppcT('OperatorApp.OtherDrawerDataGridHeaderDrawer', 'Cassetto')}</th>
                    <th>{ppcT('OperatorApp.OtherDrawerDataGridHeaderHeight', 'Altezza')}</th>
                    <th>{ppcT('OperatorApp.OtherDrawerDataGridHeaderWeight', 'Peso')}</th>
                    <th>{ppcT('OperatorApp.OtherDrawerDataGridHeaderState', 'Stato')}</th>
                  </tr>
                </thead>
                <tbody>
                  {moveUnits.map((unit) => (
                    <tr key={unit.id}>
                      <td>{unit.code}</td>
                      <td>{formatNumber(unit.height)}</td>
                      <td>{formatNumber(unit.weight)}</td>
                      <td>{unit.status ?? '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {waitingLists.length > 0 && (
          <div className="ppc-operation-wait__section">
            <div className="ppc-operation-wait__section-title">
              {ppcT('OperatorApp.WaitingList', 'Liste in attesa')} {waitingLists.length}
            </div>
            <div className="ppc-operation-wait__table-wrapper">
              <table className="ppc-operation-wait__table">
                <thead>
                  <tr>
                    <th>{ppcT('OperatorApp.WaitingListDataGridHeaderList', 'Lista')}</th>
                    <th>{ppcT('OperatorApp.WaitingListDataGridHeaderType', 'Tipo')}</th>
                    <th>{ppcT('OperatorApp.WaitingListDataGridHeaderDescription', 'Descrizione')}</th>
                    <th>{ppcT('OperatorApp.Priority', 'Priorità')}</th>
                  </tr>
                </thead>
                <tbody>
                  {waitingLists.map((list) => (
                    <tr key={list.id}>
                      <td>{list.code}</td>
                      <td>{resolveListTypeLabel(list.itemListType)}</td>
                      <td>{list.description ?? '--'}</td>
                      <td>{list.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default PpcOperatorItemOperationWaitPage;


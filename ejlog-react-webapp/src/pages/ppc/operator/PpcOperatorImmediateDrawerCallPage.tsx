import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VirtualNumpad from '../../../components/touch/VirtualNumpad';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { ppcViews } from '../../../features/ppc/ppcViews';
import {
  useGetLoadingUnitsQuery,
} from '../../../services/api/ppcAutomationApi';
import ppcAutomationService from '../../../services/ppc/automationService';
import { usePermissions } from '../../../hooks/usePermissions';

type DrawerRow = {
  id: number;
  code?: string;
  height?: number | null;
  weight?: number | null;
  maxWeight?: number | null;
  cell?: string;
  side?: string;
  status?: string;
  note?: string;
  isHeightFixed?: boolean | null;
  isCellFixed?: boolean | null;
};

const getRoute = (viewName: string): string => {
  const match = ppcViews.find(
    (view) => view.moduleSlug === 'operator' && view.view === viewName
  );
  return match?.route || '/ppc/operator';
};

const formatDrawerId = (id: number) => String(id).padStart(3, '0');

const formatValue = (value: number | null | undefined, fallback = '--') => {
  if (value == null || !Number.isFinite(value)) {
    return fallback;
  }
  return value.toFixed(2);
};

const formatPercent = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  return value > 1 ? value : value * 100;
};

const mapStatusLabel = (value: number | string | null | undefined): string => {
  if (value == null) return '--';
  if (typeof value === 'string') return value;
  switch (value) {
    case 1:
      return ppcT('InstallationApp.LoadingUnitStatus_InBay', 'In Baia');
    case 2:
      return ppcT('InstallationApp.LoadingUnitStatus_InElevator', 'In Elevatore');
    case 3:
      return ppcT('InstallationApp.LoadingUnitStatus_InLocation', 'In Locazione');
    case 4:
      return ppcT('InstallationApp.LoadingUnitStatus_OnMovementToBay', 'Trasferimento');
    case 5:
      return ppcT('InstallationApp.LoadingUnitStatus_OnMovementToLocation', 'Trasferimento');
    case 6:
      return ppcT('InstallationApp.LoadingUnitStatus_InCarousel', 'In Carosello');
    case 7:
      return ppcT('InstallationApp.LoadingUnitStatus_InTrolley', 'In Carrello');
    case 8:
      return ppcT('InstallationApp.LoadingUnitStatus_Blocked', 'Bloccato');
    default:
      return ppcT('InstallationApp.LoadingUnitStatus_Undefined', 'Non definito');
  }
};

const mapSideLabel = (value: number | string | null | undefined): string => {
  if (value == null) return '--';
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized.includes('back') || normalized.includes('rear') || normalized.includes('post')) {
      return ppcT('General.WarehouseSide_Back', 'Posteriore');
    }
    if (normalized.includes('front') || normalized.includes('anter')) {
      return ppcT('General.WarehouseSide_Front', 'Anteriore');
    }
    return value;
  }
  if (value === 1) {
    return ppcT('General.WarehouseSide_Back', 'Posteriore');
  }
  if (value === 0) {
    return ppcT('General.WarehouseSide_Front', 'Anteriore');
  }
  return String(value);
};

const PpcOperatorImmediateDrawerCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = usePermissions();
  const { data: loadingUnits = [], isLoading } = useGetLoadingUnitsQuery(undefined, {
    pollingInterval: 4000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [drawerInput, setDrawerInput] = useState('');
  const [showDrawerNumpad, setShowDrawerNumpad] = useState(false);
  const selectedUnit = loadingUnits[selectedIndex];
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!loadingUnits.length) {
      setSelectedIndex(0);
      return;
    }
    if (selectedIndex >= loadingUnits.length) {
      setSelectedIndex(0);
    }
  }, [loadingUnits.length, selectedIndex]);

  useEffect(() => {
    if (!selectedUnit) {
      setDrawerInput('');
      return;
    }
    const label = selectedUnit.Code ?? formatDrawerId(selectedUnit.Id ?? 0);
    setDrawerInput(label);
  }, [selectedUnit]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timer = window.setTimeout(() => setStatusMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const rows = useMemo<DrawerRow[]>(() => {
    return loadingUnits.map((unit) => {
      const weightValue = unit.NetWeight ?? null;
      const maxWeightValue = unit.MaxNetWeight ?? null;
      const cellLabel = unit.CellId != null ? String(unit.CellId) : '--';
      const statusLabel = mapStatusLabel(unit.Status ?? null);
      const sideLabel = mapSideLabel(unit.Cell?.Side ?? null);
      const noteValue = unit.Description ?? '--';

      return {
        id: unit.Id ?? 0,
        code: unit.Code ?? undefined,
        height: unit.Height ?? null,
        weight: weightValue,
        maxWeight: maxWeightValue,
        cell: cellLabel,
        side: sideLabel,
        status: statusLabel,
        note: noteValue,
        isHeightFixed: unit.IsHeightFixed ?? null,
        isCellFixed: unit.IsCellFixed ?? null,
      };
    });
  }, [loadingUnits]);

  const handleSelectRow = (index: number) => {
    setSelectedIndex(index);
  };

  const handleOpenDrawerPreview = (index: number) => {
    const unit = loadingUnits[index];
    if (!unit) {
      return;
    }
    const value = unit.Code ?? formatDrawerId(unit.Id ?? 0);
    navigate(`/ppc/operator/drawer-preview?drawer=${encodeURIComponent(value)}&embedded=ppc`);
  };

  const handleStep = (delta: number) => {
    if (!loadingUnits.length) {
      return;
    }
    setSelectedIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next >= loadingUnits.length) return loadingUnits.length - 1;
      return next;
    });
  };

  const handleDrawerLookup = (value: string) => {
    if (!loadingUnits.length) {
      return;
    }
    const normalized = value.trim();
    if (!normalized) {
      return;
    }
    const numericValue = Number(normalized);
    const matchIndex = loadingUnits.findIndex((unit) => {
      if (!unit) return false;
      if (unit.Code && unit.Code.toLowerCase() === normalized.toLowerCase()) {
        return true;
      }
      if (Number.isFinite(numericValue) && unit.Id === numericValue) {
        return true;
      }
      if (Number.isFinite(numericValue) && formatDrawerId(unit.Id ?? 0) === normalized) {
        return true;
      }
      return false;
    });
    if (matchIndex >= 0) {
      setSelectedIndex(matchIndex);
      return;
    }
    setStatusMessage(ppcT('OperatorApp.DrawerNotFound', 'Cassetto non trovato'));
  };

  const handleDrawerInputCommit = () => {
    handleDrawerLookup(drawerInput);
  };

  const handleCallDrawer = async () => {
    if (!selectedUnit?.Id) {
      setStatusMessage(ppcT('OperatorApp.NoLoadingUnitSelected', 'Seleziona un cassetto'));
      return;
    }
    const confirmMessage = ppcT(
      'OperatorApp.ConfirmImmediateDrawerCall',
      'Confermi la chiamata del cassetto selezionato?'
    );
    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      const userName = user?.username || user?.fullName;
      await ppcAutomationService.moveLoadingUnitToBay(selectedUnit.Id, userName);
      setStatusMessage(ppcT('OperatorApp.DrawerCallStarted', 'Chiamata avviata'));
    } catch {
      setStatusMessage(ppcT('OperatorApp.DrawerCallError', 'Errore durante la chiamata'));
    }
  };

  const handleBack = () => {
    navigate(getRoute('OperatorMenuView'));
  };

  const drawerLabel = selectedUnit?.Id ? formatDrawerId(selectedUnit.Id) : '--';

  return (
    <div className="ppc-operator-call">
      <div className="ppc-operator-call__header">
        <div className="ppc-operator-call__title">
          <span className="ppc-operator-call__title-number">1.4</span>
          <span>{ppcT('OperatorApp.OtherNavigationImmediateDrawerCall', 'Richiesta immediata cassetto')}</span>
        </div>
        <div className="ppc-operator-call__subtitle">
          {ppcT(
            'OperatorApp.OtherNavigationImmediateDrawerCallDescription',
            "La procedura permette di chiamare il cassetto selezionato nella baia su cui l'operatore sta lavorando."
          )}
        </div>
      </div>

      <div className="ppc-operator-call__content">
        <div className="ppc-operator-call__table-wrap">
          <div className="ppc-operator-call__table ppc-table">
            <div className="ppc-operator-call__table-row ppc-table__header">
              <div>{ppcT('OperatorApp.OtherDrawerDataGridHeaderDrawer', 'Cassetto')}</div>
              <div>{ppcT('OperatorApp.OtherDrawerDataGridHeaderHeight', 'Altezza')}</div>
              <div>{ppcT('OperatorApp.OtherDrawerDataGridHeaderWeight', 'Peso')}</div>
              <div>{ppcT('OperatorApp.OtherDrawerDataGridHeaderCell', 'Cella')}</div>
              <div>{ppcT('OperatorApp.OtherDrawerDataGridHeaderSide', 'Lato')}</div>
              <div>{ppcT('OperatorApp.OtherDrawerDataGridHeaderState', 'Stato')}</div>
              <div>{ppcT('OperatorApp.OtherDrawerDataGridHeaderNotes', 'Note')}</div>
            </div>
            <div className="ppc-operator-call__table-body">
              {isLoading && (
                <div className="ppc-operator-call__table-empty">
                  {ppcT('General.Loading', 'Caricamento...')}
                </div>
              )}
              {!isLoading && rows.length === 0 && (
                <div className="ppc-operator-call__table-empty">
                  {ppcT('OperatorApp.NoLoadingUnits', 'Nessun cassetto disponibile')}
                </div>
              )}
              {rows.map((row, index) => {
                const isSelected = index === selectedIndex;
                const maxWeight = row.maxWeight && row.maxWeight > 0 ? row.maxWeight : null;
                const fill = maxWeight ? (Number(row.weight ?? 0) / maxWeight) * 100 : 0;
                return (
                  <button
                    key={row.id}
                    type="button"
                    className={`ppc-operator-call__table-row${isSelected ? ' is-selected' : ''}`}
                    onClick={() => handleSelectRow(index)}
                    onDoubleClick={() => handleOpenDrawerPreview(index)}
                  >
                    <div>{row.code ?? formatDrawerId(row.id)}</div>
                    <div>
                      {formatValue(row.height)}
                      {row.isHeightFixed ? '*' : ''}
                    </div>
                    <div className="ppc-operator-call__weight-cell">
                      <div className="ppc-operator-call__weight-bar">
                        <span
                          className="ppc-operator-call__weight-fill"
                          style={{ width: `${Math.max(0, Math.min(100, fill))}%` }}
                        />
                        <span className="ppc-operator-call__weight-text">
                          {formatValue(row.weight)}
                        </span>
                      </div>
                    </div>
                    <div>
                      {row.cell}
                      {row.isCellFixed ? '*' : ''}
                    </div>
                    <div>{row.side}</div>
                    <div>{row.status}</div>
                    <div>{row.note}</div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        <div className="ppc-operator-call__side">
          <div className="ppc-operator-call__panel">
            <div className="ppc-operator-call__panel-title">
              {ppcT('OperatorApp.OtherDrawerDataGridHeaderDrawer', 'Cassetto')}
            </div>
            <div className="ppc-operator-call__selector">
              <button
                type="button"
                className="ppc-operator-call__selector-btn"
                onClick={() => handleStep(-1)}
                aria-label="Drawer previous"
              >
                <Minus size={22} />
              </button>
              <input
                className="ppc-operator-call__selector-input"
                value={drawerInput}
                onChange={(event) => setDrawerInput(event.target.value)}
                onBlur={handleDrawerInputCommit}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleDrawerInputCommit();
                  }
                }}
                onFocus={() => setShowDrawerNumpad(true)}
                aria-label={ppcT('OperatorApp.OtherDrawerDataGridHeaderDrawer', 'Cassetto')}
              />
              <button
                type="button"
                className="ppc-operator-call__selector-btn"
                onClick={() => handleStep(1)}
                aria-label="Drawer next"
              >
                <Plus size={22} />
              </button>
            </div>
          </div>

          <button
            type="button"
            className="ppc-operator-call__side-button"
            onClick={() => navigate(getRoute('WaitingListsView'))}
          >
            {ppcT('OperatorApp.MissionList', 'Elenco missioni')}
          </button>

          <button type="button" className="ppc-operator-call__side-button is-disabled" disabled>
            {ppcT('General.Notes', 'Note')}
          </button>

          <div className="ppc-operator-call__side-spacer" />

          {statusMessage && <div className="ppc-operator-call__status">{statusMessage}</div>}

          <button
            type="button"
            className="ppc-operator-call__call-button"
            onClick={handleCallDrawer}
          >
            {ppcT('OperatorApp.OtherNavigationImmediateDrawerCall', 'Chiama cassetto')}
          </button>

          <button type="button" className="ppc-operator-call__back-button" onClick={handleBack}>
            {ppcT('General.Back', 'Indietro')}
          </button>
        </div>
      </div>

      {showDrawerNumpad && (
        <VirtualNumpad
          value={drawerInput}
          onChange={setDrawerInput}
          onClose={() => {
            setShowDrawerNumpad(false);
            handleDrawerInputCommit();
          }}
          maxLength={10}
          title={ppcT('OperatorApp.SelectDrawer', 'Seleziona cassetto')}
        />
      )}
    </div>
  );
};

export default PpcOperatorImmediateDrawerCallPage;

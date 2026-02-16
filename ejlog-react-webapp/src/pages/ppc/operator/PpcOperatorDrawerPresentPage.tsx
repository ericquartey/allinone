import React, { useMemo, useEffect, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcMachineStatus from '../../../hooks/usePpcMachineStatus';
import { useGetBayQuery } from '../../../services/api/ppcAutomationApi';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import type { LoadingUnit } from '../../../services/ppc/automationTypes';
import { CompartmentView2D } from '../../../components/drawers/CompartmentView2D';
import { CompartmentView3D } from '../../../components/drawers/CompartmentView3D';
import { drawersApi } from '../../../services/drawersApi';
import ppcAutomationService from '../../../services/ppc/automationService';

const formatTemplate = (template: string, ...values: Array<string | number>) =>
  template.replace(/\{(\d+)\}/g, (_match, index) => {
    const value = values[Number(index)];
    return value === undefined ? '' : String(value);
  });

const formatNumber = (value?: number | null, decimals = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toFixed(decimals);
};

const toNumberOrNull = (value: any) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const PpcOperatorDrawerPresentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { bayNumber } = usePpcMachineStatus({ pollIntervalMs: 2000 });
  const [actionMessage, setActionMessage] = useState('');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [selectedCompartment, setSelectedCompartment] = useState<any | null>(null);
  const [drawerDimensions, setDrawerDimensions] = useState<{ width: number; depth: number; height?: number } | null>(null);
  const [dbUnit, setDbUnit] = useState<any | null>(null);
  const [dbCompartments, setDbCompartments] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState('');
  const [manualDrawer, setManualDrawer] = useState('');
  const [drawerInput, setDrawerInput] = useState('');
  const [recallLoading, setRecallLoading] = useState(false);

  const { data: bay } = useGetBayQuery(bayNumber ?? skipToken, {
    pollingInterval: 1500,
    refetchOnFocus: true,
  });

  const upperPositionUnit = useMemo(() => {
    const positions = bay?.Positions ?? [];
    const upperPosition = positions.find((position) => position.IsUpper);
    return upperPosition?.LoadingUnit ?? null;
  }, [bay]);

  const activeUnit: LoadingUnit | null = upperPositionUnit;
  const activeUnitId = activeUnit?.Id ?? null;
  const requestedDrawer =
    manualDrawer ||
    searchParams.get('drawer') ||
    searchParams.get('drawerId') ||
    searchParams.get('udc') ||
    '';

  const getUnitField = (unit: any, keys: string[]) => {
    for (const key of keys) {
      const value = unit?.[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return null;
  };

  const normalizeDrawerToken = (value: string) => value.trim().toLowerCase();
  const toNumeric = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const matchesDrawerQuery = (drawer: any, query: string) => {
    if (!drawer || !query) return false;
    const normalized = normalizeDrawerToken(query);
    const numericQuery = toNumeric(query);
    const idValue = drawer.id ?? drawer.Id;
    if (idValue != null) {
      if (String(idValue).toLowerCase() === normalized) return true;
      if (numericQuery !== null && idValue === numericQuery) return true;
      if (numericQuery !== null && String(idValue).padStart(query.length, '0') === query) return true;
    }
    const codeValue = drawer.code ?? drawer.Code;
    if (codeValue != null) {
      const codeText = String(codeValue).trim().toLowerCase();
      if (codeText === normalized) return true;
      const numericCode = toNumeric(codeText);
      if (numericQuery !== null && numericCode !== null && numericCode === numericQuery) return true;
      if (numericQuery !== null && numericCode !== null && String(numericCode).padStart(query.length, '0') === query) {
        return true;
      }
    }
    const barcodeValue = drawer.barcode ?? drawer.Barcode;
    if (barcodeValue != null && String(barcodeValue).trim().toLowerCase() === normalized) return true;
    return false;
  };

  const resolveDrawerId = (drawer: any) => {
    const idValue = getUnitField(drawer, ['id', 'Id', 'ID']);
    const numericId = idValue != null ? Number(idValue) : null;
    if (numericId != null && Number.isFinite(numericId)) return numericId;
    const codeValue = getUnitField(drawer, ['code', 'Code', 'numeroUdc', 'NumeroUdc']);
    const numericCode = codeValue != null ? toNumeric(String(codeValue)) : null;
    return numericCode != null ? numericCode : null;
  };

  const findDrawerByQuery = async (query: string) => {
    if (!query) return null;
    const pageSize = 500;

    const trySearch = async (searchValue: string) => {
      let offset = 0;
      let total = Number.POSITIVE_INFINITY;
      while (offset < total && offset < 10000) {
        const response = await drawersApi.getAllLoadingUnits({ search: searchValue, limit: pageSize, offset });
        const candidates = response?.items || [];
        if (candidates.length === 1) return candidates[0];
        const matched = candidates.find((item) => matchesDrawerQuery(item, searchValue));
        if (matched) return matched;
        total = response?.totalCount ?? candidates.length;
        offset += pageSize;
        if (candidates.length === 0) break;
      }
      return null;
    };

    const matched = await trySearch(query);
    if (matched) return matched;

    let offset = 0;
    let total = Number.POSITIVE_INFINITY;
    while (offset < total && offset < 10000) {
      const response = await drawersApi.getAllLoadingUnits({ limit: pageSize, offset });
      const candidates = response?.items || [];
      const fallbackMatch = candidates.find((item) => matchesDrawerQuery(item, query));
      if (fallbackMatch) return fallbackMatch;
      total = response?.totalCount ?? candidates.length;
      offset += pageSize;
      if (candidates.length === 0) break;
    }
    return null;
  };

  const drawerLabel = activeUnitId
    ? (getUnitField(activeUnit, ['Code', 'code']) ?? String(activeUnitId))
    : (getUnitField(dbUnit, ['Code', 'code']) ?? (dbUnit?.id ? String(dbUnit.id) : '--'));
  const heightLabel = activeUnitId
    ? formatNumber(getUnitField(activeUnit, ['Height', 'height']))
    : formatNumber(getUnitField(dbUnit, ['Height', 'height']));
  const weightLabel = activeUnitId
    ? formatNumber(getUnitField(activeUnit, ['NetWeight', 'netWeight', 'weight', 'Weight']))
    : formatNumber(getUnitField(dbUnit, ['NetWeight', 'netWeight', 'weight', 'Weight']));
  const dataSourceLabel = activeUnitId || dbUnit
    ? 'Dati EJLOG (database)'
    : 'Nessun cassetto disponibile';

  const title = (activeUnitId || dbUnit)
    ? formatTemplate(
        ppcT('OperatorApp.DrawerPresentTitle', 'Cassetto {0} in baia'),
        drawerLabel
      )
    : ppcT('OperatorApp.NoDrawerInBayTitle', 'Nessun cassetto in baia');

  const centerLabel = (activeUnitId || dbUnit)
    ? formatTemplate(ppcT('OperatorApp.DrawerPresentCenter', 'Cassetto {0} presente'), drawerLabel)
    : ppcT('OperatorApp.NoDrawerInBay', 'Nessun cassetto presente');

  const detailsLine = formatTemplate(
    ppcT('OperatorApp.DrawerPresentDetails', '(Altezza: {0} mm, Peso: {1} kg)'),
    heightLabel,
    weightLabel
  );

  useEffect(() => {
    if (!activeUnitId && !requestedDrawer) {
      setDbUnit(null);
      setDbCompartments([]);
      setDbError('');
      return;
    }

    let isMounted = true;
    const loadDrawer = async () => {
      setDbLoading(true);
      setDbError('');
      try {
        let matched = null;
        let resolvedId: number | null = null;
        let code = '';

        if (activeUnitId) {
          code = getUnitField(activeUnit, ['Code', 'code']) ?? '';
          const idText = String(activeUnitId);
          const candidateQueries = [
            code,
            idText,
            idText.padStart(3, '0'),
            idText.padStart(4, '0'),
          ].filter((value, index, self) => value && self.indexOf(value) === index);

          for (const candidate of candidateQueries) {
            matched = await findDrawerByQuery(candidate);
            if (matched) break;
          }

          if (matched && isMounted) {
            setDbUnit(matched);
          }

          resolvedId = matched ? resolveDrawerId(matched) : activeUnitId;
        } else if (requestedDrawer) {
          matched = await findDrawerByQuery(requestedDrawer);
          resolvedId = matched ? resolveDrawerId(matched) : null;
          if (!matched && resolvedId == null) {
            resolvedId = toNumeric(requestedDrawer);
          }
          if (matched && isMounted) {
            setDbUnit(matched);
          } else if (resolvedId && isMounted) {
            setDbUnit({ id: resolvedId, code: requestedDrawer });
          }
          code = requestedDrawer;
        }

        if (!resolvedId) {
          if (isMounted) {
            setDbUnit(null);
            setDbCompartments([]);
          }
          return;
        }

        let response = await drawersApi.getCompartmentsByLoadingUnit(resolvedId);
        let items = response?.items || [];

        const numericCode = toNumeric(String(code));
        if (items.length === 0 && numericCode && numericCode !== resolvedId) {
          const altResponse = await drawersApi.getCompartmentsByLoadingUnit(numericCode);
          if (altResponse?.items && altResponse.items.length > 0) {
            items = altResponse.items;
            if (!matched && isMounted) {
              setDbUnit({ id: numericCode, code });
            }
          }
        }

        if (isMounted) {
          setDbCompartments(items);
        }
      } catch (error) {
        console.error('Error loading EJLOG drawer data:', error);
        if (isMounted) setDbError(ppcT('General.Error', 'Errore caricamento cassetto'));
      } finally {
        if (isMounted) setDbLoading(false);
      }
    };

    loadDrawer();
    return () => {
      isMounted = false;
    };
  }, [activeUnitId, activeUnit?.Code, requestedDrawer]);

  useEffect(() => {
    if (dbUnit) {
      setDrawerDimensions({
        width: getUnitField(dbUnit, ['width', 'Width']) || 1950,
        depth: getUnitField(dbUnit, ['depth', 'Depth']) || 650,
        height: getUnitField(dbUnit, ['height', 'Height']) || undefined,
      });
      return;
    }

    if (activeUnit) {
      setDrawerDimensions({
        width: getUnitField(activeUnit, ['width', 'Width']) || 1950,
        depth: getUnitField(activeUnit, ['depth', 'Depth']) || 650,
        height: getUnitField(activeUnit, ['height', 'Height']) || activeUnit.Height || undefined,
      });
      return;
    }

    setDrawerDimensions(null);
  }, [dbUnit, activeUnit]);

  useEffect(() => {
    if (activeUnitId || requestedDrawer) {
      setViewMode('2d');
    }
  }, [activeUnitId, requestedDrawer]);

  useEffect(() => {
    if (!actionMessage) return undefined;
    const timer = window.setTimeout(() => setActionMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const loadingUnitForView = useMemo(() => {
    return {
      code: getUnitField(dbUnit, ['Code', 'code']) ?? drawerLabel,
      description: getUnitField(dbUnit, ['Description', 'description']) ?? undefined,
      width: drawerDimensions?.width || getUnitField(dbUnit, ['width', 'Width']) || 1950,
      depth: drawerDimensions?.depth || getUnitField(dbUnit, ['depth', 'Depth']) || 650,
      height: drawerDimensions?.height || getUnitField(dbUnit, ['height', 'Height']) || 0,
    };
  }, [drawerDimensions, dbUnit, drawerLabel]);

  const getField = (obj: any, keys: string[]) => {
    for (const key of keys) {
      const value = obj?.[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return null;
  };

  const getArticleInfo = (compartment: any) => {
    const products = compartment?.Products || compartment?.products;
    const firstProduct = Array.isArray(products) ? products[0] : null;

    const normalizeArticle = (value: any): string | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'object') {
        const nested = getField(value, ['code', 'Code', 'itemCode', 'ItemCode', 'Item', 'item']);
        if (nested && typeof nested === 'object') {
          const nestedCode = getField(nested, ['code', 'Code', 'itemCode', 'ItemCode']);
          return nestedCode != null ? String(nestedCode) : null;
        }
        return nested != null ? String(nested) : null;
      }
      return String(value);
    };

    const normalizeQuantity = (value: any): number | string | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'object') {
        const nested = getField(value, ['quantity', 'Quantity', 'qta', 'Qta', 'stockedQuantity', 'StockedQuantity']);
        if (nested === null || nested === undefined) return null;
        return typeof nested === 'number' || typeof nested === 'string' ? nested : String(nested);
      }
      return value;
    };

    const articleCodeRaw =
      getField(firstProduct, ['Item', 'item', 'ItemCode', 'itemCode', 'Code', 'code']) ||
      getField(compartment, ['ArticleCode', 'articleCode', 'CodiceArticolo', 'codiceArticolo']);
    const quantityRaw =
      getField(firstProduct, ['StockedQuantity', 'stockedQuantity', 'Quantity', 'quantity', 'Qta', 'qta']) ||
      getField(compartment, ['QtaProdotti', 'qtaProdotti', 'Quantity', 'quantity', 'currentQuantity', 'CurrentQuantity']);

    const articleCode = normalizeArticle(articleCodeRaw);
    const quantity = normalizeQuantity(quantityRaw);

    return {
      articleCode: articleCode || '--',
      quantity: quantity ?? '--',
    };
  };

  const normalizedCompartments = useMemo(() => {
    if (!dbCompartments.length) return [];

    const unitWidth = loadingUnitForView.width || 1950;
    const unitDepth = loadingUnitForView.depth || 650;

    const hasGeometry = dbCompartments.some((compartment: any) => {
      const width = toNumberOrNull(getField(compartment, ['Width', 'width', 'DimX', 'dimX', 'width']));
      const depth = toNumberOrNull(getField(compartment, ['Depth', 'depth', 'DimY', 'dimY', 'depth']));
      const x = toNumberOrNull(getField(compartment, ['X', 'x', 'PosX', 'posX', 'xPosition', 'XPosition']));
      const y = toNumberOrNull(getField(compartment, ['Y', 'y', 'PosY', 'posY', 'yPosition', 'YPosition']));
      return width !== null && width > 0 && depth !== null && depth > 0 && x !== null && y !== null;
    });

    let cols = Math.ceil(Math.sqrt(dbCompartments.length));
    let rows = Math.ceil(dbCompartments.length / cols);
    if (cols < 1) cols = 1;
    if (rows < 1) rows = 1;

    const gridWidth = unitWidth / cols;
    const gridDepth = unitDepth / rows;

    return dbCompartments.map((compartment: any, index: number) => {
      const id = getField(compartment, ['Id', 'id']) ?? index + 1;
      const code = getField(compartment, ['Code', 'code', 'Barcode', 'barcode', 'Coordinate', 'coordinate']);
      const fill =
        toNumberOrNull(getField(compartment, ['FillPercentage', 'fillPercentage', 'PctRiempimento', 'pctRiempimento'])) ?? 0;
      const { articleCode, quantity } = getArticleInfo(compartment);

      if (hasGeometry) {
        const width = toNumberOrNull(getField(compartment, ['Width', 'width', 'DimX', 'dimX'])) ?? gridWidth;
        const depth = toNumberOrNull(getField(compartment, ['Depth', 'depth', 'DimY', 'dimY'])) ?? gridDepth;
        const x = toNumberOrNull(getField(compartment, ['X', 'x', 'PosX', 'posX', 'xPosition', 'XPosition'])) ?? 0;
        const y = toNumberOrNull(getField(compartment, ['Y', 'y', 'PosY', 'posY', 'yPosition', 'YPosition'])) ?? 0;

        return {
          id,
          barcode: code,
          xPosition: x,
          yPosition: y,
          width,
          depth,
          fillPercentage: fill,
          currentQuantity: quantity ?? 0,
          articleCode,
        };
      }

      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        id,
        barcode: code ?? `C-${row + 1}-${col + 1}`,
        xPosition: col * gridWidth,
        yPosition: row * gridDepth,
        width: gridWidth,
        depth: gridDepth,
        fillPercentage: fill,
        currentQuantity: quantity ?? 0,
        articleCode,
      };
    });
  }, [dbCompartments, loadingUnitForView]);

  const resolveRecallId = () => {
    if (activeUnitId) return activeUnitId;
    const dbId = dbUnit?.id ?? dbUnit?.Id;
    if (dbId !== null && dbId !== undefined) {
      const numeric = Number(dbId);
      return Number.isFinite(numeric) ? numeric : null;
    }
    const code = getUnitField(dbUnit, ['code', 'Code', 'numeroUdc', 'NumeroUdc']) ?? drawerLabel;
    const numericCode = code ? toNumeric(String(code)) : null;
    return numericCode != null ? numericCode : null;
  };

  const handleRecallDrawer = async () => {
    const id = resolveRecallId();
    if (!id) {
      setActionMessage(ppcT('OperatorApp.NoLoadingUnitSelected', 'Seleziona un cassetto'));
      return;
    }
    setRecallLoading(true);
    try {
      await ppcAutomationService.startMovingLoadingUnitToCell(id, null);
      setActionMessage(ppcT('OperatorApp.DrawerRecall', 'Rientro cassetto'));
    } catch (error) {
      console.error('Error recalling drawer:', error);
      setActionMessage(ppcT('General.Error', 'Errore rientro cassetto'));
    } finally {
      setRecallLoading(false);
    }
  };
  const handleManualLoad = () => {
    const value = drawerInput.trim();
    if (!value) return;
    setManualDrawer(value);
  };

  return (
    <div className="ppc-drawer-present">
      <header className="ppc-drawer-present__header">
        <div className="ppc-drawer-present__title">{title}</div>
        <div className="ppc-drawer-present__status">Fonte dati: {dataSourceLabel}</div>
        <div className="ppc-drawer-present__headline">{centerLabel}</div>
        <div className="ppc-drawer-present__subline">{detailsLine}</div>
      </header>

      <div className="ppc-drawer-present__content ppc-drawer-present__content--ejlog">
        <section className="ppc-drawer-present__left" style={{ flex: '0 0 260px', maxWidth: 260 }}>
          <div className="ppc-drawer-present__left-card">
            <div className="ppc-drawer-present__card-title">
              {ppcT('OperatorApp.DrawerSelector', 'Seleziona cassetto')}
            </div>
            <div className="ppc-drawer-present__info-row">
              <input
                className="ppc-drawer-present__recall-input"
                placeholder={ppcT('OperatorApp.DrawerCode', 'Codice o ID')}
                value={drawerInput}
                onChange={(event) => setDrawerInput(event.target.value)}
              />
            </div>
            <PpcActionButton
              label={ppcT('General.Load', 'Carica')}
              className="ppc-drawer-present__button"
              onClick={handleManualLoad}
            />
          </div>

          <div className="ppc-drawer-present__left-card">
            <div className="ppc-drawer-present__card-title">
              {ppcT('OperatorApp.OtherDrawerDataGridHeaderDrawer', 'Cassetto')} {drawerLabel}
            </div>
            <div className="ppc-drawer-present__info-row">
              <span className="ppc-drawer-present__info-label">
                {ppcT('OperatorApp.OtherDrawerDataGridHeaderWeight', 'Peso')}
              </span>
              <span>{weightLabel} kg</span>
            </div>
            <div className="ppc-drawer-present__info-row">
              <span className="ppc-drawer-present__info-label">
                {ppcT('OperatorApp.OtherDrawerDataGridHeaderHeight', 'Altezza')}
              </span>
              <span>{heightLabel} mm</span>
            </div>
            <div className="ppc-drawer-present__info-row">
              <span className="ppc-drawer-present__info-label">
                {ppcT('OperatorApp.DrawerCompartments', 'Scompartimenti')}
              </span>
              <span>{dbCompartments.length}</span>
            </div>
          <div className="ppc-drawer-present__actions">
            <PpcActionButton
              label={ppcT('OperatorApp.DrawerRecall', 'Rientro cassetto')}
              className="ppc-drawer-present__button"
              tone="warning"
              onClick={handleRecallDrawer}
              disabled={recallLoading}
            />
          </div>
          </div>

          {actionMessage && (
            <div className="ppc-drawer-present__status">
              {actionMessage}
            </div>
          )}
          <PpcActionButton
            label={ppcT('General.Back', 'Indietro')}
            className="ppc-drawer-present__button"
            onClick={() => navigate('/ppc/operator/operator-menu')}
          />
        </section>

        <section className="ppc-drawer-present__right" style={{ flex: 1 }}>
          <div className="ppc-drawer-present__visual-header">
            <div>
              <div className="ppc-drawer-present__card-title">
                {ppcT('OperatorApp.DrawerCompartments', 'Scompartimenti')} 2D/3D
              </div>
              <div className="ppc-drawer-present__status-line">
                {ppcT('OperatorApp.OtherDrawerDataGridHeaderWidth', 'Larghezza')}: {loadingUnitForView.width} mm •
                {ppcT('OperatorApp.OtherDrawerDataGridHeaderDepth', 'Profondita')}: {loadingUnitForView.depth} mm
              </div>
            </div>
            <div className="ppc-drawer-present__view-toggle">
              <button
                type="button"
                className={viewMode === '2d' ? 'is-active' : ''}
                onClick={() => setViewMode('2d')}
              >
                {ppcT('OperatorApp.View2D', '2D')}
              </button>
              <button
                type="button"
                className={viewMode === '3d' ? 'is-active' : ''}
                onClick={() => setViewMode('3d')}
              >
                {ppcT('OperatorApp.View3D', '3D')}
              </button>
            </div>
          </div>

          <div className="ppc-drawer-present__visual-body" style={{ minHeight: 680, height: 'calc(100vh - 220px)', maxHeight: 'calc(100vh - 220px)' }}>
            {dbLoading && (
              <div className="ppc-drawer-present__compartments-loading">
                {ppcT('General.Loading', 'Caricamento...')}
              </div>
            )}

            {!dbLoading && dbError && (
              <div className="ppc-drawer-present__compartments-empty">
                {ppcT('General.Error', 'Errore caricamento scompartimenti')}
              </div>
            )}

            {!dbLoading && !dbError && dbCompartments.length === 0 && (
              <div className="ppc-drawer-present__compartments-empty">
                {ppcT('OperatorApp.NoCompartments', 'Nessuno scomparto disponibile')}
              </div>
            )}

            {!dbError && dbCompartments.length > 0 && viewMode === '2d' && (
              <div className="ppc-drawer-present__visualization" style={{ height: '100%' }}>
                <CompartmentView2D
                  loadingUnit={loadingUnitForView}
                  compartments={normalizedCompartments}
                  onCompartmentSelect={setSelectedCompartment}
                  onCompartmentUpdate={() => {}}
                />
              </div>
            )}

            {!dbError && dbCompartments.length > 0 && viewMode === '3d' && (
              <div className="ppc-drawer-present__visualization" style={{ height: '100%' }}>
                <CompartmentView3D
                  loadingUnit={loadingUnitForView}
                  compartments={normalizedCompartments}
                  onCompartmentSelect={setSelectedCompartment}
                  onCompartmentUpdate={() => {}}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PpcOperatorDrawerPresentPage;

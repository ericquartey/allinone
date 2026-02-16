import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useGetLoadingUnitsQuery,
  useGetLoadingUnitByIdQuery,
  useGetLoadingUnitCompartmentsQuery,
} from '../../../services/api/ppcAutomationApi';

const PpcOperatorDrawerPreviewPage: React.FC = () => {
  const location = useLocation();
  const drawerParam = useMemo(() => {
    return new URLSearchParams(location.search).get('drawer') || '';
  }, [location.search]);
  const normalizedDrawer = drawerParam.trim();
  const numericDrawer = Number(normalizedDrawer);
  const hasNumericDrawer = Number.isFinite(numericDrawer);

  const { data: loadingUnits, isLoading: loadingUnitsLoading, isError: loadingUnitsError } =
    useGetLoadingUnitsQuery(undefined, {
      refetchOnFocus: true,
      refetchOnReconnect: true,
    });
  const safeLoadingUnits = Array.isArray(loadingUnits) ? loadingUnits : [];

  const selectedFromList = useMemo(() => {
    if (!normalizedDrawer || safeLoadingUnits.length === 0) {
      return null;
    }
    const normalized = normalizedDrawer.toLowerCase();
    return safeLoadingUnits.find((unit) => {
      if (!unit) return false;
      if (unit.Code && unit.Code.toLowerCase() === normalized) return true;
      if (hasNumericDrawer && unit.Id === numericDrawer) return true;
      if (hasNumericDrawer && String(unit.Id ?? 0).padStart(normalizedDrawer.length, '0') === normalizedDrawer) {
        return true;
      }
      if (unit.Code) {
        const codeNumeric = Number(unit.Code);
        if (Number.isFinite(codeNumeric) && codeNumeric === numericDrawer) return true;
        if (Number.isFinite(codeNumeric) && String(codeNumeric).padStart(normalizedDrawer.length, '0') === normalizedDrawer) {
          return true;
        }
      }
      return false;
    }) || null;
  }, [safeLoadingUnits, normalizedDrawer, numericDrawer, hasNumericDrawer]);

  const { data: selectedById, isLoading: loadingUnitLoadingById } =
    useGetLoadingUnitByIdQuery(numericDrawer, {
      skip: !hasNumericDrawer || Boolean(selectedFromList),
      refetchOnFocus: true,
      refetchOnReconnect: true,
    });

  const selectedUnit = selectedFromList || selectedById || null;
  const selectedUnitId = selectedUnit?.Id ?? null;

  const {
    data: compartments,
    isLoading: compartmentsLoading,
    isError: compartmentsError,
  } = useGetLoadingUnitCompartmentsQuery(selectedUnitId ?? 0, {
    skip: !selectedUnitId,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const safeCompartments = Array.isArray(compartments) ? compartments : [];

  const drawerLabel = selectedUnit?.Code || (hasNumericDrawer ? String(numericDrawer).padStart(3, '0') : normalizedDrawer) || '--';

  const getField = (obj: any, keys: string[]) => {
    for (const key of keys) {
      const value = obj?.[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return null;
  };

  const isLoading = loadingUnitsLoading || loadingUnitLoadingById;

  return (
    <div className="ppc-ui ppc-drawer-preview">
      <div className="ppc-operator-call__preview-panel">
        <div className="ppc-operator-call__drawer-title">
          <span>Cassetto</span>
          <span className="ppc-operator-call__drawer-code">{drawerLabel}</span>
        </div>

        <div className="ppc-operator-call__preview-embed">
          {!normalizedDrawer && (
            <div className="ppc-operator-call__drawer-empty">
              Nessun cassetto selezionato.
            </div>
          )}

          {normalizedDrawer && isLoading && (
            <div className="ppc-operator-call__drawer-empty">
              Caricamento cassetto...
            </div>
          )}

          {normalizedDrawer && !isLoading && loadingUnitsError && (
            <div className="ppc-operator-call__drawer-empty">
              Errore nel caricamento dei cassetti.
            </div>
          )}

          {normalizedDrawer && !isLoading && !loadingUnitsError && !selectedUnit && (
            <div className="ppc-operator-call__drawer-empty">
              Cassetto non trovato.
            </div>
          )}

          {selectedUnit && (
            <div className="ppc-drawer-preview__content">
              <div className="ppc-drawer-preview__details">
                <div className="ppc-drawer-preview__detail">
                  <span>ID</span>
                  <strong>{selectedUnit.Id ?? '--'}</strong>
                </div>
                <div className="ppc-drawer-preview__detail">
                  <span>Codice</span>
                  <strong>{selectedUnit.Code ?? '--'}</strong>
                </div>
                <div className="ppc-drawer-preview__detail">
                  <span>Stato</span>
                  <strong>{selectedUnit.Status ?? '--'}</strong>
                </div>
                <div className="ppc-drawer-preview__detail">
                  <span>Descrizione</span>
                  <strong>{selectedUnit.Description ?? '--'}</strong>
                </div>
              </div>

              <div className="ppc-drawer-preview__compartments">
                <div className="ppc-drawer-preview__section-title">
                  Scomparti
                </div>
                {compartmentsLoading && (
                  <div className="ppc-operator-call__drawer-empty">
                    Caricamento scomparti...
                  </div>
                )}
                {!compartmentsLoading && compartmentsError && (
                  <div className="ppc-operator-call__drawer-empty">
                    Errore nel caricamento degli scomparti.
                  </div>
                )}
                {!compartmentsLoading && !compartmentsError && safeCompartments.length === 0 && (
                  <div className="ppc-operator-call__drawer-empty">
                    Nessuno scomparto disponibile.
                  </div>
                )}
                {!compartmentsLoading && !compartmentsError && safeCompartments.length > 0 && (
                  <div className="ppc-drawer-preview__table">
                    <div className="ppc-drawer-preview__table-row ppc-drawer-preview__table-head">
                      <span>ID</span>
                      <span>Codice</span>
                      <span>Posizione</span>
                      <span>Articolo</span>
                      <span>Qta</span>
                    </div>
                    {safeCompartments.map((compartment: any, index: number) => {
                      const id = getField(compartment, ['Id', 'id']) ?? index + 1;
                      const code = getField(compartment, ['Code', 'code', 'Barcode', 'barcode', 'Coordinate', 'coordinate']) ?? '--';
                      const row = getField(compartment, ['Row', 'row', 'Riga', 'riga']);
                      const column = getField(compartment, ['Column', 'column', 'Colonna', 'colonna']);
                      const posX = getField(compartment, ['X', 'x', 'PosX', 'posX']);
                      const posY = getField(compartment, ['Y', 'y', 'PosY', 'posY']);
                      const article = getField(compartment, ['ArticleCode', 'articleCode', 'CodiceArticolo', 'codiceArticolo']) ?? '--';
                      const quantity = getField(compartment, ['Quantity', 'quantity', 'Qta', 'qta', 'QtaProdotti', 'qtaProdotti', 'StockedQuantity', 'stockedQuantity']) ?? '--';
                      const positionLabel = row != null && column != null
                        ? `${row}-${column}`
                        : posX != null && posY != null
                          ? `${posX},${posY}`
                          : '--';

                      return (
                        <div key={String(id)} className="ppc-drawer-preview__table-row">
                          <span>{id}</span>
                          <span>{code}</span>
                          <span>{positionLabel}</span>
                          <span>{article}</span>
                          <span>{quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PpcOperatorDrawerPreviewPage;

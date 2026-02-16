// ============================================================================
// EJLOG WMS - Picking Execution Page
// Esecuzione prenotazioni di picking con navigazione e conferma barcode
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetReservationsByListQuery, useConfirmReservationMutation, useValidateBarcodeMutation } from '../../services/api/reservationsApi';
import { useBarcode } from '../../hooks/useBarcode';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Spinner from '../../components/shared/Spinner';
import Badge from '../../components/shared/Badge';
import type { Reservation } from '../../types/reservations';

const PickingExecutionPage: React.FC = () => {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();

  // API Hooks
  const { data: reservations = [], isLoading, refetch } = useGetReservationsByListQuery(Number(listId));
  const [confirmReservation, { isLoading: isConfirming }] = useConfirmReservationMutation();
  const [validateBarcode] = useValidateBarcodeMutation();

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [barcodeConfirmed, setBarcodeConfirmed] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentReservation = reservations[currentIndex];

  // Auto-focus quantity input when barcode is confirmed
  useEffect(() => {
    if (barcodeConfirmed && currentReservation) {
      setQuantity(currentReservation.quantityToMove.toString());
    }
  }, [barcodeConfirmed, currentReservation]);

  // Reset barcode confirmation when UDC changes
  useEffect(() => {
    if (currentIndex > 0 && currentReservation && reservations[currentIndex - 1]) {
      const prevUdcId = reservations[currentIndex - 1].udcId;
      const currUdcId = currentReservation.udcId;
      if (prevUdcId !== currUdcId) {
        setBarcodeConfirmed(false);
        setScannedBarcode('');
      }
    }
  }, [currentIndex, currentReservation, reservations]);

  // Barcode scanner handler
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!currentReservation || barcodeConfirmed) return;

    setError(null);
    setScannedBarcode(barcode);

    try {
      const result = await validateBarcode({
        id: currentReservation.id,
        barcode,
        type: 'UDC',
      }).unwrap();

      if (result.data?.valid) {
        setBarcodeConfirmed(true);
        setSuccess('Barcode UDC confermato correttamente');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.data?.message || 'Barcode non valido per questa UDC');
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Errore nella validazione del barcode');
    }
  }, [currentReservation, barcodeConfirmed, validateBarcode]);

  // Enable barcode scanning
  useBarcode({
    onScan: handleBarcodeScan,
    enabled: !barcodeConfirmed && !!currentReservation,
  });

  // Navigation handlers
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setQuantity('');
      setError(null);
    }
  };

  const handleNext = () => {
    if (currentIndex < reservations.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setQuantity('');
      setError(null);
    }
  };

  // Confirm reservation
  const handleConfirm = async () => {
    if (!currentReservation) return;

    const confirmedQty = parseFloat(quantity);
    if (isNaN(confirmedQty) || confirmedQty <= 0) {
      setError('Inserire una quantità valida');
      return;
    }

    if (confirmedQty > currentReservation.productQty) {
      setError(`Quantità non può superare la giacenza disponibile (${currentReservation.productQty})`);
      return;
    }

    setError(null);

    try {
      await confirmReservation({
        id: currentReservation.id,
        data: {
          confirmedQuantity: confirmedQty,
          barcode: scannedBarcode,
        },
      }).unwrap();

      setSuccess('Prenotazione confermata con successo');
      setTimeout(() => setSuccess(null), 2000);

      // Refetch to get updated reservations
      await refetch();

      // Move to next reservation or complete
      if (currentIndex < reservations.length - 1) {
        handleNext();
      } else {
        // All reservations completed
        navigate(`/lists/${listId}`);
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Errore durante la conferma');
    }
  };

  // Confirm and settle (conferma e salda)
  const handleConfirmAndSettle = async () => {
    if (!currentReservation) return;

    const confirmedQty = parseFloat(quantity);
    if (isNaN(confirmedQty) || confirmedQty <= 0) {
      setError('Inserire una quantità valida');
      return;
    }

    setError(null);

    try {
      await confirmReservation({
        id: currentReservation.id,
        data: {
          confirmedQuantity: confirmedQty,
          settleRow: true,
          barcode: scannedBarcode,
        },
      }).unwrap();

      setSuccess('Prenotazione confermata e riga saldata');
      setTimeout(() => setSuccess(null), 2000);

      await refetch();

      if (currentIndex < reservations.length - 1) {
        handleNext();
      } else {
        navigate(`/lists/${listId}`);
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Errore durante la conferma');
    }
  };

  // Skip to manual barcode input
  const handleSkipBarcode = () => {
    setBarcodeConfirmed(true);
    setSuccess('Barcode saltato - proseguire manualmente');
    setTimeout(() => setSuccess(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!reservations || reservations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Nessuna prenotazione da eseguire</p>
            <Button className="mt-4" onClick={() => navigate(`/lists/${listId}`)}>
              Torna alla lista
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentReservation) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Esecuzione Picking</h1>
        <Badge variant={barcodeConfirmed ? 'success' : 'warning'}>
          {barcodeConfirmed ? 'Barcode Confermato' : 'Scansiona Barcode'}
        </Badge>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Navigation */}
      <Card>
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            &larr; Precedente
          </Button>
          <span className="text-lg font-semibold">
            Prenotazione {currentIndex + 1} di {reservations.length}
          </span>
          <Button
            variant="ghost"
            onClick={handleNext}
            disabled={currentIndex === reservations.length - 1}
          >
            Successiva &rarr;
          </Button>
        </div>
      </Card>

      {/* Lista Info */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Informazioni Lista</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Codice Lista</label>
            <p className="font-semibold">{currentReservation.listCode}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Codice Prenotazione</label>
            <p className="font-semibold">{currentReservation.code}</p>
          </div>
        </div>
      </Card>

      {/* Location Info */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Locazione</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Codice</label>
            <p className="text-2xl font-bold text-blue-600">{currentReservation.locationCode}</p>
          </div>
          {currentReservation.locationWarehouse && (
            <div>
              <label className="text-sm text-gray-600">Magazzino</label>
              <p className="font-semibold">{currentReservation.locationWarehouse}</p>
            </div>
          )}
          <div>
            <label className="text-sm text-gray-600">Coordinate</label>
            <p className="font-semibold">
              X:{currentReservation.locationX} Y:{currentReservation.locationY} Z:{currentReservation.locationZ}
            </p>
          </div>
        </div>
      </Card>

      {/* Barcode Confirmation Panel */}
      {!barcodeConfirmed && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Conferma Barcode UDC</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">UDC Atteso</label>
              <p className="text-xl font-mono font-bold">{currentReservation.udcBarcode}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 p-4 rounded text-center">
                <p className="text-sm text-gray-600 mb-2">Scansiona barcode UDC con scanner</p>
                {scannedBarcode && (
                  <p className="font-mono text-lg">{scannedBarcode}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkipBarcode}>
              Salta verifica barcode
            </Button>
          </div>
        </Card>
      )}

      {/* Article Info */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Articolo</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Codice</label>
            <p className="font-semibold text-lg">{currentReservation.itemCode}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Descrizione</label>
            <p>{currentReservation.itemDescription || '-'}</p>
          </div>
          {currentReservation.lot && (
            <div>
              <label className="text-sm text-gray-600">Lotto</label>
              <p className="font-semibold">{currentReservation.lot}</p>
            </div>
          )}
          {currentReservation.expirationDate && (
            <div>
              <label className="text-sm text-gray-600">Scadenza</label>
              <p className="font-semibold">{new Date(currentReservation.expirationDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Quantity Confirmation */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Conferma Quantità</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Da Movimentare</label>
              <p className="text-2xl font-bold text-blue-600">{currentReservation.quantityToMove}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Giacenza UDC</label>
              <p className="text-2xl font-semibold">/{currentReservation.productQty}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">UM</label>
              <p className="text-lg font-semibold">{currentReservation.itemUm || '-'}</p>
            </div>
          </div>

          <div>
            <Input
              label="Quantità Confermata"
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!barcodeConfirmed}
              placeholder="Inserisci quantità"
              autoFocus={barcodeConfirmed}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="primary"
              onClick={handleConfirm}
              loading={isConfirming}
              disabled={!barcodeConfirmed || !quantity}
              className="flex-1"
            >
              Conferma
            </Button>
            <Button
              variant="secondary"
              onClick={handleConfirmAndSettle}
              loading={isConfirming}
              disabled={!barcodeConfirmed || !quantity}
            >
              Conferma e Salda
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(`/lists/${listId}`)}
            >
              Annulla
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PickingExecutionPage;

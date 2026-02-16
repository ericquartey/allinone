// ============================================================================
// EJLOG WMS - Inventory Execution Page
// Esecuzione inventario con verifica conteggi e gestione discrepanze
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

const InventoryExecutionPage: React.FC = () => {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();

  const { data: reservations = [], isLoading, refetch } = useGetReservationsByListQuery(Number(listId));
  const [confirmReservation, { isLoading: isConfirming }] = useConfirmReservationMutation();
  const [validateBarcode] = useValidateBarcodeMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [barcodeConfirmed, setBarcodeConfirmed] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [countedQuantity, setCountedQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDiscrepancy, setShowDiscrepancy] = useState(false);

  const currentReservation = reservations[currentIndex];

  // Calculate discrepancy
  const discrepancy = currentReservation && countedQuantity
    ? parseFloat(countedQuantity) - currentReservation.quantityToMove
    : 0;

  useEffect(() => {
    if (currentReservation && countedQuantity) {
      const diff = Math.abs(parseFloat(countedQuantity) - currentReservation.quantityToMove);
      setShowDiscrepancy(diff > 0.01); // Show if difference > 0.01
    }
  }, [countedQuantity, currentReservation]);

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
        setSuccess('Barcode UDC confermato');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.data?.message || 'Barcode non valido');
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Errore validazione barcode');
    }
  }, [currentReservation, barcodeConfirmed, validateBarcode]);

  useBarcode({
    onScan: handleBarcodeScan,
    enabled: !barcodeConfirmed && !!currentReservation,
  });

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCountedQuantity('');
      setNotes('');
      setError(null);
    }
  };

  const handleNext = () => {
    if (currentIndex < reservations.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCountedQuantity('');
      setNotes('');
      setError(null);
    }
  };

  const handleConfirm = async () => {
    if (!currentReservation) return;

    const counted = parseFloat(countedQuantity);
    if (isNaN(counted) || counted < 0) {
      setError('Inserire una quantità valida (>= 0)');
      return;
    }

    // Check for significant discrepancy
    if (showDiscrepancy && !notes.trim()) {
      setError('Inserire una nota per giustificare la discrepanza');
      return;
    }

    setError(null);

    try {
      await confirmReservation({
        id: currentReservation.id,
        data: {
          confirmedQuantity: counted,
          barcode: scannedBarcode,
        },
      }).unwrap();

      setSuccess('Conteggio confermato');
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

  const handleSkipBarcode = () => {
    setBarcodeConfirmed(true);
    setSuccess('Barcode saltato');
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
            <p className="text-lg text-gray-600">Nessun conteggio da eseguire</p>
            <Button className="mt-4" onClick={() => navigate(`/lists/${listId}`)}>
              Torna alla lista
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentReservation) return null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Esecuzione Inventario</h1>
        <Badge variant={barcodeConfirmed ? 'success' : 'warning'}>
          {barcodeConfirmed ? 'Barcode OK' : 'Scansiona Barcode'}
        </Badge>
      </div>

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

      <Card>
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={handlePrevious} disabled={currentIndex === 0}>
            &larr; Precedente
          </Button>
          <span className="text-lg font-semibold">
            Conteggio {currentIndex + 1} di {reservations.length}
          </span>
          <Button variant="ghost" onClick={handleNext} disabled={currentIndex === reservations.length - 1}>
            Successivo &rarr;
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Informazioni Inventario</h3>
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

      <Card>
        <h3 className="text-lg font-semibold mb-4">Locazione da Inventariare</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Codice</label>
            <p className="text-2xl font-bold text-purple-600">{currentReservation.locationCode}</p>
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

      {!barcodeConfirmed && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Conferma Barcode UDC</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">UDC Atteso</label>
              <p className="text-xl font-mono font-bold">{currentReservation.udcBarcode}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded text-center">
              <p className="text-sm text-gray-600 mb-2">Scansiona barcode UDC</p>
              {scannedBarcode && <p className="font-mono text-lg">{scannedBarcode}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkipBarcode}>
              Salta verifica barcode
            </Button>
          </div>
        </Card>
      )}

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

      <Card>
        <h3 className="text-lg font-semibold mb-4">Conteggio</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Giacenza Teorica</label>
              <p className="text-2xl font-bold text-gray-700">{currentReservation.quantityToMove}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Giacenza UDC</label>
              <p className="text-2xl font-semibold">{currentReservation.productQty}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">UM</label>
              <p className="text-lg font-semibold">{currentReservation.itemUm || '-'}</p>
            </div>
          </div>

          <div>
            <Input
              label="Quantità Contata"
              type="number"
              step="0.01"
              value={countedQuantity}
              onChange={(e) => setCountedQuantity(e.target.value)}
              disabled={!barcodeConfirmed}
              placeholder="Inserisci quantità contata"
              autoFocus={barcodeConfirmed}
            />
          </div>

          {showDiscrepancy && (
            <div className={`p-4 rounded ${discrepancy > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Discrepanza Rilevata:</span>
                <span className={`text-2xl font-bold ${discrepancy > 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {discrepancy > 0 ? '+' : ''}{discrepancy.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {discrepancy > 0 ? 'Eccedenza: quantità contata superiore alla teorica' : 'Mancanza: quantità contata inferiore alla teorica'}
              </p>
              <Input
                label="Note Discrepanza (obbligatorie)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Motivazione della discrepanza..."
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="primary"
              onClick={handleConfirm}
              loading={isConfirming}
              disabled={!barcodeConfirmed || !countedQuantity}
              className="flex-1"
            >
              Conferma Conteggio
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/lists/${listId}`)}>
              Annulla
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InventoryExecutionPage;

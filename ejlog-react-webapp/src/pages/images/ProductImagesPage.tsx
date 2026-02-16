// ============================================================================
// EJLOG WMS - Product Images Mapping Page
// Seleziona una cartella locale e associa file immagine al codice articolo
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface CatalogItem {
  code: string;
  description?: string;
  imageUrl?: string;
  imageFileName?: string;
}

const ProductImagesPage: React.FC = () => {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [basePath, setBasePath] = useState('');
  const [savingPath, setSavingPath] = useState(false);
  const [pathMessage, setPathMessage] = useState<string | null>(null);

  const loadItemCatalog = async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const response = await fetch('/api/items?limit=10000&offset=0');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      const items = (data?.data || []).map((item: { code?: string; description?: string; imageUrl?: string; imageFileName?: string }) => ({
        code: item.code || '',
        description: item.description || '',
        imageUrl: item.imageUrl || undefined,
        imageFileName: item.imageFileName || undefined,
      }));
      setCatalogItems(items);
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : 'Errore caricamento articoli');
      console.error('Error loading item catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadImageSettings = async () => {
    try {
      const response = await fetch('/api/item-images/settings');
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setBasePath(data?.data?.basePath || '');
    } catch (err) {
      console.error('Error loading image settings:', err);
    }
  };

  const saveImageSettings = async () => {
    if (!basePath.trim()) {
      setPathMessage('Inserisci un percorso valido');
      return;
    }
    setSavingPath(true);
    setPathMessage(null);
    try {
      const response = await fetch('/api/item-images/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePath: basePath.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Errore salvataggio percorso');
      }
      setBasePath(data.data.basePath);
      setPathMessage('Percorso salvato');
      await loadItemCatalog();
    } catch (err) {
      setPathMessage(err instanceof Error ? err.message : 'Errore salvataggio percorso');
    } finally {
      setSavingPath(false);
    }
  };

  useEffect(() => {
    loadItemCatalog();
    loadImageSettings();
  }, []);

  const mappedProducts = useMemo(() => catalogItems, [catalogItems]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Associa Immagini Articoli</h1>
          <p className="text-gray-600 mt-1">
            Seleziona una cartella locale e associa le immagini ai codici articolo
          </p>
        </div>
        <Button variant="secondary" onClick={loadItemCatalog} disabled={catalogLoading}>
          <RefreshCw className={`w-5 h-5 mr-2 ${catalogLoading ? 'animate-spin' : ''}`} />
          Ricarica Articoli
        </Button>
      </div>

      <Card>
        <div className="p-4 space-y-3">
          <div className="text-lg font-semibold">Percorso immagini locale</div>
          <div className="text-sm text-gray-600">
            Inserisci il percorso cartella accessibile dal server (es. C:\\Immagini\\Articoli).
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={basePath}
              onChange={(e) => setBasePath(e.target.value)}
              placeholder="C:\\Immagini\\Articoli"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button variant="primary" onClick={saveImageSettings} disabled={savingPath}>
              {savingPath ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salva Percorso
                </>
              )}
            </Button>
          </div>
          {pathMessage && <div className="text-sm text-gray-600">{pathMessage}</div>}
        </div>
      </Card>

      <Card>
        <div className="p-4 space-y-2">
          <div className="text-sm text-gray-600">
            Articoli caricati: {catalogItems.length}
          </div>
          {catalogError && <div className="text-sm text-red-600">{catalogError}</div>}
        </div>
      </Card>

      {catalogLoading && catalogItems.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Prodotti e immagini associate</h2>
          <div className="max-h-[500px] overflow-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Codice</th>
                  <th className="px-3 py-2 text-left">Descrizione</th>
                  <th className="px-3 py-2 text-left">Immagine</th>
                  <th className="px-3 py-2 text-left">Stato</th>
                </tr>
              </thead>
              <tbody>
                {mappedProducts.map((product) => (
                  <tr key={product.code} className="border-t">
                    <td className="px-3 py-2 font-mono">{product.code}</td>
                    <td className="px-3 py-2">{product.description || '-'}</td>
                    <td className="px-3 py-2">
                      {product.imageFileName ? (
                        <span className="font-mono text-xs">{product.imageFileName}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {product.imageUrl ? (
                        <Badge variant="success">Trovata</Badge>
                      ) : (
                        <Badge variant="secondary">Mancante</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {mappedProducts.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                      Nessun articolo disponibile
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default ProductImagesPage;

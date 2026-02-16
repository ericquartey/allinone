// ============================================================================
// EJLOG WMS - Stock By Item Page
// Giacenze per articolo
// ============================================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetItemByIdQuery } from '../../services/api/itemsApi';
import { useGetStockByItemQuery } from '../../services/api/stockApi';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

const StockByItemPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();

  const { data: item, isLoading: itemLoading } = useGetItemByIdQuery(Number(itemId));
  const { data: stock, isLoading: stockLoading } = useGetStockByItemQuery(Number(itemId));

  if (itemLoading || stockLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (!item) return <Card><p>Articolo non trovato</p></Card>;

  const totalStock = stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{item.code}</h1>
          <p className="text-gray-600">{item.description}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/stock')}>
          Indietro
        </Button>
      </div>

      <Card title="Giacenza Totale">
        <div className="text-center py-8">
          <p className="text-5xl font-bold text-ferrRed">{totalStock}</p>
          <p className="text-gray-600 mt-2">Pezzi totali</p>
        </div>
      </Card>

      {stock && stock.length > 0 && (
        <Card title="Dettaglio per Ubicazione">
          <div className="space-y-2">
            {stock.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{s.locationName}</p>
                  {s.lot && <p className="text-sm text-gray-600">Lotto: {s.lot}</p>}
                </div>
                <Badge variant="info" size="lg">{s.quantity} pz</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StockByItemPage;

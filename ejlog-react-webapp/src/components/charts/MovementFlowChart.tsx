// ============================================================================
// EJLOG WMS - Movement Flow Chart Component
// Grafico flusso movimenti (IN/OUT/TRANSFER) nel tempo
// ============================================================================

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '../shared/Card';
import { format } from 'date-fns';

// Types
export interface MovementChartData {
  timestamp: string;
  type: 'IN' | 'OUT' | 'TRANSFER';
  quantity: number;
}

interface MovementFlowChartProps {
  data: MovementChartData[];
  height?: number;
}

// Color scheme
const FERRARI_RED = '#CD202C';
const GREEN = '#059669';
const BLUE = '#1E40AF';
const GRID_COLOR = '#E5E7EB';

const MovementFlowChart: React.FC<MovementFlowChartProps> = React.memo(({
  data,
  height = 400,
}) => {
  // Group data by date and type - memoized for performance
  const groupedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const grouped = data.reduce((acc, item) => {
    // Format timestamp to date string
    const date = new Date(item.timestamp);
    const dateStr = format(date, 'dd/MM');

    const existing = acc.find((d) => d.date === dateStr);

    if (existing) {
      if (item.type === 'IN') {
        existing.inbound += item.quantity;
      } else if (item.type === 'OUT') {
        existing.outbound += item.quantity;
      } else if (item.type === 'TRANSFER') {
        existing.transfer += item.quantity;
      }
    } else {
      acc.push({
        date: dateStr,
        inbound: item.type === 'IN' ? item.quantity : 0,
        outbound: item.type === 'OUT' ? item.quantity : 0,
        transfer: item.type === 'TRANSFER' ? item.quantity : 0,
      });
    }

    return acc;
  }, [] as Array<{ date: string; inbound: number; outbound: number; transfer: number }>);

    // Sort by date
    grouped.sort((a, b) => {
      const [dayA, monthA] = a.date.split('/').map(Number);
      const [dayB, monthB] = b.date.split('/').map(Number);
      return monthA !== monthB ? monthA - monthB : dayA - dayB;
    });

    return grouped;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>Nessun dato disponibile per la visualizzazione del grafico</p>
        </div>
      </Card>
    );
  }

  // Calculate totals for summary - memoized
  const { totals, textSummary } = useMemo(() => {
    const calculatedTotals = groupedData.reduce(
    (acc, item) => ({
      inbound: acc.inbound + item.inbound,
      outbound: acc.outbound + item.outbound,
      transfer: acc.transfer + item.transfer,
    }),
      { inbound: 0, outbound: 0, transfer: 0 }
    );

    const summary = `Periodo dal ${groupedData[0]?.date} al ${groupedData[groupedData.length - 1]?.date}.
      Totale ingressi: ${calculatedTotals.inbound}, uscite: ${calculatedTotals.outbound}, trasferimenti: ${calculatedTotals.transfer}`;

    return { totals: calculatedTotals, textSummary: summary };
  }, [groupedData]);

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Flusso Movimenti
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Movimenti in entrata, uscita e trasferimento nel periodo
        </p>
      </div>

      {/* WCAG 2.1 AA: Provide text alternative for chart */}
      <figure aria-label="Grafico flusso movimenti">
        <figcaption className="sr-only">
          Grafico ad area che mostra il flusso dei movimenti nel tempo.
          {textSummary}
        </figcaption>

        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={groupedData}>
              <defs>
                <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GREEN} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={GREEN} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={FERRARI_RED} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={FERRARI_RED} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorTransfer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BLUE} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: `1px solid ${GRID_COLOR}`,
                  borderRadius: '8px',
                  padding: '12px',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area
                type="monotone"
                dataKey="inbound"
                stroke={GREEN}
                fillOpacity={1}
                fill="url(#colorInbound)"
                name="Ingressi"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="outbound"
                stroke={FERRARI_RED}
                fillOpacity={1}
                fill="url(#colorOutbound)"
                name="Uscite"
                stackId="2"
              />
              <Area
                type="monotone"
                dataKey="transfer"
                stroke={BLUE}
                fillOpacity={1}
                fill="url(#colorTransfer)"
                name="Trasferimenti"
                stackId="3"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Accessible table alternative */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
            Visualizza dati come tabella
          </summary>
          <table className="min-w-full mt-2 border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold">Data</th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold">Ingressi</th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold">Uscite</th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold">Trasferimenti</th>
              </tr>
            </thead>
            <tbody>
              {groupedData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b text-sm">{item.date}</td>
                  <td className="px-4 py-2 border-b text-sm">{item.inbound}</td>
                  <td className="px-4 py-2 border-b text-sm">{item.outbound}</td>
                  <td className="px-4 py-2 border-b text-sm">{item.transfer}</td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-100">
                <td className="px-4 py-2 border-t text-sm">Totale</td>
                <td className="px-4 py-2 border-t text-sm">{totals.inbound}</td>
                <td className="px-4 py-2 border-t text-sm">{totals.outbound}</td>
                <td className="px-4 py-2 border-t text-sm">{totals.transfer}</td>
              </tr>
            </tbody>
          </table>
        </details>
      </figure>
    </Card>
  );
});

// Display name for React DevTools
MovementFlowChart.displayName = 'MovementFlowChart';

export default MovementFlowChart;

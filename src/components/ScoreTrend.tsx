'use client';

import { CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// Single series → no legend; the card title names it. Series colour = reference palette slot 1.
const SERIES = '#111110'; // ink — single series, so no legend is needed

export function ScoreTrend({ points }: { points: { date: string; score: number; failing: number; total: number }[] }) {
  const labels = points.map((p) => new Date(p.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'UTC' }));
  return (
    <div className="h-56">
      <Line
        aria-label="Overall data quality score by day"
        data={{
          labels,
          datasets: [
            {
              data: points.map((p) => p.score),
              borderColor: SERIES,
              backgroundColor: 'rgba(17,17,16,0.05)',
              borderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: SERIES,
              pointBorderColor: '#f7f6f2',
              pointBorderWidth: 2,
              fill: true,
              tension: 0.25,
            },
          ],
        }}
        options={{
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111110',
              padding: 10,
              displayColors: false,
              callbacks: {
                label: (ctx) => {
                  const p = points[ctx.dataIndex];
                  return [`Score ${p.score}%`, `${p.failing} of ${p.total} records with open issues`];
                },
              },
            },
          },
          scales: {
            y: { min: Math.max(0, Math.floor(Math.min(...points.map((p) => p.score), 100) / 10) * 10 - 10), max: 100, ticks: { callback: (v) => `${v}%`, color: '#7f7e77', font: { family: 'ui-monospace, Consolas, monospace', size: 11 } }, grid: { color: '#e4e2db' }, border: { display: false } },
            x: { ticks: { color: '#7f7e77', font: { family: 'ui-monospace, Consolas, monospace', size: 11 } }, grid: { display: false } },
          },
        }}
      />
    </div>
  );
}

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useId } from 'react';
import { change, rupiah, smoothPath } from './chart';

function Sparkline({ values, good }) {
  const gradId = useId();
  const w = 76;
  const h = 30;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * (w - 4) + 2, h - 3 - ((v - min) / (max - min || 1)) * (h - 6)]);
  const d = smoothPath(pts);
  const last = pts[pts.length - 1];

  return (
    <svg className="adm-kpi__spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--ink)" stopOpacity="0.1" />
          <stop offset="1" stopColor="var(--ink)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${last[0]} ${h} L ${pts[0][0]} ${h} Z`} fill={`url(#${gradId})`} />
      <path pathLength={1} d={d} fill="none" stroke="var(--soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.75" fill={good ? 'var(--good)' : 'var(--critical)'} stroke="var(--surface)" strokeWidth="1.5" />
    </svg>
  );
}

/** One headline number, its change vs the previous period, and a sparkline. */
export default function KpiCard({ kpi }) {
  const pct = change(kpi.value, kpi.previous);
  const up = pct === null || pct >= 0;
  const good = kpi.lowerIsBetter ? !up : up;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  const value = kpi.format === 'currency' ? rupiah(kpi.value) : kpi.value.toLocaleString('id-ID');

  return (
    <article className="adm-kpi">
      <h3>{kpi.label}</h3>
      <div className="adm-kpi__row">
        <div className="adm-kpi__main">
          <p className="adm-kpi__value">{value}</p>
          <p className="adm-kpi__delta">
            <span className={'adm-chip ' + (good ? 'adm-chip--good' : 'adm-chip--bad')}>
              <Arrow size={12} strokeWidth={2.25} aria-hidden="true" />
              {pct === null ? 'New' : (up ? '+' : '−') + Math.abs(pct).toFixed(1) + '%'}
            </span>
            <span className="adm-kpi__vs">vs prior period</span>
          </p>
        </div>
        {kpi.spark.length > 1 && <Sparkline values={kpi.spark} good={good} />}
      </div>
    </article>
  );
}

import { ChartArea, Table2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { change, niceMax, rupiah, rupiahShort, smoothPath } from './chart';

const H = 236;
const PAD = { top: 16, right: 12, bottom: 28, left: 64 };

/** Width of an element, kept up to date. */
function useWidth(ref) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/**
 * Revenue: this period (area) vs the previous period (dashed), with a crosshair
 * tooltip (mouse or arrow keys) and a table view of the same numbers.
 */
export default function RevenueChart({ points, rangeLabel }) {
  const [view, setView] = useState('chart');
  const [hover, setHover] = useState(null);
  const plotRef = useRef(null);
  const width = useWidth(plotRef);
  const gradId = useId();
  const titleId = useId();

  const total = points.reduce((s, p) => s + p.current, 0);
  const totalPrev = points.reduce((s, p) => s + p.previous, 0);
  const pct = change(total, totalPrev);
  const max = niceMax(Math.max(...points.map((p) => Math.max(p.current, p.previous))) * 1.08);
  const w = Math.max(width, 240);
  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => PAD.top + innerH - (v / max) * innerH;

  const curD = smoothPath(points.map((p, i) => [x(i), y(p.current)]));
  const prevD = smoothPath(points.map((p, i) => [x(i), y(p.previous)]));
  const areaD = `${curD} L ${x(points.length - 1)} ${PAD.top + innerH} L ${x(0)} ${PAD.top + innerH} Z`;
  const ticks = [0, 0.5, 1].map((t) => t * max);
  const labelEvery = Math.ceil(points.length / Math.max(2, Math.floor(innerW / 70)));
  const empty = total === 0 && totalPrev === 0;

  const pick = (clientX) => {
    const rect = plotRef.current.getBoundingClientRect();
    const i = Math.round(((clientX - rect.left - PAD.left) / innerW) * (points.length - 1));
    return Math.max(0, Math.min(points.length - 1, i));
  };

  const onKeyDown = (event) => {
    const last = points.length - 1;
    const at = hover ?? last;
    const moves = { ArrowRight: Math.min(last, at + 1), ArrowLeft: Math.max(0, at - 1), Home: 0, End: last };
    if (event.key === 'Escape') return setHover(null);
    if (!(event.key in moves)) return;
    event.preventDefault();
    setHover(hover === null ? last : moves[event.key]);
  };

  const active = hover !== null ? points[hover] : null;
  const tipLeft = hover !== null ? x(hover) : 0;
  const flip = tipLeft > w - 200;

  return (
    <section className="adm-card adm-revenue" aria-labelledby={titleId}>
      <div className="adm-revenue__head">
        <div>
          <h2 id={titleId}>Revenue</h2>
          <p className="adm-revenue__total">
            <strong>{rupiah(total)}</strong>
            <span>{pct === null ? 'new this period' : (pct >= 0 ? '+' : '−') + Math.abs(pct).toFixed(1) + '% vs prior period'}</span>
          </p>
        </div>
        <div className="adm-revenue__tools">
          <ul className="adm-legend" aria-label="Legend">
            <li>
              <span className="adm-legend__line" aria-hidden="true" /> This period
            </li>
            <li>
              <span className="adm-legend__dash" aria-hidden="true" /> Prior period
            </li>
          </ul>
          <div className="adm-seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'chart'} aria-label="Chart view" onClick={() => setView('chart')}>
              <ChartArea size={14} />
            </button>
            <button type="button" aria-pressed={view === 'table'} aria-label="Table view" onClick={() => setView('table')}>
              <Table2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {view === 'chart' ? (
        <div
          ref={plotRef}
          className="adm-revenue__plot"
          style={{ height: H }}
          role="img"
          tabIndex={0}
          aria-label={`${rangeLabel}: ${rupiah(total)} revenue against ${rupiah(totalPrev)} in the prior period. Use the arrow keys to read each point.`}
          onKeyDown={onKeyDown}
          onPointerMove={(e) => setHover(pick(e.clientX))}
          onPointerLeave={() => setHover(null)}
          onBlur={() => setHover(null)}
        >
          {width > 0 && (
            <svg width={w} height={H} aria-hidden="true">
              <defs>
                <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
                  <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {ticks.map((t) => (
                <g key={t} className="adm-revenue__grid">
                  <line x1={PAD.left} x2={w - PAD.right} y1={y(t)} y2={y(t)} strokeDasharray={t === 0 ? undefined : '2 4'} />
                  <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end">
                    {empty ? '' : rupiahShort(t)}
                  </text>
                </g>
              ))}
              {points.map((p, i) => {
                const last = points.length - 1;
                const show = i === last || (i % labelEvery === 0 && last - i >= labelEvery * 0.7);
                return show ? (
                  <text key={p.label} className="adm-revenue__tick" x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}>
                    {p.tick}
                  </text>
                ) : null;
              })}
              {!empty && (
                <>
                  <path d={prevD} fill="none" stroke="var(--ghost)" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
                  <path className="adm-revenue__area" d={areaD} fill={`url(#${gradId})`} />
                  <path className="adm-revenue__line" pathLength={1} d={curD} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
              {empty && (
                <text className="adm-revenue__tick" x={PAD.left + innerW / 2} y={PAD.top + innerH / 2} textAnchor="middle">
                  No paid orders in this period yet
                </text>
              )}
              {active && !empty && (
                <g>
                  <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--border-strong)" />
                  <circle cx={x(hover)} cy={y(active.previous)} r="3.5" fill="var(--surface)" stroke="var(--ghost)" strokeWidth="1.5" />
                  <circle cx={x(hover)} cy={y(active.current)} r="4.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
                </g>
              )}
            </svg>
          )}
          {active && !empty && (
            <div className="adm-tip" aria-hidden="true" style={{ left: flip ? tipLeft - 188 : tipLeft + 12 }}>
              <p>{active.label}</p>
              <dl>
                <div>
                  <dt>
                    <span className="adm-legend__line" /> This period
                  </dt>
                  <dd>{rupiah(active.current)}</dd>
                </div>
                <div>
                  <dt>
                    <span className="adm-legend__dash" /> Prior
                  </dt>
                  <dd>{rupiah(active.previous)}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      ) : (
        <div className="adm-revenue__table">
          <table className="adm-table">
            <caption className="visually-hidden">Revenue, {rangeLabel.toLowerCase()}</caption>
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col" className="adm-right">
                  This period
                </th>
                <th scope="col" className="adm-right">
                  Prior
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.label}>
                  <th scope="row">{p.label}</th>
                  <td className="adm-right adm-mono">{rupiah(p.current)}</td>
                  <td className="adm-right adm-mono adm-muted">{rupiah(p.previous)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

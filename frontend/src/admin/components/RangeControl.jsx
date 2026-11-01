import { useRef } from 'react';

export const RANGES = [
  { id: '7d', label: '7D', long: 'Last 7 days' },
  { id: '30d', label: '30D', long: 'Last 30 days' },
  { id: '90d', label: '90D', long: 'Last 90 days' },
  { id: '12m', label: '12M', long: 'Last 12 months' },
];

/** Segmented date-range picker (a radio group; arrow keys move between options). */
export default function RangeControl({ value, onChange }) {
  const refs = useRef([]);
  const index = RANGES.findIndex((r) => r.id === value);

  const onKeyDown = (event) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next;
    if (event.key in keys) next = (index + keys[event.key] + RANGES.length) % RANGES.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = RANGES.length - 1;
    else return;
    event.preventDefault();
    onChange(RANGES[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className="adm-range" role="radiogroup" aria-label="Date range" onKeyDown={onKeyDown}>
      <span className="adm-range__thumb" aria-hidden="true" style={{ transform: `translateX(${index * 100}%)` }} />
      {RANGES.map((r, i) => (
        <button
          key={r.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={r.id === value}
          aria-label={r.long}
          tabIndex={r.id === value ? 0 : -1}
          className={r.id === value ? 'is-active' : undefined}
          onClick={() => onChange(r.id)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

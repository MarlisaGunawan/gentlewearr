// Order / payment status pill: a small glyph + the label, so colour is never the only signal.
const STATUS = {
  waiting_payment: { label: 'Waiting payment', tone: 'warning' },
  pending: { label: 'Pending', tone: 'warning' },
  paid: { label: 'Paid', tone: 'good' },
  packed: { label: 'Packed', tone: 'info' },
  shipped: { label: 'Shipped', tone: 'info' },
  completed: { label: 'Completed', tone: 'good' },
  failed: { label: 'Failed', tone: 'critical' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
  expired: { label: 'Expired', tone: 'muted' },
};

function Glyph({ tone }) {
  const common = { width: 10, height: 10, viewBox: '0 0 10 10', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', 'aria-hidden': true };
  if (tone === 'good') return <svg {...common}><path d="M2 5.2 4.1 7.2 8 2.8" strokeLinejoin="round" /></svg>;
  if (tone === 'warning') return <svg {...common}><circle cx="5" cy="5" r="3.6" /><path d="M5 3.2V5l1.2.8" /></svg>;
  if (tone === 'critical') return <svg {...common}><path d="M2.8 2.8l4.4 4.4M7.2 2.8 2.8 7.2" /></svg>;
  if (tone === 'info') return <svg {...common}><path d="M1.5 5h6M5.5 2.5 8 5 5.5 7.5" strokeLinejoin="round" /></svg>;
  return <svg {...common}><path d="M2.5 5h5" /></svg>;
}

export const STATUS_LABELS = Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.label]));

export default function StatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status, tone: 'muted' };
  return (
    <span className={'badge badge--' + s.tone}>
      <Glyph tone={s.tone} />
      {s.label}
    </span>
  );
}

// Small inline icons (no icon library needed). Usage: <Icon name="search" />
const paths = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  bag: 'M6 8h12l-1 12H7L6 8zm3 0a3 3 0 0 1 6 0',
  tag: 'M3 12V4h8l9 9-8 8-9-9zm5-4.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  dots: 'M6 6h.01M12 6h.01M18 6h.01M6 12h.01M12 12h.01M18 12h.01M6 18h.01M12 18h.01M18 18h.01',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4-4',
  chevron: 'm6 9 6 6 6-6',
  copy: 'M9 9h10v10H9zM5 15V5h10',
};

export default function Icon({ name, size = 14 }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'dots' ? 3 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

// Initials in a soft circle; the colour is picked from the name so it stays stable.
const TONES = ['#e7d3c4', '#d9e2cf', '#d6dde8', '#ead7df', '#e8e0c8', '#d5e5e2'];

export default function Avatar({ name = '?', size = 28 }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const tone = TONES[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TONES.length];

  return (
    <span
      className="adm-avatar"
      style={{ width: size, height: size, background: tone, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

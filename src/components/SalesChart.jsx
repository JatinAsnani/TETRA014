const data = [
  { m: 'Mar 2026', s: 0, e: 0 },
  { m: 'Apr 2026', s: 0, e: 0 },
  { m: 'May 2026', s: 122000, e: 56000 },
  { m: 'Jun 2026', s: 90000, e: 20000 },
  { m: 'Jul 2026', s: 90000, e: 83000 },
  { m: 'Aug 2026', s: 22420, e: 0 },
];

const W = 560, H = 210, padL = 36, padB = 22, padT = 10;
const MAX = 140000;
const plotW = W - padL - 10, plotH = H - padT - padB;
const gridlines = [0, 35000, 70000, 105000, 140000];
const bw = plotW / data.length;

export default function SalesChart() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="210">
      {gridlines.map((v) => {
        const y = padT + plotH - (v / MAX) * plotH;
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={W - 10} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={padL - 8} y={y + 3} fontSize="9" fill="var(--text-faint)" textAnchor="end" fontFamily="IBM Plex Mono, monospace">
              {v}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = padL + i * bw + bw * 0.18;
        const sh = (d.s / MAX) * plotH, eh = (d.e / MAX) * plotH;
        const bwid = bw * 0.28;
        return (
          <g key={d.m}>
            {/* Sales Bar - Primary Amber Shade */}
            <rect x={x} y={padT + plotH - sh} width={bwid} height={sh} fill="var(--amber)" rx="3" />
            {/* Expenses Bar - Soft Amber Opacity Shade (Monochromatic single color) */}
            <rect x={x + bwid + 4} y={padT + plotH - eh} width={bwid} height={eh} fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" rx="3" />
            <text x={x + bwid} y={H - 4} fontSize="9.5" fill="var(--text-faint)" textAnchor="middle">{d.m}</text>
          </g>
        );
      })}
    </svg>
  );
}

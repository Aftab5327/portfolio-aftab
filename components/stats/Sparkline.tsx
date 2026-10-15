/** Tiny trend line (oldest → newest). The values are also in the aria-label. */
export default function Sparkline({ values, label, width = 160, height = 36 }: { values: number[]; label: string; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((value, i) => [i * step, height - 3 - ((value - min) / span) * (height - 6)] as const);
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label}, oldest to newest: ${values.join(", ")}`}>
      <polyline
        points={points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
        fill="none"
        stroke="var(--teal)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r="3" fill="var(--teal)" />
    </svg>
  );
}

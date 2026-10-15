const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Lighthouse's own bands: 90–100 good, 50–89 needs improvement, 0–49 poor. */
export const scoreBand = (score: number) => (score >= 90 ? "good" : score >= 50 ? "average" : "poor");
const COLORS = { good: "var(--green)", average: "var(--warning)", poor: "var(--danger)" };

export default function ScoreRing({ score, label }: { score: number; label: string }) {
  const band = scoreBand(score);
  return (
    <figure className="flex flex-col items-center gap-2">
      <svg width="68" height="68" viewBox="0 0 68 68" role="img" aria-label={`${label}: ${score} out of 100 (${band})`}>
        <circle cx="34" cy="34" r={RADIUS} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle
          cx="34"
          cy="34"
          r={RADIUS}
          fill="none"
          stroke={COLORS[band]}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          transform="rotate(-90 34 34)"
        />
        <text x="34" y="39" textAnchor="middle" fontSize="16" fontWeight="700" className="fill-txt font-mono">
          {score}
        </text>
      </svg>
      <figcaption className="text-center font-mono text-[11px] text-txtdim">{label}</figcaption>
    </figure>
  );
}

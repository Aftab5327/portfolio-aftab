import type { GitHubStats } from "@/lib/schema";

const CELL = 11;
const GAP = 3;
const LEFT = 26;
const TOP = 16;
const DAY_LABELS: [number, string][] = [
  [1, "Mon"],
  [3, "Wed"],
  [5, "Fri"]
];
const monthName = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** 0 = none, 1–4 = quartiles of the non-zero days. */
function levels(counts: number[]) {
  const nonZero = counts.filter((count) => count > 0).sort((a, b) => a - b);
  const q = (p: number) => nonZero[Math.min(nonZero.length - 1, Math.floor(p * nonZero.length))] ?? 0;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  return (count: number) => (count <= 0 ? 0 : count <= q1 ? 1 : count <= q2 ? 2 : count <= q3 ? 3 : 4);
}

const OPACITY = [1, 0.3, 0.5, 0.75, 1];

/** GitHub-style contribution calendar as an accessible SVG (built without a chart library). */
export default function ContributionHeatmap({ calendar }: { calendar: GitHubStats["calendar"] }) {
  const days = calendar.weeks.flat();
  const level = levels(days.map((day) => day.count));
  const width = LEFT + calendar.weeks.length * (CELL + GAP);
  const height = TOP + 7 * (CELL + GAP);

  const busiest = days.reduce((best, day) => (day.count > best.count ? day : best), { date: "", count: 0 });
  const activeDays = days.filter((day) => day.count > 0).length;

  // Month label above the first week that starts in a new month.
  const months: { x: number; label: string }[] = [];
  calendar.weeks.forEach((week, index) => {
    const first = week[0];
    if (!first) return;
    const month = first.date.slice(0, 7);
    const previous = calendar.weeks[index - 1]?.[0]?.date.slice(0, 7);
    if (month !== previous && index < calendar.weeks.length - 2) {
      months.push({ x: LEFT + index * (CELL + GAP), label: monthName.format(new Date(`${first.date}T00:00:00Z`)) });
    }
  });

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <svg
          role="img"
          aria-label={`${calendar.total} contributions between ${calendar.from} and ${calendar.to}; ${activeDays} active days${busiest.count ? `; busiest day ${busiest.date} with ${busiest.count}` : ""}.`}
          viewBox={`0 0 ${width} ${height}`}
          // Scales to the card on desktop; on phones the wrapper scrolls horizontally instead of shrinking cells.
          className="h-auto w-full min-w-[680px]"
        >
          {months.map((month) => (
            <text key={`${month.x}-${month.label}`} x={month.x} y={10} className="fill-txtdim font-mono" fontSize="9">
              {month.label}
            </text>
          ))}
          {DAY_LABELS.map(([day, label]) => (
            <text key={label} x={0} y={TOP + day * (CELL + GAP) + CELL - 2} className="fill-txtdim font-mono" fontSize="9">
              {label}
            </text>
          ))}
          {calendar.weeks.map((week, x) =>
            week.map((day) => {
              const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
              const l = level(day.count);
              return (
                <rect
                  key={day.date}
                  x={LEFT + x * (CELL + GAP)}
                  y={TOP + weekday * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={l === 0 ? "var(--line)" : "var(--teal)"}
                  fillOpacity={OPACITY[l]}
                >
                  <title>{`${day.count} contribution${day.count === 1 ? "" : "s"} on ${fullDate.format(new Date(`${day.date}T00:00:00Z`))}`}</title>
                </rect>
              );
            })
          )}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-txtdim">
        <span>
          {activeDays} active days{busiest.count ? ` · busiest: ${busiest.count} on ${busiest.date}` : ""}
        </span>
        <span className="inline-flex items-center gap-1" aria-hidden>
          Less
          {OPACITY.map((opacity, l) => (
            <svg key={l} width={CELL} height={CELL}>
              <rect width={CELL} height={CELL} rx={2} fill={l === 0 ? "var(--line)" : "var(--teal)"} fillOpacity={opacity} />
            </svg>
          ))}
          More
        </span>
      </div>
    </div>
  );
}

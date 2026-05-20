type BalanceSkeletonProps = {
  className?: string;
  size?: "large" | "small" | "medium" | "xs";
};

const SHADES_BASE = [
  "bg-white/25",
  "bg-white/35",
  "bg-white/30",
  "bg-white/20",
  "bg-white/38",
  "bg-white/40",
  "bg-white/28",
  "bg-white/32",
  "bg-white/22",
];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const SHADES = shuffle(SHADES_BASE);

const COLS = 14;
const ROWS = 5;

export default function BalanceSkeleton({
  className = "",
  size = "large",
}: BalanceSkeletonProps) {
  const sizes = {
    large: { w: "0.32em", h: "0.22em" },
    medium: { w: "0.29em", h: "0.2em" },
    small: { w: "0.26em", h: "0.18em" },
    xs: { w: "0.2em", h: "0.14em" },
  } as const;
  const { w: cellW, h: cellH } = sizes[size ?? "large"];

  return (
    <span
      className={`block m-0 overflow-hidden rounded-[0.2em] shrink-0 ${className}`}
      aria-hidden
      style={{
        width: `calc(${COLS} * ${cellW})`,
        height: `calc(${ROWS} * ${cellH})`,
      }}
    >
      <span
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, ${cellW})`,
          gridTemplateRows: `repeat(${ROWS}, ${cellH})`,
          width: `calc(${COLS} * ${cellW})`,
          height: `calc(${ROWS} * ${cellH})`,
        }}
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <span
            key={i}
            className={SHADES[i % SHADES.length]}
            style={{ width: cellW, height: cellH, minWidth: cellW, minHeight: cellH }}
          />
        ))}
      </span>
    </span>
  );
}

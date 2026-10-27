export type Mood = "idle" | "thinking" | "excited" | "confused";

const INK = "#1F2A44";
const stroke = { stroke: INK, strokeWidth: 3, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Eye({ x, y, r = 5 }: { x: number; y: number; r?: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={r} fill={INK} />
      <circle cx={x + 1.6} cy={y - 1.6} r={1.5} fill="#fff" />
    </>
  );
}

// Face centred at (74, 84), eye gap 13 — matches the approved mascot sheet.
function Face({ mood }: { mood: Mood }) {
  const L = 61, R = 87, y = 84, mY = 97;
  if (mood === "thinking")
    return (
      <g>
        <g className="eyes">
          <Eye x={L - 1} y={y - 2} r={4.5} />
          <Eye x={R - 1} y={y - 2} r={4.5} />
        </g>
        <path d={`M69 ${mY + 1}h9`} {...stroke} />
      </g>
    );
  if (mood === "excited")
    return (
      <g>
        <path d={`M${L - 5} ${y + 2}l5-6 5 6M${R - 5} ${y + 2}l5-6 5 6`} {...stroke} />
        <path d={`M66 ${mY - 2}q8 12 16 0z`} fill={INK} />
        <path d="M30 58l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FFC93C" />
      </g>
    );
  if (mood === "confused")
    return (
      <g>
        <Eye x={L} y={y} />
        <Eye x={R} y={y + 1} r={3.2} />
        <path d={`M66 ${mY + 1}q3-4 5 0t5 0t5 0`} {...stroke} />
      </g>
    );
  return (
    <g>
      <g className="eyes">
        <Eye x={L} y={y} />
        <Eye x={R} y={y} />
      </g>
      <path d={`M68 ${mY}q6 5 12 0`} {...stroke} />
    </g>
  );
}

export function Scout({ mood, size = 72 }: { mood: Mood; size?: number }) {
  return (
    <svg className={`scout scout-${mood}`} width={size} height={size} viewBox="18 18 130 130" role="img" aria-label={`Scout, ${mood}`}>
      <g className="scout-body">
        <ellipse cx="80" cy="84" rx="50" ry="46" fill="#2BB673" />
        <circle cx="80" cy="30" r="7" fill="#2BB673" />
        <path d="M80 37v10" stroke="#2BB673" strokeWidth="5" />
        <circle cx="110" cy="66" r="17" fill="#E9FFF5" opacity=".9" stroke={INK} strokeWidth="4" />
        <path d="M122 79l12 12" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        <Face mood={mood} />
      </g>
    </svg>
  );
}

/**
 * ============================================================================
 * GamePlayPreview — static "how it looks when playing" snapshots (owner ask
 * 2026-09-28: every game card on /games shows a mini mid-game board with the
 * name written below it — see AGENTS.md §2D Games and plan/games/README.md §5)
 * ============================================================================
 * Server-safe: pure inline SVG per registry slug, no client JS, no new deps.
 * Each preview is aria-hidden decoration; the card's title text carries the
 * meaning. Unknown slugs fall back to a neutral placeholder — never crash.
 * ============================================================================
 */

export interface GamePlayPreviewProps {
  slug: string;
  className?: string;
}

/** Small rounded tile that hosts the SVG; keeps every card visually even. */
const TILE_CLASS =
  'flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-white/15 p-3 ring-1 ring-white/25 backdrop-blur-[2px]';

export function GamePlayPreview({ slug, className = '' }: GamePlayPreviewProps): JSX.Element {
  return (
    <span className={`${TILE_CLASS} ${className}`} aria-hidden="true">
      {previewSvg(slug)}
    </span>
  );
}

function previewSvg(slug: string): JSX.Element {
  switch (slug) {
    case 'tic-tac-toe':
      return <TicTacToePreview />;
    case 'connect-four':
      return <ConnectFourPreview />;
    case 'gomoku':
      return <GomokuPreview />;
    case 'dots-and-boxes':
      return <DotsAndBoxesPreview />;
    case 'battleship':
      return <BattleshipPreview />;
    case 'pig-dice':
      return <PigDicePreview />;
    case 'rock-paper-scissors':
      return <RockPaperScissorsPreview />;
    case 'othello-3':
      return <Flip3Preview />;
    case 'quadflip':
      return <Flip4Preview />;
    case 'ultimate-ttt-mp':
      return <UtttPreview />;
    case 'tri-nim':
      return <TriNimPreview />;
    case 'connect-four-mp':
      return <C4MpPreview />;
    case 'quad-oxo':
      return <QuadOxoPreview />;
    case 'dots-boxes-4p':
      return <Dots4Preview />;
    case 'sos-4p':
      return <Sos4Preview />;
    case 'checkers':
      return <CheckersPreview />;
    default:
      return <PlaceholderPreview />;
  }
}

/* --- shared SVG scaffolding --------------------------------------------- */

function BoardFrame({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <svg viewBox="0 0 120 84" className="h-full w-full" fill="none">
      {children}
    </svg>
  );
}

/* --- per-game snapshots --------------------------------------------------- */

/** 3×3 grid, mid-game, X holding a winning diagonal. */
function TicTacToePreview(): JSX.Element {
  return (
    <BoardFrame>
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.75">
        <path d="M44 12v60M76 12v60M12 32h96M12 52h96" />
      </g>
      <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
        <path d="M20 16l16 12M36 16l-16 12" />
        <path d="M52 36l16 12M68 36l-16 12" />
        <path d="M84 56l16 12M100 56l-16 12" />
      </g>
      <g stroke="currentColor" strokeWidth="3" opacity="0.7">
        <circle cx="60" cy="22" r="7" />
        <circle cx="28" cy="42" r="7" />
        <circle cx="92" cy="42" r="7" />
      </g>
      <path
        d="M18 14L102 70"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.5"
        strokeDasharray="4 4"
      />
    </BoardFrame>
  );
}

/** 7×6 drop board with stacked red/yellow discs. */
function ConnectFourPreview(): JSX.Element {
  const discs: Array<[number, number, string]> = [
    [0, 5, '#f43f5e'],
    [1, 5, '#fbbf24'],
    [2, 5, '#f43f5e'],
    [0, 4, '#fbbf24'],
    [3, 5, '#fbbf24'],
    [1, 4, '#f43f5e'],
    [2, 4, '#f43f5e'],
    [0, 3, '#f43f5e'],
  ];
  return (
    <BoardFrame>
      <rect
        x="8"
        y="10"
        width="104"
        height="66"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.6"
      />
      {discs.map(([c, r, fill], i) => (
        <circle key={i} cx={16 + c * 14} cy={68 - r * 10.5} r="5" fill={fill} />
      ))}
    </BoardFrame>
  );
}

/** Line grid with black/white stones scattered. */
function GomokuPreview(): JSX.Element {
  const stones: Array<[number, number, string]> = [
    [45, 40, '#111827'],
    [60, 40, '#f9fafb'],
    [75, 40, '#111827'],
    [30, 55, '#f9fafb'],
    [60, 55, '#111827'],
    [90, 25, '#f9fafb'],
    [45, 25, '#f9fafb'],
  ];
  return (
    <BoardFrame>
      <g stroke="currentColor" strokeWidth="1.2" opacity="0.6">
        {[20, 35, 50, 65, 80, 95].map((x) => (
          <path key={`v${x}`} d={`M${x} 12v60`} />
        ))}
        {[20, 35, 50, 65].map((y) => (
          <path key={`h${y}`} d={`M14 ${y}h92`} />
        ))}
      </g>
      {stones.map(([cx, cy, fill], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="5.5"
          fill={fill}
          stroke="currentColor"
          strokeWidth="0.8"
        />
      ))}
    </BoardFrame>
  );
}

/** Dot lattice, some edges drawn, two claimed boxes. */
function DotsAndBoxesPreview(): JSX.Element {
  const dots: Array<[number, number]> = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 4; x++) dots.push([20 + x * 28, 22 + y * 22]);
  }
  return (
    <BoardFrame>
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
        <path d="M20 22h28M48 22v22M76 22h0M20 44h28M48 44h28M76 44h28M48 66h28" />
      </g>
      <rect x="22" y="24" width="24" height="18" rx="3" fill="currentColor" opacity="0.35" />
      <rect x="50" y="46" width="24" height="18" rx="3" fill="currentColor" opacity="0.2" />
      <text x="34" y="37.5" fontSize="11" fontWeight="700" fill="currentColor" textAnchor="middle">
        A
      </text>
      <text x="62" y="59.5" fontSize="11" fontWeight="700" fill="currentColor" textAnchor="middle">
        B
      </text>
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="currentColor" />
      ))}
    </BoardFrame>
  );
}

/** Two mini waters: a placed fleet + shot markers. */
function BattleshipPreview(): JSX.Element {
  return (
    <BoardFrame>
      <rect
        x="8"
        y="10"
        width="48"
        height="64"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.6"
      />
      <rect
        x="64"
        y="10"
        width="48"
        height="64"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.6"
      />
      <rect x="14" y="40" width="34" height="8" rx="3" fill="currentColor" opacity="0.75" />
      <rect x="14" y="56" width="22" height="8" rx="3" fill="currentColor" opacity="0.5" />
      <circle cx="74" cy="22" r="4" fill="currentColor" opacity="0.75" />
      <circle cx="88" cy="34" r="4" fill="currentColor" opacity="0.3" />
      <circle cx="98" cy="48" r="4" fill="currentColor" opacity="0.3" />
      <path
        d="M84 60l8 8M92 60l-8 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </BoardFrame>
  );
}

/** A rolled die + two bank chips. */
function PigDicePreview(): JSX.Element {
  const pips: Array<[number, number]> = [
    [30, 30],
    [54, 30],
    [30, 42],
    [54, 42],
    [30, 54],
    [54, 54],
  ];
  return (
    <BoardFrame>
      <rect x="22" y="18" width="40" height="48" rx="8" fill="currentColor" opacity="0.85" />
      {pips.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="#ffffff" opacity="0.9" />
      ))}
      <rect
        x="70"
        y="24"
        width="34"
        height="14"
        rx="7"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.7"
      />
      <rect
        x="70"
        y="46"
        width="34"
        height="14"
        rx="7"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.7"
      />
      <text x="87" y="34.5" fontSize="9" fontWeight="700" fill="currentColor" textAnchor="middle">
        24
      </text>
      <text x="87" y="56.5" fontSize="9" fontWeight="700" fill="currentColor" textAnchor="middle">
        57
      </text>
    </BoardFrame>
  );
}

/** Rock vs paper vs scissors glyph row. */
function RockPaperScissorsPreview(): JSX.Element {
  return (
    <BoardFrame>
      <g fontSize="26" textAnchor="middle">
        <text x="26" y="52">
          ✊
        </text>
        <text x="60" y="52">
          ✋
        </text>
        <text x="94" y="52">
          ✌️
        </text>
      </g>
      <text x="43" y="56" fontSize="11" fontWeight="800" fill="currentColor" textAnchor="middle">
        vs
      </text>
      <text x="77" y="56" fontSize="11" fontWeight="800" fill="currentColor" textAnchor="middle">
        vs
      </text>
    </BoardFrame>
  );
}

/** 5Ã—5 grid with four symbol families, one line near-complete. */
function QuadOxoPreview(): JSX.Element {
  const marks: Array<[number, number, string]> = [
    [30, 26, '#e11d48'],
    [50, 26, '#2563eb'],
    [70, 26, '#059669'],
    [30, 46, '#d97706'],
    [50, 46, '#e11d48'],
    [70, 46, '#2563eb'],
    [30, 66, '#2563eb'],
    [50, 66, '#d97706'],
  ];
  return (
    <BoardFrame>
      <g stroke="currentColor" strokeWidth="1.2" opacity="0.5">
        {[30, 50, 70].map((x) => (
          <path key={`v${x}`} d={`M${x} 14v56`} />
        ))}
        {[26, 46, 66].map((y) => (
          <path key={`h${y}`} d={`M18 ${y}h84`} />
        ))}
      </g>
      {marks.map(([cx, cy, fill], i) => (
        <circle key={i} cx={cx} cy={cy} r="6" fill={fill} />
      ))}
      <circle cx="70" cy="66" r="6" fill="#059669" opacity="0.9" />
      <path d="M26 66L90 66" stroke="#059669" strokeWidth="2.5" opacity="0.8" />
    </BoardFrame>
  );
}
/** Dot lattice with drawn edges and two claimed boxes. */
function Dots4Preview(): JSX.Element {
  const dots: Array<[number, number]> = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 4; x++) dots.push([22 + x * 26, 20 + y * 22]);
  }
  return (
    <BoardFrame>
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
        <path d="M22 20h26M74 20h26M22 42h52M48 64h52" />
        <path d="M48 20v22M74 42v22" />
      </g>
      <rect x="24" y="22" width="22" height="18" rx="3" fill="#e11d48" opacity="0.75" />
      <rect x="50" y="44" width="22" height="18" rx="3" fill="#2563eb" opacity="0.75" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="currentColor" />
      ))}
    </BoardFrame>
  );
}

/** Paper grid with an S-O-S line highlighted. */
function Sos4Preview(): JSX.Element {
  return (
    <BoardFrame>
      <g stroke="currentColor" strokeWidth="1.2" opacity="0.45">
        {[30, 50, 70, 90].map((x) => (
          <path key={`v${x}`} d={`M${x} 12v60`} />
        ))}
        {[22, 42, 62].map((y) => (
          <path key={`h${y}`} d={`M14 ${y}h92`} />
        ))}
      </g>
      <g fontSize="15" fontWeight="800" textAnchor="middle">
        <text x="30" y="27" fill="#e11d48">
          S
        </text>
        <text x="50" y="27" fill="#2563eb">
          O
        </text>
        <text x="70" y="27" fill="#e11d48">
          S
        </text>
        <text x="90" y="47" fill="#2563eb">
          O
        </text>
        <text x="30" y="67" fill="#059669">
          O
        </text>
      </g>
      <path d="M30 22L70 22" stroke="#f59e0b" strokeWidth="2.5" opacity="0.9" />
    </BoardFrame>
  );
}
/** 8×8 board, mid-game: red discs advancing, one crowned, a jump ring showing. */
function CheckersPreview(): JSX.Element {
  const cells: Array<[number, number]> = [];
  for (let row = 0; row < 8; row++) {
    for (let file = 0; file < 8; file++) {
      if (file % 2 !== (row % 2 === 0 ? 1 : 0)) continue;
      cells.push([10 + file * 12.5, 10 + row * 8]);
    }
  }
  // [cell index, fill, crowned]
  const discs: Array<[number, string, boolean]> = [
    [0, '#d33a2c', false],
    [2, '#d33a2c', false],
    [4, '#2f2a26', false],
    [5, '#d33a2c', true],
    [9, '#2f2a26', false],
    [13, '#2f2a26', false],
    [14, '#d33a2c', false],
    [17, '#2f2a26', false],
    [22, '#d33a2c', false],
    [25, '#2f2a26', false],
    [26, '#d33a2c', false],
    [29, '#d33a2c', false],
  ];
  return (
    <BoardFrame>
      {cells.map(([x, y], i) => (
        <rect
          key={`c${i}`}
          x={x - 6.25}
          y={y - 4}
          width={12.5}
          height={8}
          fill="#a9713f"
          opacity={i % 2 === 0 ? 0.55 : 0.75}
        />
      ))}
      {discs.map(([i, fill, king], k) => {
        const cell = cells[i];
        if (!cell) return null;
        const [x, y] = cell;
        return (
          <g key={`d${k}`}>
            <circle cx={x} cy={y} r={3.2} fill={fill} />
            {king && <circle cx={x} cy={y} r={1.4} fill="#ffffff" opacity="0.75" />}
          </g>
        );
      })}
      {cells[20] && (
        <circle
          cx={cells[20][0]}
          cy={cells[20][1]}
          r={4}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.4"
          strokeDasharray="2.5 2"
          opacity="0.9"
        />
      )}
    </BoardFrame>
  );
}

/** Stick rows (3-4-5), some sticks missing. */
function TriNimPreview(): JSX.Element {
  const rows = [2, 4, 3];
  return (
    <BoardFrame>
      {rows.map((n, rowIdx) =>
        Array.from({ length: n }, (_, i) => (
          <rect
            key={rowIdx + '-' + i}
            x={22 + i * 14 + rowIdx * 8}
            y={16 + rowIdx * 22}
            width="8"
            height="16"
            rx="4"
            fill="#d97706"
          />
        ))
      )}
    </BoardFrame>
  );
}

/** Drop board with stacked multi-colour discs. */
function C4MpPreview(): JSX.Element {
  const discs: Array<[number, number, string]> = [
    [30, 64, '#e11d48'],
    [50, 64, '#2563eb'],
    [70, 64, '#059669'],
    [90, 64, '#d97706'],
    [30, 44, '#2563eb'],
    [50, 44, '#e11d48'],
    [30, 24, '#059669'],
  ];
  return (
    <BoardFrame>
      <rect
        x="10"
        y="10"
        width="100"
        height="64"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.5"
      />
      {discs.map(([cx, cy, fill], i) => (
        <circle key={i} cx={cx} cy={cy} r="7" fill={fill} />
      ))}
    </BoardFrame>
  );
}

/** Flip board: green grid with three colour clusters. */
function Flip3Preview(): JSX.Element {
  const stones: Array<[number, number, string]> = [
    [30, 42, '#e11d48'],
    [44, 42, '#2563eb'],
    [58, 42, '#059669'],
    [30, 56, '#e11d48'],
    [44, 56, '#e11d48'],
    [58, 56, '#2563eb'],
  ];
  const hLines = [22, 36, 50, 64];
  const vLines = [28, 42, 56, 70];
  return (
    <BoardFrame>
      <g stroke="#15803d" strokeWidth="1" opacity="0.4">
        {hLines.map((y) => (
          <path key={'h' + y} d={'M14 ' + y + 'h92'} />
        ))}
        {vLines.map((x) => (
          <path key={'v' + x} d={'M' + x + ' 14v56'} />
        ))}
      </g>
      {stones.map(([cx, cy, fill], i) => (
        <circle key={i} cx={cx} cy={cy} r="6" fill={fill} />
      ))}
    </BoardFrame>
  );
}

/** Four-colour flip board with corner clusters. */
function Flip4Preview(): JSX.Element {
  const stones: Array<[number, number, string]> = [
    [24, 24, '#e11d48'],
    [38, 24, '#2563eb'],
    [24, 38, '#2563eb'],
    [38, 38, '#e11d48'],
    [82, 24, '#059669'],
    [96, 24, '#d97706'],
    [82, 38, '#d97706'],
    [96, 38, '#059669'],
    [24, 62, '#059669'],
    [38, 62, '#d97706'],
    [82, 62, '#e11d48'],
    [96, 62, '#2563eb'],
  ];
  const lines = [17, 31, 45, 59, 73];
  return (
    <BoardFrame>
      <g stroke="#7c3aed" strokeWidth="1" opacity="0.35">
        {lines.map((y) => (
          <path key={y} d={'M14 ' + y + 'h92'} />
        ))}
      </g>
      {stones.map(([cx, cy, fill], i) => (
        <circle key={i} cx={cx} cy={cy} r="6" fill={fill} />
      ))}
    </BoardFrame>
  );
}
/** 3×3 of mini tic-tac-toe boards, one won, one forced. */
function UtttPreview(): JSX.Element {
  const marks: Array<[number, number, string, string]> = [
    [28, 28, '●', '#e11d48'],
    [44, 28, '▲', '#2563eb'],
    [60, 28, '●', '#e11d48'],
    [28, 48, '■', '#059669'],
    [60, 48, '★', '#d97706'],
    [44, 68, '●', '#e11d48'],
    [60, 68, '▲', '#2563eb'],
  ];
  const grid = [36, 56, 76];
  return (
    <BoardFrame>
      <g stroke="currentColor" strokeWidth="1" opacity="0.35">
        {grid.map((v) => (
          <path key={'v' + v} d={'M' + v + ' 12v66'} />
        ))}
        {grid.map((v) => (
          <path key={'h' + v} d={'M16 ' + v + 'h72'} />
        ))}
      </g>
      {marks.map(([cx, cy, sym, fill], i) => (
        <text
          key={i}
          x={cx}
          y={cy + 5}
          fontSize="13"
          fontWeight="800"
          fill={fill}
          textAnchor="middle"
        >
          {sym}
        </text>
      ))}
    </BoardFrame>
  );
}
/** Neutral fallback so an unknown slug never breaks the hub. */
function PlaceholderPreview(): JSX.Element {
  return (
    <BoardFrame>
      <rect
        x="14"
        y="12"
        width="92"
        height="60"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="5 4"
        opacity="0.55"
      />
      <g stroke="currentColor" strokeWidth="2" opacity="0.5" strokeLinecap="round">
        <path d="M36 42h48M60 30v24" />
      </g>
    </BoardFrame>
  );
}

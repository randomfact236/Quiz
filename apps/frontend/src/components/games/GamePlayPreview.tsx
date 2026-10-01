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
    case 'snakes-ladders-mp':
      return <SnlPreview />;
    case 'memory-flip-mp':
      return <MemPreview />;
    case 'code-race':
      return <CodeRacePreview />;
    case 'notakto-mp':
      return <NotaktoPreview />;
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
    case 'ludo-mp':
      return <LudoMpPreview />;
    case 'ludo-snakes':
      return <LudoSnakesPreview />;
    case 'checkers-hex':
      return <CheckersHexPreview />;
    case 'checkers-4p':
      return <Checkers4Preview />;
    case 'blokus-4p':
      return <BlokusPreview />;
    case 'dominoes-mp':
      return <DominoesPreview />;
    case 'crazy-eights-mp':
      return <CrazyEightsPreview />;
    case 'yatzy-mp':
      return <YatzyPreview />;
    case 'bulls-race-mp':
      return <BullsRacePreview />;
    case 'hangman-relay-mp':
      return <HangmanRelayPreview />;
    case 'pig-dice-mp':
      return <PigDiceMpPreview />;
    case 'chomp-elimination':
      return <ChompPreview />;
    case 'fleet-royale':
      return <FleetRoyalePreview />;
    case 'checkers':
      return <CheckersPreview />;
    case 'othello':
      return <OthelloPreview />;
    case 'pente':
      return <PentePreview />;
    case 'go':
      return <GoPreview />;
    case 'chess':
      return <ChessPreview />;
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
/** Hidden code: covered pegs with black/white feedback row. */
function CodeRacePreview(): JSX.Element {
  const covered = [24, 40, 56, 72];
  return (
    <BoardFrame>
      {covered.map((cx, i) => (
        <circle
          key={i}
          cx={cx}
          cy="30"
          r="8"
          fill="currentColor"
          opacity="0.25"
          stroke="currentColor"
          strokeDasharray="3 3"
        />
      ))}
      <text
        x="48"
        y="56"
        fontSize="10"
        fontWeight="800"
        fill="currentColor"
        textAnchor="middle"
        opacity="0.7"
      >
        ??
      </text>
      <g fontSize="11" fontWeight="800">
        <text x="36" y="76" fill="currentColor">
          2● 1○
        </text>
      </g>
    </BoardFrame>
  );
}

/** Three mini X-boards, one with a losing line. */
function NotaktoPreview(): JSX.Element {
  const xs: Array<[number, number]> = [
    [26, 26],
    [36, 36],
    [26, 46],
    [62, 26],
    [62, 46],
    [82, 46],
  ];
  return (
    <BoardFrame>
      <g stroke="currentColor" strokeWidth="1" opacity="0.35">
        {[22, 32, 42, 58, 68, 78].map((v) => (
          <path key={'v' + v} d={'M' + v + ' 14v56'} />
        ))}
        {[26, 36, 46, 62, 72].map((v) => (
          <path key={'h' + v} d={'M16 ' + v + 'h72'} />
        ))}
      </g>
      {xs.map(([cx, cy], i) => (
        <text
          key={i}
          x={cx}
          y={cy + 4}
          fontSize="11"
          fontWeight="900"
          fill="#e11d48"
          textAnchor="middle"
        >
          ✕
        </text>
      ))}
    </BoardFrame>
  );
}
/** Board hint: ladder cells green, snake cells red, one pawn mid-race. */
function SnlPreview(): JSX.Element {
  const cells: Array<[number, number, string, string]> = [
    [30, 30, '4', '#059669'],
    [44, 30, '9', '#059669'],
    [58, 30, '16', 'currentColor'],
    [30, 48, '54', '#e11d48'],
    [44, 48, '62', '#e11d48'],
    [72, 48, '98', '#e11d48'],
    [44, 66, '84', '#059669'],
    [58, 66, '95', '#e11d48'],
  ];
  return (
    <BoardFrame>
      {cells.map(([cx, cy, label, color], i) => (
        <g key={i}>
          <rect x={cx - 9} y={cy - 9} width="18" height="18" rx="3" fill={color} opacity="0.3" />
          <text x={cx} y={cy + 3} fontSize="7" fill={color} textAnchor="middle" fontWeight="700">
            {label}
          </text>
        </g>
      ))}
      <circle cx="88" cy="76" r="5" fill="#e11d48" />
    </BoardFrame>
  );
}

/** Pairs grid: face-down cards with one matched pair face up. */
function MemPreview(): JSX.Element {
  const cards: Array<[number, number, string, boolean]> = [
    [24, 26, '1', true],
    [40, 26, '1', true],
    [56, 26, '', false],
    [72, 26, '', false],
    [24, 46, '', false],
    [40, 46, '', false],
    [56, 46, '', false],
    [72, 46, '', false],
    [24, 66, '', false],
    [40, 66, '', false],
    [56, 66, '', false],
    [72, 66, '', false],
  ];
  return (
    <BoardFrame>
      {cards.map(([cx, cy, sym, up], i) => (
        <g key={i}>
          <rect
            x={cx - 8}
            y={cy - 8}
            width="16"
            height="16"
            rx="3"
            fill={up ? '#fbbf24' : 'currentColor'}
            opacity={up ? 0.9 : 0.25}
          />
          {sym && (
            <text x={cx} y={cy + 5} fontSize="10" textAnchor="middle" fill="#111" fontWeight="800">
              {sym}
            </text>
          )}
        </g>
      ))}
    </BoardFrame>
  );
}
/** Green 8×8 board, mid-game: dark and light discs with a legal-move ghost. */
function OthelloPreview(): JSX.Element {
  const grid: Array<[number, number]> = [];
  for (let row = 0; row < 6; row++) {
    for (let file = 0; file < 8; file++) {
      grid.push([14 + file * 11.5, 12 + row * 10]);
    }
  }
  // [row, fill] — a run of dark discs against a wall of light, which is the
  // whole game in one glance
  const discs: Array<[number, string]> = [
    [1, '#1c2430'],
    [1, '#1c2430'],
    [1, '#1c2430'],
    [2, '#f6f7f9'],
    [2, '#1c2430'],
    [2, '#1c2430'],
    [3, '#1c2430'],
    [3, '#f6f7f9'],
    [3, '#f6f7f9'],
    [4, '#f6f7f9'],
    [4, '#f6f7f9'],
    [4, '#1c2430'],
    [5, '#1c2430'],
  ];
  const ghost = grid[2];
  return (
    <BoardFrame>
      <rect
        x="10"
        y="8"
        width="100"
        height="68"
        rx="6"
        fill="#3a8a5b"
        stroke="#2c6b45"
        strokeWidth="1.5"
      />
      {discs.map(([row, fill], i) => {
        const cell = grid[row];
        if (!cell) return null;
        return (
          <circle
            key={'d' + i}
            cx={cell[0]}
            cy={cell[1]}
            r="4"
            fill={fill}
            stroke={fill === '#f6f7f9' ? 'rgba(0,0,0,0.15)' : 'none'}
            strokeWidth="0.8"
          />
        );
      })}
      {ghost && <circle cx={ghost[0]} cy={ghost[1] + 10} r="2" fill="#ffffff" opacity="0.45" />}
    </BoardFrame>
  );
}

/** A 19x19 grid fragment, mid-game: a black run and a captured pair. */
function PentePreview(): JSX.Element {
  const stones: Array<[number, number, string]> = [
    [26, 22, '#1c2430'],
    [40, 22, '#1c2430'],
    [40, 36, '#1c2430'],
    [54, 36, '#f6f7f9'],
    [68, 50, '#1c2430'],
    [54, 50, '#f6f7f9'],
    [40, 64, '#f6f7f9'],
    [26, 64, '#1c2430'],
    [82, 36, '#f6f7f9'],
  ];
  return (
    <BoardFrame>
      <g stroke="currentColor" strokeWidth="0.7" opacity="0.45">
        {[20, 34, 48, 62, 76, 90, 104].map((x) => (
          <path key={'v' + x} d={`M${x} 12v62`} />
        ))}
        {[18, 30, 42, 54, 66, 78].map((y) => (
          <path key={'h' + y} d={`M14 ${y}h94`} />
        ))}
      </g>
      {stones.map(([x, y, fill], i) => (
        <circle
          key={'s' + i}
          cx={x}
          cy={y}
          r="4.6"
          fill={fill}
          stroke={fill === '#f6f7f9' ? 'rgba(0,0,0,0.2)' : 'none'}
          strokeWidth="0.6"
        />
      ))}
    </BoardFrame>
  );
}

/** Ludo cross board: 15x15 arms, four yards, pawns on the ring. */
function LudoMpPreview(): JSX.Element {
  const cell = 5.6;
  const px = (c: number): number => 9 + c * cell;
  const py = (r: number): number => 9 + r * cell;
  const yard = (r: number, c: number, fill: string): JSX.Element => (
    <rect
      x={px(c)}
      y={py(r)}
      width={cell * 4}
      height={cell * 4}
      rx="3"
      fill={fill}
      opacity="0.28"
    />
  );
  const pawn = (r: number, c: number, fill: string): JSX.Element => (
    <circle
      cx={px(c) + cell / 2}
      cy={py(r) + cell / 2}
      r="2.3"
      fill={fill}
      stroke="#fff"
      strokeWidth="0.7"
    />
  );
  return (
    <BoardFrame>
      <rect
        x={px(4)}
        y={py(4)}
        width={cell * 7}
        height={cell * 7}
        rx="4"
        fill="currentColor"
        opacity="0.1"
      />
      {yard(1, 1, '#e11d48')}
      {yard(1, 10, '#2563eb')}
      {yard(10, 1, '#059669')}
      {yard(10, 10, '#d97706')}
      <rect
        x={px(6.5)}
        y={py(6.5)}
        width={cell * 2}
        height={cell * 2}
        rx="2"
        fill="currentColor"
        opacity="0.25"
      />
      {pawn(6, 0.5, '#e11d48')}
      {pawn(6, 2.5, '#e11d48')}
      {pawn(5, 6.5, '#2563eb')}
      {pawn(8.5, 5, '#059669')}
      {pawn(7.5, 12.5, '#d97706')}
      {pawn(12.5, 8, '#d97706')}
    </BoardFrame>
  );
}
/** Checkers Hex: 8x8 board with three corner triads. */
function CheckersHexPreview(): JSX.Element {
  const s = 7.2;
  const px = (c: number): number => 12 + c * s;
  const py = (r: number): number => 6 + r * s;
  const men: Array<[number, number, string]> = [
    [0, 1, '#e11d48'],
    [1, 0, '#e11d48'],
    [1, 2, '#e11d48'],
    [2, 1, '#e11d48'],
    [0, 6, '#2563eb'],
    [1, 5, '#2563eb'],
    [1, 7, '#2563eb'],
    [2, 6, '#2563eb'],
    [6, 2, '#059669'],
    [7, 3, '#059669'],
    [6, 4, '#059669'],
    [7, 5, '#059669'],
    [3, 3, '#2563eb'],
    [4, 4, '#059669'],
    [5, 3, '#e11d48'],
  ];
  return (
    <BoardFrame>
      <rect x={px(0)} y={py(0)} width={s * 8} height={s * 8} rx="4" fill="#b08968" opacity="0.35" />
      {Array.from({ length: 64 }, (_, i) => {
        const r = Math.floor(i / 8);
        const c = i % 8;
        return (r + c) % 2 === 1 ? (
          <rect key={i} x={px(c)} y={py(r)} width={s} height={s} fill="#8a6240" opacity="0.5" />
        ) : null;
      })}
      {men.map(([r, c, fill], i) => (
        <circle
          key={'m' + i}
          cx={px(c) + s / 2}
          cy={py(r) + s / 2}
          r={s * 0.36}
          fill={fill}
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="0.8"
        />
      ))}
      <rect
        x={px(0)}
        y={py(0)}
        width={s * 3}
        height={s * 3}
        rx="3"
        fill="none"
        stroke="#e11d48"
        strokeWidth="1"
        opacity="0.5"
      />
      <rect
        x={px(5)}
        y={py(0)}
        width={s * 3}
        height={s * 3}
        rx="3"
        fill="none"
        stroke="#2563eb"
        strokeWidth="1"
        opacity="0.5"
      />
      <rect
        x={px(2)}
        y={py(5)}
        width={s * 4}
        height={s * 3}
        rx="3"
        fill="none"
        stroke="#059669"
        strokeWidth="1"
        opacity="0.5"
      />
    </BoardFrame>
  );
}

/** Checkers 4P: 10x10 with four border strips. */
function Checkers4Preview(): JSX.Element {
  const s = 6.4;
  const px = (c: number): number => 10 + c * s;
  const py = (r: number): number => 5 + r * s;
  const men: Array<[number, number, string]> = [];
  for (let c = 1; c < 10; c += 2) men.push([0, c, '#71717a']);
  for (let r = 1; r < 10; r += 2) men.push([r, 9, '#2dd4bf']);
  for (let c = 1; c < 10; c += 2) men.push([9, c, '#f472b6']);
  for (let r = 1; r < 10; r += 2) men.push([r, 0, '#fbbf24']);
  men.push([3, 3, '#71717a'], [4, 4, '#2dd4bf'], [5, 5, '#f472b6'], [6, 6, '#fbbf24']);
  return (
    <BoardFrame>
      <rect
        x={px(0)}
        y={py(0)}
        width={s * 10}
        height={s * 10}
        rx="4"
        fill="#a78b6f"
        opacity="0.3"
      />
      {men.map(([r, c, fill], i) => (
        <circle
          key={'m' + i}
          cx={px(c) + s / 2}
          cy={py(r) + s / 2}
          r={s * 0.34}
          fill={fill}
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="0.7"
        />
      ))}
    </BoardFrame>
  );
}

/** Blokus 4P: 20x20 mini grid with corner clusters. */
function BlokusPreview(): JSX.Element {
  const s = 3.9;
  const px = (c: number): number => 13 + c * s;
  const py = (r: number): number => 8 + r * s;
  const cluster = (r: number, c: number, fill: string): JSX.Element => (
    <g fill={fill} stroke="#fff" strokeWidth="0.5">
      <rect x={px(c)} y={py(r)} width={s} height={s} rx="1" />
      <rect x={px(c + 1)} y={py(r)} width={s} height={s} rx="1" />
      <rect x={px(c)} y={py(r + 1)} width={s} height={s} rx="1" />
    </g>
  );
  return (
    <BoardFrame>
      <rect
        x={px(0)}
        y={py(0)}
        width={s * 20}
        height={s * 20}
        rx="3"
        fill="currentColor"
        opacity="0.08"
      />
      <g stroke="currentColor" strokeWidth="0.25" opacity="0.25">
        {Array.from({ length: 20 }, (_, i) => (
          <path key={'v' + i} d={'M' + px(i) + ' ' + py(0) + 'v' + s * 20} />
        ))}
        {Array.from({ length: 20 }, (_, i) => (
          <path key={'h' + i} d={'M' + px(0) + ' ' + py(i) + 'h' + s * 20} />
        ))}
      </g>
      {cluster(0, 0, '#e11d48')}
      {cluster(0, 17, '#2563eb')}
      {cluster(17, 0, '#059669')}
      {cluster(17, 17, '#d97706')}
      <g fill="#e11d48" stroke="#fff" strokeWidth="0.5" opacity="0.9">
        <rect x={px(9)} y={py(3)} width={s} height={s} rx="1" />
        <rect x={px(10)} y={py(4)} width={s} height={s} rx="1" />
        <rect x={px(11)} y={py(3)} width={s} height={s} rx="1" />
        <rect x={px(12)} y={py(4)} width={s} height={s} rx="1" />
      </g>
    </BoardFrame>
  );
}
/** A 9x9 Go board, mid-game: a black group under pressure, white walls. */
function GoPreview(): JSX.Element {
  const stones: Array<[number, number, string]> = [
    [20, 20, '#14180f'],
    [34, 20, '#14180f'],
    [20, 34, '#14180f'],
    [34, 34, '#fbfaf4'],
    [48, 34, '#fbfaf4'],
    [48, 48, '#fbfaf4'],
    [62, 48, '#fbfaf4'],
    [76, 62, '#fbfaf4'],
    [62, 76, '#14180f'],
    [90, 76, '#14180f'],
    [90, 34, '#fbfaf4'],
    [34, 90, '#14180f'],
  ];
  return (
    <BoardFrame>
      <rect
        x="8"
        y="8"
        width="104"
        height="68"
        rx="5"
        fill="#e2b96f"
        stroke="#b58b45"
        strokeWidth="1.5"
      />
      <g stroke="rgba(60,40,12,0.5)" strokeWidth="0.7">
        {[20, 34, 48, 62, 76, 90].map((x) => (
          <path key={'v' + x} d={'M' + x + ' 14v56'} />
        ))}
        {[20, 34, 48, 62, 76].map((y) => (
          <path key={'h' + y} d={'M14 ' + y + 'h92'} />
        ))}
      </g>
      {stones.map(([x, y, fill], i) => (
        <circle
          key={'s' + i}
          cx={x}
          cy={y}
          r="5"
          fill={fill}
          stroke={fill === '#fbfaf4' ? 'rgba(0,0,0,0.2)' : 'none'}
          strokeWidth="0.6"
        />
      ))}
    </BoardFrame>
  );
}

/** A chess position mid-game: kings, a queen, and a pinned-looking pawn line. */
function ChessPreview(): JSX.Element {
  const squares: Array<[number, number, boolean]> = [];
  for (let row = 0; row < 4; row++) {
    for (let file = 0; file < 8; file++) squares.push([row, file, (row + file) % 2 === 1]);
  }
  const pieces: Array<[number, number, string]> = [
    [0, 4, '♚'],
    [3, 3, '♔'],
    [1, 1, '♝'],
    [2, 2, '♗'],
    [1, 3, '♟'],
    [2, 4, '♙'],
    [2, 6, '♙'],
    [3, 5, '♟'],
  ];
  return (
    <BoardFrame>
      {squares.map(([row, file, dark], i) => (
        <rect
          key={'sq' + i}
          x={16 + file * 11}
          y={12 + row * 15}
          width={11}
          height={15}
          fill={dark ? '#7b9a68' : '#eeeed2'}
        />
      ))}
      {pieces.map(([row, file, glyph], i) => (
        <text
          key={'p' + i}
          x={16 + file * 11 + 5.5}
          y={12 + row * 15 + 11}
          fontSize="11"
          textAnchor="middle"
          fill={glyph === '♚' || glyph === '♙' ? '#23231f' : '#fbfbf7'}
          stroke={glyph === '♚' || glyph === '♙' ? 'none' : '#23231f'}
          strokeWidth="0.4"
        >
          {glyph}
        </text>
      ))}
    </BoardFrame>
  );
}

/** Dominoes: a laid chain of pip tiles. */
function DominoesPreview(): JSX.Element {
  const tile = (x: number, y: number, b: number, key: string): JSX.Element => (
    <g key={key} transform={'translate(' + x + ' ' + y + ')'}>
      <rect
        x="0"
        y="0"
        width="18"
        height="34"
        rx="4"
        fill="#faf7f2"
        stroke="#78716c"
        strokeWidth="1.5"
      />
      <line x1="1" y1="17" x2="17" y2="17" stroke="#78716c" strokeWidth="1" />
      <circle cx="9" cy="9" r="2.2" fill="#1c1917" />
      <circle cx="9" cy="25" r="2.2" fill="#1c1917" />
      {b >= 3 && <circle cx="4.5" cy="25" r="2.2" fill="#1c1917" />}
      {b >= 3 && <circle cx="13.5" cy="25" r="2.2" fill="#1c1917" />}
      {b >= 5 && <circle cx="9" cy="21" r="2.2" fill="#1c1917" />}
    </g>
  );
  return (
    <BoardFrame>
      <rect x="10" y="14" width="100" height="56" rx="8" fill="currentColor" opacity="0.07" />
      {tile(14, 25, 6, 't1')}
      {tile(34, 25, 3, 't2')}
      {tile(54, 25, 5, 't3')}
      {tile(74, 25, 2, 't4')}
      {tile(94, 25, 4, 't5')}
    </BoardFrame>
  );
}

/** Crazy Eights: stock + discard + hand cards. */
function CrazyEightsPreview(): JSX.Element {
  const card = (
    x: number,
    y: number,
    rank: string,
    suit: string,
    red: boolean,
    key: string
  ): JSX.Element => (
    <g key={key} transform={'translate(' + x + ' ' + y + ')'}>
      <rect
        x="0"
        y="0"
        width="17"
        height="24"
        rx="3"
        fill="#faf7f2"
        stroke="#a8a29e"
        strokeWidth="1.2"
      />
      <text
        x="8.5"
        y="10"
        textAnchor="middle"
        fontSize="8"
        fontWeight="800"
        fill={red ? '#dc2626' : '#1c1917'}
      >
        {' '}
        {rank}
      </text>
      <text x="8.5" y="19" textAnchor="middle" fontSize="9" fill={red ? '#dc2626' : '#1c1917'}>
        {' '}
        {suit}
      </text>
    </g>
  );
  return (
    <BoardFrame>
      <rect
        x="18"
        y="22"
        width="20"
        height="28"
        rx="3"
        fill="#6d5bd0"
        stroke="#4c3fb0"
        strokeWidth="1.2"
      />
      <circle cx="28" cy="36" r="5" fill="none" stroke="#ffffff" strokeWidth="1.4" opacity="0.7" />
      {card(46, 24, '8', '♠', false, 'c1')}
      {card(66, 24, '4', '♥', true, 'c2')}
      {card(40, 56, '9', '♦', true, 'c3')}
      {card(60, 56, 'K', '♣', false, 'c4')}
      {card(80, 56, '2', '♠', false, 'c5')}
    </BoardFrame>
  );
}

/** Yatzy: five dice + scorecard rows. */
function YatzyPreview(): JSX.Element {
  const die = (x: number, v: number, key: string): JSX.Element => (
    <g key={key} transform={'translate(' + x + ' 18)'}>
      <rect
        x="0"
        y="0"
        width="14"
        height="14"
        rx="3"
        fill="#ffffff"
        stroke="#a8a29e"
        strokeWidth="1.2"
      />
      <text x="7" y="11" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1c1917">
        {' '}
        {v}
      </text>
    </g>
  );
  return (
    <BoardFrame>
      {die(24, 3, 'd1')}
      {die(41, 5, 'd2')}
      {die(58, 2, 'd3')}
      {die(75, 5, 'd4')}
      {die(92, 6, 'd5')}
      <rect x="52" y="44" width="34" height="5" rx="2.5" fill="currentColor" opacity="0.3" />
      <rect x="52" y="53" width="26" height="5" rx="2.5" fill="currentColor" opacity="0.22" />
      <rect x="52" y="62" width="30" height="5" rx="2.5" fill="currentColor" opacity="0.26" />
      <text x="96" y="49" fontSize="9" fontWeight="800" fill="currentColor" opacity="0.7">
        {' '}
        +37
      </text>
    </BoardFrame>
  );
}
/** Ludo Snakes: cross board with ladder/snake ring marks. */
function LudoSnakesPreview(): JSX.Element {
  const cell = 5.6;
  const px = (c: number): number => 9 + c * cell;
  const py = (r: number): number => 9 + r * cell;
  const yard = (r: number, c: number, fill: string): JSX.Element => (
    <rect
      x={px(c)}
      y={py(r)}
      width={cell * 4}
      height={cell * 4}
      rx="3"
      fill={fill}
      opacity="0.28"
    />
  );
  const pawn = (r: number, c: number, fill: string): JSX.Element => (
    <circle
      cx={px(c) + cell / 2}
      cy={py(r) + cell / 2}
      r="2.3"
      fill={fill}
      stroke="#fff"
      strokeWidth="0.7"
    />
  );
  const mark = (r: number, c: number, glyph: string, color: string): JSX.Element => (
    <text
      x={px(c) + cell / 2}
      y={py(r) + cell}
      textAnchor="middle"
      fontSize="4.4"
      fontWeight="900"
      fill={color}
    >
      {' '}
      {glyph}
    </text>
  );
  return (
    <BoardFrame>
      <rect
        x={px(4)}
        y={py(4)}
        width={cell * 7}
        height={cell * 7}
        rx="4"
        fill="currentColor"
        opacity="0.1"
      />
      {yard(1, 1, '#e11d48')}
      {yard(1, 10, '#2563eb')}
      {yard(10, 1, '#059669')}
      {yard(10, 10, '#d97706')}
      {mark(6, 0.5, '🧺', '#047857')}
      {mark(5, 6.5, '🧺', '#047857')}
      {mark(9, 4, '🐍', '#b91c1c')}
      {mark(14, 7, '🐍', '#b91c1c')}
      {pawn(6, 2.5, '#e11d48')}
      {pawn(5, 6.5, '#2563eb')}
      {pawn(8.5, 5, '#059669')}
      {pawn(12.5, 8, '#d97706')}
    </BoardFrame>
  );
}
/** Neutral fallback so an unknown slug never breaks the hub. */
/** Bulls Race: four digit boxes + a 3-bulls hit. */
function BullsRacePreview(): JSX.Element {
  return (
    <BoardFrame>
      <g fill="currentColor" opacity="0.9">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={12 + i * 25} y="18" width="20" height="26" rx="4" opacity="0.25" />
        ))}
      </g>
      <g
        fill="currentColor"
        fontFamily="monospace"
        fontWeight="700"
        fontSize="13"
        textAnchor="middle"
      >
        <text x="22" y="36">
          4
        </text>
        <text x="47" y="36">
          7
        </text>
        <text x="72" y="36">
          4
        </text>
        <text x="97" y="36">
          1
        </text>
      </g>
      <g fill="currentColor" opacity="0.85">
        <circle cx="24" cy="60" r="4" />
        <circle cx="40" cy="60" r="4" />
        <circle cx="56" cy="60" r="4" />
      </g>
      <text x="74" y="64" fill="currentColor" fontSize="10" fontFamily="monospace" opacity="0.8">
        3 bulls
      </text>
    </BoardFrame>
  );
}

/** Hangman Relay: a gallows, a pattern with two letters, one strike. */
function HangmanRelayPreview(): JSX.Element {
  return (
    <BoardFrame>
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.75">
        <path d="M26 72V12h24" />
        <path d="M50 12v10" />
        <path d="M50 46V56M44 62h12" />
      </g>
      <g fill="currentColor" fontFamily="monospace" fontWeight="700" fontSize="16">
        <text x="62" y="40">
          M
        </text>
        <text x="80" y="40">
          A
        </text>
        <text x="98" y="40">
          P
        </text>
      </g>
      <g stroke="currentColor" strokeWidth="2" opacity="0.6">
        <path d="M58 46h14M76 46h14M94 46h14" />
      </g>
      <text x="62" y="66" fill="currentColor" fontSize="10" fontFamily="monospace" opacity="0.8">
        2 misses
      </text>
    </BoardFrame>
  );
}

/** Pig Dice MP: a die showing 5 and a chunky pot total. */
function PigDiceMpPreview(): JSX.Element {
  return (
    <BoardFrame>
      <rect
        x="14"
        y="14"
        width="42"
        height="42"
        rx="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.85"
      />
      <g fill="currentColor">
        <circle cx="24" cy="24" r="3.4" />
        <circle cx="46" cy="24" r="3.4" />
        <circle cx="35" cy="35" r="3.4" />
        <circle cx="24" cy="46" r="3.4" />
        <circle cx="46" cy="46" r="3.4" />
      </g>
      <text
        x="66"
        y="34"
        fill="currentColor"
        fontSize="13"
        fontFamily="monospace"
        fontWeight="700"
        opacity="0.85"
      >
        pot 17
      </text>
      <text x="66" y="54" fill="currentColor" fontSize="10" fontFamily="monospace" opacity="0.7">
        84 / 100
      </text>
    </BoardFrame>
  );
}

/** Chomp: a staircase tray with the poison corner. */
function ChompPreview(): JSX.Element {
  const cells: JSX.Element[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      const gone = r + c > 4;
      cells.push(
        <rect
          key={r + '-' + c}
          x={9 + c * 15}
          y={10 + r * 13}
          width="12"
          height="10"
          rx="2"
          fill="currentColor"
          opacity={gone ? 0.12 : 0.4}
        />
      );
    }
  }
  return (
    <BoardFrame>
      {cells}
      <text x="15" y="19" fill="currentColor" fontSize="9" textAnchor="middle">
        ☠
      </text>
    </BoardFrame>
  );
}

/** Fleet Royale: a shared sea with ships, hits and misses. */
function FleetRoyalePreview(): JSX.Element {
  const marks: JSX.Element[] = [];
  const ships = [2, 12, 13, 18, 26, 34, 35, 50, 58, 59];
  const hits = [13, 34];
  const misses = [5, 21, 44, 60];
  for (let i = 0; i < 64; i++) {
    const r = Math.floor(i / 8);
    const c = i % 8;
    const x = 10 + c * 12.5;
    const y = 10 + r * 8;
    if (ships.includes(i)) {
      marks.push(
        <rect
          key={i}
          x={x}
          y={y}
          width="9"
          height="5"
          rx="1.5"
          fill="currentColor"
          opacity={hits.includes(i) ? 0.9 : 0.55}
        />
      );
    } else if (hits.includes(i)) {
      marks.push(
        <circle key={i} cx={x + 4.5} cy={y + 2.5} r="2.6" fill="currentColor" opacity="0.9" />
      );
    } else if (misses.includes(i)) {
      marks.push(
        <circle key={i} cx={x + 4.5} cy={y + 2.5} r="1.1" fill="currentColor" opacity="0.45" />
      );
    }
  }
  return <BoardFrame>{marks}</BoardFrame>;
}

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

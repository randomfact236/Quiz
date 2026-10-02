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
    case 'sprouts':
      return <SproutsPreview />;
    case 'pente-3':
      return <Pente3Preview />;
    case 'quadwall':
      return <QuadwallPreview />;
    case 'connect6-mp':
      return <Connect6Preview />;
    case 'quarto-pass':
      return <QuartoPassPreview />;
    case 'breakthrough-mp':
      return <BreakthroughPreview />;
    case 'sim-mp':
      return <SimPreview />;
    case 'focus-mp':
      return <FocusPreview />;
    case 'quads-trips':
      return <QuadsTripsPreview />;
    case 'pentago-mp':
      return <PentagoPreview />;
    case 'corners-mp':
      return <CornersMPPreview />;
    case 'two-dice-pig':
      return <TwoDicePigPreview />;
    case 'streak-race':
      return <StreakRacePreview />;
    case 'quad-nim':
      return <QuadNimPreview />;
    case 'farkle-lite':
      return <FarklePreview />;
    case 'row-prison':
      return <RowPrisonPreview />;
    case 'trinity-hex':
      return <TrinityHexPreview />;
    case 'morris-mp':
      return <MorrisPreview />;
    case 'abalone-mp':
      return <AbalonePreview />;
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

/** Sprouts: a little doodle web of dots and lines. */
function SproutsPreview(): JSX.Element {
  const dots: Array<[number, number]> = [
    [70, 128],
    [160, 52],
    [248, 118],
    [196, 162],
    [104, 66],
  ];
  const lines = [
    'M70 128 L160 52',
    'M160 52 L248 118',
    'M248 118 L196 162',
    'M196 162 L70 128',
    'M104 66 L196 162',
  ];
  return (
    <BoardFrame>
      {lines.map((d) => (
        <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth="2.6" opacity="0.45" />
      ))}
      <circle
        cx="248"
        cy="118"
        r="30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.35"
        strokeDasharray="4 3"
      />
      {dots.map(([x, y]) => (
        <circle key={x + '-' + y} cx={x} cy={y} r="9" fill="currentColor" opacity="0.8" />
      ))}
    </BoardFrame>
  );
}

/** Pente-3: three-colour stones with a capture sandwich. */
function Pente3Preview(): JSX.Element {
  const cells: JSX.Element[] = [];
  const N = 7;
  const step = 27;
  const ox = 44;
  const oy = 38;
  // role: 1/2/3 = stone colours, 0 = empty
  const board = [
    [0, 0, 1, 0, 0, 0, 0],
    [0, 2, 0, 0, 3, 0, 0],
    [0, 0, 1, 2, 2, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 3, 0, 2, 0, 3, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ];
  const opac: Record<number, number> = { 0: 0.14, 1: 0.9, 2: 0.55, 3: 0.75 };
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const row = board[r] ?? [];
      const v = row[c] ?? 0;
      cells.push(
        <circle
          key={r + '-' + c}
          cx={ox + c * step}
          cy={oy + r * step}
          r={v === 0 ? 3.2 : 9}
          fill="currentColor"
          opacity={opac[v] ?? 0.14}
        />
      );
    }
  }
  return <BoardFrame>{cells}</BoardFrame>;
}

/** Quadwall: a grid with walls and racing pawns. */
function QuadwallPreview(): JSX.Element {
  const items: JSX.Element[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      items.push(
        <rect
          key={r + '-' + c}
          x={64 + c * 13}
          y={40 + r * 13}
          width="10"
          height="10"
          rx="2"
          fill="currentColor"
          opacity="0.12"
        />
      );
    }
  }
  items.push(
    <rect key="w1" x={77} y={65} width="23" height="5" rx="2" fill="currentColor" opacity="0.8" />
  );
  items.push(
    <rect key="w2" x={103} y={53} width="5" height="23" rx="2" fill="currentColor" opacity="0.8" />
  );
  items.push(<circle key="p1" cx={70} cy={116} r="7" fill="currentColor" opacity="0.9" />);
  items.push(<circle key="p2" cx={148} cy={46} r="7" fill="currentColor" opacity="0.55" />);
  items.push(<circle key="p3" cx={148} cy={116} r="7" fill="currentColor" opacity="0.35" />);
  return <BoardFrame>{items}</BoardFrame>;
}

/** Connect6: a diagonal of six stones among scattered others. */
function Connect6Preview(): JSX.Element {
  const items: JSX.Element[] = [];
  const N = 8;
  const step = 14;
  const ox = 60;
  const oy = 38;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      items.push(
        <circle
          key={r + '-' + c}
          cx={ox + c * step}
          cy={oy + r * step}
          r="3.4"
          fill="currentColor"
          opacity="0.14"
        />
      );
    }
  }
  for (let i = 0; i < 6; i++) {
    items.push(
      <circle
        key={'d' + i}
        cx={ox + (i + 1) * step}
        cy={oy + (i + 1) * step}
        r="5.6"
        fill="currentColor"
        opacity="0.85"
      />
    );
  }
  items.push(
    <circle
      key="s1"
      cx={ox + 6 * step}
      cy={oy + 1 * step}
      r="5.6"
      fill="currentColor"
      opacity="0.5"
    />
  );
  items.push(
    <circle
      key="s2"
      cx={ox + 2 * step}
      cy={oy + 5 * step}
      r="5.6"
      fill="currentColor"
      opacity="0.4"
    />
  );
  items.push(
    <circle
      key="s3"
      cx={ox + 5 * step}
      cy={oy + 0 * step}
      r="5.6"
      fill="currentColor"
      opacity="0.6"
    />
  );
  return <BoardFrame>{items}</BoardFrame>;
}

/** Quarto Pass: a parade of unique pieces. */
function QuartoPassPreview(): JSX.Element {
  const items: JSX.Element[] = [];
  for (let i = 0; i < 9; i++) {
    const x = 62 + (i % 3) * 56;
    const y = 40 + Math.floor(i / 3) * 48;
    const round = i % 2 === 0;
    const tall = Math.floor(i / 3) === 1;
    const w = round ? 26 : 26;
    const h = tall ? 34 : 24;
    if (round) {
      items.push(
        <ellipse
          key={'b' + i}
          cx={x}
          cy={y + h / 2}
          rx={w / 2}
          ry={h / 2}
          fill="currentColor"
          opacity={0.25 + (i % 3) * 0.2}
        />
      );
    } else {
      items.push(
        <rect
          key={'b' + i}
          x={x - w / 2}
          y={y}
          width={w}
          height={h}
          rx="5"
          fill="currentColor"
          opacity={0.25 + (i % 3) * 0.2}
        />
      );
    }
    items.push(
      <circle
        key={'t' + i}
        cx={x}
        cy={y + h / 2}
        r={i % 3 === 0 ? 6 : 4}
        fill={i % 3 === 0 ? 'none' : 'currentColor'}
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.8"
      />
    );
  }
  return <BoardFrame>{items}</BoardFrame>;
}

/** Breakthrough: corner armies running at the far blocks. */
function BreakthroughPreview(): JSX.Element {
  const items: JSX.Element[] = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      items.push(
        <rect
          key={r + '-' + c}
          x={64 + c * 14}
          y={44 + r * 12}
          width="10"
          height="8"
          rx="2"
          fill="currentColor"
          opacity="0.1"
        />
      );
    }
  }
  items.push(
    <rect key="g1" x={174} y={44} width="28" height="18" rx="3" fill="currentColor" opacity="0.3" />
  );
  return (
    <BoardFrame>
      {items}
      <rect x={174} y={44} width="28" height="18" rx="3" fill="currentColor" opacity="0.3" />
      <rect x={64} y={140} width="28" height="18" rx="3" fill="currentColor" opacity="0.3" />
      <circle cx={84} cy={132} r="6" fill="currentColor" opacity="0.85" />
      <circle cx={98} cy={122} r="6" fill="currentColor" opacity="0.85" />
      <circle cx={112} cy={112} r="6" fill="currentColor" opacity="0.85" />
      <circle cx={126} cy={100} r="6" fill="currentColor" opacity="0.85" />
      <circle cx={140} cy={88} r="6" fill="currentColor" opacity="0.5" />
    </BoardFrame>
  );
}

/** Sim: a ring of dots with coloured edges. */
function SimPreview(): JSX.Element {
  const cx = 150;
  const cy = 104;
  const r = 62;
  const dots: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const ang = (-90 + i * 60) * (Math.PI / 180);
    dots.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
  }
  const edges: Array<[number, number, number]> = [
    [0, 1, 0.85],
    [1, 2, 0.85],
    [3, 4, 0.5],
    [2, 3, 0.85],
    [4, 5, 0.5],
    [0, 2, 0.9],
    [0, 5, 0.16],
    [2, 5, 0.16],
    [1, 3, 0.16],
  ];
  return (
    <BoardFrame>
      {edges.map(([a, b, o], i) => {
        const p1 = dots[a] ?? [0, 0];
        const p2 = dots[b] ?? [0, 0];
        return (
          <line
            key={i}
            x1={p1[0]}
            y1={p1[1]}
            x2={p2[0]}
            y2={p2[1]}
            stroke="currentColor"
            strokeWidth={o > 0.2 ? 4 : 2}
            opacity={o}
            strokeDasharray={o > 0.2 ? undefined : '4 4'}
          />
        );
      })}
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="11" fill="currentColor" opacity="0.75" />
      ))}
    </BoardFrame>
  );
}

/** Focus: stacks of pieces on a grid. */
function FocusPreview(): JSX.Element {
  const items: JSX.Element[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      items.push(
        <rect
          key={r + '-' + c}
          x={74 + c * 22}
          y={44 + r * 17}
          width="17"
          height="13"
          rx="3"
          fill="currentColor"
          opacity="0.08"
        />
      );
    }
  }
  const stacks: Array<[number, number, number, number]> = [
    [1, 1, 3, 0.85],
    [3, 0, 1, 0.5],
    [0, 3, 2, 0.6],
    [2, 3, 4, 0.85],
    [4, 1, 2, 0.5],
    [2, 0, 1, 0.35],
  ];
  for (const [r, c, h, o] of stacks) {
    for (let k = 0; k < h; k++) {
      items.push(
        <circle
          key={r + '-' + c + '-' + k}
          cx={82 + c * 22}
          cy={54 + r * 17 - k * 7}
          r="5.4"
          fill="currentColor"
          opacity={o}
        />
      );
    }
  }
  return <BoardFrame>{items}</BoardFrame>;
}

/** Quads & Trips: a hex flower with a four-line brewing. */
function QuadsTripsPreview(): JSX.Element {
  const dots: JSX.Element[] = [];
  const R = 2;
  const size = 21;
  const pos: Array<[number, number]> = [];
  for (let q = -R; q <= R; q++) {
    for (let r = -R; r <= R; r++) {
      if (Math.abs(q + r) <= R) {
        pos.push([150 + Math.sqrt(3) * size * (q + r / 2), 100 + 1.5 * size * r]);
      }
    }
  }
  // a four-line along one direction and a red-ringed "trip" hex
  const four = new Set(['0,0', '1,0', '2,0', '3,0']);
  const tripIdx = pos.findIndex(([x]) => Math.abs(x - (150 + Math.sqrt(3) * size * 3)) < 1);
  pos.forEach(([x, y], i) => {
    const filled = i % 3 === 0;
    dots.push(
      <circle
        key={i}
        cx={x}
        cy={y}
        r={filled ? 8 : 6.5}
        fill="currentColor"
        opacity={filled ? 0.75 : 0.18}
      />
    );
    if (i === tripIdx) {
      dots.push(
        <circle
          key={'t' + i}
          cx={x}
          cy={y}
          r={12}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.5"
          strokeDasharray="3 3"
        />
      );
    }
  });
  void four;
  return <BoardFrame>{dots}</BoardFrame>;
}

/** Pentago: a 6x6 grid with a rolling quadrant. */
function PentagoPreview(): JSX.Element {
  const items: JSX.Element[] = [];
  const step = 17;
  const ox = 66;
  const oy = 40;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      items.push(
        <rect
          key={r + '-' + c}
          x={ox + c * step}
          y={oy + r * step}
          width="13"
          height="13"
          rx="3"
          fill="currentColor"
          opacity="0.1"
        />
      );
    }
  }
  for (let i = 0; i < 5; i++) {
    items.push(
      <circle
        key={'d' + i}
        cx={ox + (i + 0.5) * step}
        cy={oy + (i + 0.5) * step}
        r="5.5"
        fill="currentColor"
        opacity="0.85"
      />
    );
  }
  return (
    <BoardFrame>
      {items}
      <rect
        x={ox + 3 * step}
        y={oy}
        width={3 * step - 3}
        height={3 * step - 3}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.55"
        strokeDasharray="5 4"
      />
      <path
        d={'M' + (ox + 4.4 * step) + ' ' + (oy + 0.7 * step) + ' a 8 8 0 0 1 6 6'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.8"
      />
      <polygon
        points={
          ox +
          4.4 * step +
          ',' +
          (oy + 0.7 * step) +
          ' ' +
          (ox + 4.4 * step + 9) +
          ',' +
          (oy + 1.2 * step) +
          ' ' +
          (ox + 4.4 * step + 1) +
          ',' +
          (oy + 2.6 * step)
        }
        fill="currentColor"
        opacity="0.8"
      />
    </BoardFrame>
  );
}

/** Corners: clone/jump chevrons between corner armies. */
function CornersMPPreview(): JSX.Element {
  const items: JSX.Element[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      items.push(
        <circle
          key={r + '-' + c}
          cx={64 + c * 29}
          cy={42 + r * 18}
          r="3.4"
          fill="currentColor"
          opacity="0.12"
        />
      );
    }
  }
  const spots: Array<[number, number, number]> = [
    [64, 42, 0.9],
    [93, 60, 0.9],
    [238, 42, 0.5],
    [209, 60, 0.5],
    [64, 150, 0.35],
    [93, 132, 0.35],
    [151, 78, 0.85],
    [122, 114, 0.6],
  ];
  for (let i = 0; i < spots.length; i++) {
    const [x, y, o] = spots[i] ?? [0, 0, 0];
    items.push(<circle key={'s' + i} cx={x} cy={y} r="9" fill="currentColor" opacity={o} />);
  }
  items.push(
    <path
      d="M103 64 L142 74"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
      opacity="0.6"
      strokeDasharray="4 4"
    />
  );
  items.push(
    <circle
      cx="151"
      cy="78"
      r="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      opacity="0.7"
    />
  );
  return <BoardFrame>{items}</BoardFrame>;
}

/** Two-Dice Pig: a pair of dice with a red pip on one. */
function TwoDicePigPreview(): JSX.Element {
  const die = (x: number, y: number, pips: number, red?: boolean): JSX.Element[] => {
    const out: JSX.Element[] = [
      <rect
        key={'d' + x}
        x={x}
        y={y}
        width="52"
        height="52"
        rx="10"
        fill="currentColor"
        opacity="0.16"
      />,
    ];
    const faces: Record<number, number[][]> = {
      1: [[26, 26]],
      2: [
        [15, 15],
        [37, 37],
      ],
      3: [
        [15, 15],
        [26, 26],
        [37, 37],
      ],
      5: [
        [15, 15],
        [37, 15],
        [26, 26],
        [15, 37],
        [37, 37],
      ],
      6: [
        [15, 15],
        [37, 15],
        [15, 26],
        [37, 26],
        [15, 37],
        [37, 37],
      ],
    };
    (faces[pips] ?? []).forEach((pt, i) => {
      const dx = pt[0] ?? 0;
      const dy = pt[1] ?? 0;
      out.push(
        <circle
          key={'p' + x + i}
          cx={x + dx}
          cy={y + dy}
          r="5"
          fill="currentColor"
          opacity={red ? 0.9 : 0.75}
        />
      );
    });
    return out;
  };
  return (
    <BoardFrame>
      {die(84, 55, 5)}
      {die(158, 65, 1, true)}
    </BoardFrame>
  );
}

/** Streak Race: a rising card with up/down arrows. */
function StreakRacePreview(): JSX.Element {
  return (
    <BoardFrame>
      <rect x={106} y={34} width="88" height="120" rx="12" fill="currentColor" opacity="0.16" />
      <rect x={118} y={52} width="64" height="84" rx="8" fill="currentColor" opacity="0.3" />
      <polygon
        points="150,86 166,104 158,104 158,116 142,116 142,104 134,104"
        fill="currentColor"
        opacity="0.85"
      />
      <polygon
        points="240,120 224,102 232,102 232,90 248,90 248,102 256,102"
        fill="currentColor"
        opacity="0.45"
      />
    </BoardFrame>
  );
}

/** Quad-Nim: a row of sticks with one red one left. */
function QuadNimPreview(): JSX.Element {
  const items: JSX.Element[] = [];
  for (let i = 0; i < 9; i++) {
    items.push(
      <rect
        key={i}
        x={72 + i * 15}
        y={54}
        width="9"
        height="76"
        rx="4"
        fill="currentColor"
        opacity={i === 8 ? 0.9 : 0.5}
      />
    );
  }
  return <BoardFrame>{items}</BoardFrame>;
}

/** Farkle: a spread of dice, one ringed. */
function FarklePreview(): JSX.Element {
  const items: JSX.Element[] = [];
  const xs = [66, 112, 158, 204];
  xs.forEach((x, i) => {
    items.push(
      <rect
        key={i}
        x={x}
        y={64 + (i % 2) * 12}
        width="40"
        height="40"
        rx="9"
        fill="currentColor"
        opacity={i === 1 ? 0.85 : 0.3}
      />
    );
    for (let d = 0; d < 3; d++) {
      items.push(
        <circle
          key={i + '-' + d}
          cx={x + 12 + d * 8}
          cy={84 + (i % 2) * 12}
          r="3.4"
          fill="currentColor"
          opacity={i === 1 ? 0.4 : 0.7}
        />
      );
    }
  });
  items.push(
    <rect
      key="ring"
      x={108}
      y={60 + 12}
      width="48"
      height="48"
      rx="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      opacity="0.85"
    />
  );
  return <BoardFrame>{items}</BoardFrame>;
}

/** Row Prison: one lit row of stones. */
function RowPrisonPreview(): JSX.Element {
  const items: JSX.Element[] = [];
  for (let i = 0; i < 9; i++) {
    items.push(
      <rect
        key={i}
        x={54 + i * 22}
        y={64}
        width="17"
        height="17"
        rx="4"
        fill="currentColor"
        opacity="0.12"
      />
    );
  }
  for (let i = 2; i < 6; i++) {
    items.push(
      <circle
        key={'s' + i}
        cx={62.5 + i * 22}
        cy={72.5}
        r="6.4"
        fill="currentColor"
        opacity={i % 2 ? 0.85 : 0.45}
      />
    );
  }
  items.push(
    <rect
      key="row"
      x={52}
      y={62}
      width="199"
      height="21"
      rx="5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      opacity="0.55"
    />
  );
  return <BoardFrame>{items}</BoardFrame>;
}

/** Trinity Hex: a small hexagon with two tinted sides chained. */
function TrinityHexPreview(): JSX.Element {
  const items: JSX.Element[] = [];
  const pts: Array<[number, number]> = [];
  for (let q = -2; q <= 2; q++) {
    for (let r = -2; r <= 2; r++) {
      if (Math.abs(q + r) <= 2) {
        pts.push([150 + Math.sqrt(3) * 22 * (q + r / 2), 100 + 1.5 * 22 * r]);
      }
    }
  }
  pts.forEach(([x, y], i) => {
    const edge = Math.hypot(y - 100) > 55;
    items.push(
      <circle
        key={i}
        cx={x}
        cy={y}
        r={edge ? 8 : 5.5}
        fill="currentColor"
        opacity={edge ? 0.5 : 0.14}
      />
    );
  });
  items.push(
    <path
      d="M150 34 L150 56 L166 64"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
      opacity="0.8"
    />
  );
  items.push(<circle cx={166} cy={64} r="7" fill="currentColor" opacity="0.85" />);
  items.push(<circle cx={150} cy={38} r="7" fill="currentColor" opacity="0.85" />);
  return <BoardFrame>{items}</BoardFrame>;
}

/** Morris: nested squares with stones. */
function MorrisPreview(): JSX.Element {
  const items: JSX.Element[] = [];
  const lo = 70;
  const hi = 230;
  items.push(
    <rect
      key="a"
      x={lo}
      y={lo}
      width={hi - lo}
      height={hi - lo}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      opacity="0.5"
    />
  );
  items.push(
    <rect
      key="b"
      x={110}
      y={110}
      width={80}
      height={80}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      opacity="0.5"
    />
  );
  items.push(
    <rect
      key="c"
      x={145}
      y={145}
      width={10}
      height={10}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      opacity="0.5"
    />
  );
  const stone = (x: number, y: number, o: number, k: string): JSX.Element => (
    <circle key={k} cx={x} cy={y} r="7" fill="currentColor" opacity={o} />
  );
  items.push(stone(150, lo, 0.85, 's1'));
  items.push(stone(190, lo, 0.85, 's2'));
  items.push(stone(230, 150, 0.85, 's3'));
  items.push(stone(150, 190, 0.5, 's4'));
  items.push(stone(110, 150, 0.5, 's5'));
  items.push(stone(150, 110, 0.35, 's6'));
  return <BoardFrame>{items}</BoardFrame>;
}

/** Abalone: clusters of marbles with a shove arrow. */
function AbalonePreview(): JSX.Element {
  const items: JSX.Element[] = [];
  const pts: Array<[number, number]> = [];
  for (let q = -1; q <= 1; q++) {
    for (let r = -1; r <= 1; r++) {
      if (Math.abs(q + r) <= 1)
        pts.push([150 + Math.sqrt(3) * 34 * (q + r / 2), 100 + 1.5 * 34 * r]);
    }
  }
  pts.forEach(([x, y], i) => {
    items.push(<circle key={i} cx={x} cy={y} r="16" fill="currentColor" opacity="0.1" />);
  });
  items.push(<circle cx={104} cy={82} r="13" fill="currentColor" opacity="0.8" />);
  items.push(<circle cx={104} cy={134} r="13" fill="currentColor" opacity="0.8" />);
  items.push(<circle cx={150} cy={172} r="13" fill="currentColor" opacity="0.42" />);
  items.push(<circle cx={196} cy={82} r="13" fill="currentColor" opacity="0.42" />);
  items.push(<path d="M126 82 L152 82" stroke="currentColor" strokeWidth="3.5" opacity="0.85" />);
  items.push(<polygon points="162,82 150,76 150,88" fill="currentColor" opacity="0.85" />);
  return <BoardFrame>{items}</BoardFrame>;
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

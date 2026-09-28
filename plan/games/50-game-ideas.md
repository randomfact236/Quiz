# 50 Game Ideas — the addictive-games universe for PigZap

> Research pass 2026-09-28. Sorted by fit with the empty-board family
> (AGENTS.md: nothing pre-filled, every move a player makes). Games 1–7 are
> already built or planned; 8–43 are new and fit the duel backend + AI
> template directly; 41–50 add the luck element the engagement science says
> drives the "one more round" loop.

## Why these hooks work (the research, in four lines)

- **Variable-ratio reinforcement** (Skinner): unpredictable rewards drive more
  repeat behaviour than fixed ones — the engine behind roguelikes, loot boxes
  and dice games. Luck games with short rounds exploit exactly this loop.
- **Fast restart + uncertain payoff** = the "just one more" loop. Every game
  here rounds in 1–5 minutes with an instant rematch.
- **The abstract-strategy canon** (BoardGameGeek consensus: Hive, Onitama,
  Quoridor, Santorini, Azul, Quarto) = "maximum strategy, minimum rules" —
  five-minute teach, deep replay.
- **Mobile-proven demand**: Ludo King, Yalla Ludo and Carrom Pool's millions
  of installs prove the phone-to-phone friend-duel market this family serves.

## A. The family queue (in flight)

| #   | Game                | Status     | The hook                                     | Build |
| --- | ------------------- | ---------- | -------------------------------------------- | ----- |
| 1   | Connect Four        | ✅ built   | Drop, block, connect four — the gateway duel | done  |
| 2   | Gomoku              | 📋 planned | Five in a row; ttt that never draws          | ~10 h |
| 3   | Dots & Boxes        | 📋 planned | Chain sacrifices decide the endgame          | ~13 h |
| 4   | Battleship Lite     | 📋 planned | Hidden info + you place your own ships       | ~14 h |
| 5   | Pig Dice            | 📋 planned | Push-your-luck; the server rolls             | ~8 h  |
| 6   | Checkers            | 📋 planned | Forced captures keep it sharp                | ~16 h |
| 7   | Rock Paper Scissors | 📋 planned | 60-second quickfire, blind picks             | ~7 h  |

## B. Perfect fit — new empty-board / player-created games (build after 1–7)

| #   | Game                 | The hook                                                       | Duel | Build |
| --- | -------------------- | -------------------------------------------------------------- | ---- | ----- |
| 8   | Ultimate Tic-Tac-Toe | Your move picks your opponent's board — infinite surprises     | live | S     |
| 9   | Nim                  | Take sticks, dodge the last one; solved math = free perfect AI | live | XS    |
| 10  | Chomp                | Poisoned-cookie grid; eat the poison and you lose              | live | XS    |
| 11  | Hex                  | Connect your two sides; mathematically never draws             | live | S     |
| 12  | Othello / Reversi    | Flip rows; friendly first 20 moves, brutal last 5              | live | M     |
| 13  | Nine Men's Morris    | Form mills, capture pieces — 2,000 years old                   | live | M     |
| 14  | Mancala (Kalah)      | Sowing marbles; extra-turn chains snowball                     | live | S     |
| 15  | Quarto               | SHARED pieces — you hand your opponent their next piece        | live | M     |
| 16  | Quoridor             | Race your pawn, throw walls behind you                         | live | M     |
| 17  | Hive                 | Pocket bug-chess, no board at all                              | live | M     |
| 18  | Onitama              | Chess where the move-cards rotate between players              | live | M     |
| 19  | Santorini            | Climb and dome towers; forced moves create traps               | live | M     |
| 20  | Blokus Duo           | Fit your polyominoes; run out of moves first and lose          | live | M     |
| 21  | Abalone              | Push marbles off the hex ring                                  | live | M     |
| 22  | Pentago              | Connect four — but you spin a quadrant every move              | live | S     |
| 23  | Pente                | Gomoku plus jump-captures; draws almost impossible             | live | S     |
| 24  | Connect6             | Six in a row, two stones per turn — balances first move        | live | S     |
| 25  | Breakthrough         | Pawn race to the far row; 5-minute teach, razor sharp          | live | S     |
| 26  | Lines of Action      | Get all your checkers connected                                | live | M     |
| 27  | Ataxx                | Clone/jump to infect the whole board                           | live | S     |
| 28  | Domineering          | You place vertical dominoes, they place horizontal             | live | XS    |
| 29  | SOS                  | Form SOS on a grid — you may complete YOUR line or THEIRS      | live | XS    |
| 30  | Sim                  | Draw lines between six dots; your triangle = your loss         | live | XS    |
| 31  | Sprouts              | Conway's spot game; surprisingly deep for two rules            | live | S     |
| 32  | Paper Soccer         | Bounce the ball across the pencil grid into the goal           | live | S     |
| 33  | Three Men's Morris   | The 2,000-year-old ancestor of tic-tac-toe                     | live | XS    |
| 34  | Mastermind           | Your FRIEND sets the hidden code — player-created data         | live | S     |
| 35  | Hangman Duel         | Your friend picks the word — no word lists needed              | live | S     |
| 36  | Bulls & Cows         | Numeric mastermind with digits                                 | live | XS    |
| 37  | Notakto              | Three boards, BOTH players place X — four in a row loses       | live | XS    |
| 38  | Word Duel            | Your friend picks the secret word, Wordle rules                | live | S     |
| 39  | 9×9 Go               | The deepest game ever played; territory scoring, tiny board    | live | L     |
| 40  | Chess                | The final boss — build last, it's a project                    | live | L     |

## C. Luck + decisions (the variable-reward tier — the science tier)

Luck is the addiction multiplier: unpredictable payoffs + instant rematch =
the loop the research describes. These keep beginners winning against
stronger friends, which is what makes duels come back.

| #   | Game             | The hook                                                      | Duel | Build |
| --- | ---------------- | ------------------------------------------------------------- | ---- | ----- |
| 41  | Backgammon       | Dice + racing + combat; the 5,000-year luck-skill masterpiece | live | L     |
| 42  | Ludo             | The phone-party giant (Ludo King's installs prove it)         | live | M     |
| 43  | Dominoes (Block) | Tile matching + endgame counting                              | live | M     |
| 44  | Memory Flip      | Random card grid — pure focus duel                            | live | S     |
| 45  | Crazy Eights     | Shed your cards; eights are wild                              | live | M     |
| 46  | Two-Dice Pig     | Pig's bigger brother — doubles double the pot                 | live | XS    |
| 47  | Higher or Lower  | Guess the next card; streak-chasing tension                   | live | XS    |
| 48  | Blackjack Lite   | Hit or stand against the deck                                 | live | M     |
| 49  | Liar's Dice      | Hidden dice + bluffing                                        | live | M     |
| 50  | Yatzy Lite       | Five dice, three rolls, scorecard race                        | live | M     |

## Deliberately excluded (popular but off-philosophy)

2048, Minesweeper, Stack tower, Whack-a-Mole, air hockey, carrom, Wordle
against a computer-chosen word, anything with authored levels or served
content — the 2026-09-28 empty-board decision rules them out (the friend
supplies the content: Battleship fleets, Mastermind codes, Hangman words).

## Sources

- [Family Addiction Specialist — variable-ratio reinforcement](https://www.familyaddictionspecialist.com)
- [SimplyPsychology — loot boxes and reward schedules](https://www.simplypsychology.com)
- [Medium — the "just one more" loop and uncertain rewards](https://medium.com/@baiwei.chu/stop-fighting-your-phone-addiction-with-willpower-9be4f91fdf9a)
- [Andrew Chen — variable-ratio schedules in product/game design](https://andrewchen.com)
- [Paired.games — best 2-player abstract strategy games](https://paired.games)
- [BoardGameGeek — community abstract-strategy canon](https://boardgamegeek.com)

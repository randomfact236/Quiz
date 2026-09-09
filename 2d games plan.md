# 2D Games Plan

## 1. "Tap or Don't Tap" — Solo Version

This is based on a real psychology test called **Go/No-Go** (measures self-control) — that's why it feels so addictive. The game tricks your reflexes against themselves.

### How it works

```
1. Screen goes dark... random 1–3 second wait (you can't predict!)
2. A signal flashes:  🟢 GREEN  or  🔴 RED
3. GREEN  → TAP as fast as you can! ⚡
   RED    → DON'T tap. Resist the urge. ✋
4. Score → next round, faster
```

**Lives:** 3 hearts

- Tap on RED → lose a heart ❌
- Miss a GREEN (too slow) → lose a heart ❌
- Survive RED without tapping → ✅ +points

### The addiction loop

| Mechanic                                          | Why it hooks                                         |
| ------------------------------------------------- | ---------------------------------------------------- |
| **Shows your reaction time**: "218ms! 🔥"         | A personal number to beat — like a sprint time       |
| **Speed ramp** — signal window shrinks each round | Round 20 feels genuinely intense                     |
| **Random wait** — sometimes 0.5s, sometimes 3s    | Punishes players who rhythm-tap early → false starts |
| **Streak multiplier**                             | Missing one green after a 15 streak hurts 😩         |

### Progressive twists (add one per level to keep it fresh)

1. **Level 1:** just green/red
2. **Level 2:** decoy colors appear (yellow, blue) — _only green means tap_
3. **Level 3: THE TRAP** 😈 — the word "TAP" appears but written in **red** color... or "WAIT" written in **green**. Rule: **follow the color, ignore the word**. Your brain will betray you. Everyone fails here. Everyone retries.
4. **Rule flip event:** mid-game banner "🔄 RULES SWAPPED!" — now red = tap, green = don't

### End screen (shareability, no device sharing needed)

```
┌──────────────────────────┐
│   🚦 GAME OVER            │
│   Score: 1,240            │
│   Best reaction: 187ms 🔥 │
│   Top 12% of players      │
│   [📤 Share my score]     │
└──────────────────────────┘
```

Players individually share their **millisecond score** — that's the viral number. "I got 187ms, can you beat that?" works even between people playing separately.

---

## 2. Tic Tac Toe

Classic two-player game implemented for web.

### Features

- Two-player mode (local)
- Win/draw detection
- Score tracking
- Responsive design for mobile

---

## 3. Sliding Puzzle

Classic 15-puzzle style game where players slide tiles into the correct order.

### Features

- 4x4 grid with 15 numbered tiles
- Move counter
- Timer
- Shuffle/restart functionality
- Win detection

---

## 4. Word Puzzle (with highlighting)

Word-based puzzle game with visual highlighting mechanics.

### Features

- Word finding/matching gameplay
- Visual highlighting for correct/incorrect answers
- Score tracking
- Progressive difficulty

---

## 5. Continuous Running Game (with hurdles)

Endless runner style game with obstacle/hurdle mechanics.

### Features

- Continuous scrolling environment
- Jump/dodge mechanics for hurdles
- Progressive speed increase
- Score based on distance/survival
- Game over on collision

---

## 6. Flying Snake (Flappy Bird style)

Side-scrolling flying game inspired by Flappy Bird.

### Features

- Tap/click to flap and gain altitude
- Obstacles (pipes/gaps) to navigate through
- Score based on obstacles passed
- Progressive difficulty
- Game over on collision

---

## 7. Spirit Runner

**Genre:** Endless running game with light puzzle elements
**Theme:** A mystical forest where spirits guide the player

### Core Loop

- Player controls a character running through shifting forest paths.
- Obstacles include fallen logs, magical traps, and spirit guardians.
- Collect glowing orbs to unlock temporary powers (double jump, dash, slow time).

### Unique Twist

- Paths occasionally split into puzzles — choose the correct rune-marked gate to continue.
- Wrong choice sends the player into a "shadow realm" with harder obstacles but higher rewards.

### Progression

- Levels get faster and more complex.
- Unlock new characters (forest spirit, hunter, monk) with different abilities.

### Visual Style

- Hand-drawn 2D art with glowing effects.
- Calm background music that intensifies as speed increases.

This balances simplicity (easy to pick up) with depth (choices, upgrades, alternate paths).

---

## Summary

| #   | Game              | Complexity  | Estimated Time |
| --- | ----------------- | ----------- | -------------- |
| 1   | Tap or Don't Tap  | ⭐ Low      | 1–2 days       |
| 2   | Tic Tac Toe       | ⭐ Low      | 1 day          |
| 3   | Sliding Puzzle    | ⭐⭐ Medium | 1–2 days       |
| 4   | Word Puzzle       | ⭐⭐ Medium | 2–3 days       |
| 5   | Continuous Runner | ⭐⭐ Medium | 2–3 days       |
| 6   | Flying Snake      | ⭐⭐ Medium | 1–2 days       |
| 7   | Spirit Runner     | ⭐⭐⭐ High | 5–7 days       |

All games should be built with:

- Plain HTML/CSS/JS (no frameworks required)
- Mobile-ready responsive design
- Score tracking and shareability features

# PigZap Share Design System — Analysis & Implementation Report

> **Status:** ✅ FINALIZED — owner-approved 2026-09-19.
> **Purpose:** single implementation-ready spec for ALL share surfaces. Any thread can pick up a
> work package (§5) from this report alone; visual mockups live alongside it in `designs/`.
> **Visual references:** `designs/share-design-system-final.html` (consolidated system),
> `designs/share-design-content-items.html` (real-content mockups),
> `designs/share-design-question-result.html`, `designs/share-preview-configuration.html`.

---

## 1. Scope & principle

Every shareable surface gets **one master image (1200×630)** auto-generated from a family template
— brand gradient + item emoji + item title, with all meaningful content inside the central square
**SAFE ZONE (~630×630)** — so each platform's crop (Facebook/LinkedIn 1.91:1 · X 2:1 · WhatsApp
near-square thumb) survives without cutting anything. Platform display realities drive the text spec:

| Platform | Image crop | Title  | Description        | Share message         | Consequence                               |
| -------- | ---------- | ------ | ------------------ | --------------------- | ----------------------------------------- |
| FB / LI  | 1.91:1     | shown  | shown (≤110 chars) | as caption            | title + description carry weight          |
| X        | 2:1        | shown  | **hidden**         | in tweet text         | hook must live in image/title             |
| WhatsApp | ~square    | hidden | hidden             | **the readable text** | only SAFE ZONE legible; message = content |

Text limits: **title ≤ 60 chars, description ≤ 110** (graceful truncation acceptable). The share
message carries the personal line + link. **Home page (`opengraph-image.tsx`) is LIVE — do not touch.**

## 2. Design tokens

| Family            | Gradient                                          | Emoji style   |
| ----------------- | ------------------------------------------------- | ------------- |
| Quiz (products)   | `#A5A3E4 → #BF7076` (brand)                       | subject emoji |
| Riddle (products) | `#2dd4bf → #0369a1` (teal)                        | 🧩 + category |
| Joke (products)   | `#fbbf24 → #f97316` (amber)                       | 😂            |
| Games (tools)     | per-game accent (e.g. Hurdle `#84cc16 → #16a34a`) | game emoji    |

Options inside question images: 2-col grid (mirrors `AnswerOptions.tsx`: 2 opts → 1×2 · 3 → row ·
4 → 2×2 · open-ended → none). Letter chips A/B/C/D. **Correct option is never marked.**

## 3. The 10 finalized configurations

Status legend: **LIVE** = shipped · **DESIGNED** = spec final, awaiting build · **WAITING** = blocked on another surface.

| #   | Surface               | Status     | Image (safe zone)                                    | Title ≤ 60                                     | Description ≤ 110     | URL                                |
| --- | --------------------- | ---------- | ---------------------------------------------------- | ---------------------------------------------- | --------------------- | ---------------------------------- |
| 1   | Website / Home        | LIVE       | logo + site name (existing)                          | PigZap site name                               | site description      | `pigzap.com`                       |
| 2   | Quiz — subject        | DESIGNED   | subject emoji + “\<Subject> Quiz — N Questions”      | “\<Subject> Quiz — N Questions”                | site-style line       | `/quiz-mcq?subject=<slug>`         |
| 3   | Quiz — question       | DESIGNED   | real question + its options (per-type grid) + Q chip | “Can you answer this? 🧠 \<Subject> Quiz”      | question text         | `/quiz-mcq?subject=<slug>`         |
| 4   | Quiz — result         | DESIGNED\* | big **8/10** score badge + subject emoji             | “I scored 8/10 on \<Subject> — beat you! 🧠”   | site-style line       | `/quiz-mcq?subject=<slug>`         |
| 5   | Riddle — category     | DESIGNED   | 🧩 + “Riddles · \<Category>”                         | “Riddles · \<Category> — brain teasers”        | riddle challenge line | `/riddle-mcq?category=<slug>`      |
| 6   | Riddle — question     | DESIGNED   | real riddle text + options (2/3/4/open) + R chip     | “Can you solve this riddle? 🧩 \<Category>”    | riddle text           | `/riddle-mcq?category=<slug>`      |
| 7   | Riddle — result       | WAITING    | big **7/10** + 🧩 + “Riddles”                        | “I solved 7/10 riddles — beat that! 🧩”        | riddle challenge line | `/riddle-mcq`                      |
| 8   | Image riddle          | DESIGNED   | **the riddle's own photo** (subject centred)         | “Can you solve this image riddle: "\<title>"?” | short teaser          | `/image-riddles`                   |
| 9   | Dad joke              | LIVE\*     | 😂 + “Dad Jokes” template                            | setup (truncated)                              | “setup — punchline”   | `/jokes`                           |
| 10  | Games — hub + in-game | LIVE\*     | per-game accent + game emoji + name (+ score line)   | hub: “🎮 \<Game> on PigZap — \<blurb>”         | game blurb            | `/games/<slug>` · `/games/<slug>/` |

\* LIVE already as ShareMenu text payloads; the image-template part is the upgrade to build.
WhatsApp message spec (types 3, 6, 10): question/riddle/result line + compact options (A) … B) …)

- link. Answer visibility rule: **quiz/riddle question shares NEVER include the answer; dad jokes
  ALWAYS include the punchline; image riddles are photo-only open guesses.**

## 4. Consistency rules (binding)

1. One master image per item; only emoji/title/score injected — never bespoke artwork.
2. All content inside the SAFE ZONE; gradient bleeds full 1200×630.
3. Correct option never highlighted; answer never leaves the site (jokes exempt).
4. Option grid mirrors the site's `AnswerOptions` layout exactly (feed = game).
5. URLs always point at durable surfaces (subject/category/game), never rotting session links.
6. Static games stay dependency-free; **bump `?v=N` asset versions whenever editing `public/games/**`**
(prod caches `/games` 4 h; versioned URLs prevent old-HTML + new-JS crashes).
7. Dads-jokes Save target stays; result/game shares have no Save.

## 5. Work packages (for implementation threads)

- **WP0 — Home share upgrade (supersedes the earlier "do not touch"):** keep the dynamic
  `opengraph-image.tsx` mechanism, upgrade its template to the owner-approved design:
  canvas 1200×630, gradient `135deg #A5A3E4 → #8f7fd8(45%) → #BF7076`; centered stack =
  pig icon 112×112 + wordmark `siteName` 96px/900 + tagline "Quizzes · Riddles ·
  Dad Jokes · Image Puzzles · Games" 30px/700 + DYNAMIC stats line "11,541 questions · 3,000 riddles · 1,013 jokes ·
  1,906 image puzzles · 8 games" (numbers 19px/900, labels 17px/600 — bound to LIVE DB counts, revalidate
  ≤ 15 min, count baked into the image URL so platforms refetch after content pushes) + domain
  pill "PIGZAP.COM" (24px/800, pill bg `rgba(17,20,56,.5)`, border 1.5px `rgba(255,255,255,.55)`); decorative bleed emojis 🧠🧩😂🖼️ at opacity .12–.16
  outside the safe zone. Dynamic bindings: `siteName` + `description` from SEO settings;
  pillars/domain static. Embed the icon for next/og (inline/data-URL). Reference render:
  `designs/og-website-1200x630.png`; full metadata set in `designs/og-website-share-demo.html`.
- **WP1 — Products OG image generator** (quiz subject/question/result · riddle category/question/result · joke):
  extend the `next/og` pattern of `apps/frontend/src/app/opengraph-image.tsx` into a parameterised
  generator (family gradient + emoji + title/score/options grid). Wire per-surface `openGraph`/`twitter`
  meta on `/quiz-mcq`, `/riddle-mcq`, `/jokes`. Acceptance: every share type renders per §3 at 1200×630,
  safe-zone intact.
- **WP2 — Tools OG image generator** (games hub + in-game): same pattern, per-game accent map; feed
  `GameShareButton` (`components/games/GameShareButton.tsx`) and in-game bars' share targets.
- **WP3 — Share-count events (BUG-048)**: fire a counted event when a share target is chosen (both
  `ShareMenu` and in-game bars); public aggregate endpoints for like/comment/share counts + count chips
  in the question UI. (Likes/comments persistence bugs BUG-045/046 land first.)
- **WP4 — Riddle results screen** (unlocks #7 + riddle question share placement): then wire #6/#7.
- **WP5 — Answer-reveal share (optional, owner may call later)**: review-screen variant sharing question +
  answer as a fact-share. Not in v1 scope.

## 6. Reference implementations already in the codebase

- `components/share/ShareMenu.tsx` — the 4/6-target share modal (FB, X, WhatsApp, LinkedIn, Copy, optional Save).
- `components/games/GameShareButton.tsx` — hub-card share island.
- `components/quiz-mcq/AnswerOptions.tsx` — the option grid the share images must mirror (lines 135–141).
- `apps/frontend/src/app/opengraph-image.tsx` — the OG generation pattern to extend.
- Static in-game bars — `public/games/*/index.html` + `main|game.js` (`shareUrls()` / `copyResult()`), ?v= bumped.

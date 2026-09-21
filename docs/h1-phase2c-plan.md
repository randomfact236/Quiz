# H1 phase 2c — implementation spec (frontend switch + strip)

Status: **not started.** Everything before it is shipped and live:

- phase 1: public quiz list endpoints stripped of the answer key
- phase 2a/2b: `POST /quiz-mcq/answers/check`, `/riddle-mcq/answers/check`,
  `/image-riddles/answers/check` (public, throttled 120/min, live-verified)
- phase 2c prep: `checkQuizAnswer` / `checkRiddleAnswer` / `checkImageRiddleGuess`
  frontend clients

This step changes the live game loop, so do it in one pass with a browser check
of each game (answer right, answer wrong, review screen, resume) and deploy only
after all three games pass.

## 1. Frontend switch (do first; behaviour-compatible while the fields still exist)

**Quiz** — `hooks/useQuizMcq` + `components/quiz-mcq/QuestionCard.tsx` + `quiz-mcq/results/*` + `QuestionReview.tsx`

- On answer submit: `await checkQuizAnswer(question.id, answer)` and store the
  returned `{ correct, correctAnswer, correctLetter }` in the session state next
  to `answers` (e.g. `revealed: Record<questionId, AnswerCheckResult>`).
- `QuestionCard` feedback and `QuestionReview`/results must read the correct
  answer from `revealed[...]` (fallback to the question object only if present).
- Keep `lib/quiz-mcq-scoring.ts` for the local fallback path until the strip lands.

**Riddle** — `app/riddle-mcq/play/page.tsx` + `components/RiddleCard.tsx` + `RiddleReview.tsx`

- Same pattern with `checkRiddleAnswer`; open-ended (`expert`/`extreme`) is
  already normalised identically on both sides.

**Image riddle** — `features/image-riddles/hooks/useImageRiddleGame.ts` + `lib/game.ts` + `components/RiddleGuessPanel.tsx`

- Replace the local `isImageRiddleAnswerCorrect(...)` call with
  `checkImageRiddleGuess(riddle.id, guess)`; use the returned `answer` for the
  reveal.
- The "N letters" hint currently uses `countAnswerLetters(answer)`. After the
  strip it must come from a server-supplied count (see `answerLetters` below).

## 2. Backend strip (only after the switch is live and verified)

- `GET /quiz-mcq/subjects/:slug/questions/random`, `/mixed`, `/random/:level`,
  `GET /riddle-mcq/mixed`, `/random/:level`, `/subjects/:subjectId/riddles`,
  `GET /riddle-mcq/riddles/:id`: project through a public DTO that omits
  `correctAnswer`, `correctLetter` (quiz) / `correctLetter`, `answer` (riddle).
- `GET /image-riddles/random`, `/search`, `/:id`: drop `answer` and
  `alternativeAnswers`; add `answerLetters: number` (alphanumeric count, mirrors
  `countAnswerLetters`) so the hint chip keeps working.
- `GET /quiz-mcq/questions/:id/share` (OG) already exposes only the question text.

## 3. Verification checklist

- [ ] quiz: correct answer -> green feedback; wrong -> red; review shows the key
- [ ] riddle: same, incl. an open-ended (`expert`) riddle
- [ ] image riddle: correct/incorrect guess; hint chip still shows "N letters"
- [ ] resume a saved session (quiz) after a refresh — review still renders the key
- [ ] `npm run type-check`, `npm run test`, `npm run check:theme`, prod build
- [ ] live smoke: fetch a random question/riddle/image-riddle, confirm the answer
      fields are gone; `POST .../answers/check` still grades correctly

## 4. Rolling back

Each side is independently revertable: re-adding the fields to the read
projections restores the old client-side grading instantly (the clients keep a
local-scoring fallback until step 1 is fully wired).

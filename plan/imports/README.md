# Sample Import Files — Quiz MCQ / Riddle MCQ / Dad Jokes

Ready-to-import content files, matching the exact formats each importer
expects (verified against the parsers in `apps/frontend/src/app/admin/utils/`,
`apps/frontend/src/features/riddle-mcq/modals/csv-parser.ts` and
`apps/frontend/src/app/admin/utils/index.ts`). Each file carries 20+ items.

## Quiz MCQ — "Space & Astronomy" (24 questions, 3 chapters)

- **UI:** Admin → Quiz MCQ → Import → upload `quiz-mcq-space-astronomy.csv`.
  The file must start with `# Subject: <Name>`; header row is
  `ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter`.
- **Level option-count rules:** easy/medium = 2 options (easy is TRUE/FALSE),
  hard = 3, expert = 4, extreme = open answer in "Correct Answer".
- **API:** `POST /api/v1/quiz-mcq/questions/bulk` with
  `quiz-mcq-space-astronomy.json` (`{ subjectName, questions[] }`; chapters
  auto-created; `status: "published"`).
- CSV-imported questions land as **DRAFT** → publish via Admin → Quiz MCQ →
  select rows → Bulk action → Publish.

## Riddle MCQ — "Lateral Thinking" (20 riddles)

- **UI:** Admin → Riddle MCQ → Import → upload `riddle-mcq-lateral-thinking.csv`.
  Format: optional `# Category: <Name>` line, then lowercase-friendly headers
  (`question,optiona,optionb,optionc,optiond,answer,level,subject,hint,explanation,status`).
  `answer` may be `A. <text>` (letter + text) or raw text (expert free-text).
- **API:** `POST /api/v1/riddle-mcq/riddles/bulk` with
  `riddle-mcq-lateral-thinking.json` (bare array; category/subject auto-created).
- CSV rows include `status: published`; the JSON file also sets it. The riddle
  bulk API DTO has **no hint field** — but this CSV's hint column is parsed by
  the UI importer, so hints land when importing via the modal.

## Dad Jokes — "Food / Animals / Tech" (20 jokes)

- **UI:** Admin → Dad Jokes → Import → upload
  `dad-jokes-food-and-animals.csv`. Format: header row then
  `ID,Setup,Punchline,Category` (categories auto-resolved/created).
- **Note:** imported jokes land as **DRAFT** → publish via Admin → Dad Jokes →
  Bulk action → Publish. (The jokes bulk API requires a pre-existing
  `categoryId` UUID, so the CSV/UI path is the convenient one.)

## Content licensing

All sample content in this folder was written for this project — no external
sources. Free to publish on any environment.

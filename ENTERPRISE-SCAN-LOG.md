# Enterprise Quality Gate - Scan Log

**Started:** 2026-02-15T17:44:28.451Z  
**Completed:** 2026-02-15T17:44:38.848Z  
**Target Score:** 10/10  
**Final Score:** 0/10  
**Target Achieved:** ❌ NO  
**Total Iterations:** 3

---

## Issue Summary

### By Severity
- 🔴 Critical: 0
- 🟠 High: 91
- 🟡 Medium: 73
- 🔵 Low: 162

---

## Detailed Issues

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\Footer.tsx:35`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{footerLinks.product.map((link) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\Footer.tsx:53`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{footerLinks.company.map((link) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\components\Footer.tsx:14`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'Footer' is 61 lines (max: 50)

**Code:**
```typescript
export default function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();


```

**Suggested Fix:** Refactor into smaller functions

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\Header.tsx:41`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{navLinks.map((link) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\Header.tsx:96`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{navLinks.map((link) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\components\Header.tsx:18`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'Header' is 104 lines (max: 50)

**Code:**
```typescript
export default function Header(): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(fals
```

**Suggested Fix:** Refactor into smaller functions

---

### require-return-type

- **Severity:** low
- **Category:** type-safety
- **File:** `apps\frontend\src\components\MobileFooter.tsx:66`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'MobileFooter' missing explicit return type

**Code:**
```typescript
export default function MobileFooter() {
    const [activeDrawer, setActiveDrawer] = useState<Drawe
```

**Suggested Fix:** Add explicit return type annotation

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\MobileFooter.tsx:125`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
QUIZ_SUBJECTS.map((subject) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\MobileFooter.tsx:141`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
JOKE_CATEGORIES.map((cat) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\MobileFooter.tsx:157`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
RIDDLE_CHAPTERS.map((chapter) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\MobileFooter.tsx:172`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
IMAGE_RIDDLE_LEVELS.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\MobileFooter.tsx:118`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const VALUE = 20

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\MobileFooter.tsx:200`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 24 should be a named constant

**Code:**
```typescript
24
```

**Suggested Fix:** Define constant: const VALUE = 24

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\MobileFooter.tsx:213`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 24 should be a named constant

**Code:**
```typescript
24
```

**Suggested Fix:** Define constant: const VALUE = 24

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\MobileFooter.tsx:226`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 24 should be a named constant

**Code:**
```typescript
24
```

**Suggested Fix:** Define constant: const VALUE = 24

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\MobileFooter.tsx:239`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 24 should be a named constant

**Code:**
```typescript
24
```

**Suggested Fix:** Define constant: const VALUE = 24

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\MobileFooter.tsx:252`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 24 should be a named constant

**Code:**
```typescript
24
```

**Suggested Fix:** Define constant: const VALUE = 24

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\components\MobileFooter.tsx:66`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'MobileFooter' is 197 lines (max: 50)

**Code:**
```typescript
export default function MobileFooter() {
    const [activeDrawer, setActiveDrawer] = useState<Drawe
```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\contexts\ThemeContext.tsx:30`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'ThemeProvider' is 107 lines (max: 50)

**Code:**
```typescript
export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [
```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\hooks\useBulkActions.ts:77`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'useBulkActions' is 118 lines (max: 50)

**Code:**
```typescript
export function useBulkActions(
  options: UseBulkActionsOptions
): UseBulkActionsReturn {
  cons
```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\hooks\useStatusCounts.ts:73`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'useStatusCounts' is 96 lines (max: 50)

**Code:**
```typescript
export function useStatusCounts(
  options: UseStatusCountsOptions
): UseStatusCountsReturn {
  c
```

**Suggested Fix:** Refactor into smaller functions

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\constants.ts:87`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\constants.ts:99`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\constants.ts:99`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\constants.ts:105`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 24 should be a named constant

**Code:**
```typescript
24
```

**Suggested Fix:** Define constant: const VALUE = 24

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\constants.ts:105`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\constants.ts:105`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:27`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const VALUE = 30

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:28`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 25 should be a named constant

**Code:**
```typescript
25
```

**Suggested Fix:** Define constant: const VALUE = 25

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:29`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const VALUE = 20

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:32`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 15 should be a named constant

**Code:**
```typescript
15
```

**Suggested Fix:** Define constant: const VALUE = 15

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:33`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 40 should be a named constant

**Code:**
```typescript
40
```

**Suggested Fix:** Define constant: const VALUE = 40

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:34`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 12 should be a named constant

**Code:**
```typescript
12
```

**Suggested Fix:** Define constant: const VALUE = 12

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:36`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 18 should be a named constant

**Code:**
```typescript
18
```

**Suggested Fix:** Define constant: const VALUE = 18

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:44`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const VALUE = 20

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:45`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 18 should be a named constant

**Code:**
```typescript
18
```

**Suggested Fix:** Define constant: const VALUE = 18

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:46`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 15 should be a named constant

**Code:**
```typescript
15
```

**Suggested Fix:** Define constant: const VALUE = 15

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:48`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 12 should be a named constant

**Code:**
```typescript
12
```

**Suggested Fix:** Define constant: const VALUE = 12

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:51`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const VALUE = 30

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:59`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 22 should be a named constant

**Code:**
```typescript
22
```

**Suggested Fix:** Define constant: const VALUE = 22

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:60`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const VALUE = 20

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:61`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 18 should be a named constant

**Code:**
```typescript
18
```

**Suggested Fix:** Define constant: const VALUE = 18

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:63`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 14 should be a named constant

**Code:**
```typescript
14
```

**Suggested Fix:** Define constant: const VALUE = 14

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:65`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 35 should be a named constant

**Code:**
```typescript
35
```

**Suggested Fix:** Define constant: const VALUE = 35

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:66`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 16 should be a named constant

**Code:**
```typescript
16
```

**Suggested Fix:** Define constant: const VALUE = 16

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:75`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 25 should be a named constant

**Code:**
```typescript
25
```

**Suggested Fix:** Define constant: const VALUE = 25

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:76`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 22 should be a named constant

**Code:**
```typescript
22
```

**Suggested Fix:** Define constant: const VALUE = 22

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:77`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const VALUE = 20

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:79`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 15 should be a named constant

**Code:**
```typescript
15
```

**Suggested Fix:** Define constant: const VALUE = 15

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:81`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const VALUE = 30

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:82`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 17 should be a named constant

**Code:**
```typescript
17
```

**Suggested Fix:** Define constant: const VALUE = 17

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\mock-content-data.ts:84`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 13 should be a named constant

**Code:**
```typescript
13
```

**Suggested Fix:** Define constant: const VALUE = 13

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\lib\utils.ts:41`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 36 should be a named constant

**Code:**
```typescript
36
```

**Suggested Fix:** Define constant: const VALUE = 36

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\services\status.service.ts:147`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 50 should be a named constant

**Code:**
```typescript
50
```

**Suggested Fix:** Define constant: const VALUE = 50

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\services\status.service.ts:181`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 50 should be a named constant

**Code:**
```typescript
50
```

**Suggested Fix:** Define constant: const VALUE = 50

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\services\status.service.ts:176`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'executeBulkAction' is 62 lines (max: 50)

**Code:**
```typescript
async executeBulkAction(
    endpoint: string,
    action: BulkActionType,
    ids: string[]
  )
```

**Suggested Fix:** Refactor into smaller functions

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\backend\src\admin\image-riddles\admin-image-riddles.controller.ts:61`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const VALUE = 20

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\backend\src\admin\image-riddles\admin-image-riddles.service.ts:262`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
return categories.map((cat) => ({
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\backend\src\admin\image-riddles\admin-image-riddles.service.ts:400`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
const riddlesByCategory = categories.map((cat) => ({
```

**Suggested Fix:** Add key prop with unique identifier

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\backend\src\admin\image-riddles\admin-image-riddles.service.ts:37`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'findAllRiddles' is 56 lines (max: 50)

**Code:**
```typescript
async findAllRiddles(
    page: number,
    limit: number,
    filters: {
      difficulty?: str
```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\backend\src\admin\image-riddles\admin-image-riddles.service.ts:174`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'updateRiddle' is 51 lines (max: 50)

**Code:**
```typescript
async updateRiddle(id: string, dto: UpdateImageRiddleDto): Promise<ImageRiddle> {
    const riddle 
```

**Suggested Fix:** Refactor into smaller functions

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\backend\src\common\constants\app.constants.ts:261`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 150 should be a named constant

**Code:**
```typescript
150
```

**Suggested Fix:** Define constant: const VALUE = 150

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\backend\src\common\constants\app.constants.ts:261`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 1024 should be a named constant

**Code:**
```typescript
1024
```

**Suggested Fix:** Define constant: const VALUE = 1024

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\backend\src\common\constants\app.constants.ts:261`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 1024 should be a named constant

**Code:**
```typescript
1024
```

**Suggested Fix:** Define constant: const VALUE = 1024

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\backend\src\common\constants\app.constants.ts:267`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 150 should be a named constant

**Code:**
```typescript
150
```

**Suggested Fix:** Define constant: const VALUE = 150

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\backend\src\common\constants\app.constants.ts:267`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 1024 should be a named constant

**Code:**
```typescript
1024
```

**Suggested Fix:** Define constant: const VALUE = 1024

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\backend\src\common\constants\app.constants.ts:267`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 1024 should be a named constant

**Code:**
```typescript
1024
```

**Suggested Fix:** Define constant: const VALUE = 1024

---

### max-file-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\backend\src\common\dto\base.dto.ts:1`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** File has 1007 lines (max: 500)

**Code:**
```typescript
Total lines: 1007
```

**Suggested Fix:** Split into multiple files

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\backend\src\common\filters\http-exception.filter.ts:33`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'catch' is 60 lines (max: 50)

**Code:**
```typescript
catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const re
```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\backend\src\common\services\bulk-action.service.ts:42`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'executeBulkAction' is 111 lines (max: 50)

**Code:**
```typescript
async executeBulkAction<T extends IStatusEntity>(
    repository: Repository<T>,
    entityName: s
```

**Suggested Fix:** Refactor into smaller functions

---

### max-file-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\backend\src\image-riddles\entities\image-riddle-action.entity.ts:1`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** File has 597 lines (max: 500)

**Code:**
```typescript
Total lines: 597
```

**Suggested Fix:** Split into multiple files

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\backend\src\image-riddles\entities\image-riddle.entity.ts:329`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
.map((id, index) => ({
```

**Suggested Fix:** Add key prop with unique identifier

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\backend\src\image-riddles\entities\image-riddle.entity.ts:130`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'generateDefaultActionOptions' is 79 lines (max: 50)

**Code:**
```typescript
private generateDefaultActionOptions(): IActionOption[] {
    const actions: IActionOption[] = [];
```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\about\page.tsx:8`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'AboutPage' is 71 lines (max: 50)

**Code:**
```typescript
export default function AboutPage(): JSX.Element {
  return (
    <main id="main-content" classNam
```

**Suggested Fix:** Refactor into smaller functions

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\page.tsx:320`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{quizModuleExpanded && subjects.map((subject) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\page.tsx:681`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{subjects.map((subject) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\page.tsx:877`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
csvContent += '# ' + Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(' | ') + '\n';
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\page.tsx:921`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
failed: validation.errors.map((err, errIndex) => ({
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\page.tsx:1124`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
].map((user) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\page.tsx:1101`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\page.tsx:208`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'AdminPage' is 280 lines (max: 50)

**Code:**
```typescript
export default function AdminPage(): JSX.Element {
  const [activeSection, setActiveSection] = useS
```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\page.tsx:510`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'AddSubjectModal' is 92 lines (max: 50)

**Code:**
```typescript
function AddSubjectModal({ onClose, onAdd, existingSlugs }: {
  onClose: () => void;
  onAdd: (sub
```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\page.tsx:604`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'AddChapterModal' is 57 lines (max: 50)

**Code:**
```typescript
function AddChapterModal({ onClose, onAdd, subjectName }: {
  onClose: () => void;
  onAdd: (chapt
```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\page.tsx:908`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'importFromCSV' is 56 lines (max: 50)

**Code:**
```typescript
function importFromCSV<T extends Record<string, unknown>>(
  csvText: string,
  config: ImportExpo
```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\page.tsx:1085`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'UsersSection' is 71 lines (max: 50)

**Code:**
```typescript
function UsersSection(): JSX.Element {
  return (
    <div>
      <div className="mb-6 flex items
```

**Suggested Fix:** Refactor into smaller functions

---

### max-file-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\page.tsx:1`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** File has 1158 lines (max: 500)

**Code:**
```typescript
Total lines: 1158
```

**Suggested Fix:** Split into multiple files

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:1020`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
gameState={{
```

**Suggested Fix:** Move to useMemo or define outside component

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:284`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{presets.map((preset) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:747`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{(['easy', 'medium', 'hard', 'expert'] as const).map((diff) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:791`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{categories.map((category) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:826`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{filteredRiddles.map((riddle) => {
```

**Suggested Fix:** Add key prop with unique identifier

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:187`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:191`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:192`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:239`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 45 should be a named constant

**Code:**
```typescript
45
```

**Suggested Fix:** Define constant: const VALUE = 45

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:240`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 45 should be a named constant

**Code:**
```typescript
45
```

**Suggested Fix:** Define constant: const VALUE = 45

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:278`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const VALUE = 30

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:278`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:278`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 120 should be a named constant

**Code:**
```typescript
120
```

**Suggested Fix:** Define constant: const VALUE = 120

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:278`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 180 should be a named constant

**Code:**
```typescript
180
```

**Suggested Fix:** Define constant: const VALUE = 180

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:278`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 300 should be a named constant

**Code:**
```typescript
300
```

**Suggested Fix:** Define constant: const VALUE = 300

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:294`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:294`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:468`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:605`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:606`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:637`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:650`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:719`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### require-img-alt

- **Severity:** high
- **Category:** accessibility
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:837`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Image missing alt attribute

**Code:**
```typescript
<img
```

**Suggested Fix:** Add descriptive alt attribute

---

### require-img-alt

- **Severity:** high
- **Category:** accessibility
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:907`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Image missing alt attribute

**Code:**
```typescript
<img
```

**Suggested Fix:** Add descriptive alt attribute

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:299`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:568`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'ImageRiddlesPage' is 512 lines (max: 50)

**Code:**
```typescript
export default function ImageRiddlesPage(): JSX.Element {
  // State Management
  const [riddles] 
```

**Suggested Fix:** Refactor into smaller functions

---

### max-file-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:1`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** File has 1080 lines (max: 500)

**Code:**
```typescript
Total lines: 1080
```

**Suggested Fix:** Split into multiple files

---

### max-cyclomatic-complexity

- **Severity:** high
- **Category:** enterprise
- **File:** `apps\frontend\src\app\image-riddles\page.tsx:568`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'ImageRiddlesPage' has complexity of 17 (max: 15)

**Code:**
```typescript
export default function ImageRiddlesPage(): JSX.Element {
  // State Management
  const [riddles] 
```

**Suggested Fix:** Refactor to reduce branching

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\jokes\page.tsx:70`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{jokeCategories.map((category) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\jokes\page.tsx:101`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{jokes.map((joke) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\jokes\page.tsx:43`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'JokesPage' is 77 lines (max: 50)

**Code:**
```typescript
export default function JokesPage(): JSX.Element {
  const [jokes, setJokes] = useState<Joke[]>([])
```

**Suggested Fix:** Refactor into smaller functions

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\quiz\page.tsx:63`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{subjects.map((subj) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\quiz\page.tsx:150`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{info.chapters.map((chapterName, index) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\quiz\page.tsx:211`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{levels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\quiz\page.tsx:231`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{levels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\quiz\page.tsx:306`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{rows.map((row, rowIndex) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\quiz\page.tsx:310`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{row.map((subject) => {
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\quiz\page.tsx:336`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{levels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\quiz\page.tsx:360`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{levels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\quiz\page.tsx:450`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{rows.map((row, rowIndex) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\quiz\page.tsx:454`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{row.map((subject) => {
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\quiz\page.tsx:480`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{levels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\quiz\page.tsx:504`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{levels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\quiz\page.tsx:81`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'ChapterSelection' is 86 lines (max: 50)

**Code:**
```typescript
function ChapterSelection({ subject }: { subject: string }): JSX.Element {
  const subjectInfo: Rec
```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\quiz\page.tsx:168`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'LevelSelection' is 79 lines (max: 50)

**Code:**
```typescript
function LevelSelection({ subject, chapter }: { subject: string; chapter: string }): JSX.Element {

```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\quiz\page.tsx:248`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'TimerChallengesPage' is 143 lines (max: 50)

**Code:**
```typescript
function TimerChallengesPage(): JSX.Element {
  const [selectedSubject, setSelectedSubject] = useSt
```

**Suggested Fix:** Refactor into smaller functions

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\quiz\page.tsx:392`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'PracticeModePage' is 144 lines (max: 50)

**Code:**
```typescript
function PracticeModePage(): JSX.Element {
  const [selectedSubject, setSelectedSubject] = useState
```

**Suggested Fix:** Refactor into smaller functions

---

### max-file-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\quiz\page.tsx:1`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** File has 544 lines (max: 500)

**Code:**
```typescript
Total lines: 544
```

**Suggested Fix:** Split into multiple files

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\riddles\page.tsx:128`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{ALL_CHAPTERS.map((chapter) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\riddles\page.tsx:172`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{filteredRiddles.map((riddle) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\riddles\page.tsx:196`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 65 should be a named constant

**Code:**
```typescript
65
```

**Suggested Fix:** Define constant: const VALUE = 65

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\riddles\page.tsx:42`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'RiddlesPage' is 170 lines (max: 50)

**Code:**
```typescript
export default function RiddlesPage(): JSX.Element {
  const [riddles, setRiddles] = useState<Riddl
```

**Suggested Fix:** Refactor into smaller functions

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:617`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{filteredActions.map((action, index) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:282`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const VALUE = 30

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:357`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 600 should be a named constant

**Code:**
```typescript
600
```

**Suggested Fix:** Define constant: const VALUE = 600

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:400`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 99 should be a named constant

**Code:**
```typescript
99
```

**Suggested Fix:** Define constant: const VALUE = 99

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:401`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 99 should be a named constant

**Code:**
```typescript
99
```

**Suggested Fix:** Define constant: const VALUE = 99

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:443`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 200 should be a named constant

**Code:**
```typescript
200
```

**Suggested Fix:** Define constant: const VALUE = 200

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:535`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 500 should be a named constant

**Code:**
```typescript
500
```

**Suggested Fix:** Define constant: const VALUE = 500

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:622`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 50 should be a named constant

**Code:**
```typescript
50
```

**Suggested Fix:** Define constant: const VALUE = 50

---

### max-file-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:1`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** File has 691 lines (max: 500)

**Code:**
```typescript
Total lines: 691
```

**Suggested Fix:** Split into multiple files

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:105`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:106`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:107`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:116`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, scale: 0.95, y: 20 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:117`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, scale: 1, y: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:118`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0, scale: 0.95, y: 20 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:119`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ type: 'spring', damping: 25, stiffness: 300 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:382`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, y: 20 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:383`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, y: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:384`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0, y: 20 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:385`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ type: 'spring', damping: 25, stiffness: 300 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:441`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{availableActions.map((action) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### max-file-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:1`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** File has 512 lines (max: 500)

**Code:**
```typescript
Total lines: 512
```

**Suggested Fix:** Split into multiple files

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:187`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, scale: 0.95, y: -4 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:188`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, scale: 1, y: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:189`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0, scale: 0.95, y: -4 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:190`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ duration: 0.15 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:243`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, y: 8 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:244`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, y: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:245`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:338`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, y: 10 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:339`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, y: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:386`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:387`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:388`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:395`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, scale: 0.95, y: 20 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:396`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, scale: 1, y: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:397`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0, scale: 0.95, y: 20 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:398`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ type: 'spring', damping: 25, stiffness: 300 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:537`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, y: -8 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:538`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, y: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:539`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0, y: -8 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:200`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{actions.map(({ action, label, icon: Icon, variant }) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:560`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{actions.map((action) => {
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:690`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
const filteredIds = useMemo(() => filteredItems.map((i) => i.id), [filteredItems]);
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:717`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
next = prev.map((item) =>
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:902`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{filteredItems.map((item) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:245`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const VALUE = 20

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:749`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 300 should be a named constant

**Code:**
```typescript
300
```

**Suggested Fix:** Define constant: const VALUE = 300

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:763`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 300 should be a named constant

**Code:**
```typescript
300
```

**Suggested Fix:** Define constant: const VALUE = 300

---

### max-file-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\components\ui\ContentManagementSection.tsx:1`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** File has 934 lines (max: 500)

**Code:**
```typescript
Total lines: 934
```

**Suggested Fix:** Split into multiple files

---

### require-return-type

- **Severity:** low
- **Category:** type-safety
- **File:** `apps\frontend\src\components\ui\FileUploader.tsx:17`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'FileUploader' missing explicit return type

**Code:**
```typescript
export function FileUploader({
    onFileSelect,
    accept = '.json,.csv',
    label = 'Upload f
```

**Suggested Fix:** Add explicit return type annotation

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\ui\FileUploader.tsx:65`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 1024 should be a named constant

**Code:**
```typescript
1024
```

**Suggested Fix:** Define constant: const VALUE = 1024

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\ui\FileUploader.tsx:65`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 1024 should be a named constant

**Code:**
```typescript
1024
```

**Suggested Fix:** Define constant: const VALUE = 1024

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\components\ui\FileUploader.tsx:162`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 1024 should be a named constant

**Code:**
```typescript
1024
```

**Suggested Fix:** Define constant: const VALUE = 1024

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\components\ui\FileUploader.tsx:144`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\components\ui\FileUploader.tsx:17`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'FileUploader' is 179 lines (max: 50)

**Code:**
```typescript
export function FileUploader({
    onFileSelect,
    accept = '.json,.csv',
    label = 'Upload f
```

**Suggested Fix:** Refactor into smaller functions

---

### max-cyclomatic-complexity

- **Severity:** high
- **Category:** enterprise
- **File:** `apps\frontend\src\components\ui\FileUploader.tsx:17`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'FileUploader' has complexity of 23 (max: 15)

**Code:**
```typescript
export function FileUploader({
    onFileSelect,
    accept = '.json,.csv',
    label = 'Upload f
```

**Suggested Fix:** Refactor to reduce branching

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:214`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:215`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:216`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:228`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ type: 'spring', stiffness: 300, damping: 20 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:260`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ width: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:261`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ width: `${percentage}%` }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:262`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ duration: 0.6, delay: index * 0.1 + 0.2, ease: 'easeOut' }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:275`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ scale: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:276`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ scale: 1 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:277`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ type: 'spring', stiffness: 500, damping: 30 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:319`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, y: -10 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:320`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, y: 0 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:290`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{[...Array(4)].map((_, i) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:392`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
return (Object.keys(STATUS_CONFIG) as StatusFilter[]).map((key) => ({
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:428`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{statusConfigs.map(({ key, config, count }, index) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\components\ui\ThemeToggle.tsx:17`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'ThemeToggle' is 155 lines (max: 50)

**Code:**
```typescript
export function ThemeToggle({ 
  className = '', 
  size = 'md',
  variant = 'icon' 
}: ThemeTog
```

**Suggested Fix:** Refactor into smaller functions

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:72`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, x: 100, scale: 0.9 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:73`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, x: 0, scale: 1 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:74`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0, x: 100, scale: 0.9 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### no-inline-object-jsx

- **Severity:** low
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:75`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ type: 'spring', damping: 25, stiffness: 300 }}
```

**Suggested Fix:** Move to useMemo or define outside component

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:150`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{toasts.map((toast) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:178`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
csvContent += '# ' + Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(' | ') + '\n';
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:222`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
failed: validation.errors.map((error, index) => ({ row: index, error, data: null })),
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:824`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{filteredRiddles.map((riddle) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:955`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{importWarnings.map((w, i) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:972`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{importPreview.slice(0, 5).map((riddle, i) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:1245`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{categories.map((cat) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:290`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 90 should be a named constant

**Code:**
```typescript
90
```

**Suggested Fix:** Define constant: const VALUE = 90

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:414`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 500 should be a named constant

**Code:**
```typescript
500
```

**Suggested Fix:** Define constant: const VALUE = 500

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:956`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const VALUE = 30

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:973`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const VALUE = 20

---

### require-img-alt

- **Severity:** high
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:837`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Image missing alt attribute

**Code:**
```typescript
<img
```

**Suggested Fix:** Add descriptive alt attribute

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:662`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:807`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:827`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:897`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:331`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'ImageRiddlesAdminSection' is 930 lines (max: 50)

**Code:**
```typescript
export function ImageRiddlesAdminSection(): JSX.Element {
  // State for image riddles with persist
```

**Suggested Fix:** Refactor into smaller functions

---

### max-file-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:1`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** File has 1263 lines (max: 500)

**Code:**
```typescript
Total lines: 1263
```

**Suggested Fix:** Split into multiple files

---

### max-cyclomatic-complexity

- **Severity:** high
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\ImageRiddlesAdminSection.tsx:331`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'ImageRiddlesAdminSection' has complexity of 53 (max: 15)

**Code:**
```typescript
export function ImageRiddlesAdminSection(): JSX.Element {
  // State for image riddles with persist
```

**Suggested Fix:** Refactor to reduce branching

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\JokesSection.tsx:218`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{paginatedJokes.map((joke) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\JokesSection.tsx:65`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 500 should be a named constant

**Code:**
```typescript
500
```

**Suggested Fix:** Define constant: const VALUE = 500

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\JokesSection.tsx:203`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\JokesSection.tsx:221`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\JokesSection.tsx:23`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'JokesSection' is 300 lines (max: 50)

**Code:**
```typescript
export function JokesSection({ allJokes, setAllJokes }: JokesSectionProps): JSX.Element {
  const [
```

**Suggested Fix:** Refactor into smaller functions

---

### max-cyclomatic-complexity

- **Severity:** high
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\JokesSection.tsx:23`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'JokesSection' has complexity of 18 (max: 15)

**Code:**
```typescript
export function JokesSection({ allJokes, setAllJokes }: JokesSectionProps): JSX.Element {
  const [
```

**Suggested Fix:** Refactor to reduce branching

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:105`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
setLocalQuestions(questions.map((q) => ({ ...q, status: q.status || 'published' })));
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:109`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
const chapters = [...new Set(localQuestions.map((q) => q.chapter))];
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:134`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
setSelectedIds(filteredQuestions.map((q) => String(q.id)));
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:200`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
.map((q) => {
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:274`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
const rows = qs.map((q) => [
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:285`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
return `# Subject: ${subjectName}\n${csvHeaders.join(',')}\n${rows.map((r) => r.join(',')).join('\n'
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:375`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
.map((q, index) => ({
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:548`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{allSubjects.map((s) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:581`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{chapters.map((ch) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:606`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{['all', 'easy', 'medium', 'hard', 'expert', 'extreme'].map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:716`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{importPreview.slice(0, 5).map((q, i) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:914`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{chapters.map((ch) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:998`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{filteredQuestions.map((q, index) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:196`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 500 should be a named constant

**Code:**
```typescript
500
```

**Suggested Fix:** Define constant: const VALUE = 500

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:718`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const VALUE = 20

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:1006`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const VALUE = 30

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:1022`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const VALUE = 30

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:1029`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const VALUE = 30

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:958`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:1001`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:57`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'QuestionManagementSection' is 1068 lines (max: 50)

**Code:**
```typescript
export function QuestionManagementSection({
  subject,
  questions,
  allSubjects,
  onSubjectSe
```

**Suggested Fix:** Refactor into smaller functions

---

### max-file-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:1`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** File has 1127 lines (max: 500)

**Code:**
```typescript
Total lines: 1127
```

**Suggested Fix:** Split into multiple files

---

### max-cyclomatic-complexity

- **Severity:** high
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\QuestionManagementSection.tsx:57`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'QuestionManagementSection' has complexity of 66 (max: 15)

**Code:**
```typescript
export function QuestionManagementSection({
  subject,
  questions,
  allSubjects,
  onSubjectSe
```

**Suggested Fix:** Refactor to reduce branching

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\RiddlesSection.tsx:562`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{difficultyLevels.map(({ value, label }) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\RiddlesSection.tsx:649`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{paginatedRiddles.map((riddle, index) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\RiddlesSection.tsx:837`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{importWarnings.map((w, i) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\RiddlesSection.tsx:856`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{importPreview.slice(0, 5).map((riddle, i) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\RiddlesSection.tsx:152`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 500 should be a named constant

**Code:**
```typescript
500
```

**Suggested Fix:** Define constant: const VALUE = 500

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\RiddlesSection.tsx:838`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const VALUE = 30

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\RiddlesSection.tsx:858`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const VALUE = 20

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\RiddlesSection.tsx:627`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\RiddlesSection.tsx:652`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\RiddlesSection.tsx:58`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'RiddlesSection' is 1057 lines (max: 50)

**Code:**
```typescript
export function RiddlesSection({ initialRiddles }: RiddlesSectionProps): JSX.Element {
  const [all
```

**Suggested Fix:** Refactor into smaller functions

---

### max-file-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\RiddlesSection.tsx:1`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** File has 1115 lines (max: 500)

**Code:**
```typescript
Total lines: 1115
```

**Suggested Fix:** Split into multiple files

---

### max-cyclomatic-complexity

- **Severity:** high
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\RiddlesSection.tsx:58`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'RiddlesSection' has complexity of 50 (max: 15)

**Code:**
```typescript
export function RiddlesSection({ initialRiddles }: RiddlesSectionProps): JSX.Element {
  const [all
```

**Suggested Fix:** Refactor to reduce branching

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:198`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{SETTINGS_TABS.map((tab) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:512`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{DIFFICULTY_LEVELS.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:53`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const VALUE = 30

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:54`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:55`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 90 should be a named constant

**Code:**
```typescript
90
```

**Suggested Fix:** Define constant: const VALUE = 90

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:56`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 120 should be a named constant

**Code:**
```typescript
120
```

**Suggested Fix:** Define constant: const VALUE = 120

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:57`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:284`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const VALUE = 3600

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:315`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const VALUE = 3600

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:373`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const VALUE = 3600

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:445`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 90 should be a named constant

**Code:**
```typescript
90
```

**Suggested Fix:** Define constant: const VALUE = 90

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:480`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const VALUE = 3600

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:239`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:260`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:281`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:312`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:328`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:354`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:370`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:397`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:442`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:461`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:477`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:489`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### require-input-label

- **Severity:** medium
- **Category:** accessibility
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:520`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label or add aria-label

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:65`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'SettingsSection' is 477 lines (max: 50)

**Code:**
```typescript
export function SettingsSection(): JSX.Element {
  const [settings, setSettings] = useState<SystemS
```

**Suggested Fix:** Refactor into smaller functions

---

### max-file-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:1`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** File has 542 lines (max: 500)

**Code:**
```typescript
Total lines: 542
```

**Suggested Fix:** Split into multiple files

---

### max-cyclomatic-complexity

- **Severity:** high
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\components\SettingsSection.tsx:65`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'SettingsSection' has complexity of 29 (max: 15)

**Code:**
```typescript
export function SettingsSection(): JSX.Element {
  const [settings, setSettings] = useState<SystemS
```

**Suggested Fix:** Refactor to reduce branching

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\hooks\useAdminData.ts:59`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'useAdminData' is 55 lines (max: 50)

**Code:**
```typescript
export function useAdminData(): UseAdminDataReturn {
  const [subjects, setSubjects] = useState<Sub
```

**Suggested Fix:** Refactor into smaller functions

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\utils\index.ts:253`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
csvContent += '# ' + Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(' | ') + '\n';
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\admin\utils\index.ts:297`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
failed: validationResult.errors.map((err, idx) => ({
```

**Suggested Fix:** Add key prop with unique identifier

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\admin\utils\index.ts:284`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'importFromCSV' is 61 lines (max: 50)

**Code:**
```typescript
export function importFromCSV<T>(
  csvText: string,
  config: ImportExportConfig<T>,
  mapper: (
```

**Suggested Fix:** Refactor into smaller functions

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\components\home\BubbleBackground.tsx:9`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{bubbles.map((size, i) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\components\home\BubbleBackground.tsx:5`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 50 should be a named constant

**Code:**
```typescript
50
```

**Suggested Fix:** Define constant: const VALUE = 50

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\components\home\BubbleBackground.tsx:5`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 80 should be a named constant

**Code:**
```typescript
80
```

**Suggested Fix:** Define constant: const VALUE = 80

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\components\home\BubbleBackground.tsx:5`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const VALUE = 60

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\components\home\BubbleBackground.tsx:5`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 90 should be a named constant

**Code:**
```typescript
90
```

**Suggested Fix:** Define constant: const VALUE = 90

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\components\home\BubbleBackground.tsx:5`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 70 should be a named constant

**Code:**
```typescript
70
```

**Suggested Fix:** Define constant: const VALUE = 70

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\components\home\BubbleBackground.tsx:5`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 55 should be a named constant

**Code:**
```typescript
55
```

**Suggested Fix:** Define constant: const VALUE = 55

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\components\home\BubbleBackground.tsx:5`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 85 should be a named constant

**Code:**
```typescript
85
```

**Suggested Fix:** Define constant: const VALUE = 85

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\components\home\BubbleBackground.tsx:5`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 65 should be a named constant

**Code:**
```typescript
65
```

**Suggested Fix:** Define constant: const VALUE = 65

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\components\home\BubbleBackground.tsx:5`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 75 should be a named constant

**Code:**
```typescript
75
```

**Suggested Fix:** Define constant: const VALUE = 75

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\components\home\BubbleBackground.tsx:5`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 95 should be a named constant

**Code:**
```typescript
95
```

**Suggested Fix:** Define constant: const VALUE = 95

---

### no-magic-numbers

- **Severity:** low
- **Category:** best-practices
- **File:** `apps\frontend\src\app\components\home\BubbleBackground.tsx:17`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Magic number 13 should be a named constant

**Code:**
```typescript
13
```

**Suggested Fix:** Define constant: const VALUE = 13

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\components\home\ModeCards.tsx:36`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{modes.map((mode) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\components\home\StatsSection.tsx:26`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{stats.map((stat) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\components\home\TopicSection.tsx:90`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{academicTopics.map((topic) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\components\home\TopicSection.tsx:101`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{professionalTopics.map((topic) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### require-react-keys

- **Severity:** high
- **Category:** performance
- **File:** `apps\frontend\src\app\components\home\TopicSection.tsx:112`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** List rendering without key prop

**Code:**
```typescript
{entertainmentTopics.map((topic) => (
```

**Suggested Fix:** Add key prop with unique identifier

---

### max-function-length

- **Severity:** medium
- **Category:** enterprise
- **File:** `apps\frontend\src\app\components\home\TopicSection.tsx:38`
- **Status:** pending
- **Auto-Fixable:** No

**Description:** Function 'TopicsSection' is 83 lines (max: 50)

**Code:**
```typescript
export function TopicsSection(): JSX.Element {
  const [topicsExpanded, setTopicsExpanded] = useSta
```

**Suggested Fix:** Refactor into smaller functions

---


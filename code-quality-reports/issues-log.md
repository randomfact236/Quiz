# Enterprise Code Quality Report

**Scan ID:** SCAN-1771153490353-A02CUX  
**Timestamp:** 2026-02-15T11:04:50.353Z  
**Duration:** 6531ms  

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | 2.5/10 |
| **Quality Gate** | ❌ FAILED |
| **Total Files** | 100 |
| **Total Issues** | 800 |
| **Critical** | 0 |
| **High** | 102 |
| **Medium** | 451 |
| **Low** | 247 |
| **Auto-Fixable** | 71 |

## Category Scores

| Category | Score | Issues | Critical | High | Medium | Low |
|----------|-------|--------|----------|------|--------|-----|
| 🔴 type-safety | 0.0/10 | 189 | 0 | 43 | 146 | 0 |
| 🟢 security | 10.0/10 | 0 | 0 | 0 | 0 | 0 |
| 🔴 performance | 0.0/10 | 94 | 0 | 56 | 38 | 0 |
| 🔴 accessibility | 0.0/10 | 170 | 0 | 3 | 167 | 0 |
| 🔴 best-practices | 0.0/10 | 160 | 0 | 0 | 71 | 89 |
| 🔴 enterprise | 0.0/10 | 187 | 0 | 0 | 29 | 158 |

## Quality Gate Requirements

- ✅ No critical issues: PASS
- ✅ No high severity security issues: FAIL (102)
- ✅ Minimum overall score (9.0): FAIL (2.5)
- ✅ Minimum type safety score (9.5): FAIL

## Files with Issues

### apps\frontend\tailwind.config.ts

**Metrics:** Lines: 120, Functions: 0, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 3 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'config' |

### apps\backend\src\app.module.ts

**Metrics:** Lines: 90, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 87 | 🟡 medium | type-safety | require-return-type | Function 'configure' is missing explicit return type |
| 37 | 🔵 low | best-practices | no-magic-numbers | Magic number 5432 should be a named constant |
| 23 | 🔵 low | enterprise | require-jsdoc | Exported class 'AppModule' missing JSDoc |

### apps\backend\src\main.ts

**Metrics:** Lines: 77, Functions: 1, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 8 | 🟡 medium | type-safety | require-return-type | Function 'bootstrap' is missing explicit return type |
| 62 | 🔵 low | best-practices | no-magic-numbers | Magic number 4000 should be a named constant |
| 69 | 🔵 low | best-practices | no-magic-numbers | Magic number 43 should be a named constant |
| 8 | 🔵 low | enterprise | max-function-length | Function 'bootstrap' is 68 lines (max: 50) |

### apps\backend\src\auth\auth.controller.ts

**Metrics:** Lines: 28, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 10 | 🟡 medium | type-safety | require-return-type | Function 'register' is missing explicit return type |
| 20 | 🟡 medium | type-safety | require-return-type | Function 'login' is missing explicit return type |
| 5 | 🔵 low | enterprise | require-jsdoc | Exported class 'AuthController' missing JSDoc |

### apps\backend\src\auth\auth.module.ts

**Metrics:** Lines: 27, Functions: 1, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 10 | 🔵 low | enterprise | require-jsdoc | Exported class 'AuthModule' missing JSDoc |

### apps\backend\src\auth\auth.service.ts

**Metrics:** Lines: 42, Functions: 3, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 12 | 🟡 medium | type-safety | require-return-type | Function 'register' is missing explicit return type |
| 24 | 🟡 medium | type-safety | require-return-type | Function 'login' is missing explicit return type |
| 39 | 🟡 medium | type-safety | require-return-type | Function 'validateUser' is missing explicit return type |
| 5 | 🔵 low | enterprise | require-jsdoc | Exported class 'AuthService' missing JSDoc |

### apps\backend\src\auth\jwt-auth.guard.ts

**Metrics:** Lines: 32, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 26 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 26 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 12 | 🟡 medium | type-safety | require-return-type | Function 'canActivate' is missing explicit return type |
| 26 | 🟡 medium | type-safety | require-return-type | Function 'handleRequest' is missing explicit return type |
| 6 | 🔵 low | enterprise | require-jsdoc | Exported class 'JwtAuthGuard' missing JSDoc |

### apps\backend\src\auth\jwt.strategy.ts

**Metrics:** Lines: 23, Functions: 1, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 20 | 🟡 medium | type-safety | require-return-type | Function 'validate' is missing explicit return type |
| 7 | 🔵 low | enterprise | require-jsdoc | Exported class 'JwtStrategy' missing JSDoc |

### apps\backend\src\dad-jokes\dad-jokes.controller.ts

**Metrics:** Lines: 366, Functions: 32, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 243 | 🔵 low | best-practices | no-magic-numbers | Magic number 20 should be a named constant |
| 40 | 🔵 low | enterprise | require-jsdoc | Exported class 'DadJokesController' missing JSDoc |

### apps\backend\src\dad-jokes\dad-jokes.module.ts

**Metrics:** Lines: 20, Functions: 0, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 13 | 🔵 low | enterprise | require-jsdoc | Exported class 'DadJokesModule' missing JSDoc |

### apps\backend\src\dad-jokes\dad-jokes.service.ts

**Metrics:** Lines: 535, Functions: 35, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 58 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 203 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 273 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 29 | 🔵 low | enterprise | require-jsdoc | Exported class 'DadJokesService' missing JSDoc |
| 1 | 🔵 low | enterprise | max-file-length | File has 535 lines (max: 500) |
| 434 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'updateQuizJoke' has cyclomatic complexity of 14 (max: 10) |

### apps\backend\src\database\data-source.ts

**Metrics:** Lines: 21, Functions: 0, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 6 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'dataSourceOptions' |
| 19 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'dataSource' |

### apps\backend\src\database\seed.ts

**Metrics:** Lines: 170, Functions: 2, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 32 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 56 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 94 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 128 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 14 | 🟡 medium | type-safety | require-return-type | Function 'seed' is missing explicit return type |
| 16 | 🟡 medium | best-practices | no-console | console.log should be replaced with proper logger |
| 40 | 🟡 medium | best-practices | no-console | console.log should be replaced with proper logger |
| 67 | 🟡 medium | best-practices | no-console | console.log should be replaced with proper logger |
| 85 | 🟡 medium | best-practices | no-console | console.log should be replaced with proper logger |
| 102 | 🟡 medium | best-practices | no-console | console.log should be replaced with proper logger |
| 119 | 🟡 medium | best-practices | no-console | console.log should be replaced with proper logger |
| 136 | 🟡 medium | best-practices | no-console | console.log should be replaced with proper logger |
| 153 | 🟡 medium | best-practices | no-console | console.log should be replaced with proper logger |
| 161 | 🟡 medium | best-practices | no-console | console.log should be replaced with proper logger |
| 164 | 🟡 medium | best-practices | no-console | console.log should be replaced with proper logger |
| 4 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'AppDataSource' |
| 14 | 🔵 low | enterprise | max-function-length | Function 'seed' is 152 lines (max: 50) |
| 14 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'seed' has cyclomatic complexity of 25 (max: 10) |

### apps\backend\src\health\health.controller.ts

**Metrics:** Lines: 49, Functions: 8, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 21 | 🟡 medium | type-safety | require-return-type | Function 'check' is missing explicit return type |
| 35 | 🟡 medium | type-safety | require-return-type | Function 'liveness' is missing explicit return type |
| 41 | 🟡 medium | type-safety | require-return-type | Function 'readiness' is missing explicit return type |
| 29 | 🔵 low | best-practices | no-magic-numbers | Magic number 150 should be a named constant |
| 29 | 🔵 low | best-practices | no-magic-numbers | Magic number 1024 should be a named constant |
| 29 | 🔵 low | best-practices | no-magic-numbers | Magic number 1024 should be a named constant |
| 30 | 🔵 low | best-practices | no-magic-numbers | Magic number 150 should be a named constant |
| 30 | 🔵 low | best-practices | no-magic-numbers | Magic number 1024 should be a named constant |
| 30 | 🔵 low | best-practices | no-magic-numbers | Magic number 1024 should be a named constant |
| 11 | 🔵 low | enterprise | require-jsdoc | Exported class 'HealthController' missing JSDoc |

### apps\backend\src\health\health.module.ts

**Metrics:** Lines: 9, Functions: 0, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 5 | 🔵 low | enterprise | require-jsdoc | Exported class 'HealthModule' missing JSDoc |

### apps\backend\src\image-riddles\image-riddles.controller.ts

**Metrics:** Lines: 229, Functions: 18, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 40 | 🔵 low | enterprise | require-jsdoc | Exported class 'ImageRiddlesController' missing JSDoc |

### apps\backend\src\image-riddles\image-riddles.module.ts

**Metrics:** Lines: 25, Functions: 0, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 18 | 🔵 low | enterprise | require-jsdoc | Exported class 'ImageRiddlesModule' missing JSDoc |

### apps\backend\src\image-riddles\image-riddles.service.ts

**Metrics:** Lines: 496, Functions: 26, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 130 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 363 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 364 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 363 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 364 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 34 | 🔵 low | enterprise | require-jsdoc | Exported class 'ImageRiddlesService' missing JSDoc |
| 235 | 🔵 low | enterprise | max-function-length | Function 'createRiddle' is 51 lines (max: 50) |
| 319 | 🔵 low | enterprise | max-function-length | Function 'updateRiddle' is 77 lines (max: 50) |
| 235 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'createRiddle' has cyclomatic complexity of 12 (max: 10) |
| 319 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'updateRiddle' has cyclomatic complexity of 20 (max: 10) |

### apps\backend\src\quiz\quiz.controller.ts

**Metrics:** Lines: 227, Functions: 19, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 160 | 🔵 low | best-practices | no-magic-numbers | Magic number 20 should be a named constant |
| 30 | 🔵 low | enterprise | require-jsdoc | Exported class 'QuizController' missing JSDoc |

### apps\backend\src\quiz\quiz.module.ts

**Metrics:** Lines: 18, Functions: 0, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 11 | 🔵 low | enterprise | require-jsdoc | Exported class 'QuizModule' missing JSDoc |

### apps\backend\src\quiz\quiz.service.ts

**Metrics:** Lines: 248, Functions: 21, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 121 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 15 | 🔵 low | enterprise | require-jsdoc | Exported class 'QuizService' missing JSDoc |

### apps\backend\src\riddles\riddles.controller.ts

**Metrics:** Lines: 377, Functions: 33, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 253 | 🔵 low | best-practices | no-magic-numbers | Magic number 20 should be a named constant |
| 40 | 🔵 low | enterprise | require-jsdoc | Exported class 'RiddlesController' missing JSDoc |

### apps\backend\src\riddles\riddles.module.ts

**Metrics:** Lines: 20, Functions: 0, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 13 | 🔵 low | enterprise | require-jsdoc | Exported class 'RiddlesModule' missing JSDoc |

### apps\backend\src\riddles\riddles.service.ts

**Metrics:** Lines: 581, Functions: 36, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 58 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 241 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 311 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 29 | 🔵 low | enterprise | require-jsdoc | Exported class 'RiddlesService' missing JSDoc |
| 1 | 🔵 low | enterprise | max-file-length | File has 581 lines (max: 500) |
| 185 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'updateRiddle' has cyclomatic complexity of 11 (max: 10) |
| 472 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'updateQuizRiddle' has cyclomatic complexity of 14 (max: 10) |

### apps\backend\src\settings\settings.controller.ts

**Metrics:** Lines: 24, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 20 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 12 | 🟡 medium | type-safety | require-return-type | Function 'getSettings' is missing explicit return type |
| 18 | 🟡 medium | type-safety | require-return-type | Function 'updateSettings' is missing explicit return type |
| 7 | 🔵 low | enterprise | require-jsdoc | Exported class 'SettingsController' missing JSDoc |

### apps\backend\src\settings\settings.module.ts

**Metrics:** Lines: 14, Functions: 0, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 7 | 🔵 low | enterprise | require-jsdoc | Exported class 'SettingsModule' missing JSDoc |

### apps\backend\src\settings\settings.service.ts

**Metrics:** Lines: 126, Functions: 8, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 9 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 38 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 38 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 60 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 60 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 80 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 95 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 115 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 16 | 🟡 medium | type-safety | require-return-type | Function 'onModuleInit' is missing explicit return type |
| 23 | 🟡 medium | type-safety | require-return-type | Function 'refreshSettings' is missing explicit return type |
| 38 | 🟡 medium | type-safety | require-return-type | Function 'applyOverride' is missing explicit return type |
| 60 | 🟡 medium | type-safety | require-return-type | Function 'deepMerge' is missing explicit return type |
| 73 | 🟡 medium | type-safety | require-return-type | Function 'getSettings' is missing explicit return type |
| 95 | 🟡 medium | type-safety | require-return-type | Function 'updateSetting' is missing explicit return type |
| 115 | 🟡 medium | type-safety | require-return-type | Function 'updateSettings' is missing explicit return type |
| 7 | 🔵 low | enterprise | require-jsdoc | Exported class 'SettingsService' missing JSDoc |

### apps\backend\src\users\users.controller.ts

**Metrics:** Lines: 35, Functions: 4, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 19 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 32 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 10 | 🟡 medium | type-safety | require-return-type | Function 'getAll' is missing explicit return type |
| 16 | 🟡 medium | type-safety | require-return-type | Function 'getProfile' is missing explicit return type |
| 23 | 🟡 medium | type-safety | require-return-type | Function 'getById' is missing explicit return type |
| 29 | 🟡 medium | type-safety | require-return-type | Function 'updateProfile' is missing explicit return type |
| 5 | 🔵 low | enterprise | require-jsdoc | Exported class 'UsersController' missing JSDoc |

### apps\backend\src\users\users.module.ts

**Metrics:** Lines: 13, Functions: 0, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 7 | 🔵 low | enterprise | require-jsdoc | Exported class 'UsersModule' missing JSDoc |

### apps\backend\src\users\users.service.ts

**Metrics:** Lines: 46, Functions: 6, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 7 | 🔵 low | enterprise | require-jsdoc | Exported class 'UsersService' missing JSDoc |

### apps\frontend\src\app\layout.tsx

**Metrics:** Lines: 101, Functions: 1, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 9 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'inter' |
| 15 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'metadata' |
| 67 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'viewport' |
| 78 | 🔵 low | enterprise | require-jsdoc | Exported function 'RootLayout' missing JSDoc |

### apps\frontend\src\app\not-found.tsx

**Metrics:** Lines: 23, Functions: 1, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 3 | 🔵 low | enterprise | require-jsdoc | Exported function 'NotFoundPage' missing JSDoc |

### apps\frontend\src\app\page.tsx

**Metrics:** Lines: 220, Functions: 6, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 16 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 16 | 🔵 low | best-practices | no-magic-numbers | Magic number 50 should be a named constant |
| 16 | 🔵 low | best-practices | no-magic-numbers | Magic number 80 should be a named constant |
| 16 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 16 | 🔵 low | best-practices | no-magic-numbers | Magic number 90 should be a named constant |
| 16 | 🔵 low | best-practices | no-magic-numbers | Magic number 70 should be a named constant |
| 16 | 🔵 low | best-practices | no-magic-numbers | Magic number 55 should be a named constant |
| 16 | 🔵 low | best-practices | no-magic-numbers | Magic number 85 should be a named constant |
| 16 | 🔵 low | best-practices | no-magic-numbers | Magic number 65 should be a named constant |
| 16 | 🔵 low | best-practices | no-magic-numbers | Magic number 75 should be a named constant |
| 16 | 🔵 low | best-practices | no-magic-numbers | Magic number 95 should be a named constant |
| 24 | 🔵 low | best-practices | no-magic-numbers | Magic number 13 should be a named constant |
| 37 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 52 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 92 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 124 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 6 | 🔵 low | enterprise | require-jsdoc | Exported function 'HomePage' missing JSDoc |
| 6 | 🔵 low | enterprise | max-function-length | Function 'HomePage' is 215 lines (max: 50) |
| 6 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'HomePage' has cyclomatic complexity of 21 (max: 10) |

### apps\frontend\src\components\Footer.tsx

**Metrics:** Lines: 72, Functions: 3, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 35 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 52 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 3 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'footerLinks' |
| 14 | 🔵 low | enterprise | require-jsdoc | Exported function 'Footer' missing JSDoc |
| 14 | 🔵 low | enterprise | max-function-length | Function 'Footer' is 59 lines (max: 50) |

### apps\frontend\src\components\Header.tsx

**Metrics:** Lines: 107, Functions: 5, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 31 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 84 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 7 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'navLinks' |
| 46 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 16 | 🔵 low | enterprise | require-jsdoc | Exported function 'Header' missing JSDoc |
| 16 | 🔵 low | enterprise | max-function-length | Function 'Header' is 92 lines (max: 50) |

### apps\frontend\src\components\MobileFooter.tsx

**Metrics:** Lines: 218, Functions: 12, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 10 | 🟡 medium | type-safety | require-return-type | Function 'MobileFooter' is missing explicit return type |
| 62 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 63 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 64 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 75 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 76 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 77 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 78 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 99 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 115 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 131 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 146 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 92 | 🔵 low | best-practices | no-magic-numbers | Magic number 20 should be a named constant |
| 171 | 🔵 low | best-practices | no-magic-numbers | Magic number 24 should be a named constant |
| 180 | 🔵 low | best-practices | no-magic-numbers | Magic number 24 should be a named constant |
| 189 | 🔵 low | best-practices | no-magic-numbers | Magic number 24 should be a named constant |
| 198 | 🔵 low | best-practices | no-magic-numbers | Magic number 24 should be a named constant |
| 207 | 🔵 low | best-practices | no-magic-numbers | Magic number 24 should be a named constant |
| 88 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 175 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 184 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 193 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 202 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 10 | 🔵 low | enterprise | require-jsdoc | Exported function 'MobileFooter' missing JSDoc |
| 10 | 🔵 low | enterprise | max-function-length | Function 'MobileFooter' is 208 lines (max: 50) |
| 10 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'MobileFooter' has cyclomatic complexity of 23 (max: 10) |

### apps\frontend\src\contexts\ThemeContext.tsx

**Metrics:** Lines: 138, Functions: 13, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 37 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 103 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 118 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 21 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'ThemeContext' |
| 23 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'STORAGE_KEY' |
| 30 | 🔵 low | enterprise | require-jsdoc | Exported function 'ThemeProvider' missing JSDoc |
| 131 | 🔵 low | enterprise | require-jsdoc | Exported function 'useTheme' missing JSDoc |
| 30 | 🔵 low | enterprise | max-function-length | Function 'ThemeProvider' is 100 lines (max: 50) |
| 30 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'ThemeProvider' has cyclomatic complexity of 14 (max: 10) |

### apps\frontend\src\hooks\useBulkActions.ts

**Metrics:** Lines: 324, Functions: 25, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 82 | 🔵 low | enterprise | max-function-length | Function 'useBulkActions' is 240 lines (max: 50) |
| 209 | 🔵 low | enterprise | max-function-length | Function 'anonymous' is 76 lines (max: 50) |
| 82 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'useBulkActions' has cyclomatic complexity of 28 (max: 10) |
| 209 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'anonymous' has cyclomatic complexity of 14 (max: 10) |

### apps\frontend\src\hooks\useStatusCounts.ts

**Metrics:** Lines: 188, Functions: 9, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 54 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'DEFAULT_COUNTS' |
| 71 | 🔵 low | enterprise | max-function-length | Function 'useStatusCounts' is 115 lines (max: 50) |
| 71 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'useStatusCounts' has cyclomatic complexity of 14 (max: 10) |

### apps\frontend\src\lib\toast.ts

**Metrics:** Lines: 142, Functions: 21, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 131 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 52 | 🔵 low | best-practices | no-magic-numbers | Magic number 5000 should be a named constant |
| 101 | 🔵 low | best-practices | no-magic-numbers | Magic number 8000 should be a named constant |

### apps\frontend\src\lib\utils.ts

**Metrics:** Lines: 121, Functions: 12, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 96 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 29 | 🔵 low | best-practices | no-magic-numbers | Magic number 36 should be a named constant |
| 80 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 81 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 81 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 82 | 🔵 low | best-practices | no-magic-numbers | Magic number 86400 should be a named constant |
| 82 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 83 | 🔵 low | best-practices | no-magic-numbers | Magic number 604800 should be a named constant |
| 83 | 🔵 low | best-practices | no-magic-numbers | Magic number 86400 should be a named constant |

### apps\frontend\src\services\settings.service.ts

**Metrics:** Lines: 80, Functions: 2, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 40 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 2 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'API_URL' |
| 4 | 🔵 low | enterprise | require-jsdoc | Exported interface 'SystemSettings' missing JSDoc |

### apps\frontend\src\services\status.service.ts

**Metrics:** Lines: 253, Functions: 7, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 105 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 220 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 241 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 19 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'API_URL' |
| 24 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'REQUEST_TIMEOUT' |

### apps\frontend\src\types\status.types.ts

**Metrics:** Lines: 205, Functions: 0, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 99 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 157 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |

### apps\backend\src\admin\image-riddles\admin-image-riddles.controller.ts

**Metrics:** Lines: 246, Functions: 14, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 61 | 🔵 low | best-practices | no-magic-numbers | Magic number 20 should be a named constant |

### apps\backend\src\admin\image-riddles\admin-image-riddles.service.ts

**Metrics:** Lines: 444, Functions: 19, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 262 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 400 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 37 | 🔵 low | enterprise | max-function-length | Function 'findAllRiddles' is 56 lines (max: 50) |
| 174 | 🔵 low | enterprise | max-function-length | Function 'updateRiddle' is 51 lines (max: 50) |
| 174 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'updateRiddle' has cyclomatic complexity of 17 (max: 10) |

### apps\backend\src\common\cache\cache.module.ts

**Metrics:** Lines: 10, Functions: 0, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 4 | 🔵 low | enterprise | require-jsdoc | Exported class 'CacheModule' missing JSDoc |

### apps\backend\src\common\cache\cache.service.ts

**Metrics:** Lines: 73, Functions: 7, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 36 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 13 | 🔵 low | best-practices | no-magic-numbers | Magic number 6379 should be a named constant |
| 36 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 63 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 5 | 🔵 low | enterprise | require-jsdoc | Exported class 'CacheService' missing JSDoc |

### apps\backend\src\common\decorators\current-user.decorator.ts

**Metrics:** Lines: 10, Functions: 1, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 3 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'CurrentUser' |

### apps\backend\src\common\decorators\public.decorator.ts

**Metrics:** Lines: 12, Functions: 1, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 12 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'Public' |

### apps\backend\src\common\dto\base.dto.ts

**Metrics:** Lines: 996, Functions: 13, Classes: 37

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 862 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 925 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 7 | 🔵 low | enterprise | require-jsdoc | Exported class 'PaginationDto' missing JSDoc |
| 26 | 🔵 low | enterprise | require-jsdoc | Exported class 'SearchJokesDto' missing JSDoc |
| 38 | 🔵 low | enterprise | require-jsdoc | Exported class 'SearchRiddlesDto' missing JSDoc |
| 55 | 🔵 low | enterprise | require-jsdoc | Exported class 'SearchQuestionsDto' missing JSDoc |
| 79 | 🔵 low | enterprise | require-jsdoc | Exported class 'BulkImportResultDto' missing JSDoc |
| 90 | 🔵 low | enterprise | require-jsdoc | Exported class 'BulkDeleteDto' missing JSDoc |
| 98 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateJokeCategoryDto' missing JSDoc |
| 110 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateJokeCategoryDto' missing JSDoc |
| 122 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateRiddleCategoryDto' missing JSDoc |
| 134 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateRiddleCategoryDto' missing JSDoc |
| 148 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateDadJokeDto' missing JSDoc |
| 160 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateDadJokeDto' missing JSDoc |
| 174 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateRiddleDto' missing JSDoc |
| 195 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateRiddleDto' missing JSDoc |
| 219 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateJokeSubjectDto' missing JSDoc |
| 247 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateJokeSubjectDto' missing JSDoc |
| 282 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateJokeChapterDto' missing JSDoc |
| 300 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateJokeChapterDto' missing JSDoc |
| 316 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateQuizJokeDto' missing JSDoc |
| 352 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateQuizJokeDto' missing JSDoc |
| 392 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateRiddleSubjectDto' missing JSDoc |
| 420 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateRiddleSubjectDto' missing JSDoc |
| 455 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateRiddleChapterDto' missing JSDoc |
| 473 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateRiddleChapterDto' missing JSDoc |
| 489 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateQuizRiddleDto' missing JSDoc |
| 525 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateQuizRiddleDto' missing JSDoc |
| 571 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateQuestionDto' missing JSDoc |
| 601 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateQuestionDto' missing JSDoc |
| 635 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateSubjectDto' missing JSDoc |
| 647 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateSubjectDto' missing JSDoc |
| 661 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateImageRiddleCategoryDto' missing JSDoc |
| 678 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateImageRiddleCategoryDto' missing JSDoc |
| 832 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateImageRiddleDto' missing JSDoc |
| 894 | 🔵 low | enterprise | require-jsdoc | Exported class 'UpdateImageRiddleDto' missing JSDoc |
| 962 | 🔵 low | enterprise | require-jsdoc | Exported class 'SearchImageRiddlesDto' missing JSDoc |
| 981 | 🔵 low | enterprise | require-jsdoc | Exported class 'CreateUserAnswerDto' missing JSDoc |
| 1 | 🔵 low | enterprise | max-file-length | File has 996 lines (max: 500) |

### apps\backend\src\common\filters\http-exception.filter.ts

**Metrics:** Lines: 88, Functions: 1, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 20 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 46 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 28 | 🟡 medium | type-safety | require-return-type | Function 'catch' is missing explicit return type |
| 41 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 46 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 51 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 24 | 🔵 low | enterprise | require-jsdoc | Exported class 'GlobalExceptionFilter' missing JSDoc |
| 28 | 🔵 low | enterprise | max-function-length | Function 'catch' is 60 lines (max: 50) |
| 28 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'catch' has cyclomatic complexity of 12 (max: 10) |

### apps\backend\src\common\guards\roles.guard.ts

**Metrics:** Lines: 35, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 5 | 🔵 low | enterprise | require-jsdoc | Exported class 'RolesGuard' missing JSDoc |

### apps\backend\src\common\interceptors\logging.interceptor.ts

**Metrics:** Lines: 60, Functions: 3, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 16 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 8 | 🟡 medium | performance | no-entire-library-import | Importing entire 'rxjs' library increases bundle size |
| 12 | 🔵 low | enterprise | require-jsdoc | Exported class 'LoggingInterceptor' missing JSDoc |

### apps\backend\src\common\logger\winston-logger.ts

**Metrics:** Lines: 71, Functions: 5, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 52 | 🟡 medium | type-safety | require-return-type | Function 'log' is missing explicit return type |
| 56 | 🟡 medium | type-safety | require-return-type | Function 'error' is missing explicit return type |
| 60 | 🟡 medium | type-safety | require-return-type | Function 'warn' is missing explicit return type |
| 64 | 🟡 medium | type-safety | require-return-type | Function 'debug' is missing explicit return type |
| 68 | 🟡 medium | type-safety | require-return-type | Function 'verbose' is missing explicit return type |
| 6 | 🔵 low | enterprise | require-jsdoc | Exported class 'WinstonLoggerService' missing JSDoc |

### apps\backend\src\common\services\bulk-action.service.ts

**Metrics:** Lines: 316, Functions: 10, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 64 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 168 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 169 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 170 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 180 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 205 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 230 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 255 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 280 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 64 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 168 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 169 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 170 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 40 | 🔵 low | enterprise | max-function-length | Function 'executeBulkAction' is 117 lines (max: 50) |
| 40 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'executeBulkAction' has cyclomatic complexity of 20 (max: 10) |

### apps\backend\src\dad-jokes\entities\dad-joke.entity.ts

**Metrics:** Lines: 29, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 5 | 🔵 low | enterprise | require-jsdoc | Exported class 'DadJoke' missing JSDoc |

### apps\backend\src\dad-jokes\entities\joke-category.entity.ts

**Metrics:** Lines: 17, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 4 | 🔵 low | enterprise | require-jsdoc | Exported class 'JokeCategory' missing JSDoc |

### apps\backend\src\dad-jokes\entities\joke-chapter.entity.ts

**Metrics:** Lines: 25, Functions: 4, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 5 | 🔵 low | enterprise | require-jsdoc | Exported class 'JokeChapter' missing JSDoc |

### apps\backend\src\dad-jokes\entities\joke-subject.entity.ts

**Metrics:** Lines: 30, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 4 | 🔵 low | enterprise | require-jsdoc | Exported class 'JokeSubject' missing JSDoc |

### apps\backend\src\dad-jokes\entities\quiz-joke.entity.ts

**Metrics:** Lines: 33, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 4 | 🔵 low | enterprise | require-jsdoc | Exported class 'QuizJoke' missing JSDoc |

### apps\backend\src\database\migrations\1707912000000-AddActionOptionsToImageRiddles.ts

**Metrics:** Lines: 60, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 44 | 🟡 medium | best-practices | no-console | console.log should be replaced with proper logger |
| 57 | 🟡 medium | best-practices | no-console | console.log should be replaced with proper logger |
| 11 | 🔵 low | enterprise | require-jsdoc | Exported class 'AddActionOptionsToImageRiddles1707912000000' missing JSDoc |

### apps\backend\src\image-riddles\entities\image-riddle-action.entity.ts

**Metrics:** Lines: 589, Functions: 13, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 492 | 🔵 low | best-practices | no-magic-numbers | Magic number 5000 should be a named constant |
| 1 | 🔵 low | enterprise | max-file-length | File has 589 lines (max: 500) |
| 532 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'applyActionDefaults' has cyclomatic complexity of 17 (max: 10) |

### apps\backend\src\image-riddles\entities\image-riddle-category.entity.ts

**Metrics:** Lines: 35, Functions: 4, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 12 | 🔵 low | enterprise | require-jsdoc | Exported class 'ImageRiddleCategory' missing JSDoc |

### apps\backend\src\image-riddles\entities\image-riddle.entity.ts

**Metrics:** Lines: 348, Functions: 24, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 329 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 130 | 🔵 low | enterprise | max-function-length | Function 'generateDefaultActionOptions' is 79 lines (max: 50) |

### apps\backend\src\quiz\entities\chapter.entity.ts

**Metrics:** Lines: 24, Functions: 4, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 5 | 🔵 low | enterprise | require-jsdoc | Exported class 'Chapter' missing JSDoc |

### apps\backend\src\quiz\entities\question.entity.ts

**Metrics:** Lines: 41, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 5 | 🔵 low | enterprise | require-jsdoc | Exported class 'Question' missing JSDoc |

### apps\backend\src\quiz\entities\subject.entity.ts

**Metrics:** Lines: 29, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 4 | 🔵 low | enterprise | require-jsdoc | Exported class 'Subject' missing JSDoc |

### apps\backend\src\riddles\entities\quiz-riddle.entity.ts

**Metrics:** Lines: 33, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 4 | 🔵 low | enterprise | require-jsdoc | Exported class 'QuizRiddle' missing JSDoc |

### apps\backend\src\riddles\entities\riddle-category.entity.ts

**Metrics:** Lines: 17, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 4 | 🔵 low | enterprise | require-jsdoc | Exported class 'RiddleCategory' missing JSDoc |

### apps\backend\src\riddles\entities\riddle-chapter.entity.ts

**Metrics:** Lines: 25, Functions: 4, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 5 | 🔵 low | enterprise | require-jsdoc | Exported class 'RiddleChapter' missing JSDoc |

### apps\backend\src\riddles\entities\riddle-subject.entity.ts

**Metrics:** Lines: 30, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 4 | 🔵 low | enterprise | require-jsdoc | Exported class 'RiddleSubject' missing JSDoc |

### apps\backend\src\riddles\entities\riddle.entity.ts

**Metrics:** Lines: 35, Functions: 2, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 5 | 🔵 low | enterprise | require-jsdoc | Exported class 'Riddle' missing JSDoc |

### apps\backend\src\settings\entities\system-setting.entity.ts

**Metrics:** Lines: 20, Functions: 0, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 9 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 3 | 🔵 low | enterprise | require-jsdoc | Exported class 'SystemSetting' missing JSDoc |

### apps\backend\src\users\entities\user.entity.ts

**Metrics:** Lines: 28, Functions: 0, Classes: 1

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 3 | 🔵 low | enterprise | require-jsdoc | Exported class 'User' missing JSDoc |

### apps\frontend\src\app\about\page.tsx

**Metrics:** Lines: 78, Functions: 1, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 3 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'metadata' |
| 8 | 🔵 low | enterprise | require-jsdoc | Exported function 'AboutPage' missing JSDoc |
| 8 | 🔵 low | enterprise | max-function-length | Function 'AboutPage' is 71 lines (max: 50) |

### apps\frontend\src\app\admin\page.tsx

**Metrics:** Lines: 5029, Functions: 460, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 4722 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 4763 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 4764 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 4767 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 4816 | 🟠 high | type-safety | no-any | Usage of "any" type reduces type safety |
| 222 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 302 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 304 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 421 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 551 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 661 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 731 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 860 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 887 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 899 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 924 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1012 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1017 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1141 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1161 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1215 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1216 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1256 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1259 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1260 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1261 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1263 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1287 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1298 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1314 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1394 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1411 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1429 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1430 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1810 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 1823 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2093 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2096 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2097 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2098 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2100 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2147 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2171 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2176 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2194 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2205 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2221 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2236 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2746 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2788 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2791 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2792 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2793 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2795 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2854 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2883 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2901 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2912 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2928 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 2952 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3059 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3545 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3722 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3735 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3748 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3761 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3774 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3820 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3860 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3863 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3864 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3865 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3867 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3900 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3905 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3920 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3931 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3936 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3949 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3967 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3978 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 3994 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 4020 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 4055 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 4133 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 4550 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 4816 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 297 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 658 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 941 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 985 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 1422 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 1699 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 1906 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 2418 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 2559 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 2574 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 3176 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 3248 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 3405 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 3422 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 3679 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 4306 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 4433 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 4450 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 4695 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 5009 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 131 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'initialQuestions' |
| 188 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'initialSubjects' |
| 1034 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'jokeConfig' |
| 1046 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'riddleConfig' |
| 1062 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'imageRiddleConfig' |
| 1993 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'initialJokeCategories' |
| 2000 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'initialJokes' |
| 2010 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'initialRiddles' |
| 1163 | 🔵 low | best-practices | no-magic-numbers | Magic number 90 should be a named constant |
| 1254 | 🔵 low | best-practices | no-magic-numbers | Magic number 500 should be a named constant |
| 2091 | 🔵 low | best-practices | no-magic-numbers | Magic number 500 should be a named constant |
| 2786 | 🔵 low | best-practices | no-magic-numbers | Magic number 500 should be a named constant |
| 3858 | 🔵 low | best-practices | no-magic-numbers | Magic number 500 should be a named constant |
| 4858 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 4876 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 4912 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 4960 | 🔵 low | best-practices | no-magic-numbers | Magic number 90 should be a named constant |
| 4979 | 🔵 low | best-practices | no-magic-numbers | Magic number 3600 should be a named constant |
| 5014 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 5014 | 🔵 low | best-practices | no-magic-numbers | Magic number 90 should be a named constant |
| 5014 | 🔵 low | best-practices | no-magic-numbers | Magic number 120 should be a named constant |
| 5014 | 🔵 low | best-practices | no-magic-numbers | Magic number 180 should be a named constant |
| 4318 | 🟠 high | accessibility | require-img-alt | Image element missing alt attribute |
| 261 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 282 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 309 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 475 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 560 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 567 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 619 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 626 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 650 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 659 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1475 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1483 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1489 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1498 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1504 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1541 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1557 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1567 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1578 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1590 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1616 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1642 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1669 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1722 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1731 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1849 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1867 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1926 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1929 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1982 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1983 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1984 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2308 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2316 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2322 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2331 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2337 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2376 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2444 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2450 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2474 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2482 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2509 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2538 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2592 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2601 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2650 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2660 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2685 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 2694 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3079 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3087 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3093 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3102 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3108 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3132 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3142 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3153 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3161 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3177 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3201 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3263 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3269 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3320 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3328 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3355 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3384 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3442 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3451 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3571 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3590 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3616 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3625 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3645 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3699 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 3700 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4169 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4178 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4186 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4192 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4201 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4207 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4220 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4230 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4248 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4258 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4329 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4335 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4383 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4412 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4470 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4479 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4619 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4640 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4666 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4675 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4690 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4792 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 4814 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1608 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 1635 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 1887 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 1909 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 2368 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 2403 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 2421 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 2502 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 3193 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 3229 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 3251 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 3348 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 3656 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 4161 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 4290 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 4309 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 4376 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 4987 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 197 | 🔵 low | enterprise | require-jsdoc | Exported function 'AdminPage' missing JSDoc |
| 197 | 🔵 low | enterprise | max-function-length | Function 'AdminPage' is 268 lines (max: 50) |
| 487 | 🔵 low | enterprise | max-function-length | Function 'AddSubjectModal' is 92 lines (max: 50) |
| 581 | 🔵 low | enterprise | max-function-length | Function 'AddChapterModal' is 57 lines (max: 50) |
| 972 | 🔵 low | enterprise | max-function-length | Function 'importFromCSV' is 56 lines (max: 50) |
| 1171 | 🔵 low | enterprise | max-function-length | Function 'QuestionManagementSection' is 820 lines (max: 50) |
| 2023 | 🔵 low | enterprise | max-function-length | Function 'JokesSection' is 684 lines (max: 50) |
| 2709 | 🔵 low | enterprise | max-function-length | Function 'RiddlesSection' is 929 lines (max: 50) |
| 3640 | 🔵 low | enterprise | max-function-length | Function 'UsersSection' is 71 lines (max: 50) |
| 3713 | 🔵 low | enterprise | max-function-length | Function 'ImageRiddlesAdminSection' is 998 lines (max: 50) |
| 4713 | 🔵 low | enterprise | max-function-length | Function 'SettingsSection' is 316 lines (max: 50) |
| 1906 | 🔵 low | enterprise | max-function-length | Function 'anonymous' is 66 lines (max: 50) |
| 3248 | 🔵 low | enterprise | max-function-length | Function 'anonymous' is 58 lines (max: 50) |
| 4306 | 🔵 low | enterprise | max-function-length | Function 'anonymous' is 57 lines (max: 50) |
| 1 | 🔵 low | enterprise | max-file-length | File has 5029 lines (max: 500) |
| 197 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'AdminPage' has cyclomatic complexity of 31 (max: 10) |
| 699 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'parseCSV' has cyclomatic complexity of 15 (max: 10) |
| 869 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'validateEntity' has cyclomatic complexity of 14 (max: 10) |
| 1171 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'QuestionManagementSection' has cyclomatic complexity of 91 (max: 10) |
| 2023 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'JokesSection' has cyclomatic complexity of 73 (max: 10) |
| 2709 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'RiddlesSection' has cyclomatic complexity of 102 (max: 10) |
| 3713 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'ImageRiddlesAdminSection' has cyclomatic complexity of 113 (max: 10) |
| 4713 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'SettingsSection' has cyclomatic complexity of 37 (max: 10) |

### apps\frontend\src\app\image-riddles\layout.tsx

**Metrics:** Lines: 23, Functions: 1, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 11 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'metadata' |
| 16 | 🔵 low | enterprise | require-jsdoc | Exported function 'ImageRiddlesLayout' missing JSDoc |

### apps\frontend\src\app\image-riddles\page.tsx

**Metrics:** Lines: 1014, Functions: 54, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 681 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 956 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 306 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 681 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 728 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 763 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 54 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'difficultyColors' |
| 61 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'difficultyLabels' |
| 68 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'DEFAULT_AUTO_TIMER' |
| 70 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'defaultTimers' |
| 77 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'SAMPLE_RIDDLES' |
| 102 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'SAMPLE_CATEGORIES' |
| 110 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'useTimer' |
| 206 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'getEffectiveTimer' |
| 211 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'formatTime' |
| 227 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'TimerDisplay' |
| 294 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'ManualTimerSettings' |
| 208 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 212 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 213 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 260 | 🔵 low | best-practices | no-magic-numbers | Magic number 45 should be a named constant |
| 261 | 🔵 low | best-practices | no-magic-numbers | Magic number 45 should be a named constant |
| 300 | 🔵 low | best-practices | no-magic-numbers | Magic number 30 should be a named constant |
| 300 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 300 | 🔵 low | best-practices | no-magic-numbers | Magic number 120 should be a named constant |
| 300 | 🔵 low | best-practices | no-magic-numbers | Magic number 180 should be a named constant |
| 300 | 🔵 low | best-practices | no-magic-numbers | Magic number 300 should be a named constant |
| 317 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 317 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 439 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 447 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 448 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 531 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 545 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 652 | 🔵 low | best-practices | no-magic-numbers | Magic number 60 should be a named constant |
| 774 | 🟠 high | accessibility | require-img-alt | Image element missing alt attribute |
| 844 | 🟠 high | accessibility | require-img-alt | Image element missing alt attribute |
| 307 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 335 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 671 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 682 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 699 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 709 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 754 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 828 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 858 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 868 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 894 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 902 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 909 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 999 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 322 | 🟡 medium | accessibility | require-input-label | Form input without associated label |
| 426 | 🔵 low | enterprise | require-jsdoc | Exported function 'ImageRiddlesPage' missing JSDoc |
| 426 | 🔵 low | enterprise | max-function-length | Function 'ImageRiddlesPage' is 588 lines (max: 50) |
| 110 | 🔵 low | enterprise | max-function-length | Function 'anonymous' is 92 lines (max: 50) |
| 227 | 🔵 low | enterprise | max-function-length | Function 'anonymous' is 56 lines (max: 50) |
| 294 | 🔵 low | enterprise | max-function-length | Function 'anonymous' is 52 lines (max: 50) |
| 1 | 🔵 low | enterprise | max-file-length | File has 1014 lines (max: 500) |
| 426 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'ImageRiddlesPage' has cyclomatic complexity of 63 (max: 10) |
| 110 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'anonymous' has cyclomatic complexity of 12 (max: 10) |

### apps\frontend\src\app\jokes\page.tsx

**Metrics:** Lines: 80, Functions: 2, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 53 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 4 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'metadata' |
| 9 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'jokeCategories' |
| 36 | 🔵 low | enterprise | require-jsdoc | Exported function 'JokesPage' missing JSDoc |

### apps\frontend\src\app\quiz\page.tsx

**Metrics:** Lines: 524, Functions: 26, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 62 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 147 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 206 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 225 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 299 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 303 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 328 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 351 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 437 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 441 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 466 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 489 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 207 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 226 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 306 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 329 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 352 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 369 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 444 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 467 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 490 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 507 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 517 | 🔵 low | enterprise | require-jsdoc | Exported function 'QuizPage' missing JSDoc |
| 78 | 🔵 low | enterprise | max-function-length | Function 'ChapterSelection' is 84 lines (max: 50) |
| 163 | 🔵 low | enterprise | max-function-length | Function 'LevelSelection' is 77 lines (max: 50) |
| 241 | 🔵 low | enterprise | max-function-length | Function 'TimerChallengesPage' is 137 lines (max: 50) |
| 379 | 🔵 low | enterprise | max-function-length | Function 'PracticeModePage' is 137 lines (max: 50) |
| 1 | 🔵 low | enterprise | max-file-length | File has 524 lines (max: 500) |

### apps\frontend\src\app\riddles\page.tsx

**Metrics:** Lines: 105, Functions: 2, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 88 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 4 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'metadata' |
| 9 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'riddleChapters' |
| 60 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 72 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 32 | 🔵 low | enterprise | require-jsdoc | Exported function 'RiddlesPage' missing JSDoc |
| 32 | 🔵 low | enterprise | max-function-length | Function 'RiddlesPage' is 73 lines (max: 50) |

### apps\frontend\src\components\image-riddles\ActionOptions.tsx

**Metrics:** Lines: 691, Functions: 34, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 452 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 465 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 530 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 617 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 145 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'STYLE_CLASSES' |
| 156 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'SIZE_CLASSES' |
| 164 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'BADGE_CLASSES' |
| 236 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'LoadingSpinner' |
| 270 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'Tooltip' |
| 295 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'ConfirmDialog' |
| 336 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'ActionButton' |
| 282 | 🔵 low | best-practices | no-magic-numbers | Magic number 30 should be a named constant |
| 357 | 🔵 low | best-practices | no-magic-numbers | Magic number 600 should be a named constant |
| 400 | 🔵 low | best-practices | no-magic-numbers | Magic number 99 should be a named constant |
| 401 | 🔵 low | best-practices | no-magic-numbers | Magic number 99 should be a named constant |
| 443 | 🔵 low | best-practices | no-magic-numbers | Magic number 200 should be a named constant |
| 576 | 🔵 low | best-practices | no-magic-numbers | Magic number 500 should be a named constant |
| 622 | 🔵 low | best-practices | no-magic-numbers | Magic number 50 should be a named constant |
| 315 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 321 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 463 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 44 | 🔵 low | enterprise | require-jsdoc | Exported interface 'IActionOption' missing JSDoc |
| 104 | 🔵 low | enterprise | require-jsdoc | Exported interface 'ActionOptionsProps' missing JSDoc |
| 126 | 🔵 low | enterprise | require-jsdoc | Exported interface 'ActionOptionsState' missing JSDoc |
| 342 | 🔵 low | enterprise | max-function-length | Function 'anonymous' is 130 lines (max: 50) |
| 477 | 🔵 low | enterprise | max-function-length | Function 'anonymous' is 212 lines (max: 50) |
| 1 | 🔵 low | enterprise | max-file-length | File has 691 lines (max: 500) |
| 179 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'shouldShowAction' has cyclomatic complexity of 17 (max: 10) |
| 342 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'anonymous' has cyclomatic complexity of 33 (max: 10) |
| 477 | 🟡 medium | enterprise | max-cyclomatic-complexity | Function 'anonymous' has cyclomatic complexity of 23 (max: 10) |

### apps\frontend\src\components\ui\BulkActionToolbar.tsx

**Metrics:** Lines: 511, Functions: 8, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 72 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 93 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 248 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 308 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 104 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 105 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 106 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 115 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 116 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 117 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 118 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 381 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 382 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 383 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 384 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 440 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 72 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'ACTION_ICONS' |
| 83 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'ConfirmationModal' |
| 243 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'ActionButton' |
| 193 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 207 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 260 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 421 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 455 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 485 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 1 | 🔵 low | enterprise | max-file-length | File has 511 lines (max: 500) |

### apps\frontend\src\components\ui\StatusDashboard.tsx

**Metrics:** Lines: 447, Functions: 9, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 58 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 68 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 134 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 391 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 213 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 214 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 215 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 227 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 259 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 260 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 261 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 274 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 275 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 276 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 318 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 319 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 289 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 391 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 427 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 58 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'ICONS' |
| 68 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'COLOR_CONFIG' |
| 123 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'StatusCard' |
| 335 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |

### apps\frontend\src\components\ui\ThemeToggle.tsx

**Metrics:** Lines: 174, Functions: 2, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 134 | 🟡 medium | type-safety | no-unsafe-type-assertion | Type assertion without validation detected |
| 39 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 96 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |
| 17 | 🔵 low | enterprise | require-jsdoc | Exported function 'ThemeToggle' missing JSDoc |
| 11 | 🔵 low | enterprise | require-jsdoc | Exported interface 'ThemeToggleProps' missing JSDoc |
| 17 | 🔵 low | enterprise | max-function-length | Function 'ThemeToggle' is 155 lines (max: 50) |

### apps\frontend\src\components\ui\ToastContainer.tsx

**Metrics:** Lines: 160, Functions: 4, Classes: 0

| Line | Severity | Category | Rule | Description |
|------|----------|----------|------|-------------|
| 71 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 72 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 73 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 74 | 🟡 medium | performance | no-object-literal-in-jsx | Object/array literal in JSX causes unnecessary re-renders |
| 149 | 🟠 high | performance | require-react-keys | List items may be missing React keys |
| 29 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'TOAST_ICONS' |
| 39 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'TOAST_STYLES' |
| 52 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'ICON_STYLES' |
| 62 | 🟡 medium | best-practices | no-unused-variables | Unused variable: 'ToastItem' |
| 85 | 🟡 medium | accessibility | require-aria-label | Button without accessible label |


## Detailed Issues

<details>
<summary>Click to expand all issues</summary>

### ISS-1771153487103-YTB1DK2BU

- **File:** `apps\frontend\tailwind.config.ts:3:46`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'config'

**Code:**
```typescript
config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153487114-W92MMPDA6

- **File:** `apps\backend\src\app.module.ts:87:2791`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'configure' is missing explicit return type

**Code:**
```typescript
configure(consumer: MiddlewareConsumer) {
    consumer.apply(helmet()).forRoutes('*');
  }
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487117-F65KTP12N

- **File:** `apps\backend\src\app.module.ts:37:1474`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 5432 should be a named constant

**Code:**
```typescript
5432
```

**Suggested Fix:** Define constant: const MAX_VALUE = 5432

---

### ISS-1771153487118-0RYCRQEH3

- **File:** `apps\backend\src\app.module.ts:23:1113`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'AppModule' missing JSDoc

**Code:**
```typescript
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
  
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487127-YLG6FEGL8

- **File:** `apps\backend\src\main.ts:8:294`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'bootstrap' is missing explicit return type

**Code:**
```typescript
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFac
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487130-RG8JKM3H1

- **File:** `apps\backend\src\main.ts:62:2158`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 4000 should be a named constant

**Code:**
```typescript
4000
```

**Suggested Fix:** Define constant: const MAX_VALUE = 4000

---

### ISS-1771153487130-R5VJDOE5R

- **File:** `apps\backend\src\main.ts:69:2447`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 43 should be a named constant

**Code:**
```typescript
43
```

**Suggested Fix:** Define constant: const MAX_VALUE = 43

---

### ISS-1771153487131-BR1DTX07W

- **File:** `apps\backend\src\main.ts:8:294`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'bootstrap' is 68 lines (max: 50)

**Code:**
```typescript
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFac
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153487134-C5014P17M

- **File:** `apps\backend\src\auth\auth.controller.ts:10:298`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'register' is missing explicit return type

**Code:**
```typescript
@Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487134-LBBJ4M5T2

- **File:** `apps\backend\src\auth\auth.controller.ts:20:576`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'login' is missing explicit return type

**Code:**
```typescript
@Post('login')
  @ApiOperation({ summary: 'Login user' })
  async login(
    @Body('email') email
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487135-2WKBT8628

- **File:** `apps\backend\src\auth\auth.controller.ts:5:165`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'AuthController' missing JSDoc

**Code:**
```typescript
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487138-9MJX4ESDS

- **File:** `apps\backend\src\auth\auth.module.ts:10:402`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'AuthModule' missing JSDoc

**Code:**
```typescript
@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487141-V8U6X4NNA

- **File:** `apps\backend\src\auth\auth.service.ts:12:317`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'register' is missing explicit return type

**Code:**
```typescript
async register(email: string, password: string, name: string) {
    const existingUser = await this
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487141-U4K5SID4F

- **File:** `apps\backend\src\auth\auth.service.ts:24:818`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'login' is missing explicit return type

**Code:**
```typescript
async login(email: string, password: string) {
    const user = await this.usersService.findByEmail
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487141-LAIKD1JG8

- **File:** `apps\backend\src\auth\auth.service.ts:39:1392`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'validateUser' is missing explicit return type

**Code:**
```typescript
async validateUser(id: string) {
    return this.usersService.findById(id);
  }
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487142-8IVD26K7L

- **File:** `apps\backend\src\auth\auth.service.ts:5:170`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'AuthService' missing JSDoc

**Code:**
```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,

```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487143-CD4RUYGR2

- **File:** `apps\backend\src\auth\jwt-auth.guard.ts:26:728`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
user: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487143-AU1YS819L

- **File:** `apps\backend\src\auth\jwt-auth.guard.ts:26:728`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
info: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487143-W4KE6NQOP

- **File:** `apps\backend\src\auth\jwt-auth.guard.ts:12:388`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'canActivate' is missing explicit return type

**Code:**
```typescript
canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPub
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487143-EBURLKKVE

- **File:** `apps\backend\src\auth\jwt-auth.guard.ts:26:728`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'handleRequest' is missing explicit return type

**Code:**
```typescript
handleRequest(err: Error | null, user: any, info: any) {
    if (err || !user) {
      throw err |
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487144-94NI5HJNP

- **File:** `apps\backend\src\auth\jwt-auth.guard.ts:6:251`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'JwtAuthGuard' missing JSDoc

**Code:**
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487145-NMCQOSOEP

- **File:** `apps\backend\src\auth\jwt.strategy.ts:20:633`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'validate' is missing explicit return type

**Code:**
```typescript
async validate(payload: { id: string; email: string; role: string }) {
    return await this.authSe
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487146-44IIVT048

- **File:** `apps\backend\src\auth\jwt.strategy.ts:7:252`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'JwtStrategy' missing JSDoc

**Code:**
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    pr
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487203-Y8LCKNT71

- **File:** `apps\backend\src\dad-jokes\dad-jokes.controller.ts:243:9571`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const MAX_VALUE = 20

---

### ISS-1771153487204-Y5O62G5HS

- **File:** `apps\backend\src\dad-jokes\dad-jokes.controller.ts:40:1244`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'DadJokesController' missing JSDoc

**Code:**
```typescript
@ApiTags('Dad Jokes')
@Controller('jokes')
export class DadJokesController {
  constructor(privat
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487209-Z4784133F

- **File:** `apps\backend\src\dad-jokes\dad-jokes.module.ts:13:653`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'DadJokesModule' missing JSDoc

**Code:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([DadJoke, JokeCategory, JokeSubject, JokeChapter, Qu
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487219-I8ZV9AZEF

- **File:** `apps\backend\src\dad-jokes\dad-jokes.service.ts:58:2230`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
where: any = {}
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487238-2ZGQKINK5

- **File:** `apps\backend\src\dad-jokes\dad-jokes.service.ts:203:7295`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153487238-0RQ08I9GE

- **File:** `apps\backend\src\dad-jokes\dad-jokes.service.ts:273:9494`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153487240-CCLABSMJP

- **File:** `apps\backend\src\dad-jokes\dad-jokes.service.ts:29:1214`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'DadJokesService' missing JSDoc

**Code:**
```typescript
@Injectable()
export class DadJokesService {
  private readonly logger = new Logger(DadJokesServic
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487246-J7YI0X1RN

- **File:** `apps\backend\src\dad-jokes\dad-jokes.service.ts:1:0`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-file-length
- **Auto-Fixable:** No

**Description:** File has 535 lines (max: 500)

**Code:**
```typescript
Total lines: 535
```

**Suggested Fix:** Split into multiple files or modules

---

### ISS-1771153487249-GZY5170OM

- **File:** `apps\backend\src\dad-jokes\dad-jokes.service.ts:434:14604`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'updateQuizJoke' has cyclomatic complexity of 14 (max: 10)

**Code:**
```typescript
async updateQuizJoke(id: string, dto: Partial<CreateQuizJokeDto>): Promise<QuizJoke> {
    const jo
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153487266-LPFXXUCRL

- **File:** `apps\backend\src\database\data-source.ts:6:115`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'dataSourceOptions'

**Code:**
```typescript
dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'local
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153487302-NG32H5JGB

- **File:** `apps\backend\src\database\data-source.ts:19:586`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'dataSource'

**Code:**
```typescript
dataSource = new DataSource(dataSourceOptions)
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153487304-DHLP3H8FI

- **File:** `apps\backend\src\database\seed.ts:32:1485`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
any[]
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487305-E80VD1UOF

- **File:** `apps\backend\src\database\seed.ts:56:3013`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
any[]
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487306-CP0SIMND7

- **File:** `apps\backend\src\database\seed.ts:94:4763`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
any[]
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487306-4OCSB9RQJ

- **File:** `apps\backend\src\database\seed.ts:128:6231`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
any[]
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487307-XLMDGDZYZ

- **File:** `apps\backend\src\database\seed.ts:14:416`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'seed' is missing explicit return type

**Code:**
```typescript
async function seed() {
  await AppDataSource.initialize();
  console.log('📦 Seeding database...'
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487309-EV1STSFV7

- **File:** `apps\backend\src\database\seed.ts:16:2`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-console
- **Auto-Fixable:** Yes

**Description:** console.log should be replaced with proper logger

**Code:**
```typescript
console.log('📦 Seeding database...');
```

**Suggested Fix:** Use a structured logging library like winston or pino

---

### ISS-1771153487309-MA7VG1G5Q

- **File:** `apps\backend\src\database\seed.ts:40:2`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-console
- **Auto-Fixable:** Yes

**Description:** console.log should be replaced with proper logger

**Code:**
```typescript
console.log(`✅ Inserted ${subjects.length} subjects`);
```

**Suggested Fix:** Use a structured logging library like winston or pino

---

### ISS-1771153487309-L3FDR3MGK

- **File:** `apps\backend\src\database\seed.ts:67:2`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-console
- **Auto-Fixable:** Yes

**Description:** console.log should be replaced with proper logger

**Code:**
```typescript
console.log(`✅ Inserted ${insertedChapters.length} chapters`);
```

**Suggested Fix:** Use a structured logging library like winston or pino

---

### ISS-1771153487309-7Q41Z2D5D

- **File:** `apps\backend\src\database\seed.ts:85:2`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-console
- **Auto-Fixable:** Yes

**Description:** console.log should be replaced with proper logger

**Code:**
```typescript
console.log(`✅ Inserted ${sampleQuestions.length} questions`);
```

**Suggested Fix:** Use a structured logging library like winston or pino

---

### ISS-1771153487309-5D9ESU2QP

- **File:** `apps\backend\src\database\seed.ts:102:2`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-console
- **Auto-Fixable:** Yes

**Description:** console.log should be replaced with proper logger

**Code:**
```typescript
console.log(`✅ Inserted ${jokeCategories.length} joke categories`);
```

**Suggested Fix:** Use a structured logging library like winston or pino

---

### ISS-1771153487309-2M733B8YE

- **File:** `apps\backend\src\database\seed.ts:119:2`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-console
- **Auto-Fixable:** Yes

**Description:** console.log should be replaced with proper logger

**Code:**
```typescript
console.log(`✅ Inserted ${dadJokes.length} dad jokes`);
```

**Suggested Fix:** Use a structured logging library like winston or pino

---

### ISS-1771153487309-DAY1YZJG4

- **File:** `apps\backend\src\database\seed.ts:136:2`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-console
- **Auto-Fixable:** Yes

**Description:** console.log should be replaced with proper logger

**Code:**
```typescript
console.log(`✅ Inserted ${riddleCategories.length} riddle categories`);
```

**Suggested Fix:** Use a structured logging library like winston or pino

---

### ISS-1771153487309-5L5PBMT36

- **File:** `apps\backend\src\database\seed.ts:153:2`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-console
- **Auto-Fixable:** Yes

**Description:** console.log should be replaced with proper logger

**Code:**
```typescript
console.log(`✅ Inserted ${riddles.length} riddles`);
```

**Suggested Fix:** Use a structured logging library like winston or pino

---

### ISS-1771153487309-D6VVZDTF3

- **File:** `apps\backend\src\database\seed.ts:161:2`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-console
- **Auto-Fixable:** Yes

**Description:** console.log should be replaced with proper logger

**Code:**
```typescript
console.log('✅ Inserted admin user (email: admin@aiquiz.com, password: admin123)');
```

**Suggested Fix:** Use a structured logging library like winston or pino

---

### ISS-1771153487309-9FGX9ADXO

- **File:** `apps\backend\src\database\seed.ts:164:2`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-console
- **Auto-Fixable:** Yes

**Description:** console.log should be replaced with proper logger

**Code:**
```typescript
console.log('🎉 Database seeding completed!');
```

**Suggested Fix:** Use a structured logging library like winston or pino

---

### ISS-1771153487313-TQQIHI889

- **File:** `apps\backend\src\database\seed.ts:4:76`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'AppDataSource'

**Code:**
```typescript
AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',

```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153487316-XRO4GDQJY

- **File:** `apps\backend\src\database\seed.ts:14:416`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'seed' is 152 lines (max: 50)

**Code:**
```typescript
async function seed() {
  await AppDataSource.initialize();
  console.log('📦 Seeding database...'
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153487317-H7P53MQ03

- **File:** `apps\backend\src\database\seed.ts:14:416`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'seed' has cyclomatic complexity of 25 (max: 10)

**Code:**
```typescript
async function seed() {
  await AppDataSource.initialize();
  console.log('📦 Seeding database...'
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153487318-39LQTTAUR

- **File:** `apps\backend\src\health\health.controller.ts:21:533`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'check' is missing explicit return type

**Code:**
```typescript
@Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check overall health status' })
  check() {

```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487318-MO0SYNOBL

- **File:** `apps\backend\src\health\health.controller.ts:35:1054`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'liveness' is missing explicit return type

**Code:**
```typescript
@Get('liveness')
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  liveness() {
    ret
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487318-DLQE0VOCA

- **File:** `apps\backend\src\health\health.controller.ts:41:1223`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'readiness' is missing explicit return type

**Code:**
```typescript
@Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  r
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487319-TONTWOVBD

- **File:** `apps\backend\src\health\health.controller.ts:29:812`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 150 should be a named constant

**Code:**
```typescript
150
```

**Suggested Fix:** Define constant: const MAX_VALUE = 150

---

### ISS-1771153487319-7PTUTCG00

- **File:** `apps\backend\src\health\health.controller.ts:29:812`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 1024 should be a named constant

**Code:**
```typescript
1024
```

**Suggested Fix:** Define constant: const MAX_VALUE = 1024

---

### ISS-1771153487319-107N3Y6TW

- **File:** `apps\backend\src\health\health.controller.ts:29:812`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 1024 should be a named constant

**Code:**
```typescript
1024
```

**Suggested Fix:** Define constant: const MAX_VALUE = 1024

---

### ISS-1771153487319-ZDZQZMXT0

- **File:** `apps\backend\src\health\health.controller.ts:30:882`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 150 should be a named constant

**Code:**
```typescript
150
```

**Suggested Fix:** Define constant: const MAX_VALUE = 150

---

### ISS-1771153487319-DWF1C956S

- **File:** `apps\backend\src\health\health.controller.ts:30:882`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 1024 should be a named constant

**Code:**
```typescript
1024
```

**Suggested Fix:** Define constant: const MAX_VALUE = 1024

---

### ISS-1771153487319-129EZLH2V

- **File:** `apps\backend\src\health\health.controller.ts:30:882`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 1024 should be a named constant

**Code:**
```typescript
1024
```

**Suggested Fix:** Define constant: const MAX_VALUE = 1024

---

### ISS-1771153487319-LZYYUAR5H

- **File:** `apps\backend\src\health\health.controller.ts:11:265`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'HealthController' missing JSDoc

**Code:**
```typescript
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    priv
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487320-62FKFDGKF

- **File:** `apps\backend\src\health\health.module.ts:5:153`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'HealthModule' missing JSDoc

**Code:**
```typescript
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class Health
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487330-Q2ZPRG754

- **File:** `apps\backend\src\image-riddles\image-riddles.controller.ts:40:1339`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'ImageRiddlesController' missing JSDoc

**Code:**
```typescript
@ApiTags('Image Riddles')
@Controller('image-riddles')
export class ImageRiddlesController {
  co
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487333-LAM1ZENGC

- **File:** `apps\backend\src\image-riddles\image-riddles.module.ts:18:848`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'ImageRiddlesModule' missing JSDoc

**Code:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([ImageRiddle, ImageRiddleCategory])],
  controllers
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487341-XWTNABNZ0

- **File:** `apps\backend\src\image-riddles\image-riddles.service.ts:130:4573`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
where: any = { isActive: true }
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487345-99YPE8WRB

- **File:** `apps\backend\src\image-riddles\image-riddles.service.ts:363:12556`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
undefined as any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487345-OZ7T0FAAG

- **File:** `apps\backend\src\image-riddles\image-riddles.service.ts:364:12601`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
undefined as any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487350-ZHON8JHM1

- **File:** `apps\backend\src\image-riddles\image-riddles.service.ts:363:12556`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
undefined as any
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153487350-UB7DRKV8G

- **File:** `apps\backend\src\image-riddles\image-riddles.service.ts:364:12601`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
undefined as any
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153487356-8VSQH2QIO

- **File:** `apps\backend\src\image-riddles\image-riddles.service.ts:34:1423`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'ImageRiddlesService' missing JSDoc

**Code:**
```typescript
@Injectable()
export class ImageRiddlesService {
  private readonly logger = new Logger(ImageRiddl
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487360-X0PQZB22H

- **File:** `apps\backend\src\image-riddles\image-riddles.service.ts:235:8198`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'createRiddle' is 51 lines (max: 50)

**Code:**
```typescript
async createRiddle(dto: CreateImageRiddleDto): Promise<ImageRiddle> {
    let category: ImageRiddle
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153487360-NR8B7NYX9

- **File:** `apps\backend\src\image-riddles\image-riddles.service.ts:319:11069`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'updateRiddle' is 77 lines (max: 50)

**Code:**
```typescript
async updateRiddle(id: string, dto: UpdateImageRiddleDto): Promise<ImageRiddle> {
    const riddle 
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153487362-4Q1YNG8DB

- **File:** `apps\backend\src\image-riddles\image-riddles.service.ts:235:8198`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'createRiddle' has cyclomatic complexity of 12 (max: 10)

**Code:**
```typescript
async createRiddle(dto: CreateImageRiddleDto): Promise<ImageRiddle> {
    let category: ImageRiddle
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153487363-OMW98BD5C

- **File:** `apps\backend\src\image-riddles\image-riddles.service.ts:319:11069`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'updateRiddle' has cyclomatic complexity of 20 (max: 10)

**Code:**
```typescript
async updateRiddle(id: string, dto: UpdateImageRiddleDto): Promise<ImageRiddle> {
    const riddle 
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153487370-DR7S9BBB9

- **File:** `apps\backend\src\quiz\quiz.controller.ts:160:5365`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const MAX_VALUE = 20

---

### ISS-1771153487371-3PND4HGVR

- **File:** `apps\backend\src\quiz\quiz.controller.ts:30:928`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'QuizController' missing JSDoc

**Code:**
```typescript
@ApiTags('Quiz')
@Controller('quiz')
export class QuizController {
  constructor(private readonly
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487374-VVMBFEXBB

- **File:** `apps\backend\src\quiz\quiz.module.ts:11:498`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'QuizModule' missing JSDoc

**Code:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Subject, Chapter, Question])],
  controllers: [Qui
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487379-U5J0L0SDP

- **File:** `apps\backend\src\quiz\quiz.service.ts:121:4787`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
where: any = {}
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487386-33CY7BTD9

- **File:** `apps\backend\src\quiz\quiz.service.ts:15:871`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'QuizService' missing JSDoc

**Code:**
```typescript
@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487405-1XY67HGUS

- **File:** `apps\backend\src\riddles\riddles.controller.ts:253:10130`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const MAX_VALUE = 20

---

### ISS-1771153487405-T4K39WPQS

- **File:** `apps\backend\src\riddles\riddles.controller.ts:40:1271`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'RiddlesController' missing JSDoc

**Code:**
```typescript
@ApiTags('Riddles')
@Controller('riddles')
export class RiddlesController {
  constructor(private
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487410-PW7LJ9WEP

- **File:** `apps\backend\src\riddles\riddles.module.ts:13:662`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'RiddlesModule' missing JSDoc

**Code:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Riddle, RiddleCategory, RiddleSubject, RiddleChapte
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487416-SIRHSQBHX

- **File:** `apps\backend\src\riddles\riddles.service.ts:58:2242`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
where: any = {}
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487432-7YGIS757C

- **File:** `apps\backend\src\riddles\riddles.service.ts:241:8536`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153487432-2Z39BG63B

- **File:** `apps\backend\src\riddles\riddles.service.ts:311:10768`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153487434-Z68RVFALZ

- **File:** `apps\backend\src\riddles\riddles.service.ts:29:1244`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'RiddlesService' missing JSDoc

**Code:**
```typescript
@Injectable()
export class RiddlesService {
  private readonly logger = new Logger(RiddlesService.
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487438-E19B9EDRP

- **File:** `apps\backend\src\riddles\riddles.service.ts:1:0`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-file-length
- **Auto-Fixable:** No

**Description:** File has 581 lines (max: 500)

**Code:**
```typescript
Total lines: 581
```

**Suggested Fix:** Split into multiple files or modules

---

### ISS-1771153487442-UC9T9LTX5

- **File:** `apps\backend\src\riddles\riddles.service.ts:185:6469`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'updateRiddle' has cyclomatic complexity of 11 (max: 10)

**Code:**
```typescript
async updateRiddle(id: string, dto: Partial<CreateRiddleDto>): Promise<Riddle> {
    const riddle =
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153487442-A0K4TVCMF

- **File:** `apps\backend\src\riddles\riddles.service.ts:472:15907`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'updateQuizRiddle' has cyclomatic complexity of 14 (max: 10)

**Code:**
```typescript
async updateQuizRiddle(id: string, dto: Partial<CreateQuizRiddleDto>): Promise<QuizRiddle> {
    co
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153487443-4OZFCIFCD

- **File:** `apps\backend\src\settings\settings.controller.ts:20:660`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
Record<string, any>
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487443-5P6BDEM2V

- **File:** `apps\backend\src\settings\settings.controller.ts:12:498`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'getSettings' is missing explicit return type

**Code:**
```typescript
@Get()
    // @Roles('admin')
    async getSettings() {
        return this.settingsService.getSe
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487443-GBDI2X61M

- **File:** `apps\backend\src\settings\settings.controller.ts:18:622`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'updateSettings' is missing explicit return type

**Code:**
```typescript
@Patch()
    // @Roles('admin')
    async updateSettings(@Body() updates: Record<string, any>) {

```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487443-G23V9T92Q

- **File:** `apps\backend\src\settings\settings.controller.ts:7:323`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'SettingsController' missing JSDoc

**Code:**
```typescript
@Controller('settings')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487444-RLD2Z8XI3

- **File:** `apps\backend\src\settings\settings.module.ts:7:277`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'SettingsModule' missing JSDoc

**Code:**
```typescript
@Module({
    imports: [TypeOrmModule.forFeature([SystemSetting])],
    controllers: [SettingsCont
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487445-O7YVEGSCO

- **File:** `apps\backend\src\settings\settings.service.ts:9:340`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
private effectiveSettings: any = {};
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487445-X4M0Z6QZ1

- **File:** `apps\backend\src\settings\settings.service.ts:38:1127`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
obj: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487445-SCFBP2GB6

- **File:** `apps\backend\src\settings\settings.service.ts:38:1127`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
value: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487445-M0HEJLJYR

- **File:** `apps\backend\src\settings\settings.service.ts:60:1873`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
target: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487445-192TKD853

- **File:** `apps\backend\src\settings\settings.service.ts:60:1873`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
source: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487446-FWRG7A98O

- **File:** `apps\backend\src\settings\settings.service.ts:80:2427`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
get(key: string): any {
        const parts = key.split('.');
        let current = this.effective
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487446-6KWMYLMCP

- **File:** `apps\backend\src\settings\settings.service.ts:95:2776`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
value: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487446-3TPHCFFC0

- **File:** `apps\backend\src\settings\settings.service.ts:115:3324`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
Record<string, any>
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487446-VZ1DO8C7R

- **File:** `apps\backend\src\settings\settings.service.ts:16:521`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'onModuleInit' is missing explicit return type

**Code:**
```typescript
async onModuleInit() {
        await this.refreshSettings();
    }
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487446-RLEUY315L

- **File:** `apps\backend\src\settings\settings.service.ts:23:670`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'refreshSettings' is missing explicit return type

**Code:**
```typescript
async refreshSettings() {
        const overrides = await this.settingsRepository.find();

      
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487446-798P2WHNH

- **File:** `apps\backend\src\settings\settings.service.ts:38:1127`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'applyOverride' is missing explicit return type

**Code:**
```typescript
private applyOverride(obj: any, key: string, value: any) {
        const parts = key.split('.');
 
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487446-4G01NR5MJ

- **File:** `apps\backend\src\settings\settings.service.ts:60:1873`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'deepMerge' is missing explicit return type

**Code:**
```typescript
private deepMerge(target: any, source: any) {
        for (const key of Object.keys(source)) {
   
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487446-UOOKQKXOG

- **File:** `apps\backend\src\settings\settings.service.ts:73:2294`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'getSettings' is missing explicit return type

**Code:**
```typescript
getSettings() {
        return this.effectiveSettings;
    }
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487446-ME7ABIC1T

- **File:** `apps\backend\src\settings\settings.service.ts:95:2776`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'updateSetting' is missing explicit return type

**Code:**
```typescript
async updateSetting(key: string, value: any) {
        let setting = await this.settingsRepository.
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487446-KX9F87FKV

- **File:** `apps\backend\src\settings\settings.service.ts:115:3324`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'updateSettings' is missing explicit return type

**Code:**
```typescript
async updateSettings(updates: Record<string, any>) {
        // Process potentially complex object 
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487448-JYBPWGG4T

- **File:** `apps\backend\src\settings\settings.service.ts:7:269`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'SettingsService' missing JSDoc

**Code:**
```typescript
@Injectable()
export class SettingsService implements OnModuleInit {
    private effectiveSettings
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487449-VFY6CVN9N

- **File:** `apps\backend\src\users\users.controller.ts:19:572`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
@Request() req: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487449-GQPKFEIZG

- **File:** `apps\backend\src\users\users.controller.ts:32:926`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
@Request() req: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153487449-Z8TGQCXOQ

- **File:** `apps\backend\src\users\users.controller.ts:10:351`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'getAll' is missing explicit return type

**Code:**
```typescript
@Get()
  @ApiOperation({ summary: 'Get all users' })
  async getAll() {
    return this.usersServ
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487449-YFHN3C4P0

- **File:** `apps\backend\src\users\users.controller.ts:16:475`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'getProfile' is missing explicit return type

**Code:**
```typescript
@Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  asy
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487449-SW2XO34AT

- **File:** `apps\backend\src\users\users.controller.ts:23:676`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'getById' is missing explicit return type

**Code:**
```typescript
@Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getById(@Param('id') id: string
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487449-IDDGW8IWF

- **File:** `apps\backend\src\users\users.controller.ts:29:834`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'updateProfile' is missing explicit return type

**Code:**
```typescript
@Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  async up
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487450-EG666JHX5

- **File:** `apps\backend\src\users\users.controller.ts:5:213`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UsersController' missing JSDoc

**Code:**
```typescript
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private reado
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487450-282ZFYZOP

- **File:** `apps\backend\src\users\users.module.ts:7:246`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UsersModule' missing JSDoc

**Code:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  prov
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487452-YYCL2UWAS

- **File:** `apps\backend\src\users\users.service.ts:7:242`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UsersService' missing JSDoc

**Code:**
```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487470-ZJMBV6OQB

- **File:** `apps\frontend\src\app\layout.tsx:9:318`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'inter'

**Code:**
```typescript
inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153487480-008EQTBWM

- **File:** `apps\frontend\src\app\layout.tsx:15:420`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'metadata'

**Code:**
```typescript
metadata: Metadata = {
  title: {
    default: 'AI Quiz - Interactive Learning Platform',
    tem
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153487489-M47GWY99S

- **File:** `apps\frontend\src\app\layout.tsx:67:1830`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'viewport'

**Code:**
```typescript
viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffff
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153487490-17JHFIJBT

- **File:** `apps\frontend\src\app\layout.tsx:78:2118`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'RootLayout' missing JSDoc

**Code:**
```typescript
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>):
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487492-LGL0I9EU0

- **File:** `apps\frontend\src\app\not-found.tsx:3:33`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'NotFoundPage' missing JSDoc

**Code:**
```typescript
export default function NotFoundPage(): JSX.Element {
  return (
    <main id="main-content" class
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487505-NI3YTQZLU

- **File:** `apps\frontend\src\app\page.tsx:16:50`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{[50, 80, 60, 90, 70, 55, 85, 65, 75, 95].map((size, i) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153487506-WMKKO8ACR

- **File:** `apps\frontend\src\app\page.tsx:16:715`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 50 should be a named constant

**Code:**
```typescript
50
```

**Suggested Fix:** Define constant: const MAX_VALUE = 50

---

### ISS-1771153487506-21IRX42NU

- **File:** `apps\frontend\src\app\page.tsx:16:715`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 80 should be a named constant

**Code:**
```typescript
80
```

**Suggested Fix:** Define constant: const MAX_VALUE = 80

---

### ISS-1771153487506-LJKMKRJS6

- **File:** `apps\frontend\src\app\page.tsx:16:715`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153487506-R3T2U153L

- **File:** `apps\frontend\src\app\page.tsx:16:715`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 90 should be a named constant

**Code:**
```typescript
90
```

**Suggested Fix:** Define constant: const MAX_VALUE = 90

---

### ISS-1771153487506-1R5YLIOUS

- **File:** `apps\frontend\src\app\page.tsx:16:715`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 70 should be a named constant

**Code:**
```typescript
70
```

**Suggested Fix:** Define constant: const MAX_VALUE = 70

---

### ISS-1771153487506-GIBJHAPQW

- **File:** `apps\frontend\src\app\page.tsx:16:715`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 55 should be a named constant

**Code:**
```typescript
55
```

**Suggested Fix:** Define constant: const MAX_VALUE = 55

---

### ISS-1771153487506-MNH568VVK

- **File:** `apps\frontend\src\app\page.tsx:16:715`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 85 should be a named constant

**Code:**
```typescript
85
```

**Suggested Fix:** Define constant: const MAX_VALUE = 85

---

### ISS-1771153487506-IE3BO0BV2

- **File:** `apps\frontend\src\app\page.tsx:16:715`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 65 should be a named constant

**Code:**
```typescript
65
```

**Suggested Fix:** Define constant: const MAX_VALUE = 65

---

### ISS-1771153487506-M9IPR367A

- **File:** `apps\frontend\src\app\page.tsx:16:715`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 75 should be a named constant

**Code:**
```typescript
75
```

**Suggested Fix:** Define constant: const MAX_VALUE = 75

---

### ISS-1771153487506-H9CMXCESW

- **File:** `apps\frontend\src\app\page.tsx:16:715`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 95 should be a named constant

**Code:**
```typescript
95
```

**Suggested Fix:** Define constant: const MAX_VALUE = 95

---

### ISS-1771153487506-13EW6TR2I

- **File:** `apps\frontend\src\app\page.tsx:24:1040`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 13 should be a named constant

**Code:**
```typescript
13
```

**Suggested Fix:** Define constant: const MAX_VALUE = 13

---

### ISS-1771153487507-5MBR0LZ66

- **File:** `apps\frontend\src\app\page.tsx:37:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153487508-4VUYGLZDH

- **File:** `apps\frontend\src\app\page.tsx:52:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153487508-G2L3MMV6W

- **File:** `apps\frontend\src\app\page.tsx:92:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153487508-BKY42DSKI

- **File:** `apps\frontend\src\app\page.tsx:124:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153487508-DX6GN27IN

- **File:** `apps\frontend\src\app\page.tsx:6:85`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'HomePage' missing JSDoc

**Code:**
```typescript
export default function HomePage(): JSX.Element {
  const [topicsExpanded, setTopicsExpanded] = use
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487510-M77CR6NRA

- **File:** `apps\frontend\src\app\page.tsx:6:85`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'HomePage' is 215 lines (max: 50)

**Code:**
```typescript
export default function HomePage(): JSX.Element {
  const [topicsExpanded, setTopicsExpanded] = use
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153487512-HAOZIGMK0

- **File:** `apps\frontend\src\app\page.tsx:6:85`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'HomePage' has cyclomatic complexity of 21 (max: 10)

**Code:**
```typescript
export default function HomePage(): JSX.Element {
  const [topicsExpanded, setTopicsExpanded] = use
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153487514-71W7AHEIF

- **File:** `apps\frontend\src\components\Footer.tsx:35:35`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{footerLinks.product.map((link) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153487514-YS1E37NRQ

- **File:** `apps\frontend\src\components\Footer.tsx:52:35`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{footerLinks.company.map((link) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153487517-08EKN0M40

- **File:** `apps\frontend\src\components\Footer.tsx:3:33`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'footerLinks'

**Code:**
```typescript
footerLinks = {
  product: [
    { href: '/quiz', label: 'Quiz' },
    { href: '/jokes', label: '
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153487517-H0KBWYU4A

- **File:** `apps\frontend\src\components\Footer.tsx:14:275`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'Footer' missing JSDoc

**Code:**
```typescript
export default function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();


```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487518-Y4JGWFH21

- **File:** `apps\frontend\src\components\Footer.tsx:14:275`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'Footer' is 59 lines (max: 50)

**Code:**
```typescript
export default function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();


```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153487523-975DLX3XN

- **File:** `apps\frontend\src\components\Header.tsx:31:24`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{navLinks.map((link) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153487523-R0DHU6NJJ

- **File:** `apps\frontend\src\components\Header.tsx:84:24`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{navLinks.map((link) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153487525-7VHR4RU5K

- **File:** `apps\frontend\src\components\Header.tsx:7:145`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'navLinks'

**Code:**
```typescript
navLinks = [
  { href: '/', label: 'Home' },
  { href: '/quiz', label: 'Quiz' },
  { href: '/joke
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153487525-0H031L0TS

- **File:** `apps\frontend\src\components\Header.tsx:46:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153487525-C1SRDE4I3

- **File:** `apps\frontend\src\components\Header.tsx:16:405`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'Header' missing JSDoc

**Code:**
```typescript
export default function Header(): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(fals
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487526-0V56DXGIP

- **File:** `apps\frontend\src\components\Header.tsx:16:405`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'Header' is 92 lines (max: 50)

**Code:**
```typescript
export default function Header(): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(fals
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153487532-V4QUQK9EC

- **File:** `apps\frontend\src\components\MobileFooter.tsx:10:295`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'MobileFooter' is missing explicit return type

**Code:**
```typescript
export default function MobileFooter() {
    const [activeDrawer, setActiveDrawer] = useState<Drawe
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153487534-MLDW8V3HD

- **File:** `apps\frontend\src\components\MobileFooter.tsx:62:32`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153487534-QC8075H88

- **File:** `apps\frontend\src\components\MobileFooter.tsx:63:32`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153487534-90OGNXT52

- **File:** `apps\frontend\src\components\MobileFooter.tsx:64:29`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153487534-JDWUUJJHA

- **File:** `apps\frontend\src\components\MobileFooter.tsx:75:32`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ y: '100%' }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153487534-LTXWHXG3U

- **File:** `apps\frontend\src\components\MobileFooter.tsx:76:32`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ y: 0 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153487534-YPSVNDYWU

- **File:** `apps\frontend\src\components\MobileFooter.tsx:77:29`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ y: '100%' }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153487534-874ENNVMQ

- **File:** `apps\frontend\src\components\MobileFooter.tsx:78:35`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ type: 'spring', damping: 25, stiffness: 200 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153487534-A6104XQCM

- **File:** `apps\frontend\src\components\MobileFooter.tsx:99:45`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
quizSubjects.map((subject) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153487534-H1A7NV3J6

- **File:** `apps\frontend\src\components\MobileFooter.tsx:115:47`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
jokeCategories.map((cat) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153487534-JHL39W6UG

- **File:** `apps\frontend\src\components\MobileFooter.tsx:131:47`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
riddleChapters.map((chapter) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153487534-DI1G69T9C

- **File:** `apps\frontend\src\components\MobileFooter.tsx:146:50`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
imageRiddleLevels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153487535-5WAJ2EEP3

- **File:** `apps\frontend\src\components\MobileFooter.tsx:92:3959`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const MAX_VALUE = 20

---

### ISS-1771153487536-OHP5ZHDBT

- **File:** `apps\frontend\src\components\MobileFooter.tsx:171:9025`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 24 should be a named constant

**Code:**
```typescript
24
```

**Suggested Fix:** Define constant: const MAX_VALUE = 24

---

### ISS-1771153487536-9C5VJ7PGT

- **File:** `apps\frontend\src\components\MobileFooter.tsx:180:9578`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 24 should be a named constant

**Code:**
```typescript
24
```

**Suggested Fix:** Define constant: const MAX_VALUE = 24

---

### ISS-1771153487536-ELS89GFD6

- **File:** `apps\frontend\src\components\MobileFooter.tsx:189:10140`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 24 should be a named constant

**Code:**
```typescript
24
```

**Suggested Fix:** Define constant: const MAX_VALUE = 24

---

### ISS-1771153487536-2FUTV32WB

- **File:** `apps\frontend\src\components\MobileFooter.tsx:198:10714`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 24 should be a named constant

**Code:**
```typescript
24
```

**Suggested Fix:** Define constant: const MAX_VALUE = 24

---

### ISS-1771153487536-W2ESCKX2M

- **File:** `apps\frontend\src\components\MobileFooter.tsx:207:11279`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 24 should be a named constant

**Code:**
```typescript
24
```

**Suggested Fix:** Define constant: const MAX_VALUE = 24

---

### ISS-1771153487536-1HM0RK6EY

- **File:** `apps\frontend\src\components\MobileFooter.tsx:88:28`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153487536-7MMSLWFXJ

- **File:** `apps\frontend\src\components\MobileFooter.tsx:175:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153487536-6H7NPHYWM

- **File:** `apps\frontend\src\components\MobileFooter.tsx:184:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153487536-JJGA65IFY

- **File:** `apps\frontend\src\components\MobileFooter.tsx:193:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153487536-X6LHU6FZG

- **File:** `apps\frontend\src\components\MobileFooter.tsx:202:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153487536-Y2K17GWZA

- **File:** `apps\frontend\src\components\MobileFooter.tsx:10:295`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'MobileFooter' missing JSDoc

**Code:**
```typescript
export default function MobileFooter() {
    const [activeDrawer, setActiveDrawer] = useState<Drawe
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487538-YFPGP8926

- **File:** `apps\frontend\src\components\MobileFooter.tsx:10:295`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'MobileFooter' is 208 lines (max: 50)

**Code:**
```typescript
export default function MobileFooter() {
    const [activeDrawer, setActiveDrawer] = useState<Drawe
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153487539-FSZY0I6G2

- **File:** `apps\frontend\src\components\MobileFooter.tsx:10:295`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'MobileFooter' has cyclomatic complexity of 23 (max: 10)

**Code:**
```typescript
export default function MobileFooter() {
    const [activeDrawer, setActiveDrawer] = useState<Drawe
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153487544-11GFGCH6V

- **File:** `apps\frontend\src\contexts\ThemeContext.tsx:37:1213`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
localStorage.getItem(STORAGE_KEY) as Theme | null
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153487545-ZDLZ6KF0F

- **File:** `apps\frontend\src\contexts\ThemeContext.tsx:103:14`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
value={{
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153487545-YEGRB1IK7

- **File:** `apps\frontend\src\contexts\ThemeContext.tsx:118:12`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
value={{
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153487548-W8XYYTRHC

- **File:** `apps\frontend\src\contexts\ThemeContext.tsx:21:551`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'ThemeContext'

**Code:**
```typescript
ThemeContext = createContext<ThemeContextType | undefined>(undefined)
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153487549-49886V92Y

- **File:** `apps\frontend\src\contexts\ThemeContext.tsx:23:631`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'STORAGE_KEY'

**Code:**
```typescript
STORAGE_KEY = 'ai-quiz-theme'
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153487550-5PLUB15LF

- **File:** `apps\frontend\src\contexts\ThemeContext.tsx:30:865`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'ThemeProvider' missing JSDoc

**Code:**
```typescript
export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487550-LX493H3SO

- **File:** `apps\frontend\src\contexts\ThemeContext.tsx:131:3804`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'useTheme' missing JSDoc

**Code:**
```typescript
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (c
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153487551-DAQJSQ4UO

- **File:** `apps\frontend\src\contexts\ThemeContext.tsx:30:865`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'ThemeProvider' is 100 lines (max: 50)

**Code:**
```typescript
export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153487551-0R9J04NDY

- **File:** `apps\frontend\src\contexts\ThemeContext.tsx:30:865`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'ThemeProvider' has cyclomatic complexity of 14 (max: 10)

**Code:**
```typescript
export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153488789-EME3VZZAP

- **File:** `apps\frontend\src\hooks\useBulkActions.ts:82:2600`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'useBulkActions' is 240 lines (max: 50)

**Code:**
```typescript
export function useBulkActions(
  options: UseBulkActionsOptions
): UseBulkActionsReturn {
  cons
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153488790-IMKAK8W95

- **File:** `apps\frontend\src\hooks\useBulkActions.ts:209:6027`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'anonymous' is 76 lines (max: 50)

**Code:**
```typescript
async (action: BulkActionType): Promise<void> => {
      if (selectedIds.length === 0) {
        s
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153488791-XFMYEHNXY

- **File:** `apps\frontend\src\hooks\useBulkActions.ts:82:2600`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'useBulkActions' has cyclomatic complexity of 28 (max: 10)

**Code:**
```typescript
export function useBulkActions(
  options: UseBulkActionsOptions
): UseBulkActionsReturn {
  cons
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153488791-LTA6UYR59

- **File:** `apps\frontend\src\hooks\useBulkActions.ts:209:6027`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'anonymous' has cyclomatic complexity of 14 (max: 10)

**Code:**
```typescript
async (action: BulkActionType): Promise<void> => {
      if (selectedIds.length === 0) {
        s
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153488797-NR7EUON37

- **File:** `apps\frontend\src\hooks\useStatusCounts.ts:54:1541`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'DEFAULT_COUNTS'

**Code:**
```typescript
DEFAULT_COUNTS: StatusCounts = {
  total: 0,
  published: 0,
  draft: 0,
  trash: 0,
}
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153488801-8ZHF96PPJ

- **File:** `apps\frontend\src\hooks\useStatusCounts.ts:71:1948`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'useStatusCounts' is 115 lines (max: 50)

**Code:**
```typescript
export function useStatusCounts(
  options: UseStatusCountsOptions
): UseStatusCountsReturn {
  c
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153488802-QL0X56ZE3

- **File:** `apps\frontend\src\hooks\useStatusCounts.ts:71:1948`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'useStatusCounts' has cyclomatic complexity of 14 (max: 10)

**Code:**
```typescript
export function useStatusCounts(
  options: UseStatusCountsOptions
): UseStatusCountsReturn {
  c
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153488805-0EO85BOO0

- **File:** `apps\frontend\src\lib\toast.ts:131:3319`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
{
  success: (message: string, duration?: number) => toastManager.success(message, duration),
  er
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153488855-1IORHAHZ5

- **File:** `apps\frontend\src\lib\toast.ts:52:1427`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 5000 should be a named constant

**Code:**
```typescript
5000
```

**Suggested Fix:** Define constant: const MAX_VALUE = 5000

---

### ISS-1771153488855-H8NRBQDSD

- **File:** `apps\frontend\src\lib\toast.ts:101:2609`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 8000 should be a named constant

**Code:**
```typescript
8000
```

**Suggested Fix:** Define constant: const MAX_VALUE = 8000

---

### ISS-1771153488859-YY8UBJ2UU

- **File:** `apps\frontend\src\lib\utils.ts:96:2947`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
JSON.parse(json) as T
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153488859-WWO5QYB16

- **File:** `apps\frontend\src\lib\utils.ts:29:875`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 36 should be a named constant

**Code:**
```typescript
36
```

**Suggested Fix:** Define constant: const MAX_VALUE = 36

---

### ISS-1771153488860-PUJFIX2AA

- **File:** `apps\frontend\src\lib\utils.ts:80:2352`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153488860-5UW5YK2OA

- **File:** `apps\frontend\src\lib\utils.ts:81:2398`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153488860-JG1IABQDN

- **File:** `apps\frontend\src\lib\utils.ts:81:2398`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153488860-GK6CTCX2L

- **File:** `apps\frontend\src\lib\utils.ts:82:2476`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 86400 should be a named constant

**Code:**
```typescript
86400
```

**Suggested Fix:** Define constant: const MAX_VALUE = 86400

---

### ISS-1771153488860-X2DITLB5I

- **File:** `apps\frontend\src\lib\utils.ts:82:2476`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153488860-QEI8ET361

- **File:** `apps\frontend\src\lib\utils.ts:83:2557`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 604800 should be a named constant

**Code:**
```typescript
604800
```

**Suggested Fix:** Define constant: const MAX_VALUE = 604800

---

### ISS-1771153488860-BHY1ODKQY

- **File:** `apps\frontend\src\lib\utils.ts:83:2557`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 86400 should be a named constant

**Code:**
```typescript
86400
```

**Suggested Fix:** Define constant: const MAX_VALUE = 86400

---

### ISS-1771153488862-547T1AZ7L

- **File:** `apps\frontend\src\services\settings.service.ts:40:885`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
Record<string, any>
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153488865-G1WNCK1BR

- **File:** `apps\frontend\src\services\settings.service.ts:2:2`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'API_URL'

**Code:**
```typescript
API_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api'
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153488882-R7K0D23EI

- **File:** `apps\frontend\src\services\settings.service.ts:4:88`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported interface 'SystemSettings' missing JSDoc

**Code:**
```typescript
export interface SystemSettings {
    global: {
        pagination: {
            defaultLimit: n
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153488890-DUF1IJBS1

- **File:** `apps\frontend\src\services\status.service.ts:105:2628`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
{
  /**
   * Fetches status counts for dashboard
   * @param endpoint - API endpoint for status c
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153488890-73W5CYAEY

- **File:** `apps\frontend\src\services\status.service.ts:220:5694`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
data as Record<string, unknown>
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153488890-295XW403Y

- **File:** `apps\frontend\src\services\status.service.ts:241:6389`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
data as Record<string, unknown>
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153488893-4FB5IKU3K

- **File:** `apps\frontend\src\services\status.service.ts:19:498`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'API_URL'

**Code:**
```typescript
API_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api'
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153488893-ZXS2JJHL8

- **File:** `apps\frontend\src\services\status.service.ts:24:630`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'REQUEST_TIMEOUT'

**Code:**
```typescript
REQUEST_TIMEOUT = 30000
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153488922-P6MPBA2J1

- **File:** `apps\frontend\src\types\status.types.ts:99:2396`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
{
  all: {
    key: 'all',
    label: 'Total',
    color: 'blue',
    icon: 'Layers',
    aria
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153488924-HCAK6VF0X

- **File:** `apps\frontend\src\types\status.types.ts:157:3780`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
{
  publish: {
    action: 'publish',
    label: 'Publish',
    icon: 'CheckCircle',
    varian
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153488972-B59F8OL7B

- **File:** `apps\backend\src\admin\image-riddles\admin-image-riddles.controller.ts:61:2309`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 20 should be a named constant

**Code:**
```typescript
20
```

**Suggested Fix:** Define constant: const MAX_VALUE = 20

---

### ISS-1771153488992-TWOKSK2VT

- **File:** `apps\backend\src\admin\image-riddles\admin-image-riddles.service.ts:262:22`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
return categories.map((cat) => ({
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153488992-CG9E6S6B9

- **File:** `apps\backend\src\admin\image-riddles\admin-image-riddles.service.ts:400:41`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
const riddlesByCategory = categories.map((cat) => ({
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153488997-8FMFCVWSL

- **File:** `apps\backend\src\admin\image-riddles\admin-image-riddles.service.ts:37:1371`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
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

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153488997-ZBG4MPCVL

- **File:** `apps\backend\src\admin\image-riddles\admin-image-riddles.service.ts:174:4858`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'updateRiddle' is 51 lines (max: 50)

**Code:**
```typescript
async updateRiddle(id: string, dto: UpdateImageRiddleDto): Promise<ImageRiddle> {
    const riddle 
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153488998-YQ86C1VR2

- **File:** `apps\backend\src\admin\image-riddles\admin-image-riddles.service.ts:174:4858`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'updateRiddle' has cyclomatic complexity of 17 (max: 10)

**Code:**
```typescript
async updateRiddle(id: string, dto: UpdateImageRiddleDto): Promise<ImageRiddle> {
    const riddle 
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153489000-2RO7483QP

- **File:** `apps\backend\src\common\cache\cache.module.ts:4:101`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CacheModule' missing JSDoc

**Code:**
```typescript
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class Cac
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489004-S7PLJ2AXV

- **File:** `apps\backend\src\common\cache\cache.service.ts:36:1066`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
value: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489006-8DJW5VR51

- **File:** `apps\backend\src\common\cache\cache.service.ts:13:415`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 6379 should be a named constant

**Code:**
```typescript
6379
```

**Suggested Fix:** Define constant: const MAX_VALUE = 6379

---

### ISS-1771153489006-3X91GANV1

- **File:** `apps\backend\src\common\cache\cache.service.ts:36:1066`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153489007-4WOYA21FH

- **File:** `apps\backend\src\common\cache\cache.service.ts:63:1853`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153489007-YODZYU24Y

- **File:** `apps\backend\src\common\cache\cache.service.ts:5:135`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CacheService' missing JSDoc

**Code:**
```typescript
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489029-2LA1PBNYV

- **File:** `apps\backend\src\common\decorators\current-user.decorator.ts:3:76`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'CurrentUser'

**Code:**
```typescript
CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153489061-VEAFF8EHS

- **File:** `apps\backend\src\common\decorators\public.decorator.ts:12:246`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'Public'

**Code:**
```typescript
Public = () => SetMetadata(IS_PUBLIC_KEY, true)
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153489124-HLJM7HQM9

- **File:** `apps\backend\src\common\dto\base.dto.ts:862:22796`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153489124-6BNBO5CA6

- **File:** `apps\backend\src\common\dto\base.dto.ts:925:24615`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153489125-NQ0U57RAU

- **File:** `apps\backend\src\common\dto\base.dto.ts:7:287`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'PaginationDto' missing JSDoc

**Code:**
```typescript
export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-NP9VHNDL1

- **File:** `apps\backend\src\common\dto\base.dto.ts:26:695`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'SearchJokesDto' missing JSDoc

**Code:**
```typescript
export class SearchJokesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search i
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-AJUWIB50U

- **File:** `apps\backend\src\common\dto\base.dto.ts:38:993`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'SearchRiddlesDto' missing JSDoc

**Code:**
```typescript
export class SearchRiddlesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-2B9W45YLQ

- **File:** `apps\backend\src\common\dto\base.dto.ts:55:1483`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'SearchQuestionsDto' missing JSDoc

**Code:**
```typescript
export class SearchQuestionsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Sear
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-P2QVYAYLK

- **File:** `apps\backend\src\common\dto\base.dto.ts:79:2081`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'BulkImportResultDto' missing JSDoc

**Code:**
```typescript
export class BulkImportResultDto {
  @ApiProperty({ description: 'Number of items successfully impo
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-URNDRZA0X

- **File:** `apps\backend\src\common\dto\base.dto.ts:90:2427`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'BulkDeleteDto' missing JSDoc

**Code:**
```typescript
export class BulkDeleteDto {
  @ApiProperty({ description: 'IDs to delete', type: [String] })
  @I
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-NK0I4LSO0

- **File:** `apps\backend\src\common\dto\base.dto.ts:98:2634`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateJokeCategoryDto' missing JSDoc

**Code:**
```typescript
export class CreateJokeCategoryDto {
  @ApiProperty({ example: 'Programming', description: 'Categor
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-TYRXLX78X

- **File:** `apps\backend\src\common\dto\base.dto.ts:110:2927`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateJokeCategoryDto' missing JSDoc

**Code:**
```typescript
export class UpdateJokeCategoryDto {
  @ApiPropertyOptional({ example: 'Programming', description: 
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-AYFGLJH3T

- **File:** `apps\backend\src\common\dto\base.dto.ts:122:3229`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateRiddleCategoryDto' missing JSDoc

**Code:**
```typescript
export class CreateRiddleCategoryDto {
  @ApiProperty({ example: 'Logic', description: 'Category na
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-9DFA6YWPN

- **File:** `apps\backend\src\common\dto\base.dto.ts:134:3518`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateRiddleCategoryDto' missing JSDoc

**Code:**
```typescript
export class UpdateRiddleCategoryDto {
  @ApiPropertyOptional({ example: 'Logic', description: 'Cat
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-KBDZEYNVU

- **File:** `apps\backend\src\common\dto\base.dto.ts:148:3891`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateDadJokeDto' missing JSDoc

**Code:**
```typescript
export class CreateDadJokeDto {
  @ApiProperty({ example: 'Why don\'t scientists trust atoms?' })

```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-N4MLKGJR0

- **File:** `apps\backend\src\common\dto\base.dto.ts:160:4199`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateDadJokeDto' missing JSDoc

**Code:**
```typescript
export class UpdateDadJokeDto {
  @ApiPropertyOptional({ example: 'Why don\'t scientists trust atom
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-H3H1IK51R

- **File:** `apps\backend\src\common\dto\base.dto.ts:174:4598`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateRiddleDto' missing JSDoc

**Code:**
```typescript
export class CreateRiddleDto {
  @ApiProperty({ example: 'What has keys but no locks?' })
  @IsStr
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-64TKKN972

- **File:** `apps\backend\src\common\dto\base.dto.ts:195:5132`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateRiddleDto' missing JSDoc

**Code:**
```typescript
export class UpdateRiddleDto {
  @ApiPropertyOptional({ example: 'What has keys but no locks?' })

```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-JGZWU4YMD

- **File:** `apps\backend\src\common\dto\base.dto.ts:219:5795`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateJokeSubjectDto' missing JSDoc

**Code:**
```typescript
export class CreateJokeSubjectDto {
  @ApiProperty({ example: 'dad-jokes', description: 'Unique slu
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489125-FOZ909K93

- **File:** `apps\backend\src\common\dto\base.dto.ts:247:6438`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateJokeSubjectDto' missing JSDoc

**Code:**
```typescript
export class UpdateJokeSubjectDto {
  @ApiPropertyOptional({ example: 'dad-jokes' })
  @IsOptional
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-NXHBEIJMA

- **File:** `apps\backend\src\common\dto\base.dto.ts:282:7198`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateJokeChapterDto' missing JSDoc

**Code:**
```typescript
export class CreateJokeChapterDto {
  @ApiProperty({ example: 'Programming Jokes' })
  @IsString()
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-G6KI5118X

- **File:** `apps\backend\src\common\dto\base.dto.ts:300:7570`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateJokeChapterDto' missing JSDoc

**Code:**
```typescript
export class UpdateJokeChapterDto {
  @ApiPropertyOptional({ example: 'Programming Jokes' })
  @Is
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-PUYG3C4LI

- **File:** `apps\backend\src\common\dto\base.dto.ts:316:7925`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateQuizJokeDto' missing JSDoc

**Code:**
```typescript
export class CreateQuizJokeDto {
  @ApiProperty({ example: 'Why don\'t scientists trust atoms?' })
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-I32AQCM3U

- **File:** `apps\backend\src\common\dto\base.dto.ts:352:9005`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateQuizJokeDto' missing JSDoc

**Code:**
```typescript
export class UpdateQuizJokeDto {
  @ApiPropertyOptional({ example: 'Why don\'t scientists trust ato
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-LHS470LJ8

- **File:** `apps\backend\src\common\dto\base.dto.ts:392:10242`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateRiddleSubjectDto' missing JSDoc

**Code:**
```typescript
export class CreateRiddleSubjectDto {
  @ApiProperty({ example: 'brain-teasers', description: 'Uniq
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-YE0G8124T

- **File:** `apps\backend\src\common\dto\base.dto.ts:420:10897`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateRiddleSubjectDto' missing JSDoc

**Code:**
```typescript
export class UpdateRiddleSubjectDto {
  @ApiPropertyOptional({ example: 'brain-teasers' })
  @IsOp
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-7OUSRB4P9

- **File:** `apps\backend\src\common\dto\base.dto.ts:455:11671`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateRiddleChapterDto' missing JSDoc

**Code:**
```typescript
export class CreateRiddleChapterDto {
  @ApiProperty({ example: 'Logic Puzzles' })
  @IsString()

```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-DS4KQ7TOI

- **File:** `apps\backend\src\common\dto\base.dto.ts:473:12041`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateRiddleChapterDto' missing JSDoc

**Code:**
```typescript
export class UpdateRiddleChapterDto {
  @ApiPropertyOptional({ example: 'Logic Puzzles' })
  @IsOp
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-2NNGO6OW1

- **File:** `apps\backend\src\common\dto\base.dto.ts:489:12396`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateQuizRiddleDto' missing JSDoc

**Code:**
```typescript
export class CreateQuizRiddleDto {
  @ApiProperty({ example: 'What has keys but no locks?' })
  @I
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-EK2DGKL5E

- **File:** `apps\backend\src\common\dto\base.dto.ts:525:13367`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateQuizRiddleDto' missing JSDoc

**Code:**
```typescript
export class UpdateQuizRiddleDto {
  @ApiPropertyOptional({ example: 'What has keys but no locks?' 
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-YNVGR6XS6

- **File:** `apps\backend\src\common\dto\base.dto.ts:571:14567`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateQuestionDto' missing JSDoc

**Code:**
```typescript
export class CreateQuestionDto {
  @ApiProperty({ example: 'What is the capital of France?' })
  @
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-UQRWGOLBV

- **File:** `apps\backend\src\common\dto\base.dto.ts:601:15354`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateQuestionDto' missing JSDoc

**Code:**
```typescript
export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'What is the capital of France?'
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-JVW1K9QVG

- **File:** `apps\backend\src\common\dto\base.dto.ts:635:16277`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateSubjectDto' missing JSDoc

**Code:**
```typescript
export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNot
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-WDZOATZ47

- **File:** `apps\backend\src\common\dto\base.dto.ts:647:16545`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateSubjectDto' missing JSDoc

**Code:**
```typescript
export class UpdateSubjectDto {
  @ApiPropertyOptional({ example: 'Mathematics' })
  @IsOptional()
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-KT23PPSHU

- **File:** `apps\backend\src\common\dto\base.dto.ts:661:16894`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateImageRiddleCategoryDto' missing JSDoc

**Code:**
```typescript
export class CreateImageRiddleCategoryDto {
  @ApiProperty({ example: 'Optical Illusions', descript
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-JTSKD7NNF

- **File:** `apps\backend\src\common\dto\base.dto.ts:678:17328`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateImageRiddleCategoryDto' missing JSDoc

**Code:**
```typescript
export class UpdateImageRiddleCategoryDto {
  @ApiPropertyOptional({ example: 'Optical Illusions' }
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-7H8765C72

- **File:** `apps\backend\src\common\dto\base.dto.ts:832:21936`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateImageRiddleDto' missing JSDoc

**Code:**
```typescript
export class CreateImageRiddleDto {
  @ApiProperty({ example: 'What do you see in this image?' })

```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-SCPNW4ZN3

- **File:** `apps\backend\src\common\dto\base.dto.ts:894:23728`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'UpdateImageRiddleDto' missing JSDoc

**Code:**
```typescript
export class UpdateImageRiddleDto {
  @ApiPropertyOptional({ example: 'What do you see in this imag
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-KZ9XAGACC

- **File:** `apps\backend\src\common\dto\base.dto.ts:962:25555`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'SearchImageRiddlesDto' missing JSDoc

**Code:**
```typescript
export class SearchImageRiddlesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'S
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489126-R7CC20XAC

- **File:** `apps\backend\src\common\dto\base.dto.ts:981:26128`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'CreateUserAnswerDto' missing JSDoc

**Code:**
```typescript
export class CreateUserAnswerDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000'
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489128-VOJ5OTU7H

- **File:** `apps\backend\src\common\dto\base.dto.ts:1:0`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-file-length
- **Auto-Fixable:** No

**Description:** File has 996 lines (max: 500)

**Code:**
```typescript
Total lines: 996
```

**Suggested Fix:** Split into multiple files or modules

---

### ISS-1771153489136-C9L1KI9DR

- **File:** `apps\backend\src\common\filters\http-exception.filter.ts:20:382`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
details?: any;
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489137-TR48RGV29

- **File:** `apps\backend\src\common\filters\http-exception.filter.ts:46:1285`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
exceptionResponse as any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489137-YBC2M25Q8

- **File:** `apps\backend\src\common\filters\http-exception.filter.ts:28:570`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'catch' is missing explicit return type

**Code:**
```typescript
catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const re
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153489137-BGPUKNT4C

- **File:** `apps\backend\src\common\filters\http-exception.filter.ts:41:1039`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
exception as HttpException
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489137-JHSJ2EM6Q

- **File:** `apps\backend\src\common\filters\http-exception.filter.ts:46:1285`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
exceptionResponse as any
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489137-8MO7P5XQ9

- **File:** `apps\backend\src\common\filters\http-exception.filter.ts:51:1492`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
exceptionResponse as string
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489139-0PR9SG99C

- **File:** `apps\backend\src\common\filters\http-exception.filter.ts:24:424`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'GlobalExceptionFilter' missing JSDoc

**Code:**
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489139-1DB2B9LYL

- **File:** `apps\backend\src\common\filters\http-exception.filter.ts:28:570`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'catch' is 60 lines (max: 50)

**Code:**
```typescript
catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const re
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489139-I5ODEQ0EF

- **File:** `apps\backend\src\common\filters\http-exception.filter.ts:28:570`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'catch' has cyclomatic complexity of 12 (max: 10)

**Code:**
```typescript
catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const re
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153489141-CA5N360K6

- **File:** `apps\backend\src\common\guards\roles.guard.ts:5:202`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'RolesGuard' missing JSDoc

**Code:**
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Re
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489142-60G36MATO

- **File:** `apps\backend\src\common\interceptors\logging.interceptor.ts:16:379`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
Observable<any>
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489143-M1GF6YJYL

- **File:** `apps\backend\src\common\interceptors\logging.interceptor.ts:8:119`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-entire-library-import
- **Auto-Fixable:** No

**Description:** Importing entire 'rxjs' library increases bundle size

**Code:**
```typescript
import { Observable } from 'rxjs';
```

**Suggested Fix:** Import specific modules: import { specific } from 'rxjs'

---

### ISS-1771153489143-0SCVE3HN4

- **File:** `apps\backend\src\common\interceptors\logging.interceptor.ts:12:234`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'LoggingInterceptor' missing JSDoc

**Code:**
```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logg
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489148-0YA08A27R

- **File:** `apps\backend\src\common\logger\winston-logger.ts:52:1706`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'log' is missing explicit return type

**Code:**
```typescript
log(message: string, context?: string) {
    this.logger.info(message, { context });
  }
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153489148-FSXXBUQIY

- **File:** `apps\backend\src\common\logger\winston-logger.ts:56:1802`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'error' is missing explicit return type

**Code:**
```typescript
error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, 
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153489148-HSXEGVMI3

- **File:** `apps\backend\src\common\logger\winston-logger.ts:60:1924`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'warn' is missing explicit return type

**Code:**
```typescript
warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153489148-QV8BD8ZD3

- **File:** `apps\backend\src\common\logger\winston-logger.ts:64:2021`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'debug' is missing explicit return type

**Code:**
```typescript
debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153489148-IGYJUC73J

- **File:** `apps\backend\src\common\logger\winston-logger.ts:68:2120`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** require-return-type
- **Auto-Fixable:** No

**Description:** Function 'verbose' is missing explicit return type

**Code:**
```typescript
verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
```

**Suggested Fix:** Add explicit return type annotation

---

### ISS-1771153489149-FWWRP6UY2

- **File:** `apps\backend\src\common\logger\winston-logger.ts:6:222`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'WinstonLoggerService' missing JSDoc

**Code:**
```typescript
@Injectable()
export class WinstonLoggerService implements LoggerService {
  private logger: winst
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489153-VTVG62HSO

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:64:2251`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
{ id: In(ids) } as any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489155-KM74HR9CX

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:168:5932`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
{ status: ContentStatus.PUBLISHED } as any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489155-RU6LNT9QP

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:169:6012`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
{ status: ContentStatus.DRAFT } as any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489155-0LTGYHELI

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:170:6088`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
{ status: ContentStatus.TRASH } as any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489155-XWH71M5TL

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:180:6351`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
queryRunner: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489155-G2MN3QN4H

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:205:6973`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
queryRunner: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489155-VG1YFF9Z6

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:230:7595`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
queryRunner: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489155-CKOUWGOUR

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:255:8220`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
queryRunner: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489156-WA6I9QAA5

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:280:8813`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
queryRunner: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489157-XN5ZV15BP

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:64:2251`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
{ id: In(ids) } as any
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489158-VA1NQMQSB

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:168:5932`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
{ status: ContentStatus.PUBLISHED } as any
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489158-UOTBBLRVO

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:169:6012`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
{ status: ContentStatus.DRAFT } as any
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489158-D0O6QNGC2

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:170:6088`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
{ status: ContentStatus.TRASH } as any
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489162-4KOY2DRDA

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:40:1460`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'executeBulkAction' is 117 lines (max: 50)

**Code:**
```typescript
async executeBulkAction<T extends IStatusEntity>(
    repository: Repository<T>,
    entityName: s
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489163-JBNXGQ50C

- **File:** `apps\backend\src\common\services\bulk-action.service.ts:40:1460`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'executeBulkAction' has cyclomatic complexity of 20 (max: 10)

**Code:**
```typescript
async executeBulkAction<T extends IStatusEntity>(
    repository: Repository<T>,
    entityName: s
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153489165-AS4CI848Y

- **File:** `apps\backend\src\dad-jokes\entities\dad-joke.entity.ts:5:227`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'DadJoke' missing JSDoc

**Code:**
```typescript
@Entity('dad_jokes')
export class DadJoke {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489165-5RD4P2BTA

- **File:** `apps\backend\src\dad-jokes\entities\joke-category.entity.ts:4:126`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'JokeCategory' missing JSDoc

**Code:**
```typescript
@Entity('joke_categories')
export class JokeCategory {
  @PrimaryGeneratedColumn('uuid')
  id: st
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489166-HCWRVG8C0

- **File:** `apps\backend\src\dad-jokes\entities\joke-chapter.entity.ts:5:193`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'JokeChapter' missing JSDoc

**Code:**
```typescript
@Entity('joke_chapters')
export class JokeChapter {
  @PrimaryGeneratedColumn('uuid')
  id: strin
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489167-AN2ID2653

- **File:** `apps\backend\src\dad-jokes\entities\joke-subject.entity.ts:4:134`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'JokeSubject' missing JSDoc

**Code:**
```typescript
@Entity('joke_subjects')
export class JokeSubject {
  @PrimaryGeneratedColumn('uuid')
  id: strin
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489170-MK0D1UFK8

- **File:** `apps\backend\src\dad-jokes\entities\quiz-joke.entity.ts:4:134`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'QuizJoke' missing JSDoc

**Code:**
```typescript
@Entity('quiz_jokes')
export class QuizJoke {
  @PrimaryGeneratedColumn('uuid')
  id: string;


```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489171-OT2COUZOO

- **File:** `apps\backend\src\database\migrations\1707912000000-AddActionOptionsToImageRiddles.ts:44:4`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-console
- **Auto-Fixable:** Yes

**Description:** console.log should be replaced with proper logger

**Code:**
```typescript
console.log('✅ Added action_options and use_default_actions columns to image_riddles table');
```

**Suggested Fix:** Use a structured logging library like winston or pino

---

### ISS-1771153489171-R56WJVRU4

- **File:** `apps\backend\src\database\migrations\1707912000000-AddActionOptionsToImageRiddles.ts:57:4`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-console
- **Auto-Fixable:** Yes

**Description:** console.log should be replaced with proper logger

**Code:**
```typescript
console.log('✅ Removed action_options columns from image_riddles table');
```

**Suggested Fix:** Use a structured logging library like winston or pino

---

### ISS-1771153489171-C7A4JH0W3

- **File:** `apps\backend\src\database\migrations\1707912000000-AddActionOptionsToImageRiddles.ts:11:460`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'AddActionOptionsToImageRiddles1707912000000' missing JSDoc

**Code:**
```typescript
export class AddActionOptionsToImageRiddles1707912000000 implements MigrationInterface {
  name = '
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489194-TXVI0GTPH

- **File:** `apps\backend\src\image-riddles\entities\image-riddle-action.entity.ts:492:12895`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 5000 should be a named constant

**Code:**
```typescript
5000
```

**Suggested Fix:** Define constant: const MAX_VALUE = 5000

---

### ISS-1771153489197-S09HZN3D6

- **File:** `apps\backend\src\image-riddles\entities\image-riddle-action.entity.ts:1:0`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-file-length
- **Auto-Fixable:** No

**Description:** File has 589 lines (max: 500)

**Code:**
```typescript
Total lines: 589
```

**Suggested Fix:** Split into multiple files or modules

---

### ISS-1771153489198-WY4MWPXIB

- **File:** `apps\backend\src\image-riddles\entities\image-riddle-action.entity.ts:532:13979`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'applyActionDefaults' has cyclomatic complexity of 17 (max: 10)

**Code:**
```typescript
export function applyActionDefaults(action: Partial<IActionOption>): IActionOption {
  const now = 
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153489200-UQVJY2HYI

- **File:** `apps\backend\src\image-riddles\entities\image-riddle-category.entity.ts:12:450`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'ImageRiddleCategory' missing JSDoc

**Code:**
```typescript
@Entity('image_riddle_categories')
export class ImageRiddleCategory {
  @PrimaryGeneratedColumn('u
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489214-P9BN343JM

- **File:** `apps\backend\src\image-riddles\entities\image-riddle.entity.ts:329:7`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
.map((id, index) => ({
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489217-ELLBVV4VC

- **File:** `apps\backend\src\image-riddles\entities\image-riddle.entity.ts:130:3889`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'generateDefaultActionOptions' is 79 lines (max: 50)

**Code:**
```typescript
private generateDefaultActionOptions(): IActionOption[] {
    const actions: IActionOption[] = [];
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489219-WXGMVEKIK

- **File:** `apps\backend\src\quiz\entities\chapter.entity.ts:5:183`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'Chapter' missing JSDoc

**Code:**
```typescript
@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489221-W9OPR2DQT

- **File:** `apps\backend\src\quiz\entities\question.entity.ts:5:216`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'Question' missing JSDoc

**Code:**
```typescript
@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

 
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489222-HHZ0C6UFZ

- **File:** `apps\backend\src\quiz\entities\subject.entity.ts:4:125`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'Subject' missing JSDoc

**Code:**
```typescript
@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489223-QU6UXT9YF

- **File:** `apps\backend\src\riddles\entities\quiz-riddle.entity.ts:4:138`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'QuizRiddle' missing JSDoc

**Code:**
```typescript
@Entity('quiz_riddles')
export class QuizRiddle {
  @PrimaryGeneratedColumn('uuid')
  id: string;
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489223-H9B1Q4J3N

- **File:** `apps\backend\src\riddles\entities\riddle-category.entity.ts:4:123`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'RiddleCategory' missing JSDoc

**Code:**
```typescript
@Entity('riddle_categories')
export class RiddleCategory {
  @PrimaryGeneratedColumn('uuid')
  id
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489225-Q3B0B3L3V

- **File:** `apps\backend\src\riddles\entities\riddle-chapter.entity.ts:5:201`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'RiddleChapter' missing JSDoc

**Code:**
```typescript
@Entity('riddle_chapters')
export class RiddleChapter {
  @PrimaryGeneratedColumn('uuid')
  id: s
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489225-AKKKZYJTW

- **File:** `apps\backend\src\riddles\entities\riddle-subject.entity.ts:4:138`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'RiddleSubject' missing JSDoc

**Code:**
```typescript
@Entity('riddle_subjects')
export class RiddleSubject {
  @PrimaryGeneratedColumn('uuid')
  id: s
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489227-YO7UK4FTG

- **File:** `apps\backend\src\riddles\entities\riddle.entity.ts:5:231`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'Riddle' missing JSDoc

**Code:**
```typescript
@Entity('riddles')
export class Riddle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Co
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489227-AK6ZBZLDW

- **File:** `apps\backend\src\settings\entities\system-setting.entity.ts:9:241`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
@Column({ type: 'jsonb', default: {} })
    value: any;
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489227-D0VGQQ0RS

- **File:** `apps\backend\src\settings\entities\system-setting.entity.ts:3:96`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'SystemSetting' missing JSDoc

**Code:**
```typescript
@Entity('system_settings')
export class SystemSetting {
    @PrimaryColumn()
    key: string;


```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489229-AL9T6TGFU

- **File:** `apps\backend\src\users\entities\user.entity.ts:3:105`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported class 'User' missing JSDoc

**Code:**
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489240-2Z18UVPU5

- **File:** `apps\frontend\src\app\about\page.tsx:3:41`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'metadata'

**Code:**
```typescript
metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about the AI Quiz platform and o
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153489241-C30FA0H4P

- **File:** `apps\frontend\src\app\about\page.tsx:8:196`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'AboutPage' missing JSDoc

**Code:**
```typescript
export default function AboutPage(): JSX.Element {
  return (
    <main id="main-content" classNam
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489241-QGJW65AEX

- **File:** `apps\frontend\src\app\about\page.tsx:8:196`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'AboutPage' is 71 lines (max: 50)

**Code:**
```typescript
export default function AboutPage(): JSX.Element {
  return (
    <main id="main-content" classNam
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489554-AO6TB1Y8O

- **File:** `apps\frontend\src\app\admin\page.tsx:4722:200181`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
useState<any>({})
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489555-MUFON7DKV

- **File:** `apps\frontend\src\app\admin\page.tsx:4763:201276`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
value: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489555-MX9IRQY9K

- **File:** `apps\frontend\src\app\admin\page.tsx:4764:201331`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
prev: any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489555-IK6QT6AUF

- **File:** `apps\frontend\src\app\admin\page.tsx:4767:201440`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
current: any = newState
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489556-EAUW8J5II

- **File:** `apps\frontend\src\app\admin\page.tsx:4816:203366`
- **Severity:** HIGH
- **Category:** type-safety
- **Rule:** no-any
- **Auto-Fixable:** No

**Description:** Usage of "any" type reduces type safety

**Code:**
```typescript
tab.id as any
```

**Suggested Fix:** Replace with specific type or use "unknown" with type guards

---

### ISS-1771153489582-4TTUFZHWF

- **File:** `apps\frontend\src\app\admin\page.tsx:222:14015`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
slug as MenuSection
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489582-OKWLVGS58

- **File:** `apps\frontend\src\app\admin\page.tsx:302:16884`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
subject.slug as MenuSection
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489583-A2O1VPVAG

- **File:** `apps\frontend\src\app\admin\page.tsx:304:16992`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
subject.slug as MenuSection
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489583-7TOEPL7QO

- **File:** `apps\frontend\src\app\admin\page.tsx:421:21685`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
getSubjectFromSection(activeSection) as Subject
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489584-1D55BU4QI

- **File:** `apps\frontend\src\app\admin\page.tsx:551:26601`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
e.target.value as 'academic' | 'professional'
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489585-S7IP07SG0

- **File:** `apps\frontend\src\app\admin\page.tsx:661:30901`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
subject.slug as MenuSection
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489585-62YMG1Q28

- **File:** `apps\frontend\src\app\admin\page.tsx:731:33589`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
(getValue(7, 'level') || 'easy') as Question['level']
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489586-Z9EHJHOAA

- **File:** `apps\frontend\src\app\admin\page.tsx:860:37221`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
err as Error
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489586-5MBWQTF0H

- **File:** `apps\frontend\src\app\admin\page.tsx:887:38104`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
field as keyof T
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489586-JSD85GMII

- **File:** `apps\frontend\src\app\admin\page.tsx:899:38580`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
field as keyof T
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489587-1Z391KUGL

- **File:** `apps\frontend\src\app\admin\page.tsx:924:39274`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
header.toLowerCase().replace(/\s+/g, '') as keyof T
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489587-DAL4QI5FR

- **File:** `apps\frontend\src\app\admin\page.tsx:1012:41690`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
partialData as T
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489587-WRRAFIAZV

- **File:** `apps\frontend\src\app\admin\page.tsx:1017:41868`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
err as Error
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489588-CVVXV0O0R

- **File:** `apps\frontend\src\app\admin\page.tsx:1141:46541`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
(getValue(8, 'difficulty') || 'medium') as Riddle['difficulty']
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489588-7BKBRJKVE

- **File:** `apps\frontend\src\app\admin\page.tsx:1161:47397`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
(getValue(5, 'difficulty') || 'medium') as ImageRiddle['difficulty']
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489589-MCSC62RID

- **File:** `apps\frontend\src\app\admin\page.tsx:1215:49618`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'A' as Question['correctAnswer']
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489589-DFXARB3RP

- **File:** `apps\frontend\src\app\admin\page.tsx:1216:49672`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'easy' as Question['level']
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489590-TIUMM1CAA

- **File:** `apps\frontend\src\app\admin\page.tsx:1256:51209`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
prev.map(q => {
      if (selectedIds.includes(String(q.id))) {
        switch (action) {
       
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489590-0RHQAMLGW

- **File:** `apps\frontend\src\app\admin\page.tsx:1259:51332`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'published' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489590-3KP0H771W

- **File:** `apps\frontend\src\app\admin\page.tsx:1260:51414`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'draft' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489590-U9MCOSF3Z

- **File:** `apps\frontend\src\app\admin\page.tsx:1261:51490`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'trash' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489590-SSSMBBVW8

- **File:** `apps\frontend\src\app\admin\page.tsx:1263:51605`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'draft' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489590-J8B2HAQ8G

- **File:** `apps\frontend\src\app\admin\page.tsx:1287:52344`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489590-K4HIYMBR6

- **File:** `apps\frontend\src\app\admin\page.tsx:1298:52782`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489591-YAJ2QKH78

- **File:** `apps\frontend\src\app\admin\page.tsx:1314:53354`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489591-FDLMMLKAT

- **File:** `apps\frontend\src\app\admin\page.tsx:1394:55751`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target?.result as string
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489591-ENQVEXIYT

- **File:** `apps\frontend\src\app\admin\page.tsx:1411:56307`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
err as Error
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489592-NPSGCFNCM

- **File:** `apps\frontend\src\app\admin\page.tsx:1429:56884`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
q.correctAnswer?.trim() as Question['correctAnswer']
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489592-7RQ82WJ5W

- **File:** `apps\frontend\src\app\admin\page.tsx:1430:56971`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
q.level as Question['level']
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489595-K4BCKCS0V

- **File:** `apps\frontend\src\app\admin\page.tsx:1810:73879`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
e.target.value as Question['correctAnswer']
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489595-98DEU0GD9

- **File:** `apps\frontend\src\app\admin\page.tsx:1823:74646`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
e.target.value as Question['level']
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489599-8WZT724YA

- **File:** `apps\frontend\src\app\admin\page.tsx:2093:89782`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
prev.map(joke => {
      if (selectedIds.includes(String(joke.id))) {
        switch (action) {
 
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489600-490YK4OPY

- **File:** `apps\frontend\src\app\admin\page.tsx:2096:89905`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'published' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489600-TONFV7LQA

- **File:** `apps\frontend\src\app\admin\page.tsx:2097:89990`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'draft' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489600-48YWRJLAC

- **File:** `apps\frontend\src\app\admin\page.tsx:2098:90069`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'trash' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489600-LWXYW0DVO

- **File:** `apps\frontend\src\app\admin\page.tsx:2100:90187`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'draft' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489601-F0C4T9NGK

- **File:** `apps\frontend\src\app\admin\page.tsx:2147:91845`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target?.result as string
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489601-K57Q5YCP7

- **File:** `apps\frontend\src\app\admin\page.tsx:2171:92710`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
result.imported as Joke[]
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489602-C6HHABVYP

- **File:** `apps\frontend\src\app\admin\page.tsx:2176:92921`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
err as Error
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489602-8TPLL5WS2

- **File:** `apps\frontend\src\app\admin\page.tsx:2194:93432`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489602-EECKQ6VXA

- **File:** `apps\frontend\src\app\admin\page.tsx:2205:93870`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489602-JZNL5XT1E

- **File:** `apps\frontend\src\app\admin\page.tsx:2221:94433`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489603-ZNMBX5Z0L

- **File:** `apps\frontend\src\app\admin\page.tsx:2236:94972`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489606-YELS7JSUK

- **File:** `apps\frontend\src\app\admin\page.tsx:2746:116311`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'easy' as Riddle['difficulty']
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489607-AEGY841ZS

- **File:** `apps\frontend\src\app\admin\page.tsx:2788:118012`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
prev.map(riddle => {
      if (selectedIds.includes(String(riddle.id))) {
        switch (action) 
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489607-7Q08H92PH

- **File:** `apps\frontend\src\app\admin\page.tsx:2791:118141`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'published' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489608-ZTIMFB9JB

- **File:** `apps\frontend\src\app\admin\page.tsx:2792:118228`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'draft' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489608-YPJM56OA7

- **File:** `apps\frontend\src\app\admin\page.tsx:2793:118309`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'trash' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489608-2DZEPC61I

- **File:** `apps\frontend\src\app\admin\page.tsx:2795:118429`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'draft' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489609-492VJZCAN

- **File:** `apps\frontend\src\app\admin\page.tsx:2854:120551`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target?.result as string
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489609-NPD5X2QCM

- **File:** `apps\frontend\src\app\admin\page.tsx:2883:121627`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
err as Error
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489609-FXPHD08B2

- **File:** `apps\frontend\src\app\admin\page.tsx:2901:122140`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489610-YPVYFLD4I

- **File:** `apps\frontend\src\app\admin\page.tsx:2912:122578`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489610-CU4A2C5RL

- **File:** `apps\frontend\src\app\admin\page.tsx:2928:123141`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489610-8UAJKMIY7

- **File:** `apps\frontend\src\app\admin\page.tsx:2952:123875`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489611-LTFB9ZP5U

- **File:** `apps\frontend\src\app\admin\page.tsx:3059:127022`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
riddle.difficulty as 'easy' | 'medium' | 'hard' | 'expert'
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489615-J0E4MFHRI

- **File:** `apps\frontend\src\app\admin\page.tsx:3545:150045`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
e.target.value as Riddle['difficulty']
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489616-YSCKS11IL

- **File:** `apps\frontend\src\app\admin\page.tsx:3722:158089`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'published' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489616-PQYSBTY23

- **File:** `apps\frontend\src\app\admin\page.tsx:3735:158572`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'published' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489617-K0V6O6JBN

- **File:** `apps\frontend\src\app\admin\page.tsx:3748:159073`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'draft' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489617-B32G0T0WG

- **File:** `apps\frontend\src\app\admin\page.tsx:3761:159532`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'published' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489617-ZQ73X4P26

- **File:** `apps\frontend\src\app\admin\page.tsx:3774:160016`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'published' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489618-BHSQ8IGOY

- **File:** `apps\frontend\src\app\admin\page.tsx:3820:162007`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'medium' as 'easy' | 'medium' | 'hard' | 'expert'
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489619-D3LLQO0RI

- **File:** `apps\frontend\src\app\admin\page.tsx:3860:163533`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
prev.map(riddle => {
      if (selectedIds.includes(riddle.id)) {
        switch (action) {
     
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489620-VK8HNINPH

- **File:** `apps\frontend\src\app\admin\page.tsx:3863:163656`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'published' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489620-Z9KY8N0BD

- **File:** `apps\frontend\src\app\admin\page.tsx:3864:163743`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'draft' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489620-TD0NMQPWR

- **File:** `apps\frontend\src\app\admin\page.tsx:3865:163824`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'trash' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489621-5ZBRJSGT1

- **File:** `apps\frontend\src\app\admin\page.tsx:3867:163944`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'draft' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489621-PMUG7JCJ6

- **File:** `apps\frontend\src\app\admin\page.tsx:3900:165025`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
filteredRiddles as ImageRiddle[]
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489621-97HE40HYF

- **File:** `apps\frontend\src\app\admin\page.tsx:3905:165245`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
filteredRiddles as ImageRiddle[]
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489622-44BW028NZ

- **File:** `apps\frontend\src\app\admin\page.tsx:3920:165743`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target?.result as string
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489622-W2I5457G2

- **File:** `apps\frontend\src\app\admin\page.tsx:3931:166197`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
validation.data.map(r => ({ ...r, id: String(Date.now() + Math.floor(Math.random() * 1000)) })) as I
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489623-486A0NS0M

- **File:** `apps\frontend\src\app\admin\page.tsx:3936:166435`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
parseImageRiddleCSV(content) as ImportResult<ImageRiddle>
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489623-GSWFWTMUZ

- **File:** `apps\frontend\src\app\admin\page.tsx:3949:166910`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
err as Error
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489624-NK9HHQCH5

- **File:** `apps\frontend\src\app\admin\page.tsx:3967:167425`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489625-LFUXAZ6CZ

- **File:** `apps\frontend\src\app\admin\page.tsx:3978:167863`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489625-XL7HHW2WX

- **File:** `apps\frontend\src\app\admin\page.tsx:3994:168426`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489626-MXXQGNF5G

- **File:** `apps\frontend\src\app\admin\page.tsx:4020:169220`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
event.target as Node
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489626-RXQUMWFJS

- **File:** `apps\frontend\src\app\admin\page.tsx:4055:170389`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
'draft' as ContentStatus
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489627-GUQ52ZS1M

- **File:** `apps\frontend\src\app\admin\page.tsx:4133:172726`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
riddle.difficulty as 'easy' | 'medium' | 'hard' | 'expert'
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489630-LSBHAMP04

- **File:** `apps\frontend\src\app\admin\page.tsx:4550:192136`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
e.target.value as typeof riddleForm.difficulty
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489634-DW93QV64T

- **File:** `apps\frontend\src\app\admin\page.tsx:4816:203366`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
tab.id as any
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153489651-CC39VL7VP

- **File:** `apps\frontend\src\app\admin\page.tsx:297:42`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{quizModuleExpanded && subjects.map((subject) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-GE8R85ZXL

- **File:** `apps\frontend\src\app\admin\page.tsx:658:18`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{subjects.map((subject) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-8J7CH1OR1

- **File:** `apps\frontend\src\app\admin\page.tsx:941:50`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
csvContent += '# ' + Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(' | ') + '\n';
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-DA73T8I7O

- **File:** `apps\frontend\src\app\admin\page.tsx:985:32`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
failed: validation.errors.map((err, idx) => ({
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-MH11KTKPE

- **File:** `apps\frontend\src\app\admin\page.tsx:1422:7`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
.map((q, index) => ({
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-L9I20TSLS

- **File:** `apps\frontend\src\app\admin\page.tsx:1699:49`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{importPreview.slice(0, 5).map((q, i) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-0611MC3XV

- **File:** `apps\frontend\src\app\admin\page.tsx:1906:33`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{filteredQuestions.map((q, index) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-J9RAB5PGT

- **File:** `apps\frontend\src\app\admin\page.tsx:2418:28`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{paginatedJokes.map((joke) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-I4AA2KC52

- **File:** `apps\frontend\src\app\admin\page.tsx:2559:36`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{importWarnings.map((w, i) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-797P2HLZT

- **File:** `apps\frontend\src\app\admin\page.tsx:2574:49`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{importPreview.slice(0, 5).map((joke, i) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-OUZCMFT32

- **File:** `apps\frontend\src\app\admin\page.tsx:3176:12`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
].map(({ value, label }) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-VNEFYZJGJ

- **File:** `apps\frontend\src\app\admin\page.tsx:3248:30`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{paginatedRiddles.map((riddle, index) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-UAPYN5QVR

- **File:** `apps\frontend\src\app\admin\page.tsx:3405:36`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{importWarnings.map((w, i) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-BJ0S4OEQ6

- **File:** `apps\frontend\src\app\admin\page.tsx:3422:49`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{importPreview.slice(0, 5).map((riddle, i) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-G8TWUSKXG

- **File:** `apps\frontend\src\app\admin\page.tsx:3679:14`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
].map((user, i) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-X8BO9FVLH

- **File:** `apps\frontend\src\app\admin\page.tsx:4306:29`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{filteredRiddles.map((riddle) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-JEH7SWGJV

- **File:** `apps\frontend\src\app\admin\page.tsx:4433:36`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{importWarnings.map((w, i) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-OR2T2WXHX

- **File:** `apps\frontend\src\app\admin\page.tsx:4450:49`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{importPreview.slice(0, 5).map((riddle, i) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-XD8NNIWTT

- **File:** `apps\frontend\src\app\admin\page.tsx:4695:22`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{categories.map((cat) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489651-TJZUS9KQ3

- **File:** `apps\frontend\src\app\admin\page.tsx:5009:18`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
].map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153489654-K1QQBWG4J

- **File:** `apps\frontend\src\app\admin\page.tsx:131:3351`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'initialQuestions'

**Code:**
```typescript
initialQuestions: Record<string, Question[]> = {
  science: [
    { id: 1, question: 'What is the 
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153489655-MLFJ7NTZN

- **File:** `apps\frontend\src\app\admin\page.tsx:188:12317`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'initialSubjects'

**Code:**
```typescript
initialSubjects: Subject[] = [
  { id: 1, slug: 'science', name: 'Science', emoji: '🔬', category: 
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153489656-OPR32YCLT

- **File:** `apps\frontend\src\app\admin\page.tsx:1034:42320`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'jokeConfig'

**Code:**
```typescript
jokeConfig: ImportExportConfig<Joke> = {
  entityName: 'Joke',
  filePrefix: 'jokes',
  csvHeader
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153489657-VQF5TEHPW

- **File:** `apps\frontend\src\app\admin\page.tsx:1046:42632`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'riddleConfig'

**Code:**
```typescript
riddleConfig: ImportExportConfig<Riddle> = {
  entityName: 'Riddle',
  filePrefix: 'riddles',
  c
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153489658-96NC4O96Q

- **File:** `apps\frontend\src\app\admin\page.tsx:1062:43277`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'imageRiddleConfig'

**Code:**
```typescript
imageRiddleConfig: ImportExportConfig<ImageRiddle> = {
  entityName: 'ImageRiddle',
  filePrefix: 
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153489659-L99M20R1O

- **File:** `apps\frontend\src\app\admin\page.tsx:1993:84000`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'initialJokeCategories'

**Code:**
```typescript
initialJokeCategories: JokeCategory[] = [
  { id: 1, name: 'Classic Dad Jokes', emoji: '😂' },
  {
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153489659-D73TS9Z6N

- **File:** `apps\frontend\src\app\admin\page.tsx:2000:84259`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'initialJokes'

**Code:**
```typescript
initialJokes: Joke[] = [
  { id: 1, joke: 'Why don\'t scientists trust atoms? Because they make up 
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153489660-KHZZTRAYB

- **File:** `apps\frontend\src\app\admin\page.tsx:2010:85162`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'initialRiddles'

**Code:**
```typescript
initialRiddles: Riddle[] = [
  { id: 1, question: 'What has keys but no locks?', options: ['A piano
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153489671-IHOLWS4NQ

- **File:** `apps\frontend\src\app\admin\page.tsx:1163:47564`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 90 should be a named constant

**Code:**
```typescript
90
```

**Suggested Fix:** Define constant: const MAX_VALUE = 90

---

### ISS-1771153489673-GQWYZ8C8R

- **File:** `apps\frontend\src\app\admin\page.tsx:1254:51142`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 500 should be a named constant

**Code:**
```typescript
500
```

**Suggested Fix:** Define constant: const MAX_VALUE = 500

---

### ISS-1771153489678-XNSQ52E5W

- **File:** `apps\frontend\src\app\admin\page.tsx:2091:89715`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 500 should be a named constant

**Code:**
```typescript
500
```

**Suggested Fix:** Define constant: const MAX_VALUE = 500

---

### ISS-1771153489682-Z9D6JNH4W

- **File:** `apps\frontend\src\app\admin\page.tsx:2786:117945`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 500 should be a named constant

**Code:**
```typescript
500
```

**Suggested Fix:** Define constant: const MAX_VALUE = 500

---

### ISS-1771153489691-A1302JAGZ

- **File:** `apps\frontend\src\app\admin\page.tsx:3858:163466`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 500 should be a named constant

**Code:**
```typescript
500
```

**Suggested Fix:** Define constant: const MAX_VALUE = 500

---

### ISS-1771153489697-RN4XWY9NA

- **File:** `apps\frontend\src\app\admin\page.tsx:4858:205590`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153489698-Z2SRRJTVV

- **File:** `apps\frontend\src\app\admin\page.tsx:4876:206464`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153489698-HO4UI85J2

- **File:** `apps\frontend\src\app\admin\page.tsx:4912:208456`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153489699-SMQ1ARZ6Z

- **File:** `apps\frontend\src\app\admin\page.tsx:4960:210949`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 90 should be a named constant

**Code:**
```typescript
90
```

**Suggested Fix:** Define constant: const MAX_VALUE = 90

---

### ISS-1771153489700-2HJ0ZWJJ5

- **File:** `apps\frontend\src\app\admin\page.tsx:4979:212193`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 3600 should be a named constant

**Code:**
```typescript
3600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 3600

---

### ISS-1771153489700-A4L6FYIEI

- **File:** `apps\frontend\src\app\admin\page.tsx:5014:214124`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153489701-6PO4Y5QIL

- **File:** `apps\frontend\src\app\admin\page.tsx:5014:214124`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 90 should be a named constant

**Code:**
```typescript
90
```

**Suggested Fix:** Define constant: const MAX_VALUE = 90

---

### ISS-1771153489701-24UQTKKHB

- **File:** `apps\frontend\src\app\admin\page.tsx:5014:214124`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 120 should be a named constant

**Code:**
```typescript
120
```

**Suggested Fix:** Define constant: const MAX_VALUE = 120

---

### ISS-1771153489702-4L9VZIZ28

- **File:** `apps\frontend\src\app\admin\page.tsx:5014:214124`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 180 should be a named constant

**Code:**
```typescript
180
```

**Suggested Fix:** Define constant: const MAX_VALUE = 180

---

### ISS-1771153489703-XE63LIF12

- **File:** `apps\frontend\src\app\admin\page.tsx:4318:18`
- **Severity:** HIGH
- **Category:** accessibility
- **Rule:** require-img-alt
- **Auto-Fixable:** No

**Description:** Image element missing alt attribute

**Code:**
```typescript
<img
```

**Suggested Fix:** Add alt attribute describing the image

---

### ISS-1771153489704-4486TXCQS

- **File:** `apps\frontend\src\app\admin\page.tsx:261:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-HP55UAJMF

- **File:** `apps\frontend\src\app\admin\page.tsx:282:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-KZ15FYZ10

- **File:** `apps\frontend\src\app\admin\page.tsx:309:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-ZY1B5BSRM

- **File:** `apps\frontend\src\app\admin\page.tsx:475:4`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-HN6LHF8RC

- **File:** `apps\frontend\src\app\admin\page.tsx:560:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-DVTBRNYW2

- **File:** `apps\frontend\src\app\admin\page.tsx:567:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-4FQ2VGMYV

- **File:** `apps\frontend\src\app\admin\page.tsx:619:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-Y2W4AMM71

- **File:** `apps\frontend\src\app\admin\page.tsx:626:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-YFDHG5BSJ

- **File:** `apps\frontend\src\app\admin\page.tsx:650:8`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-GB22ERQG3

- **File:** `apps\frontend\src\app\admin\page.tsx:659:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-A9D0O2OTK

- **File:** `apps\frontend\src\app\admin\page.tsx:1475:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-V8WVP34G0

- **File:** `apps\frontend\src\app\admin\page.tsx:1483:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-MK8ZBWSO5

- **File:** `apps\frontend\src\app\admin\page.tsx:1489:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-Q7NT4OA4W

- **File:** `apps\frontend\src\app\admin\page.tsx:1498:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-RFFAPSTGJ

- **File:** `apps\frontend\src\app\admin\page.tsx:1504:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-X8JHXOAJC

- **File:** `apps\frontend\src\app\admin\page.tsx:1541:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-AIZT2E9WW

- **File:** `apps\frontend\src\app\admin\page.tsx:1557:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-MVK4TMX0K

- **File:** `apps\frontend\src\app\admin\page.tsx:1567:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-Y6REUZ352

- **File:** `apps\frontend\src\app\admin\page.tsx:1578:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-6R3I0NXIF

- **File:** `apps\frontend\src\app\admin\page.tsx:1590:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-0PS0MVOJD

- **File:** `apps\frontend\src\app\admin\page.tsx:1616:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-K8KE41L1C

- **File:** `apps\frontend\src\app\admin\page.tsx:1642:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-U0APDJB5F

- **File:** `apps\frontend\src\app\admin\page.tsx:1669:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-6B7HLX7J9

- **File:** `apps\frontend\src\app\admin\page.tsx:1722:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-PAA5FY73I

- **File:** `apps\frontend\src\app\admin\page.tsx:1731:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-XM93QY7OL

- **File:** `apps\frontend\src\app\admin\page.tsx:1849:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-3ZRLLJF9O

- **File:** `apps\frontend\src\app\admin\page.tsx:1867:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-2E7ZLYF71

- **File:** `apps\frontend\src\app\admin\page.tsx:1926:24`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-200" title="Edi
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-OVZH8HB76

- **File:** `apps\frontend\src\app\admin\page.tsx:1929:24`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200" title="Delete
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-B93Y5DJW6

- **File:** `apps\frontend\src\app\admin\page.tsx:1982:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300">Previous</button>
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-N1Z8NMBBB

- **File:** `apps\frontend\src\app\admin\page.tsx:1983:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="rounded bg-blue-500 px-3 py-1 text-sm text-white">1</button>
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-547TFZ9QD

- **File:** `apps\frontend\src\app\admin\page.tsx:1984:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300">Next</button>
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-SU3M2UHXI

- **File:** `apps\frontend\src\app\admin\page.tsx:2308:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-MEPTW6Y3R

- **File:** `apps\frontend\src\app\admin\page.tsx:2316:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-SL84D8RWT

- **File:** `apps\frontend\src\app\admin\page.tsx:2322:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-OWZ7PTY65

- **File:** `apps\frontend\src\app\admin\page.tsx:2331:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-UX8OS6CFU

- **File:** `apps\frontend\src\app\admin\page.tsx:2337:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-RPEOOD6H6

- **File:** `apps\frontend\src\app\admin\page.tsx:2376:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-145KIJ9B0

- **File:** `apps\frontend\src\app\admin\page.tsx:2444:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-PG1VB7KBM

- **File:** `apps\frontend\src\app\admin\page.tsx:2450:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-AOT4VWAOD

- **File:** `apps\frontend\src\app\admin\page.tsx:2474:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-N3F0KTQE5

- **File:** `apps\frontend\src\app\admin\page.tsx:2482:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-YQXSK1SK0

- **File:** `apps\frontend\src\app\admin\page.tsx:2509:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-GLHWNT98J

- **File:** `apps\frontend\src\app\admin\page.tsx:2538:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-6G7ER4YNY

- **File:** `apps\frontend\src\app\admin\page.tsx:2592:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-QRK38MEF7

- **File:** `apps\frontend\src\app\admin\page.tsx:2601:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-QNNTSU5LO

- **File:** `apps\frontend\src\app\admin\page.tsx:2650:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-BR1P1JD6U

- **File:** `apps\frontend\src\app\admin\page.tsx:2660:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-CWU6T5ID5

- **File:** `apps\frontend\src\app\admin\page.tsx:2685:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-YDBCTDOUQ

- **File:** `apps\frontend\src\app\admin\page.tsx:2694:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-1NUT7Z1XS

- **File:** `apps\frontend\src\app\admin\page.tsx:3079:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-4O6UF73JH

- **File:** `apps\frontend\src\app\admin\page.tsx:3087:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-T40OP5PP5

- **File:** `apps\frontend\src\app\admin\page.tsx:3093:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-ICN2YNGC6

- **File:** `apps\frontend\src\app\admin\page.tsx:3102:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-FNNXCN9FH

- **File:** `apps\frontend\src\app\admin\page.tsx:3108:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-RN3AL3IL2

- **File:** `apps\frontend\src\app\admin\page.tsx:3132:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-RGR6Z1P02

- **File:** `apps\frontend\src\app\admin\page.tsx:3142:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-UD2QQR3Q0

- **File:** `apps\frontend\src\app\admin\page.tsx:3153:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="rounded-lg bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-QI578CNLI

- **File:** `apps\frontend\src\app\admin\page.tsx:3161:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-1IN055VWT

- **File:** `apps\frontend\src\app\admin\page.tsx:3177:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-QFJ83EP2D

- **File:** `apps\frontend\src\app\admin\page.tsx:3201:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-E56TNW8DQ

- **File:** `apps\frontend\src\app\admin\page.tsx:3263:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-0IG7QPLO1

- **File:** `apps\frontend\src\app\admin\page.tsx:3269:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-5OQWQWAJP

- **File:** `apps\frontend\src\app\admin\page.tsx:3320:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-JU6PH5U66

- **File:** `apps\frontend\src\app\admin\page.tsx:3328:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-0VLZC0ISE

- **File:** `apps\frontend\src\app\admin\page.tsx:3355:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-ODHWHQMP8

- **File:** `apps\frontend\src\app\admin\page.tsx:3384:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-QFSI2UR2M

- **File:** `apps\frontend\src\app\admin\page.tsx:3442:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-RI5IHZJQB

- **File:** `apps\frontend\src\app\admin\page.tsx:3451:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-SFZJXM7OK

- **File:** `apps\frontend\src\app\admin\page.tsx:3571:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-V852CUPRW

- **File:** `apps\frontend\src\app\admin\page.tsx:3590:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-8THTXBGAI

- **File:** `apps\frontend\src\app\admin\page.tsx:3616:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-KDBOLXECF

- **File:** `apps\frontend\src\app\admin\page.tsx:3625:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-JAPZXBWH9

- **File:** `apps\frontend\src\app\admin\page.tsx:3645:8`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600">
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-PV4KE24D8

- **File:** `apps\frontend\src\app\admin\page.tsx:3699:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-200">Edit</butt
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-YJWNEV9EB

- **File:** `apps\frontend\src\app\admin\page.tsx:3700:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200">Delete</butto
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-M69MFAQOT

- **File:** `apps\frontend\src\app\admin\page.tsx:4169:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-ZL9LZB1OL

- **File:** `apps\frontend\src\app\admin\page.tsx:4178:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-VA8MT0B73

- **File:** `apps\frontend\src\app\admin\page.tsx:4186:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-UK1XZ4DK9

- **File:** `apps\frontend\src\app\admin\page.tsx:4192:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-RHZ1MJAU7

- **File:** `apps\frontend\src\app\admin\page.tsx:4201:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-2IXSXQ5V5

- **File:** `apps\frontend\src\app\admin\page.tsx:4207:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-0XK8FAOCM

- **File:** `apps\frontend\src\app\admin\page.tsx:4220:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-5R2341HFP

- **File:** `apps\frontend\src\app\admin\page.tsx:4230:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-SUVDIXCNF

- **File:** `apps\frontend\src\app\admin\page.tsx:4248:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-9483AYHT1

- **File:** `apps\frontend\src\app\admin\page.tsx:4258:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-LPX0KH8HH

- **File:** `apps\frontend\src\app\admin\page.tsx:4329:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-G0WO0KHB7

- **File:** `apps\frontend\src\app\admin\page.tsx:4335:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-0Z97BIB7Q

- **File:** `apps\frontend\src\app\admin\page.tsx:4383:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-OJDNTWQ8C

- **File:** `apps\frontend\src\app\admin\page.tsx:4412:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-VTLH7JIKM

- **File:** `apps\frontend\src\app\admin\page.tsx:4470:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-RE8NXE8FC

- **File:** `apps\frontend\src\app\admin\page.tsx:4479:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-UD877171O

- **File:** `apps\frontend\src\app\admin\page.tsx:4619:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-HYZ7SFTZC

- **File:** `apps\frontend\src\app\admin\page.tsx:4640:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-A63139WAF

- **File:** `apps\frontend\src\app\admin\page.tsx:4666:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-YD2UMK7K1

- **File:** `apps\frontend\src\app\admin\page.tsx:4675:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-5YEHIK4MP

- **File:** `apps\frontend\src\app\admin\page.tsx:4690:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-color
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489704-HA5RK34QW

- **File:** `apps\frontend\src\app\admin\page.tsx:4792:8`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489705-GXI9D68YV

- **File:** `apps\frontend\src\app\admin\page.tsx:4814:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153489705-O5NCISTC1

- **File:** `apps\frontend\src\app\admin\page.tsx:1608:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-5SN469CMX

- **File:** `apps\frontend\src\app\admin\page.tsx:1635:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-B5I8GCMFY

- **File:** `apps\frontend\src\app\admin\page.tsx:1887:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-6YGWDWL0X

- **File:** `apps\frontend\src\app\admin\page.tsx:1909:20`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-M2HSPN14M

- **File:** `apps\frontend\src\app\admin\page.tsx:2368:8`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-14HXJ3C0V

- **File:** `apps\frontend\src\app\admin\page.tsx:2403:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-XP7HGZ9DZ

- **File:** `apps\frontend\src\app\admin\page.tsx:2421:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-S0PAHI2JJ

- **File:** `apps\frontend\src\app\admin\page.tsx:2502:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-IRN8UOSOD

- **File:** `apps\frontend\src\app\admin\page.tsx:3193:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-85V2YX4O5

- **File:** `apps\frontend\src\app\admin\page.tsx:3229:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-7X3NG2L8M

- **File:** `apps\frontend\src\app\admin\page.tsx:3251:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-DWA3JSDJ2

- **File:** `apps\frontend\src\app\admin\page.tsx:3348:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-Y098GPUQH

- **File:** `apps\frontend\src\app\admin\page.tsx:3656:8`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-96S0GZUU9

- **File:** `apps\frontend\src\app\admin\page.tsx:4161:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-QSV3DO38F

- **File:** `apps\frontend\src\app\admin\page.tsx:4290:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-I2I0YDXXT

- **File:** `apps\frontend\src\app\admin\page.tsx:4309:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-ASNDDZVRP

- **File:** `apps\frontend\src\app\admin\page.tsx:4376:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489705-GDTDP0LGE

- **File:** `apps\frontend\src\app\admin\page.tsx:4987:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153489706-K5HSM9QLA

- **File:** `apps\frontend\src\app\admin\page.tsx:197:12867`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'AdminPage' missing JSDoc

**Code:**
```typescript
export default function AdminPage(): JSX.Element {
  const [activeSection, setActiveSection] = useS
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153489742-7N7R914NG

- **File:** `apps\frontend\src\app\admin\page.tsx:197:12867`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'AdminPage' is 268 lines (max: 50)

**Code:**
```typescript
export default function AdminPage(): JSX.Element {
  const [activeSection, setActiveSection] = useS
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489743-XYUVCBLVY

- **File:** `apps\frontend\src\app\admin\page.tsx:487:23929`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'AddSubjectModal' is 92 lines (max: 50)

**Code:**
```typescript
function AddSubjectModal({ onClose, onAdd, existingSlugs }: {
  onClose: () => void;
  onAdd: (sub
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489743-CZ5RDRVFY

- **File:** `apps\frontend\src\app\admin\page.tsx:581:27782`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'AddChapterModal' is 57 lines (max: 50)

**Code:**
```typescript
function AddChapterModal({ onClose, onAdd, subjectName }: {
  onClose: () => void;
  onAdd: (chapt
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489744-TWHX1IMJ2

- **File:** `apps\frontend\src\app\admin\page.tsx:972:40531`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'importFromCSV' is 56 lines (max: 50)

**Code:**
```typescript
function importFromCSV<T extends Record<string, unknown>>(
  csvText: string,
  config: ImportExpo
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489746-WR7TKJ8EW

- **File:** `apps\frontend\src\app\admin\page.tsx:1171:47832`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'QuestionManagementSection' is 820 lines (max: 50)

**Code:**
```typescript
function QuestionManagementSection({
  subject,
  questions,
  allSubjects,
  onSubjectSelect,

```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489747-90UYCQTIJ

- **File:** `apps\frontend\src\app\admin\page.tsx:2023:86685`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'JokesSection' is 684 lines (max: 50)

**Code:**
```typescript
function JokesSection(): JSX.Element {
  // State Management
  const [jokeCategories, _setJokeCate
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489747-NO6NNVP01

- **File:** `apps\frontend\src\app\admin\page.tsx:2709:114576`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'RiddlesSection' is 929 lines (max: 50)

**Code:**
```typescript
function RiddlesSection(): JSX.Element {
  const [allRiddles, setAllRiddles] = useState<Riddle[]>(i
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489748-1QVT3HK1X

- **File:** `apps\frontend\src\app\admin\page.tsx:3640:154158`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'UsersSection' is 71 lines (max: 50)

**Code:**
```typescript
function UsersSection(): JSX.Element {
  return (
    <div>
      <div className="mb-6 flex items
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489748-FPISSRDWS

- **File:** `apps\frontend\src\app\admin\page.tsx:3713:157680`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'ImageRiddlesAdminSection' is 998 lines (max: 50)

**Code:**
```typescript
function ImageRiddlesAdminSection(): JSX.Element {
  const [imageRiddles, setImageRiddles] = useSta
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489749-6O9YVNSVL

- **File:** `apps\frontend\src\app\admin\page.tsx:4713:199702`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'SettingsSection' is 316 lines (max: 50)

**Code:**
```typescript
function SettingsSection(): JSX.Element {
  const [settings, setSettings] = useState<SystemSettings
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489772-0EYHBDIDM

- **File:** `apps\frontend\src\app\admin\page.tsx:1906:79323`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'anonymous' is 66 lines (max: 50)

**Code:**
```typescript
(q, index) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489828-KEGPXNLYV

- **File:** `apps\frontend\src\app\admin\page.tsx:3248:135206`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'anonymous' is 58 lines (max: 50)

**Code:**
```typescript
(riddle, index) => (
              <tr key={riddle.id} className="hover:bg-gray-50">
             
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489886-PIHZFDEHO

- **File:** `apps\frontend\src\app\admin\page.tsx:4306:180278`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'anonymous' is 57 lines (max: 50)

**Code:**
```typescript
(riddle) => (
              <tr key={riddle.id} className="hover:bg-gray-50">
                <td 
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153489928-BMEVP6LEL

- **File:** `apps\frontend\src\app\admin\page.tsx:1:0`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-file-length
- **Auto-Fixable:** No

**Description:** File has 5029 lines (max: 500)

**Code:**
```typescript
Total lines: 5029
```

**Suggested Fix:** Split into multiple files or modules

---

### ISS-1771153489962-3ZUV2RO6D

- **File:** `apps\frontend\src\app\admin\page.tsx:197:12867`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'AdminPage' has cyclomatic complexity of 31 (max: 10)

**Code:**
```typescript
export default function AdminPage(): JSX.Element {
  const [activeSection, setActiveSection] = useS
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153489963-ADWX60CHB

- **File:** `apps\frontend\src\app\admin\page.tsx:699:32351`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'parseCSV' has cyclomatic complexity of 15 (max: 10)

**Code:**
```typescript
function parseCSV(csvText: string): Partial<Question>[] {
  const lines = csvText.trim().split('\n'
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153489963-JTVO9MZB4

- **File:** `apps\frontend\src\app\admin\page.tsx:869:37463`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'validateEntity' has cyclomatic complexity of 14 (max: 10)

**Code:**
```typescript
function validateEntity<T extends Record<string, unknown>>(
  entity: Partial<T>,
  config: Import
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153489963-AQYNQONPM

- **File:** `apps\frontend\src\app\admin\page.tsx:1171:47832`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'QuestionManagementSection' has cyclomatic complexity of 91 (max: 10)

**Code:**
```typescript
function QuestionManagementSection({
  subject,
  questions,
  allSubjects,
  onSubjectSelect,

```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153489963-254TB5FBM

- **File:** `apps\frontend\src\app\admin\page.tsx:2023:86685`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'JokesSection' has cyclomatic complexity of 73 (max: 10)

**Code:**
```typescript
function JokesSection(): JSX.Element {
  // State Management
  const [jokeCategories, _setJokeCate
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153489964-B1LZ0BV4Y

- **File:** `apps\frontend\src\app\admin\page.tsx:2709:114576`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'RiddlesSection' has cyclomatic complexity of 102 (max: 10)

**Code:**
```typescript
function RiddlesSection(): JSX.Element {
  const [allRiddles, setAllRiddles] = useState<Riddle[]>(i
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153489965-E26YJKY6K

- **File:** `apps\frontend\src\app\admin\page.tsx:3713:157680`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'ImageRiddlesAdminSection' has cyclomatic complexity of 113 (max: 10)

**Code:**
```typescript
function ImageRiddlesAdminSection(): JSX.Element {
  const [imageRiddles, setImageRiddles] = useSta
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153489966-VQ66PDT7G

- **File:** `apps\frontend\src\app\admin\page.tsx:4713:199702`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'SettingsSection' has cyclomatic complexity of 37 (max: 10)

**Code:**
```typescript
function SettingsSection(): JSX.Element {
  const [settings, setSettings] = useState<SystemSettings
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153489979-RZQLALLVC

- **File:** `apps\frontend\src\app\image-riddles\layout.tsx:11:357`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'metadata'

**Code:**
```typescript
metadata: Metadata = {
  title: 'Image Riddles - AI Quiz Platform',
  description: 'Challenge your
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153489980-DCTIX7M5L

- **File:** `apps\frontend\src\app\image-riddles\layout.tsx:16:536`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'ImageRiddlesLayout' missing JSDoc

**Code:**
```typescript
export default function ImageRiddlesLayout({
  children,
}: {
  children: React.ReactNode;
}): J
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153490010-DFDXXP4S8

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:681:22987`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
['easy', 'medium', 'hard', 'expert'] as const
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490014-BHZAZN4JQ

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:956:32`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
gameState={{
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490014-ZVS1M9ZZ6

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:306:17`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{presets.map((preset) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490014-FR1K8JX8V

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:681:59`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{(['easy', 'medium', 'hard', 'expert'] as const).map((diff) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490014-PT7FW44YN

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:728:24`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{categories.map((category) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490014-KE0L00UCY

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:763:29`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{filteredRiddles.map((riddle) => {
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490016-Y4A46HQJC

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:54:1780`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'difficultyColors'

**Code:**
```typescript
difficultyColors = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490017-8ZO6SKDVE

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:61:2046`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'difficultyLabels'

**Code:**
```typescript
difficultyLabels = {
  easy: '🌱 Easy',
  medium: '⭐ Medium',
  hard: '🔥 Hard',
  expert: '💎 E
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490018-C788CRMRU

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:68:2167`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'DEFAULT_AUTO_TIMER'

**Code:**
```typescript
DEFAULT_AUTO_TIMER = 90
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490019-XGPYVNFNF

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:70:2201`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'defaultTimers'

**Code:**
```typescript
defaultTimers: Record<string, number> = {
  easy: DEFAULT_AUTO_TIMER,
  medium: DEFAULT_AUTO_TIMER
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490020-KEW2UDVBG

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:77:2376`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'SAMPLE_RIDDLES'

**Code:**
```typescript
SAMPLE_RIDDLES: ImageRiddle[] = [
  {
    id: '1',
    title: 'What is hidden in this image?',
 
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490020-BO1KTQLPE

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:102:3183`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'SAMPLE_CATEGORIES'

**Code:**
```typescript
SAMPLE_CATEGORIES: ImageRiddleCategory[] = [
  { id: '1', name: 'Optical Illusions', emoji: '👁️', 
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490034-7LQWC3HC6

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:110:3631`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'useTimer'

**Code:**
```typescript
useTimer = (initialDuration: number, autoStart: boolean = false) => {
  const [timeLeft, setTimeLef
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490035-UUWO70H2S

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:206:6346`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'getEffectiveTimer'

**Code:**
```typescript
getEffectiveTimer = (riddle: ImageRiddle): number => {
  // Use the same logic as the average calcu
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490036-WJL95KMO6

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:211:6555`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'formatTime'

**Code:**
```typescript
formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs 
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490038-QUUHDAZY4

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:227:7089`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'TimerDisplay'

**Code:**
```typescript
TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLeft,
  isRunning,
  isPaused,
  totalDurat
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490039-NNJZJ4EYA

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:294:9258`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'ManualTimerSettings'

**Code:**
```typescript
ManualTimerSettings: React.FC<ManualTimerSettingsProps> = ({
  value,
  onChange,
  onApply,
  d
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490040-5U4BDYFPB

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:208:6476`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153490040-BM3WBQ3BL

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:212:6606`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153490040-JAVSIPJFQ

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:213:6648`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153490042-KUJXD8DIZ

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:260:8091`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 45 should be a named constant

**Code:**
```typescript
45
```

**Suggested Fix:** Define constant: const MAX_VALUE = 45

---

### ISS-1771153490042-VISHCR4ES

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:261:8144`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 45 should be a named constant

**Code:**
```typescript
45
```

**Suggested Fix:** Define constant: const MAX_VALUE = 45

---

### ISS-1771153490043-GDX2I1XOL

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:300:9383`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const MAX_VALUE = 30

---

### ISS-1771153490043-YDFVH7PGA

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:300:9383`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153490043-AM52Y1JHK

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:300:9383`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 120 should be a named constant

**Code:**
```typescript
120
```

**Suggested Fix:** Define constant: const MAX_VALUE = 120

---

### ISS-1771153490043-FY0BT1H9R

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:300:9383`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 180 should be a named constant

**Code:**
```typescript
180
```

**Suggested Fix:** Define constant: const MAX_VALUE = 180

---

### ISS-1771153490043-HHNT8YUAZ

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:300:9383`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 300 should be a named constant

**Code:**
```typescript
300
```

**Suggested Fix:** Define constant: const MAX_VALUE = 300

---

### ISS-1771153490043-XA747RT9U

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:317:10059`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153490043-Y78Y11JS0

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:317:10059`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153490044-K6BU72EHY

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:439:14875`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153490044-YE8OUDDSR

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:447:15231`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153490044-VEA7HV3W0

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:448:15241`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153490044-PB2EG8F1Q

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:531:17509`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153490044-DEUF88LK1

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:545:17972`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153490045-VCI0LMEN2

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:652:21817`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 60 should be a named constant

**Code:**
```typescript
60
```

**Suggested Fix:** Define constant: const MAX_VALUE = 60

---

### ISS-1771153490047-40XDD774Y

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:774:20`
- **Severity:** HIGH
- **Category:** accessibility
- **Rule:** require-img-alt
- **Auto-Fixable:** No

**Description:** Image element missing alt attribute

**Code:**
```typescript
<img
```

**Suggested Fix:** Add alt attribute describing the image

---

### ISS-1771153490047-HV45T3E7X

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:844:18`
- **Severity:** HIGH
- **Category:** accessibility
- **Rule:** require-img-alt
- **Auto-Fixable:** No

**Description:** Image element missing alt attribute

**Code:**
```typescript
<img
```

**Suggested Fix:** Add alt attribute describing the image

---

### ISS-1771153490047-O8XURIA08

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:307:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-E9WRC8969

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:335:8`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-WQYUYGO08

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:671:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-ONVPGTCBY

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:682:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-O3U6Q976T

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:699:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-E0T8Z9SJH

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:709:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-9WJNA8R4C

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:754:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-Q8P8MCLNV

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:828:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-WRSPRE56P

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:858:24`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-NIGFA36SO

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:868:24`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-A93YCDDCK

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:894:24`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-OGHO38TXM

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:902:24`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-WFABUXL9S

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:909:22`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-7LK5KGEYL

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:999:18`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490047-9CSD08DFO

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:322:8`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-input-label
- **Auto-Fixable:** No

**Description:** Form input without associated label

**Code:**
```typescript
<input
```

**Suggested Fix:** Wrap in label element or add aria-label/aria-labelledby

---

### ISS-1771153490047-RIL8BDUO1

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:426:14148`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'ImageRiddlesPage' missing JSDoc

**Code:**
```typescript
export default function ImageRiddlesPage(): JSX.Element {
  // State Management
  const [riddles, 
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153490052-0FS5DCB1K

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:426:14148`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'ImageRiddlesPage' is 588 lines (max: 50)

**Code:**
```typescript
export default function ImageRiddlesPage(): JSX.Element {
  // State Management
  const [riddles, 
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153490052-TURAMCS2Y

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:110:3631`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'anonymous' is 92 lines (max: 50)

**Code:**
```typescript
(initialDuration: number, autoStart: boolean = false) => {
  const [timeLeft, setTimeLeft] = useSta
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153490052-0ZMPN8JEN

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:227:7089`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'anonymous' is 56 lines (max: 50)

**Code:**
```typescript
({
  timeLeft,
  isRunning,
  isPaused,
  totalDuration,
}) => {
  const progress = totalDurat
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153490052-GNKFJ7ZFK

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:294:9258`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'anonymous' is 52 lines (max: 50)

**Code:**
```typescript
({
  value,
  onChange,
  onApply,
  disabled,
}) => {
  const presets = [30, 60, 120, 180, 30
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153490056-0CFLGP80O

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:1:0`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-file-length
- **Auto-Fixable:** No

**Description:** File has 1014 lines (max: 500)

**Code:**
```typescript
Total lines: 1014
```

**Suggested Fix:** Split into multiple files or modules

---

### ISS-1771153490063-Y9Y1ZZTDT

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:426:14148`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'ImageRiddlesPage' has cyclomatic complexity of 63 (max: 10)

**Code:**
```typescript
export default function ImageRiddlesPage(): JSX.Element {
  // State Management
  const [riddles, 
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153490063-IICI3W3HT

- **File:** `apps\frontend\src\app\image-riddles\page.tsx:110:3631`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'anonymous' has cyclomatic complexity of 12 (max: 10)

**Code:**
```typescript
(initialDuration: number, autoStart: boolean = false) => {
  const [timeLeft, setTimeLeft] = useSta
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153490065-THAKNDJ9C

- **File:** `apps\frontend\src\app\jokes\page.tsx:53:26`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{jokeCategories.map((category) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490074-C42U15BD9

- **File:** `apps\frontend\src\app\jokes\page.tsx:4:72`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'metadata'

**Code:**
```typescript
metadata: Metadata = {
  title: 'Dad Jokes',
  description: 'Hilarious dad jokes to brighten your 
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490075-HDXGC2WG6

- **File:** `apps\frontend\src\app\jokes\page.tsx:9:243`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'jokeCategories'

**Code:**
```typescript
jokeCategories = [
  {
    title: 'Classic Dad Jokes',
    description: 'Timeless classics that n
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490075-901NR3TIW

- **File:** `apps\frontend\src\app\jokes\page.tsx:36:873`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'JokesPage' missing JSDoc

**Code:**
```typescript
export default function JokesPage(): JSX.Element {
  return (
    <main className="min-h-screen bg
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153490096-8HKA21MDB

- **File:** `apps\frontend\src\app\quiz\page.tsx:62:20`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{subjects.map((subj) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490096-AHNY34DET

- **File:** `apps\frontend\src\app\quiz\page.tsx:147:25`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{info.chapters.map((chapterName, index) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490096-88CCTZH0F

- **File:** `apps\frontend\src\app\quiz\page.tsx:206:20`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{levels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490096-ORH3UEMSF

- **File:** `apps\frontend\src\app\quiz\page.tsx:225:20`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{levels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490096-743WPDLQD

- **File:** `apps\frontend\src\app\quiz\page.tsx:299:18`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{rows.map((row, rowIndex) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490096-WTZYG1FQA

- **File:** `apps\frontend\src\app\quiz\page.tsx:303:23`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{row.map((subject) => {
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490096-LZR96TV1E

- **File:** `apps\frontend\src\app\quiz\page.tsx:328:30`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{levels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490097-88Z4K5YDH

- **File:** `apps\frontend\src\app\quiz\page.tsx:351:20`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{levels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490097-ADL6O6FQF

- **File:** `apps\frontend\src\app\quiz\page.tsx:437:18`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{rows.map((row, rowIndex) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490097-GEZ9GH62Y

- **File:** `apps\frontend\src\app\quiz\page.tsx:441:23`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{row.map((subject) => {
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490097-R5XMGYHMV

- **File:** `apps\frontend\src\app\quiz\page.tsx:466:30`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{levels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490097-Z4CGL8US1

- **File:** `apps\frontend\src\app\quiz\page.tsx:489:20`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{levels.map((level) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490100-KRF423SKO

- **File:** `apps\frontend\src\app\quiz\page.tsx:207:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490100-D716EUH9S

- **File:** `apps\frontend\src\app\quiz\page.tsx:226:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490100-KB6OGURTQ

- **File:** `apps\frontend\src\app\quiz\page.tsx:306:22`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490100-SWPF12HNJ

- **File:** `apps\frontend\src\app\quiz\page.tsx:329:24`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490100-65OLJ6WG1

- **File:** `apps\frontend\src\app\quiz\page.tsx:352:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490100-XBZFUYTFD

- **File:** `apps\frontend\src\app\quiz\page.tsx:369:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-center 
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490100-JL6J1L9Y9

- **File:** `apps\frontend\src\app\quiz\page.tsx:444:22`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490100-NLLATN9V8

- **File:** `apps\frontend\src\app\quiz\page.tsx:467:24`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490100-OY228M2YB

- **File:** `apps\frontend\src\app\quiz\page.tsx:490:14`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490100-USZW0GV8N

- **File:** `apps\frontend\src\app\quiz\page.tsx:507:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="w-full rounded-xl bg-gradient-to-r from-indigo-400 to-purple-500 p-6 text-center 
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490100-L6BO3WN2J

- **File:** `apps\frontend\src\app\quiz\page.tsx:517:24544`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'QuizPage' missing JSDoc

**Code:**
```typescript
export default function QuizPage(): JSX.Element {
  return (
    <Suspense fallback={<div classNam
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153490105-DE3OX15C6

- **File:** `apps\frontend\src\app\quiz\page.tsx:78:2613`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'ChapterSelection' is 84 lines (max: 50)

**Code:**
```typescript
function ChapterSelection({ subject }: { subject: string }): JSX.Element {
  const subjectInfo: Rec
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153490105-1MLGEIIBH

- **File:** `apps\frontend\src\app\quiz\page.tsx:163:8407`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'LevelSelection' is 77 lines (max: 50)

**Code:**
```typescript
function LevelSelection({ subject, chapter }: { subject: string; chapter: string }): JSX.Element {

```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153490105-EX7NPHP5T

- **File:** `apps\frontend\src\app\quiz\page.tsx:241:12148`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'TimerChallengesPage' is 137 lines (max: 50)

**Code:**
```typescript
function TimerChallengesPage(): JSX.Element {
  const [selectedSubject, setSelectedSubject] = useSt
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153490105-ED08Q980E

- **File:** `apps\frontend\src\app\quiz\page.tsx:379:18356`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'PracticeModePage' is 137 lines (max: 50)

**Code:**
```typescript
function PracticeModePage(): JSX.Element {
  const [selectedSubject, setSelectedSubject] = useState
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153490106-2U6EDI0SW

- **File:** `apps\frontend\src\app\quiz\page.tsx:1:0`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-file-length
- **Auto-Fixable:** No

**Description:** File has 524 lines (max: 500)

**Code:**
```typescript
Total lines: 524
```

**Suggested Fix:** Split into multiple files or modules

---

### ISS-1771153490113-N75JJAQ8S

- **File:** `apps\frontend\src\app\riddles\page.tsx:88:26`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{riddleChapters.map((chapter) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490121-9WB0HGYZP

- **File:** `apps\frontend\src\app\riddles\page.tsx:4:72`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'metadata'

**Code:**
```typescript
metadata: Metadata = {
  title: 'Riddles',
  description: 'Challenge your mind with 20 chapters of
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490124-L64AY64CK

- **File:** `apps\frontend\src\app\riddles\page.tsx:9:230`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'riddleChapters'

**Code:**
```typescript
riddleChapters = [
  { num: 1, title: 'Trick Questions', icon: '🤔', count: 85 },
  { num: 2, titl
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490125-AEFN1H8P8

- **File:** `apps\frontend\src\app\riddles\page.tsx:60:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="rounded-full bg-gradient-to-r from-pink-400 to-rose-500 px-6 py-2.5 text-sm font-
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490125-MMQPFIIQP

- **File:** `apps\frontend\src\app\riddles\page.tsx:72:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button className="rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 px-6 py-2.5 text-sm fon
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490125-811ZHDHQ0

- **File:** `apps\frontend\src\app\riddles\page.tsx:32:1538`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'RiddlesPage' missing JSDoc

**Code:**
```typescript
export default function RiddlesPage(): JSX.Element {
  return (
    <main className="min-h-screen 
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153490125-GU7N3QLCJ

- **File:** `apps\frontend\src\app\riddles\page.tsx:32:1538`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'RiddlesPage' is 73 lines (max: 50)

**Code:**
```typescript
export default function RiddlesPage(): JSX.Element {
  return (
    <main className="min-h-screen 
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153490145-UH4STTDEO

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:452:14577`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
buttonRef as React.RefObject<HTMLAnchorElement>
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490145-SN5TYGT61

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:465:14904`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
buttonRef as React.RefObject<HTMLButtonElement>
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490146-NORQ2BUXS

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:530:17021`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
null as unknown
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490148-V8TNQH27Q

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:617:25`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{filteredActions.map((action, index) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490151-US69L1FKX

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:145:4132`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'STYLE_CLASSES'

**Code:**
```typescript
STYLE_CLASSES: Record<ActionOptionStyle, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490153-31OCQB5EG

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:156:4974`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'SIZE_CLASSES'

**Code:**
```typescript
SIZE_CLASSES: Record<ActionOptionSize, string> = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490153-G61VR0PNN

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:164:5214`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'BADGE_CLASSES'

**Code:**
```typescript
BADGE_CLASSES: Record<string, string> = {
  default: 'bg-gray-500 text-white',
  success: 'bg-gree
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490154-X8TVQZ0QW

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:236:7684`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'LoadingSpinner'

**Code:**
```typescript
LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'sm' }) => {
  const sizeClasse
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490155-166RDUTEU

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:270:8465`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'Tooltip'

**Code:**
```typescript
Tooltip: React.FC<{
  text: string;
  shortcut?: string | undefined;
  x: number;
  y: number;

```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490156-HIMUJAIF4

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:295:9066`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'ConfirmDialog'

**Code:**
```typescript
ConfirmDialog: React.FC<{
  isOpen: boolean;
  action: IActionOption | null;
  onConfirm: () => v
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490159-2DSP395TN

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:336:10519`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'ActionButton'

**Code:**
```typescript
ActionButton: React.FC<{
  action: IActionOption;
  isLoading: boolean;
  onClick: (e: React.Mous
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490172-K7G2I936N

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:282:8802`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 30 should be a named constant

**Code:**
```typescript
30
```

**Suggested Fix:** Define constant: const MAX_VALUE = 30

---

### ISS-1771153490172-SLLMNUKZX

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:357:11459`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 600 should be a named constant

**Code:**
```typescript
600
```

**Suggested Fix:** Define constant: const MAX_VALUE = 600

---

### ISS-1771153490172-HI1EE1EBR

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:400:13079`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 99 should be a named constant

**Code:**
```typescript
99
```

**Suggested Fix:** Define constant: const MAX_VALUE = 99

---

### ISS-1771153490173-PPOCW0DYJ

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:401:13145`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 99 should be a named constant

**Code:**
```typescript
99
```

**Suggested Fix:** Define constant: const MAX_VALUE = 99

---

### ISS-1771153490173-DWJSEDI0O

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:443:14354`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 200 should be a named constant

**Code:**
```typescript
200
```

**Suggested Fix:** Define constant: const MAX_VALUE = 200

---

### ISS-1771153490173-2KBJPAQZA

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:576:18444`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 500 should be a named constant

**Code:**
```typescript
500
```

**Suggested Fix:** Define constant: const MAX_VALUE = 500

---

### ISS-1771153490174-6L1RKP3IH

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:622:19766`
- **Severity:** LOW
- **Category:** best-practices
- **Rule:** no-magic-numbers
- **Auto-Fixable:** No

**Description:** Magic number 50 should be a named constant

**Code:**
```typescript
50
```

**Suggested Fix:** Define constant: const MAX_VALUE = 50

---

### ISS-1771153490174-CONJZGGSS

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:315:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490174-VOLKK9V0J

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:321:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490174-T76T1LBBB

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:463:4`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490175-RNZW9DE66

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:44:1350`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported interface 'IActionOption' missing JSDoc

**Code:**
```typescript
export interface IActionOption {
  id: string;
  label: string;
  type: ActionOptionType;
  styl
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153490175-1Y6ULRBJJ

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:104:2905`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported interface 'ActionOptionsProps' missing JSDoc

**Code:**
```typescript
export interface ActionOptionsProps {
  /** Array of action options to display */
  actions: IActi
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153490175-VFZYHQNVQ

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:126:3661`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported interface 'ActionOptionsState' missing JSDoc

**Code:**
```typescript
export interface ActionOptionsState {
  loadingActions: Set<string>;
  openDropdown: string | null
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153490178-R4GEIZOAG

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:342:10743`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'anonymous' is 130 lines (max: 50)

**Code:**
```typescript
({ action, isLoading, onClick, onMouseEnter, onMouseLeave }) => {
  const buttonRef = useRef<HTMLBu
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153490179-D6PB507VR

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:477:15268`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
- **Auto-Fixable:** No

**Description:** Function 'anonymous' is 212 lines (max: 50)

**Code:**
```typescript
({
  actions,
  gameState,
  position = 'below_question',
  onAction,
  className = '',
  onAn
```

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153490180-ZMGJA67MB

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:1:0`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-file-length
- **Auto-Fixable:** No

**Description:** File has 691 lines (max: 500)

**Code:**
```typescript
Total lines: 691
```

**Suggested Fix:** Split into multiple files or modules

---

### ISS-1771153490185-0PAK3M2FH

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:179:5712`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'shouldShowAction' has cyclomatic complexity of 17 (max: 10)

**Code:**
```typescript
function shouldShowAction(action: IActionOption, gameState: ActionOptionsProps['gameState']): boolea
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153490185-25HN9G5I9

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:342:10743`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'anonymous' has cyclomatic complexity of 33 (max: 10)

**Code:**
```typescript
({ action, isLoading, onClick, onMouseEnter, onMouseLeave }) => {
  const buttonRef = useRef<HTMLBu
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153490185-OM119FMSS

- **File:** `apps\frontend\src\components\image-riddles\ActionOptions.tsx:477:15268`
- **Severity:** MEDIUM
- **Category:** enterprise
- **Rule:** max-cyclomatic-complexity
- **Auto-Fixable:** No

**Description:** Function 'anonymous' has cyclomatic complexity of 23 (max: 10)

**Code:**
```typescript
({
  actions,
  gameState,
  position = 'below_question',
  onAction,
  className = '',
  onAn
```

**Suggested Fix:** Refactor to reduce branching (extract functions, use early returns)

---

### ISS-1771153490195-5WPL174U7

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:72:1827`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
{
  CheckCircle,
  FileEdit,
  Trash2,
  AlertTriangle,
  RotateCcw,
} as const
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490195-M44JXTSSZ

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:93:2206`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
config.icon as keyof typeof ACTION_ICONS
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490196-ED4CUQVV5

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:248:7931`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
config.icon as keyof typeof ACTION_ICONS
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490196-JXMYVUEY6

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:308:9936`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
Object.keys(BULK_ACTIONS_CONFIG) as BulkActionType[]
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490197-PHE0UJK5O

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:104:20`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490197-XHNVIPVVI

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:105:20`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490197-45YIGCDAJ

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:106:17`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490197-PDXMS1YTJ

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:115:22`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, scale: 0.95, y: 20 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490197-CPNFJUS49

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:116:22`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, scale: 1, y: 0 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490197-PSZJLHPXV

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:117:19`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0, scale: 0.95, y: 20 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490197-JLZIFUZKN

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:118:25`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ type: 'spring', damping: 25, stiffness: 300 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490197-7AVIV4JWU

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:381:16`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, y: 20 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490197-0EMGX78FO

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:382:16`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, y: 0 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490197-Q0AS4FU9X

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:383:13`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0, y: 20 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490197-LBWRPMQI4

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:384:19`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ type: 'spring', damping: 25, stiffness: 300 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490197-10Z22RS1S

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:440:30`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{availableActions.map((action) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490203-3TA96KKVQ

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:72:1827`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'ACTION_ICONS'

**Code:**
```typescript
ACTION_ICONS = {
  CheckCircle,
  FileEdit,
  Trash2,
  AlertTriangle,
  RotateCcw,
} as const
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490214-47SC2MCGY

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:83:1981`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'ConfirmationModal'

**Code:**
```typescript
ConfirmationModal = React.memo(function ConfirmationModal({
  isOpen,
  config,
  itemCount,
  o
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490216-YG9HIMQ5V

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:243:7799`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'ActionButton'

**Code:**
```typescript
ActionButton = React.memo(function ActionButton({
  config,
  onClick,
  isLoading,
}: ActionBut
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490242-93OOPXBNW

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:193:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490242-P8ZZ46LC9

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:207:16`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490242-IT4UA2E83

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:260:4`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490242-CUTW7U1FA

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:421:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490242-SYG6SK7CG

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:455:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490242-31WA53KQH

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:485:12`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490245-0CYDB25LQ

- **File:** `apps\frontend\src\components\ui\BulkActionToolbar.tsx:1:0`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-file-length
- **Auto-Fixable:** No

**Description:** File has 511 lines (max: 500)

**Code:**
```typescript
Total lines: 511
```

**Suggested Fix:** Split into multiple files or modules

---

### ISS-1771153490260-6NW5PAWC3

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:58:1495`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
{
  Layers,
  CheckCircle,
  FileEdit,
  Trash2,
} as const
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490260-4NM17OL3Q

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:68:1633`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
{
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-bl
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490260-32YI60C73

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:134:3577`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
config.icon as keyof typeof ICONS
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490261-A71CVU7M7

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:391:11471`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
Object.keys(STATUS_CONFIG) as StatusFilter[]
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490262-AL3HVLNLL

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:213:22`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490262-BRH7H0HI8

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:214:22`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490262-4MS2FHQNE

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:215:19`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490262-NAXAG4KKK

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:227:25`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ type: 'spring', stiffness: 300, damping: 20 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490262-G7NTQWIU7

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:259:20`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ width: 0 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490262-T2OQE2UKT

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:260:20`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ width: `${percentage}%` }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490262-W72YJ74UN

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:261:23`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ duration: 0.6, delay: index * 0.1 + 0.2, ease: 'easeOut' }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490262-66J4A4NJE

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:274:18`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ scale: 0 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490262-TO5M6DWCC

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:275:18`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ scale: 1 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490262-CH1AALT78

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:276:21`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ type: 'spring', stiffness: 500, damping: 30 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490262-E896D4HEE

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:318:14`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, y: -10 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490262-0IVZ9AJX4

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:319:14`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, y: 0 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490263-IEA5USB5L

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:289:21`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{[...Array(4)].map((_, i) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490263-462KOPG0Z

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:391:58`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
return (Object.keys(STATUS_CONFIG) as StatusFilter[]).map((key) => ({
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490263-TNA44VOI6

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:427:23`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{statusConfigs.map(({ key, config, count }, index) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490265-2P9Y5W5AW

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:58:1495`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'ICONS'

**Code:**
```typescript
ICONS = {
  Layers,
  CheckCircle,
  FileEdit,
  Trash2,
} as const
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490267-9TMNTAEAS

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:68:1633`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'COLOR_CONFIG'

**Code:**
```typescript
COLOR_CONFIG = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490269-6HLJCNNHC

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:123:3305`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'StatusCard'

**Code:**
```typescript
StatusCard = React.memo(function StatusCard({
  config,
  count,
  total,
  isActive,
  isLoadi
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490288-47HGX7NUT

- **File:** `apps\frontend\src\components\ui\StatusDashboard.tsx:335:10`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490298-BUFAZYNU2

- **File:** `apps\frontend\src\components\ui\ThemeToggle.tsx:134:4515`
- **Severity:** MEDIUM
- **Category:** type-safety
- **Rule:** no-unsafe-type-assertion
- **Auto-Fixable:** No

**Description:** Type assertion without validation detected

**Code:**
```typescript
e.target.value as 'light' | 'dark' | 'system'
```

**Suggested Fix:** Validate the type before assertion or use type guards

---

### ISS-1771153490300-NWQ4BP61W

- **File:** `apps\frontend\src\components\ui\ThemeToggle.tsx:39:6`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490300-2FNSBMXRJ

- **File:** `apps\frontend\src\components\ui\ThemeToggle.tsx:96:6`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

### ISS-1771153490300-ZNYXGYK0K

- **File:** `apps\frontend\src\components\ui\ThemeToggle.tsx:17:413`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported function 'ThemeToggle' missing JSDoc

**Code:**
```typescript
export function ThemeToggle({ 
  className = '', 
  size = 'md',
  variant = 'icon' 
}: ThemeTog
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153490300-LE6AH71BC

- **File:** `apps\frontend\src\components\ui\ThemeToggle.tsx:11:273`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** require-jsdoc
- **Auto-Fixable:** No

**Description:** Exported interface 'ThemeToggleProps' missing JSDoc

**Code:**
```typescript
export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?
```

**Suggested Fix:** Add JSDoc comment describing the purpose and parameters

---

### ISS-1771153490300-83ES8GWVT

- **File:** `apps\frontend\src\components\ui\ThemeToggle.tsx:17:413`
- **Severity:** LOW
- **Category:** enterprise
- **Rule:** max-function-length
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

**Suggested Fix:** Refactor into smaller functions with single responsibility

---

### ISS-1771153490306-P218CEADX

- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:71:14`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
initial={{ opacity: 0, x: 100, scale: 0.9 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490306-HE7RQTKNP

- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:72:14`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
animate={{ opacity: 1, x: 0, scale: 1 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490306-67TPCMU12

- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:73:11`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
exit={{ opacity: 0, x: 100, scale: 0.9 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490306-3WHO7VZZJ

- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:74:17`
- **Severity:** MEDIUM
- **Category:** performance
- **Rule:** no-object-literal-in-jsx
- **Auto-Fixable:** No

**Description:** Object/array literal in JSX causes unnecessary re-renders

**Code:**
```typescript
transition={{ type: 'spring', damping: 25, stiffness: 300 }}
```

**Suggested Fix:** Move object/array to useMemo or define outside component

---

### ISS-1771153490306-8ULCAX25X

- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:149:16`
- **Severity:** HIGH
- **Category:** performance
- **Rule:** require-react-keys
- **Auto-Fixable:** No

**Description:** List items may be missing React keys

**Code:**
```typescript
{toasts.map((toast) => (
```

**Suggested Fix:** Add key prop with unique identifier to list items

---

### ISS-1771153490326-MYURCASJD

- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:29:826`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'TOAST_ICONS'

**Code:**
```typescript
TOAST_ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
 
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490327-DW0QHRTB1

- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:39:1029`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'TOAST_STYLES'

**Code:**
```typescript
TOAST_STYLES: Record<ToastType, string> = {
  success:
    'bg-green-50 border-green-200 text-gree
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490328-OTXBYQUJ4

- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:52:1621`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'ICON_STYLES'

**Code:**
```typescript
ICON_STYLES: Record<ToastType, string> = {
  success: 'text-green-500 dark:text-green-400',
  erro
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490330-L7LQFNH2B

- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:62:1912`
- **Severity:** MEDIUM
- **Category:** best-practices
- **Rule:** no-unused-variables
- **Auto-Fixable:** Yes

**Description:** Unused variable: 'ToastItem'

**Code:**
```typescript
ToastItem = React.memo(function ToastItem({
  toast,
  onDismiss,
}: ToastItemProps): JSX.Element
```

**Suggested Fix:** Remove unused variable or prefix with underscore

---

### ISS-1771153490349-E4U9U7UR0

- **File:** `apps\frontend\src\components\ui\ToastContainer.tsx:85:6`
- **Severity:** MEDIUM
- **Category:** accessibility
- **Rule:** require-aria-label
- **Auto-Fixable:** No

**Description:** Button without accessible label

**Code:**
```typescript
<button
```

**Suggested Fix:** Add aria-label or ensure visible text content

---

</details>

---
*Generated by Enterprise Code Scanner v2.0*

# Enterprise Code Quality Scanner v2.0

A comprehensive, enterprise-grade automated code scanner for the AI Quiz Platform that performs deep AST analysis to identify code quality issues, security vulnerabilities, performance bottlenecks, and accessibility concerns.

## Features

### 1. Comprehensive Issue Detection

#### TypeScript Type Safety
- ✅ `any` type usage detection
- ✅ Missing return types on functions
- ✅ Implicit `any` in callbacks
- ✅ Type assertions without validation

#### Security Issues
- ✅ `eval()` usage detection
- ✅ `innerHTML` with unsanitized input
- ✅ Hardcoded secrets/passwords detection
- ✅ SQL injection patterns
- ✅ XSS vulnerabilities (`dangerouslySetInnerHTML`)

#### Performance Issues
- ✅ Memory leaks in useEffect (missing cleanup)
- ✅ Inefficient re-renders (object/array literals in JSX)
- ✅ Large bundle imports (importing entire library)
- ✅ Missing React keys in lists

#### Best Practices
- ✅ Missing error boundaries
- ✅ console.log statements
- ✅ Unused variables/imports
- ✅ Magic numbers/strings
- ✅ TODO/FIXME comments

#### Accessibility (a11y)
- ✅ Images without alt text
- ✅ Buttons without aria-labels
- ✅ Form inputs without labels
- ✅ Missing keyboard handlers

#### Enterprise Standards
- ✅ Missing JSDoc comments on public APIs
- ✅ Functions longer than 50 lines
- ✅ Files longer than 500 lines
- ✅ Cyclomatic complexity > 10
- ✅ Duplicate code blocks

### 2. Issue Classification

Each issue includes:
- **Severity**: `critical` | `high` | `medium` | `low`
- **Category**: `type-safety` | `security` | `performance` | `accessibility` | `best-practices` | `enterprise`
- **File path** and **line/column numbers**
- **Description** and **suggested fix**
- **Auto-fixable** flag
- **Rule ID** for tracking

### 3. Output Formats

Three comprehensive reports are generated:

1. **JSON Report** (`code-quality-reports/issues-log.json`)
   - Machine-readable format for CI/CD integration
   - Contains all issue details and metrics

2. **Markdown Report** (`code-quality-reports/issues-log.md`)
   - Human-readable format with tables and summaries
   - GitHub-compatible for PR comments

3. **HTML Report** (`code-quality-reports/issues-summary.html`)
   - Interactive dashboard with charts
   - Visual score cards and issue breakdown

### 4. Scoring System

Calculates scores (0-10) for:
- Overall code quality (weighted average)
- Type safety
- Security
- Performance
- Accessibility
- Enterprise standards

### 5. Quality Gates

Configurable pass/fail criteria:
- No critical issues
- No high severity security issues
- Overall score >= 9.0
- Type safety score >= 9.5
- Security score >= 9.5

### 6. Re-scan Capability

- Compare current scan with previous scan
- Show improvements/regressions
- Track trends over time
- Store history in `code-quality-reports/scan-history.json`

## Installation

The scanner is already configured in the project. It requires:

```bash
npm install
```

This installs:
- `ts-morph` - TypeScript AST manipulation
- `ts-node` - TypeScript execution

## Usage

### Basic Commands

```bash
# Scan entire codebase
npm run scan:code

# Scan specific directory
npx ts-node scripts/enterprise-code-scanner.ts --path apps/backend/src/quiz

# Auto-fix issues where possible
npm run scan:code:fix

# Generate report only (no console output)
npx ts-node scripts/enterprise-code-scanner.ts --report-only

# Set quality threshold (exit code 1 if below)
npm run scan:code:strict

# Compare with previous scan
npm run scan:code:compare

# Verbose output
npm run scan:code:verbose
```

### NPM Scripts

```bash
# Quick scan
npm run scan:code

# Scan with auto-fix
npm run scan:code:fix

# Strict quality gate (threshold 9.5)
npm run scan:code:strict

# Compare with previous scan
npm run scan:code:compare

# Run quality gate check
npm run quality:gate
```

### CLI Options

```
Options:
  -p, --path <path>        Scan specific directory (default: entire codebase)
  -f, --fix                Auto-fix issues where possible
  -r, --report-only        Generate reports without console output
  -t, --threshold <score>  Set quality threshold (exit code 1 if below)
  -c, --compare            Compare with previous scan
  -v, --verbose            Verbose output
  -h, --help               Show help message
```

## Configuration

Edit `scripts/scanner-config.json` to customize rules:

```json
{
  "include": ["apps/**/*.{ts,tsx}", "libs/**/*.{ts,tsx}"],
  "exclude": ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  "rules": {
    "no-any": { "severity": "high", "enabled": true },
    "no-console": { 
      "severity": "medium", 
      "enabled": true,
      "allowedIn": ["scripts/**", "**/*.config.*"]
    },
    "max-function-length": { 
      "severity": "low", 
      "enabled": true,
      "maxLines": 50 
    },
    "max-file-length": { 
      "severity": "low", 
      "enabled": true,
      "maxLines": 500 
    }
  },
  "qualityGates": {
    "noCriticalIssues": true,
    "noHighSeveritySecurityIssues": true,
    "minOverallScore": 9.0,
    "minTypeSafetyScore": 9.5,
    "minSecurityScore": 9.5
  },
  "scoring": {
    "weights": {
      "type-safety": 0.25,
      "security": 0.25,
      "performance": 0.15,
      "accessibility": 0.15,
      "best-practices": 0.10,
      "enterprise": 0.10
    }
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run scan:code:strict
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: code-quality-reports
          path: code-quality-reports/
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run quality:gate
```

## Report Examples

### Console Output

```
🏢 Enterprise Code Quality Scanner v2.0
════════════════════════════════════════
Found 127 files to scan
Scan complete: 127 files analyzed

════════════════════════════════════════════════════════════
SCAN SUMMARY
════════════════════════════════════════════════════════════
Overall Score: 8.7/10
Quality Gate: ❌ FAILED

📊 Category Scores:
   🟢 type-safety          9.5/10
   🟢 security             9.8/10
   🟡 performance          7.5/10
   🟡 accessibility        7.8/10
   🟢 best-practices       9.2/10
   🟡 enterprise           8.0/10

🚨 Issue Breakdown:
   🔴 Critical: 0
   🟠 High: 2
   🟡 Medium: 12
   🔵 Low: 23
   🔧 Auto-fixable: 8
```

### HTML Report Preview

The HTML report includes:
- Overall score card with visual progress bar
- Category score cards with color coding
- Issue statistics dashboard
- Detailed file-by-file breakdown
- Interactive issue explorer

## Troubleshooting

### Out of Memory

For large codebases:

```bash
node --max-old-space-size=4096 ./node_modules/.bin/ts-node scripts/enterprise-code-scanner.ts
```

### TypeScript Parsing Errors

The scanner skips files that can't be parsed. Check the verbose output:

```bash
npm run scan:code:verbose
```

### Slow Performance

- Use `--path` to scan specific directories
- Exclude test files in config
- Run during off-peak hours for CI

## Architecture

```
enterprise-code-scanner.ts
├── IssueDetector (AST-based detection)
│   ├── Type Safety Checks
│   ├── Security Checks
│   ├── Performance Checks
│   ├── Best Practices Checks
│   ├── Accessibility Checks
│   └── Enterprise Standards Checks
├── Metrics Calculator
├── Scoring System
├── Report Generators
│   ├── JSON
│   ├── Markdown
│   └── HTML
├── History Management
└── Auto-Fix Engine
```

## License

MIT - AI Quiz Platform

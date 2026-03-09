# Code Quality Scanner - Issues Analysis Report

**File:** `code-quality-scanner.ps1`  
**Date:** 2026-03-09  
**Total Lines:** 369  

---

## Executive Summary

This PowerShell script contains **16 identified issues** ranging from runtime errors, logic bugs, missing features, and potential edge case failures. The analysis was performed line-by-line with thorough examination of each function and logic flow.

---

## Critical Issues (Runtime Errors)

### 1. Array Index Out of Bounds - Empty Catch Detection
**Location:** Lines 100-101  
**Severity:** HIGH  

```powershell
if ($lines[$i] -match "catch\s*\([^)]*\)\s*\{\s*\}" -or 
    ($lines[$i] -match "catch\s*\(" -and $lines[$i+1] -match "^\s*\}\s*$"))
```

**Problem:** When `$i` equals `$lines.Count - 1` (the last line), accessing `$lines[$i+1]` will throw an error: "Index was outside the bounds of the array."

**Fix Required:** Add bounds checking before accessing `$lines[$i+1]`

---

### 2. Substring Error on Short Strings
**Location:** Line 258  
**Severity:** HIGH  

```powershell
if ($message.Length -gt 80) {
    $message = $message.Substring(0, 77) + "..."
}
```

**Problem:** While this check protects against short strings, the actual issue is that `$message` could contain special characters that break markdown table formatting even after truncation. Also, the replacement on line 257 does nothing useful.

---

### 3. Ineffective Regex Escape in Comment Check
**Location:** Line 115  
**Severity:** HIGH  

```powershell
if ($lines[$i] -match $hardcodedPattern -and $lines[$i] -notmatch "//.*$hardcodedPattern")
```

**Problem:** The `$hardcodedPattern` variable contains regex special characters (like `\.` and `(` `)`). When interpolated into another regex pattern `//.*$hardcodedPattern`, the parentheses create capturing groups and the backslash is interpreted as regex escape, not literal. This causes the comment check to fail or behave unexpectedly.

**Pattern:** `(localhost|3000|4000|127\.0\.0\.1)` → becomes `//.*(localhost|3000|4000|127\.0\.0\.1)`

---

## Logic Errors

### 4. Incorrect Line Number Calculation for useState
**Location:** Line 178  
**Severity:** HIGH  

```powershell
$lineNum = ($content.Substring(0, $match.Index) -split "`n").Count
```

**Problem:** This calculates the line number where the `useState` match STARTS in the content, but the match could span multiple lines. Additionally, this doesn't account for the actual declaration position. The line number may be off by one or more lines.

---

### 5. Unused State Detection - False Positives
**Location:** Lines 174-175  
**Severity:** MEDIUM  

```powershell
$varUsages = ([regex]::Matches($content, "\b$varName\b")).Count
$setterUsages = ([regex]::Matches($content, "\bset$setterName\b")).Count
```

**Problem:** This is a naive string match that will produce false positives:
- Variable `count` would match inside `iscount`, `recount`, `counter`
- The setter check `set$setterName` (e.g., `setCount`) would fail to find `setCount()` if there's no "set" prefix convention
- It doesn't distinguish between read and write usages

---

### 6. AutoFix Returns Success Without Verifying
**Location:** Lines 218-224  
**Severity:** MEDIUM  

```powershell
if ($Issue.Pattern -and $Issue.Replacement -ne $null) {
    $lines[$lineIndex] = $lines[$lineIndex] -replace $Issue.Pattern, $Issue.Replacement
    Set-Content -Path $FilePath -Value $lines
    return $true
}
return $false
```

**Problem:** The function returns `true` without checking if the `-replace` operation actually made a change. If the pattern doesn't match, the line is still written (unchanged), but `true` is returned indicating success.

---

### 7. Button onClick Detection is Incomplete
**Location:** Lines 148-164  
**Severity:** MEDIUM  

```powershell
if ($lines[$i] -match "<button[^>]*>" -and 
    $lines[$i] -notmatch "onClick" -and 
    ...
```

**Problem:** This only checks for `onClick` on the SAME line as the button tag. In React/JSX, event handlers are commonly on child elements or passed as props. This creates many false positives.

---

### 8. Ineffective Message Pipe Escape
**Location:** Line 257  
**Severity:** LOW  

```powershell
$message = $issue.Message -replace "\|", "\|"
```

**Problem:** This replacement does NOTHING. `-replace "\|", "\|"` replaces a literal pipe with a literal pipe - they're identical. To escape pipes in markdown tables, you need to use `\|` or wrap in backticks.

---

### 9. Duplicate Type Detection - Incomplete Pattern
**Location:** Line 127  
**Severity:** MEDIUM  

```powershell
$typePattern = "^type\s+(\w+)\s*="
```

**Problem:** This regex doesn't handle:
- `interface` declarations
- Type with generics: `type Foo<T> = ...`
- Type with comments between keywords
- Export modifiers: `export type`

---

## Missing/Incomplete Features

### 10. Unused Imports Never Used
**Location:** Lines 94-96  
**Severity:** MEDIUM  

```powershell
$importPattern = "^import\s+\{?\s*([^}]+)\}?\s+from"
$imports = [regex]::Matches($content, $importPattern) | ForEach-Object { $_.Groups[1].Value.Trim() }
```

**Problem:** The imports are extracted but NEVER USED anywhere in the code. The `$imports` variable is populated but not analyzed against the code to find unused imports.

---

### 11. Memory Leak Check Not Implemented
**Location:** Lines 189-190  
**Severity:** MEDIUM  

```powershell
# Issue 9: Check for potential memory leaks (setState in useEffect without cleanup)
# This is a simplified check
```

**Problem:** The comment says "simplified check" but there's no actual code. This feature is completely missing.

---

## Code Quality Issues

### 12. Double File Read
**Location:** Lines 62-63  
**Severity:** LOW  

```powershell
$content = Get-Content -Path $FilePath -Raw
$lines = Get-Content -Path $FilePath
```

**Problem:** The file is read twice. Could use `$lines = $content -split "`n"` instead.

---

### 13. Error Handling Too Lenient
**Location:** Line 14  
**Severity:** LOW  

```powershell
$ErrorActionPreference = "Continue"
```

**Problem:** Errors are silently ignored and execution continues. Critical errors that should halt the script (like file not found mid-operation) are suppressed.

---

### 14. Button Detection - Flawed Closing Tag Logic
**Location:** Line 154  
**Severity:** LOW  

```powershell
if ($lines[$i] -notmatch "</button>") {
```

**Problem:** This checks if the current line does NOT contain a closing tag. But buttons can be multiline:
```jsx
<button
  onClick={handler}
>
  Click
</button>
```
The check will produce false positives for properly formatted multiline buttons.

---

### 15. Import Pattern Missing Edge Cases
**Location:** Line 95  
**Severity:** MEDIUM  

```powershell
$importPattern = "^import\s+\{?\s*([^}]+)\}?\s+from"
```

**Problem:** Doesn't handle:
- Default imports: `import React from 'react'`
- Side-effect imports: `import './styles.css'`
- Dynamic imports: `import('./module')`
- Re-exports: `export { foo } from './bar'`
- Type-only imports (TypeScript): `import type { Foo }`

---

### 16. Fix-Issue Function Doesn't Reload File
**Location:** Lines 208-225  
**Severity:** MEDIUM  

**Problem:** When `$AutoFix` is enabled and multiple issues exist, the `Fix-Issue` function modifies the file but the `$issues` array still contains line numbers from the original file. After the first fix, all subsequent line numbers become invalid because the file content has changed.

Example: If you remove line 10, the original line 20 is now line 19.

---

## Summary Table

| # | Line(s) | Severity | Category | Issue |
|---|---------|----------|----------|-------|
| 1 | 100-101 | CRITICAL | Runtime | Array index out of bounds in catch detection |
| 2 | 258 | CRITICAL | Logic | Substring potential edge case |
| 3 | 115 | CRITICAL | Logic | Regex interpolation breaks comment check |
| 4 | 178 | HIGH | Logic | Incorrect line number for useState |
| 5 | 174-175 | HIGH | Logic | False positives in unused state detection |
| 6 | 218-224 | MEDIUM | Logic | AutoFix reports success without verifying |
| 7 | 148-164 | MEDIUM | Logic | Incomplete button onClick detection |
| 8 | 257 | LOW | Logic | Ineffective pipe escape |
| 9 | 127 | MEDIUM | Logic | Incomplete type detection pattern |
| 10 | 94-96 | MEDIUM | Missing | Unused imports never analyzed |
| 11 | 189-190 | MEDIUM | Missing | Memory leak check not implemented |
| 12 | 62-63 | LOW | Quality | Duplicate file read |
| 13 | 14 | LOW | Quality | Overly lenient error handling |
| 14 | 154 | LOW | Logic | Flawed closing tag check |
| 15 | 95 | MEDIUM | Logic | Import pattern missing cases |
| 16 | 208-225 | MEDIUM | Logic | Line numbers become stale after fixes |

---

## Recommendations

1. **Fix Critical Issues First:** Issues #1, #2, and #3 can cause the script to crash or produce incorrect results.

2. **Implement Memory Leak Detection:** Issue #11 - The feature is mentioned but not implemented.

3. **Fix Line Number Tracking:** Issue #16 - After applying fixes, reload the file and re-scan to get accurate line numbers for subsequent iterations.

4. **Improve Pattern Matching:** Issues #5, #7, #9, #15 require more robust regex patterns.

5. **Add Proper Error Handling:** Change `$ErrorActionPreference` to "Stop" for critical operations or handle errors explicitly.

---

*Report generated by automated code analysis*

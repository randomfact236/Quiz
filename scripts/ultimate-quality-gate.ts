#!/usr/bin/env ts-node
/**
 * ============================================================================
 * ULTIMATE ENTERPRISE QUALITY GATE - SCAN-FIX-LOOP SYSTEM
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { Project, SourceFile, Node, SyntaxKind } from 'ts-morph';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  targetScore: 10.0,
  maxIterations: 20,
  scanLogFile: 'ENTERPRISE-SCAN-LOG.md',
  criticalIssuesFile: 'CRITICAL-ISSUES-REPORT.md',
  backupDir: '.quality-gate-backups',
};

type Severity = 'critical' | 'high' | 'medium' | 'low';
type Category = 'type-safety' | 'security' | 'performance' | 'accessibility' | 'best-practices' | 'enterprise';
type FixStatus = 'pending' | 'fixed' | 'failed' | 'manual-required';

interface CodeIssue {
  id: string;
  ruleId: string;
  severity: Severity;
  category: Category;
  filePath: string;
  lineNumber: number;
  description: string;
  codeSnippet: string;
  suggestedFix: string;
  autoFixable: boolean;
  fixStatus: FixStatus;
  iterationFound: number;
}

interface QualityGateResult {
  startTime: string;
  endTime?: string;
  finalScore: number;
  targetAchieved: boolean;
  totalIterations: number;
  allIssues: CodeIssue[];
  filesModified: string[];
}

// =============================================================================
// COLOR OUTPUT
// =============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message: string, level: 'info' | 'success' | 'warn' | 'error' | 'header' = 'info'): void {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const colorMap: Record<string, string> = {
    info: COLORS.cyan,
    success: COLORS.green,
    warn: COLORS.yellow,
    error: COLORS.red,
    header: COLORS.magenta + COLORS.bright,
  };
  const color = colorMap[level] || COLORS.white;
  console.log(`${color}[${timestamp}] ${message}${COLORS.reset}`);
}

function printBanner(): void {
  console.log(`
${COLORS.magenta}${COLORS.bright}
╔══════════════════════════════════════════════════════════════════════════════╗
║           🏢 ULTIMATE ENTERPRISE QUALITY GATE - SCAN-FIX-LOOP               ║
╚══════════════════════════════════════════════════════════════════════════════╝
${COLORS.reset}`);
}

// =============================================================================
// ISSUE DETECTOR
// =============================================================================

class IssueDetector {
  private issues: CodeIssue[] = [];
  private iteration: number;

  constructor(iteration: number) {
    this.iteration = iteration;
  }

  detectIssues(sourceFile: SourceFile, filePath: string): CodeIssue[] {
    this.issues = [];
    const relativePath = path.relative(process.cwd(), filePath);

    this.checkAnyTypes(sourceFile, relativePath);
    this.checkMissingReturnTypes(sourceFile, relativePath);
    this.checkEvalUsage(sourceFile, relativePath);
    this.checkInnerHTML(sourceFile, relativePath);
    this.checkHardcodedSecrets(sourceFile, relativePath);
    this.checkSQLInjection(sourceFile, relativePath);
    this.checkMemoryLeaks(sourceFile, relativePath);
    this.checkObjectLiteralsInJSX(sourceFile, relativePath);
    this.checkReactKeys(sourceFile, relativePath);
    this.checkConsoleLogs(sourceFile, relativePath);
    this.checkDebuggerStatements(sourceFile, relativePath);
    this.checkMagicNumbers(sourceFile, relativePath);
    this.checkTodoComments(sourceFile, relativePath);
    this.checkImageAlt(sourceFile, relativePath);
    this.checkAriaLabels(sourceFile, relativePath);
    this.checkInputLabels(sourceFile, relativePath);
    this.checkFunctionLength(sourceFile, relativePath);
    this.checkFileLength(sourceFile, relativePath);
    this.checkCyclomaticComplexity(sourceFile, relativePath);
    this.checkErrorHandling(sourceFile, relativePath);
    this.checkEmptyCatchBlocks(sourceFile, relativePath);
    this.checkDangerousInnerHTML(sourceFile, relativePath);

    return this.issues;
  }

  private addIssue(partial: Omit<CodeIssue, 'id' | 'fixStatus' | 'iterationFound'>): void {
    this.issues.push({
      ...partial,
      id: `ISS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      fixStatus: 'pending',
      iterationFound: this.iteration,
    });
  }

  // TYPE SAFETY CHECKS
  private checkAnyTypes(sourceFile: SourceFile, filePath: string): void {
    sourceFile.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.AnyKeyword) {
        this.addIssue({
          ruleId: 'no-any-type',
          severity: 'high',
          category: 'type-safety',
          filePath,
          lineNumber: node.getStartLineNumber(),
          description: 'Usage of "any" type defeats TypeScript type safety',
          codeSnippet: node.getParent()?.getText()?.substring(0, 100) || 'any',
          suggestedFix: 'Replace with specific type or use unknown with type guards',
          autoFixable: false,
        });
      }
    });
  }

  private checkMissingReturnTypes(sourceFile: SourceFile, filePath: string): void {
    const functions = sourceFile.getFunctions();
    functions.forEach((func) => {
      if (func.isExported() && !func.getReturnTypeNode()) {
        const name = func.getName() || 'anonymous';
        this.addIssue({
          ruleId: 'require-return-type',
          severity: 'low',
          category: 'type-safety',
          filePath,
          lineNumber: func.getStartLineNumber(),
          description: `Function '${name}' missing explicit return type`,
          codeSnippet: func.getText().substring(0, 100),
          suggestedFix: 'Add explicit return type annotation',
          autoFixable: false,
        });
      }
    });
  }

  // SECURITY CHECKS
  private checkEvalUsage(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/\beval\s*\(/.test(line) && !line.includes('//')) {
        this.addIssue({
          ruleId: 'no-eval',
          severity: 'critical',
          category: 'security',
          filePath,
          lineNumber: index + 1,
          description: 'eval() usage detected - CRITICAL security risk',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Use JSON.parse or refactor to avoid dynamic code execution',
          autoFixable: false,
        });
      }
    });
  }

  private checkInnerHTML(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/\.innerHTML\s*=/.test(line) && !line.includes('sanitiz')) {
        this.addIssue({
          ruleId: 'no-unsafe-innerhtml',
          severity: 'critical',
          category: 'security',
          filePath,
          lineNumber: index + 1,
          description: 'Unsanitized innerHTML assignment - XSS vulnerability',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Use textContent or sanitize HTML with DOMPurify',
          autoFixable: false,
        });
      }
    });
  }

  private checkDangerousInnerHTML(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/dangerouslySetInnerHTML/.test(line)) {
        this.addIssue({
          ruleId: 'no-dangerously-set-inner-html',
          severity: 'high',
          category: 'security',
          filePath,
          lineNumber: index + 1,
          description: 'dangerouslySetInnerHTML can lead to XSS attacks',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Ensure content is sanitized before rendering',
          autoFixable: false,
        });
      }
    });
  }

  private checkHardcodedSecrets(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    const secretPatterns = [
      { pattern: /password\s*[=:]\s*['"][^'"]{4,}['"]/i, name: 'password' },
      { pattern: /secret\s*[=:]\s*['"][^'"]{4,}['"]/i, name: 'secret' },
      { pattern: /api[_-]?key\s*[=:]\s*['"][^'"]{8,}['"]/i, name: 'API key' },
      { pattern: /token\s*[=:]\s*['"][^'"]{20,}['"]/i, name: 'token' },
    ];

    lines.forEach((line, index) => {
      if (line.includes('process.env') || line.includes('//')) return;
      secretPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(line)) {
          this.addIssue({
            ruleId: 'no-hardcoded-secrets',
            severity: 'critical',
            category: 'security',
            filePath,
            lineNumber: index + 1,
            description: `HARDCODED ${name.toUpperCase()} DETECTED - SECURITY RISK`,
            codeSnippet: '*** REDACTED ***',
            suggestedFix: 'Use environment variables (process.env.XXX)',
            autoFixable: false,
          });
        }
      });
    });
  }

  private checkSQLInjection(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/query\s*\(\s*[`'"].*\$\{/.test(line)) {
        this.addIssue({
          ruleId: 'no-sql-injection',
          severity: 'critical',
          category: 'security',
          filePath,
          lineNumber: index + 1,
          description: 'Potential SQL injection - dynamic query construction',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Use parameterized queries or prepared statements',
          autoFixable: false,
        });
      }
    });
  }

  private checkMemoryLeaks(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    if (content.includes('setInterval') && !content.includes('clearInterval')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (/setInterval\s*\(/.test(line)) {
          this.addIssue({
            ruleId: 'require-interval-cleanup',
            severity: 'medium',
            category: 'performance',
            filePath,
            lineNumber: index + 1,
            description: 'setInterval without cleanup - memory leak risk',
            codeSnippet: line.trim().substring(0, 100),
            suggestedFix: 'Clear interval in component cleanup',
            autoFixable: false,
          });
        }
      });
    }
  }

  private checkObjectLiteralsInJSX(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/\w+\s*=\s*\{\s*\[/.test(line) || /\w+\s*=\s*\{\s*\{/.test(line)) {
        if (!line.includes('style=') && !line.includes('className=')) {
          this.addIssue({
            ruleId: 'no-inline-object-jsx',
            severity: 'low',
            category: 'performance',
            filePath,
            lineNumber: index + 1,
            description: 'Object/array literal in JSX causes unnecessary re-renders',
            codeSnippet: line.trim().substring(0, 100),
            suggestedFix: 'Move to useMemo or define outside component',
            autoFixable: false,
          });
        }
      }
    });
  }

  private checkReactKeys(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/\.map\s*\([^)]*\)\s*=>/.test(line) && !line.includes('key=')) {
        this.addIssue({
          ruleId: 'require-react-keys',
          severity: 'high',
          category: 'performance',
          filePath,
          lineNumber: index + 1,
          description: 'List rendering without key prop',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Add key prop with unique identifier',
          autoFixable: false,
        });
      }
    });
  }

  private checkConsoleLogs(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    if (filePath.includes('logger') || filePath.includes('config')) return;
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/console\.(log|debug|info)\s*\(/.test(line) && !line.includes('//')) {
        this.addIssue({
          ruleId: 'no-console-logs',
          severity: 'low',
          category: 'best-practices',
          filePath,
          lineNumber: index + 1,
          description: 'console.log should be replaced with structured logger',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Use winston/pino logger or remove',
          autoFixable: true,
        });
      }
    });
  }

  private checkDebuggerStatements(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/\bdebugger\b/.test(line)) {
        this.addIssue({
          ruleId: 'no-debugger',
          severity: 'high',
          category: 'best-practices',
          filePath,
          lineNumber: index + 1,
          description: 'debugger statement should not be in production code',
          codeSnippet: line.trim(),
          suggestedFix: 'Remove debugger statement',
          autoFixable: true,
        });
      }
    });
  }

  private checkMagicNumbers(sourceFile: SourceFile, filePath: string): void {
    const allowedNumbers = [0, 1, -1, 2, 100, 1000];
    sourceFile.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.NumericLiteral) {
        const value = parseFloat(node.getText());
        if (!allowedNumbers.includes(value) && value > 10) {
          const parent = node.getParent();
          if (Node.isVariableDeclaration(parent) || Node.isPropertyAssignment(parent)) return;
          this.addIssue({
            ruleId: 'no-magic-numbers',
            severity: 'low',
            category: 'best-practices',
            filePath,
            lineNumber: node.getStartLineNumber(),
            description: `Magic number ${value} should be a named constant`,
            codeSnippet: node.getText(),
            suggestedFix: `Define constant: const VALUE = ${value}`,
            autoFixable: false,
          });
        }
      }
    });
  }

  private checkTodoComments(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const todoMatch = line.match(/\/\/\s*(TODO|FIXME|HACK|XXX)[\s:]*/i);
      if (todoMatch) {
        this.addIssue({
          ruleId: 'no-todo-comments',
          severity: 'low',
          category: 'best-practices',
          filePath,
          lineNumber: index + 1,
          description: `${todoMatch[1].toUpperCase()} comment should be addressed`,
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Resolve the issue or create a ticket',
          autoFixable: false,
        });
      }
    });
  }

  private checkImageAlt(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/<img\s/.test(line) && !/alt\s*=/.test(line)) {
        this.addIssue({
          ruleId: 'require-img-alt',
          severity: 'high',
          category: 'accessibility',
          filePath,
          lineNumber: index + 1,
          description: 'Image missing alt attribute',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Add descriptive alt attribute',
          autoFixable: false,
        });
      }
    });
  }

  private checkAriaLabels(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/<button\s/.test(line) && !/aria-label/.test(line) && line.includes('icon')) {
        this.addIssue({
          ruleId: 'require-aria-label',
          severity: 'medium',
          category: 'accessibility',
          filePath,
          lineNumber: index + 1,
          description: 'Icon button missing aria-label',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Add aria-label describing the button action',
          autoFixable: false,
        });
      }
    });
  }

  private checkInputLabels(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/<input\s/.test(line) && !/aria-label/.test(line) && !/placeholder/.test(line)) {
        const context = lines.slice(Math.max(0, index - 3), index + 1).join(' ');
        if (!context.includes('<label')) {
          this.addIssue({
            ruleId: 'require-input-label',
            severity: 'medium',
            category: 'accessibility',
            filePath,
            lineNumber: index + 1,
            description: 'Form input without associated label',
            codeSnippet: line.trim().substring(0, 100),
            suggestedFix: 'Wrap in label or add aria-label',
            autoFixable: false,
          });
        }
      }
    });
  }

  private checkFunctionLength(sourceFile: SourceFile, filePath: string): void {
    const maxLines = 50;
    const functions = [
      ...sourceFile.getFunctions(),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
    ];

    functions.forEach((func) => {
      const length = func.getEndLineNumber() - func.getStartLineNumber() + 1;
      if (length > maxLines) {
        let name = 'anonymous';
        if (Node.isFunctionDeclaration(func)) {
          name = func.getName() || 'anonymous';
        } else if (Node.isMethodDeclaration(func)) {
          name = func.getName();
        }
        this.addIssue({
          ruleId: 'max-function-length',
          severity: 'medium',
          category: 'enterprise',
          filePath,
          lineNumber: func.getStartLineNumber(),
          description: `Function '${name}' is ${length} lines (max: ${maxLines})`,
          codeSnippet: func.getText().substring(0, 100),
          suggestedFix: 'Refactor into smaller functions',
          autoFixable: false,
        });
      }
    });
  }

  private checkFileLength(sourceFile: SourceFile, filePath: string): void {
    const maxLines = 500;
    const lineCount = sourceFile.getFullText().split('\n').length;
    if (lineCount > maxLines) {
      this.addIssue({
        ruleId: 'max-file-length',
        severity: 'medium',
        category: 'enterprise',
        filePath,
        lineNumber: 1,
        description: `File has ${lineCount} lines (max: ${maxLines})`,
        codeSnippet: `Total lines: ${lineCount}`,
        suggestedFix: 'Split into multiple files',
        autoFixable: false,
      });
    }
  }

  private checkCyclomaticComplexity(sourceFile: SourceFile, filePath: string): void {
    const maxComplexity = 15;
    const functions = [
      ...sourceFile.getFunctions(),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
    ];

    functions.forEach((func) => {
      const body = func.getBody();
      if (!body) return;
      const text = body.getText();
      let complexity = 1;
      complexity += (text.match(/\bif\b/g) || []).length;
      complexity += (text.match(/\bcase\b/g) || []).length;
      complexity += (text.match(/\bfor\b/g) || []).length;
      complexity += (text.match(/\bwhile\b/g) || []).length;
      complexity += (text.match(/\?\s*[^:?]*\s*:/g) || []).length;

      if (complexity > maxComplexity) {
        let name = 'anonymous';
        if (Node.isFunctionDeclaration(func)) {
          name = func.getName() || 'anonymous';
        } else if (Node.isMethodDeclaration(func)) {
          name = func.getName();
        }
        this.addIssue({
          ruleId: 'max-cyclomatic-complexity',
          severity: 'high',
          category: 'enterprise',
          filePath,
          lineNumber: func.getStartLineNumber(),
          description: `Function '${name}' has complexity of ${complexity} (max: ${maxComplexity})`,
          codeSnippet: func.getText().substring(0, 100),
          suggestedFix: 'Refactor to reduce branching',
          autoFixable: false,
        });
      }
    });
  }

  private checkErrorHandling(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/Promise\s*\.\s*then\s*\(/.test(line) && !content.includes('.catch(')) {
        this.addIssue({
          ruleId: 'require-error-handling',
          severity: 'high',
          category: 'enterprise',
          filePath,
          lineNumber: index + 1,
          description: 'Promise chain without error handling',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Add .catch() or use try/catch with async/await',
          autoFixable: false,
        });
      }
    });
  }

  private checkEmptyCatchBlocks(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line) || /catch\s*\([^)]*\)\s*\{\s*\/\/\s*ignore/i.test(line)) {
        this.addIssue({
          ruleId: 'no-empty-catch',
          severity: 'high',
          category: 'enterprise',
          filePath,
          lineNumber: index + 1,
          description: 'Empty catch block - errors silently ignored',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Handle the error - log it or re-throw',
          autoFixable: false,
        });
      }
    });
  }
}

// =============================================================================
// AUTO-FIX ENGINE
// =============================================================================

class AutoFixEngine {
  applyFixes(issues: CodeIssue[]): { fixed: number; modifiedFiles: string[] } {
    let fixed = 0;
    const modifiedFiles = new Set<string>();

    const issuesByFile = new Map<string, CodeIssue[]>();
    issues.forEach(issue => {
      if (issue.autoFixable && issue.fixStatus === 'pending') {
        const list = issuesByFile.get(issue.filePath) || [];
        list.push(issue);
        issuesByFile.set(issue.filePath, list);
      }
    });

    for (const [filePath, fileIssues] of issuesByFile) {
      try {
        if (!fs.existsSync(filePath)) continue;

        let content = fs.readFileSync(filePath, 'utf-8');
        const originalContent = content;
        const lines = content.split('\n');

        fileIssues.sort((a, b) => b.lineNumber - a.lineNumber);

        for (const issue of fileIssues) {
          const lineIndex = issue.lineNumber - 1;
          if (lineIndex < 0 || lineIndex >= lines.length) continue;

          const originalLine = lines[lineIndex];
          let fixedLine = originalLine;

          switch (issue.ruleId) {
            case 'no-console-logs':
              fixedLine = originalLine.replace(/console\.(log|debug|info)\s*\(/g, '// console.$1(');
              break;
            case 'no-debugger':
              fixedLine = originalLine.replace(/debugger;?/g, '');
              break;
          }

          if (fixedLine !== originalLine) {
            lines[lineIndex] = fixedLine;
            issue.fixStatus = 'fixed';
            fixed++;
            log(`  Fixed: ${path.relative(process.cwd(), filePath)}:${issue.lineNumber}`, 'success');
          }
        }

        const newContent = lines.join('\n');
        if (newContent !== originalContent) {
          fs.writeFileSync(filePath, newContent, 'utf-8');
          modifiedFiles.add(filePath);
        }
      } catch (error) {
        // Continue with other files
      }
    }

    return { fixed, modifiedFiles: Array.from(modifiedFiles) };
  }
}

// =============================================================================
// SCORING
// =============================================================================

function calculateScore(issues: CodeIssue[]): number {
  const penalties: Record<Severity, number> = {
    critical: 2.0,
    high: 1.0,
    medium: 0.5,
    low: 0.1,
  };

  let totalPenalty = 0;
  issues.forEach(issue => {
    if (issue.fixStatus !== 'fixed') {
      totalPenalty += penalties[issue.severity];
    }
  });

  const score = Math.max(0, 10 - totalPenalty);
  return Math.round(score * 10) / 10;
}

function countBySeverity(issues: CodeIssue[]): Record<Severity, number> {
  return {
    critical: issues.filter(i => i.severity === 'critical' && i.fixStatus !== 'fixed').length,
    high: issues.filter(i => i.severity === 'high' && i.fixStatus !== 'fixed').length,
    medium: issues.filter(i => i.severity === 'medium' && i.fixStatus !== 'fixed').length,
    low: issues.filter(i => i.severity === 'low' && i.fixStatus !== 'fixed').length,
  };
}

// =============================================================================
// FILE SCANNER
// =============================================================================

async function scanFiles(iteration: number): Promise<{ issues: CodeIssue[]; fileCount: number }> {
  log(`Scanning codebase (Iteration ${iteration})...`, 'header');

  const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });

  const targetFiles: string[] = [];
  const baseDirs = ['apps', 'libs'];

  for (const baseDir of baseDirs) {
    const fullPath = path.resolve(baseDir);
    if (fs.existsSync(fullPath)) {
      const findFiles = (dir: string): void => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            if (item === 'node_modules' || item === '.next' || item === 'dist' || item.startsWith('.')) continue;
            findFiles(itemPath);
          } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            if (!item.includes('.spec.') && !item.includes('.test.') && !item.endsWith('.d.ts')) {
              targetFiles.push(itemPath);
            }
          }
        }
      };
      findFiles(fullPath);
    }
  }

  const uniqueFiles = [...new Set(targetFiles)];
  log(`Found ${uniqueFiles.length} files to scan`, 'info');

  for (const file of uniqueFiles) {
    try {
      project.addSourceFileAtPath(file);
    } catch {
      // Skip unparseable files
    }
  }

  const detector = new IssueDetector(iteration);
  const allIssues: CodeIssue[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    const issues = detector.detectIssues(sourceFile, filePath);
    allIssues.push(...issues);
  }

  log(`Found ${allIssues.length} issues`, 'info');
  return { issues: allIssues, fileCount: uniqueFiles.length };
}

// =============================================================================
// REPORT GENERATORS
// =============================================================================

function generateReports(result: QualityGateResult): void {
  // Markdown Report
  let md = `# Enterprise Quality Gate - Scan Log

**Started:** ${result.startTime}  
**Completed:** ${result.endTime || 'N/A'}  
**Target Score:** ${CONFIG.targetScore}/10  
**Final Score:** ${result.finalScore}/10  
**Target Achieved:** ${result.targetAchieved ? '✅ YES' : '❌ NO'}  
**Total Iterations:** ${result.totalIterations}

---

## Issue Summary

`;

  const pendingIssues = result.allIssues.filter(i => i.fixStatus !== 'fixed');
  const bySeverity = countBySeverity(result.allIssues);

  md += `### By Severity
- 🔴 Critical: ${bySeverity.critical}
- 🟠 High: ${bySeverity.high}
- 🟡 Medium: ${bySeverity.medium}
- 🔵 Low: ${bySeverity.low}

---

## Detailed Issues

`;

  if (pendingIssues.length === 0) {
    md += '🎉 No pending issues!\n';
  } else {
    pendingIssues.forEach(issue => {
      md += `### ${issue.ruleId}

- **Severity:** ${issue.severity}
- **Category:** ${issue.category}
- **File:** \`${issue.filePath}:${issue.lineNumber}\`
- **Status:** ${issue.fixStatus}
- **Auto-Fixable:** ${issue.autoFixable ? 'Yes' : 'No'}

**Description:** ${issue.description}

**Code:**
\`\`\`typescript
${issue.codeSnippet}
\`\`\`

**Suggested Fix:** ${issue.suggestedFix}

---

`;
    });
  }

  fs.writeFileSync(CONFIG.scanLogFile, md);

  // Critical Issues Report
  const criticalIssues = result.allIssues.filter(i => i.severity === 'critical' && i.fixStatus !== 'fixed');
  const highIssues = result.allIssues.filter(i => i.severity === 'high' && i.fixStatus !== 'fixed');

  let criticalMd = `# 🚨 CRITICAL ISSUES REPORT

**Generated:** ${new Date().toISOString()}  
**Critical:** ${criticalIssues.length}  
**High:** ${highIssues.length}

`;

  if (criticalIssues.length > 0) {
    criticalMd += `## 🔴 CRITICAL ISSUES\n\n`;
    criticalIssues.forEach(issue => {
      criticalMd += `- **${issue.ruleId}** in \`${issue.filePath}:${issue.lineNumber}\`\n  ${issue.description}\n\n`;
    });
  }

  if (highIssues.length > 0) {
    criticalMd += `## 🟠 HIGH SEVERITY ISSUES\n\n`;
    highIssues.forEach(issue => {
      criticalMd += `- **${issue.ruleId}** in \`${issue.filePath}:${issue.lineNumber}\`\n  ${issue.description}\n\n`;
    });
  }

  fs.writeFileSync(CONFIG.criticalIssuesFile, criticalMd);
}

// =============================================================================
// MAIN LOOP
// =============================================================================

async function runQualityGate(): Promise<QualityGateResult> {
  printBanner();

  const result: QualityGateResult = {
    startTime: new Date().toISOString(),
    finalScore: 0,
    targetAchieved: false,
    totalIterations: 0,
    allIssues: [],
    filesModified: [],
  };

  let previousScore = 0;
  let stagnantCount = 0;

  for (let iteration = 1; iteration <= CONFIG.maxIterations; iteration++) {
    log('', 'info');
    log(`══════════════════════════════════════════════════════════`, 'header');
    log(`  ITERATION ${iteration} of ${CONFIG.maxIterations}`, 'header');
    log(`══════════════════════════════════════════════════════════`, 'header');

    // Scan
    const { issues, fileCount } = await scanFiles(iteration);
    result.allIssues = issues;

    // Calculate score
    const score = calculateScore(issues);
    const bySeverity = countBySeverity(issues);

    log(`Score: ${score}/10 (Target: ${CONFIG.targetScore}/10)`, score >= CONFIG.targetScore ? 'success' : 'warn');
    log(`Issues - 🔴${bySeverity.critical} 🟠${bySeverity.high} 🟡${bySeverity.medium} 🔵${bySeverity.low}`, 'info');

    const passed = score >= CONFIG.targetScore && bySeverity.critical === 0 && bySeverity.high === 0;
    result.totalIterations = iteration;

    if (passed) {
      log('', 'success');
      log('🎉 TARGET ACHIEVED! ENTERPRISE GRADE 10/10 REACHED! 🎉', 'success');
      result.targetAchieved = true;
      result.finalScore = score;
      break;
    }

    // Check stagnation
    if (score === previousScore) {
      stagnantCount++;
      if (stagnantCount >= 3) {
        log('⚠️ Score not improving - manual intervention required', 'warn');
        result.finalScore = score;
        break;
      }
    } else {
      stagnantCount = 0;
    }
    previousScore = score;

    // Apply fixes
    log('Applying automated fixes...', 'header');
    const fixEngine = new AutoFixEngine();
    const fixResult = fixEngine.applyFixes(issues);
    log(`Fixed ${fixResult.fixed} issues`, 'success');
    fixResult.modifiedFiles.forEach(f => result.filesModified.push(f));

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  result.endTime = new Date().toISOString();
  result.filesModified = [...new Set(result.filesModified)];

  generateReports(result);

  // Final summary
  console.log(`
${COLORS.cyan}${COLORS.bright}
══════════════════════════════════════════════════════════════
                     FINAL SUMMARY
══════════════════════════════════════════════════════════════${COLORS.reset}
`);
  log(`Final Score: ${result.finalScore}/10`, result.finalScore >= CONFIG.targetScore ? 'success' : 'warn');
  log(`Target Achieved: ${result.targetAchieved ? '✅ YES' : '❌ NO'}`, result.targetAchieved ? 'success' : 'error');
  log(`Iterations: ${result.totalIterations}`, 'info');
  log(`Files Modified: ${result.filesModified.length}`, 'info');
  log(`Reports: ${CONFIG.scanLogFile}, ${CONFIG.criticalIssuesFile}`, 'info');

  return result;
}

// =============================================================================
// ENTRY POINT
// =============================================================================

if (require.main === module) {
  runQualityGate()
    .then((result) => {
      process.exit(result.targetAchieved ? 0 : 1);
    })
    .catch((error) => {
      log(`Fatal error: ${error}`, 'error');
      process.exit(1);
    });
}

export { runQualityGate, QualityGateResult, CodeIssue };

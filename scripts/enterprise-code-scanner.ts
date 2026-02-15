#!/usr/bin/env ts-node
/**
 * ============================================================================
 * ENTERPRISE CODE QUALITY SCANNER v2.0
 * ============================================================================
 * Enterprise-grade automated code scanning with comprehensive issue detection,
 * scoring, reporting, and trend tracking capabilities.
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { Project, SourceFile, Node, SyntaxKind } from 'ts-morph';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

type Severity = 'critical' | 'high' | 'medium' | 'low';
type Category = 'type-safety' | 'security' | 'performance' | 'accessibility' | 'best-practices' | 'enterprise';
type IssueStatus = 'open' | 'fixed' | 'wontfix';

interface CodeIssue {
  id: string;
  ruleId: string;
  severity: Severity;
  category: Category;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  description: string;
  codeSnippet: string;
  suggestedFix: string;
  autoFixable: boolean;
  status: IssueStatus;
  createdAt: string;
}

interface FileMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  functionCount: number;
  classCount: number;
  interfaceCount: number;
  maxFunctionLength: number;
  averageComplexity: number;
}

interface ScanResult {
  filePath: string;
  relativePath: string;
  metrics: FileMetrics;
  issues: CodeIssue[];
}

interface CategoryScore {
  category: Category;
  score: number;
  maxScore: number;
  issueCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

interface ScanSummary {
  scanId: string;
  timestamp: string;
  duration: number;
  totalFiles: number;
  totalIssues: number;
  overallScore: number;
  categoryScores: CategoryScore[];
  passedQualityGate: boolean;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  autoFixableCount: number;
}

interface ScanHistory {
  scans: ScanSummary[];
}

interface ScannerConfig {
  name: string;
  version: string;
  include: string[];
  exclude: string[];
  rules: Record<string, RuleConfig>;
  qualityGates: QualityGateConfig;
  scoring: ScoringConfig;
  autoFix: AutoFixConfig;
  reporting: ReportingConfig;
}

interface RuleConfig {
  severity: Severity;
  enabled: boolean;
  description: string;
  [key: string]: unknown;
}

interface QualityGateConfig {
  noCriticalIssues: boolean;
  noHighSeveritySecurityIssues: boolean;
  minOverallScore: number;
  minTypeSafetyScore: number;
  minSecurityScore: number;
  minPerformanceScore: number;
  minAccessibilityScore: number;
}

interface ScoringConfig {
  weights: Record<string, number>;
  severityPenalties: Record<Severity, number>;
}

interface AutoFixConfig {
  enabled: boolean;
  rules: string[];
}

interface ReportingConfig {
  outputDir: string;
  formats: string[];
  historyFile: string;
}

interface CLIOptions {
  path?: string;
  fix?: boolean;
  reportOnly?: boolean;
  threshold?: number;
  verbose?: boolean;
  compare?: boolean;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

function log(message: string, level: 'info' | 'success' | 'warn' | 'error' | 'debug' = 'info'): void {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const colorMap: Record<string, string> = {
    info: COLORS.cyan,
    success: COLORS.green,
    warn: COLORS.yellow,
    error: COLORS.red,
    debug: COLORS.dim,
  };
  const color = colorMap[level] || COLORS.white;
  console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}${COLORS.reset}`);
}

function generateIssueId(): string {
  return `ISS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function generateScanId(): string {
  return `SCAN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

function loadConfig(configPath: string): ScannerConfig {
  const fullPath = path.resolve(configPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Config file not found: ${fullPath}`);
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as ScannerConfig;
}

// =============================================================================
// ISSUE DETECTION RULES
// =============================================================================

class IssueDetector {
  private issues: CodeIssue[] = [];
  private config: ScannerConfig;

  constructor(config: ScannerConfig) {
    this.config = config;
  }

  detectIssues(sourceFile: SourceFile, filePath: string): CodeIssue[] {
    this.issues = [];
    const relativePath = path.relative(process.cwd(), filePath);

    // TypeScript Type Safety Checks
    this.checkAnyType(sourceFile, relativePath);
    this.checkMissingReturnTypes(sourceFile, relativePath);
    this.checkTypeAssertions(sourceFile, relativePath);

    // Security Checks
    this.checkEvalUsage(sourceFile, relativePath);
    this.checkInnerHTML(sourceFile, relativePath);
    this.checkHardcodedSecrets(sourceFile, relativePath);
    this.checkDangerouslySetInnerHTML(sourceFile, relativePath);
    this.checkSQLInjectionPatterns(sourceFile, relativePath);

    // Performance Checks
    this.checkMemoryLeaks(sourceFile, relativePath);
    this.checkObjectLiteralsInJSX(sourceFile, relativePath);
    this.checkLibraryImports(sourceFile, relativePath);
    this.checkReactKeys(sourceFile, relativePath);

    // Best Practices Checks
    this.checkConsoleLogs(sourceFile, relativePath);
    this.checkUnusedVariables(sourceFile, relativePath);
    this.checkMagicNumbers(sourceFile, relativePath);
    this.checkTodoComments(sourceFile, relativePath);

    // Accessibility Checks
    this.checkImageAlt(sourceFile, relativePath);
    this.checkAriaLabels(sourceFile, relativePath);
    this.checkInputLabels(sourceFile, relativePath);

    // Enterprise Standards Checks
    this.checkJSDocComments(sourceFile, relativePath);
    this.checkFunctionLength(sourceFile, relativePath);
    this.checkFileLength(sourceFile, relativePath);
    this.checkCyclomaticComplexity(sourceFile, relativePath);

    return this.issues;
  }

  // Type Safety Checks
  private checkAnyType(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['no-any'];
    if (!rule?.enabled) return;

    sourceFile.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.AnyKeyword) {
        const line = node.getStartLineNumber();
        const col = node.getStartLinePos();
        this.addIssue({
          ruleId: 'no-any',
          severity: rule.severity,
          category: 'type-safety',
          filePath,
          lineNumber: line,
          columnNumber: col,
          description: 'Usage of "any" type reduces type safety',
          codeSnippet: node.getParent()?.getText()?.substring(0, 100) || 'any',
          suggestedFix: 'Replace with specific type or use "unknown" with type guards',
          autoFixable: false,
        });
      }
    });
  }

  private checkMissingReturnTypes(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['require-return-type'];
    if (!rule?.enabled) return;

    const functions = [
      ...sourceFile.getFunctions(),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
    ];

    functions.forEach((func) => {
      // Skip if already has return type
      if (func.getReturnTypeNode()) return;
      
      // Skip arrow functions with implicit returns
      if (Node.isArrowFunction(func)) return;

      const line = func.getStartLineNumber();
      let name = 'anonymous';
      
      if (Node.isFunctionDeclaration(func)) {
        name = func.getName() || 'anonymous';
      } else if (Node.isMethodDeclaration(func)) {
        name = func.getName();
      }

      this.addIssue({
        ruleId: 'require-return-type',
        severity: rule.severity,
        category: 'type-safety',
        filePath,
        lineNumber: line,
        columnNumber: func.getStartLinePos(),
        description: `Function '${name}' is missing explicit return type`,
        codeSnippet: func.getText().substring(0, 100),
        suggestedFix: 'Add explicit return type annotation',
        autoFixable: false,
      });
    });
  }

  private checkTypeAssertions(sourceFile: SourceFile, filePath: string): void {
    sourceFile.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.TypeAssertionExpression || 
          node.getKind() === SyntaxKind.AsExpression) {
        const text = node.getText();
        if (!text.includes(' as unknown as ') && text.includes(' as ')) {
          this.addIssue({
            ruleId: 'no-unsafe-type-assertion',
            severity: 'medium',
            category: 'type-safety',
            filePath,
            lineNumber: node.getStartLineNumber(),
            columnNumber: node.getStartLinePos(),
            description: 'Type assertion without validation detected',
            codeSnippet: text.substring(0, 100),
            suggestedFix: 'Validate the type before assertion or use type guards',
            autoFixable: false,
          });
        }
      }
    });
  }

  // Security Checks
  private checkEvalUsage(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['no-eval'];
    if (!rule?.enabled) return;

    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (/\beval\s*\(/.test(line) && !line.includes('//') && !line.includes('eslint-disable')) {
        this.addIssue({
          ruleId: 'no-eval',
          severity: rule.severity,
          category: 'security',
          filePath,
          lineNumber: index + 1,
          columnNumber: line.indexOf('eval'),
          description: 'eval() usage detected - severe security risk',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Use JSON.parse for JSON data or Function constructor for dynamic code',
          autoFixable: false,
        });
      }
    });
  }

  private checkInnerHTML(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['no-innerhtml'];
    if (!rule?.enabled) return;

    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (/\.innerHTML\s*=/.test(line) && !line.includes('sanitiz') && !line.includes('DOMPurify')) {
        this.addIssue({
          ruleId: 'no-innerhtml',
          severity: rule.severity,
          category: 'security',
          filePath,
          lineNumber: index + 1,
          columnNumber: line.indexOf('innerHTML'),
          description: 'Unsanitized innerHTML assignment detected',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Use textContent or sanitize HTML with DOMPurify',
          autoFixable: false,
        });
      }
    });
  }

  private checkHardcodedSecrets(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['no-hardcoded-secrets'];
    if (!rule?.enabled) return;

    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    
    const secretPatterns = [
      { pattern: /password\s*[=:]\s*['"][^'"]{4,}['"]/i, name: 'password' },
      { pattern: /secret\s*[=:]\s*['"][^'"]{4,}['"]/i, name: 'secret' },
      { pattern: /api[_-]?key\s*[=:]\s*['"][^'"]{8,}['"]/i, name: 'API key' },
      { pattern: /private[_-]?key\s*[=:]\s*['"][^'"]{20,}['"]/i, name: 'private key' },
      { pattern: /token\s*[=:]\s*['"][^'"]{20,}['"]/i, name: 'token' },
    ];

    lines.forEach((line, index) => {
      // Skip environment variable usage and comments
      if (line.includes('process.env') || line.includes('//') || line.includes('*')) return;
      if (/example|placeholder|demo|test|mock/i.test(line)) return;

      secretPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(line)) {
          this.addIssue({
            ruleId: 'no-hardcoded-secrets',
            severity: rule.severity,
            category: 'security',
            filePath,
            lineNumber: index + 1,
            columnNumber: 0,
            description: `Potential hardcoded ${name} detected`,
            codeSnippet: line.trim().substring(0, 100),
            suggestedFix: 'Use environment variables or a secure secret management system',
            autoFixable: false,
          });
        }
      });
    });
  }

  private checkDangerouslySetInnerHTML(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['no-dangerously-set-inner-html'];
    if (!rule?.enabled) return;

    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (/dangerouslySetInnerHTML/.test(line)) {
        this.addIssue({
          ruleId: 'no-dangerously-set-inner-html',
          severity: rule.severity,
          category: 'security',
          filePath,
          lineNumber: index + 1,
          columnNumber: line.indexOf('dangerouslySetInnerHTML'),
          description: 'dangerouslySetInnerHTML can lead to XSS attacks',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Use safe HTML sanitization or avoid rendering raw HTML',
          autoFixable: false,
        });
      }
    });
  }

  private checkSQLInjectionPatterns(sourceFile: SourceFile, filePath: string): void {
    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Detect string concatenation in SQL-like queries
      if (/query\s*\(\s*[`'"].*\$\{/.test(line) || /execute\s*\(\s*[`'"].*\+/.test(line)) {
        this.addIssue({
          ruleId: 'no-sql-injection',
          severity: 'critical',
          category: 'security',
          filePath,
          lineNumber: index + 1,
          columnNumber: 0,
          description: 'Potential SQL injection vulnerability',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Use parameterized queries or prepared statements',
          autoFixable: false,
        });
      }
    });
  }

  // Performance Checks
  private checkMemoryLeaks(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['require-useeffect-cleanup'];
    if (!rule?.enabled) return;

    const content = sourceFile.getFullText();
    
    // Check for setInterval without clearInterval
    const setIntervalMatches = content.matchAll(/setInterval\s*\(/g);
    for (const match of setIntervalMatches) {
      const context = content.substring(Math.max(0, (match.index ?? 0) - 500), (match.index ?? 0) + 500);
      if (!context.includes('clearInterval') && !context.includes('useEffect')) {
        const matchIndex = match.index ?? 0;
        const linesBefore = content.substring(0, matchIndex).split('\n');
        const lastLine = linesBefore[linesBefore.length - 1];
        this.addIssue({
          ruleId: 'require-useeffect-cleanup',
          severity: rule.severity,
          category: 'performance',
          filePath,
          lineNumber: linesBefore.length,
          columnNumber: 0,
          description: 'setInterval without cleanup detected - potential memory leak',
          codeSnippet: lastLine ? lastLine.trim().substring(0, 100) : 'setInterval',
          suggestedFix: 'Clear interval in cleanup function or use useEffect with cleanup',
          autoFixable: false,
        });
      }
    }

    // Check for addEventListener without removeEventListener
    const addListenerMatches = content.matchAll(/addEventListener\s*\(/g);
    for (const match of addListenerMatches) {
      const matchIndex = match.index ?? 0;
      const context = content.substring(Math.max(0, matchIndex - 500), matchIndex + 500);
      if (!context.includes('removeEventListener')) {
        const linesBefore = content.substring(0, matchIndex).split('\n');
        const lastLine = linesBefore[linesBefore.length - 1];
        this.addIssue({
          ruleId: 'require-useeffect-cleanup',
          severity: rule.severity,
          category: 'performance',
          filePath,
          lineNumber: linesBefore.length,
          columnNumber: 0,
          description: 'addEventListener without removeEventListener - potential memory leak',
          codeSnippet: lastLine ? lastLine.trim().substring(0, 100) : 'addEventListener',
          suggestedFix: 'Remove event listener in cleanup function',
          autoFixable: false,
        });
      }
    }
  }

  private checkObjectLiteralsInJSX(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['no-object-literal-in-jsx'];
    if (!rule?.enabled) return;

    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Detect inline objects/arrays in JSX props
      if (/\w+\s*=\s*\{\s*\[/.test(line) || /\w+\s*=\s*\{\s*\{/.test(line)) {
        // Skip if it's a simple literal or clearly not a prop
        if (line.includes('style=') || line.includes('className=')) return;
        
        this.addIssue({
          ruleId: 'no-object-literal-in-jsx',
          severity: rule.severity,
          category: 'performance',
          filePath,
          lineNumber: index + 1,
          columnNumber: line.indexOf('{'),
          description: 'Object/array literal in JSX causes unnecessary re-renders',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Move object/array to useMemo or define outside component',
          autoFixable: false,
        });
      }
    });
  }

  private checkLibraryImports(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['no-entire-library-import'];
    if (!rule?.enabled) return;

    const libraries = (rule['libraries'] as string[]) || [];
    
    sourceFile.getImportDeclarations().forEach((importDecl) => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      libraries.forEach((lib) => {
        if (moduleSpecifier === lib) {
          this.addIssue({
            ruleId: 'no-entire-library-import',
            severity: rule.severity,
            category: 'performance',
            filePath,
            lineNumber: importDecl.getStartLineNumber(),
            columnNumber: importDecl.getStartLinePos(),
            description: `Importing entire '${lib}' library increases bundle size`,
            codeSnippet: importDecl.getText().substring(0, 100),
            suggestedFix: `Import specific modules: import { specific } from '${lib}'`,
            autoFixable: false,
          });
        }
      });
    });
  }

  private checkReactKeys(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['require-react-keys'];
    if (!rule?.enabled) return;

    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Simple heuristic: map followed by JSX without key
      if (/\.map\s*\([^)]*\)\s*=>/.test(line) && !line.includes('key=')) {
        this.addIssue({
          ruleId: 'require-react-keys',
          severity: rule.severity,
          category: 'performance',
          filePath,
          lineNumber: index + 1,
          columnNumber: line.indexOf('map'),
          description: 'List items may be missing React keys',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Add key prop with unique identifier to list items',
          autoFixable: false,
        });
      }
    });
  }

  // Best Practices Checks
  private checkConsoleLogs(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['no-console'];
    if (!rule?.enabled) return;

    const allowedPatterns = (rule['allowedIn'] as string[]) || [];
    
    // Check if file matches allowed patterns
    for (const pattern of allowedPatterns) {
      if (new RegExp(pattern.replace('**', '.*').replace('*', '[^/]*')).test(filePath)) {
        return;
      }
    }

    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (/console\.(log|debug|info)\s*\(/.test(line) && !line.includes('//')) {
        this.addIssue({
          ruleId: 'no-console',
          severity: rule.severity,
          category: 'best-practices',
          filePath,
          lineNumber: index + 1,
          columnNumber: line.indexOf('console'),
          description: 'console.log should be replaced with proper logger',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Use a structured logging library like winston or pino',
          autoFixable: true,
        });
      }
    });
  }

  private checkUnusedVariables(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['no-unused-variables'];
    if (!rule?.enabled) return;

    sourceFile.getVariableDeclarations().forEach((variable) => {
      const name = variable.getName();
      
      // Skip underscore prefixed variables (intentionally unused)
      if (name.startsWith('_')) return;
      
      // Check if variable is referenced elsewhere in the file
      const refs = variable.findReferences();
      if (refs.length <= 1) {
        this.addIssue({
          ruleId: 'no-unused-variables',
          severity: rule.severity,
          category: 'best-practices',
          filePath,
          lineNumber: variable.getStartLineNumber(),
          columnNumber: variable.getStartLinePos(),
          description: `Unused variable: '${name}'`,
          codeSnippet: variable.getText().substring(0, 100),
          suggestedFix: 'Remove unused variable or prefix with underscore',
          autoFixable: true,
        });
      }
    });
  }

  private checkMagicNumbers(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['no-magic-numbers'];
    if (!rule?.enabled) return;

    const allowed = (rule['allowed'] as number[]) || [0, 1, -1];
    
    sourceFile.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.NumericLiteral) {
        const value = parseFloat(node.getText());
        
        if (!allowed.includes(value) && value > 10) {
          const parent = node.getParent();
          
          // Skip if part of a variable declaration or property assignment
          if (Node.isVariableDeclaration(parent) || Node.isPropertyAssignment(parent)) return;
          
          this.addIssue({
            ruleId: 'no-magic-numbers',
            severity: rule.severity,
            category: 'best-practices',
            filePath,
            lineNumber: node.getStartLineNumber(),
            columnNumber: node.getStartLinePos(),
            description: `Magic number ${value} should be a named constant`,
            codeSnippet: node.getText(),
            suggestedFix: `Define constant: const MAX_VALUE = ${value}`,
            autoFixable: false,
          });
        }
      }
    });
  }

  private checkTodoComments(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['no-todo-fixme'];
    if (!rule?.enabled) return;

    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const todoMatch = line.match(/\/\/\s*(TODO|FIXME|HACK|XXX|BUG)[\s:]*/i);
      if (todoMatch) {
        this.addIssue({
          ruleId: 'no-todo-fixme',
          severity: rule.severity,
          category: 'best-practices',
          filePath,
          lineNumber: index + 1,
          columnNumber: line.indexOf('//'),
          description: `${todoMatch[1].toUpperCase()} comment should be addressed`,
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Resolve the TODO or create a ticket to track it',
          autoFixable: false,
        });
      }
    });
  }

  // Accessibility Checks
  private checkImageAlt(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['require-img-alt'];
    if (!rule?.enabled) return;

    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for img tags without alt
      if (/<img\s/.test(line) && !/alt\s*=/.test(line)) {
        this.addIssue({
          ruleId: 'require-img-alt',
          severity: rule.severity,
          category: 'accessibility',
          filePath,
          lineNumber: index + 1,
          columnNumber: line.indexOf('<img'),
          description: 'Image element missing alt attribute',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Add alt attribute describing the image',
          autoFixable: false,
        });
      }
      
      // Check for Next.js Image without alt
      if (/<Image\s/.test(line) && !/alt\s*=/.test(line)) {
        this.addIssue({
          ruleId: 'require-img-alt',
          severity: rule.severity,
          category: 'accessibility',
          filePath,
          lineNumber: index + 1,
          columnNumber: line.indexOf('<Image'),
          description: 'Next.js Image component missing alt attribute',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Add alt attribute describing the image',
          autoFixable: false,
        });
      }
    });
  }

  private checkAriaLabels(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['require-aria-label'];
    if (!rule?.enabled) return;

    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for button without aria-label or text content
      if (/<button\s/.test(line) && !/aria-label/.test(line) && !/alt\s*=/.test(line)) {
        this.addIssue({
          ruleId: 'require-aria-label',
          severity: rule.severity,
          category: 'accessibility',
          filePath,
          lineNumber: index + 1,
          columnNumber: line.indexOf('<button'),
          description: 'Button without accessible label',
          codeSnippet: line.trim().substring(0, 100),
          suggestedFix: 'Add aria-label or ensure visible text content',
          autoFixable: false,
        });
      }
    });
  }

  private checkInputLabels(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['require-input-label'];
    if (!rule?.enabled) return;

    const content = sourceFile.getFullText();
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for input without label or aria-label
      if (/<input\s/.test(line) && !/aria-label/.test(line) && !/aria-labelledby/.test(line)) {
        // Check if wrapped in label (simple heuristic)
        const context = lines.slice(Math.max(0, index - 3), index + 1).join(' ');
        if (!context.includes('<label')) {
          this.addIssue({
            ruleId: 'require-input-label',
            severity: rule.severity,
            category: 'accessibility',
            filePath,
            lineNumber: index + 1,
            columnNumber: line.indexOf('<input'),
            description: 'Form input without associated label',
            codeSnippet: line.trim().substring(0, 100),
            suggestedFix: 'Wrap in label element or add aria-label/aria-labelledby',
            autoFixable: false,
          });
        }
      }
    });
  }

  // Enterprise Standards Checks
  private checkJSDocComments(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['require-jsdoc'];
    if (!rule?.enabled) return;

    const functions = [
      ...sourceFile.getFunctions().filter(f => f.isExported()),
      ...sourceFile.getClasses().filter(c => c.isExported()),
      ...sourceFile.getInterfaces().filter(i => i.isExported()),
    ];

    functions.forEach((node) => {
      // Check if it has JSDoc
      const jsDocs = node.getJsDocs();
      if (!jsDocs || jsDocs.length === 0) {
        let name = 'anonymous';
        
        if (Node.isFunctionDeclaration(node)) {
          name = node.getName() || 'anonymous';
        } else if (Node.isClassDeclaration(node)) {
          name = node.getName() || 'anonymous';
        } else if (Node.isInterfaceDeclaration(node)) {
          name = node.getName() || 'anonymous';
        }

        this.addIssue({
          ruleId: 'require-jsdoc',
          severity: rule.severity,
          category: 'enterprise',
          filePath,
          lineNumber: node.getStartLineNumber(),
          columnNumber: node.getStartLinePos(),
          description: `Exported ${node.getKindName().toLowerCase().replace('declaration', '')} '${name}' missing JSDoc`,
          codeSnippet: node.getText().substring(0, 100),
          suggestedFix: 'Add JSDoc comment describing the purpose and parameters',
          autoFixable: false,
        });
      }
    });
  }

  private checkFunctionLength(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['max-function-length'];
    if (!rule?.enabled) return;

    const maxLines = (rule['maxLines'] as number) || 50;
    
    const functions = [
      ...sourceFile.getFunctions(),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),
    ];

    functions.forEach((func) => {
      const startLine = func.getStartLineNumber();
      const endLine = func.getEndLineNumber();
      const length = endLine - startLine + 1;

      if (length > maxLines) {
        let name = 'anonymous';
        
        if (Node.isFunctionDeclaration(func)) {
          name = func.getName() || 'anonymous';
        } else if (Node.isMethodDeclaration(func)) {
          name = func.getName();
        }

        this.addIssue({
          ruleId: 'max-function-length',
          severity: rule.severity,
          category: 'enterprise',
          filePath,
          lineNumber: startLine,
          columnNumber: func.getStartLinePos(),
          description: `Function '${name}' is ${length} lines (max: ${maxLines})`,
          codeSnippet: func.getText().substring(0, 100),
          suggestedFix: 'Refactor into smaller functions with single responsibility',
          autoFixable: false,
        });
      }
    });
  }

  private checkFileLength(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['max-file-length'];
    if (!rule?.enabled) return;

    const maxLines = (rule['maxLines'] as number) || 500;
    const lineCount = sourceFile.getFullText().split('\n').length;

    if (lineCount > maxLines) {
      this.addIssue({
        ruleId: 'max-file-length',
        severity: rule.severity,
        category: 'enterprise',
        filePath,
        lineNumber: 1,
        columnNumber: 0,
        description: `File has ${lineCount} lines (max: ${maxLines})`,
        codeSnippet: `Total lines: ${lineCount}`,
        suggestedFix: 'Split into multiple files or modules',
        autoFixable: false,
      });
    }
  }

  private checkCyclomaticComplexity(sourceFile: SourceFile, filePath: string): void {
    const rule = this.config.rules['max-cyclomatic-complexity'];
    if (!rule?.enabled) return;

    const maxComplexity = (rule['maxComplexity'] as number) || 10;
    
    const functions = [
      ...sourceFile.getFunctions(),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),
    ];

    functions.forEach((func) => {
      const body = func.getBody();
      if (!body) return;

      const text = body.getText();
      
      // Count complexity indicators
      let complexity = 1; // Base complexity
      complexity += (text.match(/\bif\b/g) || []).length;
      complexity += (text.match(/\belse\s+if\b/g) || []).length;
      complexity += (text.match(/\bcase\b/g) || []).length;
      complexity += (text.match(/\bfor\b/g) || []).length;
      complexity += (text.match(/\bwhile\b/g) || []).length;
      complexity += (text.match(/\bcatch\b/g) || []).length;
      complexity += (text.match(/\?\s*[^:?]*\s*:/g) || []).length; // Ternary operators
      complexity += (text.match(/\|\||&&/g) || []).length; // Logical operators

      if (complexity > maxComplexity) {
        let name = 'anonymous';
        
        if (Node.isFunctionDeclaration(func)) {
          name = func.getName() || 'anonymous';
        } else if (Node.isMethodDeclaration(func)) {
          name = func.getName();
        }

        this.addIssue({
          ruleId: 'max-cyclomatic-complexity',
          severity: rule.severity,
          category: 'enterprise',
          filePath,
          lineNumber: func.getStartLineNumber(),
          columnNumber: func.getStartLinePos(),
          description: `Function '${name}' has cyclomatic complexity of ${complexity} (max: ${maxComplexity})`,
          codeSnippet: func.getText().substring(0, 100),
          suggestedFix: 'Refactor to reduce branching (extract functions, use early returns)',
          autoFixable: false,
        });
      }
    });
  }

  private addIssue(partial: Omit<CodeIssue, 'id' | 'status' | 'createdAt'>): void {
    this.issues.push({
      ...partial,
      id: generateIssueId(),
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  }
}

// =============================================================================
// METRICS CALCULATOR
// =============================================================================

function calculateMetrics(sourceFile: SourceFile): FileMetrics {
  const content = sourceFile.getFullText();
  const lines = content.split('\n');
  
  const totalLines = lines.length;
  const codeLines = lines.filter(l => l.trim() && !l.match(/^\s*(\/\/|\/\*|\*)/)).length;
  const commentLines = lines.filter(l => l.match(/^\s*(\/\/|\/\*|\*)/)).length;
  const blankLines = lines.filter(l => !l.trim()).length;
  
  const functions = [
    ...sourceFile.getFunctions(),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),
  ];
  
  const functionCount = functions.length;
  const classCount = sourceFile.getClasses().length;
  const interfaceCount = sourceFile.getInterfaces().length;
  
  let maxFunctionLength = 0;
  functions.forEach(func => {
    const length = func.getEndLineNumber() - func.getStartLineNumber() + 1;
    if (length > maxFunctionLength) {
      maxFunctionLength = length;
    }
  });
  
  return {
    totalLines,
    codeLines,
    commentLines,
    blankLines,
    functionCount,
    classCount,
    interfaceCount,
    maxFunctionLength,
    averageComplexity: 0, // Calculated elsewhere
  };
}

// =============================================================================
// SCORING SYSTEM
// =============================================================================

function calculateCategoryScore(
  category: Category, 
  issues: CodeIssue[], 
  config: ScannerConfig
): CategoryScore {
  const categoryIssues = issues.filter(i => i.category === category);
  const maxScore = 10;
  
  let score = maxScore;
  
  categoryIssues.forEach(issue => {
    const penalty = config.scoring.severityPenalties[issue.severity] || 0;
    score -= penalty;
  });
  
  score = Math.max(0, score);
  
  return {
    category,
    score: Math.round(score * 10) / 10,
    maxScore,
    issueCount: categoryIssues.length,
    criticalCount: categoryIssues.filter(i => i.severity === 'critical').length,
    highCount: categoryIssues.filter(i => i.severity === 'high').length,
    mediumCount: categoryIssues.filter(i => i.severity === 'medium').length,
    lowCount: categoryIssues.filter(i => i.severity === 'low').length,
  };
}

function calculateOverallScore(categoryScores: CategoryScore[], config: ScannerConfig): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  categoryScores.forEach(score => {
    const weight = config.scoring.weights[score.category] || 0.1;
    weightedSum += score.score * weight;
    totalWeight += weight;
  });
  
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

function checkQualityGate(summary: ScanSummary, config: ScannerConfig): boolean {
  const gates = config.qualityGates;
  
  if (gates.noCriticalIssues && summary.criticalIssues > 0) return false;
  if (gates.noHighSeveritySecurityIssues && summary.highIssues > 0) return false;
  if (summary.overallScore < gates.minOverallScore) return false;
  
  const typeSafety = summary.categoryScores.find(c => c.category === 'type-safety');
  if (typeSafety && typeSafety.score < gates.minTypeSafetyScore) return false;
  
  const security = summary.categoryScores.find(c => c.category === 'security');
  if (security && security.score < gates.minSecurityScore) return false;
  
  const performance = summary.categoryScores.find(c => c.category === 'performance');
  if (performance && performance.score < gates.minPerformanceScore) return false;
  
  const accessibility = summary.categoryScores.find(c => c.category === 'accessibility');
  if (accessibility && accessibility.score < gates.minAccessibilityScore) return false;
  
  return true;
}

// =============================================================================
// REPORT GENERATORS
// =============================================================================

function generateJSONReport(results: ScanResult[], summary: ScanSummary, outputDir: string): string {
  const report = {
    summary,
    results: results.map(r => ({
      filePath: r.relativePath,
      metrics: r.metrics,
      issues: r.issues,
    })),
  };
  
  const filePath = path.join(outputDir, 'issues-log.json');
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  return filePath;
}

function generateMarkdownReport(results: ScanResult[], summary: ScanSummary, outputDir: string): string {
  let md = `# Enterprise Code Quality Report

**Scan ID:** ${summary.scanId}  
**Timestamp:** ${summary.timestamp}  
**Duration:** ${summary.duration}ms  

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | ${summary.overallScore.toFixed(1)}/10 |
| **Quality Gate** | ${summary.passedQualityGate ? '✅ PASSED' : '❌ FAILED'} |
| **Total Files** | ${summary.totalFiles} |
| **Total Issues** | ${summary.totalIssues} |
| **Critical** | ${summary.criticalIssues} |
| **High** | ${summary.highIssues} |
| **Medium** | ${summary.mediumIssues} |
| **Low** | ${summary.lowIssues} |
| **Auto-Fixable** | ${summary.autoFixableCount} |

## Category Scores

| Category | Score | Issues | Critical | High | Medium | Low |
|----------|-------|--------|----------|------|--------|-----|
`;

  summary.categoryScores.forEach(score => {
    const emoji = score.score >= 9 ? '🟢' : score.score >= 7 ? '🟡' : '🔴';
    md += `| ${emoji} ${score.category} | ${score.score.toFixed(1)}/10 | ${score.issueCount} | ${score.criticalCount} | ${score.highCount} | ${score.mediumCount} | ${score.lowCount} |\n`;
  });

  md += `
## Quality Gate Requirements

- ✅ No critical issues: ${summary.criticalIssues === 0 ? 'PASS' : 'FAIL (' + summary.criticalIssues + ')'}
- ✅ No high severity security issues: ${summary.highIssues === 0 ? 'PASS' : 'FAIL (' + summary.highIssues + ')'}
- ✅ Minimum overall score (9.0): ${summary.overallScore >= 9.0 ? 'PASS' : 'FAIL (' + summary.overallScore.toFixed(1) + ')'}
- ✅ Minimum type safety score (9.5): ${(summary.categoryScores.find(c => c.category === 'type-safety')?.score || 0) >= 9.5 ? 'PASS' : 'FAIL'}

## Files with Issues

`;

  const filesWithIssues = results.filter(r => r.issues.length > 0);
  
  if (filesWithIssues.length === 0) {
    md += '🎉 No issues found!\n';
  } else {
    filesWithIssues.forEach(r => {
      md += `### ${r.relativePath}\n\n`;
      md += `**Metrics:** Lines: ${r.metrics.totalLines}, Functions: ${r.metrics.functionCount}, Classes: ${r.metrics.classCount}\n\n`;
      
      if (r.issues.length > 0) {
        md += '| Line | Severity | Category | Rule | Description |\n';
        md += '|------|----------|----------|------|-------------|\n';
        
        r.issues.forEach(issue => {
          const severityEmoji = issue.severity === 'critical' ? '🔴' : 
                                issue.severity === 'high' ? '🟠' : 
                                issue.severity === 'medium' ? '🟡' : '🔵';
          md += `| ${issue.lineNumber} | ${severityEmoji} ${issue.severity} | ${issue.category} | ${issue.ruleId} | ${issue.description} |\n`;
        });
      }
      
      md += '\n';
    });
  }

  md += `
## Detailed Issues

<details>
<summary>Click to expand all issues</summary>

`;

  filesWithIssues.forEach(r => {
    r.issues.forEach(issue => {
      md += `### ${issue.id}

- **File:** \`${r.relativePath}:${issue.lineNumber}:${issue.columnNumber}\`
- **Severity:** ${issue.severity.toUpperCase()}
- **Category:** ${issue.category}
- **Rule:** ${issue.ruleId}
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
  });

  md += `</details>

---
*Generated by Enterprise Code Scanner v2.0*
`;

  const filePath = path.join(outputDir, 'issues-log.md');
  fs.writeFileSync(filePath, md);
  return filePath;
}

function generateHTMLReport(results: ScanResult[], summary: ScanSummary, outputDir: string): string {
  const categoryScores = summary.categoryScores;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enterprise Code Quality Report</title>
  <style>
    :root {
      --primary: #2563eb;
      --success: #22c55e;
      --warning: #f59e0b;
      --danger: #ef4444;
      --info: #3b82f6;
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
    header {
      background: linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%);
      color: white;
      padding: 2rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 40px rgba(37, 99, 235, 0.2);
    }
    header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .meta { opacity: 0.9; font-size: 0.9rem; }
    .score-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .score-card {
      background: var(--card);
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .score-card:hover { transform: translateY(-2px); }
    .score-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .score-title { font-weight: 600; color: var(--text-muted); font-size: 0.875rem; }
    .score-value {
      font-size: 2.5rem;
      font-weight: 700;
    }
    .score-excellent { color: var(--success); }
    .score-good { color: var(--warning); }
    .score-poor { color: var(--danger); }
    .quality-gate {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      font-weight: 600;
      font-size: 0.875rem;
    }
    .gate-pass { background: #dcfce7; color: #166534; }
    .gate-fail { background: #fee2e2; color: #991b1b; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--card);
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .stat-label { color: var(--text-muted); font-size: 0.875rem; }
    .stat-critical { color: var(--danger); }
    .stat-high { color: #ea580c; }
    .stat-medium { color: var(--warning); }
    .stat-low { color: var(--info); }
    .section {
      background: var(--card);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .section h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #dbeafe; color: #1e40af; }
    .badge-type-safety { background: #e0e7ff; color: #3730a3; }
    .badge-security { background: #fce7f3; color: #9d174d; }
    .badge-performance { background: #d1fae5; color: #065f46; }
    .badge-accessibility { background: #cffafe; color: #155e75; }
    .badge-best-practices { background: #f3e8ff; color: #6b21a8; }
    .badge-enterprise { background: #f1f5f9; color: #475569; }
    .progress-bar {
      height: 0.5rem;
      background: #e2e8f0;
      border-radius: 0.25rem;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 0.25rem;
      transition: width 0.3s ease;
    }
    .file-item {
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      overflow: hidden;
    }
    .file-header {
      background: #f8fafc;
      padding: 1rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .file-header:hover { background: #f1f5f9; }
    .file-name { font-weight: 600; font-family: monospace; }
    .file-meta { color: var(--text-muted); font-size: 0.875rem; }
    .file-issues { padding: 1rem; }
    .issue {
      border-left: 3px solid;
      padding: 0.75rem 1rem;
      margin-bottom: 0.5rem;
      background: #f8fafc;
      border-radius: 0 0.25rem 0.25rem 0;
    }
    .issue-critical { border-color: var(--danger); }
    .issue-high { border-color: #ea580c; }
    .issue-medium { border-color: var(--warning); }
    .issue-low { border-color: var(--info); }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    .issue-location { font-family: monospace; font-size: 0.8rem; color: var(--text-muted); }
    .code-snippet {
      background: #1e293b;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: 0.5rem;
      font-family: monospace;
      font-size: 0.8rem;
      overflow-x: auto;
      margin: 0.5rem 0;
    }
    .suggestion {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 0.75rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      color: #166534;
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .score-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🏢 Enterprise Code Quality Report</h1>
      <p class="meta">
        Scan ID: ${summary.scanId} | 
        ${new Date(summary.timestamp).toLocaleString()} | 
        Duration: ${summary.duration}ms
      </p>
    </header>

    <div class="score-grid">
      <div class="score-card">
        <div class="score-header">
          <span class="score-title">Overall Score</span>
          <span class="quality-gate ${summary.passedQualityGate ? 'gate-pass' : 'gate-fail'}">
            ${summary.passedQualityGate ? '✓ PASS' : '✗ FAIL'}
          </span>
        </div>
        <div class="score-value ${summary.overallScore >= 9 ? 'score-excellent' : summary.overallScore >= 7 ? 'score-good' : 'score-poor'}">
          ${summary.overallScore.toFixed(1)}/10
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${summary.overallScore >= 9 ? 'score-excellent' : summary.overallScore >= 7 ? 'score-good' : 'score-poor'}" 
               style="width: ${summary.overallScore * 10}%"></div>
        </div>
      </div>
      
      ${categoryScores.map(score => `
      <div class="score-card">
        <div class="score-header">
          <span class="score-title">${score.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        </div>
        <div class="score-value ${score.score >= 9 ? 'score-excellent' : score.score >= 7 ? 'score-good' : 'score-poor'}">
          ${score.score.toFixed(1)}/10
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${score.score >= 9 ? 'score-excellent' : score.score >= 7 ? 'score-good' : 'score-poor'}" 
               style="width: ${score.score * 10}%"></div>
        </div>
      </div>
      `).join('')}
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value stat-critical">${summary.criticalIssues}</div>
        <div class="stat-label">Critical Issues</div>
      </div>
      <div class="stat-card">
        <div class="stat-value stat-high">${summary.highIssues}</div>
        <div class="stat-label">High Issues</div>
      </div>
      <div class="stat-card">
        <div class="stat-value stat-medium">${summary.mediumIssues}</div>
        <div class="stat-label">Medium Issues</div>
      </div>
      <div class="stat-card">
        <div class="stat-value stat-low">${summary.lowIssues}</div>
        <div class="stat-label">Low Issues</div>
      </div>
    </div>

    <div class="section">
      <h2>📊 Category Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Score</th>
            <th>Issues</th>
            <th>Critical</th>
            <th>High</th>
            <th>Medium</th>
            <th>Low</th>
          </tr>
        </thead>
        <tbody>
          ${categoryScores.map(score => `
          <tr>
            <td>
              <span class="badge badge-${score.category}">${score.category.replace(/-/g, ' ')}</span>
            </td>
            <td>
              <strong class="${score.score >= 9 ? 'score-excellent' : score.score >= 7 ? 'score-good' : 'score-poor'}">
                ${score.score.toFixed(1)}
              </strong>
            </td>
            <td>${score.issueCount}</td>
            <td>${score.criticalCount}</td>
            <td>${score.highCount}</td>
            <td>${score.mediumCount}</td>
            <td>${score.lowCount}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>📁 Files with Issues (${results.filter(r => r.issues.length > 0).length})</h2>
      ${results.filter(r => r.issues.length > 0).map(r => `
      <div class="file-item">
        <div class="file-header">
          <div>
            <div class="file-name">${r.relativePath}</div>
            <div class="file-meta">${r.metrics.totalLines} lines | ${r.metrics.functionCount} functions | ${r.issues.length} issues</div>
          </div>
          <span class="badge badge-${r.issues.some(i => i.severity === 'critical') ? 'critical' : r.issues.some(i => i.severity === 'high') ? 'high' : 'medium'}">
            ${r.issues.length} issues
          </span>
        </div>
        <div class="file-issues">
          ${r.issues.map(issue => `
          <div class="issue issue-${issue.severity}">
            <div class="issue-header">
              <span class="badge badge-${issue.severity}">${issue.severity}</span>
              <span class="badge badge-${issue.category}">${issue.category.replace(/-/g, ' ')}</span>
              <span class="badge">${issue.ruleId}</span>
            </div>
            <div class="issue-location">${r.relativePath}:${issue.lineNumber}:${issue.columnNumber}</div>
            <p>${issue.description}</p>
            ${issue.codeSnippet ? `<div class="code-snippet">${issue.codeSnippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : ''}
            ${issue.suggestedFix ? `<div class="suggestion">💡 ${issue.suggestedFix}</div>` : ''}
          </div>
          `).join('')}
        </div>
      </div>
      `).join('')}
    </div>

    <footer style="text-align: center; color: var(--text-muted); padding: 2rem;">
      Generated by Enterprise Code Scanner v2.0
    </footer>
  </div>
</body>
</html>`;

  const filePath = path.join(outputDir, 'issues-summary.html');
  fs.writeFileSync(filePath, html);
  return filePath;
}

// =============================================================================
// HISTORY MANAGEMENT
// =============================================================================

function loadHistory(historyFile: string): ScanHistory {
  if (!fs.existsSync(historyFile)) {
    return { scans: [] };
  }
  return JSON.parse(fs.readFileSync(historyFile, 'utf-8')) as ScanHistory;
}

function saveHistory(history: ScanHistory, historyFile: string): void {
  // Keep only last 50 scans
  history.scans = history.scans.slice(-50);
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

function compareWithPrevious(current: ScanSummary, history: ScanHistory): void {
  if (history.scans.length === 0) return;
  
  const previous = history.scans[history.scans.length - 1];
  
  log('\n📈 Comparison with Previous Scan:', 'info');
  log(`   Previous Score: ${previous.overallScore.toFixed(1)} → Current: ${current.overallScore.toFixed(1)}`, 
    current.overallScore > previous.overallScore ? 'success' : 
    current.overallScore < previous.overallScore ? 'warn' : 'info');
  
  const issueDiff = current.totalIssues - previous.totalIssues;
  if (issueDiff !== 0) {
    log(`   Issues: ${previous.totalIssues} → ${current.totalIssues} (${issueDiff > 0 ? '+' : ''}${issueDiff})`,
      issueDiff < 0 ? 'success' : 'warn');
  }
  
  current.categoryScores.forEach(score => {
    const prevScore = previous.categoryScores.find(s => s.category === score.category);
    if (prevScore && Math.abs(score.score - prevScore.score) > 0.1) {
      const diff = score.score - prevScore.score;
      log(`   ${score.category}: ${prevScore.score.toFixed(1)} → ${score.score.toFixed(1)} (${diff > 0 ? '+' : ''}${diff.toFixed(1)})`,
        diff > 0 ? 'success' : 'warn');
    }
  });
}

function showTrend(history: ScanHistory): void {
  if (history.scans.length < 2) return;
  
  log('\n📊 Trend (Last 5 Scans):', 'info');
  const recent = history.scans.slice(-5);
  
  recent.forEach((scan, index) => {
    const bar = '█'.repeat(Math.round(scan.overallScore));
    const color = scan.overallScore >= 9 ? 'success' : scan.overallScore >= 7 ? 'warn' : 'error';
    log(`   ${index + 1}. ${new Date(scan.timestamp).toLocaleDateString()} | Score: ${scan.overallScore.toFixed(1)}/10 ${bar}`, color as any);
  });
}

// =============================================================================
// AUTO-FIX
// =============================================================================

function applyAutoFixes(results: ScanResult[], config: ScannerConfig): number {
  if (!config.autoFix.enabled) return 0;
  
  let fixedCount = 0;
  
  results.forEach(result => {
    let content = fs.readFileSync(result.filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;
    
    result.issues
      .filter(issue => issue.autoFixable && config.autoFix.rules.includes(issue.ruleId))
      .forEach(issue => {
        const lineIndex = issue.lineNumber - 1;
        if (lineIndex < 0 || lineIndex >= lines.length) return;
        
        const originalLine = lines[lineIndex];
        let fixedLine = originalLine;
        
        switch (issue.ruleId) {
          case 'no-any':
            fixedLine = originalLine.replace(/:\s*any\b/g, ': unknown');
            break;
          case 'no-console':
            fixedLine = originalLine.replace(/console\.(log|debug|info)\s*\(/g, '// console.$1(');
            break;
          case 'no-unused-variables': {
            // Add underscore prefix to unused variable
            const match = originalLine.match(/(?:const|let|var)\s+(\w+)/);
            if (match && match[1]) {
              fixedLine = originalLine.replace(match[1], `_${match[1]}`);
            }
            break;
          }
        }
        
        if (fixedLine !== originalLine) {
          lines[lineIndex] = fixedLine;
          modified = true;
          fixedCount++;
          issue.status = 'fixed';
          log(`  Fixed: ${result.relativePath}:${issue.lineNumber} - ${issue.ruleId}`, 'success');
        }
      });
    
    if (modified) {
      fs.writeFileSync(result.filePath, lines.join('\n'), 'utf-8');
    }
  });
  
  return fixedCount;
}

// =============================================================================
// CLI ARGUMENTS
// =============================================================================

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--path':
      case '-p':
        options.path = args[++i];
        break;
      case '--fix':
      case '-f':
        options.fix = true;
        break;
      case '--report-only':
      case '-r':
        options.reportOnly = true;
        break;
      case '--threshold':
      case '-t':
        options.threshold = parseFloat(args[++i]);
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--compare':
      case '-c':
        options.compare = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

function showHelp(): void {
  console.log(`
${COLORS.bright}Enterprise Code Quality Scanner v2.0${COLORS.reset}

${COLORS.cyan}Usage:${COLORS.reset}
  npx ts-node scripts/enterprise-code-scanner.ts [options]

${COLORS.cyan}Options:${COLORS.reset}
  -p, --path <path>        Scan specific directory (default: entire codebase)
  -f, --fix                Auto-fix issues where possible
  -r, --report-only        Generate reports without console output
  -t, --threshold <score>  Set quality threshold (exit code 1 if below)
  -c, --compare            Compare with previous scan
  -v, --verbose            Verbose output
  -h, --help               Show this help message

${COLORS.cyan}Examples:${COLORS.reset}
  npx ts-node scripts/enterprise-code-scanner.ts
  npx ts-node scripts/enterprise-code-scanner.ts --path apps/backend/src
  npx ts-node scripts/enterprise-code-scanner.ts --fix
  npx ts-node scripts/enterprise-code-scanner.ts --threshold 9.0
`);
}

// =============================================================================
// MAIN SCANNER
// =============================================================================

async function runScanner(): Promise<void> {
  const startTime = Date.now();
  const options = parseArgs();
  
  log('🏢 Enterprise Code Quality Scanner v2.0', 'info');
  log('════════════════════════════════════════', 'info');
  
  // Load configuration
  const configPath = path.join(__dirname, 'scanner-config.json');
  let config: ScannerConfig;
  try {
    config = loadConfig(configPath);
    log(`Configuration loaded from ${configPath}`, 'debug');
  } catch (err) {
    log(`Failed to load config: ${err}`, 'error');
    process.exit(1);
  }
  
  // Initialize ts-morph project
  const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
  
  // Find target files
  const targetPath = options.path || '.';
  
  log(`Scanning: ${targetPath}`, 'info');
  
  const targetFiles: string[] = [];
  const baseDirs = ['apps', 'libs'];
  
  for (const baseDir of baseDirs) {
    const fullPath = path.resolve(targetPath, baseDir);
    if (fs.existsSync(fullPath)) {
      const findFiles = (dir: string): void => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            // Skip excluded directories
            if (item === 'node_modules' || item === '.next' || item === 'dist' || item === 'build') {
              continue;
            }
            findFiles(itemPath);
          } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            // Skip test files
            if (!item.endsWith('.spec.ts') && !item.endsWith('.test.ts') && 
                !item.endsWith('.spec.tsx') && !item.endsWith('.test.tsx') &&
                !item.endsWith('.d.ts')) {
              targetFiles.push(itemPath);
            }
          }
        }
      };
      findFiles(fullPath);
    }
  }
  
  // If specific path provided
  if (options.path && !baseDirs.some(d => targetPath.includes(d))) {
    const resolvedPath = path.resolve(targetPath);
    if (fs.existsSync(resolvedPath)) {
      const stat = fs.statSync(resolvedPath);
      if (stat.isFile() && (resolvedPath.endsWith('.ts') || resolvedPath.endsWith('.tsx'))) {
        targetFiles.push(resolvedPath);
      } else if (stat.isDirectory()) {
        const findFiles = (dir: string): void => {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.next')) {
              findFiles(itemPath);
            } else if ((item.endsWith('.ts') || item.endsWith('.tsx')) && 
                       !item.includes('.spec.') && !item.includes('.test.') && !item.includes('.d.ts')) {
              targetFiles.push(itemPath);
            }
          }
        };
        findFiles(resolvedPath);
      }
    }
  }
  
  const uniqueFiles = [...new Set(targetFiles)];
  log(`Found ${uniqueFiles.length} files to scan`, 'info');
  
  if (uniqueFiles.length === 0) {
    log('No files found to scan', 'warn');
    process.exit(0);
  }
  
  // Add files to project
  for (const file of uniqueFiles) {
    try {
      project.addSourceFileAtPath(file);
    } catch {
      // Skip files that can't be parsed
    }
  }
  
  // Scan files
  const detector = new IssueDetector(config);
  const results: ScanResult[] = [];
  let scannedCount = 0;
  
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();
    
    if (options.verbose) {
      log(`Scanning: ${path.relative(process.cwd(), filePath)}`, 'debug');
    }
    
    const metrics = calculateMetrics(sourceFile);
    const issues = detector.detectIssues(sourceFile, filePath);
    
    results.push({
      filePath,
      relativePath: path.relative(process.cwd(), filePath),
      metrics,
      issues,
    });
    
    scannedCount++;
    if (scannedCount % 50 === 0) {
      log(`Scanned ${scannedCount}/${uniqueFiles.length} files...`, 'debug');
    }
  }
  
  log(`Scan complete: ${scannedCount} files analyzed`, 'success');
  
  // Calculate scores
  const allIssues = results.flatMap(r => r.issues);
  const categories: Category[] = ['type-safety', 'security', 'performance', 'accessibility', 'best-practices', 'enterprise'];
  
  const categoryScores = categories.map(cat => 
    calculateCategoryScore(cat, allIssues, config)
  );
  
  const overallScore = calculateOverallScore(categoryScores, config);
  
  const summary: ScanSummary = {
    scanId: generateScanId(),
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    totalFiles: scannedCount,
    totalIssues: allIssues.length,
    overallScore,
    categoryScores,
    passedQualityGate: false, // Will be set after calculation
    criticalIssues: allIssues.filter(i => i.severity === 'critical').length,
    highIssues: allIssues.filter(i => i.severity === 'high').length,
    mediumIssues: allIssues.filter(i => i.severity === 'medium').length,
    lowIssues: allIssues.filter(i => i.severity === 'low').length,
    autoFixableCount: allIssues.filter(i => i.autoFixable).length,
  };
  
  summary.passedQualityGate = checkQualityGate(summary, config);
  
  // Apply auto-fixes if requested
  let fixedCount = 0;
  if (options.fix) {
    log('\n🔧 Applying auto-fixes...', 'info');
    fixedCount = applyAutoFixes(results, config);
    log(`Fixed ${fixedCount} issues`, fixedCount > 0 ? 'success' : 'info');
  }
  
  // Generate reports
  const outputDir = path.resolve(config.reporting.outputDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const jsonPath = generateJSONReport(results, summary, outputDir);
  const mdPath = generateMarkdownReport(results, summary, outputDir);
  const htmlPath = generateHTMLReport(results, summary, outputDir);
  
  log(`\n📄 Reports generated:`, 'info');
  log(`   JSON: ${jsonPath}`, 'info');
  log(`   Markdown: ${mdPath}`, 'info');
  log(`   HTML: ${htmlPath}`, 'info');
  
  // Update history
  const historyPath = path.resolve(config.reporting.historyFile);
  const history = loadHistory(historyPath);
  
  if (options.compare) {
    compareWithPrevious(summary, history);
    showTrend(history);
  }
  
  history.scans.push(summary);
  saveHistory(history, historyPath);
  
  // Print summary
  if (!options.reportOnly) {
    console.log('\n' + '═'.repeat(60));
    log('SCAN SUMMARY', 'info');
    console.log('═'.repeat(60));
    
    const scoreColor = summary.overallScore >= 9 ? 'success' : 
                       summary.overallScore >= 7 ? 'warn' : 'error';
    log(`Overall Score: ${summary.overallScore.toFixed(1)}/10`, scoreColor as any);
    
    const gateStatus = summary.passedQualityGate ? '✅ PASSED' : '❌ FAILED';
    log(`Quality Gate: ${gateStatus}`, summary.passedQualityGate ? 'success' : 'error');
    
    console.log('\n📊 Category Scores:');
    categoryScores.forEach(score => {
      const emoji = score.score >= 9 ? '🟢' : score.score >= 7 ? '🟡' : '🔴';
      const color = score.score >= 9 ? 'success' : score.score >= 7 ? 'warn' : 'error';
      log(`   ${emoji} ${score.category.padEnd(20)} ${score.score.toFixed(1)}/10`, color as any);
    });
    
    console.log('\n🚨 Issue Breakdown:');
    log(`   🔴 Critical: ${summary.criticalIssues}`, summary.criticalIssues > 0 ? 'error' : 'info');
    log(`   🟠 High: ${summary.highIssues}`, summary.highIssues > 0 ? 'warn' : 'info');
    log(`   🟡 Medium: ${summary.mediumIssues}`, 'info');
    log(`   🔵 Low: ${summary.lowIssues}`, 'info');
    log(`   🔧 Auto-fixable: ${summary.autoFixableCount}`, 'info');
    
    // Show top issues
    if (allIssues.length > 0) {
      console.log('\n🔍 Top Issues:');
      allIssues
        .filter(i => i.severity === 'critical' || i.severity === 'high')
        .slice(0, 5)
        .forEach(issue => {
          const emoji = issue.severity === 'critical' ? '🔴' : '🟠';
          log(`   ${emoji} [${issue.ruleId}] ${issue.filePath}:${issue.lineNumber}`, 'error');
          log(`      ${issue.description}`, 'info');
        });
    }
  }
  
  // Check threshold
  if (options.threshold !== undefined) {
    if (summary.overallScore < options.threshold) {
      log(`\n❌ Quality threshold (${options.threshold}) not met. Score: ${summary.overallScore.toFixed(1)}`, 'error');
      process.exit(1);
    } else {
      log(`\n✅ Quality threshold (${options.threshold}) met. Score: ${summary.overallScore.toFixed(1)}`, 'success');
    }
  }
  
  // Exit based on quality gate
  if (!summary.passedQualityGate && !options.fix) {
    log('\n⚠️  Quality gate failed. Run with --fix to auto-fix issues.', 'warn');
    process.exit(1);
  }
  
  log('\n✅ Scan complete!', 'success');
  process.exit(0);
}

// Run scanner
runScanner().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  console.error(err);
  process.exit(1);
});

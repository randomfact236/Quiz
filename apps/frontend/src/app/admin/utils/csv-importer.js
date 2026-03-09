"use strict";
/**
 * ============================================================================
 * CSV Quiz Importer
 * ============================================================================
 * Single source of truth for CSV import logic.
 *
 * Supported CSV format:
 *   # Subject: <Subject Name>
 *   ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
 *
 * Level rules:
 *   easy    → True/False (Option A = FALSE, Option B = TRUE, or vice-versa)
 *   medium  → 2 options (A, B)
 *   hard    → 3 options (A, B, C)
 *   expert  → 4 options (A, B, C, D)
 *   extreme → Open answer — no options. "Correct Answer" column holds the answer text.
 * ============================================================================
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCSVContent = parseCSVContent;
exports.importQuestionsFromCSV = importQuestionsFromCSV;
var quiz_api_1 = require("@/lib/quiz-api");
// ─── Internal helpers ────────────────────────────────────────────────────────
var VALID_LEVELS = ['easy', 'medium', 'hard', 'expert', 'extreme'];
/**
 * Parse a single CSV line, respecting double-quoted fields that may contain commas.
 */
function parseCSVLine(line) {
    var result = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
        var char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        }
        else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}
/**
 * Extract subject name from lines like "# Subject: Animals,,,,"
 */
function extractSubjectName(lines) {
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var trimmed = line.trim();
        if (trimmed.startsWith('#')) {
            var match = trimmed.match(/#\s*Subject:\s*(.+)/i);
            if (match === null || match === void 0 ? void 0 : match[1]) {
                // Strip trailing commas (e.g. from Excel export padding)
                return match[1].replace(/,+$/, '').trim();
            }
        }
    }
    return '';
}
/**
 * Build URL-safe slug from a display name.
 */
function generateSlug(name) {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'subject';
}
/**
 * Returns true if the value is a recognized True/False token.
 */
function isTFToken(val) {
    var v = val.toUpperCase();
    return v === 'TRUE' || v === 'FALSE' || v === 'T' || v === 'F';
}
/**
 * Normalize a True/False token to the canonical "True" or "False" display text.
 */
function normalizeTFToken(val) {
    var v = val.toUpperCase();
    return v === 'TRUE' || v === 'T' ? 'True' : 'False';
}
function parseCSVContent(csvContent) {
    var _a;
    var errors = [];
    var warnings = [];
    var rows = [];
    var lines = csvContent.trim().split('\n');
    var subjectName = extractSubjectName(lines);
    if (!subjectName) {
        errors.push('No subject found. Make sure the CSV starts with: # Subject: <Name>');
        return { subjectName: '', rows: rows, errors: errors, warnings: warnings };
    }
    // Find the header row
    var headerIndex = -1;
    for (var i = 0; i < lines.length; i++) {
        var line = ((_a = lines[i]) !== null && _a !== void 0 ? _a : '').trim();
        if (line && !line.startsWith('#') && line.toLowerCase().includes('question') && line.toLowerCase().includes('option')) {
            headerIndex = i;
            break;
        }
    }
    if (headerIndex === -1) {
        errors.push('Header row not found. Expected a row containing "Question" and "Option".');
        return { subjectName: subjectName, rows: rows, errors: errors, warnings: warnings };
    }
    var headers = parseCSVLine(lines[headerIndex]);
    console.log("[DEBUG CSV] Detected headers:", headers);
    // Locate columns (flexible matching)
    var findCol = function () {
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i] = arguments[_i];
        }
        var _loop_2 = function (name_1) {
            var idx = headers.findIndex(function (h) { return h.toLowerCase().replace(/\s+/g, ' ').trim() === name_1.toLowerCase(); });
            if (idx !== -1)
                return { value: idx };
        };
        for (var _a = 0, names_1 = names; _a < names_1.length; _a++) {
            var name_1 = names_1[_a];
            var state_1 = _loop_2(name_1);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return -1;
    };
    var col = {
        question: findCol('question'),
        optionA: findCol('option a', 'optiona', 'option_a'),
        optionB: findCol('option b', 'optionb', 'option_b'),
        optionC: findCol('option c', 'optionc', 'option_c'),
        optionD: findCol('option d', 'optiond', 'option_d'),
        correctAnswer: findCol('correct answer', 'correctanswer', 'correct_answer', 'answer'),
        level: findCol('level', 'difficulty'),
        chapter: findCol('chapter', 'category', 'topic'),
    };
    console.log("[DEBUG CSV] Column indices:", col);
    // Required columns
    var missing = [];
    if (col.question === -1)
        missing.push('Question');
    if (col.correctAnswer === -1)
        missing.push('Correct Answer');
    if (col.level === -1)
        missing.push('Level');
    if (missing.length) {
        errors.push("Missing required columns: ".concat(missing.join(', ')));
        return { subjectName: subjectName, rows: rows, errors: errors, warnings: warnings };
    }
    var _loop_1 = function (i) {
        var rawLine = lines[i];
        if (!rawLine)
            return "continue";
        var line = rawLine.trim();
        if (!line || line.startsWith('#'))
            return "continue";
        var values = parseCSVLine(line);
        var get = function (idx) { var _a; return idx !== -1 && idx < values.length ? ((_a = values[idx]) !== null && _a !== void 0 ? _a : '').trim() : ''; };
        var questionText = get(col.question);
        if (!questionText)
            return "continue"; // Skip blank rows
        var optionA = get(col.optionA);
        var optionB = get(col.optionB);
        var optionC = col.optionC !== -1 ? get(col.optionC) : '';
        var optionD = col.optionD !== -1 ? get(col.optionD) : '';
        var correctAnswerRaw = get(col.correctAnswer);
        var levelRaw = get(col.level);
        var chapter = (col.chapter !== -1 ? get(col.chapter) : '') || subjectName || 'General';
        // Auto-detect shifted columns for "extreme" questions.
        // If the user missed a comma for empty options, the 'extreme' level might end up in the correctAnswer column,
        // the answer text in optionD, and the chapter in the level column.
        if ((correctAnswerRaw || '').toLowerCase() === 'extreme') {
            chapter = levelRaw || chapter;
            levelRaw = 'extreme';
            correctAnswerRaw = optionD || optionC || optionB || optionA;
            // Clear the option that was used as the answer
            if (optionD)
                optionD = '';
            else if (optionC)
                optionC = '';
            else if (optionB)
                optionB = '';
            else if (optionA)
                optionA = '';
        }
        else if ((optionD || '').toLowerCase() === 'extreme') {
            // Further shifting (missed 2 commas)
            chapter = correctAnswerRaw || chapter;
            levelRaw = 'extreme';
            correctAnswerRaw = optionC || optionB || optionA;
            if (optionC)
                optionC = '';
            else if (optionB)
                optionB = '';
            else if (optionA)
                optionA = '';
        }
        var levelLower = (levelRaw || 'easy').toLowerCase();
        console.log("[DEBUG CSV] Row ".concat(i + 1, ": levelRaw=\"").concat(levelRaw, "\", levelLower=\"").concat(levelLower, "\""));
        if (!VALID_LEVELS.includes(levelLower)) {
            warnings.push("Row ".concat(i + 1, ": invalid level \"").concat(levelRaw, "\", defaulting to \"easy\"."));
        }
        var level = VALID_LEVELS.includes(levelLower)
            ? levelLower
            : 'easy';
        console.log("[DEBUG CSV] Row ".concat(i + 1, ": Final level=\"").concat(level, "\""));
        // ── Validate by level ────────────────────────────────────────────────────
        // extreme: no options expected. Correct Answer column holds the open answer text.
        // NOTE: For extreme, the "Correct Answer" column MUST contain the actual answer text, not a letter!
        if (level === 'extreme') {
            console.log("[DEBUG CSV] Row ".concat(i + 1, ": Processing EXTREME - correctAnswerRaw=\"").concat(correctAnswerRaw, "\""));
            if (!correctAnswerRaw || correctAnswerRaw.length === 0) {
                warnings.push("Row ".concat(i + 1, ": extreme question has no answer text in \"Correct Answer\" column - use the actual answer text, not a letter. Skipping."));
                return "continue";
            }
            // Check if they accidentally used a letter instead of text
            if (['A', 'B', 'C', 'D'].includes(correctAnswerRaw.toUpperCase())) {
                warnings.push("Row ".concat(i + 1, ": extreme question uses letter \"").concat(correctAnswerRaw, "\" but should use actual answer TEXT. Using as-is."));
            }
            rows.push({ questionText: questionText, optionA: '', optionB: '', optionC: '', optionD: '', correctAnswerRaw: correctAnswerRaw, level: level, chapter: chapter });
            return "continue";
        }
        // All other levels need at least Option A
        if (!optionA) {
            warnings.push("Row ".concat(i + 1, " (").concat(level, "): missing Option A, skipping."));
            return "continue";
        }
        // easy: may be True/False
        if (level === 'easy') {
            if (isTFToken(optionA) || isTFToken(optionB)) {
                // Normalize True/False options
                var normA = normalizeTFToken(optionA);
                var normB = optionB ? normalizeTFToken(optionB) : (normA === 'True' ? 'False' : 'True');
                // Determine correct letter (A=True, B=False OR based on raw letter)
                var correctLetter_1 = correctAnswerRaw.toUpperCase();
                if (correctAnswerRaw.toUpperCase() === 'TRUE' || correctAnswerRaw.toUpperCase() === 'T') {
                    // find which slot is "True"
                    correctLetter_1 = normA === 'True' ? 'A' : 'B';
                }
                else if (correctAnswerRaw.toUpperCase() === 'FALSE' || correctAnswerRaw.toUpperCase() === 'F') {
                    correctLetter_1 = normA === 'False' ? 'A' : 'B';
                }
                // Default to A if still unrecognized
                if (correctLetter_1 !== 'A' && correctLetter_1 !== 'B')
                    correctLetter_1 = 'A';
                rows.push({ questionText: questionText, optionA: normA, optionB: normB, optionC: '', optionD: '', correctAnswerRaw: correctLetter_1, level: level, chapter: chapter });
                return "continue";
            }
            // Otherwise treat as medium (2-option multiple choice)
        }
        // medium/hard/expert/easy (non-TF): need at least B
        if (!optionB) {
            warnings.push("Row ".concat(i + 1, " (").concat(level, "): missing Option B, skipping."));
            return "continue";
        }
        // Validate number of options based on level
        var hasC = !!optionC;
        var hasD = !!optionD;
        if (level === 'medium' && (hasC || hasD)) {
            warnings.push("Row ".concat(i + 1, " (medium): medium level should have 2 options, but C/D are provided. Using first 2."));
        }
        if (level === 'hard' && !hasC) {
            warnings.push("Row ".concat(i + 1, " (hard): hard level requires 3 options (A,B,C). Missing Option C."));
        }
        if (level === 'hard' && hasD) {
            warnings.push("Row ".concat(i + 1, " (hard): hard level has 4 options, but should have 3. Using first 3."));
        }
        if (level === 'expert' && (!hasC || !hasD)) {
            warnings.push("Row ".concat(i + 1, " (expert): expert level requires 4 options (A,B,C,D). Missing options."));
        }
        // Correct answer letter must be a valid option letter
        var correctLetter = correctAnswerRaw.toUpperCase().charAt(0);
        if (!['A', 'B', 'C', 'D'].includes(correctLetter)) {
            warnings.push("Row ".concat(i + 1, ": invalid correct answer \"").concat(correctAnswerRaw, "\", defaulting to A."));
        }
        rows.push({ questionText: questionText, optionA: optionA, optionB: optionB, optionC: optionC, optionD: optionD, correctAnswerRaw: correctLetter || 'A', level: level, chapter: chapter });
    };
    // Parse data rows
    for (var i = headerIndex + 1; i < lines.length; i++) {
        _loop_1(i);
    }
    return { subjectName: subjectName, rows: rows, errors: errors, warnings: warnings };
}
// ─── Step 2 – Full import (parse + save to DB) ───────────────────────────────
function importQuestionsFromCSV(csvContent, existingSubjects) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, subjectName, rows, subjectSlug, errors, warnings, subjectId, localSubject, apiSubject, err_1, errorMessage, isNotFound, created, err_2, existingChapters, chapterMap, chaptersCreated, uniqueChapters, _i, uniqueChapters_1, chapterName, key, newChapter, err_3, defaultChapter, err_4, rawPayload, questionsPayload, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    parsed = parseCSVContent(csvContent);
                    if (parsed.errors.length > 0 || parsed.rows.length === 0) {
                        return [2 /*return*/, {
                                success: false,
                                subjectName: parsed.subjectName,
                                subjectSlug: '',
                                questionsImported: 0,
                                chaptersCreated: 0,
                                errors: parsed.errors.length > 0 ? parsed.errors : ['No valid questions found in CSV.'],
                                warnings: parsed.warnings,
                            }];
                    }
                    subjectName = parsed.subjectName, rows = parsed.rows;
                    subjectSlug = generateSlug(subjectName);
                    errors = [];
                    warnings = __spreadArray([], parsed.warnings, true);
                    localSubject = existingSubjects.find(function (s) { return s.slug === subjectSlug || s.name.toLowerCase() === subjectName.toLowerCase(); });
                    if (localSubject === null || localSubject === void 0 ? void 0 : localSubject.id) {
                        subjectId = localSubject.id;
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, quiz_api_1.getSubjectBySlug)(subjectSlug)];
                case 2:
                    apiSubject = _a.sent();
                    if (apiSubject === null || apiSubject === void 0 ? void 0 : apiSubject.id) {
                        subjectId = apiSubject.id;
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = err_1 instanceof Error ? err_1.message : String(err_1);
                    isNotFound = errorMessage.includes('404') ||
                        errorMessage.includes('not found') ||
                        errorMessage.toLowerCase().includes('not found');
                    if (!isNotFound) {
                        errors.push("API Error while checking subject: ".concat(errorMessage));
                    }
                    return [3 /*break*/, 4];
                case 4:
                    if (!!subjectId) return [3 /*break*/, 8];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, (0, quiz_api_1.createSubject)({
                            name: subjectName,
                            slug: subjectSlug,
                            emoji: '📚',
                            category: 'academic',
                        })];
                case 6:
                    created = _a.sent();
                    subjectId = created.id;
                    return [3 /*break*/, 8];
                case 7:
                    err_2 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            subjectName: subjectName,
                            subjectSlug: subjectSlug,
                            questionsImported: 0,
                            chaptersCreated: 0,
                            errors: ["Failed to create subject \"".concat(subjectName, "\": ").concat(err_2)],
                            warnings: parsed.warnings,
                        }];
                case 8: return [4 /*yield*/, (0, quiz_api_1.getChaptersBySubject)(subjectId).catch(function () { return []; })];
                case 9:
                    existingChapters = _a.sent();
                    chapterMap = new Map(existingChapters.map(function (c) { return [c.name.toLowerCase(), c.id]; }));
                    chaptersCreated = 0;
                    uniqueChapters = __spreadArray([], new Set(rows.map(function (r) { return r.chapter; })), true);
                    _i = 0, uniqueChapters_1 = uniqueChapters;
                    _a.label = 10;
                case 10:
                    if (!(_i < uniqueChapters_1.length)) return [3 /*break*/, 15];
                    chapterName = uniqueChapters_1[_i];
                    key = chapterName.toLowerCase();
                    if (!!chapterMap.has(key)) return [3 /*break*/, 14];
                    _a.label = 11;
                case 11:
                    _a.trys.push([11, 13, , 14]);
                    return [4 /*yield*/, (0, quiz_api_1.createChapter)({ name: chapterName, subjectId: subjectId })];
                case 12:
                    newChapter = _a.sent();
                    // Ensure the chapter has a valid id before adding to map
                    if (newChapter && newChapter.id) {
                        chapterMap.set(key, newChapter.id);
                        chaptersCreated++;
                    }
                    else {
                        errors.push("Chapter \"".concat(chapterName, "\" was created but returned no ID"));
                    }
                    return [3 /*break*/, 14];
                case 13:
                    err_3 = _a.sent();
                    errors.push("Failed to create chapter \"".concat(chapterName, "\": ").concat(err_3));
                    return [3 /*break*/, 14];
                case 14:
                    _i++;
                    return [3 /*break*/, 10];
                case 15:
                    if (!(chapterMap.size === 0)) return [3 /*break*/, 19];
                    _a.label = 16;
                case 16:
                    _a.trys.push([16, 18, , 19]);
                    return [4 /*yield*/, (0, quiz_api_1.createChapter)({ name: 'General', subjectId: subjectId })];
                case 17:
                    defaultChapter = _a.sent();
                    if (defaultChapter && defaultChapter.id) {
                        chapterMap.set('general', defaultChapter.id);
                        chaptersCreated++;
                    }
                    return [3 /*break*/, 19];
                case 18:
                    err_4 = _a.sent();
                    errors.push("Failed to create default chapter: ".concat(err_4));
                    return [3 /*break*/, 19];
                case 19:
                    rawPayload = rows.map(function (row, idx) {
                        var chapterKey = row.chapter.toLowerCase();
                        var chapterId = chapterMap.get(chapterKey);
                        // If chapter not found, try to use any available chapter or create a default
                        if (!chapterId) {
                            var availableChapters = Array.from(chapterMap.values());
                            if (availableChapters.length > 0 && availableChapters[0]) {
                                chapterId = availableChapters[0];
                                warnings.push("Row ".concat(idx + 1, ": Chapter \"").concat(row.chapter, "\" not found, using first available chapter"));
                            }
                            else {
                                errors.push("Row ".concat(idx + 1, ": No chapters available for subject - skipping"));
                                return null;
                            }
                        }
                        // TypeScript guarantee - chapterId is now defined
                        var finalChapterId = chapterId;
                        // extreme: no options, correctAnswer is open text
                        if (row.level === 'extreme') {
                            return {
                                question: row.questionText,
                                correctAnswer: row.correctAnswerRaw,
                                options: [],
                                level: row.level,
                                chapterId: finalChapterId,
                                status: 'published',
                            };
                        }
                        // Build options map
                        var letterToOption = {
                            A: row.optionA,
                            B: row.optionB,
                            C: row.optionC,
                            D: row.optionD,
                        };
                        var correctLetter = row.correctAnswerRaw.toUpperCase();
                        var correctAnswerText = letterToOption[correctLetter] || row.optionA;
                        // options = all options exactly A, B, C, D
                        var options = [row.optionA, row.optionB, row.optionC, row.optionD].filter(function (o) { return o; });
                        return {
                            question: row.questionText,
                            correctAnswer: correctAnswerText,
                            options: options,
                            level: row.level,
                            chapterId: finalChapterId,
                            status: 'published',
                        };
                    });
                    questionsPayload = rawPayload.filter(function (q) { return q !== null; });
                    if (questionsPayload.length === 0) {
                        return [2 /*return*/, {
                                success: false,
                                subjectName: subjectName,
                                subjectSlug: subjectSlug,
                                questionsImported: 0,
                                chaptersCreated: chaptersCreated,
                                errors: errors.length > 0 ? errors : ['No valid questions could be prepared for import.'],
                                warnings: parsed.warnings,
                            }];
                    }
                    _a.label = 20;
                case 20:
                    _a.trys.push([20, 22, , 23]);
                    return [4 /*yield*/, (0, quiz_api_1.createQuestionsBulk)(questionsPayload)];
                case 21:
                    _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            subjectName: subjectName,
                            subjectSlug: subjectSlug,
                            questionsImported: questionsPayload.length,
                            chaptersCreated: chaptersCreated,
                            errors: errors,
                            warnings: parsed.warnings,
                        }];
                case 22:
                    err_5 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            subjectName: subjectName,
                            subjectSlug: subjectSlug,
                            questionsImported: 0,
                            chaptersCreated: chaptersCreated,
                            errors: ["Failed to bulk-save questions: ".concat(err_5)],
                            warnings: parsed.warnings,
                        }];
                case 23: return [2 /*return*/];
            }
        });
    });
}

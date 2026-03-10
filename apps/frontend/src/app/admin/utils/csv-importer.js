"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCSVContent = parseCSVContent;
exports.importQuestionsFromCSV = importQuestionsFromCSV;
var quiz_api = require("@/lib/quiz-api");
var VALID_LEVELS = ['easy', 'medium', 'hard', 'expert', 'extreme'];
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
function extractSubjectName(lines) {
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var trimmed = line.trim();
        if (trimmed.startsWith('#')) {
            var match = trimmed.match(/#\s*Subject:\s*(.+)/i);
            if (match && match[1]) {
                return match[1].replace(/,+$/, '').trim();
            }
        }
    }
    return '';
}
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
function isTFToken(val) {
    var v = val.toUpperCase();
    return v === 'TRUE' || v === 'FALSE' || v === 'T' || v === 'F';
}
function normalizeTFToken(val) {
    var v = val.toUpperCase();
    return v === 'TRUE' || v === 'T' ? 'True' : 'False';
}
function parseCSVContent(csvContent) {
    var errors = [];
    var warnings = [];
    var rows = [];
    var lines = csvContent.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    var subjectName = extractSubjectName(lines);
    if (!subjectName) {
        errors.push('No subject found. Make sure the CSV starts with: # Subject: <Name>');
        return { subjectName: '', rows: rows, errors: errors, warnings: warnings };
    }
    var headerIndex = -1;
    for (var i = 0; i < lines.length; i++) {
        var line = (lines[i] || '').trim();
        if (line && !line.startsWith('#') && line.toLowerCase().indexOf('question') !== -1 && line.toLowerCase().indexOf('option') !== -1) {
            headerIndex = i;
            break;
        }
    }
    if (headerIndex === -1) {
        errors.push('Header row not found. Expected a row containing "Question" and "Option".');
        return { subjectName: subjectName, rows: rows, errors: errors, warnings: warnings };
    }
    var headers = parseCSVLine(lines[headerIndex]);
    var findCol = function() {
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i] = arguments[_i];
        }
        return function(name) {
            for (var j = 0; j < names.length; j++) {
                var idx = -1;
                for (var k = 0; k < headers.length; k++) {
                    if (headers[k].toLowerCase().replace(/\s+/g, ' ').trim() === names[j].toLowerCase()) {
                        idx = k;
                        break;
                    }
                }
                if (idx !== -1) return idx;
            }
            return -1;
        };
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
    var missing = [];
    if (col.question === -1) missing.push('Question');
    if (col.correctAnswer === -1) missing.push('Correct Answer');
    if (col.level === -1) missing.push('Level');
    if (missing.length) {
        errors.push('Missing required columns: ' + missing.join(', '));
        return { subjectName: subjectName, rows: rows, errors: errors, warnings: warnings };
    }
    for (var i = headerIndex + 1; i < lines.length; i++) {
        var rawLine = lines[i];
        if (!rawLine) continue;
        var line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        var values = parseCSVLine(line);
        var get = function(idx) {
            return idx !== -1 && idx < values.length ? (values[idx] || '').trim() : '';
        };
        var questionText = get(col.question);
        if (!questionText) continue;
        var optionA = get(col.optionA);
        var optionB = get(col.optionB);
        var optionC = col.optionC !== -1 ? get(col.optionC) : '';
        var optionD = col.optionD !== -1 ? get(col.optionD) : '';
        var correctAnswerRaw = get(col.correctAnswer);
        var levelRaw = get(col.level);
        var chapter = ((col.chapter !== -1 ? get(col.chapter) : '') || subjectName || 'General').trim();
        if ((correctAnswerRaw || '').toLowerCase() === 'extreme') {
            chapter = levelRaw || chapter;
            levelRaw = 'extreme';
            correctAnswerRaw = optionD || optionC || optionB || optionA;
            if (optionD) optionD = '';
            else if (optionC) optionC = '';
            else if (optionB) optionB = '';
            else if (optionA) optionA = '';
        }
        else if ((optionD || '').toLowerCase() === 'extreme') {
            chapter = correctAnswerRaw || chapter;
            levelRaw = 'extreme';
            correctAnswerRaw = optionC || optionB || optionA;
            if (optionC) optionC = '';
            else if (optionB) optionB = '';
            else if (optionA) optionA = '';
        }
        var levelLower = (levelRaw || 'easy').toLowerCase();
        if (VALID_LEVELS.indexOf(levelLower) === -1) {
            warnings.push('Row ' + (i + 1) + ': invalid level "' + levelRaw + '", defaulting to "easy".');
        }
        var level = VALID_LEVELS.indexOf(levelLower) !== -1 ? levelLower : 'easy';
        if (level === 'extreme') {
            if (!correctAnswerRaw || correctAnswerRaw.length === 0) {
                warnings.push('Row ' + (i + 1) + ': extreme question has no answer text in "Correct Answer" column - use the actual answer text, not a letter. Skipping.');
                continue;
            }
            if (['A', 'B', 'C', 'D'].indexOf(correctAnswerRaw.toUpperCase()) !== -1) {
                warnings.push('Row ' + (i + 1) + ': extreme question uses letter "' + correctAnswerRaw + '" but should use actual answer TEXT. Using as-is.');
            }
            rows.push({ questionText: questionText, optionA: '', optionB: '', optionC: '', optionD: '', correctAnswerRaw: correctAnswerRaw, level: level, chapter: chapter });
            continue;
        }
        if (!optionA) {
            warnings.push('Row ' + (i + 1) + ' (' + level + '): missing Option A, skipping.');
            continue;
        }
        if (level === 'easy') {
            if (isTFToken(optionA) || isTFToken(optionB)) {
                var normA = normalizeTFToken(optionA);
                var normB = optionB ? normalizeTFToken(optionB) : (normA === 'True' ? 'False' : 'True');
                var correctLetter = correctAnswerRaw.toUpperCase();
                if (correctAnswerRaw.toUpperCase() === 'TRUE' || correctAnswerRaw.toUpperCase() === 'T') {
                    correctLetter = normA === 'True' ? 'A' : 'B';
                }
                else if (correctAnswerRaw.toUpperCase() === 'FALSE' || correctAnswerRaw.toUpperCase() === 'F') {
                    correctLetter = normA === 'False' ? 'A' : 'B';
                }
                if (correctLetter !== 'A' && correctLetter !== 'B') correctLetter = 'A';
                rows.push({ questionText: questionText, optionA: normA, optionB: normB, optionC: '', optionD: '', correctAnswerRaw: correctLetter, level: level, chapter: chapter });
                continue;
            }
        }
        if (!optionB) {
            warnings.push('Row ' + (i + 1) + ' (' + level + '): missing Option B, skipping.');
            continue;
        }
        var hasC = !!optionC;
        var hasD = !!optionD;
        if (level === 'medium' && (hasC || hasD)) {
            warnings.push('Row ' + (i + 1) + ' (medium): medium level should have 2 options, but C/D are provided. Using first 2.');
        }
        if (level === 'hard' && !hasC) {
            warnings.push('Row ' + (i + 1) + ' (hard): hard level requires 3 options (A,B,C). Missing Option C.');
        }
        if (level === 'hard' && hasD) {
            warnings.push('Row ' + (i + 1) + ' (hard): hard level has 4 options, but should have 3. Using first 3.');
        }
        if (level === 'expert' && (!hasC || !hasD)) {
            warnings.push('Row ' + (i + 1) + ' (expert): expert level requires 4 options (A,B,C,D). Missing options.');
        }
        var correctLetter = correctAnswerRaw.toUpperCase().charAt(0);
        if (['A', 'B', 'C', 'D'].indexOf(correctLetter) === -1) {
            warnings.push('Row ' + (i + 1) + ': invalid correct answer "' + correctAnswerRaw + '", defaulting to A.');
        }
        rows.push({ questionText: questionText, optionA: optionA, optionB: optionB, optionC: optionC, optionD: optionD, correctAnswerRaw: correctLetter || 'A', level: level, chapter: chapter });
    }
    return { subjectName: subjectName, rows: rows, errors: errors, warnings: warnings };
}
function importQuestionsFromCSV(csvContent, existingSubjects) {
    var parsed = parseCSVContent(csvContent);
    if (parsed.errors.length > 0 || parsed.rows.length === 0) {
        return Promise.resolve({
            success: false,
            subjectName: parsed.subjectName,
            subjectSlug: '',
            questionsImported: 0,
            chaptersCreated: 0,
            errors: parsed.errors.length > 0 ? parsed.errors : ['No valid questions found in CSV.'],
            warnings: parsed.warnings,
        });
    }
    var subjectName = parsed.subjectName;
    var rows = parsed.rows;
    var subjectSlug = generateSlug(subjectName);
    var errors = [];
    var warnings = parsed.warnings.slice();
    var subjectId;
    var localSubject = null;
    for (var i = 0; i < existingSubjects.length; i++) {
        var s = existingSubjects[i];
        if (s.slug === subjectSlug || (s.name && s.name.toLowerCase() === subjectName.toLowerCase())) {
            localSubject = s;
            break;
        }
    }
    if (localSubject && localSubject.id) {
        subjectId = localSubject.id;
    }
    return quiz_api.getSubjectBySlug(subjectSlug).then(function(apiSubject) {
        if (apiSubject && apiSubject.id) {
            subjectId = apiSubject.id;
        }
    }).catch(function(err) {
        var errorMessage = err instanceof Error ? err.message : String(err);
        var isNotFound = errorMessage.indexOf('404') !== -1 ||
            errorMessage.indexOf('not found') !== -1 ||
            errorMessage.toLowerCase().indexOf('not found') !== -1;
        if (!isNotFound) {
            errors.push('API Error while checking subject: ' + errorMessage);
        }
    }).then(function() {
        if (!subjectId) {
            return quiz_api.createSubject({
                name: subjectName,
                slug: subjectSlug,
                emoji: '📚',
                category: 'academic',
            }).then(function(created) {
                subjectId = created.id;
            }).catch(function(err) {
                return Promise.resolve({
                    success: false,
                    subjectName: subjectName,
                    subjectSlug: subjectSlug,
                    questionsImported: 0,
                    chaptersCreated: 0,
                    errors: ['Failed to create subject "' + subjectName + '": ' + err],
                    warnings: parsed.warnings,
                });
            });
        }
    }).then(function() {
        if (!subjectId) {
            return {
                success: false,
                subjectName: subjectName,
                subjectSlug: subjectSlug,
                questionsImported: 0,
                chaptersCreated: 0,
                errors: errors.length > 0 ? errors : ['No valid questions could be prepared for import.'],
                warnings: parsed.warnings,
            };
        }
        return quiz_api.getChaptersBySubject(subjectId).catch(function() { return []; }).then(function(existingChapters) {
            console.log('[CSV Import] Subject ID: ' + subjectId + ', Existing chapters:', existingChapters.map(function(c) { return ({ name: c.name, id: c.id }); }));
            var chapterMap = new Map(existingChapters.map(function(c) { return [c.name.toLowerCase().trim(), c.id]; }));
            console.log('[CSV Import] Chapter map keys:', Array.from(chapterMap.keys()));
            var chaptersCreated = 0;
            var uniqueChapters = [];
            var seen = {};
            for (var i = 0; i < rows.length; i++) {
                var chapter = rows[i].chapter;
                if (!seen[chapter]) {
                    seen[chapter] = true;
                    uniqueChapters.push(chapter);
                }
            }
            console.log('[CSV Import] Unique chapters in CSV:', uniqueChapters);
            var chapterPromises = uniqueChapters.map(function(chapterName) {
                var key = chapterName.toLowerCase().trim();
                console.log('[CSV Import] Checking chapter "' + chapterName + '" (key: "' + key + '"), found in map:', chapterMap.has(key));
                if (chapterMap.has(key)) {
                    return Promise.resolve(null);
                }
                return quiz_api.createChapter({ name: chapterName, subjectId: subjectId }).then(function(newChapter) {
                    if (newChapter && newChapter.id) {
                        chapterMap.set(key, newChapter.id);
                        chaptersCreated++;
                    }
                    else {
                        errors.push('Chapter "' + chapterName + '" was created but returned no ID');
                    }
                }).catch(function(err) {
                    errors.push('Failed to create chapter "' + chapterName + '": ' + err);
                });
            });
            return Promise.all(chapterPromises).then(function() {
                if (chapterMap.size === 0) {
                    return quiz_api.createChapter({ name: 'General', subjectId: subjectId }).then(function(defaultChapter) {
                        if (defaultChapter && defaultChapter.id) {
                            chapterMap.set('general', defaultChapter.id);
                            chaptersCreated++;
                        }
                    }).catch(function(err) {
                        errors.push('Failed to create default chapter: ' + err);
                    });
                }
            }).then(function() {
                var rawPayload = rows.map(function(row, idx) {
                    var chapterKey = row.chapter.toLowerCase().trim();
                    var chapterId = chapterMap.get(chapterKey);
                    if (!chapterId) {
                        var availableChapters = Array.from(chapterMap.values());
                        if (availableChapters.length > 0 && availableChapters[0]) {
                            chapterId = availableChapters[0];
                            warnings.push('Row ' + (idx + 1) + ': Chapter "' + row.chapter + '" not found, using first available chapter');
                        }
                        else {
                            errors.push('Row ' + (idx + 1) + ': No chapters available for subject - skipping');
                            return null;
                        }
                    }
                    var finalChapterId = chapterId;
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
                    var letterToOption = {
                        A: row.optionA,
                        B: row.optionB,
                        C: row.optionC,
                        D: row.optionD,
                    };
                    var correctLetter = row.correctAnswerRaw.toUpperCase();
                    var correctAnswerText = letterToOption[correctLetter] || row.optionA;
                    var options = [row.optionA, row.optionB, row.optionC, row.optionD].filter(function(o) { return o; });
                    return {
                        question: row.questionText,
                        correctAnswer: correctAnswerText,
                        options: options,
                        level: row.level,
                        chapterId: finalChapterId,
                        status: 'published',
                    };
                });
                var questionsPayload = rawPayload.filter(function(q) { return q !== null; });
                if (questionsPayload.length === 0) {
                    return {
                        success: false,
                        subjectName: subjectName,
                        subjectSlug: subjectSlug,
                        questionsImported: 0,
                        chaptersCreated: chaptersCreated,
                        errors: errors.length > 0 ? errors : ['No valid questions could be prepared for import.'],
                        warnings: parsed.warnings,
                    };
                }
                return quiz_api.createQuestionsBulk(questionsPayload).then(function() {
                    return {
                        success: true,
                        subjectName: subjectName,
                        subjectSlug: subjectSlug,
                        questionsImported: questionsPayload.length,
                        chaptersCreated: chaptersCreated,
                        errors: errors,
                        warnings: parsed.warnings,
                    };
                }).catch(function(err) {
                    return {
                        success: false,
                        subjectName: subjectName,
                        subjectSlug: subjectSlug,
                        questionsImported: 0,
                        chaptersCreated: chaptersCreated,
                        errors: ['Failed to bulk-save questions: ' + err],
                        warnings: parsed.warnings,
                    };
                });
            });
        });
    });
}

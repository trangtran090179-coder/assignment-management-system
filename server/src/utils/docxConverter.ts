import mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';
import cheerio from 'cheerio';

export async function getDocxPreview(filePath: string): Promise<string> {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        const preview = result.value.substring(0, 500);
        return preview;
    } catch (error) {
        console.error('Error converting DOCX file:', error);
        return '';
    }
}

export async function convertDocxToHtml(filePath: string): Promise<string> {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const result = await mammoth.convertToHtml({ buffer: fileBuffer });
        return result.value;
    } catch (error) {
        console.error('Error converting DOCX to HTML:', error);
        return '';
    }
}

export interface ParsedQuestion {
    question: string;
    answers: { [key: string]: string };
    correct?: string; // single-letter like 'A' or undefined when error
    errors: string[];
}

function removeDiacritics(str: string) {
    // Normalize and remove combining diacritical marks
    return str.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/**
 * parseDocxToQuestions
 * - Converts DOCX -> HTML (mammoth), then parses sequential paragraphs/list items
 * - Groups question + options and detects correct answer using multiple signals
 * Priority: Word formatting (bold/red) > symbols/star > explicit 'Đáp án:' lines
 */
export async function parseDocxToQuestions(filePath: string): Promise<ParsedQuestion[]> {
    const html = await convertDocxToHtml(filePath);
    const $ = cheerio.load(html || '');

    // Collect all paragraph and list-item nodes in order
    const nodes: cheerio.Element[] = [];
    $('body')
        .find('p, li')
        .each((_, el) => nodes.push(el));

    const results: ParsedQuestion[] = [];

    // Helper regexes and functions
    const optionLetterRegex = /([A-Da-d])/; // basic letter capture

    // Detect option line that starts with A. or A) etc, possibly preceded by '*' or symbols
    // Regex explanation:
    // ^\s*                 -> optional leading whitespace
    // (?:\*+\s*)?         -> optional star(s) and space (for '*A. ...' cases)
    // (?:[\(\[]?\s*)?    -> optional opening bracket/paren and spaces
    // ([A-Da-d])            -> capture option letter A-D (case-insensitive)
    // [\.\)\-:\s]{0,2}  -> optional punctuation like '.', ')', '-', ':' or space
    const optionLineRegex = /^\s*(?:\*+\s*)?(?:[\(\[]?\s*)?([A-Da-d])[\.\)\-:\s]?/;

    // Explicit answer line like 'Đáp án: B' or 'ANSWER: c' (ignore diacritics + case)
    // Regex explanation:
    // (dap\s*an|answer)    -> matches 'dap an' without diacritics or 'answer'
    // \s*[:\-–]?\s*       -> optional separator like ':' or '-'
    // ([A-Da-d])             -> capture the letter
    const explicitAnswerRegex = /(dap\s*an|answer)\s*[:\-–]?\s*([A-Da-d])/i;

    // Helper: check if element contains bold formatting
    function isBold(el: cheerio.Element) {
        const htmlInner = $(el).html() || '';
        if (/<(strong|b)\b/i.test(htmlInner)) return true;
        const style = $(el).attr('style') || '';
        if (/font-weight\s*:\s*(bold|7\d\d)/i.test(style)) return true;
        return false;
    }

    // Helper: check if element has red color style
    function isRed(el: cheerio.Element) {
        const style = $(el).attr('style') || '';
        // look for color: red or hex/rgb that is red-ish
        if (/color\s*:\s*red/i.test(style)) return true;
        if (/color\s*:\s*#(?:f00|ff0000)/i.test(style)) return true;
        if (/color\s*:\s*rgb\s*\(\s*255\s*,\s*0\s*,\s*0\s*\)/i.test(style)) return true;
        return false;
    }

    // Iterate nodes and group question + options
    let idx = 0;
    while (idx < nodes.length) {
        const el = nodes[idx];
        const text = $(el).text().trim();
        // Skip empty
        if (!text) { idx++; continue; }

        // Heuristic: treat a node as question start if it contains 'Câu' or ends with '?' or starts with a number + '.'
        const isQuestionStart = /(^Cau|^Câu|^Question|\?$|^\d+\.)/i.test(text);

        // If node looks like an answer option, we might treat previous paragraph as question
        const isOption = optionLineRegex.test(text) || /^(?:\(|\[)\s*[A-Da-d]\s*[\)\]]/.test(text) || /^[\*\u2714\u2192\u27A4]/.test(text);

        let questionText = '';
        const answers: { [key: string]: string } = {};
        const errors: string[] = [];
        let explicitAnswerLetter: string | undefined;

        if (isQuestionStart || isOption) {
            if (isOption) {
                // If starts with option, the previous non-empty node is likely the question
                let back = idx - 1;
                while (back >= 0 && !$(nodes[back]).text().trim()) back--;
                if (back >= 0) questionText = $(nodes[back]).text().trim();
            } else {
                questionText = text;
                idx++;
            }

            // Collect following nodes that are options or explicit answer lines
            for (; idx < nodes.length; idx++) {
                const cur = nodes[idx];
                const curText = $(cur).text().trim();
                if (!curText) continue;

                // If we see a new question start and we've already collected options, break
                if (answers && Object.keys(answers).length > 0 && /(^Cau|^Câu|^Question|\?$|^\d+\.)/i.test(curText)) break;

                // Check for explicit answer line
                const noDiac = removeDiacritics(curText).toLowerCase();
                const explicitMatch = explicitAnswerRegex.exec(noDiac);
                if (explicitMatch) {
                    explicitAnswerLetter = explicitMatch[2].toUpperCase();
                    continue;
                }

                // Check if this paragraph is an option
                const optionMatch = optionLineRegex.exec(curText);
                if (optionMatch) {
                    const letter = optionMatch[1].toUpperCase();
                    // Remove the leading marker (e.g., 'A. ', '(C) ', '*C ')
                    const after = curText.replace(optionMatch[0], '').trim();
                    answers[letter] = after;
                    continue;
                }

                // Also accept lines where the letter is inside brackets like '(C) Hà Nội'
                const bracketMatch = /^[\(\[]\s*([A-Da-d])\s*[\)\]]\s*(.*)/.exec(curText);
                if (bracketMatch) {
                    const letter = bracketMatch[1].toUpperCase();
                    answers[letter] = (bracketMatch[2] || '').trim();
                    continue;
                }

                // If line begins with A), A. without explicit space
                const altMatch = /^([A-Da-d])([\.\)])\s*(.*)/.exec(curText);
                if (altMatch) {
                    const letter = altMatch[1].toUpperCase();
                    answers[letter] = (altMatch[3] || '').trim();
                    continue;
                }

                // If none matched and we've already collected options, and current line doesn't look like meta, assume it's continuation of last option
                if (Object.keys(answers).length > 0) {
                    const lastKey = Object.keys(answers).slice(-1)[0];
                    answers[lastKey] = (answers[lastKey] + ' ' + curText).trim();
                    continue;
                }

                // If we reach here and haven't collected answers, maybe this is still part of question
                if (!questionText) questionText = curText;
                else questionText += '\n' + curText;
            }

            // After collecting options, decide correct answer according to priority
            // 1) Word formatting (bold or red)
            const formattingMarked: string[] = [];
            for (const [letter, ansText] of Object.entries(answers)) {
                // Find the element in nodes corresponding to this answer by searching for text start
                // This is a heuristic: match by text start
                const found = nodes.find(n => $(n).text().trim().startsWith(ansText) || $(n).text().trim().includes(ansText));
                if (found && (isBold(found) || isRed(found))) formattingMarked.push(letter);
            }

            if (formattingMarked.length === 1) {
                results.push({ question: questionText, answers, correct: formattingMarked[0], errors });
                continue;
            }
            if (formattingMarked.length > 1) {
                errors.push('Multiple answers detected by formatting (bold/red): ' + formattingMarked.join(', '));
                results.push({ question: questionText, answers, errors });
                continue;
            }

            // 2) Symbols / star / special markers inside the option text
            const symbolMarked: string[] = [];
            for (const [letter, ansText] of Object.entries(answers)) {
                // star before the letter somewhere in the original node text
                // check if the stored answer text originally had a leading '*'
                const originalNode = nodes.find(n => $(n).text().trim().includes(ansText));
                const raw = originalNode ? $(originalNode).text().trim() : ansText;
                // star pattern: '*' before the letter
                if (/^\s*\*/.test(raw)) symbolMarked.push(letter);
                // patterns like '(C)', '[C]', '→ C.' or '✔ C.'
                if (/^[\(\[]\s*[A-Da-d]\s*[\)\]]/.test(raw)) symbolMarked.push(letter);
                if (/^[→\u2192\u2714\u2713\u27A4]\s*[A-Da-d]/.test(raw)) symbolMarked.push(letter);
                // also check if a check mark appears anywhere before letter
                if (/^[\*\u2714\u2713].*([A-Da-d])/i.test(raw)) symbolMarked.push(letter);
            }

            // dedupe
            const uniqueSymbolMarked = Array.from(new Set(symbolMarked));
            if (uniqueSymbolMarked.length === 1) {
                results.push({ question: questionText, answers, correct: uniqueSymbolMarked[0], errors });
                continue;
            }
            if (uniqueSymbolMarked.length > 1) {
                errors.push('Multiple answers detected by symbol/star: ' + uniqueSymbolMarked.join(', '));
                results.push({ question: questionText, answers, errors });
                continue;
            }

            // 3) Explicit answer lines like 'Đáp án: B'
            if (explicitAnswerLetter) {
                if (answers[explicitAnswerLetter]) {
                    results.push({ question: questionText, answers, correct: explicitAnswerLetter, errors });
                } else {
                    errors.push('Explicit answer indicated: ' + explicitAnswerLetter + ' but option not found');
                    results.push({ question: questionText, answers, errors });
                }
                continue;
            }

            // No detection -> error
            errors.push('No correct answer detected');
            results.push({ question: questionText, answers, errors });
            continue;
        }

        idx++;
    }

    return results;
}

// Auto fallback: try HTML-aware parsing first; if no results, try raw-text parsing
export async function parseDocxToQuestionsWithFallback(filePath: string): Promise<ParsedQuestion[]> {
    const htmlResults = await parseDocxToQuestions(filePath);
    if (htmlResults && htmlResults.length > 0) return htmlResults;

    // Try raw text fallback
    const rawResults = await parseRawTextToQuestions(filePath);
    return rawResults;
}

// Fallback: parse raw extracted text when HTML-based parsing fails to find questions.
export async function parseRawTextToQuestions(filePath: string): Promise<ParsedQuestion[]> {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        const text = (result && result.value) ? String(result.value) : '';

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        const parsed: ParsedQuestion[] = [];

        // Regexes (explanations in comments)
        const questionStartRe = /^(?:(?:Cau|Câu|Question)\s*)?(\d+)[:\.\)]?\s*(.*)/i;
        const optionRe1 = /^([A-Fa-f])[\.:\)\-]?\s*(.+)$/; // A. text  or A) text
        const optionRe2 = /^\(?([A-Fa-f])\)?\s+(.+)$/; // (A) text or A text
        const bracketOptionRe = /^[\(\[]\s*([A-Fa-f])\s*[\)\]]\s*(.*)$/; // (C) text
        const explicitAnswerRe = /(dap\s*an|answer|correct)\s*[:\-–]?\s*([A-Fa-f])/i;
        const singleLetterRe = /^([A-Fa-f])$/;

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const qm = questionStartRe.exec(line);
            if (qm) {
                // start a new question
                let questionText = (qm[2] || '').trim();
                const answers: { [key: string]: string } = {};
                const errors: string[] = [];
                let explicitAnswer: string | undefined;

                i++;
                // collect lines until next question or EOF
                for (; i < lines.length; i++) {
                    const cur = lines[i];
                    // if next question starts, break
                    if (questionStartRe.test(cur)) break;

                    // explicit answer line
                    const noDiac = removeDiacritics(cur).toLowerCase();
                    const am = explicitAnswerRe.exec(noDiac);
                    if (am) {
                        explicitAnswer = am[2].toUpperCase();
                        continue;
                    }

                    // option patterns
                    let m = optionRe1.exec(cur) || optionRe2.exec(cur) || bracketOptionRe.exec(cur);
                    if (m) {
                        const letter = m[1].toUpperCase();
                        const optText = (m[2] || '').trim();
                        answers[letter] = optText;
                        continue;
                    }

                    // single-letter line (e.g., 'B') treated as explicit answer if options exist
                    const sl = singleLetterRe.exec(cur);
                    if (sl && Object.keys(answers).length >= 2 && !explicitAnswer) {
                        explicitAnswer = sl[1].toUpperCase();
                        continue;
                    }

                    // continuation of last option if exists
                    if (Object.keys(answers).length > 0) {
                        const last = Object.keys(answers).slice(-1)[0];
                        answers[last] = (answers[last] + ' ' + cur).trim();
                        continue;
                    }

                    // otherwise append to question text
                    questionText = (questionText ? questionText + ' ' + cur : cur);
                }

                // Decide correct answer: 1) explicitAnswer 2) star/marker inside option 3) none -> error
                // Check for star/marker in option texts
                const symbolMarked: string[] = [];
                for (const [k, v] of Object.entries(answers)) {
                    if (/^\*/.test(v) || /✔|\u2713|\u2714|→|->/.test(v) || /^\(?\s*\*/.test(v)) symbolMarked.push(k);
                }

                if (symbolMarked.length === 1) {
                    parsed.push({ question: questionText, answers, correct: symbolMarked[0], errors });
                } else if (symbolMarked.length > 1) {
                    errors.push('Multiple answers detected by symbol/star: ' + symbolMarked.join(', '));
                    parsed.push({ question: questionText, answers, errors });
                } else if (explicitAnswer) {
                    if (answers[explicitAnswer]) parsed.push({ question: questionText, answers, correct: explicitAnswer, errors });
                    else { errors.push('Explicit answer indicated: ' + explicitAnswer + ' but option not found'); parsed.push({ question: questionText, answers, errors }); }
                } else {
                    if (Object.keys(answers).length === 0) errors.push('No options found');
                    else errors.push('No correct answer detected');
                    parsed.push({ question: questionText, answers, errors });
                }

                continue; // continue while loop (i already at next question or EOF)
            }

            i++;
        }

        return parsed;
    } catch (error) {
        console.error('Error in parseRawTextToQuestions:', error);
        return [];
    }
}

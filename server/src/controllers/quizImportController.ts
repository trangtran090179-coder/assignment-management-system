import { Request, Response } from 'express';
import mammoth from 'mammoth';
import * as path from 'path';
import * as fs from 'fs';
import { parseDocxToQuestionsWithFallback } from '../utils/docxConverter';

interface ParsedQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

export class QuizImportController {
    // Parse file Word và trả về danh sách câu hỏi
    public async parseWordFile(req: Request, res: Response) {
        try {
            console.log('\n===== PARSE WORD FILE =====');
            
            if (!req.file) {
                return res.status(400).json({ message: 'Vui lòng upload file Word' });
            }

            const filePath = req.file.path;
            console.log('File path:', filePath);

            // Read và parse file Word. Try buffer-based extraction first (more reliable),
            // fallback to path-based extraction if needed.
            let text = '';
            try {
                const fileBuffer = fs.readFileSync(filePath);
                const result = await mammoth.extractRawText({ buffer: fileBuffer });
                text = result.value;
                console.log('Extracted text length (buffer):', text.length);
            } catch (e1) {
                console.warn('[MAMMOTH] buffer extraction failed, trying path-based extraction', e1 && (e1 as any).message || e1);
                try {
                    const result = await mammoth.extractRawText({ path: filePath });
                    text = result.value;
                    console.log('Extracted text length (path):', text.length);
                } catch (e2) {
                    console.error('[MAMMOTH] both buffer and path extraction failed', e2 && (e2 as any).message || e2);
                    throw e2;
                }
            }

            // Try HTML-aware parsing first, then raw-text fallback inside the util
            let parsed = await parseDocxToQuestionsWithFallback(filePath);
            console.log('Parsed (combined) questions:', parsed.length);

            // If still nothing, fallback to legacy text parser (controller-local)
            if (!parsed || parsed.length === 0) {
                const questionsLegacy = this.parseQuestions(text);
                console.log('Parsed (legacy text) questions:', questionsLegacy.length);
                try { fs.unlinkSync(filePath); } catch (e) { }
                if (!questionsLegacy || questionsLegacy.length === 0) {
                    const rawPreview = text ? String(text).substring(0, 10000) : '';
                    return res.status(400).json({ 
                        message: 'Không thể parse câu hỏi từ file. Vui lòng kiểm tra định dạng file.',
                        rawText: rawPreview
                    });
                }

                const transformedLegacy = questionsLegacy.map(q => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation
                }));
                return res.json({ message: `Parse thành công ${transformedLegacy.length} câu hỏi`, questions: transformedLegacy });
            }

            // Transform util-parsed questions to client format
            const transformed: ParsedQuestion[] = parsed.map(pq => {
                const letters = Object.keys(pq.answers).sort();
                const options = letters.map(l => pq.answers[l]);
                const correctLetter = pq.correct;
                const correctIndex = correctLetter ? letters.indexOf(correctLetter) : -1;
                return {
                    question: pq.question,
                    options,
                    correctAnswer: correctIndex >= 0 ? correctIndex : -1,
                    explanation: undefined
                } as ParsedQuestion;
            });

            const itemsWithErrors = parsed.filter(p => p.errors && p.errors.length > 0);
            if (itemsWithErrors.length > 0) {
                const rawPreview = text ? String(text).substring(0, 10000) : '';
                try { fs.unlinkSync(filePath); } catch (e) { }
                return res.status(400).json({ 
                    message: 'Không thể parse hoàn chỉnh. Một số câu có lỗi.',
                    parsed: parsed,
                    rawText: rawPreview
                });
            }

            // Delete uploaded file
            try { fs.unlinkSync(filePath); } catch (e) { }

            res.json({ message: `Parse thành công ${transformed.length} câu hỏi`, questions: transformed });

        } catch (error: any) {
            console.error('[PARSE WORD ERROR]:', (error && error.stack) || error);
            res.status(500).json({ 
                message: 'Lỗi khi parse file Word', 
                error: (error && error.message) || String(error)
            });
        }
    }

    private parseQuestions(text: string): ParsedQuestion[] {
        const questions: ParsedQuestion[] = [];
        
        try {
            // Split by "Câu" or "Question" (case insensitive)
            const lines = text.split('\n').map(line => line.trim()).filter(line => line);
            
            let currentQuestion: Partial<ParsedQuestion> | null = null;
            let questionText = '';
            let options: string[] = [];
            let correctAnswer = -1;
            let explanation = '';
            let questionNumber = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Check if this is a new question
                // Match lines like "Câu 1: ...", "Question 1.", or "1) ..." (number-only)
                const questionMatch = line.match(/^(?:(?:Câu|Question)\s*)?(\d+)[:\.\)]?\s*(.*)/i);
                if (questionMatch) {
                    // Save previous question if exists
                    if (currentQuestion && questionText && options.length >= 2 && correctAnswer >= 0) {
                        questions.push({
                            question: questionText.trim(),
                            options: options,
                            correctAnswer: correctAnswer,
                            explanation: explanation.trim() || undefined
                        });
                    }

                    // Start new question
                    questionNumber = parseInt(questionMatch[1]);
                    questionText = questionMatch[2] || '';
                    options = [];
                    correctAnswer = -1;
                    explanation = '';
                    currentQuestion = {};
                    continue;
                }

                // Check if this is an option (A, B, C, D, etc.)
                // Option lines like "A. text", "A) text", "(a) text", or "a. text"
                let optionMatch = line.match(/^([A-Fa-f])[:\.\)]\s*(.+)/i);
                if (!optionMatch) {
                    optionMatch = line.match(/^\(?([A-Fa-f])\)?\s+(.+)/i);
                }

                if (optionMatch && currentQuestion) {
                    const optionLetter = optionMatch[1].toUpperCase();
                    const optionText = optionMatch[2].trim();
                    options.push(optionText);
                    continue;
                }

                // Check if this is the correct answer
                const answerMatch = line.match(/^(?:Đáp án|Answer|Correct)[:\.]?\s*([A-Fa-f])/i);
                if (answerMatch && currentQuestion) {
                    const letter = answerMatch[1].toUpperCase();
                    correctAnswer = letter.charCodeAt(0) - 'A'.charCodeAt(0);
                    continue;
                }

                // Sometimes the answer is provided as a single letter on its own line (e.g. "B")
                const singleLetterAnswer = line.match(/^([A-Fa-f])$/i);
                if (singleLetterAnswer && currentQuestion && correctAnswer < 0 && options.length >= 2) {
                    const letter = singleLetterAnswer[1].toUpperCase();
                    correctAnswer = letter.charCodeAt(0) - 'A'.charCodeAt(0);
                    continue;
                }

                // Check if this is explanation
                const explanationMatch = line.match(/^(?:Giải thích|Explanation)[:\.]?\s*(.+)/i);
                if (explanationMatch && currentQuestion) {
                    explanation = explanationMatch[1];
                    continue;
                }

                // If we have a current question but no match, it might be continuation of question text
                if (currentQuestion && !options.length && !line.match(/^[A-F][:\.\)]/i)) {
                    questionText += ' ' + line;
                }
            }

            // Don't forget the last question
            if (currentQuestion && questionText && options.length >= 2 && correctAnswer >= 0) {
                questions.push({
                    question: questionText.trim(),
                    options: options,
                    correctAnswer: correctAnswer,
                    explanation: explanation.trim() || undefined
                });
            }

            console.log('[PARSE] Successfully parsed', questions.length, 'questions');
            return questions;

        } catch (error) {
            console.error('[PARSE ERROR]:', error);
            return [];
        }
    }

    // Generate sample Word file template
    public async downloadTemplate(req: Request, res: Response) {
        try {
            const templateContent = `TEMPLATE TẠO QUIZ TRẮC NGHIỆM

Hướng dẫn:
1. Mỗi câu hỏi bắt đầu bằng "Câu" theo sau số thứ tự
2. Các đáp án bắt đầu bằng A, B, C, D (có thể đến F)
3. Đáp án đúng được đánh dấu bằng "Đáp án:" theo sau chữ cái
4. Giải thích (tùy chọn) bắt đầu bằng "Giải thích:"

===============================================

Câu 1: Thủ đô của Việt Nam là gì?
A. Hồ Chí Minh
B. Hà Nội
C. Đà Nẵng
D. Huế
Đáp án: B
Giải thích: Hà Nội là thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.

Câu 2: 2 + 2 = ?
A. 3
B. 4
C. 5
D. 6
Đáp án: B

Câu 3: Python là ngôn ngữ lập trình nào?
A. Compiled language
B. Interpreted language
C. Assembly language
D. Machine language
Đáp án: B
Giải thích: Python là ngôn ngữ thông dịch (interpreted), code được thực thi trực tiếp mà không cần biên dịch trước.

Câu 4: HTML là viết tắt của gì?
A. Hyper Text Markup Language
B. High Tech Modern Language
C. Home Tool Markup Language
D. Hyperlinks and Text Markup Language
Đáp án: A

Câu 5: Ai là tác giả của ngôn ngữ lập trình Python?
A. Dennis Ritchie
B. Guido van Rossum
C. James Gosling
D. Bjarne Stroustrup
Đáp án: B
Giải thích: Guido van Rossum là người sáng tạo ra ngôn ngữ Python vào năm 1991.
`;

            // Set response headers for file download
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="quiz-template.txt"');
            res.send(templateContent);

        } catch (error: any) {
            console.error('[TEMPLATE ERROR]:', error);
            res.status(500).json({ 
                message: 'Lỗi khi tải template', 
                error: error.message 
            });
        }
    }
}

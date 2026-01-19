import { Request, Response } from 'express';
import mammoth from 'mammoth';
import * as path from 'path';
import * as fs from 'fs';

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

            // Read và parse file Word
            const result = await mammoth.extractRawText({ path: filePath });
            const text = result.value;
            console.log('Extracted text length:', text.length);

            // Parse text thành questions
            const questions = this.parseQuestions(text);
            console.log('Parsed questions:', questions.length);

            // Delete uploaded file
            fs.unlinkSync(filePath);

            if (questions.length === 0) {
                return res.status(400).json({ 
                    message: 'Không thể parse câu hỏi từ file. Vui lòng kiểm tra định dạng file.' 
                });
            }

            res.json({
                message: `Parse thành công ${questions.length} câu hỏi`,
                questions: questions
            });

        } catch (error: any) {
            console.error('[PARSE WORD ERROR]:', error);
            res.status(500).json({ 
                message: 'Lỗi khi parse file Word', 
                error: error.message 
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
                const questionMatch = line.match(/^(?:Câu|Question)\s*(\d+)[:\.\)]?\s*(.*)/i);
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
                const optionMatch = line.match(/^([A-F])[:\.\)]\s*(.+)/i);
                if (optionMatch && currentQuestion) {
                    const optionLetter = optionMatch[1].toUpperCase();
                    const optionText = optionMatch[2].trim();
                    options.push(optionText);
                    continue;
                }

                // Check if this is the correct answer
                const answerMatch = line.match(/^(?:Đáp án|Answer|Correct)[:\.]?\s*([A-F])/i);
                if (answerMatch && currentQuestion) {
                    const letter = answerMatch[1].toUpperCase();
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

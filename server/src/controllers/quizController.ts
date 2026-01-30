import { Request, Response } from 'express';
import { Quiz, Question, QuizAttempt } from '../models/Quiz';

let quizzes: Quiz[] = [];
let quizIdCounter = 1;

console.log('[INIT] Quiz Controller initialized');

// Export function để đếm quizzes theo class
export function getQuizzesCountByClass(classId: number): number {
    const count = quizzes.filter(q => q.classId == classId).length;
    console.log(`[DEBUG] getQuizzesCountByClass(${classId}) = ${count}`);
    return count;
}

// Export function để lấy quizzes của class
export function getQuizzesByClass(classId: number): Quiz[] {
    const filtered = quizzes
        .filter(q => q.classId == classId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    console.log(`[DEBUG] getQuizzesByClass(${classId}) returned ${filtered.length} quizzes`);
    return filtered;
}

export class QuizController {
    // Lấy tất cả quizzes
    public async getQuizzes(req: Request, res: Response) {
        try {
            console.log('[GET QUIZZES] Total quizzes:', quizzes.length);
            res.json(quizzes);
        } catch (error) {
            console.error('[GET QUIZZES] Error:', error);
            res.status(500).json({ message: 'Lỗi khi tải danh sách quiz', error });
        }
    }

    // Lấy quizzes theo class
    public async getQuizzesByClassId(req: Request, res: Response) {
        try {
            const { classId } = req.params;
            console.log('[GET QUIZZES BY CLASS] ClassId:', classId);
            
            const classQuizzes = getQuizzesByClass(Number(classId));
            res.json(classQuizzes);
        } catch (error) {
            console.error('[GET QUIZZES BY CLASS] Error:', error);
            res.status(500).json({ message: 'Lỗi khi tải quiz của lớp', error });
        }
    }

    // Lấy chi tiết quiz
    public async getQuizById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const quiz = quizzes.find(q => q.id === Number(id));
            
            if (!quiz) {
                return res.status(404).json({ message: 'Không tìm thấy quiz' });
            }
            
            console.log('[GET QUIZ] Quiz found:', quiz.id, quiz.title);
            res.json(quiz);
        } catch (error) {
            console.error('[GET QUIZ] Error:', error);
            res.status(500).json({ message: 'Lỗi khi tải quiz', error });
        }
    }

    // Lấy quiz cho học sinh làm bài (ẩn đáp án đúng)
    public async getQuizForStudent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const quiz = quizzes.find(q => q.id === Number(id));
            
            if (!quiz) {
                return res.status(404).json({ message: 'Không tìm thấy quiz' });
            }

            // Tạo bản copy quiz không có đáp án đúng
            const studentQuiz = {
                id: quiz.id,
                classId: quiz.classId,
                className: quiz.className,
                title: quiz.title,
                description: quiz.description,
                dueDate: quiz.dueDate,
                timeLimit: quiz.timeLimit,
                shuffleQuestions: quiz.shuffleQuestions,
                shuffleOptions: quiz.shuffleOptions,
                questions: quiz.questions.map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options
                    // Không gửi correctAnswer và explanation
                }))
            };
            // Nếu có thông tin user từ token, kiểm tra xem user đã làm chưa
            const authUser: any = (req as any).user;
            if (authUser && authUser.id) {
                const existingAttempt = quiz.attempts.find(a => Number(a.studentId) === Number(authUser.id));
                if (existingAttempt) {
                    // Trả thêm attempt để frontend hiển thị ngay trạng thái đã làm
                    const attemptCopy = {
                        studentId: existingAttempt.studentId,
                        studentName: existingAttempt.studentName,
                        submittedAt: existingAttempt.submittedAt,
                        timeSpent: existingAttempt.timeSpent,
                        score: existingAttempt.score,
                        answers: existingAttempt.answers
                    };

                    console.log('[GET QUIZ FOR STUDENT] Quiz:', studentQuiz.id, ' - already submitted by user', authUser.id);
                    return res.json({ ...studentQuiz, alreadySubmitted: true, attempt: attemptCopy });
                }
            }

            console.log('[GET QUIZ FOR STUDENT] Quiz:', studentQuiz.id);
            res.json(studentQuiz);
        } catch (error) {
            console.error('[GET QUIZ FOR STUDENT] Error:', error);
            res.status(500).json({ message: 'Lỗi khi tải quiz', error });
        }
    }

    // Tạo quiz mới
    public async createQuiz(req: Request, res: Response) {
        try {
            const { 
                classId, 
                className, 
                teacherId, 
                title, 
                description, 
                questions, 
                dueDate,
                timeLimit,
                showAnswers,
                shuffleQuestions,
                shuffleOptions
            } = req.body;

            console.log('\n===== CREATE QUIZ =====');
            console.log('Body:', { classId, title, dueDate, questionsCount: questions?.length });

            if (!classId || !title || !questions || questions.length === 0) {
                console.log('ERROR: Missing required fields');
                return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin quiz' });
            }

            // Validate questions
            for (const q of questions) {
                if (!q.question || !q.options || q.options.length < 2 || q.correctAnswer === undefined) {
                    return res.status(400).json({ message: 'Mỗi câu hỏi phải có nội dung, ít nhất 2 đáp án và đáp án đúng' });
                }
            }

            const newQuiz = new Quiz(
                quizIdCounter++,
                classId,
                className,
                teacherId,
                title,
                description || '',
                questions,
                dueDate,
                timeLimit || 0,
                showAnswers !== false,
                shuffleQuestions || false,
                shuffleOptions || false
            );

            quizzes.push(newQuiz);
            console.log('[CREATE QUIZ] Success:', newQuiz.id, newQuiz.title);
            console.log('===============================\n');

            res.status(201).json({
                message: 'Tạo quiz thành công!',
                quiz: newQuiz
            });
        } catch (error) {
            console.error('[CREATE QUIZ] Error:', error);
            res.status(500).json({ message: 'Lỗi khi tạo quiz', error });
        }
    }

    // Nộp bài quiz
    public async submitQuiz(req: Request, res: Response) {
        try {
            const { id } = req.params;
            let { studentId, studentName, answers, timeSpent } = req.body;

            // Normalize studentId to number to avoid string/number mismatches
            const studentIdNum = Number(studentId);
            studentId = studentIdNum;

            console.log('\n===== SUBMIT QUIZ =====');
            console.log('QuizId:', id, 'StudentId:', studentId);

            const quiz = quizzes.find(q => q.id === Number(id));
            if (!quiz) {
                return res.status(404).json({ message: 'Không tìm thấy quiz' });
            }

            // Kiểm tra xem học sinh đã làm bài chưa
            const existingAttempt = quiz.attempts.find(a => Number(a.studentId) === studentIdNum);
            if (existingAttempt) {
                return res.status(400).json({ message: 'Bạn đã nộp bài quiz này rồi' });
            }

            // Tính điểm
            let correctCount = 0;
            const detailedResults = quiz.questions.map((q, index) => {
                const isCorrect = answers[index] === q.correctAnswer;
                if (isCorrect) correctCount++;
                
                return {
                    questionId: q.id,
                    question: q.question,
                    options: q.options,
                    studentAnswer: answers[index],
                    correctAnswer: quiz.showAnswers ? q.correctAnswer : undefined,
                    isCorrect: isCorrect,
                    explanation: quiz.showAnswers ? q.explanation : undefined
                };
            });

            const score = Math.round((correctCount / quiz.questions.length) * 100);

            const attempt: QuizAttempt = {
                studentId: studentIdNum,
                studentName,
                answers,
                score,
                submittedAt: new Date(),
                timeSpent: timeSpent || 0
            };

            quiz.attempts.push(attempt);
            console.log('[SUBMIT QUIZ] Score:', score, 'Correct:', correctCount, '/', quiz.questions.length);
            console.log('===============================\n');

            res.json({
                message: 'Nộp bài thành công!',
                score,
                correctCount,
                totalQuestions: quiz.questions.length,
                results: quiz.showAnswers ? detailedResults : undefined,
                attempt: {
                    studentId: attempt.studentId,
                    studentName: attempt.studentName,
                    submittedAt: attempt.submittedAt,
                    timeSpent: attempt.timeSpent,
                    score: attempt.score
                }
            });
        } catch (error) {
            console.error('[SUBMIT QUIZ] Error:', error);
            res.status(500).json({ message: 'Lỗi khi nộp bài', error });
        }
    }

    // Lấy kết quả quiz của học sinh
    public async getQuizResult(req: Request, res: Response) {
        try {
            const { id, studentId } = req.params;
            
            const quiz = quizzes.find(q => q.id === Number(id));
            if (!quiz) {
                return res.status(404).json({ message: 'Không tìm thấy quiz' });
            }

            const attempt = quiz.attempts.find(a => Number(a.studentId) === Number(studentId));
            if (!attempt) {
                return res.status(404).json({ message: 'Chưa có bài làm' });
            }

            const detailedResults = quiz.questions.map((q, index) => {
                const isCorrect = attempt.answers[index] === q.correctAnswer;
                
                return {
                    questionId: q.id,
                    question: q.question,
                    options: q.options,
                    studentAnswer: attempt.answers[index],
                    correctAnswer: quiz.showAnswers ? q.correctAnswer : undefined,
                    isCorrect: isCorrect,
                    explanation: quiz.showAnswers ? q.explanation : undefined
                };
            });

            res.json({
                score: attempt.score,
                submittedAt: attempt.submittedAt,
                timeSpent: attempt.timeSpent,
                results: quiz.showAnswers ? detailedResults : undefined
            });
        } catch (error) {
            console.error('[GET QUIZ RESULT] Error:', error);
            res.status(500).json({ message: 'Lỗi khi tải kết quả', error });
        }
    }

    // Xóa quiz
    public async deleteQuiz(req: Request, res: Response) {
        try {
            const { id } = req.params;
            console.log('[DELETE QUIZ] QuizId:', id);
            
            const index = quizzes.findIndex(q => q.id === Number(id));
            if (index === -1) {
                return res.status(404).json({ message: 'Không tìm thấy quiz' });
            }

            quizzes.splice(index, 1);
            console.log('[DELETE QUIZ] Success');
            
            res.json({ message: 'Xóa quiz thành công!' });
        } catch (error) {
            console.error('[DELETE QUIZ] Error:', error);
            res.status(500).json({ message: 'Lỗi khi xóa quiz', error });
        }
    }

    // Cập nhật quiz
    public async updateQuiz(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            console.log('[UPDATE QUIZ] QuizId:', id);
            
            const quiz = quizzes.find(q => q.id === Number(id));
            if (!quiz) {
                return res.status(404).json({ message: 'Không tìm thấy quiz' });
            }

            // Update các trường được phép
            if (updates.title) quiz.title = updates.title;
            if (updates.description !== undefined) quiz.description = updates.description;
            if (updates.questions) quiz.questions = updates.questions;
            if (updates.dueDate) quiz.dueDate = updates.dueDate;
            if (updates.timeLimit !== undefined) quiz.timeLimit = updates.timeLimit;
            if (updates.showAnswers !== undefined) quiz.showAnswers = updates.showAnswers;
            if (updates.shuffleQuestions !== undefined) quiz.shuffleQuestions = updates.shuffleQuestions;
            if (updates.shuffleOptions !== undefined) quiz.shuffleOptions = updates.shuffleOptions;

            console.log('[UPDATE QUIZ] Success');
            res.json({ message: 'Cập nhật quiz thành công!', quiz });
        } catch (error) {
            console.error('[UPDATE QUIZ] Error:', error);
            res.status(500).json({ message: 'Lỗi khi cập nhật quiz', error });
        }
    }

    // Lấy tất cả kết quả của quiz (dành cho giáo viên)
    public async getQuizAttempts(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            const quiz = quizzes.find(q => q.id === Number(id));
            if (!quiz) {
                return res.status(404).json({ message: 'Không tìm thấy quiz' });
            }

            console.log('[GET QUIZ ATTEMPTS] Quiz:', id, 'Attempts:', quiz.attempts.length);
            res.json({
                quizTitle: quiz.title,
                totalQuestions: quiz.questions.length,
                attempts: quiz.attempts.sort((a, b) => b.score - a.score)
            });
        } catch (error) {
            console.error('[GET QUIZ ATTEMPTS] Error:', error);
            res.status(500).json({ message: 'Lỗi khi tải kết quả', error });
        }
    }
}

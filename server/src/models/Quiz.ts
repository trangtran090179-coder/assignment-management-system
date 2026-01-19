export interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number; // Index của đáp án đúng (0-3)
    explanation?: string; // Giải thích đáp án (optional)
}

export interface QuizAttempt {
    studentId: number;
    studentName: string;
    answers: number[]; // Mảng các index đáp án đã chọn
    score: number;
    submittedAt: Date;
    timeSpent: number; // Thời gian làm bài (phút)
}

export class Quiz {
    id: number;
    classId: number;
    className: string;
    teacherId: number;
    title: string;
    description: string;
    questions: Question[];
    dueDate: string;
    timeLimit: number; // Thời gian làm bài (phút), 0 = không giới hạn
    showAnswers: boolean; // Hiển thị đáp án sau khi nộp bài
    shuffleQuestions: boolean; // Xáo trộn câu hỏi
    shuffleOptions: boolean; // Xáo trộn đáp án
    attempts: QuizAttempt[];
    createdAt: Date;

    constructor(
        id: number,
        classId: number,
        className: string,
        teacherId: number,
        title: string,
        description: string,
        questions: Question[],
        dueDate: string,
        timeLimit: number = 0,
        showAnswers: boolean = true,
        shuffleQuestions: boolean = false,
        shuffleOptions: boolean = false
    ) {
        this.id = id;
        this.classId = classId;
        this.className = className;
        this.teacherId = teacherId;
        this.title = title;
        this.description = description;
        this.questions = questions;
        this.dueDate = dueDate;
        this.timeLimit = timeLimit;
        this.showAnswers = showAnswers;
        this.shuffleQuestions = shuffleQuestions;
        this.shuffleOptions = shuffleOptions;
        this.attempts = [];
        this.createdAt = new Date();
    }
}

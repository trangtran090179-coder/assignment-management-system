import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getQuizForStudent, submitQuiz } from '../services/api';
import useExamMonitor from '../hooks/useExamMonitor';
import CountdownTimer from '../components/CountdownTimer';

interface Question {
    id: number;
    question: string;
    options: string[];
}

interface QuizData {
    id: number;
    title: string;
    description: string;
    className: string;
    dueDate: string;
    timeLimit: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    questions: Question[];
}

interface TakeQuizProps {
    user: any;
}

const TakeQuiz: React.FC<TakeQuizProps> = ({ user }) => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [answers, setAnswers] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [readOnly, setReadOnly] = useState(false);
    const [existingAttempt, setExistingAttempt] = useState<any | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [inExam, setInExam] = useState(false);
    const [error, setError] = useState('');
    const [startTime, setStartTime] = useState<Date>(new Date());
    const [timeExpired, setTimeExpired] = useState(false);
    const examMode = new URLSearchParams(location.search).get('exam') === '1';

    const examMonitor = useExamMonitor(quizId!, user?.id ?? 0);

    useEffect(() => {
        loadQuiz();
        try {
            setInExam(localStorage.getItem('inExam') === 'true');
        } catch (e) {
            setInExam(false);
        }
    }, [quizId]);

    // Auto-submit when time expires
    useEffect(() => {
        if (!quiz || quiz.timeLimit === 0) return;

        const timeoutId = setTimeout(() => {
            setTimeExpired(true);
            alert('Hết giờ! Bài làm của bạn sẽ được tự động nộp.');
            handleSubmit();
        }, quiz.timeLimit * 60000);

        return () => clearTimeout(timeoutId);
    }, [quiz]);

    // Warn on page unload in exam mode to prevent accidental leaving
    useEffect(() => {
        if (!examMode || submitted) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [examMode, submitted]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            const data = await getQuizForStudent(quizId!);
            // If server returned an existing attempt, redirect immediately to results
            if (data?.alreadySubmitted && data.attempt) {
                try {
                    navigate(`/quiz/${quizId}/result/${data.attempt.studentId}`, { replace: true });
                    return;
                } catch (e) {
                    // fallback: set read-only state if navigation fails
                    setExistingAttempt(data.attempt);
                    setReadOnly(true);
                }
            }
            // Shuffle questions if needed
            let questions = [...data.questions];
            if (data.shuffleQuestions) {
                questions = shuffleArray(questions);
            }

            // Shuffle options if needed
            if (data.shuffleOptions) {
                questions = questions.map(q => ({
                    ...q,
                    options: shuffleArray([...q.options])
                }));
            }

            setQuiz({ ...data, questions });
            // If existing attempt provided, prefill answers, otherwise init to -1
            if (data?.attempt && Array.isArray(data.attempt.answers)) {
                setAnswers(data.attempt.answers);
            } else {
                setAnswers(new Array(questions.length).fill(-1)); // -1 means not answered
            }
            setStartTime(new Date());
            // mark first question start for monitoring
            try { examMonitor?.markQuestionStart(questions[0]?.id ?? 0); } catch (e) {}
        } catch (err: any) {
            setError('Không thể tải quiz: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const handleAnswerChange = (questionIndex: number, optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = optionIndex;
        setAnswers(newAnswers);
        try { examMonitor?.markQuestionAnswered(quiz?.questions[questionIndex]?.id ?? questionIndex); } catch (e) {}
    };

    const calculateTimeSpent = () => {
        const endTime = new Date();
        const diffInMs = endTime.getTime() - startTime.getTime();
        return Math.round(diffInMs / 60000); // Convert to minutes
    };

    const handleSubmit = async () => {
        if (!quiz) return;

        // Check if all questions are answered
        const unansweredCount = answers.filter(a => a === -1).length;
        if (unansweredCount > 0) {
            const confirm = window.confirm(
                `Bạn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc muốn nộp bài không?`
            );
            if (!confirm) return;
        }

        try {
            setSubmitting(true);
            const timeSpent = calculateTimeSpent();

            // end monitoring session before submitting
            try { await examMonitor?.endSession(); } catch (e) { console.error('exam end error', e); }

            const studentIdToSend = Number(user?.id ?? user?._id ?? 0);
            const studentNameToSend = user?.name || user?.username || user?.email || 'Student';

            const result = await submitQuiz(quizId!, {
                studentId: studentIdToSend,
                studentName: studentNameToSend,
                answers: answers,
                timeSpent: timeSpent
            });

            alert(`Nộp bài thành công! Điểm của bạn: ${result.score}/100`);
            setSubmitted(true);
            // Prefer studentId returned by server (in case client id format differs)
            const resultStudentId = result?.attempt?.studentId ?? studentIdToSend;
            // clear exam mode
            try { localStorage.removeItem('inExam'); } catch (e) {}
            // navigate to result (use replace to avoid leaving a stale history entry)
            try {
                navigate(`/quiz/${quizId}/result/${resultStudentId}`, { replace: true });
            } catch (e) {
                // fallback: if navigate fails for any reason, keep submitted state so UI updates
                console.error('[TakeQuiz] navigate error:', e);
            }
        } catch (err: any) {
            setError('Lỗi khi nộp bài: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    // ensure monitoring session ended on unmount
    useEffect(() => {
        return () => {
            try { examMonitor?.endSession(); } catch (e) {}
        };
    }, []);

    const handleTimeExpired = () => {
        setTimeExpired(true);
        alert('Hết giờ! Bài làm của bạn sẽ được tự động nộp.');
        handleSubmit();
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>⏳ Đang tải quiz...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>{error}</div>
                <div style={{ textAlign: 'center' }}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}>← Quay lại</button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>✅ Bài thi đã được nộp. Chuyển hướng tới trang kết quả...</div>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button onClick={() => navigate(`/quiz/${quizId}/result/${user.id}`)} style={styles.submitBtn}>Xem kết quả</button>
                </div>
            </div>
        );
    }

    const answeredCount = answers.filter(a => a !== -1).length;
    const progressPercent = (answeredCount / quiz.questions.length) * 100;

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>{quiz.title}</h1>
                    <p style={styles.classInfo}>📚 {quiz.className}</p>
                    {quiz.description && (
                        <p style={styles.description}>{quiz.description}</p>
                    )}
                </div>
                
                {quiz.timeLimit > 0 && !timeExpired && (
                    <div style={styles.timer}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#856404' }}>
                            ⏰ Thời gian còn lại
                        </div>
                        <CountdownTimer
                            dueDate={new Date(startTime.getTime() + quiz.timeLimit * 60000).toISOString()}
                            assignmentTitle="Quiz"
                            status="pending"
                        />
                    </div>
                )}
            </div>

            {readOnly && existingAttempt && (
                <div style={{ maxWidth: '800px', margin: '12px auto', padding: 12 }}>
                    <div style={{ padding: 12, backgroundColor: '#eef7ff', border: '1px solid #cfe8ff', borderRadius: 8 }}>
                        <strong>Bạn đã làm quiz này rồi.</strong>
                        <div style={{ marginTop: 6 }}>
                            Điểm: {existingAttempt.score ?? '-'} • Thời gian: {existingAttempt.timeSpent ?? '-'} phút
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <button onClick={() => navigate(`/quiz/${quizId}/result/${existingAttempt.studentId}`)} style={{ ...styles.submitBtn, padding: '8px 16px' }}>Xem kết quả</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
                </div>
                <p style={styles.progressText}>
                    Đã trả lời: {answeredCount}/{quiz.questions.length} câu
                </p>
            </div>

            {/* Questions */}
            <div style={styles.questionsContainer}>
                {quiz.questions.map((question, qIndex) => (
                    <div key={question.id} style={styles.questionCard}>
                        <div style={styles.questionHeader}>
                            <span style={styles.questionNumber}>Câu {qIndex + 1}</span>
                            {answers[qIndex] !== -1 && (
                                <span style={styles.answeredBadge}>✓ Đã trả lời</span>
                            )}
                        </div>
                        
                        <p style={styles.questionText}>{question.question}</p>
                        
                        <div style={styles.optionsContainer}>
                            {question.options.map((option, oIndex) => (
                                <label
                                    key={oIndex}
                                    style={{
                                        ...styles.optionLabel,
                                        ...(answers[qIndex] === oIndex ? styles.optionSelected : {})
                                    }}
                                >
                                        <input
                                            type="radio"
                                            name={`question-${qIndex}`}
                                            checked={answers[qIndex] === oIndex}
                                            onChange={() => handleAnswerChange(qIndex, oIndex)}
                                            style={styles.optionRadio}
                                            disabled={readOnly}
                                        />
                                    <span style={styles.optionLetter}>
                                        {String.fromCharCode(65 + oIndex)}
                                    </span>
                                    <span style={styles.optionText}>{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Submit Button */}
            <div style={styles.submitContainer}>
                <button
                    onClick={() => navigate(-1)}
                    style={styles.cancelBtn}
                    disabled={submitting || timeExpired || inExam}
                >
                    ← Hủy
                </button>
                {!readOnly && (
                    <button
                        onClick={handleSubmit}
                        style={styles.submitBtn}
                        disabled={submitting || timeExpired}
                    >
                        {submitting ? '⏳ Đang nộp bài...' : '✅ Nộp bài'}
                    </button>
                )}
                {readOnly && existingAttempt && (
                    <button
                        onClick={() => navigate(`/quiz/${quizId}/result/${existingAttempt.studentId}`)}
                        style={styles.submitBtn}
                    >
                        Xem kết quả của bạn
                    </button>
                )}
            </div>

            {/* Warning */}
            {answeredCount < quiz.questions.length && (
                <div style={styles.warning}>
                    ⚠️ Bạn còn {quiz.questions.length - answeredCount} câu chưa trả lời
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
    },
    loading: {
        textAlign: 'center',
        fontSize: '20px',
        padding: '40px',
        color: '#666',
    },
    error: {
        backgroundColor: '#fee',
        color: '#c33',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #fcc',
        textAlign: 'center',
    },
    backBtn: {
        backgroundColor: '#757575',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    header: {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        margin: '0 0 8px 0',
        color: '#1976d2',
        fontSize: '28px',
    },
    classInfo: {
        margin: '0 0 8px 0',
        color: '#666',
        fontSize: '14px',
    },
    description: {
        margin: '8px 0 0 0',
        color: '#555',
        fontSize: '14px',
    },
    timer: {
        backgroundColor: '#fff3cd',
        padding: '12px 20px',
        borderRadius: '8px',
        border: '1px solid #ffc107',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#856404',
    },
    progressContainer: {
        backgroundColor: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    progressBar: {
        width: '100%',
        height: '12px',
        backgroundColor: '#e0e0e0',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '8px',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        transition: 'width 0.3s ease',
    },
    progressText: {
        margin: 0,
        textAlign: 'center',
        color: '#666',
        fontSize: '14px',
    },
    questionsContainer: {
        marginBottom: '20px',
    },
    questionCard: {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    questionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    questionNumber: {
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    answeredBadge: {
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
    },
    questionText: {
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#333',
        marginBottom: '20px',
        fontWeight: '500',
    },
    optionsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    optionLabel: {
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        border: '2px solid #e0e0e0',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: '#fafafa',
    },
    optionSelected: {
        borderColor: '#1976d2',
        backgroundColor: '#e3f2fd',
    },
    optionRadio: {
        marginRight: '12px',
        width: '20px',
        height: '20px',
        cursor: 'pointer',
    },
    optionLetter: {
        fontWeight: 'bold',
        color: '#1976d2',
        marginRight: '12px',
        minWidth: '20px',
    },
    optionText: {
        flex: 1,
        color: '#333',
        fontSize: '15px',
    },
    submitContainer: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '16px',
        justifyContent: 'flex-end',
        position: 'sticky',
        bottom: '20px',
    },
    cancelBtn: {
        backgroundColor: '#757575',
        color: 'white',
        border: 'none',
        padding: '12px 32px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
    },
    submitBtn: {
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '12px 48px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
    },
    warning: {
        backgroundColor: '#fff3cd',
        color: '#856404',
        padding: '12px',
        borderRadius: '8px',
        marginTop: '16px',
        textAlign: 'center',
        border: '1px solid #ffc107',
    },
};

export default TakeQuiz;

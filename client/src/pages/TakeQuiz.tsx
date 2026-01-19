import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizForStudent, submitQuiz } from '../services/api';
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

    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [answers, setAnswers] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [startTime, setStartTime] = useState<Date>(new Date());
    const [timeExpired, setTimeExpired] = useState(false);

    useEffect(() => {
        loadQuiz();
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

    const loadQuiz = async () => {
        try {
            setLoading(true);
            const data = await getQuizForStudent(quizId!);
            
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
            setAnswers(new Array(questions.length).fill(-1)); // -1 means not answered
            setStartTime(new Date());
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

            const result = await submitQuiz(quizId!, {
                studentId: user.id,
                studentName: user.username,
                answers: answers,
                timeSpent: timeSpent
            });

            alert(`Nộp bài thành công! Điểm của bạn: ${result.score}/100`);
            navigate(`/quiz/${quizId}/result/${user.id}`);
        } catch (err: any) {
            setError('Lỗi khi nộp bài: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

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
                <button onClick={() => navigate(-1)} style={styles.backBtn}>
                    ← Quay lại
                </button>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>Không tìm thấy quiz</div>
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
                    disabled={submitting}
                >
                    ← Hủy
                </button>
                <button
                    onClick={handleSubmit}
                    style={styles.submitBtn}
                    disabled={submitting || timeExpired}
                >
                    {submitting ? '⏳ Đang nộp bài...' : '✅ Nộp bài'}
                </button>
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

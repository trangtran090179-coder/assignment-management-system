import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizResult, getQuizById } from '../services/api';

interface QuestionResult {
    questionId: number;
    question: string;
    options: string[];
    studentAnswer: number;
    correctAnswer?: number;
    isCorrect: boolean;
    explanation?: string;
}

interface ResultData {
    score: number;
    submittedAt: string;
    timeSpent: number;
    results?: QuestionResult[];
}

interface QuizResultProps {
    user: any;
}

const QuizResult: React.FC<QuizResultProps> = ({ user }) => {
    const { quizId, studentId } = useParams();
    const navigate = useNavigate();

    const [result, setResult] = useState<ResultData | null>(null);
    const [quizTitle, setQuizTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadResult();
    }, [quizId, studentId]);

    const loadResult = async () => {
        try {
            setLoading(true);
            const resultData = await getQuizResult(quizId!, studentId!);
            setResult(resultData);

            // Load quiz info for title
            try {
                const quiz = await getQuizById(quizId!);
                setQuizTitle(quiz.title);
            } catch (err) {
                console.log('Could not load quiz info');
            }
        } catch (err: any) {
            setError('Không thể tải kết quả: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>⏳ Đang tải kết quả...</div>
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

    if (!result) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>Không tìm thấy kết quả</div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#4CAF50';
        if (score >= 50) return '#FF9800';
        return '#f44336';
    };

    const getScoreEmoji = (score: number) => {
        if (score >= 90) return '🏆';
        if (score >= 80) return '🎉';
        if (score >= 70) return '😊';
        if (score >= 50) return '😐';
        return '😢';
    };

    const correctCount = result.results?.filter(r => r.isCorrect).length || 0;
    const totalQuestions = result.results?.length || 0;

    return (
        <div style={styles.container}>
            {/* Score Card */}
            <div style={styles.scoreCard}>
                <div style={styles.scoreHeader}>
                    <h1 style={styles.scoreTitle}>
                        {getScoreEmoji(result.score)} Kết quả bài làm
                    </h1>
                    {quizTitle && <p style={styles.quizTitle}>{quizTitle}</p>}
                </div>

                <div style={styles.scoreDisplay}>
                    <div style={{
                        ...styles.scoreCircle,
                        borderColor: getScoreColor(result.score)
                    }}>
                        <span style={{
                            ...styles.scoreNumber,
                            color: getScoreColor(result.score)
                        }}>
                            {result.score}
                        </span>
                        <span style={styles.scoreMax}>/100</span>
                    </div>
                </div>

                <div style={styles.statsGrid}>
                    <div style={styles.statItem}>
                        <span style={styles.statLabel}>Số câu đúng</span>
                        <span style={styles.statValue}>{correctCount}/{totalQuestions}</span>
                    </div>
                    <div style={styles.statItem}>
                        <span style={styles.statLabel}>Thời gian làm bài</span>
                        <span style={styles.statValue}>{result.timeSpent} phút</span>
                    </div>
                    <div style={styles.statItem}>
                        <span style={styles.statLabel}>Thời gian nộp</span>
                        <span style={styles.statValue}>{formatDate(result.submittedAt)}</span>
                    </div>
                </div>
            </div>

            {/* Detailed Results */}
            {result.results && result.results.length > 0 && (
                <div style={styles.resultsSection}>
                    <h2 style={styles.sectionTitle}>📋 Chi tiết đáp án</h2>
                    
                    {result.results.map((item, index) => (
                        <div
                            key={item.questionId}
                            style={{
                                ...styles.resultCard,
                                borderLeftColor: item.isCorrect ? '#4CAF50' : '#f44336'
                            }}
                        >
                            <div style={styles.resultHeader}>
                                <span style={styles.questionNum}>Câu {index + 1}</span>
                                <span style={item.isCorrect ? styles.correctBadge : styles.incorrectBadge}>
                                    {item.isCorrect ? '✓ Đúng' : '✗ Sai'}
                                </span>
                            </div>

                            <p style={styles.questionText}>{item.question}</p>

                            <div style={styles.optionsContainer}>
                                {item.options.map((option, oIndex) => {
                                    const isStudentAnswer = oIndex === item.studentAnswer;
                                    const isCorrectAnswer = oIndex === item.correctAnswer;

                                    let optionStyle = styles.optionItem;
                                    if (isCorrectAnswer) {
                                        optionStyle = { ...optionStyle, ...styles.correctOption };
                                    } else if (isStudentAnswer && !item.isCorrect) {
                                        optionStyle = { ...optionStyle, ...styles.incorrectOption };
                                    }

                                    return (
                                        <div key={oIndex} style={optionStyle}>
                                            <span style={styles.optionLetter}>
                                                {String.fromCharCode(65 + oIndex)}.
                                            </span>
                                            <span style={styles.optionText}>{option}</span>
                                            {isStudentAnswer && (
                                                <span style={styles.yourAnswerLabel}>
                                                    (Bạn chọn)
                                                </span>
                                            )}
                                            {isCorrectAnswer && (
                                                <span style={styles.correctAnswerLabel}>
                                                    ✓ Đáp án đúng
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {item.explanation && (
                                <div style={styles.explanation}>
                                    <strong>💡 Giải thích:</strong> {item.explanation}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!result.results && (
                <div style={styles.noDetailsCard}>
                    <p>Giáo viên chưa cho phép xem đáp án chi tiết</p>
                </div>
            )}

            {/* Action Buttons */}
            <div style={styles.actionButtons}>
                <button onClick={() => navigate(-1)} style={styles.backButton}>
                    ← Quay lại
                </button>
                <button onClick={() => window.print()} style={styles.printButton}>
                    🖨️ In kết quả
                </button>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '900px',
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
    scoreCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center',
    },
    scoreHeader: {
        marginBottom: '24px',
    },
    scoreTitle: {
        margin: '0 0 8px 0',
        fontSize: '28px',
        color: '#333',
    },
    quizTitle: {
        margin: 0,
        fontSize: '16px',
        color: '#666',
    },
    scoreDisplay: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '32px',
    },
    scoreCircle: {
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        border: '8px solid',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
    },
    scoreNumber: {
        fontSize: '48px',
        fontWeight: 'bold',
        lineHeight: '1',
    },
    scoreMax: {
        fontSize: '24px',
        color: '#999',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: '1px solid #e0e0e0',
    },
    statItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    statLabel: {
        fontSize: '14px',
        color: '#666',
    },
    statValue: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#333',
    },
    resultsSection: {
        marginBottom: '24px',
    },
    sectionTitle: {
        fontSize: '24px',
        marginBottom: '16px',
        color: '#333',
    },
    resultCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderLeft: '4px solid',
    },
    resultHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    questionNum: {
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#1976d2',
    },
    correctBadge: {
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: 'bold',
    },
    incorrectBadge: {
        backgroundColor: '#f44336',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: 'bold',
    },
    questionText: {
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#333',
        marginBottom: '16px',
        fontWeight: '500',
    },
    optionsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '16px',
    },
    optionItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: '#f5f5f5',
        border: '2px solid transparent',
    },
    correctOption: {
        backgroundColor: '#e8f5e9',
        borderColor: '#4CAF50',
    },
    incorrectOption: {
        backgroundColor: '#ffebee',
        borderColor: '#f44336',
    },
    optionLetter: {
        fontWeight: 'bold',
        marginRight: '12px',
        minWidth: '24px',
        color: '#1976d2',
    },
    optionText: {
        flex: 1,
        color: '#333',
    },
    yourAnswerLabel: {
        fontSize: '12px',
        color: '#666',
        fontStyle: 'italic',
        marginLeft: '8px',
    },
    correctAnswerLabel: {
        fontSize: '12px',
        color: '#4CAF50',
        fontWeight: 'bold',
        marginLeft: '8px',
    },
    explanation: {
        backgroundColor: '#e3f2fd',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#0d47a1',
        lineHeight: '1.5',
    },
    noDetailsCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        color: '#666',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    actionButtons: {
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        marginTop: '32px',
    },
    backButton: {
        backgroundColor: '#757575',
        color: 'white',
        border: 'none',
        padding: '12px 32px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
    },
    printButton: {
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        padding: '12px 32px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
    },
};

export default QuizResult;

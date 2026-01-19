import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createQuiz, updateQuiz, getQuizById } from '../services/api';

interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

interface CreateQuizProps {
    classId?: number;
    className?: string;
    teacherId: number;
    onSuccess?: () => void;
}

const CreateQuiz: React.FC<CreateQuizProps> = ({ classId, className, teacherId, onSuccess }) => {
    const navigate = useNavigate();
    const { quizId } = useParams();
    const isEditMode = Boolean(quizId);

    const [quizData, setQuizData] = useState({
        title: '',
        description: '',
        dueDate: '',
        timeLimit: 0,
        showAnswers: true,
        shuffleQuestions: false,
        shuffleOptions: false,
    });

    const [questions, setQuestions] = useState<Question[]>([
        {
            id: 1,
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            explanation: ''
        }
    ]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditMode && quizId) {
            loadQuiz();
        }
    }, [quizId]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            const quiz = await getQuizById(quizId!);
            setQuizData({
                title: quiz.title,
                description: quiz.description,
                dueDate: quiz.dueDate,
                timeLimit: quiz.timeLimit,
                showAnswers: quiz.showAnswers,
                shuffleQuestions: quiz.shuffleQuestions,
                shuffleOptions: quiz.shuffleOptions,
            });
            setQuestions(quiz.questions);
        } catch (err: any) {
            setError('Không thể tải quiz: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = () => {
        const newQuestion: Question = {
            id: questions.length + 1,
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            explanation: ''
        };
        setQuestions([...questions, newQuestion]);
    };

    const handleRemoveQuestion = (index: number) => {
        if (questions.length > 1) {
            const updatedQuestions = questions.filter((_, i) => i !== index);
            // Re-number questions
            updatedQuestions.forEach((q, i) => q.id = i + 1);
            setQuestions(updatedQuestions);
        }
    };

    const handleQuestionChange = (index: number, field: string, value: any) => {
        const updatedQuestions = [...questions];
        if (field === 'question' || field === 'explanation' || field === 'correctAnswer') {
            (updatedQuestions[index] as any)[field] = value;
        }
        setQuestions(updatedQuestions);
    };

    const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].options[optionIndex] = value;
        setQuestions(updatedQuestions);
    };

    const handleAddOption = (questionIndex: number) => {
        const updatedQuestions = [...questions];
        if (updatedQuestions[questionIndex].options.length < 6) {
            updatedQuestions[questionIndex].options.push('');
            setQuestions(updatedQuestions);
        }
    };

    const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
        const updatedQuestions = [...questions];
        if (updatedQuestions[questionIndex].options.length > 2) {
            updatedQuestions[questionIndex].options.splice(optionIndex, 1);
            // Adjust correct answer if needed
            if (updatedQuestions[questionIndex].correctAnswer >= updatedQuestions[questionIndex].options.length) {
                updatedQuestions[questionIndex].correctAnswer = 0;
            }
            setQuestions(updatedQuestions);
        }
    };

    const validateForm = () => {
        if (!quizData.title.trim()) {
            setError('Vui lòng nhập tiêu đề quiz');
            return false;
        }

        if (!quizData.dueDate) {
            setError('Vui lòng chọn hạn nộp');
            return false;
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question.trim()) {
                setError(`Câu hỏi ${i + 1}: Vui lòng nhập nội dung câu hỏi`);
                return false;
            }

            const validOptions = q.options.filter(opt => opt.trim() !== '');
            if (validOptions.length < 2) {
                setError(`Câu hỏi ${i + 1}: Phải có ít nhất 2 đáp án`);
                return false;
            }

            if (q.correctAnswer >= q.options.length || !q.options[q.correctAnswer].trim()) {
                setError(`Câu hỏi ${i + 1}: Đáp án đúng không hợp lệ`);
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const payload = {
                classId: classId,
                className: className,
                teacherId: teacherId,
                title: quizData.title,
                description: quizData.description,
                questions: questions,
                dueDate: quizData.dueDate,
                timeLimit: quizData.timeLimit,
                showAnswers: quizData.showAnswers,
                shuffleQuestions: quizData.shuffleQuestions,
                shuffleOptions: quizData.shuffleOptions,
            };

            if (isEditMode && quizId) {
                await updateQuiz(quizId, payload);
                alert('Cập nhật quiz thành công!');
            } else {
                await createQuiz(payload);
                alert('Tạo quiz thành công!');
            }

            if (onSuccess) {
                onSuccess();
            } else {
                navigate(-1);
            }
        } catch (err: any) {
            setError('Lỗi: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>{isEditMode ? '✏️ Chỉnh sửa Quiz' : '📝 Tạo Quiz Trắc Nghiệm Mới'}</h2>
                {className && <p style={styles.className}>Lớp: {className}</p>}
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
                {/* Quiz Info */}
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>📋 Thông tin Quiz</h3>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Tiêu đề *</label>
                        <input
                            type="text"
                            value={quizData.title}
                            onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                            style={styles.input}
                            placeholder="VD: Kiểm tra giữa kỳ Toán học"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Mô tả</label>
                        <textarea
                            value={quizData.description}
                            onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                            style={{ ...styles.input, ...styles.textarea }}
                            placeholder="Mô tả nội dung quiz..."
                            rows={3}
                        />
                    </div>

                    <div style={styles.row}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Hạn nộp *</label>
                            <input
                                type="datetime-local"
                                value={quizData.dueDate}
                                onChange={(e) => setQuizData({ ...quizData, dueDate: e.target.value })}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Thời gian làm bài (phút)</label>
                            <input
                                type="number"
                                value={quizData.timeLimit}
                                onChange={(e) => setQuizData({ ...quizData, timeLimit: parseInt(e.target.value) || 0 })}
                                style={styles.input}
                                placeholder="0 = Không giới hạn"
                                min="0"
                            />
                        </div>
                    </div>

                    <div style={styles.checkboxGroup}>
                        <label style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={quizData.showAnswers}
                                onChange={(e) => setQuizData({ ...quizData, showAnswers: e.target.checked })}
                                style={styles.checkbox}
                            />
                            Hiển thị đáp án sau khi nộp bài
                        </label>

                        <label style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={quizData.shuffleQuestions}
                                onChange={(e) => setQuizData({ ...quizData, shuffleQuestions: e.target.checked })}
                                style={styles.checkbox}
                            />
                            Xáo trộn thứ tự câu hỏi
                        </label>

                        <label style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={quizData.shuffleOptions}
                                onChange={(e) => setQuizData({ ...quizData, shuffleOptions: e.target.checked })}
                                style={styles.checkbox}
                            />
                            Xáo trộn thứ tự đáp án
                        </label>
                    </div>
                </div>

                {/* Questions */}
                <div style={styles.section}>
                    <div style={styles.questionHeader}>
                        <h3 style={styles.sectionTitle}>❓ Câu hỏi ({questions.length})</h3>
                        <button
                            type="button"
                            onClick={handleAddQuestion}
                            style={styles.addQuestionBtn}
                        >
                            ➕ Thêm câu hỏi
                        </button>
                    </div>

                    {questions.map((question, qIndex) => (
                        <div key={question.id} style={styles.questionCard}>
                            <div style={styles.questionCardHeader}>
                                <span style={styles.questionNumber}>Câu {qIndex + 1}</span>
                                {questions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuestion(qIndex)}
                                        style={styles.removeBtn}
                                    >
                                        🗑️ Xóa
                                    </button>
                                )}
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Nội dung câu hỏi *</label>
                                <textarea
                                    value={question.question}
                                    onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                                    style={{ ...styles.input, ...styles.textarea }}
                                    placeholder="Nhập nội dung câu hỏi..."
                                    rows={2}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Các đáp án * (Chọn đáp án đúng)</label>
                                {question.options.map((option, oIndex) => (
                                    <div key={oIndex} style={styles.optionRow}>
                                        <input
                                            type="radio"
                                            name={`correct-${qIndex}`}
                                            checked={question.correctAnswer === oIndex}
                                            onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                                            style={styles.radio}
                                        />
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            style={styles.optionInput}
                                            placeholder={`Đáp án ${String.fromCharCode(65 + oIndex)}`}
                                        />
                                        {question.options.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOption(qIndex, oIndex)}
                                                style={styles.removeOptionBtn}
                                                title="Xóa đáp án"
                                            >
                                                ❌
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {question.options.length < 6 && (
                                    <button
                                        type="button"
                                        onClick={() => handleAddOption(qIndex)}
                                        style={styles.addOptionBtn}
                                    >
                                        ➕ Thêm đáp án
                                    </button>
                                )}
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Giải thích (tùy chọn)</label>
                                <textarea
                                    value={question.explanation || ''}
                                    onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                                    style={{ ...styles.input, ...styles.textarea }}
                                    placeholder="Giải thích đáp án đúng..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Buttons */}
                <div style={styles.buttonGroup}>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        style={styles.cancelBtn}
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        style={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? '⏳ Đang xử lý...' : (isEditMode ? '💾 Cập nhật Quiz' : '✅ Tạo Quiz')}
                    </button>
                </div>
            </form>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
    },
    header: {
        marginBottom: '30px',
        textAlign: 'center',
    },
    className: {
        color: '#666',
        fontSize: '16px',
        marginTop: '8px',
    },
    error: {
        backgroundColor: '#fee',
        color: '#c33',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #fcc',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    section: {
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    sectionTitle: {
        marginTop: 0,
        marginBottom: '20px',
        color: '#333',
        fontSize: '20px',
    },
    formGroup: {
        marginBottom: '16px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '500',
        color: '#555',
    },
    input: {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px',
        boxSizing: 'border-box',
    },
    textarea: {
        resize: 'vertical' as const,
        fontFamily: 'inherit',
    },
    row: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
    },
    checkboxGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '16px',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
    },
    checkbox: {
        width: '18px',
        height: '18px',
        cursor: 'pointer',
    },
    questionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    addQuestionBtn: {
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
    },
    questionCard: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '16px',
        border: '1px solid #e0e0e0',
    },
    questionCardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    questionNumber: {
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#1976d2',
    },
    removeBtn: {
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
    },
    optionRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '8px',
    },
    radio: {
        width: '20px',
        height: '20px',
        cursor: 'pointer',
    },
    optionInput: {
        flex: 1,
        padding: '8px 12px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px',
    },
    removeOptionBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        padding: '4px',
    },
    addOptionBtn: {
        backgroundColor: 'transparent',
        color: '#1976d2',
        border: '1px dashed #1976d2',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        marginTop: '8px',
    },
    buttonGroup: {
        display: 'flex',
        gap: '16px',
        justifyContent: 'flex-end',
        marginTop: '24px',
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
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        padding: '12px 32px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
    },
};

export default CreateQuiz;

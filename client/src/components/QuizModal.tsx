import React, { useState } from 'react';
import { createQuiz } from '../services/api';

interface QuizModalProps {
    classId: number;
    className: string;
    teacherId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ classId, className, teacherId, onClose, onSuccess }) => {
    const [quizData, setQuizData] = useState({
        title: '',
        description: '',
        dueDate: '',
        timeLimit: 0,
        showAnswers: true,
    });

    const [questions, setQuestions] = useState([
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

    const handleAddQuestion = () => {
        setQuestions([...questions, {
            id: questions.length + 1,
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            explanation: ''
        }]);
    };

    const handleRemoveQuestion = (index: number) => {
        if (questions.length > 1) {
            const updated = questions.filter((_, i) => i !== index);
            updated.forEach((q, i) => q.id = i + 1);
            setQuestions(updated);
        }
    };

    const handleQuestionChange = (index: number, field: string, value: any) => {
        const updated = [...questions];
        (updated[index] as any)[field] = value;
        setQuestions(updated);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const updated = [...questions];
        updated[qIndex].options[oIndex] = value;
        setQuestions(updated);
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
                setError(`Câu ${i + 1}: Vui lòng nhập nội dung`);
                return false;
            }
            const validOpts = q.options.filter(o => o.trim());
            if (validOpts.length < 2) {
                setError(`Câu ${i + 1}: Cần ít nhất 2 đáp án`);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);
        try {
            await createQuiz({
                classId,
                className,
                teacherId,
                ...quizData,
                questions
            });
            alert('✅ Tạo quiz thành công!');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError('Lỗi: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflow: 'auto' }}>
                <h2>Tạo Quiz Trắc Nghiệm</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>Lớp: {className}</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tiêu đề *</label>
                        <input
                            type="text"
                            value={quizData.title}
                            onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                            placeholder="VD: Kiểm tra giữa kỳ"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                            value={quizData.description}
                            onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                            placeholder="Mô tả quiz..."
                            rows={2}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label>Hạn nộp *</label>
                            <input
                                type="datetime-local"
                                value={quizData.dueDate}
                                onChange={(e) => setQuizData({ ...quizData, dueDate: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Thời gian (phút)</label>
                            <input
                                type="number"
                                value={quizData.timeLimit}
                                onChange={(e) => setQuizData({ ...quizData, timeLimit: parseInt(e.target.value) || 0 })}
                                placeholder="0 = Không giới hạn"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={quizData.showAnswers}
                                onChange={(e) => setQuizData({ ...quizData, showAnswers: e.target.checked })}
                            />
                            {' '}Hiển thị đáp án sau khi nộp
                        </label>
                    </div>

                    <hr />

                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, flex: 1 }}>Câu hỏi ({questions.length})</h3>
                        <button 
                            type="button" 
                            className="btn btn-sm btn-success" 
                            style={{ marginLeft: '12px', borderRadius: '8px', minWidth: '70px', height: '32px', fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                            onClick={handleAddQuestion}
                        >
                            Thêm
                        </button>
                    </div>

                    {questions.map((q, qIdx) => (
                        <div key={q.id} className="quiz-question-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <strong>Câu {qIdx + 1}</strong>
                                {questions.length > 1 && (
                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveQuestion(qIdx)}>
                                        Xóa
                                    </button>
                                )}
                            </div>

                            <div className="form-group">
                                <textarea
                                    value={q.question}
                                    onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                                    placeholder="Nhập câu hỏi..."
                                    rows={2}
                                    required
                                />
                            </div>

                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                                Đáp án (chọn đúng):
                            </label>
                            {q.options.map((opt, oIdx) => (
                                <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <input
                                        type="radio"
                                        name={`q${qIdx}`}
                                        checked={q.correctAnswer === oIdx}
                                        onChange={() => handleQuestionChange(qIdx, 'correctAnswer', oIdx)}
                                    />
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                        placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? '⏳ Đang tạo...' : '✅ Tạo Quiz'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuizModal;

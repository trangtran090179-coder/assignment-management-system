import React, { useState, useRef } from 'react';
import { createQuiz } from '../services/api';

interface Question {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

interface ImportQuizModalProps {
    classId: number;
    className: string;
    teacherId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const ImportQuizModal: React.FC<ImportQuizModalProps> = ({ classId, className, teacherId, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
    const [rawPreview, setRawPreview] = useState('');
    const [step, setStep] = useState<'upload' | 'preview' | 'create'>('upload');
    const hiddenFileInput = useRef<HTMLInputElement | null>(null);
    
    const [quizData, setQuizData] = useState({
        title: '',
        description: '',
        dueDate: '',
        timeLimit: 0,
        showAnswers: true,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            
            // Validate file type
            const ext = selectedFile.name.toLowerCase();
            if (!ext.endsWith('.doc') && !ext.endsWith('.docx')) {
                setError('Chỉ chấp nhận file Word (.doc, .docx)');
                return;
            }

            // Validate file size (max 10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File quá lớn! Kích thước tối đa 10MB');
                return;
            }

            setFile(selectedFile);
            setError('');
        }
    };

    const handleUploadAndParse = async () => {
        if (!file) {
            setError('Vui lòng chọn file');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Lấy token từ localStorage (hoặc context nếu dùng context)
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5000/api/quiz-import/parse-word', {
                method: 'POST',
                body: formData,
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });

            const data = await response.json();
            console.log('Parsed response:', data);

            if (!response.ok) {
                // If server returns rawText for debugging, show it in the modal
                setError(data.message || 'Lỗi khi parse file Word');
                if (data.rawText) setRawPreview(data.rawText);
                return;
            }

            if (data.questions && data.questions.length > 0) {
                setParsedQuestions(data.questions);
                setRawPreview('');
                setStep('preview');
            } else {
                setError('Không tìm thấy câu hỏi trong file');
                if (data.rawText) setRawPreview(data.rawText);
            }

        } catch (err: any) {
            console.error('Parse error:', err);
            setError(err.message || 'Lỗi khi parse file Word');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuiz = async () => {
        if (!quizData.title.trim()) {
            setError('Vui lòng nhập tiêu đề quiz');
            return;
        }

        if (!quizData.dueDate) {
            setError('Vui lòng chọn hạn nộp');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Map parsed questions to quiz format with proper IDs
            const questions = parsedQuestions.map((q, index) => ({
                id: index + 1,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || ''
            }));

            await createQuiz({
                classId,
                className,
                teacherId,
                ...quizData,
                questions
            });

            alert(`✅ Tạo quiz thành công với ${questions.length} câu hỏi!`);
            onSuccess();
            onClose();

        } catch (err: any) {
            setError('Lỗi: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        window.open('http://localhost:5000/api/quiz-import/template', '_blank');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '1.6rem' }}>
                <h3>Import Quiz từ Word</h3>
                <p style={{ color: '#cbd5e0', marginBottom: '12px', textAlign: 'center' }}>Lớp: <strong style={{ color: '#fff' }}>{className}</strong></p>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Step 1: Upload */}
                {step === 'upload' && (
                    <>
                        <div className="form-group">
                            <label>Tiêu đề Quiz (tùy chọn)</label>
                            <input type="text" value={quizData.title} onChange={(e) => setQuizData({ ...quizData, title: e.target.value })} placeholder="VD: Kiểm tra giữa kỳ" />
                        </div>
                        {rawPreview && (
                            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                                <strong style={{ display: 'block', marginBottom: '6px' }}>Raw extracted text (preview):</strong>
                                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', color: '#cbd5e0' }}>{rawPreview}</pre>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Mô tả (tùy chọn)</label>
                            <textarea value={quizData.description} onChange={(e) => setQuizData({ ...quizData, description: e.target.value })} rows={3} placeholder="Mô tả quiz..." />
                        </div>

                        <div className="form-group">
                            <label>Chọn file Word (.doc, .docx)</label>
                            <div className="file-input-wrapper">
                                    <label className="file-input-label" onClick={(e) => {
                                        e.preventDefault();
                                        if (hiddenFileInput.current) hiddenFileInput.current.click();
                                    }}>Chọn tệp</label>
                                </div>
                                {file && (
                                    <div className="file-input-name-block">{file.name}</div>
                                )}
                                <input ref={hiddenFileInput} id="import-file-input" style={{ position: 'absolute', left: '-9999px' }} type="file" accept=".doc,.docx" onChange={handleFileChange} />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Hủy</button>
                            <button type="button" className="btn btn-primary" onClick={handleUploadAndParse} disabled={!file || loading}>{loading ? 'Đang xử lý...' : 'Parse File'}</button>
                        </div>
                    </>
                )}

                {/* Step 2: Preview */}
                {step === 'preview' && (
                    <>
                        <div style={{ backgroundColor: 'rgba(40,60,40,0.6)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                            Parse thành công {parsedQuestions.length} câu hỏi
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                            {parsedQuestions.map((q, idx) => (
                                <div key={idx} className="quiz-question-card">
                                    <div style={{ fontWeight: '700', marginBottom: '8px' }}>Câu {idx + 1}: {q.question}</div>
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} style={{ marginLeft: '8px', padding: '6px 10px', borderRadius: '6px', background: oIdx === q.correctAnswer ? 'rgba(72,187,120,0.12)' : 'transparent' }}>
                                            {String.fromCharCode(65 + oIdx)}. {opt}
                                        </div>
                                    ))}
                                    {q.explanation && <div style={{ marginTop: '8px', color: '#cbd5e0', fontStyle: 'italic' }}>{q.explanation}</div>}
                                </div>
                            ))}
                        </div>

                        <h3 style={{ marginBottom: '12px' }}>Thông tin Quiz</h3>

                        <div className="form-group">
                            <label>Tiêu đề *</label>
                            <input type="text" value={quizData.title} onChange={(e) => setQuizData({ ...quizData, title: e.target.value })} placeholder="VD: Kiểm tra giữa kỳ" required />
                        </div>

                        <div className="form-group">
                            <label>Hạn nộp *</label>
                            <input type="datetime-local" value={quizData.dueDate} onChange={(e) => setQuizData({ ...quizData, dueDate: e.target.value })} required />
                        </div>

                        <div className="form-group">
                            <label>Thời gian (phút)</label>
                            <input type="number" value={quizData.timeLimit} onChange={(e) => setQuizData({ ...quizData, timeLimit: parseInt(e.target.value) || 0 })} placeholder="0 = Không giới hạn" min="0" />
                        </div>

                        <div className="form-group">
                            <label>
                                <input type="checkbox" checked={quizData.showAnswers} onChange={(e) => setQuizData({ ...quizData, showAnswers: e.target.checked })} /> {' '}Hiển thị đáp án sau khi nộp
                            </label>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setStep('upload')} disabled={loading}>Quay lại</button>
                            <button type="button" className="btn btn-primary" onClick={handleCreateQuiz} disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo Quiz'}</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ImportQuizModal;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignmentById, getAssignmentSubmissions, createSubmission, gradeSubmission, getStudentSubmissions } from '../services/api';

interface AssignmentDetailProps {
    user: any;
}

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [studentSubmission, setStudentSubmission] = useState<any>(null);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedSubmissionForGrade, setSelectedSubmissionForGrade] = useState<any>(null);
    const [gradeData, setGradeData] = useState({ score: 0, feedback: '' });
    
    // States for image preview modal
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageZoom, setImageZoom] = useState(1);

    useEffect(() => {
        if (id) {
            loadAssignment();
        }
    }, [id]);

    const loadAssignment = async () => {
        try {
            setLoading(true);
            const data = await getAssignmentById(String(id));
            setAssignment(data);
            
            // Load submissions if user is teacher
            if (user.role === 'teacher') {
                const subs = await getAssignmentSubmissions(String(id));
                setSubmissions(subs);
            } else if (user.role === 'student') {
                // Load student's own submission
                const subs = await getStudentSubmissions(user.id, String(id));
                if (subs.length > 0) {
                    setStudentSubmission(subs[0]);
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải bài tập:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="assignment-detail"><p>Đang tải...</p></div>;
    }

    if (!assignment) {
        return <div className="assignment-detail"><p>Không tìm thấy bài tập!</p></div>;
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFile && id) {
            try {
                setLoading(true);
                const submissionData = {
                    assignmentId: Number(id),
                    studentId: user.id,
                    studentName: user.name
                };
                const result = await createSubmission(submissionData, selectedFile);
                alert('Nộp bài thành công!');
                setStudentSubmission(result);
                setSelectedFile(null);
                // Set localStorage to trigger dashboard reload
                localStorage.setItem('assignmentSubmitted_' + Date.now(), 'true');
                // Reload assignment to update status
                await loadAssignment();
                // Navigate back to dashboard after a short delay to show the updated submission
                setTimeout(() => {
                    navigate('/student/dashboard');
                }, 1000);
            } catch (error) {
                console.error('Lỗi khi nộp bài:', error);
                alert('Lỗi khi nộp bài, vui lòng thử lại!');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleGradeSubmit = async () => {
        if (!selectedSubmissionForGrade || !id) return;
        
        try {
            setLoading(true);
            await gradeSubmission(String(selectedSubmissionForGrade.id), gradeData);
            alert('✅ Chấm điểm thành công!');
            setShowGradeModal(false);
            setSelectedSubmissionForGrade(null);
            loadAssignment(); // Reload to get updated submissions
        } catch (error) {
            console.error('Lỗi khi chấm điểm:', error);
            alert('❌ Lỗi khi chấm điểm, vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    const isLate = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;

    return (
        <div className="assignment-detail">
            <div className="assignment-header">
                <h1>{assignment.title}</h1>
                <div className="assignment-due-info">
                    <span className={`due-badge ${isLate ? 'late' : ''}`}>
                        📅 Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')} {new Date(assignment.dueDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isLate && <span className="late-warning">⚠️ Đã quá hạn</span>}
                </div>
            </div>

            <div className="assignment-content">
                <div className="section">
                    <h2>Mô tả bài tập</h2>
                    <div className="description-box">
                        {assignment.description || 'Không có mô tả'}
                    </div>
                </div>

                {assignment.files && assignment.files.length > 0 && (
                    <div className="section">
                        <h2>Tài liệu đính kèm</h2>
                        <div className="file-list">
                            {assignment.files.map((file, index) => {
                                // Check if file is an image
                                const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file);
                                const fileName = file.split('/').pop() || file;
                                
                                return (
                                    <div key={index} className="file-item">
                                        {isImage ? (
                                            <div className="image-preview" style={{ cursor: 'pointer' }}>
                                                <img 
                                                    src={`http://localhost:5000${file}`} 
                                                    alt={`Assignment image ${index + 1}`}
                                                    style={{ 
                                                        maxWidth: '100%', 
                                                        maxHeight: '400px', 
                                                        borderRadius: '8px',
                                                        transition: 'transform 0.3s ease',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => {
                                                        setSelectedImage(`http://localhost:5000${file}`);
                                                        setImageZoom(1);
                                                        setShowImageModal(true);
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                />
                                            </div>
                                        ) : (
                                            <div className="file-item-info">
                                                <span>{fileName}</span>
                                                <a 
                                                    href={`http://localhost:5000${file}`}
                                                    download
                                                    className="btn-download"
                                                >
                                                    Tải xuống
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {user.role === 'student' && (
                    <div className="section">
                        <h2>Nộp bài làm</h2>
                        {studentSubmission ? (
                            studentSubmission.status === 'graded' ? (
                                <div className="graded-section">
                                    <div className="score-display">
                                        <h3>✅ Điểm: {studentSubmission.score}/10</h3>
                                    </div>
                                    {studentSubmission.feedback && (
                                        <div className="feedback-box">
                                            <h4>Nhận xét của giáo viên:</h4>
                                            <p>{studentSubmission.feedback}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="submitted-info">
                                    <p>✅ Bạn đã nộp bài tập này</p>
                                    <p>Nộp lúc: {new Date(studentSubmission.submissionDate).toLocaleDateString('vi-VN')} {new Date(studentSubmission.submissionDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p>Đang chờ giáo viên chấm điểm...</p>
                                </div>
                            )
                        ) : (
                            <form onSubmit={handleSubmit} className="submission-form">
                                <div
                                    className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        id="file-upload"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="file-upload" className="upload-label">
                                        {selectedFile ? (
                                            <>
                                                <div className="file-preview">
                                                    📄 {selectedFile.name}
                                                    <br />
                                                    <small>{(selectedFile.size / 1024).toFixed(2)} KB</small>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="upload-icon"></div>
                                                <p>Kéo thả file vào đây hoặc click để chọn</p>
                                                <small>Hỗ trợ: PDF, Word, Ảnh (JPG, PNG)</small>
                                            </>
                                        )}
                                    </label>
                                </div>
                                {selectedFile && (
                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-primary">
                                            Nộp bài
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => setSelectedFile(null)}
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                )}

                {user.role === 'teacher' && (
                    <>
                        <div className="section">
                            <h2>Danh sách nộp bài ({submissions.filter(s => s.status).length}/{submissions.length})</h2>
                            <div className="submission-list">
                                {submissions.length === 0 ? (
                                    <div className="empty-state-small">
                                        <p>Chưa có bài nộp nào</p>
                                    </div>
                                ) : (
                                    submissions.map((submission) => (
                                        <div key={submission.id} className="submission-item">
                                            <div className="student-info">
                                                <h4>{submission.studentName}</h4>
                                                <p>Nộp lúc: {new Date(submission.submissionDate).toLocaleDateString('vi-VN')} {new Date(submission.submissionDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                                {submission.status === 'graded' && (
                                                    <p style={{ color: '#38a169' }}>Điểm: {submission.score}/10</p>
                                                )}
                                            </div>
                                            <div className="submission-actions">
                                                {submission.file && (
                                                    <a 
                                                        href={`http://localhost:5000${submission.file}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-small btn-primary"
                                                    >
                                                        Xem bài
                                                    </a>
                                                )}
                                                {submission.status !== 'graded' && (
                                                    <button 
                                                        className="btn-small btn-secondary"
                                                        onClick={() => {
                                                            setSelectedSubmissionForGrade(submission);
                                                            setGradeData({ score: 0, feedback: '' });
                                                            setShowGradeModal(true);
                                                        }}
                                                    >
                                                        Chấm điểm
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {showGradeModal && (
                            <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
                                <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                                    <h3>Chấm điểm bài tập</h3>
                                    <p><strong>Học sinh:</strong> {selectedSubmissionForGrade?.studentName}</p>
                                    <form onSubmit={(e) => { e.preventDefault(); handleGradeSubmit(); }}>
                                        <div className="form-group">
                                            <label>Điểm (0-10)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="10"
                                                step="0.5"
                                                value={gradeData.score}
                                                onChange={(e) => setGradeData({ ...gradeData, score: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Nhận xét</label>
                                            <textarea
                                                value={gradeData.feedback}
                                                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                                                placeholder="Nhận xét của giáo viên..."
                                                rows={4}
                                                required
                                            />
                                        </div>
                                        <div className="modal-actions">
                                            <button type="submit" className="btn btn-primary">Lưu chấm điểm</button>
                                            <button type="button" className="btn btn-secondary" onClick={() => setShowGradeModal(false)}>
                                                Hủy
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Image Preview Modal with Zoom */}
                {showImageModal && selectedImage && (
                    <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
                        <div 
                            className="modal-card" 
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '90vw',
                                height: '90vh',
                                maxWidth: 'none',
                                maxHeight: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#0d0d0d'
                            }}
                        >
                            {/* Header with controls */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                borderBottom: '1px solid #333',
                                backgroundColor: '#0d0d0d'
                            }}>
                                <h3 style={{ margin: 0, color: '#fff' }}>Xem ảnh tài liệu</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    {/* Zoom out button */}
                                    <button 
                                        onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.1))}
                                        style={{
                                            padding: '0.5rem 0.8rem',
                                            backgroundColor: '#333',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                        title="Thu nhỏ"
                                    >
                                        🔍−
                                    </button>
                                    
                                    {/* Zoom level */}
                                    <span style={{
                                        color: '#fff',
                                        minWidth: '60px',
                                        textAlign: 'center',
                                        fontSize: '0.9rem'
                                    }}>
                                        {(imageZoom * 100).toFixed(0)}%
                                    </span>
                                    
                                    {/* Zoom in button */}
                                    <button 
                                        onClick={() => setImageZoom(Math.min(3, imageZoom + 0.1))}
                                        style={{
                                            padding: '0.5rem 0.8rem',
                                            backgroundColor: '#333',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                        title="Phóng to"
                                    >
                                        🔍+
                                    </button>

                                    {/* Close button */}
                                    <button 
                                        onClick={() => setShowImageModal(false)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#e74c3c',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            marginLeft: '0.5rem'
                                        }}
                                    >
                                        ✕ Đóng
                                    </button>
                                </div>
                            </div>

                            {/* Image content */}
                            <div style={{
                                flex: 1,
                                overflow: 'auto',
                                padding: '1rem',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                backgroundColor: '#1a1a1a'
                            }}>
                                <img 
                                    src={selectedImage}
                                    alt="Enlarged assignment image"
                                    style={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        transform: `scale(${imageZoom})`,
                                        transformOrigin: 'top center',
                                        transition: 'transform 0.2s ease',
                                        borderRadius: '4px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentDetail;

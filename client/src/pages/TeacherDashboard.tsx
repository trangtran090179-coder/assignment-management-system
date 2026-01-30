import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClass, getClasses, deleteClass, createAssignment, getAssignmentSubmissions, gradeSubmission, deleteAssignment, getClassAssignments, getClassQuizzes, deleteQuiz, getQuizAttempts } from '../services/api';
import QuizModal from '../components/QuizModal';
import ImportQuizModal from '../components/ImportQuizModal';

interface TeacherDashboardProps {
    user: any;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
    const navigate = useNavigate();
    
    // Helper function để format date đúng cách
    const formatDate = (dateString: string) => {
        if (!dateString) return 'Chưa cập nhật';
        try {
            let dateObj: Date;
            
            // Try parsing as ISO format first
            if (dateString.includes('T')) {
                // ISO format like "2026-01-06T12:00:00"
                const parts = dateString.split('T');
                const [year, month, day] = parts[0].split('-').map(Number);
                dateObj = new Date(year, month - 1, day);
            } else {
                // Already formatted
                dateObj = new Date(dateString);
            }
            
            if (isNaN(dateObj.getTime())) return 'Chưa cập nhật';
            
            const d = dateObj.getDate();
            const m = dateObj.getMonth() + 1;
            const y = dateObj.getFullYear();
            return `${d}/${m}/${y}`;
        } catch (e) {
            return 'Chưa cập nhật';
        }
    };
    const [classes, setClasses] = useState([]);
    const [showCreateClass, setShowCreateClass] = useState(false);
    const [showCreateAssignment, setShowCreateAssignment] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        dueDate: ''
    });
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [currentAssignmentForSubmissions, setCurrentAssignmentForSubmissions] = useState<any>(null);
    const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>([]);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedSubmissionForGrade, setSelectedSubmissionForGrade] = useState<any>(null);
    const [gradeData, setGradeData] = useState({ score: 0, feedback: '' });
    const [allAssignments, setAllAssignments] = useState<any[]>([]);
    
    // State cho modal xem bài tập
    const [showSubmissionViewModal, setShowSubmissionViewModal] = useState(false);
    const [selectedSubmissionToView, setSelectedSubmissionToView] = useState<any>(null);
    const [submissionZoom, setSubmissionZoom] = useState(1);
    const [submissionPreviewHtml, setSubmissionPreviewHtml] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // State cho Quiz
    const [showCreateQuiz, setShowCreateQuiz] = useState(false);
    const [selectedClassForQuiz, setSelectedClassForQuiz] = useState<any>(null);
    const [showImportQuiz, setShowImportQuiz] = useState(false);
    const [selectedClassForImport, setSelectedClassForImport] = useState<any>(null);
    const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
    const [showQuizAttemptsModal, setShowQuizAttemptsModal] = useState(false);
    const [selectedQuizForAttempts, setSelectedQuizForAttempts] = useState<any>(null);
    const [quizAttempts, setQuizAttempts] = useState<any[]>([]);

    // Load classes from database when component mounts
    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            setLoading(true);
            console.log('[LOAD] Starting loadClasses for teacher:', user.id);
            // Gửi teacherId để server filter lớp của giáo viên này
            const data = await getClasses(user.id);
            console.log('[LOAD] Classes loaded:', data);
            setClasses(data);
            
            // Fetch assignments từng class
            const allAssignmentsList = [];
            const allQuizzesList = [];
            for (const cls of data) {
                try {
                    console.log(`[LOAD] Fetching assignments for class ${cls.id}`);
                    const assignments = await getClassAssignments(String(cls.id));
                    console.log(`[LOAD] Got ${assignments.length} assignments for class ${cls.id}:`, assignments);
                    allAssignmentsList.push(...assignments.map((a: any) => ({
                        ...a,
                        className: cls.name
                    })));

                    // Fetch quizzes
                    const quizzes = await getClassQuizzes(String(cls.id));
                    console.log(`[LOAD] Got ${quizzes.length} quizzes for class ${cls.id}:`, quizzes);
                    allQuizzesList.push(...quizzes);
                } catch (error) {
                    console.error(`[LOAD ERROR] Lỗi khi tải assignments/quizzes của class ${cls.id}:`, error);
                }
            }
            
            // Sắp xếp theo ngày tạo mới nhất
            allAssignmentsList.sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            });
            
            console.log('[LOAD] All assignments loaded:', allAssignmentsList);
            setAllAssignments(allAssignmentsList);
            
            // Sort quizzes by created date
            allQuizzesList.sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            });
            console.log('[LOAD] All quizzes loaded:', allQuizzesList);
            setAllQuizzes(allQuizzesList);
        } catch (error) {
            console.error('[LOAD ERROR] Lỗi khi tải lớp học:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newClassName.trim()) {
            alert('Vui lòng nhập tên lớp học!');
            return;
        }

        try {
            setLoading(true);
            const newClass = {
                name: newClassName.trim(),
                teacherId: user.id,
                teacherName: user.name || 'Giáo viên',
                code: Math.random().toString(36).substring(2, 8).toUpperCase()
            };
            
            const createdClass = await createClass(newClass);
            setClasses([...classes, createdClass]);
            setNewClassName('');
            setShowCreateClass(false);
            alert(`✅ Tạo lớp "${createdClass.name}" thành công! Mã lớp: ${createdClass.code}`);
        } catch (error) {
            console.error('Lỗi khi tạo lớp:', error);
            alert('❌ Lỗi khi tạo lớp, vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedClass || !newAssignment.title.trim() || !newAssignment.dueDate) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        try {
            setLoading(true);
            // Extract date from datetime-local input without timezone conversion
            // Input format: "YYYY-MM-DDTHH:mm", just extract the date part
            const dateStr = newAssignment.dueDate.split('T')[0]; // Get "YYYY-MM-DD"
            const timeStr = newAssignment.dueDate.split('T')[1] || '00:00'; // Get "HH:mm"
            const dueDateTime = `${dateStr}T${timeStr}:00`; // Format as ISO-like string
            
            const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';
            const assignment = {
                classId: selectedClass,
                className: selectedClassName,
                title: newAssignment.title.trim(),
                description: newAssignment.description.trim(),
                dueDate: dueDateTime,
                teacherId: user.id
            };

            console.log('[HANDLER] handleCreateAssignment - assignment data:', assignment);
            console.log('[HANDLER] handleCreateAssignment - selectedFiles:', selectedFiles?.length);
            
            const created = await createAssignment(assignment, selectedFiles || undefined);
            console.log('[HANDLER] Assignment created successfully:', created);
            
            alert(`✅ Giao bài tập "${created.title}" thành công!`);
            setNewAssignment({ title: '', description: '', dueDate: '' });
            setSelectedFiles(null);
            setSelectedClass(null);
            setShowCreateAssignment(false);
            
            console.log('[HANDLER] Reloading classes...');
            await loadClasses(); // Reload để cập nhật số bài tập
            console.log('[HANDLER] Classes reloaded');
        } catch (error) {
            console.error('[HANDLER ERROR] Lỗi khi giao bài tập:', error);
            alert('❌ Lỗi khi giao bài tập, vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header glassmorphism">
                <h1>Dashboard Giáo viên</h1>
                <p>Xin chào, {user.name}!</p>
            </div>

            <div className="dashboard-actions">
                <button className="btn btn-primary" onClick={() => setShowCreateClass(true)}>
                    Tạo lớp học mới
                </button>
                <button className="btn btn-secondary" onClick={() => setShowCreateAssignment(true)}>
                    Giao bài tập mới
                </button>
                <button className="btn btn-secondary" onClick={() => { console.log('Clicked Import Quiz từ Word'); setShowImportQuiz(true); }}>
                    Import Quiz từ Word
                </button>
                <button className="btn btn-secondary" onClick={() => setShowCreateQuiz(true)} style={{ marginLeft: '8px' }}>
                    Tạo Quiz trắc nghiệm
                </button>
            </div>

            {showCreateClass && (
                <div className="modal-overlay" onClick={() => setShowCreateClass(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>Tạo lớp học mới</h3>
                        <form onSubmit={handleCreateClass}>
                            <div className="form-group">
                                <label>Tên lớp học</label>
                                <input
                                    type="text"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    placeholder="VD: 12A - Toán"
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary">Tạo lớp</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateClass(false)}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCreateAssignment && (
                <div className="modal-overlay" onClick={() => setShowCreateAssignment(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>Giao bài tập mới</h3>
                        <form onSubmit={handleCreateAssignment}>
                            <div className="form-group">
                                <label>Chọn lớp</label>
                                <select value={selectedClass || ''} onChange={(e) => setSelectedClass(Number(e.target.value))} required>
                                    <option value="">-- Chọn lớp --</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tiêu đề bài tập</label>
                                <input
                                    type="text"
                                    value={newAssignment.title}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                    placeholder="VD: Bài tập về Đạo hàm"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Mô tả (không bắt buộc)</label>
                                <textarea
                                    value={newAssignment.description}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                    placeholder="Mô tả yêu cầu bài tập... (có thể để trống)"
                                    rows={4}
                                />
                            </div>
                            <div className="form-group">
                                <label>Hạn nộp</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                                    <button 
                                        type="button" 
                                        className="btn btn-small" 
                                        style={{ background: '#bee3f8', color: '#2c5282', border: 'none', borderRadius: '6px' }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const now = new Date();
                                            const due = new Date(now);
                                            due.setDate(due.getDate() + 1);
                                            due.setHours(17, 0, 0);
                                            const year = due.getFullYear();
                                            const month = String(due.getMonth() + 1).padStart(2, '0');
                                            const date = String(due.getDate()).padStart(2, '0');
                                            const hours = String(due.getHours()).padStart(2, '0');
                                            const minutes = String(due.getMinutes()).padStart(2, '0');
                                            const iso = `${year}-${month}-${date}T${hours}:${minutes}`;
                                            console.log('Set dueDate to:', iso);
                                            setNewAssignment({ ...newAssignment, dueDate: iso });
                                        }}
                                    >
                                        Ngày mai 17:00
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-small" 
                                        style={{ background: '#bee3f8', color: '#2c5282', border: 'none', borderRadius: '6px' }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const now = new Date();
                                            const due = new Date(now);
                                            due.setDate(due.getDate() + 3);
                                            due.setHours(17, 0, 0);
                                            const year = due.getFullYear();
                                            const month = String(due.getMonth() + 1).padStart(2, '0');
                                            const date = String(due.getDate()).padStart(2, '0');
                                            const hours = String(due.getHours()).padStart(2, '0');
                                            const minutes = String(due.getMinutes()).padStart(2, '0');
                                            const iso = `${year}-${month}-${date}T${hours}:${minutes}`;
                                            console.log('Set dueDate to:', iso);
                                            setNewAssignment({ ...newAssignment, dueDate: iso });
                                        }}
                                    >
                                        3 ngày nữa
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-small" 
                                        style={{ background: '#bee3f8', color: '#2c5282', border: 'none', borderRadius: '6px' }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const now = new Date();
                                            const due = new Date(now);
                                            due.setDate(due.getDate() + 7);
                                            due.setHours(17, 0, 0);
                                            const year = due.getFullYear();
                                            const month = String(due.getMonth() + 1).padStart(2, '0');
                                            const date = String(due.getDate()).padStart(2, '0');
                                            const hours = String(due.getHours()).padStart(2, '0');
                                            const minutes = String(due.getMinutes()).padStart(2, '0');
                                            const iso = `${year}-${month}-${date}T${hours}:${minutes}`;
                                            console.log('Set dueDate to:', iso);
                                            setNewAssignment({ ...newAssignment, dueDate: iso });
                                        }}
                                    >
                                        1 tuần
                                    </button>
                                </div>
                                <input
                                    type="datetime-local"
                                    value={newAssignment.dueDate}
                                    onChange={(e) => {
                                        console.log('Input datetime changed to:', e.target.value);
                                        setNewAssignment({ ...newAssignment, dueDate: e.target.value });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        border: '1px solid rgba(0, 188, 212, 0.3)',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        color: '#00bcd4',
                                        fontWeight: '500',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Đính kèm file (PDF, Word, Ảnh)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setSelectedFiles(e.target.files)}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                                    multiple
                                />
                                <small style={{ color: '#718096', marginTop: '0.5rem', display: 'block' }}>
                                    Có thể chọn nhiều file. Được hỗ trợ: PDF, Word, ảnh (JPG, PNG, GIF)
                                </small>
                                {selectedFiles && selectedFiles.length > 0 && (
                                    <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: '#edf2f7', borderRadius: '6px' }}>
                                        <strong>Đã chọn {selectedFiles.length} file:</strong>
                                        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                            {Array.from(selectedFiles).map((file, idx) => (
                                                <li key={idx} style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                                                    {file.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary">Giao bài</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateAssignment(false)}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="classes-grid">
                {classes.length === 0 ? (
                    <div className="empty-state">
                        <p style={{ fontSize: '3rem' }}></p>
                        <h3>Chưa có lớp học nào</h3>
                        <p>Tạo lớp học đầu tiên của bạn để bắt đầu!</p>
                    </div>
                ) : (
                    classes.map(cls => (
                    <div 
                        key={cls.id} 
                        className="class-card glassmorphism" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/class/${cls.id}`)}
                    >
                        <div className="class-header">
                            <h3 style={{ cursor: 'pointer' }}>{cls.name}</h3>
                            <span className="class-code">Mã: {cls.code}</span>
                        </div>
                        <div className="class-stats">
                            <div className="stat">
                                <span className="stat-value">{cls.students}</span>
                                <span className="stat-label">Học sinh</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{cls.assignments}</span>
                                <span className="stat-label">Bài tập</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button 
                                className="btn btn-primary btn-small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/class/${cls.id}`);
                                }}
                                style={{ flex: 1 }}
                            >
                                Xem chi tiết
                            </button>
                            <button 
                                className="btn btn-secondary btn-small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Bạn có chắc chắn muốn xóa lớp "${cls.name}"? Tất cả bài tập và bài nộp sẽ bị xóa!`)) {
                                        try {
                                            setLoading(true);
                                            deleteClass(cls.id).then(() => {
                                                alert('✅ Xóa lớp thành công!');
                                                loadClasses();
                                            });
                                        } catch (error) {
                                            console.error('Lỗi khi xóa lớp:', error);
                                            alert('❌ Lỗi khi xóa lớp, vui lòng thử lại!');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }
                                }}
                                style={{ flex: 1 }}
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                )))}
            </div>

            <div className="recent-section">
                <h2>Bài tập gần đây</h2>
                <div style={{ marginBottom: '1rem' }}>
                    <button className="btn btn-primary btn-small" onClick={() => loadClasses()}>
                        Tải lại
                    </button>
                </div>
                <div className="assignment-list">
                    {allAssignments.length === 0 ? (
                        <div className="empty-state-small">
                            <p>Chưa có bài tập nào</p>
                        </div>
                    ) : (
                        <>
                            {allAssignments.slice(0, 5).map((assignment: any) => (
                                <div key={assignment.id} className="assignment-item">
                                    <div className="assignment-info">
                                        <h4>{assignment.title}</h4>
                                        <p>{assignment.className} • Hạn nộp: {formatDate(assignment.dueDate)}</p>
                                    </div>
                                    <div className="assignment-progress">
                                        <button 
                                            className="btn-small btn-primary"
                                            onClick={async () => {
                                                setCurrentAssignmentForSubmissions(assignment);
                                                try {
                                                    const subs = await getAssignmentSubmissions(String(assignment.id));
                                                    setAssignmentSubmissions(subs);
                                                } catch (error) {
                                                    console.error('Lỗi khi tải danh sách nộp bài:', error);
                                                }
                                                setShowSubmissionsModal(true);
                                            }}
                                        >
                                            Xem bài nộp
                                        </button>
                                        <button 
                                            className="btn-small btn-secondary"
                                            style={{ marginLeft: '0.5rem' }}
                                            onClick={async () => {
                                                if (window.confirm(`Bạn có chắc chắn muốn xóa bài tập "${assignment.title}"?`)) {
                                                    try {
                                                        setLoading(true);
                                                        await deleteAssignment(String(assignment.id));
                                                        alert('Xóa bài tập thành công!');
                                                        loadClasses();
                                                    } catch (error) {
                                                        console.error('Lỗi khi xóa bài tập:', error);
                                                        alert('Lỗi khi xóa bài tập!');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }
                                            }}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            <div className="recent-section">
                <h2>Quiz Trắc nghiệm gần đây</h2>
                <div className="assignment-list">
                    {allQuizzes.length === 0 ? (
                        <div className="empty-state-small">
                            <p>Chưa có quiz nào</p>
                        </div>
                    ) : (
                        <>
                            {allQuizzes.slice(0, 5).map((quiz: any) => (
                                <div key={quiz.id} className="assignment-item" style={{ borderLeft: '4px solid #4CAF50' }}>
                                    <div className="assignment-info">
                                        <h4>{quiz.title}</h4>
                                        <p>
                                            {quiz.className} • {quiz.questions?.length || 0} câu hỏi 
                                            • Hạn: {formatDate(quiz.dueDate)}
                                            {quiz.timeLimit > 0 && ` • ${quiz.timeLimit} phút`}
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#666' }}>
                                            {quiz.attempts?.length || 0} học sinh đã làm
                                        </p>
                                    </div>
                                    <div className="assignment-progress">
                                        <button 
                                            className="btn-small btn-primary"
                                            onClick={async () => {
                                                try {
                                                    setLoading(true);
                                                    setSelectedQuizForAttempts(quiz);
                                                    setShowQuizAttemptsModal(true);
                                                    const attempts = await getQuizAttempts(String(quiz.id));
                                                    setQuizAttempts(attempts.attempts || attempts || []);
                                                } catch (err) {
                                                    console.error('Lỗi khi tải kết quả quiz:', err);
                                                    alert('Không thể tải kết quả quiz');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                        >
                                            Xem kết quả
                                        </button>
                                        
                                        <button 
                                            className="btn-small btn-secondary"
                                            style={{ marginLeft: '0.5rem' }}
                                            onClick={async () => {
                                                if (window.confirm(`Bạn có chắc muốn xóa quiz "${quiz.title}"?`)) {
                                                    try {
                                                        setLoading(true);
                                                        await deleteQuiz(String(quiz.id));
                                                        alert('Xóa quiz thành công!');
                                                        loadClasses();
                                                    } catch (error) {
                                                        console.error('Lỗi khi xóa quiz:', error);
                                                        alert('Lỗi khi xóa quiz!');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }
                                            }}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {showSubmissionsModal && currentAssignmentForSubmissions && (
                <div className="modal-overlay" onClick={() => setShowSubmissionsModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3>Danh sách bài nộp: {currentAssignmentForSubmissions.title}</h3>
                        <div className="submission-list">
                            {assignmentSubmissions.length === 0 ? (
                                <div className="empty-state-small">
                                    <p>Chưa có bài nộp nào</p>
                                </div>
                            ) : (
                                assignmentSubmissions.map((submission) => (
                                    <div key={submission.id} className="submission-item">
                                        <div className="student-info">
                                            <h4>{submission.studentName}</h4>
                                            <p>Nộp lúc: {new Date(submission.submissionDate).toLocaleDateString('vi-VN')} {new Date(submission.submissionDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                            {submission.status === 'graded' && (
                                                <p style={{ color: '#38a169' }}>✅ Điểm: {submission.score}/10</p>
                                            )}
                                        </div>
                                        <div className="submission-actions">
                                            {submission.file && (
                                                <button 
                                                    className="btn-small btn-primary"
                                                    style={{ marginRight: '0.5rem' }}
                                                    onClick={async () => {
                                                        setSelectedSubmissionToView(submission);
                                                        setSubmissionZoom(1);
                                                        setSubmissionPreviewHtml(null);
                                                        setPreviewError(null);

                                                        try {
                                                            const filePath = submission.file as string; // e.g. /uploads/xyz.docx
                                                            const filename = filePath.split('/').pop();
                                                                if (filename && (filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc'))) {
                                                                setPreviewLoading(true);
                                                                const API_URL = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.replace(/\/$/, '')) || 'http://localhost:5000/api';
                                                                const resp = await fetch(`${API_URL}/submissions/file/preview/${encodeURIComponent(filename)}`);
                                                                if (!resp.ok) throw new Error('Không thể lấy preview');
                                                                const data = await resp.json();
                                                                setSubmissionPreviewHtml(data.html || null);
                                                            }
                                                        } catch (err: any) {
                                                            console.error('Lỗi lấy preview:', err);
                                                            setPreviewError(err.message || 'Lỗi khi tải preview');
                                                        } finally {
                                                            setPreviewLoading(false);
                                                            setShowSubmissionViewModal(true);
                                                        }
                                                    }}
                                                >
                                                    Xem bài
                                                </button>
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
                        <div className="modal-actions" style={{ marginTop: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowSubmissionsModal(false)}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showQuizAttemptsModal && selectedQuizForAttempts && (
                <div className="modal-overlay" onClick={() => setShowQuizAttemptsModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3>Kết quả quiz: {selectedQuizForAttempts.title}</h3>
                        <div style={{ marginBottom: 12 }}>
                            <strong>Số lượt làm:</strong> {quizAttempts.length}
                        </div>
                        <div className="submission-list">
                            {quizAttempts.length === 0 ? (
                                <div className="empty-state-small">
                                    <p>Chưa có học sinh nào làm quiz này</p>
                                </div>
                            ) : (
                                quizAttempts.map((attempt: any, idx: number) => (
                                    <div key={idx} className="submission-item">
                                        <div className="student-info">
                                            <h4>{attempt.studentName || `Student ${attempt.studentId}`}</h4>
                                            <p>Nộp lúc: {new Date(attempt.submittedAt).toLocaleString('vi-VN')}</p>
                                            <p style={{ color: '#38a169' }}>✅ Điểm: {attempt.score}/100</p>
                                        </div>
                                        <div className="submission-actions">
                                            <button className="btn-small btn-primary" onClick={() => {
                                                // Navigate to the student's result page
                                                navigate(`/quiz/${selectedQuizForAttempts.id}/result/${attempt.studentId}`);
                                                setShowQuizAttemptsModal(false);
                                            }}>Xem</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="modal-actions" style={{ marginTop: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowQuizAttemptsModal(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {showGradeModal && selectedSubmissionForGrade && (
                <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>Chấm điểm bài tập</h3>
                        <p><strong>Học sinh:</strong> {selectedSubmissionForGrade.studentName}</p>
                        <form onSubmit={async (e) => { 
                            e.preventDefault(); 
                            try {
                                setLoading(true);
                                await gradeSubmission(String(selectedSubmissionForGrade.id), gradeData);
                                alert('✅ Chấm điểm thành công!');
                                setShowGradeModal(false);
                                const subs = await getAssignmentSubmissions(String(currentAssignmentForSubmissions.id));
                                setAssignmentSubmissions(subs);
                            } catch (error) {
                                console.error('Lỗi khi chấm điểm:', error);
                                alert('❌ Lỗi khi chấm điểm!');
                            } finally {
                                setLoading(false);
                            }
                        }}>
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
                                <button type="submit" className="btn btn-primary" disabled={loading}>Lưu chấm điểm</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowGradeModal(false)}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal xem bài tập với zoom */}
            {showSubmissionViewModal && selectedSubmissionToView && (
                <div className="modal-overlay" onClick={() => setShowSubmissionViewModal(false)}>
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
                            backgroundColor: '#1a1a1a'
                        }}
                    >
                        {/* Header với điều khiển */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            borderBottom: '1px solid #333',
                            backgroundColor: '#0d0d0d'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, marginBottom: '0.5rem', color: '#fff' }}>
                                    Bài tập của: {selectedSubmissionToView.studentName}
                                </h3>
                                <p style={{ margin: 0, color: '#999', fontSize: '0.9rem' }}>
                                    Nộp lúc: {new Date(selectedSubmissionToView.submissionDate).toLocaleDateString('vi-VN')} {new Date(selectedSubmissionToView.submissionDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {/* Nút thu nhỏ */}
                                <button 
                                    onClick={() => setSubmissionZoom(Math.max(0.5, submissionZoom - 0.1))}
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
                                
                                {/* Hiển thị mức zoom */}
                                <span style={{
                                    color: '#fff',
                                    minWidth: '60px',
                                    textAlign: 'center',
                                    fontSize: '0.9rem'
                                }}>
                                    {(submissionZoom * 100).toFixed(0)}%
                                </span>
                                
                                {/* Nút phóng to */}
                                <button 
                                    onClick={() => setSubmissionZoom(Math.min(2, submissionZoom + 0.1))}
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

                                {/* Nút đóng */}
                                <button 
                                    onClick={() => setShowSubmissionViewModal(false)}
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

                        {/* Nội dung file */}
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: '1rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                            backgroundColor: '#1a1a1a'
                        }}>
                            {selectedSubmissionToView.file ? (
                                // If we have preview HTML (DOCX), render it; otherwise show image/pdf via URL
                                submissionPreviewHtml ? (
                                    <div style={{ width: '100%', color: '#fff' }} dangerouslySetInnerHTML={{ __html: submissionPreviewHtml }} />
                                ) : previewLoading ? (
                                    <div style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Đang tải preview...</div>
                                ) : previewError ? (
                                    <div style={{ color: '#e53e3e', textAlign: 'center', padding: '2rem' }}>{previewError}</div>
                                ) : (
                                    <img 
                                        src={`http://localhost:5000${selectedSubmissionToView.file}`}
                                        alt="Bài tập của học sinh"
                                        style={{
                                            maxWidth: '100%',
                                            height: 'auto',
                                            transform: `scale(${submissionZoom})`,
                                            transformOrigin: 'top center',
                                            transition: 'transform 0.2s ease',
                                            borderRadius: '4px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                        }}
                                    />
                                )
                            ) : (
                                <div style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
                                    Không có file bài tập
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz Modal */}
            {showCreateQuiz && (
                <div className="modal-overlay" onClick={() => setShowCreateQuiz(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <h3>Chọn lớp để tạo Quiz</h3>
                        {classes.length === 0 ? (
                            <p>Chưa có lớp học nào. Vui lòng tạo lớp trước!</p>
                        ) : (
                            <div className="class-list">
                                {classes.map((cls: any) => (
                                    <div
                                        key={cls.id}
                                        className="class-item-select"
                                        onClick={() => {
                                            setShowCreateQuiz(false);
                                            setTimeout(() => setSelectedClassForQuiz(cls), 0);
                                        }}
                                        style={{
                                            padding: '12px',
                                            margin: '8px 0',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f0f0f0';
                                            e.currentTarget.style.borderColor = '#1976d2';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'white';
                                            e.currentTarget.style.borderColor = '#ddd';
                                        }}
                                    >
                                        <strong>{cls.name}</strong>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                            Mã lớp: {cls.code}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="modal-actions" style={{ marginTop: '16px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCreateQuiz(false)}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QuizModal Component */}
            {selectedClassForQuiz && (
                <QuizModal
                    classId={selectedClassForQuiz.id}
                    className={selectedClassForQuiz.name}
                    teacherId={user.id}
                    onClose={() => setSelectedClassForQuiz(null)}
                    onSuccess={() => {
                        setSelectedClassForQuiz(null);
                        loadClasses();
                    }}
                    />
                )}

                {/* Import Quiz Modal */}
            {showImportQuiz && (
                <div className="modal-overlay" onClick={() => setShowImportQuiz(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <h3>Chọn lớp để Import Quiz</h3>
                        {classes.length === 0 ? (
                            <p>Chưa có lớp học nào. Vui lòng tạo lớp trước!</p>
                        ) : (
                            <div className="class-list">
                                {classes.map((cls: any) => (
                                    <div
                                        key={cls.id}
                                        className="class-item-select"
                                        onClick={() => {
                                            setShowImportQuiz(false);
                                            setTimeout(() => setSelectedClassForImport(cls), 0);
                                        }}
                                        style={{
                                            padding: '12px',
                                            margin: '8px 0',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f0f0f0';
                                            e.currentTarget.style.borderColor = '#4CAF50';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'white';
                                            e.currentTarget.style.borderColor = '#ddd';
                                        }}
                                    >
                                        <strong>{cls.name}</strong>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                            Mã lớp: {cls.code}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="modal-actions" style={{ marginTop: '16px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowImportQuiz(false)}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ImportQuizModal Component */}
            {selectedClassForImport && (
                <ImportQuizModal
                    classId={selectedClassForImport.id}
                    className={selectedClassForImport.name}
                    teacherId={user.id}
                    onClose={() => setSelectedClassForImport(null)}
                    onSuccess={() => {
                        setSelectedClassForImport(null);
                        loadClasses();
                    }}
                />
            )}
        </div>
    );
};

export default TeacherDashboard;

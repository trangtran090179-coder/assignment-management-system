import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinClass, getStudentClasses, getStudentAssignments, getClassQuizzes, getQuizResult } from '../services/api';
import CountdownTimer from '../components/CountdownTimer';

interface StudentDashboardProps {
    user: any;
}

interface AssignmentStats {
    total: number;
    submitted: number;
    graded: number;
    pending: number;
    overdue: number;
    averageScore: number;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
    const navigate = useNavigate();
    const [showJoinClass, setShowJoinClass] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'pending' | 'graded' | 'overdue'>('all');
    const [assignmentStats, setAssignmentStats] = useState<AssignmentStats>({
        total: 0,
        submitted: 0,
        graded: 0,
        pending: 0,
        overdue: 0,
        averageScore: 0
    });

    useEffect(() => {
        loadClasses();
        loadAssignments();
        
        // Check if coming back from assignment submission
        const checkSubmission = () => {
            const lastSubmitted = localStorage.getItem('assignmentSubmitted_');
            if (lastSubmitted) {
                console.log('[StudentDashboard] Detected submission, reloading assignments...');
                loadAssignments();
                localStorage.removeItem('assignmentSubmitted_');
            }
        };
        
        // Check on mount and when key changed
        checkSubmission();
        const timer = setTimeout(checkSubmission, 500);
        
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        calculateStats();
    }, [assignments]);

    // Listen for assignment submission via localStorage
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key && e.key.startsWith('assignmentSubmitted_')) {
                console.log('[StudentDashboard] Assignment submitted detected via localStorage, reloading...');
                loadAssignments();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const calculateStats = () => {
        const total = assignments.length;
        const submitted = assignments.filter(a => a.status === 'pending' || a.status === 'graded').length;
        const graded = assignments.filter(a => a.status === 'graded').length;
        
        const now = new Date();
        const pending = assignments.filter(a => {
            const dueDate = new Date(a.dueDate);
            return (a.status === 'unpublished' || !a.status) && now <= dueDate;
        }).length;

        const overdue = assignments.filter(a => {
            const dueDate = new Date(a.dueDate);
            // Only count as overdue if NOT submitted and NOT graded and past due date
            return (a.status !== 'pending' && a.status !== 'graded' && (!a.status || a.status === 'unpublished')) && now > dueDate;
        }).length;

        const gradedAssignments = assignments.filter(a => a.status === 'graded' && a.score);
        const averageScore = gradedAssignments.length > 0 
            ? (gradedAssignments.reduce((sum, a) => sum + (a.score || 0), 0) / gradedAssignments.length).toFixed(1)
            : 0;

        setAssignmentStats({
            total,
            submitted,
            graded,
            pending,
            overdue,
            averageScore: parseFloat(averageScore as string)
        });
    };

    const loadClasses = async () => {
        try {
            setLoading(true);
            const data = await getStudentClasses(user.id);
            setEnrolledClasses(data);
            
            // Load quizzes after classes are loaded
            await loadQuizzesForClasses(data);
        } catch (error) {
            console.error('Lỗi khi tải lớp học:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadQuizzesForClasses = async (classes: any[]) => {
        try {
            console.log('[StudentDashboard] Loading quizzes for student:', user.id);
            const allQuizzes: any[] = [];
            
            // Load quizzes from all enrolled classes
            for (const cls of classes) {
                try {
                    const classQuizzes = await getClassQuizzes(String(cls.id));
                    allQuizzes.push(...classQuizzes);
                } catch (error) {
                    console.error(`Error loading quizzes for class ${cls.id}:`, error);
                }
            }
            
            // Sort by due date
            allQuizzes.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            console.log('[StudentDashboard] Quizzes loaded:', allQuizzes);
            setQuizzes(allQuizzes);
        } catch (error) {
            console.error('Lỗi khi tải quiz:', error);
        }
    };

    const loadAssignments = async () => {
        try {
            console.log('[StudentDashboard] Loading assignments for studentId:', user.id);
            const data = await getStudentAssignments(user.id);
            console.log('[StudentDashboard] Assignments loaded:', data);
            setAssignments(data);
        } catch (error) {
            console.error('Lỗi khi tải bài tập:', error);
        }
    };

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!classCode.trim()) {
            alert('Vui lòng nhập mã lớp!');
            return;
        }

        try {
            setLoading(true);
            await joinClass({
                studentId: user.id,
                classCode: classCode.trim(),
                studentName: user.name
            });
            alert('Tham gia lớp thành công!');
            setClassCode('');
            setShowJoinClass(false);
            loadClasses(); // Reload danh sách lớp
            loadAssignments(); // Reload bài tập
        } catch (error) {
            console.error('Lỗi khi tham gia lớp:', error);
            alert('Mã lớp không hợp lệ hoặc không tồn tại!');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (assignment: any) => {
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        
        // If graded, always show graded status regardless of due date
        if (assignment.status === 'graded') {
            return <span className="badge badge-success">Đã chấm - {assignment.score} điểm</span>;
        }
        // If submitted but not graded yet
        if (assignment.status === 'pending') {
            // Compare submission time with due date, not current time
            if (assignment.submissionDate) {
                const submissionDate = new Date(assignment.submissionDate);
                if (submissionDate > dueDate) {
                    return <span className="badge badge-danger">Đã nộp muộn</span>;
                }
            }
            return <span className="badge badge-info">Đã nộp</span>;
        }
        // Not submitted
        if (now > dueDate) {
            return <span className="badge badge-danger">Quá hạn - Chưa nộp</span>;
        }
        return <span className="badge badge-warning">Chưa nộp</span>;
    };

    // Filter assignments: pending = chưa nộp (không quá hạn), graded = đã chấm
    const pendingAssignments = assignments.filter(a => {
        const now = new Date();
        const dueDate = new Date(a.dueDate);
        return (a.status === 'unpublished' || !a.status) && now <= dueDate;
    });
    
    const overdueAssignments = assignments.filter(a => {
        const now = new Date();
        const dueDate = new Date(a.dueDate);
        // Only count as overdue if NOT submitted and NOT graded and past due date
        return (a.status !== 'pending' && a.status !== 'graded' && (!a.status || a.status === 'unpublished')) && now > dueDate;
    });
    
    const gradedAssignments = assignments.filter(a => a.status === 'graded');

    // Filtered assignments based on search and filter type
    const filteredAssignments = assignments.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              a.className.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (filterType === 'pending') {
            const now = new Date();
            const dueDate = new Date(a.dueDate);
            return matchesSearch && (a.status === 'unpublished' || !a.status) && now <= dueDate;
        }
        if (filterType === 'graded') {
            return matchesSearch && a.status === 'graded';
        }
        if (filterType === 'overdue') {
            const now = new Date();
            const dueDate = new Date(a.dueDate);
            // Only show as overdue if NOT submitted and NOT graded and past due date
            return matchesSearch && (a.status !== 'pending' && a.status !== 'graded' && (!a.status || a.status === 'unpublished')) && now > dueDate;
        }
        return matchesSearch;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Function để lấy bài tập sắp hết hạn nhất trong một lớp
    const getNextDueDateInClass = (classId: number) => {
        // Ưu tiên dữ liệu từ assignments (từ API getStudentAssignments)
        let classAssignments = assignments.filter(a => a.classId === classId);
        
        // Nếu không có, thử lấy từ enrolledClasses (từ API getStudentClasses)
        if (classAssignments.length === 0) {
            const cls = enrolledClasses.find(c => c.id === classId);
            if (cls && cls.assignments_list && cls.assignments_list.length > 0) {
                classAssignments = cls.assignments_list;
                console.log('[getNextDueDateInClass] Using fallback from class data:', classAssignments);
            }
        }
        
        if (classAssignments.length === 0) return null;
        
        // Sort theo dueDate và lấy cái sắp hết hạn nhất (chưa quá hạn)
        const sorted = classAssignments
            .filter(a => {
                const now = new Date();
                const dueDate = new Date(a.dueDate);
                return now <= dueDate; // Chưa quá hạn
            })
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        
        return sorted.length > 0 ? sorted[0] : null;
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Dashboard Học sinh</h1>
                <p>Xin chào, {user.name}!</p>
            </div>

            <div className="dashboard-actions">
                <button className="btn btn-primary" onClick={() => setShowJoinClass(true)}>
                    Tham gia lớp học
                </button>
            </div>

            {showJoinClass && (
                <div className="modal-overlay" onClick={() => setShowJoinClass(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>Tham gia lớp học</h3>
                        <form onSubmit={handleJoinClass}>
                            <div className="form-group">
                                <label>Mã lớp học</label>
                                <input
                                    type="text"
                                    value={classCode}
                                    onChange={(e) => setClassCode(e.target.value)}
                                    placeholder="Nhập mã lớp (VD: MATH12A)"
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Đang xử lý...' : 'Tham gia'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowJoinClass(false)}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* THỐNG KÊ HIỆU SUẤT HỌC TẬP */}
            {assignments.length > 0 && (
                <div className="performance-stats">
                    <h2>Thống kê học tập</h2>
                    <div className="stats-grid">
                        <div className="stat-card" style={{ borderLeft: '4px solid #3498db' }}>
                            <div className="stat-icon"></div>
                            <div className="stat-content">
                                <h3>{assignmentStats.total}</h3>
                                <p>Tổng bài tập</p>
                            </div>
                        </div>
                        <div className="stat-card" style={{ borderLeft: '4px solid #2ecc71' }}>
                            <div className="stat-icon"></div>
                            <div className="stat-content">
                                <h3>{assignmentStats.submitted}</h3>
                                <p>Đã nộp</p>
                            </div>
                        </div>
                        <div className="stat-card" style={{ borderLeft: '4px solid #9b59b6' }}>
                            <div className="stat-icon"></div>
                            <div className="stat-content">
                                <h3>{assignmentStats.graded}</h3>
                                <p>Đã chấm</p>
                            </div>
                        </div>
                        <div className="stat-card" style={{ borderLeft: '4px solid #e74c3c' }}>
                            <div className="stat-icon"></div>
                            <div className="stat-content">
                                <h3>{assignmentStats.overdue}</h3>
                                <p>Quá hạn</p>
                            </div>
                        </div>
                        <div className="stat-card" style={{ borderLeft: '4px solid #f39c12' }}>
                            <div className="stat-icon"></div>
                            <div className="stat-content">
                                <h3>{assignmentStats.pending}</h3>
                                <p>Chưa nộp</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Danh sách lớp đã tham gia */}
            <div className="classes-grid">
                <h2>Lớp học của bạn</h2>
                {enrolledClasses.length === 0 ? (
                    <div className="empty-state">
                        <p style={{ fontSize: '3rem' }}></p>
                        <h3>Chưa tham gia lớp nào</h3>
                        <p>Nhấn "Tham gia lớp học" để bắt đầu</p>
                    </div>
                ) : (
                    enrolledClasses.map(cls => {
                        const nextAssignment = getNextDueDateInClass(cls.id);
                        return (
                            <div key={cls.id}>
                                <div 
                                    className="class-card glassmorphism" 
                                    onClick={() => navigate(`/class/${cls.id}`)} 
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="class-header">
                                        <h3>{cls.name}</h3>
                                        <span className="class-code">Mã: {cls.code}</span>
                                    </div>
                                    <div style={{ color: '#cbd5e0', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                        <p style={{ margin: '0.3rem 0' }}>Giáo viên: {cls.teacherName || 'N/A'}</p>
                                        <p style={{ margin: '0.3rem 0' }}>Sĩ số: {cls.students || 0} học sinh</p>
                                    </div>
                                    <div className="class-stats">
                                        <div className="stat">
                                            <span className="stat-value">{cls.assignments || 0}</span>
                                            <span className="stat-label">Bài tập</span>
                                        </div>
                                    </div>
                                </div>
                                {nextAssignment && (
                                    <div style={{ marginTop: '0.8rem' }}>
                                        <CountdownTimer 
                                            dueDate={nextAssignment.dueDate}
                                            assignmentTitle={nextAssignment.title}
                                            status={nextAssignment.status}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Danh sách bài tập */}
            {assignments.length > 0 && (
                <>
                    {/* TÌM KIẾM VÀ LỌC BÀI TẬP */}
                    <div className="assignments-section">
                        <h2>Bài tập của bạn</h2>
                        
                        <div className="search-filter-container">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm bài tập hoặc lớp..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                            <div className="filter-buttons">
                                <button 
                                    className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                                    onClick={() => setFilterType('all')}
                                >
                                    Tất cả ({assignments.length})
                                </button>
                                <button 
                                    className={`filter-btn ${filterType === 'pending' ? 'active' : ''}`}
                                    onClick={() => setFilterType('pending')}
                                >
                                    Chưa nộp ({pendingAssignments.length})
                                </button>
                                <button 
                                    className={`filter-btn ${filterType === 'graded' ? 'active' : ''}`}
                                    onClick={() => setFilterType('graded')}
                                >
                                    Đã chấm ({gradedAssignments.length})
                                </button>
                                <button 
                                    className={`filter-btn danger ${filterType === 'overdue' ? 'active' : ''}`}
                                    onClick={() => setFilterType('overdue')}
                                >
                                    Quá hạn ({overdueAssignments.length})
                                </button>
                            </div>
                        </div>

                        {/* Hiển thị bài tập quá hạn nếu có */}
                        {overdueAssignments.length > 0 && filterType !== 'overdue' && filterType !== 'graded' && (
                            <div className="urgency-alert">
                                <h3>Bạn có {overdueAssignments.length} bài tập quá hạn!</h3>
                                <p>Vui lòng liên hệ giáo viên để xin gia hạn</p>
                            </div>
                        )}

                        {/* Bài tập sắp hết hạn nhất */}
                        {filterType === 'all' && pendingAssignments.length > 0 && (
                            <div className="upcoming-assignments">
                                <h3>Bài tập sắp hết hạn nhất</h3>
                                <div className="assignment-card-urgent glassmorphism" 
                                    onClick={() => navigate(`/assignment/${pendingAssignments[0].id}`)}
                                    style={{ cursor: 'pointer' }}>
                                    <div className="assignment-main">
                                        <h4>{pendingAssignments[0].title}</h4>
                                        <p className="assignment-class">{pendingAssignments[0].className}</p>
                                        <p className="assignment-due">
                                            {new Date(pendingAssignments[0].dueDate).toLocaleDateString('vi-VN')} {new Date(pendingAssignments[0].dueDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="assignment-status">
                                        <CountdownTimer 
                                            dueDate={pendingAssignments[0].dueDate} 
                                            assignmentTitle={pendingAssignments[0].title}
                                            status={pendingAssignments[0].status}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Danh sách bài tập được lọc */}
                        {filteredAssignments.length > 0 ? (
                            <div className="assignment-list">
                                {filteredAssignments.map(assignment => (
                                    <div key={assignment.id}>
                                        <div 
                                            className={`assignment-card glassmorphism ${
                                                new Date() > new Date(assignment.dueDate) && assignment.status !== 'graded' && assignment.status !== 'pending'
                                                    ? 'overdue-card' 
                                                    : ''
                                            }`}
                                            onClick={() => navigate(`/assignment/${assignment.id}`)} 
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="assignment-main">
                                                <h3>{assignment.title}</h3>
                                                <p className="assignment-class">{assignment.className}</p>
                                                <p className="assignment-due">
                                                    Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')} {new Date(assignment.dueDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="assignment-status">
                                                {getStatusBadge(assignment)}
                                            </div>
                                        </div>
                                        {filterType !== 'graded' && (
                                            <CountdownTimer 
                                                dueDate={assignment.dueDate} 
                                                assignmentTitle={assignment.title}
                                                status={assignment.status}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p style={{ fontSize: '2rem' }}></p>
                                <h3>Không tìm thấy bài tập</h3>
                                <p>Hãy thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                            </div>
                        )}
                    </div>

                    {/* Quiz Section */}
                    {quizzes.length > 0 && (
                        <div className="recent-section" style={{ marginTop: '2rem' }}>
                            <h2>📝 Quiz Trắc nghiệm</h2>
                            <div className="assignment-list">
                                {quizzes.map(quiz => {
                                    const hasAttempt = quiz.attempts?.some((a: any) => a.studentId === user.id);
                                    const isOverdue = new Date() > new Date(quiz.dueDate);
                                    
                                    return (
                                        <div 
                                            key={quiz.id}
                                            className={`assignment-card glassmorphism ${isOverdue && !hasAttempt ? 'overdue-card' : ''}`}
                                            style={{ 
                                                borderLeft: '4px solid #4CAF50',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                if (hasAttempt) {
                                                    navigate(`/quiz/${quiz.id}/result/${user.id}`);
                                                } else {
                                                    navigate(`/quiz/${quiz.id}/take`);
                                                }
                                            }}
                                        >
                                            <div className="assignment-main">
                                                <h3>📝 {quiz.title}</h3>
                                                <p className="assignment-class">{quiz.className}</p>
                                                <p className="assignment-due">
                                                    {quiz.questions?.length || 0} câu hỏi
                                                    {quiz.timeLimit > 0 && ` • ${quiz.timeLimit} phút`}
                                                </p>
                                                <p className="assignment-due">
                                                    Hạn: {new Date(quiz.dueDate).toLocaleDateString('vi-VN')} {new Date(quiz.dueDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="assignment-status">
                                                {hasAttempt ? (
                                                    <span className="status-badge graded">✓ Đã làm</span>
                                                ) : isOverdue ? (
                                                    <span className="status-badge overdue">Quá hạn</span>
                                                ) : (
                                                    <span className="status-badge pending">Chưa làm</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentDashboard;

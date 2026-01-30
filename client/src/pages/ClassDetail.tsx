import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClassById, getClassAssignments, getClassStudents, getClassQuizzes } from '../services/api';

interface ClassDetailProps {
    user: any;
}

const ClassDetail: React.FC<ClassDetailProps> = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [classData, setClassData] = useState<any>(null);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'assignments' | 'students' | 'quizzes'>('assignments');

    useEffect(() => {
        if (id) {
            loadClassData();
        }
    }, [id]);

    const loadClassData = async () => {
        try {
            setLoading(true);
            const classId = String(id);
            const classInfo = await getClassById(classId);
            setClassData(classInfo);
            
            const assignmentsList = await getClassAssignments(classId);
            setAssignments(assignmentsList);

            // Load quizzes for this class so they are visible on the class page
            try {
                const quizzesList = await getClassQuizzes(classId);
                setQuizzes(quizzesList);
            } catch (err) {
                console.error('Lỗi khi tải quiz của lớp:', err);
                setQuizzes([]);
            }
            
            // Load students for everyone (teacher and student) to get updated student count
            const studentsList = await getClassStudents(classId);
            setStudents(studentsList);
        } catch (error) {
            console.error('Lỗi khi tải thông tin lớp:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="class-detail"><p>Đang tải...</p></div>;
    }

    if (!classData) {
        return <div className="class-detail"><p>Không tìm thấy lớp học!</p></div>;
    }

    return (
        <div className="class-detail">
            <div className="class-detail-header">
                <h1>{classData.name}</h1>
                <div className="class-meta">
                    <span>Mã lớp: <strong>{classData.code}</strong></span>
                    {user.role === 'student' && <span>Giáo viên: {classData.teacherName || 'N/A'}</span>}
                    <span>Sĩ số: {students.length} học sinh</span>
                </div>
            </div>

            <div className="class-tabs">
                <div 
                    className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assignments')}
                    style={{ cursor: 'pointer' }}
                >
                    Bài tập
                </div>
                <div 
                    className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quizzes')}
                    style={{ cursor: 'pointer' }}
                >
                    Quiz
                </div>
                {user.role === 'teacher' && (
                    <div 
                        className={`tab ${activeTab === 'students' ? 'active' : ''}`}
                        onClick={() => setActiveTab('students')}
                        style={{ cursor: 'pointer' }}
                    >
                        Học sinh
                    </div>
                )}
            </div>

            <div className="tab-content">
                {activeTab === 'assignments' && (
                    <>
                        <h2>Danh sách bài tập</h2>
                        {assignments.length === 0 ? (
                            <div className="empty-state-small">
                                <p>Chưa có bài tập nào</p>
                            </div>
                        ) : (
                            <div className="assignment-list">
                                {assignments.map(assignment => (
                                    <div 
                                        key={assignment.id} 
                                        className="assignment-card"
                                        onClick={() => navigate(`/assignment/${assignment.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="assignment-main">
                                            <h3>{assignment.title}</h3>
                                            <p>{assignment.description}</p>
                                            <p>Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                        {user.role === 'teacher' && (
                                            <div className="assignment-status">
                                                <span className="progress-text">{assignment.submitted || 0}/{assignment.total || 0} đã nộp</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'quizzes' && (
                    <>
                        <h2>Quiz Trắc nghiệm</h2>
                        {quizzes.length === 0 ? (
                            <div className="empty-state-small">
                                <p>Chưa có quiz nào</p>
                            </div>
                        ) : (
                            <div className="assignment-list">
                                        {quizzes.map(quiz => (
                                            <div 
                                                key={quiz.id} 
                                                className="assignment-card"
                                                onClick={() => navigate(`/quiz/${quiz.id}/start`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="assignment-main">
                                                    <h3>{quiz.title}</h3>
                                                    <p>{quiz.description}</p>
                                                    <p>Hạn nộp: {new Date(quiz.dueDate).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            </div>
                                        ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'students' && user.role === 'teacher' && (
                    <>
                        <h2>Danh sách học sinh ({students.length})</h2>
                        {students.length === 0 ? (
                            <div className="empty-state-small">
                                <p>Chưa có học sinh nào tham gia lớp</p>
                            </div>
                        ) : (
                            <table className="student-table">
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Tên Học Sinh</th>
                                        <th>Mã Học Sinh</th>
                                        <th>Ngày Tham Gia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr key={student.id}>
                                            <td>{index + 1}</td>
                                            <td>{student.studentName || 'N/A'}</td>
                                            <td>{student.studentId}</td>
                                            <td>{new Date(student.enrolledAt).toLocaleDateString('vi-VN')} {new Date(student.enrolledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ClassDetail;

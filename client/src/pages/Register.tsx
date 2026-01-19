import React, { useState } from 'react';

interface RegisterProps {
    onRegister: (user: any) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'teacher' | 'student'>('student');
    const [classCode, setClassCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Call backend API
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, role, classCode }),
            });

            const data = await response.json();

            if (data.success) {
                // Registration successful
                onRegister(data.user);
            } else {
                setError(data.message || 'Đăng ký thất bại');
            }
        } catch (err) {
            setError('Không thể kết nối đến server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card glassmorphism">
                <h2>Đăng ký tài khoản</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Vai trò</label>
                        <div className="role-selector">
                            <button
                                type="button"
                                className={`role-btn ${role === 'student' ? 'active' : ''}`}
                                onClick={() => setRole('student')}
                            >
                                Học sinh
                            </button>
                            <button
                                type="button"
                                className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
                                onClick={() => setRole('teacher')}
                            >
                                Giáo viên
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="name">Họ và tên</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    {role === 'student' && (
                        <div className="form-group">
                            <label htmlFor="classCode">Mã lớp học (nếu có)</label>
                            <input
                                type="text"
                                id="classCode"
                                value={classCode}
                                onChange={(e) => setClassCode(e.target.value)}
                                placeholder="ABC123"
                            />
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>
                </form>
                <p className="auth-footer">
                    Đã có tài khoản? <a href="#" onClick={(e) => { e.preventDefault(); window.location.href = '/login'; }}>Đăng nhập</a>
                </p>
            </div>
        </div>
    );
};

export default Register;

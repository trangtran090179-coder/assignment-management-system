import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
    user: any;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
            <div className="header-container">
                <div className="logo">
                    <Link to="/">Hệ thống Giao Bài Tập</Link>
                </div>
                <nav className="nav">
                    {user ? (
                        <>
                            <span className="user-info">
                                👤 {user.name} ({user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'})
                            </span>
                            <Link to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} className="nav-link">
                                Dashboard
                            </Link>
                            <button 
                                onClick={toggleTheme}
                                className="btn-theme"
                                title={`Chuyển sang chế độ ${theme === 'dark' ? 'sáng' : 'tối'}`}
                            >
                                {theme === 'dark' ? '☀️' : '🌙'}
                            </button>
                            <button onClick={onLogout} className="btn-logout">Đăng xuất</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Đăng nhập</Link>
                            <Link to="/register" className="btn-register">Đăng ký</Link>
                            <button 
                                onClick={toggleTheme}
                                className="btn-theme"
                                title={`Chuyển sang chế độ ${theme === 'dark' ? 'sáng' : 'tối'}`}
                            >
                                {theme === 'dark' ? '☀️' : '🌙'}
                            </button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
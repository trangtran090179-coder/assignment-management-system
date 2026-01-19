import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div className="landing-page">
            <div className="hero">
                <h1>📚 Hệ thống Giao và Nộp Bài Tập</h1>
                <p className="subtitle">Giải pháp quản lý bài tập hiện đại cho trường THPT</p>
                <div className="cta-buttons">
                    <Link to="/login" className="btn btn-primary">Đăng nhập</Link>
                    <Link to="/register" className="btn btn-secondary">Đăng ký ngay</Link>
                </div>
            </div>
            <div className="features">
                <div className="feature-card">
                    <h3>Dành cho Giáo viên</h3>
                    <ul>
                        <li>Tạo và quản lý lớp học</li>
                        <li>Giao bài tập, đặt hạn nộp</li>
                        <li>Chấm điểm và nhận xét</li>
                        <li>Tải bài học sinh về</li>
                    </ul>
                </div>
                <div className="feature-card">
                    <h3>Dành cho Học sinh</h3>
                    <ul>
                        <li>Tham gia lớp bằng mã</li>
                        <li>Xem bài tập được giao</li>
                        <li>Nộp bài trực tuyến</li>
                        <li>Xem điểm và nhận xét</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Home;
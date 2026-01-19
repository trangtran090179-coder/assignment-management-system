import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
    dueDate: string;
    assignmentTitle: string;
    status?: 'pending' | 'submitted' | 'graded';
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ dueDate, assignmentTitle, status = 'pending' }) => {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        isExpired: boolean;
        percentRemaining: number;
    }>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false,
        percentRemaining: 100
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const dueDateTime = new Date(dueDate).getTime();
            const now = new Date().getTime();
            const difference = dueDateTime - now;

            if (difference <= 0) {
                setTimeLeft({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isExpired: true,
                    percentRemaining: 0
                });
                return;
            }

            // Calculate total time from creation (estimate ~7 days for demo)
            const createdTime = dueDateTime - (7 * 24 * 60 * 60 * 1000); // Assume 7 days assignment
            const totalTime = dueDateTime - createdTime;
            const percentRemaining = Math.round((difference / totalTime) * 100);

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft({
                days,
                hours,
                minutes,
                seconds,
                isExpired: false,
                percentRemaining: Math.max(0, percentRemaining)
            });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [dueDate]);

    // Luôn hiển thị countdown trừ khi đã quá hạn hoặc đã nộp/chấm
    if (status === 'submitted' || status === 'graded' || timeLeft.isExpired) {
        return null;
    }

    const getTimerColor = () => {
        if (timeLeft.isExpired) return '#fc8181'; // Red
        if (timeLeft.days === 0 && timeLeft.hours < 24) return '#f6ad55'; // Orange
        return '#38a169'; // Green
    };

    const getTimerStatus = () => {
        if (timeLeft.isExpired) return 'Đã hết hạn!';
        if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 30) return '⚠️ SẮP HẾT HẠN!';
        if (timeLeft.days === 0 && timeLeft.hours < 24) return '⚠️ Còn dưới 24h';
        return '✓ Còn thời gian';
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(245,245,245,0.9) 100%)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '1.2rem',
            marginTop: '1rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            borderLeft: `4px solid ${getTimerColor()}`
        }}>
            <div style={{ marginBottom: '0.8rem' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.6rem'
                }}>
                    <h4 style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#2d3748'
                    }}>
                        ⏳ {getTimerStatus()}
                    </h4>
                    <span style={{
                        fontSize: '0.85rem',
                        color: '#718096',
                        background: '#edf2f7',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '12px',
                        fontWeight: 600
                    }}>
                        Hạn: {new Date(dueDate).toLocaleDateString('vi-VN')} {new Date(dueDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {/* Progress bar */}
                <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e2e8f0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '0.8rem'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${timeLeft.percentRemaining}%`,
                        background: timeLeft.isExpired
                            ? '#fc8181'
                            : timeLeft.percentRemaining < 20
                            ? '#f6ad55'
                            : 'linear-gradient(90deg, #667eea, #764ba2)',
                        transition: 'width 0.5s ease, background 0.3s ease',
                        borderRadius: '4px'
                    }} />
                </div>
            </div>

            {/* Countdown display */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
                gap: '0.8rem'
            }}>
                <div style={{
                    background: 'rgba(102, 126, 234, 0.1)',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                    <div style={{
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        color: '#667eea',
                        lineHeight: 1
                    }}>
                        {timeLeft.days}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#718096',
                        marginTop: '0.3rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                    }}>
                        Ngày
                    </div>
                </div>

                <div style={{
                    background: 'rgba(102, 126, 234, 0.1)',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                    <div style={{
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        color: '#667eea',
                        lineHeight: 1
                    }}>
                        {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#718096',
                        marginTop: '0.3rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                    }}>
                        Giờ
                    </div>
                </div>

                <div style={{
                    background: 'rgba(102, 126, 234, 0.1)',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                    <div style={{
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        color: '#667eea',
                        lineHeight: 1
                    }}>
                        {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#718096',
                        marginTop: '0.3rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                    }}>
                        Phút
                    </div>
                </div>

                <div style={{
                    background: 'rgba(102, 126, 234, 0.1)',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                    <div style={{
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        color: '#667eea',
                        lineHeight: 1
                    }}>
                        {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#718096',
                        marginTop: '0.3rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                    }}>
                        Giây
                    </div>
                </div>
            </div>

            {/* Status message */}
            {timeLeft.isExpired && (
                <div style={{
                    marginTop: '0.8rem',
                    padding: '0.8rem',
                    background: '#fff5f5',
                    border: '1px solid #fed7d7',
                    borderRadius: '6px',
                    color: '#742a2a',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    textAlign: 'center'
                }}>
                    ❌ Hạn nộp đã kết thúc. Giáo viên có thể không chấp nhận bài nộp muộn.
                </div>
            )}

            {timeLeft.days === 0 && timeLeft.hours < 24 && !timeLeft.isExpired && (
                <div style={{
                    marginTop: '0.8rem',
                    padding: '0.8rem',
                    background: '#fffaf0',
                    border: '1px solid #feebc8',
                    borderRadius: '6px',
                    color: '#744210',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    textAlign: 'center'
                }}>
                    ⚠️ Sắp hết hạn! Hãy nộp bài sớm để tránh lỗi kỹ thuật.
                </div>
            )}
        </div>
    );
};

export default CountdownTimer;

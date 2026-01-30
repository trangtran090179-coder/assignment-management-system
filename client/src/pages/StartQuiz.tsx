import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizById } from '../services/api';

const StartQuiz: React.FC = () => {
    const { quizId } = useParams<{ quizId?: string }>();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await getQuizById(quizId!);
                setQuiz(data);
            } catch (err: any) {
                setError('Không thể tải thông tin quiz: ' + (err?.message || err));
            } finally {
                setLoading(false);
            }
        };
        if (quizId) load();
    }, [quizId]);

    // Remove stray numeric-only text nodes inside the wrapper/card (fixes tiny leftover '1')
    useEffect(() => {
        const selectors = ['.start-quiz-card', '.start-quiz-wrap', '.start-quiz-left', '.start-quiz-right'];
        const elements: Element[] = [];
        selectors.forEach(s => document.querySelectorAll(s).forEach(el => elements.push(el)));

        if (elements.length === 0) return;

        const removeNumericTextNodes = (parent: Node) => {
            parent.childNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const txt = (node.textContent || '').trim();
                    if (/^\d+$/.test(txt)) node.textContent = '';
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // avoid touching interactive controls
                    const el = node as Element;
                    const tag = el.tagName.toLowerCase();
                    if (['script','style','button','input','textarea','select'].includes(tag)) return;
                    removeNumericTextNodes(node);
                }
            });
        };

        try {
            elements.forEach(el => removeNumericTextNodes(el));
        } catch (e) { /* ignore */ }
    }, [quiz]);

    // Observe mutations and remove tiny digit-only nodes added later (robust cleanup)
    useEffect(() => {
        const isTinyDigitElement = (el: Element) => {
            const txt = (el.textContent || '').trim();
            if (!/^\d+$/.test(txt)) return false;
            if (el.children.length > 0) return false;
            const rect = el.getBoundingClientRect();
            if (rect.width > 100 || rect.height > 100) return false;
            return true;
        };

        const checkAndRemove = (node: Node) => {
            try {
                if (node.nodeType === Node.TEXT_NODE) {
                    const t = (node.textContent || '').trim();
                    if (/^\d+$/.test(t)) node.textContent = '';
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node as Element;
                    if (isTinyDigitElement(el)) el.remove();
                    else el.querySelectorAll('*').forEach(ch => {
                        if (ch instanceof Element && isTinyDigitElement(ch)) ch.remove();
                    });
                }
            } catch (e) { /* ignore */ }
        };

        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                m.addedNodes.forEach(n => checkAndRemove(n));
                if (m.type === 'characterData' && m.target) checkAndRemove(m.target as Node);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        return () => observer.disconnect();
    }, []);

    // Aggressive sweep: remove any small element whose whole text is exactly "1".
    useEffect(() => {
        try {
            const candidates = Array.from(document.querySelectorAll('body *')) as Element[];
            const removed: string[] = [];
            candidates.forEach(el => {
                try {
                    const txt = (el.textContent || '').trim();
                    if (txt === '1') {
                        const tag = el.tagName.toLowerCase();
                        if (['script','style','button','input','textarea','select','svg'].includes(tag)) return;
                        const rect = el.getBoundingClientRect();
                        if (rect.width <= 140 && rect.height <= 140) {
                            removed.push(`${tag} ${el.className || ''} ${rect.width}x${rect.height}`);
                            el.remove();
                        }
                    }
                } catch (e) { /* ignore element errors */ }
            });
            if (removed.length) console.info('Removed small-"1" elements:', removed);
        } catch (e) { /* ignore */ }
    }, [quiz]);

    // Remove the specific element the user selected if it contains just '1'
    useEffect(() => {
        const selector = '#root > div > div > div > p';
        const removeIfMatches = () => {
            try {
                const el = document.querySelector(selector) as HTMLElement | null;
                if (!el) return;
                if ((el.textContent || '').trim() === '1') {
                    console.info('Removing stray element by selector', selector);
                    el.remove();
                }
            } catch (e) { /* ignore */ }
        };
        removeIfMatches();
        const obs = new MutationObserver(() => removeIfMatches());
        obs.observe(document.documentElement, { childList: true, subtree: true });
        return () => obs.disconnect();
    }, [quiz]);

    // If there's a tiny standalone element showing just "1" inside the wrapper, remove it.
    useEffect(() => {
        const wrap = document.querySelector('.start-quiz-wrap');
        if (!wrap) return;
        const els = Array.from(wrap.querySelectorAll('*')) as Element[];
        const candidates = els.filter(el => {
            // skip the main card and its contents
            if (el.closest('.start-quiz-card')) return false;
            // skip interactive elements
            const tag = el.tagName.toLowerCase();
            if (['script', 'style', 'button', 'input', 'textarea', 'select', 'svg'].includes(tag)) return false;
            const txt = (el.textContent || '').trim();
            if (txt !== '1') return false;
            if (el.children.length > 0) return false;
            const rect = el.getBoundingClientRect();
            // target small markers only
            if (rect.width > 80 || rect.height > 80) return false;
            return true;
        });
        candidates.forEach(c => c.remove());
    }, [quiz]);

    const handleStart = () => {
        try { localStorage.setItem('inExam', 'true'); } catch (e) {}
        navigate(`/quiz/${quizId}/take?exam=1`);
    };

    if (loading) return <div style={{ padding: 24 }}>⏳ Đang tải...</div>;
    if (error) return (
        <div style={{ padding: 24 }}>
            <div style={{ color: '#c33', marginBottom: 12 }}>{error}</div>
            <button onClick={() => navigate(-1)} className="btn btn-secondary">← Quay lại</button>
        </div>
    );
    if (!quiz) return <div style={{ padding: 24 }}>Không tìm thấy quiz</div>;

    return (
        <div className="start-quiz-wrap">
            <div className="start-quiz-card glassmorphism">
                <h2 className="start-quiz-title">{quiz.title}</h2>
                <div className="start-quiz-code">Mã đề thi: <strong>{quiz.code || quiz.quizCode || '—'}</strong></div>

                <div className="start-quiz-grid">
                    {(
                        [
                            ['⏱', 'Thời gian làm bài', quiz.timeLimit ? `${quiz.timeLimit} phút` : 'Không thời hạn'],
                            ['⏳', 'Thời gian vào thi', quiz.startTime ? new Date(quiz.startTime).toLocaleString('vi-VN') : '—'],
                            ['❓', 'Số lượng câu hỏi', quiz.questions?.length || 0],
                            ['📂', 'Loại đề', quiz.type || 'Trắc nghiệm'],
                            ['👥', 'Tổng lượt đã làm của đề', quiz.attemptsCount ?? quiz.totalAttempts ?? '0 lượt']
                        ]
                    ).map((row, idx) => (
                        <div className="start-quiz-row" key={idx}>
                            <div className="start-quiz-label">{row[0]} <span>{row[1]}</span></div>
                            <div className="start-quiz-value">{row[2]}</div>
                        </div>
                    ))}
                </div>

                <p className="start-quiz-desc">{quiz.description}</p>

                <button className="start-quiz-btn" onClick={handleStart}>Bắt đầu thi</button>
            </div>
        </div>
    );
};

export default StartQuiz;

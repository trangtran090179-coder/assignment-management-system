import { useEffect, useRef } from 'react';
import api from '../services/api';

type EventPayload = { eventType: string; detail?: any; timestamp?: string };

function nowISO() { return new Date().toISOString(); }

export default function useExamMonitor(quizId: string | number, studentId: string | number) {
  const sessionIdRef = useRef<string | null>(null);
  const bufferRef = useRef<EventPayload[]>([]);
  useEffect(() => {
    async function startSession() {
      try {
        const res = await api.post('/anticheat/start', { quizId, studentId });
        sessionIdRef.current = res.data.sessionId;
      } catch (err) {
        console.error('startSession error', err);
      }
    }
    startSession();

    function push(evt: EventPayload) {
      bufferRef.current.push({ ...evt, timestamp: nowISO() });
      if (bufferRef.current.length >= 10) flush();
    }

    async function flush() {
      if (!sessionIdRef.current) return;
      const payload = { sessionId: sessionIdRef.current, events: bufferRef.current.splice(0) };
      try { await api.post('/anticheat/events', payload); } catch (e) { console.error('flush error', e); }
    }

    function handleVisibility() { push({ eventType: document.hidden ? 'tab_hidden' : 'tab_visible' }); }
    function handleFullscreen() { push({ eventType: document.fullscreenElement ? 'fullscreen_enter' : 'fullscreen_exit' }); }
    function handleBlur() { push({ eventType: 'window_blur' }); }
    function handleContext(e: Event) { push({ eventType: 'contextmenu' }); }
    function handleKey(e: KeyboardEvent) { if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p')) push({ eventType: 'suspicious_key', detail: { key: e.key } }); }

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('contextmenu', handleContext);
    window.addEventListener('keydown', handleKey as any);

    const unload = () => {
      if (!sessionIdRef.current) return;
      navigator.sendBeacon('/api/anticheat/end', JSON.stringify({ sessionId: sessionIdRef.current }));
    };
    window.addEventListener('beforeunload', unload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('contextmenu', handleContext);
      window.removeEventListener('keydown', handleKey as any);
      window.removeEventListener('beforeunload', unload);
      flush();
    };
  }, [quizId, studentId]);

  return {
    markQuestionStart: (qId: string | number) => bufferRef.current.push({ eventType: 'question_start', detail: { qId }, timestamp: nowISO() }),
    markQuestionAnswered: (qId: string | number) => bufferRef.current.push({ eventType: 'question_answered', detail: { qId }, timestamp: nowISO() }),
    endSession: async () => {
      if (!sessionIdRef.current) return;
      try { await api.post('/anticheat/end', { sessionId: sessionIdRef.current }); } catch (e) { console.error('endSession', e); }
    }
  };
}

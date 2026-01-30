import { Request, Response } from 'express';
import pool from '../config/mysqlPool';
import { computeRiskScore } from '../services/riskEngine';

export async function startSession(req: Request, res: Response) {
  try {
    const { quizId, studentId, startedAt } = req.body;
    const start = startedAt ? new Date(startedAt) : new Date();
    const [result]: any = await pool.execute(
      'INSERT INTO submissions (quiz_id, student_id, started_at) VALUES (?, ?, ?)',
      [quizId, studentId, start]
    );
    const submissionId = (result as any).insertId;
    res.json({ success: true, submissionId });
  } catch (err) {
    console.error('[anticheat.startSession]', err);
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function recordEvents(req: Request, res: Response) {
  try {
    const { submissionId, events } = req.body;
    if (!Array.isArray(events)) return res.status(400).json({ success: false, message: 'bad payload' });
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const e of events) {
        await conn.query('INSERT INTO activity_logs (submission_id, event_time, event_type, event_detail) VALUES (?, ?, ?, ?)', [submissionId, e.eventTime, e.eventType, JSON.stringify(e.eventDetail || {})]);
      }
      await conn.commit();
      res.json({ success: true });
    } catch (err) {
      await conn.rollback();
      console.error('[anticheat.recordEvents] rollback', err);
      res.status(500).json({ success: false, error: String(err) });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('[anticheat.recordEvents]', err);
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function endSession(req: Request, res: Response) {
  try {
    const { submissionId, endedAt } = req.body;
    const end = endedAt ? new Date(endedAt) : new Date();
    const [rows]: any = await pool.query('SELECT started_at FROM submissions WHERE id = ?', [submissionId]);
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'not found' });
    const startedAt = new Date(rows[0].started_at);
    const duration = Math.round((end.getTime() - startedAt.getTime())/60000);
    // fetch events
    const [eventsRows]: any = await pool.query('SELECT event_type, event_time, event_detail FROM activity_logs WHERE submission_id = ?', [submissionId]);
    const risk = computeRiskScore(submissionId, eventsRows);
    await pool.execute('UPDATE submissions SET ended_at = ?, duration_minutes = ?, risk_score = ?, risk_level = ? WHERE id = ?', [end, duration, risk.score, risk.level, submissionId]);
    res.json({ success: true, durationMinutes: duration, risk });
  } catch (err) {
    console.error('[anticheat.endSession]', err);
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function getReport(req: Request, res: Response) {
  try {
    const submissionId = req.params.submissionId;
    const [sessionRows]: any = await pool.query('SELECT * FROM submissions WHERE id = ?', [submissionId]);
    if (!sessionRows || sessionRows.length === 0) return res.status(404).json({ success: false });
    const [events]: any = await pool.query('SELECT * FROM activity_logs WHERE submission_id = ? ORDER BY event_time', [submissionId]);
    res.json({ success: true, submission: sessionRows[0], events: events });
  } catch (err) {
    console.error('[anticheat.getReport]', err);
    res.status(500).json({ success: false, error: String(err) });
  }
}

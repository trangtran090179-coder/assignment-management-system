type EventRow = { event_type?: string; eventType?: string; event_time?: string; event_detail?: any };

export function computeRiskScore(submissionId: number, events: EventRow[]) {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const t = (e.event_type ?? e.eventType) || 'unknown';
    counts[t] = (counts[t] || 0) + 1;
  }
  let score = 0;
  score += (counts['tab_hide'] || counts['tab_hidden'] || 0) * 2.0;
  score += (counts['fullscreen_exit'] || 0) * 3.0;
  score += (counts['suspicious_key'] || 0) * 4.0;
  score += (counts['contextmenu'] || 0) * 1.0;
  score += (counts['window_blur'] || 0) * 1.5;

  const normalized = Math.min(100, Math.round(score));
  const level = normalized < 10 ? 'normal' : (normalized < 30 ? 'suspicious' : 'high');
  return { score: normalized, level, detail: counts };
}

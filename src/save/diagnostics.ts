/**
 * GSDD Part VI §13: a small local error log, kept only in this browser. Nothing is sent anywhere;
 * the player can read it, copy it into a report and clear it from Settings → Diagnostics.
 */
export type ErrorEntry = { at: string; message: string; where: string };
const KEY = 'joseon:errors';
const MAX = 30;

export function readErrors(): ErrorEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as ErrorEntry[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function logError(e: unknown, where = '') {
  const message = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  try {
    const list = readErrors();
    list.push({ at: new Date().toISOString(), message: message.slice(0, 400), where: where.slice(0, 600) });
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch {
    // Storage may be full or blocked; the error is still shown on screen.
  }
}

export function clearErrors() {
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}

/** Catches errors outside React, such as in timers and audio. */
export function installErrorLog() {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (ev) => logError(ev.error ?? ev.message, `${ev.filename ?? ''}:${ev.lineno ?? ''}`));
  window.addEventListener('unhandledrejection', (ev) => logError(ev.reason, 'promise'));
}

/** Facts about this browser that help explain a report: no personal data. */
export function environment(): string {
  if (typeof navigator === 'undefined') return '';
  return `${navigator.userAgent} · ${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio} · ${navigator.language}`;
}

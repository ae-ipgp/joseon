/**
 * GSDD Part VI §12: offline play. The service worker is registered only for the production build,
 * only over https (or localhost), and only in a top-level window, never inside a frame or a preview.
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const env = (import.meta as unknown as { env?: { PROD?: boolean; BASE_URL?: string } }).env;
  if (!env?.PROD) return;
  let top = false;
  try { top = window.top === window.self; } catch { top = false; }
  const secure = location.protocol === 'https:' || location.hostname === 'localhost';
  if (!top || !secure) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${env.BASE_URL ?? '/'}sw.js`).catch(() => { /* offline play is a bonus, not a requirement */ });
  });
}

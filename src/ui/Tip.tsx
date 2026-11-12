import { useState } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../store/settings';
import { useL } from './kit';

/**
 * GSDD Part V §28: contextual tips, shown once each the first time a part of the game is opened.
 * Which tips were dismissed is a per-browser convenience; turning tips off in Settings hides them all.
 */
const KEY = 'joseon:tips-seen';
const seen = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]; } catch { return []; }
};
const mark = (id: string) => {
  try { localStorage.setItem(KEY, JSON.stringify([...new Set([...seen(), id])])); } catch { /* storage unavailable: the tip simply closes */ }
};
export const resetTips = () => { try { localStorage.removeItem(KEY); } catch { /* nothing */ } };

export function Tip({ id, en, ko, dark }: { id: string; en: string; ko: string; dark?: boolean }) {
  const on = useSettings((s) => s.tips);
  const { L } = useL();
  const [open, setOpen] = useState(() => !seen().includes(id));
  if (!on || !open) return null;
  return (
    <aside className={'tip' + (dark ? ' tip-dark' : '')} role="note">
      <span className="tip-mark ko" lang="ko" aria-hidden="true">道</span>
      <p>{L(en, ko)}</p>
      <button type="button" className="tip-x" aria-label={L('Dismiss tip', '도움말 닫기')} onClick={() => { mark(id); setOpen(false); }}><X size={16} strokeWidth={1.8} /></button>
    </aside>
  );
}

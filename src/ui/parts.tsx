import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { PortraitSpec } from '../model/schemas';
import { Portrait } from './Portrait';
import { useUi } from '../store/ui';

/** A burgundy seal. Marks commitments only. */
export function Seal({ text, size = 54, stamp = false, tilt = -6, label }: { text: string; size?: number; stamp?: boolean; tilt?: number; label?: string }) {
  const lines = text.length > 2 ? [text.slice(0, 2), text.slice(2)] : [text];
  return (
    <span
      className={'seal ko' + (stamp ? ' stamp' : '')}
      lang="ko"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      style={{ width: size, height: size, fontSize: lines.length > 1 ? size * 0.28 : size * 0.5, ['--tilt' as string]: `${tilt}deg` }}
    >
      {lines.length > 1 ? <span>{lines[0]}<br />{lines[1]}</span> : text}
    </span>
  );
}

/** A round crop of a portrait. */
export function Medallion({ spec, size = 64, gone, ring }: { spec?: PortraitSpec; size?: number; gone?: boolean; ring?: string }) {
  if (!spec) return <span className="med empty" style={{ width: size, height: size }} aria-hidden="true" />;
  const w = size * 1.25;
  return (
    <span className={'med' + (gone ? ' gone' : '')} style={{ width: size, height: size, ...(ring ? { boxShadow: ring } : {}) }} aria-hidden="true">
      <Portrait spec={spec} style={{ width: w, height: w * 1.2, left: -(w - size) / 2, top: -size * 0.08 }} />
    </span>
  );
}

export function MoonGate({ spec }: { spec: PortraitSpec }) {
  return (
    <div className="moon-gate" aria-hidden="true">
      <span className="med" style={{ width: '100%', height: '100%' }}>
        <Portrait spec={spec} style={{ width: 240, height: 288, left: -22, top: -22 }} />
      </span>
    </div>
  );
}

/** Paper fibre texture for hanji surfaces. */
export function Fibre({ seed = 4 }: { seed?: number }) {
  const id = 'fibre-' + useId().replace(/:/g, '');
  return (
    <svg className="fibre" aria-hidden="true">
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.16" numOctaves={3} seed={seed} />
        <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.47  0 0 0 0 0.36  0.7 0 0 0 -0.32" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function BrushMeter({ label, value, delta, note }: { label: string; value: number; delta?: string; note?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 15 }}>
          {delta && <span className="up" style={{ fontSize: 13, marginRight: 8 }}>{delta}</span>}
          {value}
        </span>
      </div>
      <div className="brush" style={{ margin: '4px 0' }}>
        <svg viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true" style={{ width: `${Math.max(2, value)}%` }}>
          <path d="M0,7 C10,3 40,2 96,4 L100,7 L96,10 C40,12 10,11 0,8 Z" style={{ fill: 'var(--ink)' }} />
        </svg>
      </div>
      {note && <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--muted-paper)' }}>{note}</p>}
    </div>
  );
}

export function RegardMeter({ value, label, words }: { value: number; label: string; words: [string, string, string] }) {
  const pos = ((value + 100) / 2).toFixed(1);
  return (
    <div style={{ position: 'relative', height: 70, marginTop: 8 }} role="img" aria-label={label}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 20, height: 3, background: 'linear-gradient(90deg, #1B1513 0%, #8C7B66 50%, #6B1626 100%)' }} />
      <div style={{ position: 'absolute', left: '50%', top: 13, width: 1, height: 17, background: 'var(--muted-paper)' }} />
      <div style={{ position: 'absolute', left: `${pos}%`, top: 0, transform: 'translateX(-50%)', transition: 'left .6s cubic-bezier(.2,.8,.2,1)' }}>
        <svg viewBox="0 0 28 48" width="28" height="48" aria-hidden="true" style={{ display: 'block' }}>
          <circle cx="14" cy="4" r="3.6" style={{ fill: 'none', stroke: '#6B1626', strokeWidth: 2 }} />
          <circle cx="24" cy="14" r="3.6" style={{ fill: 'none', stroke: '#6B1626', strokeWidth: 2 }} />
          <circle cx="4" cy="14" r="3.6" style={{ fill: 'none', stroke: '#6B1626', strokeWidth: 2 }} />
          <path d="M14,7 L21,14 L14,21 L7,14 Z" style={{ fill: '#6B1626' }} />
          <rect x="10" y="23" width="8" height="3.5" style={{ fill: '#B08D57' }} />
          <path d="M11,27 L9,47 M14,27 L14,47 M17,27 L19,47" style={{ fill: 'none', stroke: '#6B1626', strokeWidth: 1.4 }} />
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 50, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted-paper)' }}>
        <span>{words[0]}</span><span>{words[1]}</span><span>{words[2]}</span>
      </div>
    </div>
  );
}

/** Right-hand sheet over a scrim. Escape, the scrim and the close button all close it; focus moves in and is kept inside. */
export function Sheet({ title, ko, onClose, closeLabel, children }: { title: string; ko: string; onClose: () => void; closeLabel: string; children: ReactNode }) {
  const ref = useRef<HTMLElement | null>(null);
  const headId = 'sheet-' + useId().replace(/:/g, '');
  useEffect(() => {
    const el = ref.current;
    const prev = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(el?.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])') ?? []);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab') {
        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <>
      <button className="scrim" type="button" aria-label={closeLabel} tabIndex={-1} onClick={onClose} />
      <section ref={ref} className="sheet paper" role="dialog" aria-modal="true" aria-labelledby={headId}>
        <Fibre seed={7} />
        <div className="sheet-body">
          <header className="sheet-head">
            <div>
              <h2 id={headId} className="sheet-title">{title}</h2>
              <p className="ko sheet-ko echo" lang="ko">{ko}</p>
            </div>
            <button className="icon-btn" type="button" aria-label={closeLabel} onClick={onClose}><X size={22} strokeWidth={1.6} /></button>
          </header>
          {children}
        </div>
      </section>
    </>
  );
}

/** Polite live region for one message at a time. */
export function Toast() {
  const toast = useUi((s) => s.toast);
  const clear = useUi((s) => s.clearToast);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(clear, 5200);
    return () => clearTimeout(id);
  }, [toast, clear]);
  return (
    <div aria-live="polite" role="status">
      {toast && <p key={toast.id} className="toast">{toast.text}</p>}
    </div>
  );
}

/** Focus-trapped modal for letters and results. */
export function Modal({ labelledBy, children, className = 'letter paper' }: { labelledBy: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const f = () => Array.from(el?.querySelectorAll<HTMLElement>('button, a[href]') ?? []);
    f()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = f();
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="modal-wrap">
      <section ref={ref} className={className} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </section>
    </div>
  );
}

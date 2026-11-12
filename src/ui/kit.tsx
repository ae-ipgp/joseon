import type { ReactNode } from 'react';
import type { Game, Text } from '../model/schemas';
import { T } from '../engine/text';
import { useT } from '../i18n/useT';
import { useGame } from '../store/game';
import { useUi } from '../store/ui';
import { sfx } from '../audio/sound';

/** Inline bilingual words for the v0.3 screens: L('English', '한국어'). */
export function useL() {
  const { tx, lang } = useT();
  return { L: (en: string, ko: string) => tx(T(en, ko)), tx, lang };
}

/** Runs an engine decision, stores the result and shows its note. */
export function useAct() {
  const apply = useGame((s) => s.apply);
  const toast = useUi((s) => s.showToast);
  const { tx } = useT();
  return (fn: (g: Game) => { game: Game; note: Text | null }, sound: 'stamp' | 'coin' | 'paper' = 'stamp') => {
    const note = apply(fn);
    if (note) {
      toast(tx(note));
      sfx(sound);
    }
    return note;
  };
}

export function Tabs<K extends string>({ tabs, value, onChange, label }: { tabs: [K, string][]; value: K; onChange: (k: K) => void; label: string }) {
  return (
    <div className="tabs kit-tabs" role="group" aria-label={label}>
      {tabs.map(([k, name]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}>{name}</button>
      ))}
    </div>
  );
}

export function Card({ title, ko, children, aside }: { title: string; ko?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="kit-card">
      <header className="kit-card-head">
        <h3>{title}{ko && <span className="ko" lang="ko">{ko}</span>}</h3>
        {aside}
      </header>
      {children}
    </section>
  );
}

/** A labelled 0–100 bar. */
export function Meter({ label, value, note, tone }: { label: string; value: number; note?: string; tone?: 'jade' | 'wine' | 'gold' }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="kit-meter">
      <div className="kit-meter-top"><span>{label}</span><span>{v}</span></div>
      <div className="kit-meter-track"><div className={'kit-meter-fill ' + (tone ?? '')} style={{ width: `${v}%` }} /></div>
      {note && <p className="kit-note">{note}</p>}
    </div>
  );
}

export function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="facts kit-facts">
      {items.map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
}

export function Btn({ children, onClick, disabled, why, tone = 'line' }: { children: ReactNode; onClick: () => void; disabled?: boolean; why?: string | null; tone?: 'line' | 'wine' | 'gold' }) {
  return (
    <button type="button" className={`btn btn-small btn-${tone}`} onClick={onClick} disabled={disabled || !!why} title={why ?? undefined} data-sfx="tap">
      {children}
    </button>
  );
}

export function Why({ text }: { text: string | null | undefined }) {
  return text ? <p className="kit-why">{text}</p> : null;
}

export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

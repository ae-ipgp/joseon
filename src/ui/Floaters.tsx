import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';
import { spendable } from '../engine/money';

/**
 * v0.6: when something changes, it shows: small chips rise from the corner with what moved and by how much
 * (+3 Happiness, −40 nyang). Compares the life before and after each change; says nothing on load or a new life.
 */
type Chip = { id: number; text: string; up: boolean };
const NAMES: Record<string, [string, string]> = {
  health: ['Health', '건강'], happiness: ['Happiness', '행복'], reputation: ['Reputation', '평판'], favour: ['Favour', '총애'],
  honour: ['Honour', '명예'], stress: ['Stress', '근심'], money: ['nyang', '냥'],
};
let seq = 0;

export function Floaters() {
  const lang = useSettings((s) => s.lang);
  const g = useGame((s) => s.game);
  const [chips, setChips] = useState<Chip[]>([]);
  const prev = useRef<{ key: string; v: Record<string, number> } | null>(null);
  useEffect(() => {
    if (!g || !g.player.alive) { prev.current = null; return; }
    const key = `${g.seed}:${g.generation}`;
    const P = g.player;
    const v: Record<string, number> = { health: P.health, happiness: P.happiness, reputation: P.reputation, favour: P.favour, honour: P.honour, stress: P.stress, money: spendable(g) };
    const was = prev.current;
    prev.current = { key, v };
    if (!was || was.key !== key) return;
    const fresh: Chip[] = [];
    for (const k of Object.keys(v)) {
      const d = Math.round(v[k] - was.v[k]);
      if (!d || (k === 'money' && Math.abs(d) < 2)) continue;
      const nm = NAMES[k][lang === 'ko' ? 1 : 0];
      const good = k === 'stress' ? d < 0 : d > 0;
      fresh.push({ id: ++seq, up: good, text: k === 'money' ? `${d > 0 ? '+' : '−'}${Math.abs(d).toLocaleString('en-US')}${lang === 'ko' ? '' : ' '}${nm}` : `${nm} ${d > 0 ? '+' : '−'}${Math.abs(d)}` });
    }
    if (!fresh.length) return;
    const show = fresh.slice(0, 5);
    setChips((c) => [...c.slice(-4), ...show]);
    const ids = new Set(show.map((x) => x.id));
    const timer = setTimeout(() => setChips((c) => c.filter((x) => !ids.has(x.id))), 2600);
    return () => clearTimeout(timer);
  }, [g, lang]);
  if (!chips.length) return null;
  return (
    <div className="floaters" aria-hidden="true">
      {chips.map((c, i) => <span key={c.id} className={'floater ' + (c.up ? 'up' : 'down')} style={{ animationDelay: `${(i % 5) * 90}ms` }}>{c.text}</span>)}
    </div>
  );
}

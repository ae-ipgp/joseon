import { describe, it, expect } from 'vitest';
import { EventZ, PlaceZ } from '../model/content';
import type { Background, Gender } from '../model/schemas';
import { EVENTS } from './events';
import { PLACES } from './places';
import { ERAS, PREMISES } from './campaigns';
import { newGame } from '../engine/newGame';
import { render } from '../engine/tokens';
import { particles } from '../engine/text';

type Text = { en: string; ko?: string };

/** Every bilingual text inside a piece of content. */
function texts(v: unknown, out: Text[] = []): Text[] {
  if (Array.isArray(v)) v.forEach((x) => texts(x, out));
  else if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.en === 'string' && Object.keys(o).every((k) => k === 'en' || k === 'ko')) out.push(o as Text);
    else Object.values(o).forEach((x) => texts(x, out));
  }
  return out;
}

const setups: { mode: 'historical' | 'alternative'; era: number; premise: string | null; gender: Gender; background: Background }[] = [
  ...ERAS.map((e) => ({ mode: 'historical' as const, era: e.year, premise: null, gender: 'woman' as Gender, background: 'noble' as Background })),
  ...PREMISES.map((p) => ({ mode: 'alternative' as const, era: 1724, premise: p.id, gender: 'man' as Gender, background: 'military' as Background })),
  { mode: 'historical', era: 1724, premise: null, gender: 'man', background: 'political' },
  { mode: 'historical', era: 1776, premise: null, gender: 'woman', background: 'royal' },
];

describe('content', () => {
  it('every event and place matches its schema', () => {
    for (const e of EVENTS) expect(EventZ.safeParse(e).success).toBe(true);
    for (const p of PLACES) expect(PlaceZ.safeParse(p).success).toBe(true);
  });

  it('ids are unique and references point somewhere real', () => {
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
    expect(new Set(PLACES.map((p) => p.id)).size).toBe(PLACES.length);
    const places = new Set(PLACES.map((p) => p.id));
    for (const e of EVENTS) expect(places.has(e.place)).toBe(true);
  });

  it('every speaker exists in the world', () => {
    const known = new Set(['narr', 'player']);
    for (const s of setups) {
      const g = newGame({ campaign: { mode: s.mode, era: s.era, premise: s.premise as never }, background: s.background, gender: s.gender, givenName: '', age: 19, colors: { top: '#D8BF73', bottom: '#8E2230' }, seed: 3 });
      Object.keys(g.npcs).forEach((id) => known.add(id));
    }
    const missing = new Set<string>();
    for (const e of EVENTS) {
      const lines = [...e.lines, ...(e.prompt ? [e.prompt] : []), ...e.choices.flatMap((c) => c.reaction)];
      for (const l of lines) if (!known.has(l.who)) missing.add(`${e.id}: ${l.who}`);
    }
    expect([...missing]).toEqual([]);
  });

  it('every story text has Korean', () => {
    const untranslated = texts(EVENTS).filter((t) => !t.ko).map((t) => t.en);
    expect(untranslated).toEqual([]);
    expect(texts(PLACES).filter((t) => !t.ko).map((t) => t.en)).toEqual([]);
  });

  it('settles Korean particles after names', () => {
    expect(particles('운종가(으)로 돌아가기')).toBe('운종가로 돌아가기');
    expect(particles('창덕궁(으)로 가기')).toBe('창덕궁으로 가기');
    expect(particles('강무열(으)로 이어가기')).toBe('강무열로 이어가기');
    expect(particles('한선우이(가) 웃는다')).toBe('한선우가 웃는다');
    expect(particles('설화은(는) 인정전으로 들라')).toBe('설화는 인정전으로 들라');
    expect(particles('백씨 부인이(가) 꽃병을(를) 받는다')).toBe('백씨 부인이 꽃병을 받는다');
  });

  it('every token resolves in both languages, in every campaign', () => {
    const all = [...texts(EVENTS), ...texts(PLACES)];
    const left = new Set<string>();
    for (const s of setups) {
      const g = newGame({ campaign: { mode: s.mode, era: s.era, premise: s.premise as never }, background: s.background, gender: s.gender, givenName: '', age: 19, colors: { top: '#D8BF73', bottom: '#8E2230' }, seed: 5 });
      for (const t of all) for (const lang of ['en', 'ko'] as const) {
        const out = render(t, g, lang);
        const m = out.match(/\{[A-Za-z0-9_]+\}/);
        if (m) left.add(`${lang} ${m[0]} in “${t.en.slice(0, 40)}”`);
      }
    }
    expect([...left]).toEqual([]);
  });
});

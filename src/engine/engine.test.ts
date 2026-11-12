import { describe, it, expect } from 'vitest';
import { GameZ, type Background, type Game, type Gender } from '../model/schemas';
import { addDays, cycleName, zodiac } from './time';
import { newGame } from './newGame';
import { activeEvent, choose, finish, openChoices, readLetter } from './events';
import { activitiesAt, canAct, dismissReport, doActivity, endDay, giveGift, skipPhase, travel, travelCheck } from './day';
import { canPass, passTime } from './season';
import { continueAs, heirsOf, epitaph, measures } from './legacy';
import { apply } from './effects';
import { render } from './tokens';
import { spouseId } from './world';

const life = (o: { gender?: Gender; background?: Background; mode?: 'historical' | 'alternative'; era?: number; seed?: number } = {}) =>
  newGame({
    campaign: o.mode === 'alternative' ? { mode: 'alternative', era: 1724, premise: 'queen' } : { mode: 'historical', era: o.era ?? 1724, premise: null },
    background: o.background ?? 'noble', gender: o.gender ?? 'woman', givenName: '', age: 19,
    colors: { top: '#D8BF73', bottom: '#8E2230' }, seed: o.seed ?? 42,
  });

/** Plays one step the way a careful player might: settle what is open, then act. */
function step(g: Game, pickLast = false): Game {
  if (!g.player.alive) return g;
  if (g.report) return dismissReport(g);
  if (g.letter) return readLetter(g, true).game;
  const e = activeEvent(g);
  if (e) {
    const open = openChoices(g, e);
    if (!open.length) return finish(g);
    const c = pickLast ? open[open.length - 1] : open[0];
    const r = choose(g, c.id);
    return c.again ? r.game : finish(r.game);
  }
  if (g.date.phase === 'evening') return endDay(g);
  if (g.flags['proposals-open'] && !g.favoured && g.proposals.length) return { ...g, favoured: g.proposals[0].npc };
  const a = activitiesAt(g, g.place).find((x) => canAct(g, x));
  return a ? doActivity(g, a.id).game : skipPhase(g);
}

function play(g: Game, steps: number, pickLast = false): Game {
  for (let i = 0; i < steps && g.player.alive; i++) {
    const next = step(g, pickLast);
    if (next === g) throw new Error(`stuck on day ${g.dayCount}, ${g.date.phase}, at ${g.place}`);
    g = next;
  }
  return g;
}

/** Lets years pass, settling whatever the story asks along the way, until the life ends. */
function liveOut(g: Game, pickLast = false): Game {
  for (let i = 0; i < 400 && g.player.alive; i++) {
    g = canPass(g) ? passTime(g, 4) : step(g, pickLast);
  }
  return g;
}

describe('calendar', () => {
  it('names years in the sixty-year cycle', () => {
    expect(cycleName(1724).en).toBe('Gapjin year');
    expect(cycleName(1984).en).toBe('Gapja year');
    expect(cycleName(1724).ko).toBe('갑진년');
    expect(zodiac(1705).en).toBe('Rooster');
  });
  it('rolls days into moons and years', () => {
    expect(addDays({ year: 1724, moon: 12, day: 30, phase: 'evening' }, 1)).toEqual({ year: 1725, moon: 1, day: 1, phase: 'morning' });
    expect(addDays({ year: 1724, moon: 9, day: 29, phase: 'morning' }, 3)).toEqual({ year: 1724, moon: 10, day: 2, phase: 'morning' });
  });
});

describe('a new life', () => {
  it('starts valid, at court, with the opening scene', () => {
    const g = life();
    GameZ.parse(g);
    expect(g.player.birthYear).toBe(1705);
    expect(g.place).toBe('rear-garden');
    expect(g.active?.id).toBe('opening');
    expect(g.npcs.king.name.en).toBe('King Yeongjo');
  });
  it('fills tokens in every opening line in both languages', () => {
    const g = life();
    const e = activeEvent(g)!;
    for (const l of e.lines) for (const lang of ['en', 'ko'] as const) expect(render(l.text, g, lang).includes('{')).toBe(false);
  });
  it('starts the alternative campaign under a queen', () => {
    const g = life({ mode: 'alternative' });
    expect(g.npcs.king.gender).toBe('woman');
    expect(render({ en: '{king}' }, g, 'en')).toBe('Queen Seon');
  });
  it('uses Gyeongbokgung before 1592', () => {
    const g = life({ era: 1418 });
    expect(render({ en: '{palace}' }, g, 'en')).toBe('Gyeongbokgung');
    expect(g.npcs.king.name.en).toBe('King Sejong');
  });
});

describe('a day', () => {
  it('spends a phase on each activity and ends at evening', () => {
    let g = life();
    g = finish(choose(g, 'modest').game);
    expect(g.flags.opened).toBe(true);
    const before = g.date.phase;
    const a = activitiesAt(g, g.place).find((x) => canAct(g, x));
    if (a) {
      g = doActivity(g, a.id).game;
      expect(g.date.phase === before).toBe(false);
    }
  });
  it('charges a phase to leave the palace but not to cross it', () => {
    let g = finish(choose(life(), 'modest').game);
    g = { ...g, active: null };
    expect(travelCheck(g, 'queens-hall').costs).toBe(false);
    expect(travelCheck(g, 'market').costs).toBe(true);
    const phase = g.date.phase;
    const moved = travel(g, 'queens-hall');
    expect(moved.place).toBe('queens-hall');
    if (!moved.active) expect(moved.date.phase).toBe(phase);
  });
  it('gives a liked gift more weight', () => {
    let g = finish(choose(life(), 'modest').game);
    const before = g.rel.grandmother.regard;
    g = giveGift(g, 'grandmother', 'pouch').game;
    expect(g.rel.grandmother.regard - before).toBe(6);
    expect(g.player.gifts.includes('pouch')).toBe(false);
  });
  it('applies effects without changing the original game', () => {
    const g = life();
    const r = apply(g, [{ kind: 'quality', q: 'wit', d: 5 }]);
    expect(r.game.player.qualities.wit).toBe(g.player.qualities.wit + 5);
    expect(r.notes[0].en).toBe('Wit +5');
  });
});

describe('the story', () => {
  it('plays the first weeks without getting stuck, and stays valid', () => {
    const g = play(life(), 160);
    GameZ.parse(g);
    expect(g.flags.opened).toBe(true);
    expect(g.flags['met-kang']).toBe(true);
    expect(g.flags['letter-done']).toBe(true);
  });
  it('plays the other branches too', () => {
    const g = play(life({ gender: 'man', background: 'military', seed: 7 }), 160, true);
    GameZ.parse(g);
    expect(g.flags.opened).toBe(true);
  });
});

describe('a whole life', () => {
  for (const [label, o] of [
    ['a noblewoman in 1724', { gender: 'woman', seed: 11 }],
    ['a soldier’s son in 1724', { gender: 'man', background: 'military', seed: 23 }],
    ['a royal daughter under the queen', { gender: 'woman', background: 'royal', mode: 'alternative', seed: 5 }],
    ['a political son in 1776', { gender: 'man', background: 'political', era: 1776, seed: 99 }],
  ] as const) {
    it(`reaches an ending: ${label}`, () => {
      let g = play(life(o as Parameters<typeof life>[0]), 120);
      g = liveOut(g);
      expect(g.player.alive).toBe(false);
      expect(!!g.ending).toBe(true);
      GameZ.parse(g);
      expect(epitaph(g).en.length > 10).toBe(true);
      expect(measures(g)).toHaveLength(5);
    });
  }

  it('marries, has children, and continues as an heir', () => {
    let found = false;
    for (let seed = 1; seed < 12 && !found; seed++) {
      let g = play(life({ seed }), 120);
      g = liveOut(g);
      const heirs = heirsOf(g);
      if (!spouseId(g) || !heirs.length) continue;
      found = true;
      const next = continueAs(g, heirs[0].id)!;
      GameZ.parse(next);
      expect(next.generation).toBe(2);
      expect(next.player.alive).toBe(true);
      expect(next.ancestors).toHaveLength(1);
      expect(!!next.report).toBe(true);
      expect(next.npcs.king.alive).toBe(true);
      // The second generation can play on and let time pass.
      let h = play(next, 40);
      h = canPass(h) ? passTime(h, 4) : h;
      GameZ.parse(h);
    }
    expect(found).toBe(true);
  });
});

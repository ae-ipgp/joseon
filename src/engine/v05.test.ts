import { describe, it, expect } from 'vitest';
import { newGame, type NewLife } from './newGame';
import { passTime } from './season';
import { dismissReport } from './day';
import { finish, choose } from './events';
import { check } from './conditions';
import { clone } from './world';
import { eventById } from '../content/events';
import { GameZ, type Game, type Npc } from '../model/schemas';
import { migrate } from '../save/storage';
import {
  applyUpbringing, compete, competeBar, contentment, emotionOf, feel, happinessTarget, healthWarning, illnessRisk, inMourning,
  leisureBar, lifeSeason, practise, practiseBar, raise, raiseBar, ribbonFor, setUpbringing, startMourning, syncMilestones,
  treat, treatBar, upbringingOf,
} from './life';
import { abdicate, abdicateBar, decideMemo, lineOfSuccession, memoSeason, reignWords } from './reign';
import { initState, seekBar } from './politics';
import { examChance } from './character';
import { DEFAULT_POST } from '../content/government';
import { T } from './text';

const base: NewLife = { campaign: { mode: 'historical', era: 1724, premise: null }, background: 'noble', gender: 'man', givenName: '', age: 19, colors: { top: '#D8BF73', bottom: '#8E3B46' }, seed: 505 };
const life = (o: Partial<NewLife> = {}) => newGame({ ...base, ...o });
const quiet = () => {};
function calm(g0: Game): Game {
  let g = g0;
  for (let k = 0; k < 10 && (g.report || g.active || g.letter); k++) {
    if (g.report) g = dismissReport(g);
    if (g.active) {
      const e = eventById(g.active.id);
      const c = e?.choices.find((x) => check(x.when, g)) ?? e?.choices[0];
      if (c) g = choose(g, c.id).game;
      g = finish(g);
    }
    if (g.letter) g = { ...g, letter: null };
  }
  return g;
}
const ready = (o: Partial<NewLife> = {}) => calm(life(o));
/** A child of the player, made from the family's own sibling record. */
function child(g: Game, id: string, age: number, gender: 'man' | 'woman' = 'man'): Npc {
  const src = Object.values(g.npcs).find((n) => n.kin === 'sibling') ?? Object.values(g.npcs)[0];
  const n: Npc = { ...structuredClone(src), id, kin: 'child', parents: ['player'], birthYear: g.date.year - age, gender, alive: true, away: false, spouse: null, upbringing: undefined, name: T(`Child ${id}`, `아이 ${id}`), given: T(id, id) };
  g.npcs[id] = n;
  g.rel[id] = { regard: 40, bond: 'none', met: true, moments: [], talked: 0, gifted: 0 };
  return n;
}

describe('saves and the 2D-only build', () => {
  it('upgrades a version 4 save with mood, illness, pastimes and milestones', () => {
    const g = JSON.parse(JSON.stringify(life())) as Record<string, any>;
    for (const k of ['happiness', 'conditions', 'skills', 'practised', 'mourning', 'moodEvent']) delete g.player[k];
    delete g.milestones;
    const up = GameZ.parse(migrate(4, g));
    expect(up.player.happiness).toBe(60);
    expect(up.player.conditions).toEqual([]);
    expect(up.milestones).toEqual([]);
  });
});

describe('mood and contentment (GSDD Part IX §3.3, §15.3)', () => {
  it('names a feeling from events, grief and weariness', () => {
    const g = ready();
    feel(g, 'proud', 5, 30);
    expect(emotionOf(g)).toBe('proud');
    g.player.moodEvent = null;
    g.player.fatigue = 90;
    expect(emotionOf(g)).toBe('exhausted');
    g.player.fatigue = 10;
    startMourning(g, g.npcs.father, quiet);
    expect(emotionOf(g)).toBe('grieving');
    expect(inMourning(g)).toBe(true);
  });
  it('draws happiness toward what the life gives', () => {
    const g = ready({ age: 30 });
    const before = happinessTarget(g);
    child(g, 'k1', 5);
    child(g, 'k2', 3);
    expect(happinessTarget(g)).toBeGreaterThan(before);
    expect(contentment(g).some((s) => s.id === 'children')).toBe(true);
  });
});

describe('illness and treatment (GSDD Part IX §12–13)', () => {
  it('treats an acute illness, refuses a second treatment the same month, and warns of grave ones', () => {
    const g = ready({ age: 30 });
    g.player.conditions.push({ id: 'fever', since: g.dayCount, treated: -1 });
    expect(treatBar(g, 'fever', 'royal')).not.toBe(null);
    const r = treat(g, 'fever', 'herbs');
    expect(r.note).not.toBe(null);
    const still = r.game.player.conditions.find((c) => c.id === 'fever');
    if (still) expect(treatBar(r.game, 'fever', 'herbs')).not.toBe(null);
    g.player.conditions.push({ id: 'smallpox', since: g.dayCount, treated: -1 });
    expect(healthWarning(g)).not.toBe(null);
    expect(illnessRisk(g)).toBeGreaterThan(0.02);
  });
  it('cannot cure a lasting condition, only ease it', () => {
    const g = ready({ age: 60 });
    g.player.conditions = [{ id: 'joints', since: g.dayCount, treated: -1 }];
    const r = treat(g, 'joints', 'physician');
    expect(r.game.player.conditions.some((c) => c.id === 'joints')).toBe(true);
    expect(r.game.player.conditions[0].treated).toBe(g.dayCount);
  });
  it('catches and shakes off illnesses over the seasons without breaking the game', () => {
    let g = ready({ age: 40 });
    let caught = 0;
    for (let i = 0; i < 24 && g.player.alive; i++) {
      g = calm(passTime(g, 1));
      caught = Math.max(caught, g.player.conditions.length);
    }
    expect(() => GameZ.parse(g)).not.toThrow();
    expect(g.player.happiness).toBeGreaterThanOrEqual(0);
  });
});

describe('pastimes (GSDD Part IX §4, §14)', () => {
  it('improves with practice, takes the part of the day, and fades when left alone', () => {
    const g = ready();
    expect(practiseBar(g, 'embroidery')).not.toBe(null);
    const r = practise(g, 'calligraphy');
    expect(r.game.player.skills.calligraphy).toBeGreaterThan(0);
    expect(r.game.date.phase).toBe('afternoon');
    expect(practiseBar(r.game, 'calligraphy')).not.toBe(null);
    const h = clone(r.game);
    h.player.skills.calligraphy = 60;
    h.player.practised.calligraphy = h.dayCount - 400;
    lifeSeason(h, quiet);
    expect(h.player.skills.calligraphy).toBe(59);
  });
  it('lets a skilled player compete once a year, and helps the examinations', () => {
    const g = ready();
    expect(competeBar(g, 'baduk')).not.toBe(null);
    const before = examChance(g, 'munkwa', 'safe');
    g.player.skills.baduk = 70;
    g.player.skills.calligraphy = 80;
    g.player.skills.poetry = 80;
    expect(examChance(g, 'munkwa', 'safe')).toBeGreaterThan(before);
    const r = compete(g, 'baduk');
    expect(r.note).not.toBe(null);
    expect(competeBar(r.game, 'baduk')).not.toBe(null);
  });
});

describe('mourning (GSDD Part VIII §12)', () => {
  it('takes an official from office, blocks festivities, and ends', () => {
    const g = ready({ age: 30 });
    g.player.office = { track: 'civil', rank: 1, post: DEFAULT_POST.civil[0] };
    startMourning(g, g.npcs.father, quiet);
    expect(g.player.mourning?.leave).toBe(true);
    expect(seekBar(g, DEFAULT_POST.civil[0])).not.toBe(null);
    expect(leisureBar(g, 'wine')).not.toBe(null);
    g.dayCount = g.player.mourning!.until + 1;
    lifeSeason(g, quiet);
    expect(g.player.mourning).toBe(null);
  });
});

describe('raising children (GSDD Part IX §11)', () => {
  it('sets an upbringing, limits time with each child to once a season, and passes it on to an heir', () => {
    const g = ready({ age: 35 });
    child(g, 'kid', 8);
    const s = setUpbringing(g, 'kid', 'military', 'strict').game;
    expect(upbringingOf(s.npcs.kid).style).toBe('strict');
    const r = raise(s, 'kid', 'lesson');
    expect(r.game.npcs.kid.upbringing!.progress).toBe(3);
    expect(raiseBar(r.game, 'kid', 'praise')).not.toBe(null);
    let h = r.game;
    for (let i = 0; i < 4; i++) lifeSeason(h, quiet);
    expect(h.npcs.kid.upbringing!.progress).toBeGreaterThan(3);
    const P = structuredClone(h.player);
    P.edu.military = 0;
    applyUpbringing(h.npcs.kid, P);
    expect(P.edu.military).toBeGreaterThan(0);
  });
});

describe('milestones and ribbons (GSDD Part IX §15.4, §17.5)', () => {
  it('records milestones once, dated from the record when it can', () => {
    const g = ready({ age: 34 });
    syncMilestones(g, false);
    const ids = g.milestones.map((m) => m.id);
    expect(ids).toContain('great-exam');
    expect(ids).toContain('first-post');
    const n = g.milestones.length;
    syncMilestones(g, true);
    expect(g.milestones.length).toBe(n);
    const exam = g.milestones.find((m) => m.id === 'great-exam')!;
    expect(exam.year).toBeLessThan(g.date.year);
  });
  it('names a life by what it was', () => {
    const g = ready();
    expect(ribbonFor(g)).toBe('brief');
    g.player.legal = 'commoner';
    expect(ribbonFor(g)).toBe('fallen');
    g.player.legal = 'yangban';
    g.counts.reigned = 1;
    expect(ribbonFor(g)).toBe('sovereign');
  });
});

describe('the throne (GSDD Part X §13, §22, §23)', () => {
  const king = () => {
    const g = ready({ background: 'royal', age: 40 });
    g.player.royal = 'king';
    g.player.legal = 'royal';
    g.pol.state = initState(g, null);
    return g;
  };
  it('brings memorials each season and applies the decision', () => {
    const g = king();
    memoSeason(g, quiet);
    expect(g.pol.state!.memos!.length).toBe(2);
    const m = g.pol.state!.memos![0];
    const r = decideMemo(g, m.id, 'reject');
    expect(r.game.pol.state!.memos!.length).toBe(1);
    expect(r.game.counts.memorials).toBe(1);
    const d = decideMemo(r.game, r.game.pol.state!.memos![0].id, 'delay');
    expect(d.game.pol.state!.memos![0].delayed).toBe(true);
    expect(reignWords(d.game).length).toBeGreaterThan(5);
  });
  it('abdicates only for a grown heir, and keeps the line of succession', () => {
    const g = king();
    expect(abdicateBar(g)).not.toBe(null);
    child(g, 'young', 10);
    expect(abdicateBar(g)).not.toBe(null);
    child(g, 'eldest', 20);
    expect(lineOfSuccession(g).length).toBe(3);
    expect(abdicateBar(g)).toBe(null);
    const r = abdicate(g);
    expect(r.game.player.royal).toBe('none');
    expect(r.game.flags.abdicated).toBe(true);
    expect(r.game.pol.rulers.length).toBe(g.pol.rulers.length + 1);
    expect(() => GameZ.parse(r.game)).not.toThrow();
  });
});

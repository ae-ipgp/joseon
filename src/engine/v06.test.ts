import { describe, it, expect } from 'vitest';
import { newGame, type NewLife } from './newGame';
import { dismissReport } from './day';
import { finish, choose } from './events';
import { check } from './conditions';
import { apply } from './effects';
import { eventById, EVENTS } from '../content/events';
import { GameZ, type Game } from '../model/schemas';
import { migrate } from '../save/storage';
import { adopt, adoptBar, branchOf, compose, composeBar, cultureSeason, pathOf, patron, patronBar, practice, practiceBar, scenarioCheck, setBranch } from './culture';
import { battle } from './politics';
import { SCENARIOS, scenarioById } from '../content/scenarios';
import { PLACES } from '../content/places';
import { MEMOS } from './reign';
import { MISSIONS } from './missions';
import { ACHIEVEMENTS } from '../content/achievements';

const base: NewLife = { campaign: { mode: 'historical', era: 1724, premise: null }, background: 'noble', gender: 'man', givenName: '', age: 25, colors: { top: '#D8BF73', bottom: '#8E3B46' }, seed: 606 };
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
const life = (o: Partial<NewLife> = {}) => calm(newGame({ ...base, ...o }));
const quiet = () => {};

describe('v0.6 saves and content', () => {
  it('upgrades a version 5 save with belief, works, a companion slot and a scenario slot', () => {
    const g = JSON.parse(JSON.stringify(life())) as Record<string, any>;
    for (const k of ['belief', 'works', 'pet']) delete g.player[k];
    delete g.scenario;
    const up = GameZ.parse(migrate(5, g));
    expect(up.player.belief.conviction).toBe(30);
    expect(up.player.works).toEqual([]);
    expect(up.scenario).toBe(null);
  });
  it('has the temple, the law matters, the foreign memorials and Korean for every new scene', () => {
    expect(PLACES.some((p) => p.id === 'temple' && p.scene === 'temple')).toBe(true);
    expect(MISSIONS.filter((m) => m.cat.en === 'Law').length).toBe(3);
    expect(MEMOS.some((m) => m.id === 'castaways')).toBe(true);
    const fresh = EVENTS.filter((e) => e.id.startsWith('v6-'));
    expect(fresh.length).toBeGreaterThanOrEqual(11);
    for (const e of fresh) for (const c of e.choices) expect(!!c.label.ko && !!c.say.ko).toBe(true);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
});

describe('belief, writing, patronage and companions (GSDD Parts XIII and XVI)', () => {
  it('makes a practice kept three times the player’s way, and respects the period', () => {
    let g = life();
    expect(pathOf(g)).toBe(null);
    expect(practiceBar(g, 'western')).not.toBe(null);
    for (let i = 0; i < 3; i++) { g = practice(g, 'sitting').game; g = calm({ ...g, done: [], date: { ...g.date, phase: 'morning' } }); }
    expect(pathOf(g)).toBe('confucian');
    expect(g.player.belief.conviction).toBeGreaterThan(30);
    const late = life({ startYear: 1790, campaign: { mode: 'historical', era: 1790, premise: null } });
    expect(practiceBar(late, 'western')).toBe(null);
  });
  it('lets a poet finish one work a year', () => {
    const g = life();
    expect(composeBar(g, 'poem')).not.toBe(null);
    g.player.skills.poetry = 60;
    const r = compose(g, 'poem');
    expect(r.game.player.works).toHaveLength(1);
    expect(r.game.player.works[0].title.ko).toBeTruthy();
    expect(composeBar(r.game, 'poem')).not.toBe(null);
  });
  it('gives once a season and from the right purse', () => {
    const g = life({ age: 30 });
    g.player.money = 500;
    expect(patronBar(g, 'print')).not.toBe(null);
    const r = patron(g, 'scholar');
    expect(r.game.player.money).toBe(440);
    expect(patronBar(r.game, 'scholar')).not.toBe(null);
  });
  it('takes in one companion, which grows old', () => {
    const g = life();
    g.player.money = 100;
    const r = adopt(g, 'cat');
    expect(r.game.player.pet?.kind).toBe('cat');
    expect(adoptBar(r.game, 'sapsali')).not.toBe(null);
    const h = r.game;
    h.date = { ...h.date, year: h.date.year + 30, moon: 11 };
    cultureSeason(h, quiet);
    expect(h.player.pet).toBe(null);
  });
  it('applies the new scene effects and conditions', () => {
    const g = life();
    const r = apply(g, [{ kind: 'skill', id: 'poetry', d: 30 }, { kind: 'happy', d: 5 }, { kind: 'stress', d: -5 }, { kind: 'pet', pet: 'sapsali' }, { kind: 'ail', id: 'cold' }, { kind: 'practice', id: 'lantern', d: 3 }]).game;
    expect(r.player.skills.poetry).toBe(30);
    expect(r.player.pet?.kind).toBe('sapsali');
    expect(r.player.conditions.some((c) => c.id === 'cold')).toBe(true);
    expect(check({ minSkill: { id: 'poetry', min: 20 }, pet: true, path: 'buddhist' }, r)).toBe(true);
    expect(check({ minReputation: 101 }, r)).toBe(false);
  });
});

describe('scenarios', () => {
  it('defines nine distinct lives that can all begin', () => {
    expect(SCENARIOS).toHaveLength(12);
    for (const s of SCENARIOS) {
      const g = newGame({ ...base, campaign: s.campaign, background: s.background, gender: s.gender === 'any' ? 'woman' : s.gender, age: s.age, scenario: s.id, startYear: s.campaign.mode === 'historical' ? s.campaign.era : undefined });
      expect(g.scenario?.status).toBe('open');
      expect(s.won(g)).toBe(false);
      expect(() => GameZ.parse(JSON.parse(JSON.stringify(g)))).not.toThrow();
      expect(s.progress(g).ko).toBeTruthy();
    }
  });
  it('is won when its goal is met and lost when its time runs out', () => {
    const s = scenarioById('first-on-the-list')!;
    const g = life({ campaign: s.campaign, background: s.background, age: s.age, scenario: s.id });
    scenarioCheck(g);
    expect(g.scenario!.status).toBe('open');
    g.player.quals.push('munkwa');
    scenarioCheck(g);
    expect(g.scenario!.status).toBe('won');
    const h = life({ campaign: s.campaign, background: s.background, age: s.age, scenario: s.id });
    h.date = { ...h.date, year: h.player.birthYear + 31 };
    scenarioCheck(h);
    expect(h.scenario!.status).toBe('lost');
  });
});

describe('the field (GSDD Part XI)', () => {
  it('posts an officer to a branch and offers two more tactics', () => {
    const g = life({ background: 'military', age: 34 });
    expect(g.player.office?.track).toBe('military');
    const r = setBranch(g, 'naval');
    expect(branchOf(r.game)).toBe('naval');
    expect(setBranch(r.game, 'land').note).toBe(null);
    const b = structuredClone(r.game);
    expect(battle(b, 'flank').length).toBeGreaterThan(0);
    expect(battle(b, 'ambush').length).toBeGreaterThan(0);
  });
});

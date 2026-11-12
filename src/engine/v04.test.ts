import { describe, it, expect } from 'vitest';
import { newGame, type NewLife } from './newGame';
import { passTime, die } from './season';
import { heirsOf, continueAs } from './legacy';
import { dismissReport } from './day';
import { finish, choose } from './events';
import { check } from './conditions';
import { examHeld } from './character';
import { heirEligible } from './politics';
import { bends, historySeason, recordDivergence, silenced, biography } from './chronicle2';
import { emit, syncNotes, unread } from './bus';
import { MISSIONS, missionsSeason, resolveMission } from './missions';
import { interact, interactBar, writeLetter, letterBar, reputationDomains, seekFigure, figuresNow } from './social';
import { followRoutine, setRoutine } from './routine';
import { economyMul, mortalityMul } from './difficulty';
import { activitiesAt } from './day';
import { clone } from './world';
import { KINGS } from '../content/history';
import { MONARCHS } from '../content/monarchs';
import { FIGURES } from '../content/figures';
import { ANNALS, FACTION_PROFILES, PERIODS, RULES } from '../content/annals';
import { INSTITUTIONS, conflictIn } from '../content/government';
import { eventById } from '../content/events';
import { GameZ, type Game } from '../model/schemas';
import { T } from './text';
import { importSave, memoryStore, migrate, readSlot, renameSlot, writeSlot, exportSlot } from '../save/storage';

const base: NewLife = { campaign: { mode: 'historical', era: 1724, premise: null }, background: 'noble', gender: 'man', givenName: '', age: 19, colors: { top: '#D8BF73', bottom: '#8E3B46' }, seed: 404 };
const life = (o: Partial<NewLife> = {}) => newGame({ ...base, ...o });
const quiet = () => {};

/** Answers whatever is waiting, as a patient player would: the first open choice, then close the report. */
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
/** Lets seasons pass, answering scenes on the way. */
function live(g0: Game, seasons: number): Game {
  let g = calm(g0);
  for (let i = 0; i < seasons && g.player.alive; i++) g = calm(passTime(g, 1));
  return calm(g);
}

describe('historical data (GSDD Part IV §20 validation)', () => {
  it('has one monarch profile per reign, with consistent dates', () => {
    expect(MONARCHS.length).toBe(KINGS.length);
    MONARCHS.forEach((m, i) => {
      expect(m.born).toBeLessThan(m.from);
      expect(m.from).toBeLessThanOrEqual(m.to);
      expect(m.to).toBeLessThanOrEqual(m.died + 1);
      expect(m.from).toBe(KINGS[i].from[0]);
      if (i > 0) expect(MONARCHS[i - 1].to).toBeLessThanOrEqual(m.from);
    });
  });
  it('keeps every figure’s public life inside their lifetime', () => {
    const ids = new Set<string>();
    for (const f of FIGURES) {
      expect(ids.has(f.id)).toBe(false);
      ids.add(f.id);
      expect(f.born).toBeLessThan(f.died);
      expect(f.active[0]).toBeGreaterThanOrEqual(f.born + 8);
      expect(f.active[1]).toBeLessThanOrEqual(f.died);
    }
  });
  it('dates every annal inside the dynasty, once each', () => {
    const ids = new Set<string>();
    for (const a of ANNALS) {
      expect(ids.has(a.id)).toBe(false);
      ids.add(a.id);
      expect(a.year).toBeGreaterThanOrEqual(1392);
      expect(a.year).toBeLessThanOrEqual(1897);
      expect(a.moon).toBeGreaterThanOrEqual(1);
      expect(a.moon).toBeLessThanOrEqual(12);
    }
  });
  it('gives institutions, laws, factions and periods proper spans', () => {
    for (const i of INSTITUTIONS) if (i.from && i.to) expect(i.from).toBeLessThan(i.to);
    for (const r of RULES) expect(r.from).toBeLessThan(r.to);
    for (const f of FACTION_PROFILES) expect(f.from).toBeLessThan(f.to);
    expect(PERIODS[0].from).toBe(1392);
    expect(PERIODS[PERIODS.length - 1].to).toBe(1897);
    for (let i = 1; i < PERIODS.length; i++) expect(PERIODS[i].from).toBe(PERIODS[i - 1].to);
  });
  it('ends the examinations with the Gabo reforms', () => {
    const g = life({ startYear: 1880, campaign: { mode: 'historical', era: 1880, premise: null } });
    expect(examHeld(g, 1895)).toBe(null);
  });
});

describe('continuity and divergence (GSDD Part IV §17)', () => {
  it('lets strict, limited and dynamic campaigns bend by different amounts', () => {
    const strict = life({ campaign: { mode: 'historical', era: 1724, premise: null, continuity: 'strict' } });
    const limited = life();
    const dynamic = life({ campaign: { mode: 'historical', era: 1724, premise: null, continuity: 'dynamic' } });
    expect(limited.campaign.continuity).toBe('limited');
    expect(bends(strict, 'minor')).toBe(false);
    expect(bends(limited, 'moderate')).toBe(true);
    expect(bends(limited, 'major')).toBe(false);
    expect(bends(dynamic, 'structural')).toBe(true);
  });
  it('keeps the recorded succession under strict continuity', () => {
    const royal = life({ background: 'royal', age: 20, campaign: { mode: 'historical', era: 1724, premise: null, continuity: 'strict' } });
    const open = life({ background: 'royal', age: 20 });
    expect(heirEligible(royal)).toBe(false);
    expect(heirEligible(open)).toBe(true);
  });
  it('averts the 1636 invasion when the player turned it, and records the change', () => {
    const g = life({ startYear: 1636, campaign: { mode: 'historical', era: 1636, premise: null, continuity: 'dynamic' } });
    expect(conflictIn(1637, g.flags)).not.toBe(null);
    g.flags['iv-1636-averted'] = true;
    recordDivergence(g, 'major', T('War came.', '전쟁이 났다.'), T('No war came.', '전쟁이 없었다.'));
    expect(conflictIn(1637, g.flags)).toBe(null);
    expect(silenced(g, 1636, 12)).toBe(true);
    expect(g.pol.divergence.at(-1)?.tag).toBe('major');
    const said: string[] = [];
    historySeason(g, { year: 1636, moon: 10 }, (t) => { said.push(t.en); });
    expect(g.notes.some((n) => n.cat === 'historical')).toBe(true);
  });
  it('offers the 1762 plea only where history may bend that far', () => {
    const e = eventById('iv-sado-1762')!;
    const mk = (continuity: 'limited' | 'dynamic') => {
      const g = life({ startYear: 1762, campaign: { mode: 'historical', era: 1762, premise: null, continuity }, age: 30 });
      g.date.moon = 4;
      g.player.favour = 70;
      g.player.office = { track: 'civil', rank: 2 };
      return g;
    };
    expect(check(e.when, mk('limited'))).toBe(false);
    expect(check(e.when, mk('dynamic'))).toBe(true);
  });
});

describe('determinism and long play (GSDD Part VI §5, §15)', () => {
  it('gives the same campaign from the same seed and choices', () => {
    const a = live(life(), 12);
    const b = live(life(), 12);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('carries a family through generations with a valid game at every step', () => {
    let g = live(life({ age: 19, seed: 77 }), 2);
    let generations = 1;
    for (let round = 0; round < 3; round++) {
      g = live(g, 120);
      if (g.player.alive) { g = clone(g); die(g, quiet); }
      const heirs = heirsOf(g);
      if (!heirs.length) break;
      const next = continueAs(g, heirs[0].id);
      if (!next) break;
      g = calm(next);
      generations++;
      expect(g.lives.length).toBe(generations - 1);
      expect(() => GameZ.parse(g)).not.toThrow();
    }
    expect(generations).toBeGreaterThan(1);
    expect(JSON.stringify(g)).not.toContain('NaN');
    expect(biography(g).length).toBeGreaterThan(0);
  });
});

describe('missions, people and routines (GSDD Part V)', () => {
  it('opens a matter, resolves it one way, and lets an ignored one fail', () => {
    const g = live(life({ age: 25 }), 1);
    const def = MISSIONS.find((m) => m.id === 'audience')!;
    g.player.favour = 60;
    g.missions.push({ id: 'm-test', def: def.id, npc: 'king', opened: g.dayCount, due: g.dayCount + 90, status: 'open', outcome: null });
    const r = resolveMission(g, 'm-test', 'excuse');
    expect(r.game.missions.find((m) => m.id === 'm-test')?.status).toBe('done');
    expect(r.game.player.favour).toBe(56);
    const h = clone(g);
    h.dayCount += 200;
    missionsSeason(h, quiet);
    expect(h.missions.find((m) => m.id === 'm-test')?.status).toBe('failed');
  });
  it('makes interactions count once a day and moves more than affection', () => {
    const g = live(life(), 1);
    const id = Object.keys(g.rel).find((k) => g.rel[k].met && g.npcs[k]?.alive && !g.npcs[k].kin && k !== 'king')!;
    expect(id).toBeTruthy();
    const r = interact(g, id, 'debate');
    expect(r.note).not.toBe(null);
    expect(r.game.rel[id].dims?.respect).not.toBe(undefined);
    expect(interactBar(r.game, id, 'compliment')).not.toBe(null);
  });
  it('sends one letter per person per season', () => {
    const g = live(life(), 1);
    const id = Object.keys(g.rel).find((k) => g.rel[k].met && g.npcs[k]?.alive && k !== 'king')!;
    const r = writeLetter(g, id, 'greeting');
    expect(r.game.mail.length).toBe(g.mail.length + 1);
    expect(letterBar(r.game, id, 'greeting')).not.toBe(null);
  });
  it('follows a routine through a whole day', () => {
    const g = live(life(), 1);
    const a = activitiesAt(g, g.place)[0];
    const set = setRoutine(g, { place: g.place, morning: a?.id ?? null, afternoon: null, evening: null }).game;
    let h = set;
    for (let i = 0; i < 6 && h.dayCount === set.dayCount; i++) h = calm(followRoutine(h, 1).game);
    expect(h.dayCount).toBeGreaterThan(set.dayCount);
  });
  it('reads reputation across domains and lets an older start arrive with a past', () => {
    const g = life({ age: 34 });
    expect(g.player.office?.rank).toBe(2);
    expect(g.player.quals).toContain('munkwa');
    const d = reputationDomains(g);
    expect(d.scholarly).toBeGreaterThan(0);
    expect(Object.values(d).every((v) => v >= 0 && v <= 100)).toBe(true);
  });
  it('lets the player call on a historical figure of the year', () => {
    const g = calm(life({ startYear: 1790, campaign: { mode: 'historical', era: 1790, premise: null }, age: 25 }));
    const f = figuresNow(g).find((x) => x.place === 'academy' || x.place === 'offices')!;
    const r = seekFigure(g, f.id);
    expect(r.note).not.toBe(null);
    expect(seekFigure(r.game, f.id).note).toBe(null);
  });
  it('scales life with the difficulty dials', () => {
    const g = life({ campaign: { mode: 'historical', era: 1724, premise: null, difficulty: { mortality: 'harsh', economy: 'gentle', politics: 'normal', automation: true } } });
    expect(mortalityMul(g)).toBeGreaterThan(1);
    expect(economyMul(g)).toBeGreaterThan(1);
  });
});

describe('event bus, documents and saves (GSDD Part VI §4, §7)', () => {
  it('turns one event into a notice, a document and a memory, without repeating it', () => {
    const g = life();
    const prev = clone(g);
    emit(g, { type: 'OFFICIAL_APPOINTED', text: T('Appointed X.', 'X에 임명'), doc: { title: T('Certificate', '교지'), body: T('Body', '본문') } });
    g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'career', text: T('Appointed X.', 'X에 임명') });
    syncNotes(prev, g);
    expect(g.docs.at(-1)?.seal).toBe('敎旨');
    expect(g.notes.filter((n) => n.text.en === 'Appointed X.').length).toBe(1);
    expect(unread(g)).toBeGreaterThan(0);
  });
  it('keeps a backup of the previous save and falls back to it', () => {
    const store = memoryStore();
    const g = life();
    writeSlot(1, g, store);
    writeSlot(1, live(g, 1), store);
    store.setItem('joseon:save:1', '{broken');
    const r = readSlot(1, store);
    expect(r.view.state).toBe('ok');
    if (r.view.state === 'ok') expect(r.view.restored).toBe(true);
  });
  it('renames, exports and imports a save, checking it on the way in', () => {
    const store = memoryStore();
    const g = life();
    writeSlot(2, g, store);
    expect(renameSlot(2, 'The Han line', store)).toBe(true);
    writeSlot(2, g, store);
    const v = readSlot(2, store).view;
    expect(v.state === 'ok' && v.label).toBe('The Han line');
    const text = exportSlot(2, store)!;
    const r = importSave(text, 3, store);
    expect(r.ok).toBe(true);
    expect(importSave('{"version":4,"game":{}}', 3, store).ok).toBe(false);
  });
  it('upgrades a version 3 save', () => {
    const g = JSON.parse(JSON.stringify(life())) as Record<string, any>;
    for (const k of ['notes', 'missions', 'docs', 'mail', 'routine', 'lives']) delete g[k];
    delete g.player.fatigue;
    delete g.player.stress;
    const up = GameZ.parse(migrate(3, g));
    expect(up.notes).toEqual([]);
    expect(up.player.fatigue).toBe(10);
  });
});

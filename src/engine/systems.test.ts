import { describe, it, expect } from 'vitest';
import { newGame, type NewLife } from './newGame';
import { activitiesAt, travelCheck } from './day';
import { examBar, examHeld, syncQualities } from './character';
import { QUALITY_ATTRS } from '../content/attributes';
import { settleEcon, startBuilding, openBusiness, borrow, holdsKeys, econRole } from './econ';
import { seekBar, accede, decree, joinSide } from './politics';
import { appeal, appealChance, continueAsCommoner, needsDownfallScreen, revoke, restore, follow, submit, openInquiry } from './justice';
import { apply } from './effects';
import { rulerOf } from './time';
import { eraOf } from '../content/campaigns';
import { GameZ } from '../model/schemas';
import { migrate } from '../save/storage';
import { T } from './text';
import type { Game } from '../model/schemas';

const base: NewLife = { campaign: { mode: 'historical', era: 1724, premise: null }, background: 'noble', gender: 'man', givenName: '', age: 19, colors: { top: '#D8BF73', bottom: '#8E3B46' }, seed: 11 };
const life = (o: Partial<NewLife> = {}) => newGame({ ...base, ...o });
const quiet = () => {};

describe('character (GSDD Part I)', () => {
  it('starts in any year from 1392 to 1897 with the right king', () => {
    const g = life({ startYear: 1592, campaign: { mode: 'historical', era: 1592, premise: null } });
    expect(g.date.year).toBe(1592);
    expect(eraOf(1592).king.en).toBe('King Seonjo');
    expect(rulerOf(g).title.en).toBe('King Seonjo');
  });
  it('keeps the headline qualities equal to their attribute groups', () => {
    const g = life({ traits: ['diligent', 'impulsive'] });
    expect(Object.keys(g.player.attrs).length).toBe(24);
    const avg = QUALITY_ATTRS.wit.reduce((n, id) => n + g.player.attrs[id], 0) / QUALITY_ATTRS.wit.length;
    expect(g.player.qualities.wit).toBe(Math.round(avg));
    const r = apply(g, [{ kind: 'quality', q: 'wit', d: 5 }]);
    expect(r.game.player.qualities.wit).toBeGreaterThanOrEqual(g.player.qualities.wit + 4);
    syncQualities(r.game.player);
  });
  it('lets a child live a child’s life: home and lessons, not the palace', () => {
    const g = life({ age: 8 });
    expect(g.place).toBe('residence');
    expect(travelCheck(g, 'rear-garden').ok).toBe(false);
    const acts = activitiesAt(g, 'residence').map((a) => a.id);
    expect(acts).toContain('child-classics');
    expect(acts).not.toContain('accounts');
    expect(econRole(g)).toBe('member');
  });
  it('applies period rules to the examinations', () => {
    expect(examHeld(life(), 1726)).toBe('regular');
    expect(examBar(life({ gender: 'woman' }), 'munkwa')).toBeDefined();
    expect(examBar(life({ gender: 'woman' }), 'munkwa')).not.toBe(null);
    expect(examBar(life({ background: 'royal' }), 'munkwa')).not.toBe(null);
    expect(examBar(life({ background: 'collateral' }), 'munkwa')).toBe(null);
    const sandbox = life({ gender: 'woman', campaign: { mode: 'alternative', era: 1724, premise: 'peace', rules: { womenOffice: true, succession: 'absolute', mobility: 'open', authority: 3, strife: 3, commerce: true } } });
    expect(examBar(sandbox, 'munkwa')).toBe(null);
  });
});

describe('economy (GSDD Part III)', () => {
  it('keeps the family treasury apart from the purse and writes a ledger', () => {
    const g = structuredClone(life());
    const purse = g.player.money;
    settleEcon(g, quiet);
    expect(g.econ.ledger).toHaveLength(1);
    expect(g.player.money).toBeGreaterThanOrEqual(purse);
    expect(g.econ.estates.length).toBeGreaterThan(1);
  });
  it('builds over seasons and only for whoever holds the keys', () => {
    const g0 = life();
    const town = g0.econ.estates.find((e) => e.kind === 'town')!;
    expect(startBuilding(g0, town.id, 'garden').note).toBe(null);
    const g = structuredClone(g0);
    g.npcs.father.alive = false;
    g.econ.role = econRole(g);
    expect(holdsKeys(g)).toBe(true);
    g.econ.treasury = 2000;
    const r = startBuilding(g, town.id, 'garden');
    expect(r.game.econ.treasury).toBe(2000 - 240);
    settleEcon(r.game, quiet);
    expect(r.game.econ.estates.find((e) => e.kind === 'town')!.buildings).toContain('garden');
  });
  it('opens businesses and lends money with interest', () => {
    const g = structuredClone(life());
    g.player.money = 500;
    const b = openBusiness(g, 'inn', 'hanseong', 200, 'purse');
    expect(b.game.econ.businesses).toHaveLength(1);
    expect(b.game.player.reputation).toBe(g.player.reputation - 3);
    const d = borrow(b.game, 'kin', 100, 'purse');
    expect(d.game.econ.debts.length).toBe(b.game.econ.debts.length + 1);
  });
});

describe('politics (GSDD Part II)', () => {
  it('needs a qualification before an appointment', () => {
    const g = structuredClone(life());
    g.pol.vacancies = [{ post: 'seungmunwon-jeongja', until: g.dayCount + 100 }];
    expect(seekBar(g, 'seungmunwon-jeongja')).not.toBe(null);
    g.player.quals.push('munkwa');
    expect(seekBar(g, 'seungmunwon-jeongja')).toBe(null);
    expect(seekBar(g, 'yejo-panseo')).not.toBe(null);
  });
  it('changing sides costs honour', () => {
    const g = life();
    const r = joinSide(g, g.pol.side === 'A' ? 'B' : 'A');
    expect(r.game.player.honour).toBeLessThan(g.player.honour);
  });
  it('a crown prince who accedes changes history and governs', () => {
    const g = structuredClone(life({ background: 'royal' }));
    g.player.royal = 'crownPrince';
    accede(g, quiet);
    expect(g.player.royal).toBe('king');
    expect(g.pol.divergence.length).toBe(1);
    expect(rulerOf(g).title.en.startsWith('King ')).toBe(true);
    const r = decree(g, 'relief');
    expect(r.game.pol.state!.treasury).toBe(g.pol.state!.treasury - 600);
    expect(decree(r.game, 'army').note).toBe(null);
  });
  it('a royal bride becomes crown princess', () => {
    const g = structuredClone(life({ gender: 'woman' }));
    const r = apply(g, [{ kind: 'royal', role: 'crownPrincess' }]);
    expect(r.game.player.royal).toBe('crownPrincess');
    expect(r.game.player.legal).toBe('royal');
    expect(r.game.rel['crown-prince'].bond).toBe('spouse');
  });
});

describe('justice and downfall', () => {
  it('investigations gather evidence of different reliability and close with an outcome', () => {
    const g = structuredClone(life());
    g.player.office = { track: 'civil', rank: 2 };
    const q = openInquiry(g, 'corruption')!;
    expect(q.suspects.length).toBeGreaterThan(1);
    const r = follow(g, q.id, 'witness');
    expect(r.game.pol.inquiries[0].clues).toHaveLength(1);
    const s = submit(r.game, q.id, q.suspects[0]);
    expect(s.game.pol.inquiries[0].outcome).toBeDefined();
  });
  it('losing status is distinct, shows the downfall screen, and restoration is never certain', () => {
    const g = structuredClone(life()) as Game;
    g.player.office = { track: 'civil', rank: 3 };
    revoke(g, T('Framed', '모함'));
    expect(g.player.legal).toBe('commoner');
    expect(g.player.born).toBe('yangban');
    expect(g.player.office).toBe(null);
    expect(needsDownfallScreen(g)).toBe(true);
    const c = continueAsCommoner(g);
    expect(needsDownfallScreen(c)).toBe(false);
    expect(appealChance(c)).toBeLessThan(0.9);
    expect(activitiesAt(c, 'residence').map((a) => a.id)).toContain('copy');
    const a = appeal(c);
    expect(a.note).toBeDefined();
    restore(c, false);
    expect(c.player.legal).toBe('yangban');
  });
});

describe('saves', () => {
  it('a version 2 save upgrades to version 3 and validates', () => {
    const g = life() as unknown as Record<string, any>;
    const old = structuredClone(g);
    delete old.econ;
    delete old.pol;
    for (const k of ['attrs', 'temper', 'edu', 'quals', 'born', 'legal', 'lineage', 'royal', 'honour', 'legitimacy', 'service']) delete old.player[k];
    const up = migrate(2, old);
    expect(GameZ.safeParse(up).success).toBe(true);
  });
});

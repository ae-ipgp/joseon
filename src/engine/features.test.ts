import { describe, it, expect } from 'vitest';
import { settleEcon } from './econ';
import type { Game } from '../model/schemas';
import { newGame, givenText } from './newGame';
import { toHangul, toRoman } from './names';
import { settleSeason, wealthBar, wealthOf, seasonAccounts } from './money';
import { activitiesAt, activityCost, canAct, dismissReport, doActivity, talk, travel } from './day';
import { passTime } from './season';
import { activeEvent, choose, finish, openChoices, readLetter } from './events';
import { checkAchievements } from './achieve';
import { peopleAt } from './world';
import { apply } from './effects';
import { ACHIEVEMENTS } from '../content/achievements';
import { migrate, memoryStore, readSlot, writeSlot } from '../save/storage';
import { readBook, recordHonours } from '../save/honours';
import { T } from './text';

const life = (o: { era?: number; premise?: 'queen' | 'heirs' | 'peace'; gender?: 'woman' | 'man'; name?: string; seed?: number } = {}) =>
  newGame({
    campaign: o.premise ? { mode: 'alternative', era: 1724, premise: o.premise } : { mode: 'historical', era: o.era ?? 1724, premise: null },
    background: 'noble', gender: o.gender ?? 'woman', givenName: o.name ?? '', age: 19,
    colors: { top: '#D8BF73', bottom: '#8E2230' }, seed: o.seed ?? 11,
  });
/** Settles whatever the story has open: reports, letters and scenes, taking the first choice. */
const settle = (g: Game) => {
  let x = g;
  for (let i = 0; i < 60 && (x.report || x.active || x.letter || x.queued); i++) {
    if (x.report) { x = dismissReport(x); continue; }
    if (x.letter) { x = readLetter(x, true).game; continue; }
    const e = activeEvent(x);
    if (!e) break;
    const open = openChoices(x, e);
    if (!open.length) { x = finish(x); continue; }
    const r = choose(x, open[0].id);
    x = r.choice?.again ? r.game : finish(r.game);
  }
  return x;
};
/** Lets seasons pass, settling the story in between. */
const seasons = (g: Game, n: number) => {
  let x = settle(g);
  for (let i = 0; i < n && x.player.alive; i++) x = settle(passTime(x, 1));
  return x;
};

describe('names in both scripts', () => {
  it('reads romanized Korean names into hangul', () => {
    const cases: [string, string][] = [
      ['Giseok', '기석'], ['Kiseok', '기석'], ['Gi-seok', '기석'], ['Seolhwa', '설화'], ['Minjun', '민준'], ['Jiwoo', '지우'],
      ['Haneul', '하늘'], ['Seoyeon', '서연'], ['Hyunwoo', '현우'], ['Byungchul', '병철'], ['Chaewon', '채원'], ['Ha-eun', '하은'],
    ];
    for (const [en, ko] of cases) expect(`${en} ${toHangul(en)}`).toBe(`${en} ${ko}`);
  });
  it('gives other names a loanword reading', () => {
    expect(toHangul('Elizabeth')).toBe('엘리자베스');
    expect(toHangul('Hikmah')).toBe('히크마');
    expect(toHangul('Sarah')).toBe('사라');
  });
  it('romanizes hangul the way the game writes names', () => {
    expect(toRoman('기석')).toBe('Gi-seok');
    expect(toRoman('선우')).toBe('Seon-woo');
    expect(toRoman('환')).toBe('Hwan');
  });
  it('fills both languages from either script, and keeps a chosen spelling', () => {
    expect(givenText('giseok', 'man')).toEqual(T('Giseok', '기석'));
    expect(givenText('기석', 'man')).toEqual(T('Gi-seok', '기석'));
    expect(givenText('Jung', 'man', '중')).toEqual(T('Jung', '중'));
    expect(life({ name: 'Giseok', gender: 'man' }).player.given).toEqual(T('Giseok', '기석'));
  });
});

describe('money', () => {
  it('starts by house and moves through the wealth bands', () => {
    expect(life().player.money).toBeGreaterThan(0);
    expect(wealthOf(100)).toBe('poor');
    expect(wealthOf(800)).toBe('comfortable');
    expect(wealthBar(0)).toBe(0);
    expect(wealthBar(150)).toBe(25);
    expect(wealthBar(100000)).toBe(100);
  });
  it('settles a season in the family treasury, apart from the purse', () => {
    const g = structuredClone(life());
    const lines: { en: string }[] = [];
    settleEcon(g, (t) => { lines.push(t); });
    expect(g.econ.ledger.length).toBe(1);
    expect(lines.some((l) => l.en.startsWith('House accounts '))).toBe(true);
    expect(seasonAccounts(g).total).toBeDefined();
    expect(settleSeason(g)).toHaveLength(0);
  });
  it('charges for purchases and refuses what the purse cannot pay', () => {
    const g = settle(travel(settle(life()), 'market'));
    const poems = activitiesAt(g, 'market').find((a) => a.id === 'buy-poems')!;
    expect(activityCost(poems)).toBe(12);
    const before = g.player.money;
    const r = doActivity(g, 'buy-poems');
    expect(r.game.player.money).toBe(before - 12);
    const poor = structuredClone(g);
    poor.player.money = 5;
    expect(canAct(poor, poems)).toBe(false);
  });
  it('pays a silk shipment back, or loses it, next season', () => {
    let g = structuredClone(settle(travel(settle(life()), 'market')));
    g.player.money = 500;
    g = doActivity(g, 'invest').game;
    expect(g.counts['invest-pending']).toBe(100);
    expect(g.player.money).toBe(400);
    g = seasons(g, 1);
    expect(g.counts['invest-pending']).toBe(0);
  });
});

describe('the wider court', () => {
  it('has royals, officials and servants', () => {
    const g = life();
    for (const id of ['queen-dowager', 'queen-consort', 'crown-prince', 'chief-councillor', 'physician', 'steward', 'maid', 'merchant']) expect(!!g.npcs[id]).toBe(true);
  });
  it('places the crown prince by the historical record', () => {
    const g = life({ era: 1724 });
    expect(g.npcs['crown-prince'].away).toBe(true);
    const later = seasons(g, 8);
    expect(later.npcs['crown-prince'].away).toBe(false);
  });
  it('keeps the royal household by premise', () => {
    const q = life({ premise: 'queen' });
    expect(q.npcs['queen-consort']?.away ?? true).toBe(true);
    expect(q.npcs['grand-queen-dowager'].away).toBe(false);
    const h = life({ premise: 'heirs' });
    expect(h.npcs['elder-prince'].away).toBe(false);
    expect(h.npcs['crown-prince'].away).toBe(true);
  });
  it('turns the queen into the queen dowager when the king dies', () => {
    let g = structuredClone(settle(life({ era: 1776 })));
    g.rel['queen-consort'].regard = 42;
    g.rel['queen-consort'].met = true;
    // Jeongjo's reign ends in 1800.
    for (let i = 0; i < 120 && g.date.year < 1801 && g.player.alive; i++) g = seasons(g, 4);
    if (g.player.alive) {
      expect(g.rel['queen-dowager'].regard).toBe(42);
      expect(g.npcs['grand-queen-dowager'].away).toBe(false);
    }
  });
  it('shows at most four people, and strangers can be met', () => {
    let g = settle(travel(settle(life()), 'queens-hall'));
    const here = peopleAt(g, 'queens-hall');
    expect(here.length).toBeLessThanOrEqual(4);
    const stranger = Object.values(g.npcs).find((n) => n.meet && !g.rel[n.id].met && n.places.length > 0 && !n.away);
    expect(!!stranger).toBe(true);
    g = talk(g, stranger!.id).game;
    expect(g.rel[stranger!.id].met).toBe(true);
  });
  it('fills a post when its holder dies', () => {
    const g = structuredClone(life());
    g.npcs['chief-councillor'].birthYear = g.date.year - 99;
    g.dayCount = 900;
    let x = g;
    for (let i = 0; i < 40 && x.npcs['chief-councillor'].name.en === 'Minister Jo Gyeong-ho' && x.player.alive; i++) x = seasons(x, 1);
    expect(x.npcs['chief-councillor'].alive).toBe(true);
  });
});

describe('achievements', () => {
  it('pays the reward once per life', () => {
    const g = apply(life(), [{ kind: 'flag', flag: 'summoned', v: true }]).game;
    const r = checkAchievements(g);
    expect(r.earned.map((e) => e.def.id)).toContain('audience');
    expect(r.game.player.reputation).toBe(g.player.reputation + 2);
    const again = checkAchievements(r.game);
    expect(again.earned.length).toBe(0);
    expect(again.game).toBe(r.game);
  });
  it('records an ending when a life closes', () => {
    const g = structuredClone(life());
    g.player.alive = false;
    g.ending = 'quiet';
    expect(checkAchievements(g).earned.map((e) => e.def.id)).toContain('ending:quiet');
  });
  it('has unique ids and a seal for every achievement', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) expect(a.seal.length).toBe(1);
  });
  it('keeps a record across lives', () => {
    const store = memoryStore();
    recordHonours(['exam'], T('Yun Seol-hwa', '윤설화'), 1726, store);
    recordHonours(['exam', 'married'], T('Yun Hwan', '윤환'), 1760, store);
    const book = readBook(store);
    expect(book.exam.times).toBe(2);
    expect(book.exam.by.en).toBe('Yun Seol-hwa');
    expect(book.married.times).toBe(1);
  });
});

describe('older saves', () => {
  it('upgrade from version 1', () => {
    const g = structuredClone(life()) as unknown as Record<string, any>;
    delete g.player.money;
    delete g.achieved;
    delete g.counts;
    g.player.given = { en: 'Giseok', ko: 'Giseok' };
    const up = migrate(1, g) as Game;
    expect(typeof up.player.money).toBe('number');
    expect(up.player.given.ko).toBe('기석');
    expect(up.achieved).toEqual([]);

    const store = memoryStore();
    writeSlot(1, life(), store);
    const key = [...store.data.keys()][0];
    const file = JSON.parse(store.data.get(key)!);
    file.version = 1;
    file.game = g;
    store.setItem(key, JSON.stringify(file));
    expect(readSlot(1, store).view.state).toBe('ok');
  });
});

import { spendable } from './money';
import { ADULT_AGE } from '../content/attributes';
import type { Activity } from '../model/content';
import type { Game, Text } from '../model/schemas';
import { PLACES, placeById } from '../content/places';
import { giftName } from '../content/lists';
import { check } from './conditions';
import { applyInPlace } from './effects';
import { begin, deliver, findArrive, findEvening } from './events';
import { processSeason } from './season';
import { T, signed } from './text';
import { PHASES, addDays, playerAge, seasonOf } from './time';
import { clamp, clone } from './world';
import { NIGHT_REST, tireAfter } from './social';

/** Checks for scenes and letters whenever a part of the day begins. */
export function onPhaseStart(g: Game) {
  if (g.date.phase === 'evening') {
    const e = findEvening(g);
    if (e) deliver(g, e);
  } else {
    const e = findArrive(g);
    if (e) begin(g, e);
  }
}

function advance(g: Game) {
  const i = PHASES.indexOf(g.date.phase);
  if (i < PHASES.length - 1) g.date.phase = PHASES[i + 1];
  onPhaseStart(g);
}
/** Moves on to the next part of the day, in place (for pastimes and rest, which are not place activities). */
export const advancePart = (g: Game) => advance(g);

/** Children and commoners see their own activities; adult nobles do not see those. */
export function activityFits(g: Game, a: Activity): boolean {
  const child = playerAge(g) < ADULT_AGE;
  const commoner = g.player.legal === 'commoner';
  if (a.only === 'child') return child;
  if (a.only === 'commoner') return commoner && !child;
  if (child) return !!a.child;
  if (commoner) return !!a.commoner;
  return true;
}
export const activitiesAt = (g: Game, placeId: string): Activity[] => placeById(placeId).activities.filter((a) => activityFits(g, a) && check(a.when, g));

/** What an activity costs in nyang. */
export const activityCost = (a: Activity) => a.effects.reduce((n, e) => n + (e.kind === 'money' && e.d < 0 ? -e.d : e.kind === 'invest' ? e.amount : 0), 0);

export function canAct(g: Game, a: Activity): boolean {
  if (activityCost(a) > spendable(g)) return false;
  if (a.effects.some((e) => e.kind === 'invest') && (g.counts['invest-pending'] ?? 0) > 0) return false;
  return g.date.phase !== 'evening' && !g.done.includes(a.id) && !g.active && !g.letter && !g.report && g.player.alive;
}

export function doActivity(g0: Game, id: string): { game: Game; notes: Text[]; result: Text | null } {
  const a = activitiesAt(g0, g0.place).find((x) => x.id === id);
  if (!a || !canAct(g0, a)) return { game: g0, notes: [], result: null };
  const g = clone(g0);
  const notes = applyInPlace(g, a.effects);
  tireAfter(g, notes);
  g.done.push(a.id);
  advance(g);
  return { game: g, notes, result: a.result ?? null };
}

/** Lets this part of the day pass without doing anything. */
export function skipPhase(g0: Game): Game {
  if (g0.date.phase === 'evening' || g0.active || g0.letter || g0.report) return g0;
  const g = clone(g0);
  advance(g);
  return g;
}

export type TravelCheck = { ok: boolean; reason: Text | null; costs: boolean; here: boolean };
export function travelCheck(g: Game, placeId: string): TravelCheck {
  const to = placeById(placeId);
  const from = placeById(g.place);
  const here = g.place === placeId;
  const costs = !here && to.zone !== from.zone;
  if (here) return { ok: false, reason: T('You are here.', '지금 여기 있다.'), costs, here };
  if (playerAge(g) < ADULT_AGE && !to.child) return { ok: false, reason: T('Children stay at home and at their lessons.', '아이는 집과 글방에 머문다.'), costs, here };
  if (g.player.legal === 'commoner' && !to.commoner) return { ok: false, reason: T('A commoner cannot enter there.', '평민은 그곳에 들어갈 수 없다.'), costs, here };
  if (g.pol.exile && to.zone === 'palace') return { ok: false, reason: T('You are in exile, far from the palace.', '유배 중이라 궁궐에 갈 수 없다.'), costs, here };
  if (g.pol.exile && to.id !== 'residence') return { ok: false, reason: T('In exile you keep to your lodging.', '유배지에서는 처소를 떠날 수 없다.'), costs, here };
  if (to.requires && !check(to.requires, g)) return { ok: false, reason: to.locked ?? T('You cannot go there.', '그곳에는 갈 수 없다.'), costs, here };
  if (g.date.phase === 'evening') return { ok: false, reason: T('The city gates are closed for the night. Go tomorrow.', '밤이라 도성 문이 닫혔다. 내일 가라.'), costs, here };
  if (g.active || g.letter || g.report) return { ok: false, reason: T('Finish what is in front of you first.', '눈앞의 일부터 마무리하라.'), costs, here };
  return { ok: true, reason: null, costs, here };
}

export function travel(g0: Game, placeId: string): Game {
  const c = travelCheck(g0, placeId);
  if (!c.ok) return g0;
  const g = clone(g0);
  g.place = placeId;
  if (c.costs) advance(g);
  else onPhaseStart(g);
  return g;
}

export function talk(g0: Game, npcId: string): { game: Game; line: Text | null; delta: number } {
  const n = g0.npcs[npcId];
  const r = g0.rel[npcId];
  if (!n || !r || !n.alive) return { game: g0, line: null, delta: 0 };
  const g = clone(g0);
  const rel = g.rel[npcId];
  const said = n.talk.length ? n.talk[g.dayCount % n.talk.length] : T('(You exchange a few polite words.)', '(예의 바른 몇 마디를 주고받는다.)');
  // The first time, the player introduces themselves.
  const line = r.met ? said : T(`You bow and introduce yourself to ${n.name.en.replace(/^The /, 'the ')}. ${said.en}`, `${n.name.ko ?? n.name.en}에게 절하고 인사를 올린다. ${said.ko ?? said.en}`);
  let delta = 0;
  if (rel.talked !== g.dayCount) {
    delta = rel.regard >= 60 ? 1 : 2;
    rel.regard = clamp(rel.regard + delta, -100, 100);
    rel.talked = g.dayCount;
    rel.met = true;
    g.counts.talks = (g.counts.talks ?? 0) + 1;
  }
  return { game: g, line, delta };
}

export function canGift(g: Game, npcId: string): boolean {
  const n = g.npcs[npcId];
  const r = g.rel[npcId];
  return !!n && !!r && n.alive && n.giftable && r.gifted !== g.dayCount && g.player.gifts.length > 0;
}

export function giveGift(g0: Game, npcId: string, giftId: string): { game: Game; text: Text | null } {
  if (!canGift(g0, npcId) || !g0.player.gifts.includes(giftId)) return { game: g0, text: null };
  const g = clone(g0);
  const n = g.npcs[npcId];
  const rel = g.rel[npcId];
  g.player.gifts.splice(g.player.gifts.indexOf(giftId), 1);
  const liked = n.likes.includes(giftId);
  const hostile = rel.regard <= -20;
  const delta = hostile ? 1 : liked ? 6 : 2;
  rel.regard = clamp(rel.regard + delta, -100, 100);
  rel.gifted = g.dayCount;
  rel.met = true;
  g.counts.gifts = (g.counts.gifts ?? 0) + 1;
  const gn = giftName(giftId);
  const nm = n.name;
  const text = hostile
    ? T(`${nm.en} accepts the ${gn.en.toLowerCase()} coldly. Regard ${signed(delta)}.`, `${nm.ko ?? nm.en}이(가) ${gn.ko}을(를) 차갑게 받는다. 호감 ${signed(delta)}.`)
    : liked
      ? T(`${nm.en} is delighted with the ${gn.en.toLowerCase()}. Regard ${signed(delta)}.`, `${nm.ko ?? nm.en}이(가) ${gn.ko}을(를) 무척 반긴다. 호감 ${signed(delta)}.`)
      : T(`${nm.en} thanks you politely for the ${gn.en.toLowerCase()}. Regard ${signed(delta)}.`, `${nm.ko ?? nm.en}이(가) ${gn.ko}에 정중히 감사를 표한다. 호감 ${signed(delta)}.`);
  return { game: g, text };
}

/** Ends the evening. Crossing into a new season runs the season's events. */
export function endDay(g0: Game): Game {
  if (g0.date.phase !== 'evening' || g0.active || g0.letter || g0.report || !g0.player.alive) return g0;
  const g = clone(g0);
  const from = { ...g.date };
  g.dayCount += 1;
  g.date = addDays(g.date, 1);
  g.done = [];
  g.player.fatigue = clamp(g.player.fatigue - NIGHT_REST, 0, 100);
  if (seasonOf(g.date.moon) !== seasonOf(from.moon)) processSeason(g, from);
  else onPhaseStart(g);
  return g;
}

/** Closes the season report and starts any scene that was waiting for it. */
export function dismissReport(g0: Game): Game {
  if (!g0.report) return g0;
  const g = clone(g0);
  g.report = null;
  if (!g.player.alive) return g;
  if (g.queued) {
    const id = g.queued;
    g.queued = null;
    const e = EVENT_LOOKUP(id);
    if (e) { begin(g, e); return g; }
  }
  onPhaseStart(g);
  return g;
}

import { eventById as EVENT_LOOKUP } from '../content/events';
export const allPlaces = PLACES;

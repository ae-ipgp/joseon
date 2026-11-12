import type { Choice, GameEvent, Line } from '../model/content';
import type { Game, Text } from '../model/schemas';
import { EVENTS, eventById } from '../content/events';
import { check } from './conditions';
import { ADULT_AGE } from '../content/attributes';
import { placeById } from '../content/places';
import { applyInPlace } from './effects';
import { clone } from './world';

export function eventSeen(g: Game, e: GameEvent): boolean {
  const y = g.seen[e.id];
  if (y === undefined) return false;
  return e.yearly ? y === g.date.year : true;
}
/** Who an event is for: adult nobles by default; children, commoners and monarchs only when it says so. */
export function eventFits(g: Game, e: GameEvent): boolean {
  const age = g.date.year - g.player.birthYear;
  if (age < ADULT_AGE) return !!e.child;
  if (g.player.legal === 'commoner') return !!e.commoner;
  const ruling = g.player.royal === 'king' || g.player.royal === 'regent';
  if (e.monarch) return ruling;
  if (ruling) return false;
  if (g.pol.mission) return false;
  if (g.pol.exile && placeById(e.place).zone === 'palace') return false;
  if (e.child && e.when.maxAge !== undefined && e.when.maxAge < ADULT_AGE) return false;
  return true;
}
const ready = (g: Game, e: GameEvent) => !eventSeen(g, e) && eventFits(g, e) && check(e.when, g);
const busy = (g: Game) => !!(g.active || g.letter || g.report || !g.player.alive);

export function findArrive(g: Game): GameEvent | null {
  if (busy(g) || g.date.phase === 'evening') return null;
  return EVENTS.find((e) => e.delivery === 'arrive' && e.place === g.place && (!e.arrivePhase || e.arrivePhase === g.date.phase) && ready(g, e)) ?? null;
}
export function findEvening(g: Game): GameEvent | null {
  if (busy(g) || g.date.phase !== 'evening') return null;
  return EVENTS.find((e) => (e.delivery === 'evening' || e.delivery === 'letter' || (e.delivery === 'arrive' && e.fallbackEvening)) && ready(g, e)) ?? null;
}
export function findSeason(g: Game): GameEvent | null {
  if (!g.player.alive) return null;
  return EVENTS.find((e) => e.delivery === 'season' && ready(g, e)) ?? null;
}

/** Starts a scene in place: the player is moved to where it happens. */
export function begin(g: Game, e: GameEvent) {
  g.active = { id: e.id, asked: [] };
  g.place = e.place;
  g.seen[e.id] = g.date.year;
  g.letter = null;
}
export function deliver(g: Game, e: GameEvent) {
  if (e.delivery === 'letter') {
    g.letter = e.id;
    g.seen[e.id] = g.date.year;
  } else begin(g, e);
}

export function readLetter(g0: Game, go: boolean): { game: Game; toast: Text | null; notes: Text[] } {
  const e = g0.letter ? eventById(g0.letter) : undefined;
  if (!e?.letter) return { game: g0, toast: null, notes: [] };
  const g = clone(g0);
  g.letter = null;
  let notes: Text[] = [];
  if (go) {
    notes = applyInPlace(g, e.letter.goEffects ?? []);
    if (e.lines.length) begin(g, e);
    return { game: g, toast: e.letter.goToast ?? null, notes };
  }
  notes = applyInPlace(g, e.letter.declineEffects ?? []);
  return { game: g, toast: e.letter.declineToast ?? null, notes };
}

export const activeEvent = (g: Game | null): GameEvent | null => (g?.active ? eventById(g.active.id) ?? null : null);
export const visibleLines = (g: Game, lines: Line[]) => lines.filter((l) => check(l.when, g));
export function openChoices(g: Game, e: GameEvent): Choice[] {
  const asked = g.active?.asked ?? [];
  return e.choices.filter((c) => !asked.includes(c.id) && check(c.when, g));
}

export function choose(g0: Game, choiceId: string): { game: Game; notes: Text[]; choice: Choice | null } {
  const e = activeEvent(g0);
  const c = e?.choices.find((x) => x.id === choiceId);
  if (!e || !c) return { game: g0, notes: [], choice: null };
  const g = clone(g0);
  const notes = applyInPlace(g, c.effects);
  if (c.again && g.active) g.active.asked.push(c.id);
  return { game: g, notes, choice: c };
}

export function finish(g0: Game): Game {
  const g = clone(g0);
  g.active = null;
  return g;
}

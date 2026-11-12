import type { Game, Routine, Text } from '../model/schemas';
import { activitiesAt, canAct, doActivity, endDay, skipPhase, travel, travelCheck } from './day';
import { T } from './text';
import { clone } from './world';

/**
 * GSDD Part V §8 and §32: a daily routine the player sets once and can follow day after day,
 * so ordinary days do not have to be clicked through. It stops whenever something needs the player.
 */

export function setRoutine(g0: Game, r: Routine | null): { game: Game; note: Text | null } {
  const g = clone(g0);
  g.routine = r;
  return { game: g, note: r ? T('Your daily routine is set.', '하루 일과를 정했다.') : T('Routine cleared.', '일과를 지웠다.') };
}

const blocked = (g: Game) => !!(g.active || g.letter || g.report) || !g.player.alive;

/** Follows the routine for the rest of today and closes the day. Returns the notes of what was done. */
export function followRoutine(g0: Game, days = 1): { game: Game; note: Text | null; notes: Text[] } {
  const r = g0.routine;
  if (!r || blocked(g0)) return { game: g0, note: null, notes: [] };
  let g = g0;
  const notes: Text[] = [];
  for (let d = 0; d < days && !blocked(g); d++) {
    const startDay = g.dayCount;
    for (const phase of ['morning', 'afternoon'] as const) {
      if (blocked(g) || g.date.phase !== phase) continue;
      const want = r[phase];
      if (want) {
        if (g.place !== r.place && travelCheck(g, r.place).ok) {
          const before = g.date.phase;
          g = travel(g, r.place);
          if (blocked(g) || g.date.phase !== before) continue;
        }
        const a = activitiesAt(g, g.place).find((x) => x.id === want);
        if (a && canAct(g, a)) {
          const res = doActivity(g, a.id);
          g = res.game;
          notes.push(a.title, ...res.notes);
          continue;
        }
      }
      g = skipPhase(g);
    }
    // Evenings are for scenes and rest; the day closes.
    if (!blocked(g) && g.date.phase === 'evening') g = endDay(g);
    if (g.dayCount === startDay) break;
  }
  const note = notes.length ? T(`Routine: ${notes.slice(0, 4).map((n) => n.en).join('; ')}`, `일과: ${notes.slice(0, 4).map((n) => n.ko ?? n.en).join('; ')}`) : T('You kept to your routine.', '일과대로 하루를 보냈다.');
  return { game: g, note, notes };
}

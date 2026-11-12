import type { Game, Text } from '../model/schemas';
import { ACHIEVEMENTS, rewardEffects, type AchievementDef } from '../content/achievements';
import { applyInPlace } from './effects';
import { clone } from './world';

export type Earned = { def: AchievementDef; notes: Text[] };

/**
 * Checks every achievement not yet earned in this life. Earned ones are recorded on the game
 * and their rewards paid in. Returns the same game object when nothing changed.
 */
export function checkAchievements(g0: Game): { game: Game; earned: Earned[] } {
  const due = ACHIEVEMENTS.filter((a) => !g0.achieved.includes(a.id) && (g0.player.alive || a.cat === 'ending' || a.cat === 'legacy') && safeTest(a, g0));
  if (!due.length) return { game: g0, earned: [] };
  const g = clone(g0);
  const earned: Earned[] = [];
  for (const def of due) {
    g.achieved.push(def.id);
    const notes = def.reward && g.player.alive ? applyInPlace(g, rewardEffects(def.reward)) : [];
    earned.push({ def, notes });
  }
  return { game: g, earned };
}

function safeTest(a: AchievementDef, g: Game): boolean {
  try {
    return a.test(g);
  } catch {
    return false;
  }
}

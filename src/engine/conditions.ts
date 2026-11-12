import { pathOf } from './culture';
import type { Condition } from '../model/content';
import type { Game } from '../model/schemas';
import { playerAge, seasonOf } from './time';
import { everMarried } from './world';
import { examBar, examHeld } from './character';
import { dominant, heirEligible, heirSeat, isMonarch } from './politics';
import { bends, royalPathsOpen, type DivergenceClass } from './chronicle2';
import { ruleActive } from '../content/annals';

/** A year of war: the record in the historical campaign, the sandbox's foreign setting in the alternative one. */
export const atWar = (g: Game) => (g.campaign.mode === 'alternative' && g.campaign.rules?.foreign ? g.campaign.rules.foreign === 'war' : !!conflictIn(g.date.year, g.flags));
import { conflictIn } from '../content/government';
import { holdsKeys } from './econ';

export function check(c: Condition | undefined, g: Game): boolean {
  if (!c) return true;
  if (c.phase && g.date.phase !== c.phase) return false;
  if (c.place && g.place !== c.place) return false;
  if (c.gender && g.player.gender !== c.gender) return false;
  if (c.mode && g.campaign.mode !== c.mode) return false;
  if (c.era !== undefined && (g.campaign.mode !== 'historical' || g.campaign.era !== c.era)) return false;
  if (c.premise && (g.campaign.mode !== 'alternative' || g.campaign.premise !== c.premise)) return false;
  if (c.background && g.house.background !== c.background) return false;
  if (c.generation !== undefined && g.generation !== c.generation) return false;
  if (c.flags) for (const [k, v] of Object.entries(c.flags)) if (!!g.flags[k] !== v) return false;
  if (c.since) {
    const d = g.flagDays[c.since.flag];
    if (!g.flags[c.since.flag] || d === undefined || g.dayCount - d < c.since.days) return false;
  }
  if (c.regard) {
    for (const r of c.regard) {
      const rel = g.rel[r.npc];
      if (!rel) return false;
      if (r.min !== undefined && rel.regard < r.min) return false;
      if (r.max !== undefined && rel.regard > r.max) return false;
    }
  }
  if (c.bond) {
    const rel = g.rel[c.bond.npc];
    if (!rel || !c.bond.is.includes(rel.bond)) return false;
  }
  const age = playerAge(g);
  if (c.minAge !== undefined && age < c.minAge) return false;
  if (c.maxAge !== undefined && age > c.maxAge) return false;
  if (c.married !== undefined && everMarried(g) !== c.married) return false;
  if (c.office !== undefined && !!g.player.office !== c.office) return false;
  if (c.year) {
    if (c.year.from !== undefined && g.date.year < c.year.from) return false;
    if (c.year.to !== undefined && g.date.year > c.year.to) return false;
  }
  if (c.season !== undefined && seasonOf(g.date.moon) !== c.season) return false;
  if (c.minFavour !== undefined && g.player.favour < c.minFavour) return false;
  if (c.minMoney !== undefined && g.player.money < c.minMoney) return false;
  if (c.quality && g.player.qualities[c.quality.q] < c.quality.min) return false;
  if (c.alive) for (const id of c.alive) if (!g.npcs[id]?.alive || g.npcs[id]?.away) return false;
  if (c.met) for (const id of c.met) if (!g.rel[id]?.met) return false;
  if (c.minDay !== undefined && g.dayCount < c.minDay) return false;
  const P = g.player;
  if (c.legal && !c.legal.includes(P.legal)) return false;
  if (c.royal && !c.royal.includes(P.royal)) return false;
  if (c.lineage !== undefined && (P.lineage !== 'none') !== c.lineage) return false;
  if (c.examYear !== undefined && !!examHeld(g) !== c.examYear) return false;
  if (c.canExam !== undefined && (!examBar(g, 'munkwa') || !examBar(g, 'mukwa')) !== c.canExam) return false;
  if (c.qual && !P.quals.includes(c.qual)) return false;
  if (c.noQual && P.quals.includes(c.noQual)) return false;
  if (c.side && !c.side.includes(g.pol.side)) return false;
  if (c.war !== undefined && atWar(g) !== c.war) return false;
  if (c.track && P.office?.track !== c.track) return false;
  if (c.minTier !== undefined && (P.office?.rank ?? 0) < c.minTier) return false;
  if (c.heirEligible !== undefined && heirEligible(g) !== c.heirEligible) return false;
  if (c.bends && (g.campaign.mode !== 'historical' || !bends(g, c.bends as DivergenceClass))) return false;
  if (c.rule && !ruleActive(c.rule, g.date.year)) return false;
  if (c.minReputation !== undefined && g.player.reputation < c.minReputation) return false;
  if (c.path && pathOf(g) !== c.path) return false;
  if (c.minSkill && (g.player.skills[c.minSkill.id] ?? 0) < c.minSkill.min) return false;
  if (c.pet !== undefined && !!g.player.pet !== c.pet) return false;
  if (c.mourning !== undefined && (!!g.player.mourning && g.dayCount < g.player.mourning.until) !== c.mourning) return false;
  if (c.heirSeat !== undefined && heirSeat(g) !== c.heirSeat) return false;
  if (c.selection !== undefined) {
    const cp = g.npcs['crown-prince'];
    const cpi = g.npcs['crown-princess'];
    const open = royalPathsOpen(g) && P.royal === 'none' && P.legal === 'yangban' && !everMarried(g) && !!cp?.alive && !cp.away && (!cpi || cpi.away || !cpi.alive);
    if (open !== c.selection) return false;
  }
  if (c.minLegitimacy !== undefined && P.legitimacy < c.minLegitimacy) return false;
  if (c.exiled !== undefined && !!g.pol.exile !== c.exiled) return false;
  if (c.keys !== undefined && holdsKeys(g) !== c.keys) return false;
  if (c.minAttr && (P.attrs[c.minAttr.a] ?? (c.minAttr.a === 'health' ? P.health : 0)) < c.minAttr.min) return false;
  if (c.minEdu && (P.edu[c.minEdu.field] ?? 0) < c.minEdu.min) return false;
  if (c.monarch !== undefined && isMonarch(g) !== c.monarch) return false;
  if (c.losingSide !== undefined && (g.pol.side !== 'neutral' && g.pol.side !== dominant(g)) !== c.losingSide) return false;
  if (c.any && !c.any.some((x) => check(x, g))) return false;
  if (c.not && check(c.not, g)) return false;
  return true;
}

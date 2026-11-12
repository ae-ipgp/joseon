import type { Game, PastLife, Text } from '../model/schemas';
import { ANNALS, type Annal } from '../content/annals';
import { MONARCHS } from '../content/monarchs';
import { KINGS, reignIndex } from '../content/history';
import { T } from './text';
import { clamp, playerName } from './world';
import { dateKey, rulerOf } from './time';
import { emit } from './bus';
import { ribbonFor } from './life';

/**
 * GSDD Part IV §8, §14–16: the event database runs on the calendar; the player's interventions can bend it
 * as far as the campaign's continuity setting allows; every departure from the record is classified.
 */

type Say = (t: Text, record?: boolean, historical?: boolean) => void;
export type DivergenceClass = 'minor' | 'moderate' | 'major' | 'structural';
export const DIVERGENCE_NAMES: Record<DivergenceClass, Text> = {
  minor: T('Minor divergence', '경미한 변화'), moderate: T('Moderate divergence', '중간 변화'),
  major: T('Major divergence', '중대한 변화'), structural: T('Structural divergence', '구조적 변화'),
};

/** How far history may bend in this campaign: strict holds the record; limited lets the player's own life and moderate changes through; dynamic allows anything. */
export function bends(g: Game, level: DivergenceClass): boolean {
  if (g.campaign.mode === 'alternative') return true;
  const c = g.campaign.continuity ?? 'limited';
  if (c === 'strict') return false;
  if (c === 'dynamic') return true;
  return level === 'minor' || level === 'moderate';
}
/** The player's own royal path (heir, royal bride, regency): personal, but it rewrites the record. */
export const royalPathsOpen = (g: Game) => g.campaign.mode === 'alternative' || (g.campaign.continuity ?? 'limited') !== 'strict';

/** Records a departure from history with its class, the recorded outcome and what happened instead. */
export function recordDivergence(g: Game, cls: DivergenceClass, recorded: Text, instead: Text) {
  const text = T(`${instead.en} (Recorded history: ${recorded.en.charAt(0).toLowerCase()}${recorded.en.slice(1)})`, `${instead.ko} (기록된 역사: ${recorded.ko})`);
  g.pol.divergence.push({ year: g.date.year, moon: g.date.moon, text, tag: cls });
  emit(g, { type: 'DIVERGENCE', text: T(`${DIVERGENCE_NAMES[cls].en}: ${instead.en}`, `${DIVERGENCE_NAMES[cls].ko}: ${instead.ko}`) });
}

const annalAt = (year: number, moon: number) => ANNALS.find((a) => a.year === year && a.moon === moon);
/** Whether an entry of the HISTORY chronicle should stay silent in this campaign. */
export function silenced(g: Game, year: number, moon: number): boolean {
  const a = annalAt(year, moon);
  if (!a) return false;
  if (a.averted && g.flags[a.averted]) return true;
  return !!a.royalLine && g.pol.rulers.length > 0 && dateKey({ year, moon }) >= g.pol.rulers[0].from;
}

function apply(g: Game, a: Annal, scale = 1) {
  const c = a.does;
  if (!c) return;
  for (const p of c.provinces ?? []) {
    const st = g.econ.provinces[p];
    if (st) st.stability = clamp(st.stability + Math.round((c.stability ?? 0) * scale), 10, 95);
  }
  if (scale < 1) return;
  if (c.faction) g.pol.inf[c.faction.side] = clamp(g.pol.inf[c.faction.side] + c.faction.d, 5, 95);
  if (c.favour) g.player.favour = clamp(g.player.favour + c.favour, 0, 100);
  if (c.reputation) g.player.reputation = clamp(g.player.reputation + c.reputation, 0, 100);
}

/** Runs each season for the historical campaign. */
export function historySeason(g: Game, from: { year: number; moon: number; day?: number }, say: Say) {
  if (g.campaign.mode !== 'historical') return;
  const a0 = dateKey(from);
  const b0 = dateKey(g.date);
  for (const a of ANNALS) {
    const k = dateKey({ year: a.year, moon: a.moon });
    if (k <= a0 || k > b0) continue;
    if (a.royalLine && g.pol.rulers.length > 0 && k >= g.pol.rulers[0].from) continue;
    if (a.averted && g.flags[a.averted]) {
      // A prepared kingdom still suffers the Imjin War, but far less.
      if (a.id === 'imjin') apply(g, a, 0.4);
      if (a.instead) say(a.instead, true, true);
      continue;
    }
    apply(g, a);
    // Echoed entries are already told by the chronicle; the others are told here, once.
    if (!a.echo) {
      say(a.text, true, true);
      emit(g, { type: 'HISTORICAL_EVENT_TRIGGERED', text: a.text });
    }
  }
  // A saved Crown Prince Sado, under a dynamic history, takes the throne in 1776 instead of his son.
  const sadoReign = KINGS.findIndex((k) => k.from[0] === 1776);
  if (g.flags['iv-1762-saved'] && !g.pol.rulers.length && sadoReign > 0 && reignIndex(from.year, from.moon) < sadoReign && reignIndex(g.date.year, g.date.moon) >= sadoReign) {
    const title = T('King Jangheon (the former Crown Prince Sado)', '장헌왕 (옛 사도세자)');
    g.pol.rulers.push({ from: dateKey(g.date), title, born: 1735, player: false });
    if (g.npcs.king) Object.assign(g.npcs.king, { name: title, birthYear: 1735, alive: true });
    recordDivergence(g, 'major', T('Yeongjo’s grandson Yi San took the throne as King Jeongjo.', '영조의 손자 이산이 정조로 즉위했다.'), T('The crown prince who was spared in 1762 takes the throne.', '1762년에 목숨을 건진 세자가 보위에 올랐다.'));
    say(T('The old king is dead. The crown prince he once condemned now takes the throne.', '선왕이 승하했다. 한때 선왕이 벌했던 세자가 보위에 오른다.'), true, true);
  }
}

/** The reigning monarch's profile, when the throne is still as history recorded it. */
export function monarchNow(g: Game) {
  if (g.campaign.mode !== 'historical' || g.pol.rulers.some((r) => r.from <= dateKey(g.date))) return null;
  return MONARCHS[reignIndex(g.date.year, g.date.moon)] ?? null;
}

/** A short record of a finished life for the family archive (GSDD Part V §23). */
export function pastLife(g: Game, ending: string | null): PastLife {
  const P = g.player;
  const office = P.office ? `, ${P.office.track === 'civil' ? 'civil' : 'military'} rank ${P.office.rank}` : '';
  const kids = Object.values(g.npcs).filter((n) => n.kin === 'child' && n.parents.includes('player')).length;
  return {
    ribbon: ribbonFor(g),
    name: playerName(g), born: P.birthYear, died: P.diedYear, ending,
    summary: T(`${kids} child${kids === 1 ? '' : 'ren'}${office}; ${g.log.length} recorded events.`, `자녀 ${kids}명${P.office ? `, ${P.office.track === 'civil' ? '문관' : '무관'} ${P.office.rank}단계` : ''}; 기록 ${g.log.length}건.`),
  };
}

/** GSDD Part V §23.2: a biography from what actually happened in the campaign, never invented. */
export function biography(g: Game): Text[] {
  const P = g.player;
  const out: Text[] = [];
  const by = (tag: string) => g.log.filter((l) => l.tag === tag);
  const first = (tag: string) => by(tag)[0];
  const last = (tag: string) => by(tag)[by(tag).length - 1];
  const yr = (y: number) => String(y);
  const nm = playerName(g);
  out.push(T(`${nm.en} was born in ${yr(P.birthYear)} into ${g.house.surname.en} family${P.legal === 'royal' || P.born === 'royal' ? ', of royal blood' : ''}, in the reign of ${rulerOf(g, { year: P.birthYear, moon: 1 }).title.en}.`, `${nm.ko}은(는) ${yr(P.birthYear)}년 ${rulerOf(g, { year: P.birthYear, moon: 1 }).title.ko} 치세에 ${g.house.surname.ko}씨 집안에서 태어났다${P.born === 'royal' ? '. 왕실의 피를 이었다' : ''}.`));
  const edu = first('edu');
  if (edu) out.push(T(`In ${yr(edu.year)}: ${edu.text.en.charAt(0).toLowerCase()}${edu.text.en.slice(1)}`, `${yr(edu.year)}년: ${edu.text.ko}`));
  const c1 = first('career');
  const c2 = last('career');
  if (c1) out.push(T(`Career: ${c1.text.en}${c2 && c2 !== c1 ? ` Later, in ${yr(c2.year)}: ${c2.text.en.charAt(0).toLowerCase()}${c2.text.en.slice(1)}` : ''}`, `관직: ${c1.text.ko}${c2 && c2 !== c1 ? ` 뒤에 ${yr(c2.year)}년: ${c2.text.ko}` : ''}`));
  const fam = by('family').concat(g.log.filter((l) => !l.tag && /married|wed|born to you|child/i.test(l.text.en)));
  if (fam.length) out.push(T(`Family: ${fam.slice(0, 3).map((l) => `${l.text.en} (${l.year})`).join(' ')}`, `가족: ${fam.slice(0, 3).map((l) => `${l.text.ko} (${l.year})`).join(' ')}`));
  const court = by('court');
  if (court.length) out.push(T(`At court: ${court.slice(-3).map((l) => `${l.text.en} (${l.year})`).join(' ')}`, `왕실: ${court.slice(-3).map((l) => `${l.text.ko} (${l.year})`).join(' ')}`));
  const pol = by('politics');
  if (pol.length) out.push(T(`In politics: ${pol.slice(-3).map((l) => `${l.text.en} (${l.year})`).join(' ')}`, `정치: ${pol.slice(-3).map((l) => `${l.text.ko} (${l.year})`).join(' ')}`));
  const wealth = by('wealth');
  if (wealth.length) out.push(T(`Property and business: ${wealth.slice(-3).map((l) => `${l.text.en} (${l.year})`).join(' ')}`, `재산과 사업: ${wealth.slice(-3).map((l) => `${l.text.ko} (${l.year})`).join(' ')}`));
  const down = by('downfall');
  if (down.length) out.push(T(`Fall and recovery: ${down.map((l) => `${l.text.en} (${l.year})`).join(' ')}`, `몰락과 회복: ${down.map((l) => `${l.text.ko} (${l.year})`).join(' ')}`));
  if (!P.alive && P.diedYear) out.push(T(`Died in ${yr(P.diedYear)}.`, `${yr(P.diedYear)}년에 세상을 떠났다.`));
  return out;
}

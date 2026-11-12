import type { Game, GameDate, Phase, Text } from '../model/schemas';
import { KINGS, PALACES, factionsFor, palaceKey, reignIndex } from '../content/history';
import { ALT_FACTIONS, eraOf, premiseOf } from '../content/campaigns';
import { T, ordinal } from './text';

export const PHASES: Phase[] = ['morning', 'afternoon', 'evening'];
export const PHASE_NAMES: Record<Phase, Text> = {
  morning: T('Morning', '아침'),
  afternoon: T('Afternoon', '낮'),
  evening: T('Evening', '저녁'),
};
export const SEASONS: Text[] = [T('Spring', '봄'), T('Summer', '여름'), T('Autumn', '가을'), T('Winter', '겨울')];

/** Lunar months 1–3 are spring, 4–6 summer, 7–9 autumn, 10–12 winter. */
export const seasonOf = (moon: number) => Math.floor((moon - 1) / 3);
export const seasonStart = (season: number) => season * 3 + 1;
export const dateKey = (d: { year: number; moon: number; day?: number }) => (d.year * 12 + (d.moon - 1)) * 30 + ((d.day ?? 1) - 1);

const STEMS: [string, string][] = [['Gap', '갑'], ['Eul', '을'], ['Byeong', '병'], ['Jeong', '정'], ['Mu', '무'], ['Gi', '기'], ['Gyeong', '경'], ['Sin', '신'], ['Im', '임'], ['Gye', '계']];
const BRANCHES: [string, string][] = [['ja', '자'], ['chuk', '축'], ['in', '인'], ['myo', '묘'], ['jin', '진'], ['sa', '사'], ['o', '오'], ['mi', '미'], ['sin', '신'], ['yu', '유'], ['sul', '술'], ['hae', '해']];
const ANIMALS: [string, string][] = [['Rat', '쥐'], ['Ox', '소'], ['Tiger', '호랑이'], ['Rabbit', '토끼'], ['Dragon', '용'], ['Snake', '뱀'], ['Horse', '말'], ['Goat', '양'], ['Monkey', '원숭이'], ['Rooster', '닭'], ['Dog', '개'], ['Pig', '돼지']];
const MOON_WORDS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** The sexagenary year name: 1724 is Gapjin. */
export function cycleName(year: number): Text {
  const s = STEMS[mod(year - 4, 10)];
  const b = BRANCHES[mod(year - 4, 12)];
  return T(`${s[0]}${b[0]} year`, `${s[1]}${b[1]}년`);
}
export function zodiac(year: number): Text {
  const a = ANIMALS[mod(year - 4, 12)];
  return T(a[0], a[1]);
}
export const moonWord = (moon: number) => MOON_WORDS[moon - 1];

/** "Autumn, ninth moon, day 12" */
export function dateLine(d: GameDate | { year: number; moon: number; day: number }): Text {
  const s = SEASONS[seasonOf(d.moon)];
  return T(`${s.en}, ${moonWord(d.moon)} moon, day ${d.day}`, `${s.ko} ${d.moon}월 ${d.day}일`);
}
export function seasonYear(g: Game, d: { year: number; moon: number } = g.date): Text {
  const s = SEASONS[seasonOf(d.moon)];
  const y = yearNumber(g, d.year);
  return T(`${s.en} of ${y.en}`, `${y.ko} ${s.ko}`);
}

/** The year as the player should read it: 1724 in history, a reign year in the alternative campaign. */
export function yearNumber(g: Game, year: number): Text {
  if (g.campaign.mode === 'historical') return T(String(year), `${year}년`);
  const n = year - g.campaign.era + (g.campaign.premise === 'peace' ? 20 : 1);
  const r = premiseOf(g.campaign.premise).ruler;
  return T(`the ${ordinal(n)} year of ${r.en}`, `${r.ko} ${n}년`);
}

/** "1724, Gapjin year" */
export function yearLine(g: Game, year = g.date.year): Text {
  const c = cycleName(year);
  const y = yearNumber(g, year);
  return T(`${g.campaign.mode === 'historical' ? y.en : y.en.charAt(0).toUpperCase() + y.en.slice(1)}, ${c.en}`, `${y.ko}, ${c.ko}`);
}

export function rulerOf(g: Game, d: { year: number; moon: number } = g.date): { title: Text; born: number; ordinal: number } {
  // Once the campaign has left recorded history, its own rulers reign.
  const alt = g.pol?.rulers?.filter((r) => r.from <= dateKey(d)).pop();
  if (alt) return { title: alt.title, born: alt.born, ordinal: 0 };
  if (g.campaign.mode === 'alternative') {
    return { title: premiseOf(g.campaign.premise).ruler, born: g.campaign.era - (g.campaign.premise === 'queen' ? 27 : 46), ordinal: 0 };
  }
  const i = reignIndex(d.year, d.moon);
  return { title: KINGS[i].title, born: KINGS[i].born, ordinal: i + 1 };
}

export function palaceOf(g: Game, year = g.date.year): Text {
  if (g.campaign.mode === 'alternative') return PALACES.cdg;
  return PALACES[palaceKey(year)];
}
export const usesGyeongbokgung = (g: Game, year = g.date.year) => g.campaign.mode === 'historical' && palaceKey(year) === 'gbg';

export function factionsOf(g: Game, year = g.date.year): { a: Text; b: Text } {
  return g.campaign.mode === 'alternative' ? ALT_FACTIONS : factionsFor(year);
}

export function introOf(g: Game): { intro: [Text, Text]; accusation: Text } {
  if (g.campaign.mode === 'alternative') {
    const p = premiseOf(g.campaign.premise);
    return { intro: p.intro, accusation: p.accusation };
  }
  const e = eraOf(g.campaign.era);
  return { intro: e.intro, accusation: e.accusation };
}

export const ageOf = (birthYear: number, year: number) => year - birthYear;
export const playerAge = (g: Game) => g.date.year - g.player.birthYear;

/** Adds days to a date on the simplified 30-day lunar calendar. */
export function addDays(d: GameDate, days: number): GameDate {
  let total = (d.moon - 1) * 30 + (d.day - 1) + days;
  let year = d.year;
  while (total >= 360) { total -= 360; year += 1; }
  return { year, moon: Math.floor(total / 30) + 1, day: (total % 30) + 1, phase: 'morning' };
}

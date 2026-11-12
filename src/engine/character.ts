import { ruleActive } from '../content/annals';
import type { Game, Player, Quality, Text } from '../model/schemas';
import { ADULT_AGE, ATTRS, EDU_FIELDS, QUALITY_ATTRS, QUALS, TRAIT_ATTRS, eduField, stageOf } from '../content/attributes';
import { isRegularExamYear } from '../content/government';
import { T } from './text';
import { clamp, roll } from './world';
import { playerAge, seasonOf } from './time';

/** GSDD Part I §4–8: attributes, ageing, education and examinations. */

type Say = (t: Text, record?: boolean) => void;
const QS: Quality[] = ['wit', 'grace', 'resolve'];

/** The three headline qualities are the averages of their attribute groups. */
export function syncQualities(p: Player) {
  for (const q of QS) {
    const ids = QUALITY_ATTRS[q];
    p.qualities[q] = Math.round(ids.reduce((n, id) => n + (p.attrs[id] ?? 50), 0) / ids.length);
  }
}

/** A quality effect raises every attribute in its group, so the average moves by the same amount. */
export function bumpQuality(p: Player, q: Quality, d: number) {
  for (const id of QUALITY_ATTRS[q]) p.attrs[id] = clamp((p.attrs[id] ?? 50) + d, 0, 100);
  syncQualities(p);
}
export function bumpAttr(p: Player, id: string, d: number) {
  if (id === 'health') p.health = clamp(p.health + d, 0, 100);
  else p.attrs[id] = clamp((p.attrs[id] ?? 50) + d, 0, 100);
  syncQualities(p);
}

/** Starting attributes: the family's qualities, the life so far, a little chance. */
export function makeAttrs(
  seed: (k: string) => number,
  base: { wit: number; grace: number; resolve: number },
  o: { background: string; gender: string; age: number; traits: string[] },
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of ATTRS) {
    const q: Quality = a.group === 'mind' ? 'wit' : a.group === 'social' ? 'grace' : 'resolve';
    let v = a.group === 'body' ? 48 : base[q];
    v += Math.round((seed('attr:' + a.id) - 0.5) * 16);
    out[a.id] = v;
  }
  const bg: Record<string, Record<string, number>> = {
    military: { martial: 14, strength: 8, strategy: 6, courage: 6 },
    scholarly: { scholarship: 12, memory: 6, creativity: 4 },
    noble: { scholarship: 6, etiquette: 6, administration: 4 },
    political: { persuasion: 8, diplomacy: 6, ambition: 6 },
    landed: { administration: 8, empathy: 2, patience: 4 },
    declining: { resilience: 10, ambition: 6, integrity: 2 },
    royal: { etiquette: 10, command: 8, charisma: 4 },
    collateral: { etiquette: 6, patience: 6, judgement: 4 },
  };
  for (const [k, d] of Object.entries(bg[o.background] ?? {})) out[k] += d;
  for (const t of o.traits) for (const [k, d] of Object.entries(TRAIT_ATTRS[t] ?? {})) out[k] += d;
  // Children have more to learn; the scale is the same, they simply start lower in learned skills.
  if (o.age < ADULT_AGE) {
    const youth = (ADULT_AGE - o.age) * 3;
    for (const k of ['scholarship', 'administration', 'strategy', 'judgement', 'martial', 'etiquette', 'strength', 'endurance']) out[k] -= youth;
  }
  for (const k of Object.keys(out)) out[k] = clamp(out[k], 5, 95);
  return out;
}

/** Each spring: the young grow, the old slow down, judgement keeps ripening. */
export function ageing(g: Game, say: Say) {
  if (seasonOf(g.date.moon) !== 0) return;
  const p = g.player;
  const age = playerAge(g);
  const d: Record<string, number> = {};
  if (age < 18) Object.assign(d, { strength: 3, agility: 2, endurance: 3, memory: 1 });
  else if (age >= 60) Object.assign(d, { strength: -2, agility: -2, endurance: -2, martial: -2, memory: -1 });
  else if (age >= 45) Object.assign(d, { strength: -1, agility: -1, endurance: -1, martial: -1 });
  if (age >= 25 && age < 70) d.judgement = (d.judgement ?? 0) + 1;
  if (age >= 35) d.patience = (d.patience ?? 0) + 1;
  for (const [k, v] of Object.entries(d)) p.attrs[k] = clamp((p.attrs[k] ?? 50) + v, 0, 100);
  syncQualities(p);
  if (age === 45) say(T('You notice your bowstring feels heavier than it used to.', '활시위가 예전보다 무겁게 느껴진다.'));
  if (age === 60) say(T('Your sixtieth year. The family holds a hwangap feast in your honour.', '환갑을 맞았다. 식구들이 환갑잔치를 열어 주었다.'), true);
}

// ---------------------------------------------------------------- education

export const focusOf = (p: Player) => EDU_FIELDS[Math.round(p.edu._focus ?? 0)] ?? EDU_FIELDS[0];

/** How quickly study pays off: memory and discipline, a tutor, a study hall or library. */
export function studyRate(g: Game, field: string): number {
  const p = g.player;
  let r = 0.6 + ((p.attrs.memory ?? 50) + (p.attrs.discipline ?? 50)) / 250;
  const town = g.econ.estates.find((e) => e.kind === 'town');
  if (town?.buildings.includes('study')) r += 0.15;
  if (field === 'classics' && town?.buildings.includes('library')) r += 0.2;
  const tutor = g.econ.staff.find((s) => s.role === 'tutor');
  if (tutor) r += tutor.skill / 200;
  if (p.traits.includes('diligent')) r += 0.15;
  if (p.traits.includes('curious')) r += 0.05;
  // A tired mind learns less (GSDD Part V §9).
  if ((p.fatigue ?? 0) >= 70) r *= 0.75;
  return r;
}

/** Adds study to a field and nudges its attributes. Returns a note for the effect list. */
export function study(g: Game, field: string, amount: number): Text {
  const p = g.player;
  const f = eduField(field);
  const gain = Math.max(1, Math.round(amount * studyRate(g, field)));
  p.edu[field] = clamp((p.edu[field] ?? 0) + gain, 0, 100);
  const a = f.attrs[Math.floor(roll(g, 'study-attr:' + field + p.edu[field]) * f.attrs.length)];
  if (roll(g, 'study-up:' + field + p.edu[field]) < 0.5) bumpAttr(p, a, 1);
  return T(`${f.name.en} +${gain}`, `${f.name.ko} +${gain}`);
}

/** Each season: a child learns at home in their chosen field; an adult with a tutor keeps up a little. */
export function seasonStudy(g: Game, say: Say) {
  const p = g.player;
  const age = playerAge(g);
  if (age < 4) return;
  const tutor = g.econ.staff.some((s) => s.role === 'tutor');
  if (age < ADULT_AGE) {
    const f = focusOf(p);
    study(g, f.id, tutor ? 5 : 3);
    for (const other of EDU_FIELDS) if (other.id !== f.id && roll(g, 'side-study:' + other.id) < 0.35) study(g, other.id, 1);
    const before = Math.floor(((p.edu[f.id] ?? 0) - 1) / 20);
    if (Math.floor((p.edu[f.id] ?? 0) / 20) > before && (p.edu[f.id] ?? 0) >= 20) say(T(`Your teachers say you are making real progress in ${f.name.en.toLowerCase()}.`, `스승들이 ${f.name.ko}에 진전이 있다고 칭찬한다.`), true);
  } else if (tutor && age < 30) {
    study(g, focusOf(p).id, 2);
  }
}

// ---------------------------------------------------------------- examinations

/** A special examination is held in some other years, for a royal wedding, a birth or an accession. */
export function examHeld(g: Game, year = g.date.year): 'regular' | 'special' | null {
  // The examinations ended with the Gabo reforms of 1894 (GSDD Part IV §11.1).
  if (g.campaign.mode === 'historical' && !ruleActive('exams', year)) return null;
  if (isRegularExamYear(year)) return 'regular';
  const s = `${g.seed}:special-exam:${year}`;
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 100 < 30 ? 'special' : null;
}

/** Why the player may not sit an examination, or null if they may. Historical restrictions are period rules. */
export function examBar(g: Game, kind: 'munkwa' | 'mukwa' | 'sogwa'): Text | null {
  const p = g.player;
  const rules = g.campaign.rules;
  if (playerAge(g) < ADULT_AGE) return T('You are too young to sit the examinations.', '아직 과거를 볼 나이가 아니다.');
  if (p.legal === 'commoner') return T('Your name was struck from the registers: the examinations are closed to you.', '이름이 사족 명부에서 지워져 과거를 볼 수 없다.');
  if (p.gender === 'woman' && !(g.campaign.mode === 'alternative' && rules?.womenOffice)) return T('Women may not sit the examinations in this age.', '이 시대에 여인은 과거를 볼 수 없다.');
  if ((p.lineage === 'prince' || p.lineage === 'disputed') && !(g.campaign.mode === 'alternative' && rules?.mobility === 'open'))
    return T('Close kin of the king are barred from office by law.', '가까운 종친은 법으로 벼슬길이 막혀 있다.');
  if (p.office && kind !== 'sogwa') return T('You already hold office.', '이미 관직에 있다.');
  if (p.quals.includes(kind)) return T('You have already passed.', '이미 급제했다.');
  return null;
}

/** Chance to pass, from the field studied and the qualities the essay style leans on. */
export function examChance(g: Game, kind: 'munkwa' | 'mukwa' | 'sogwa', style: 'safe' | 'bold' | 'faction' | 'military'): number {
  const p = g.player;
  const Q = p.qualities;
  const field = kind === 'mukwa' ? 'military' : 'classics';
  const edu = p.edu[field] ?? 0;
  const q = style === 'safe' ? Q.wit : style === 'bold' ? (Q.wit + Q.resolve) / 2 + 4 : style === 'faction' ? Q.resolve - 4 : Q.resolve;
  const attr = kind === 'mukwa' ? ((p.attrs.martial ?? 50) + (p.attrs.strength ?? 50)) / 2 : ((p.attrs.scholarship ?? 50) + (p.attrs.memory ?? 50)) / 2;
  const score = q * 0.45 + attr * 0.25 + edu * 0.5 + (p.quals.includes('sogwa') ? 5 : 0) + (kind === 'sogwa' ? 10 : 0);
  // v0.5: a fine hand and verse help the literary examinations; bow and horse the military one.
  const sk = p.skills ?? {};
  const arts = kind === 'mukwa' ? ((sk.archery ?? 0) + (sk.riding ?? 0)) / 2 : ((sk.calligraphy ?? 0) + (sk.poetry ?? 0)) / 2;
  return clamp((score - 38) / 40 + arts / 600, 0.05, 0.92);
}

export const qualName = (id: string): Text => QUALS[id]?.name ?? T(id);

// ---------------------------------------------------------------- objectives

export type Objective = { id: string; text: Text; done: boolean; progress?: number };

/** Current aims for the dashboard, drawn from stage and station (Master §15.1 "current objectives"). */
export function objectives(g: Game): Objective[] {
  const p = g.player;
  const age = playerAge(g);
  const out: Objective[] = [];
  const add = (id: string, text: Text, done: boolean, progress?: number) => out.push({ id, text, done, progress });
  if (!p.alive) return out;
  if (p.legal === 'commoner') {
    const d = g.pol.downfall;
    add('proof', T('Gather proof of what was done to you', '억울함을 밝힐 증거를 모으라'), (d?.proof ?? 0) >= 60, Math.min(1, (d?.proof ?? 0) / 60));
    add('appeal', T('Petition for restoration', '신원을 청원하라'), false);
    add('provide', T('Keep your family fed: 100 nyang in hand', '식구를 먹여 살리라: 100냥 모으기'), p.money >= 100, Math.min(1, p.money / 100));
    return out;
  }
  if (age < ADULT_AGE) {
    const f = focusOf(p);
    add('study', T(`Reach “Grounded” in ${f.name.en.toLowerCase()}`, `${f.name.ko} ‘기초’ 단계에 이르기`), (p.edu[f.id] ?? 0) >= 15, Math.min(1, (p.edu[f.id] ?? 0) / 15));
    add('come-of-age', T('Come of age at fifteen', '열다섯 살 관례(계례)를 치르기'), false, age / ADULT_AGE);
    return out;
  }
  if (p.royal === 'king' || p.royal === 'regent') {
    const s = g.pol.state;
    add('authority', T('Keep royal authority above 50', '왕권을 50 이상으로 지키기'), (s?.authority ?? 0) >= 50, Math.min(1, (s?.authority ?? 0) / 50));
    add('treasury', T('Fill the state treasury to 5,000 nyang', '국고를 5,000냥까지 채우기'), (s?.treasury ?? 0) >= 5000, Math.min(1, (s?.treasury ?? 0) / 5000));
    if (p.royal === 'king') add('heir', T('Name a crown heir', '세자를 책봉하기'), !!s?.heir);
    return out;
  }
  if (p.lineage !== 'none' && p.legal === 'royal' && p.royal === 'none' && p.gender === 'man') {
    add('legitimacy', T('Build your legitimacy to 60', '정통성을 60까지 높이기'), p.legitimacy >= 60, Math.min(1, p.legitimacy / 60));
    add('favour', T('Win royal favour of 60', '임금의 총애 60 얻기'), p.favour >= 60, Math.min(1, p.favour / 60));
  }
  const married = Object.values(g.rel).some((r) => r.bond === 'spouse');
  if (!married) add('marry', T('Arrange a good marriage', '좋은 혼처를 정하기'), false);
  if (!examBar(g, 'munkwa') || !examBar(g, 'mukwa')) {
    const field = p.attrs.martial > (p.attrs.scholarship ?? 0) ? 'military' : 'classics';
    add('exam', T(`Pass the ${field === 'military' ? 'military' : 'civil'} examination`, `${field === 'military' ? '무과' : '문과'}에 급제하기`), false, Math.min(1, (p.edu[field] ?? 0) / 50));
  } else if (p.office) {
    add('rise', T('Rise to the next tier of office', '한 단계 높은 관직에 오르기'), p.office.rank >= 5, p.office.rank / 5);
  }
  if (p.gender === 'woman' && married && !p.quals.includes('household')) add('keys', T('Take charge of the household', '안살림을 맡기'), g.econ.role === 'admin');
  const kids = Object.values(g.npcs).filter((n) => n.kin === 'child' && n.parents.includes('player') && n.alive).length;
  if (married && age < 45) add('heir', T('Raise an heir', '후사를 보기'), kids > 0);
  if (g.econ.role === 'head' || g.econ.role === 'admin') {
    const town = g.econ.estates.find((e) => e.kind === 'town');
    if (!town?.buildings.includes('shrine')) add('shrine', T('Build an ancestral shrine', '사당을 세우기'), false);
    const owed = g.econ.debts.reduce((n, d) => n + d.principal, 0);
    if (owed) add('debt', T('Clear the family’s debts', '집안 빚을 청산하기'), owed === 0);
    add('prestige', T('Raise the family to the first rank of houses', '가문을 최고 명문으로 올리기'), g.house.prestige >= 5, g.house.prestige / 5);
  }
  if (g.pol.inquiries.some((i) => !i.outcome)) add('inquiry', T('Submit your findings before the deadline', '기한 안에 조사 결과를 올리기'), false);
  return out.slice(0, 5);
}

export const stageName = (g: Game) => stageOf(playerAge(g)).name;

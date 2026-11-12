import type { Background, Campaign, Game, Gender, Player, Text } from '../model/schemas';
import { ALT_START, eraOf } from '../content/campaigns';
import { buildWorld } from '../content/cast';
import { DEFAULT_NAMES, familyOf } from '../content/families';
import { onPhaseStart } from './day';
import { T } from './text';
import { hasHangul, tidyRoman, toHangul, toRoman } from './names';
import { zodiac } from './time';
import { START_MONEY } from './money';
import { ensureCourt } from './royals';
import { makeAttrs, syncQualities } from './character';
import { initEcon } from './econ';
import { initPol } from './politics';
import { defaultPost } from '../content/government';
import { ruleActive } from '../content/annals';
import { ADULT_AGE, EDU_FIELDS, TEMPERS } from '../content/attributes';
import { WEALTH_ORDER, type Wealth } from './money';
import { roll } from './world';

export type NewLife = {
  campaign: Campaign;
  background: Background;
  gender: Gender;
  /** As typed, in either script. Blank means the default name. */
  givenName: string;
  /** The name in hangul, when the player wrote it themselves. Otherwise it is worked out from the typed name. */
  givenKo?: string;
  age: number;
  colors: { top: string; bottom: string };
  seed?: number;
  /** Historical campaign: any starting year from 1392 to 1897 (the featured eras open with their own story). */
  startYear?: number;
  /** Up to two starting traits. */
  traits?: string[];
  /** Seven tendencies, −2 to +2. */
  temper?: Record<string, number>;
  /** Royal backgrounds: how close the claim is. */
  lineage?: Player['lineage'];
  /** A custom house: its standing, means and side. */
  custom?: { prestige: number; wealth: Wealth; faction: 'A' | 'B' | 'none' };
  /** Index into EDU_FIELDS: what a child concentrates on. */
  focus?: number;
  /** v0.6: a scenario this life is played for (content/scenarios.ts). */
  scenario?: string;
};

export const MIN_AGE = 8;
export const MAX_AGE = 40;
export const FIRST_YEAR = 1392;
export const LAST_YEAR = 1897;

/**
 * The given name in both scripts, falling back to the default name when left blank.
 * A name typed in Latin letters gets a hangul spelling (Giseok → 기석); one typed in hangul gets a romanization.
 */
export function givenText(typed: string, gender: Gender, ko?: string): Text {
  const s = typed.trim().replace(/\s+/g, ' ');
  const own = ko?.trim();
  if (!s) return own ? T(toRoman(own), own) : DEFAULT_NAMES[gender];
  const def = DEFAULT_NAMES[gender];
  if ((s === def.en || s === def.ko) && (!own || own === def.ko)) return def;
  if (hasHangul(s)) return T(toRoman(s), s);
  return T(tidyRoman(s), own || toHangul(s) || s);
}

/** Gives an older save's Latin-only name a hangul spelling. */
export function withHangul(t: Text): Text {
  if (t.ko && t.ko !== t.en) return t;
  if (hasHangul(t.en)) return T(toRoman(t.en), t.en);
  return T(t.en, toHangul(t.en) ?? t.en);
}

export function startOf(c: Campaign): { year: number; moon: number } {
  if (c.mode === 'alternative') return ALT_START;
  const e = eraOf(c.era);
  return { year: e.year, moon: e.moon };
}

/** Starting education: a few years of lessons for every year of age, more in the family's tradition. */
function startEdu(background: Background, age: number, gender: Gender, focus: number): Record<string, number> {
  const years = Math.max(0, age - 5);
  const lean: Record<string, string> = { military: 'military', scholarly: 'classics', noble: 'classics', political: 'admin', landed: 'practical', declining: 'classics', royal: 'culture', collateral: 'classics' };
  const out: Record<string, number> = {};
  for (const f of EDU_FIELDS) out[f.id] = Math.min(60, Math.round(years * 1.1));
  out[lean[background] ?? 'classics'] += Math.round(years * 0.9);
  if (gender === 'woman') out.practical += Math.round(years * 0.8);
  out[EDU_FIELDS[focus]?.id ?? 'classics'] += Math.round(years * 0.6);
  for (const k of Object.keys(out)) out[k] = Math.min(70, out[k]);
  out._focus = focus;
  return out;
}

/** Builds the first generation's world and starts the first day at court. */
export function newGame(o: NewLife): Game {
  const year = Math.max(FIRST_YEAR, Math.min(LAST_YEAR, Math.round(o.startYear ?? o.campaign.era)));
  const campaign: Campaign = o.campaign.mode === 'alternative'
    ? { mode: 'alternative', era: ALT_START.year, premise: o.campaign.premise ?? 'queen', ...(o.campaign.rules ? { rules: o.campaign.rules } : {}) }
    : { mode: 'historical', era: eraOf(year).year, premise: null, continuity: o.campaign.continuity ?? 'limited' };
  if (o.campaign.difficulty) campaign.difficulty = o.campaign.difficulty;
  const start = startOf(campaign);
  const age = Math.max(MIN_AGE, Math.min(MAX_AGE, Math.round(o.age)));
  const base = familyOf(o.background);
  const f = o.custom ? { ...base, prestige: o.custom.prestige, wealth: o.custom.wealth, faction: o.custom.faction } : base;
  const world = buildWorld(campaign, start, o.background, o.gender, age);
  const seed = o.seed ?? Math.floor(Math.random() * 2 ** 31);
  const birthYear = start.year - age;
  const child = age < ADULT_AGE;
  const royalBorn = o.background === 'royal' || o.background === 'collateral';
  const lineage: Player['lineage'] = royalBorn ? (o.lineage && o.lineage !== 'none' ? o.lineage : o.background === 'royal' ? 'prince' : 'descendant') : 'none';
  const birthMoon = 1 + (seed % 12);
  const animal = zodiac(birthYear);
  const g: Game = {
    campaign,
    date: { year: start.year, moon: start.moon, day: 1, phase: 'morning' },
    dayCount: 0,
    seed,
    generation: 1,
    player: {
      surname: f.surname,
      given: givenText(o.givenName, o.gender, o.givenKo),
      gender: o.gender,
      birthYear,
      birthMoon,
      colors: o.colors,
      qualities: { ...f.qualities },
      attrs: {},
      temper: {},
      edu: {},
      quals: [],
      born: royalBorn ? 'royal' : 'yangban',
      legal: royalBorn ? 'royal' : 'yangban',
      lineage,
      royal: 'none',
      honour: 50,
      legitimacy: lineage === 'prince' ? 60 : lineage === 'descendant' ? 45 : lineage === 'disputed' ? 25 : 0,
      service: 0,
      fatigue: 10,
      stress: 15,
      happiness: 62,
      conditions: [],
      skills: {},
      practised: {},
      mourning: null,
      moodEvent: null,
      belief: { practice: {}, conviction: 30 },
      works: [],
      pet: null,
      health: 82,
      reputation: f.reputation,
      favour: f.favour,
      office: null,
      traits: (o.traits ?? []).slice(0, 2),
      gifts: ['pouch', 'paper'],
      money: 20 + Math.round(START_MONEY[f.wealth] * 0.1),
      alive: true,
      diedYear: null,
    },
    house: { background: o.background, surname: f.surname, prestige: f.prestige, wealth: f.wealth, faction: f.faction },
    econ: { treasury: 0, role: 'member', estates: [], staff: [], businesses: [], debts: [], cargo: [], provinces: {}, ledger: [], stores: 0 },
    pol: { inf: { A: 60, B: 40 }, side: 'neutral', standing: 0, vacancies: [], inquiries: [], exile: null, downfall: null, divergence: [], rulers: [], state: null, mission: null },
    notes: [], missions: [], docs: [], mail: [], routine: null, lives: [], milestones: [], scenario: o.scenario ? { id: o.scenario, status: 'open', day: null } : null,
    marriedInto: null,
    startPrestige: f.prestige,
    npcs: world.npcs,
    rel: world.rel,
    flags: {},
    flagDays: {},
    place: child ? 'residence' : 'rear-garden',
    done: [],
    log: [
      { year: birthYear, moon: birthMoon, text: T(`Born in Hanseong, in the year of the ${animal.en}.`, `${animal.ko ?? animal.en}띠 해에 한성에서 태어났다.`) },
      ...(child ? [] : [{ year: start.year, moon: start.moon, text: T('Came to court for the first time.', '처음으로 입궐했다.') }]),
    ],
    proposals: [],
    favoured: null,
    letter: null,
    active: null,
    report: null,
    queued: null,
    seen: {},
    ancestors: [],
    ending: null,
    achieved: [],
    counts: {},
  };
  // GSDD Part I: attributes, tendencies and education, then the household and the court.
  const P = g.player;
  const r = (k: string) => roll(g, 'create:' + k);
  P.attrs = makeAttrs(r, f.qualities, { background: o.background, gender: o.gender, age, traits: P.traits });
  for (const t of TEMPERS) P.temper[t.id] = Math.max(-2, Math.min(2, Math.round(o.temper?.[t.id] ?? 0)));
  P.edu = startEdu(o.background, age, o.gender, o.focus ?? (o.background === 'military' ? 2 : 0));
  if (P.traits.includes('principled')) P.honour = 60;
  if (P.traits.includes('deceitful')) P.honour = 40;
  syncQualities(P);
  if (child) g.flags['started-child'] = true;
  initEcon(g, f.wealth, START_MONEY[f.wealth]);
  initPol(g);
  ensureCourt(g);
  backstory(g, age);
  onPhaseStart(g);
  return g;
}

/**
 * GSDD Part V §5: an older start arrives with a past: examinations already behind them, a first post,
 * a faction, acquaintances at court. Never more than a careful life of that age could have reached.
 */
function backstory(g: Game, age: number) {
  if (age < 21) return;
  const P = g.player;
  const y = g.date.year;
  const at = (a: number) => P.birthYear + a;
  const past = (a: number, tag: string, text: Text) => g.log.push({ year: at(a), moon: 3, tag, text });
  const mayOffice = P.gender === 'man' || (g.campaign.mode === 'alternative' && !!g.campaign.rules?.womenOffice);
  const royalKin = P.legal === 'royal';
  const exams = g.campaign.mode === 'alternative' || ruleActive('exams', at(20));
  const military = g.house.background === 'military';
  if (mayOffice && !royalKin && exams && !military && (P.attrs.scholarship ?? 40) >= 35) {
    P.quals.push('sogwa');
    past(20, 'edu', T('Passed the lesser examination and became a licentiate.', '소과에 합격해 생원이 되었다.'));
  }
  if (mayOffice && !royalKin && exams && age >= 27) {
    const track = military ? 'military' : 'civil';
    P.quals.push(military ? 'mukwa' : 'munkwa');
    past(25, 'edu', T(`Passed the ${track} examination.`, `${track === 'civil' ? '문과' : '무과'}에 급제했다.`));
    const rank = age >= 33 ? 2 : 1;
    const post = defaultPost(track, rank, y);
    P.office = { track, rank, post: post.id };
    P.service = 20;
    past(26, 'career', T(`Appointed ${post.title.en}.`, `${post.title.ko}에 임명되었다.`));
  }
  if (age >= 25 && (g.house.faction === 'A' || g.house.faction === 'B')) {
    g.pol.side = g.house.faction;
    g.pol.standing = 12 + Math.min(10, age - 25);
    past(24, 'politics', T('Followed the family into its faction.', '집안을 따라 당에 몸담았다.'));
  }
  // People already known at court, if this life has been lived near it.
  for (const n of Object.values(g.npcs)) {
    const r = g.rel[n.id];
    if (!r || !n.meet || n.kin || r.met) continue;
    if (n.faction === g.pol.side || (P.office && n.post)) {
      r.met = true;
      r.regard = Math.min(100, r.regard + 6);
    }
  }
  P.reputation = Math.min(100, P.reputation + Math.min(8, Math.floor((age - 20) / 2)));
  g.log.sort((a, b) => a.year - b.year || a.moon - b.moon);
}

export const ageStages = [
  { age: 8, name: T('Child', '아이'), text: T('Lessons, family and childhood. Court comes later.', '공부와 가족, 어린 시절. 조정은 나중 일이다.') },
  { age: 13, name: T('Adolescent', '청소년'), text: T('Advanced study and the first social introductions.', '심화 학습과 첫 사교.') },
  { age: 19, name: T('Young adult', '청년'), text: T('Court, career and marriage begin now.', '조정, 출사, 혼인이 지금 시작된다.') },
  { age: 32, name: T('Adult', '장년'), text: T('An established life with duties already waiting.', '이미 자리 잡은 삶과 기다리는 책임.') },
];
export { WEALTH_ORDER, ADULT_AGE };

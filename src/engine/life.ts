import type { Game, Npc, Player, Text } from '../model/schemas';
import {
  CONDITIONS, EMOTIONS, FOCI, LEISURE, MATCH_HOUSES, MILESTONES, RIBBONS, SKILLS, STYLES, TREATMENTS,
  conditionById, skillById, type Emotion, type Focus, type MilestoneId, type RibbonId, type SkillDef, type Style,
} from '../content/life';
import { ADULT_AGE, TRAIT_ATTRS } from '../content/attributes';
import { T, signed } from './text';
import { clamp, clone, everMarried, npcAge, playerName, roll, spouseId } from './world';
import { playerAge, seasonOf } from './time';
import { bumpAttr } from './character';
import { canPay, pay } from './econ';
import { notify } from './bus';
import { tireAfter } from './social';
import { advancePart } from './day';
import { mortalityMul } from './difficulty';

/*
 * GSDD Part IX at BitLife depth: how the player feels, what ails them, what they do for pleasure, how they
 * raise their children, the milestones of a life and the ribbon it earns. Every rule here is deterministic
 * (seeded rolls), so a save replays the same way.
 */

type Say = (t: Text, record?: boolean) => void;
type Done = { game: Game; note: Text | null };
const no = (g: Game): Done => ({ game: g, note: null });
const busy = (g: Game) => !!(g.active || g.letter || g.report) || !g.player.alive;
const BUSY = T('Finish what is in front of you first.', '눈앞의 일부터 마무리하라.');

// ---------------------------------------------------------------- mood

export const inMourning = (g: Game) => !!g.player.mourning && g.dayCount < g.player.mourning.until;
/** A passing feeling from something that just happened, and its effect on happiness. */
export function feel(g: Game, kind: Emotion | null, happy: number, days = 90) {
  const P = g.player;
  if (!P) return;
  P.happiness = clamp((P.happiness ?? 60) + happy, 0, 100);
  if (kind) P.moodEvent = { kind, until: g.dayCount + days };
}

export function emotionOf(g: Game): Emotion {
  const P = g.player;
  if (P.moodEvent && g.dayCount < P.moodEvent.until && P.moodEvent.kind in EMOTIONS) return P.moodEvent.kind as Emotion;
  if (inMourning(g) && g.dayCount < P.mourning!.until - (P.mourning!.kin === 'spouse' ? 180 : 450)) return 'grieving';
  if (P.fatigue >= 85) return 'exhausted';
  if (P.stress >= 75) return 'anxious';
  if (P.happiness >= 78) return 'happy';
  if (P.happiness >= 48) return 'content';
  if (P.happiness >= 32) return 'unsettled';
  return 'sad';
}
export const faceOf = (g: Game) => EMOTIONS[emotionOf(g)].face;
/** How someone looks at the player: warm, cool, or hostile (GSDD Part VII §2.6). */
export function faceFor(g: Game, id: string): 'smile' | 'calm' | 'stern' | 'sad' {
  const r = g.rel[id];
  const n = g.npcs[id];
  if (!r || !n) return 'calm';
  if (!n.alive) return 'calm';
  if (r.regard <= -20 || (r.dims?.resentment ?? 0) >= 45) return 'stern';
  if (r.regard >= 45 && r.met) return 'smile';
  return 'calm';
}

export type Source = { id: string; name: Text; d: number; text: Text };
/** The household's means: the purse and the family treasury, which a member lives on too. */
const wealthOf = (g: Game) => g.player.money + (g.player.legal === 'commoner' ? 0 : g.econ.treasury);
const ownKids = (g: Game) => Object.values(g.npcs).filter((n) => n.kin === 'child' && n.parents.includes('player'));

/** What the player's happiness rests on (GSDD Part IX §15.3), described, not scored as a verdict. */
export function contentment(g: Game): Source[] {
  const P = g.player;
  const age = playerAge(g);
  const out: Source[] = [];
  const add = (id: string, en: string, ko: string, d: number, ten: string, tko: string) => d && out.push({ id, name: T(en, ko), d, text: T(ten, tko) });
  const sp = spouseId(g);
  const r = sp ? g.rel[sp] : undefined;
  if (r) add('spouse', 'Marriage', '혼인', r.regard >= 50 ? 9 : r.regard >= 15 ? 3 : -6, r.regard >= 50 ? 'A warm marriage.' : r.regard >= 15 ? 'A dutiful marriage.' : 'A cold marriage.', r.regard >= 50 ? '정다운 부부.' : r.regard >= 15 ? '도리를 지키는 부부.' : '냉랭한 부부.');
  else if (age >= 28 && !everMarried(g)) add('spouse', 'Marriage', '혼인', -4, 'Still unmarried, and the family talks.', '아직 혼인하지 않아 집안이 수군댄다.');
  const kids = ownKids(g).filter((k) => k.alive).length;
  if (kids) add('children', 'Children', '자녀', Math.min(9, kids * 3), `${kids} child${kids === 1 ? '' : 'ren'} in the house.`, `자녀 ${kids}명.`);
  if (P.legal === 'commoner') add('status', 'Status', '신분', -12, 'Fallen from the noble ranks.', '양반의 반열에서 떨어졌다.');
  else if (g.pol.exile) add('status', 'Status', '신분', -12, 'In exile, far from home.', '고향에서 먼 유배지.');
  else if (P.office) add('calling', 'Calling', '소임', 4 + P.office.rank * 2, 'Serving in office.', '벼슬을 하고 있다.');
  else if (P.royal !== 'none') add('calling', 'Calling', '소임', 8, 'A place in the royal household.', '왕실 안의 자리.');
  else if (age >= 30 && P.gender === 'man' && !P.quals.includes('munkwa') && !P.quals.includes('mukwa')) add('calling', 'Calling', '소임', -3, 'No post, no degree, at an age when others have both.', '남들은 다 가진 나이에 벼슬도 급제도 없다.');
  const w = wealthOf(g);
  add('wealth', 'Security', '살림', w >= 6000 ? 6 : w >= 1500 ? 3 : w >= 200 ? 0 : -6, w >= 6000 ? 'Rich and secure.' : w >= 1500 ? 'Comfortable.' : w >= 200 ? '' : 'Short of money.', w >= 6000 ? '부유하고 넉넉하다.' : w >= 1500 ? '형편이 넉넉하다.' : w >= 200 ? '' : '돈이 궁하다.');
  if (g.econ.debts.length) add('debt', 'Debts', '빚', -4, 'Debts hang over the house.', '빚이 집안을 짓누른다.');
  const standing = (P.reputation >= 60 ? 4 : 0) + (P.honour >= 60 ? 3 : 0) + (P.favour >= 60 ? 3 : 0) - (P.reputation < 25 ? 5 : 0);
  if (standing) add('standing', 'Standing', '명성', standing, standing > 0 ? 'Well regarded.' : 'Talked about, unkindly.', standing > 0 ? '좋은 평을 듣는다.' : '나쁜 소문에 오르내린다.');
  const ill = (P.health < 40 ? -8 : 0) - P.conditions.length * 2 - (P.fatigue > 70 ? 4 : 0) - (P.stress > 60 ? 6 : 0);
  if (ill) add('health', 'Body and mind', '몸과 마음', ill, 'Illness, weariness or worry.', '병이나 피로, 근심.');
  const best = Math.max(0, ...Object.values(P.skills));
  const lately = Object.values(P.practised).some((d) => g.dayCount - d < 120);
  const arts = (best >= 80 ? 5 : best >= 50 ? 3 : 0) + (lately ? 2 : 0);
  if (arts) add('arts', 'Pastimes', '취미', arts, 'Time for the arts you love.', '좋아하는 재주를 즐길 여유.');
  if (P.pet) add('pet', 'Companion', '벗 삼은 짐승', 3, `${P.pet.name.en} keeps you company.`, `${P.pet.name.ko ?? P.pet.name.en}이(가) 곁을 지킨다.`);
  if ((P.belief?.conviction ?? 0) >= 60) add('belief', 'Belief', '믿음', 3, 'A settled mind.', '흔들리지 않는 마음.');
  if (inMourning(g)) add('grief', 'Grief', '슬픔', -10, `In mourning for ${P.mourning!.for.en}.`, `${P.mourning!.for.ko ?? P.mourning!.for.en}의 상중.`);
  return out;
}
export const happinessTarget = (g: Game) => clamp(52 + contentment(g).reduce((n, s) => n + s.d, 0), 5, 95);

// ---------------------------------------------------------------- mourning (GSDD Part VIII §12, Part VII §3.2)

/** A parent's death means mourning for twenty-seven months; an official leaves office for it. */
export function startMourning(g: Game, n: Npc, say: Say) {
  const P = g.player;
  if (!P.alive) return;
  const parent = n.kin === 'father' || n.kin === 'mother';
  const leave = parent && !!P.office && P.legal !== 'commoner';
  P.mourning = { for: n.name, kin: n.kin ?? 'kin', until: g.dayCount + (parent ? 810 : 360), leave };
  feel(g, 'grieving', parent ? -16 : -20, 180);
  if (leave) {
    say(T('You leave your post to mourn, as the law requires. You will return when the mourning ends.', '법도에 따라 벼슬을 내려놓고 상을 치른다. 상이 끝나면 돌아갈 것이다.'), true);
  }
}

// ---------------------------------------------------------------- illness (GSDD Part IX §12–13)

const medicine = (P: Player) => P.skills.medicine ?? 0;
export const hasCondition = (g: Game, id: string) => g.player.conditions.some((c) => c.id === id);
export const conditionsOf = (g: Game) => g.player.conditions.map((c) => ({ ...c, def: conditionById(c.id)! })).filter((c) => c.def);

/** Extra mortality from grave illness, used by the season's death roll. */
export function illnessRisk(g: Game): number {
  let r = 0;
  for (const c of conditionsOf(g)) {
    const recent = c.treated >= 0 && g.dayCount - c.treated < 120;
    if (c.def.severity === 3) r += recent ? 0.008 : 0.025;
    else if (c.def.severity === 2) r += recent ? 0.001 : 0.003;
  }
  return r * mortalityMul(g);
}

/** GSDD Part IX §13.5: the player hears when life is in danger, though not when it will end. */
export function healthWarning(g: Game): Text | null {
  const P = g.player;
  if (!P.alive) return null;
  const grave = conditionsOf(g).find((c) => c.def.severity === 3);
  if (grave) return T(`The physicians fear for your life: ${grave.def.name.en.toLowerCase()}.`, `의원들이 목숨을 걱정한다: ${grave.def.name.ko}.`);
  if (P.health < 25) return T('Your health is failing. Rest and treatment may buy time.', '건강이 크게 쇠했다. 조리와 치료로 시간을 벌 수 있다.');
  if (P.health < 40 && playerAge(g) >= 60) return T('You are frail now; a hard winter could be dangerous.', '몸이 많이 약해졌다. 혹독한 겨울은 위험할 수 있다.');
  return null;
}

function contract(g: Game, say: Say) {
  const P = g.player;
  const age = playerAge(g);
  if (P.conditions.length >= 3) return;
  const season = seasonOf(g.date.moon);
  const chance = (0.035 + (age >= 50 ? 0.04 : 0) + (age >= 65 ? 0.06 : 0) + (age < 5 ? 0.04 : 0) + P.stress / 600 + (P.happiness < 30 ? 0.02 : 0))
    * (1 - medicine(P) / 300) * Math.min(1.4, mortalityMul(g));
  if (roll(g, 'contract') >= chance) return;
  const pool = CONDITIONS.filter((c) => age >= c.minAge && (c.maxAge === undefined || age <= c.maxAge) && (!c.seasons || c.seasons.includes(season)) && !hasCondition(g, c.id));
  const total = pool.reduce((n, c) => n + c.weight, 0);
  let pick = roll(g, 'contract-which') * total;
  const def = pool.find((c) => (pick -= c.weight) < 0);
  if (!def) return;
  P.conditions.push({ id: def.id, since: g.dayCount, treated: -1 });
  say(T(`You have fallen ill: ${def.name.en.toLowerCase()}. ${def.text.en}`, `병이 났다: ${def.name.ko}. ${def.text.ko}`), true);
  notify(g, 'health', def.severity === 3 ? 'critical' : 'high', T(`Illness: ${def.name.en}. Treatment is on the Pastimes & health page.`, `병: ${def.name.ko}. 치료는 '취미와 건강'에서.`));
  if (def.severity >= 2) feel(g, 'anxious', -4, 60);
}

function illnessSeason(g: Game, say: Say) {
  const P = g.player;
  contract(g, say);
  for (const c of [...P.conditions]) {
    const def = conditionById(c.id);
    if (!def) continue;
    const recent = c.treated >= 0 && g.dayCount - c.treated < 120;
    const drain = Math.round(def.drain * (recent ? 0.5 : 1));
    if (drain) P.health = clamp(P.health - drain, 0, 100);
    if (def.attr && def.chronic && roll(g, 'wear:' + c.id) < 0.3) bumpAttr(P, def.attr, -1);
    if (def.passes && g.dayCount > c.since && roll(g, 'pass:' + c.id) < def.passes + (recent ? 0.15 : 0) + medicine(P) / 400) {
      P.conditions = P.conditions.filter((x) => x.id !== c.id);
      say(T(`You have recovered from ${def.name.en.toLowerCase()}.`, `${def.name.ko}에서 회복했다.`), true);
      feel(g, null, 4);
    } else if (drain) {
      say(T(`${def.name.en} lingers. Health −${drain}.`, `${def.name.ko}이(가) 낫지 않는다. 건강 −${drain}.`));
    }
  }
  // A body free of illness mends a little each season, less so with age.
  const age = playerAge(g);
  const cap = age < 40 ? 90 : age < 55 ? 82 : age < 70 ? 72 : 62;
  if (!P.conditions.some((c) => (conditionById(c.id)?.severity ?? 1) >= 2) && P.health < cap) P.health = clamp(P.health + (P.conditions.length ? 1 : 3), 0, cap);
  const warn = healthWarning(g);
  if (warn) {
    say(warn);
    notify(g, 'health', 'critical', warn);
  }
}

export const treatmentsFor = () => TREATMENTS;
export function treatBar(g: Game, condId: string, tId: string): Text | null {
  const c = g.player.conditions.find((x) => x.id === condId);
  const def = conditionById(condId);
  const t = TREATMENTS.find((x) => x.id === tId);
  if (!c || !def || !t) return T('Nothing to treat.', '치료할 것이 없다.');
  if (busy(g)) return BUSY;
  if (c.treated >= 0 && g.dayCount - c.treated < 30) return T('It was treated this month; give it time.', '이번 달에 이미 치료했다. 시간을 두어야 한다.');
  const P = g.player;
  if (tId === 'royal' && P.royal === 'none' && P.legal !== 'royal' && P.favour < 60) return T('The royal physicians attend only the royal house and its favourites.', '어의는 왕실과 총애받는 이만 돌본다.');
  if (tId === 'rest' && g.date.phase === 'evening') return T('Rest begins in the morning.', '조리는 아침부터 하자.');
  const cost = treatmentCost(g, t.id, def.severity);
  if (cost > 0 && !canPay(g, cost)) return T(`You cannot pay ${cost} nyang.`, `${cost}냥을 낼 수 없다.`);
  return null;
}
export const treatmentCost = (g: Game, tId: string, severity: number) => {
  const t = TREATMENTS.find((x) => x.id === tId);
  return t ? Math.round(t.cost(severity) * (1 - medicine(g.player) / 250)) : 0;
};
export function treat(g0: Game, condId: string, tId: string): Done {
  if (treatBar(g0, condId, tId)) return no(g0);
  const g = clone(g0);
  const P = g.player;
  const c = P.conditions.find((x) => x.id === condId)!;
  const def = conditionById(condId)!;
  const t = TREATMENTS.find((x) => x.id === tId)!;
  const cost = treatmentCost(g, tId, def.severity);
  if (cost) pay(g, cost);
  c.treated = g.dayCount;
  P.stress = clamp(P.stress - t.comfort, 0, 100);
  feel(g, null, Math.round(t.comfort / 2));
  g.counts.treatments = (g.counts.treatments ?? 0) + 1;
  const notes: Text[] = [];
  if (tId === 'rest') {
    P.fatigue = clamp(P.fatigue - 25, 0, 100);
    P.health = clamp(P.health + 2, 0, 100);
    advancePart(g);
  }
  const cure = def.chronic ? 0 : t.cure * (def.severity === 3 ? 0.6 : 1) * (1 + medicine(P) / 200);
  if (cure > 0 && roll(g, 'cure:' + condId + tId) < cure) {
    P.conditions = P.conditions.filter((x) => x.id !== condId);
    P.health = clamp(P.health + 3, 0, 100);
    notes.push(T(`${t.name.en}: the ${def.name.en.toLowerCase()} is gone.`, `${t.name.ko}: ${def.name.ko}이(가) 나았다.`));
    feel(g, null, 5);
  } else {
    notes.push(def.chronic
      ? T(`${t.name.en}: it cannot be cured, but it eases for a season.`, `${t.name.ko}: 고칠 수는 없으나 한 철은 수월하리라.`)
      : T(`${t.name.en}: it eases, though it has not passed yet.`, `${t.name.ko}: 차도가 있으나 아직 낫지는 않았다.`));
  }
  if (cost) notes.push(T(`−${cost} nyang`, `−${cost}냥`));
  return { game: g, note: T(notes.map((n) => n.en).join(' '), notes.map((n) => n.ko ?? n.en).join(' ')) };
}

// ---------------------------------------------------------------- pastimes (GSDD Part IX §4, §14)

/** Whether a pastime is open to this player: age, and in the historical campaign the customs of the time. */
export function skillOpen(g: Game, s: SkillDef): boolean {
  if (playerAge(g) < s.minAge) return false;
  if (s.who === 'any' || g.campaign.mode === 'alternative') return true;
  return s.who === g.player.gender;
}
export const openSkills = (g: Game) => SKILLS.filter((s) => skillOpen(g, s));

/** One evening pastime a day; mornings and afternoons are spent like any activity. */
export function partBar(g: Game, id: string, evening: boolean): Text | null {
  if (busy(g)) return BUSY;
  if (g.date.phase === 'evening') {
    if (!evening) return T('Not by lamplight.', '등잔불 아래서 할 일이 아니다.');
    if (g.done.includes('evening:leisure')) return T('You have spent this evening already.', '오늘 저녁은 이미 보냈다.');
  }
  if (g.done.includes(id)) return T('Once is enough today.', '오늘은 한 번으로 족하다.');
  if (g.player.fatigue >= 92) return T('You are too tired.', '너무 지쳤다.');
  return null;
}
export function usePart(g: Game, id: string, notes: Text[]) {
  tireAfter(g, notes);
  g.done.push(id);
  if (g.date.phase === 'evening') g.done.push('evening:leisure');
  else advancePart(g);
}

export function practiseBar(g: Game, id: string): Text | null {
  const s = skillById(id);
  if (!s || !skillOpen(g, s)) return T('Not open to you.', '할 수 없는 일이다.');
  return partBar(g, 'practise:' + id, s.evening);
}
export function practise(g0: Game, id: string): Done {
  if (practiseBar(g0, id)) return no(g0);
  const g = clone(g0);
  const P = g.player;
  const s = skillById(id)!;
  const lvl = P.skills[id] ?? 0;
  const tutor = g.econ.staff.some((x) => x.role === 'tutor') ? 1.2 : 1;
  const gain = Math.max(1, Math.round((3 + (P.attrs[s.attr] ?? 40) / 22) * (1 - lvl / 130) * (P.fatigue >= 70 ? 0.6 : 1) * tutor));
  const now = clamp(lvl + gain, 0, 100);
  P.skills[id] = now;
  P.practised[id] = g.dayCount;
  g.counts.practised = (g.counts.practised ?? 0) + 1;
  const notes: Text[] = [T(`${s.name.en} ${signed(gain)} (${now})`, `${s.name.ko} ${signed(gain)} (${now})`)];
  if (roll(g, 'practise-attr:' + id) < 0.25) bumpAttr(P, s.attr, 1);
  const calm = id === 'music' || id === 'painting' || id === 'embroidery' ? 4 : 2;
  P.stress = clamp(P.stress - calm, 0, 100);
  feel(g, null, 2);
  for (const [at, rep, word] of [[25, 0, T('competent', '익숙한')], [50, 2, T('accomplished', '능숙한')], [80, 4, T('a master', '대가')]] as const) {
    if (lvl < at && now >= at) {
      P.reputation = clamp(P.reputation + rep, 0, 100);
      const t = T(`Became ${word.en === 'a master' ? 'a master of' : word.en + ' at'} ${s.name.en.toLowerCase()}.`, `${s.name.ko}에 ${word.ko}${word.ko === '대가' ? '가 되었다' : ' 솜씨가 되었다'}.`);
      g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'life', text: t });
      notes.push(t);
      if (at === 80) feel(g, 'proud', 8);
    }
  }
  if ((id === 'embroidery' || id === 'painting' || id === 'calligraphy') && now >= 50 && P.gifts.length < 8 && roll(g, 'craft-gift:' + id) < 0.3) {
    const gift = id === 'embroidery' ? 'pouch' : id === 'painting' ? 'fan' : 'paper';
    P.gifts.push(gift);
    notes.push(T('You made something worth giving.', '선물할 만한 것을 만들었다.'));
  }
  usePart(g, 'practise:' + id, notes);
  return { game: g, note: T(notes.map((n) => n.en).join(' '), notes.map((n) => n.ko ?? n.en).join(' ')) };
}

export function competeBar(g: Game, id: string): Text | null {
  const s = skillById(id);
  if (!s || !skillOpen(g, s)) return T('Not open to you.', '할 수 없는 일이다.');
  if ((g.player.skills[id] ?? 0) < 20) return T('Practise more first (20).', '먼저 더 연습해야 한다 (20).');
  if (playerAge(g) < 12) return T('Too young to compete.', '겨루기엔 너무 어리다.');
  if ((g.counts['contest:' + id] ?? 0) === g.date.year) return T('Once a year.', '한 해에 한 번이다.');
  if (inMourning(g)) return T('Not while in mourning.', '상중에는 삼간다.');
  return partBar(g, 'compete:' + id, s.evening);
}
export function compete(g0: Game, id: string): Done {
  if (competeBar(g0, id)) return no(g0);
  const g = clone(g0);
  const P = g.player;
  const s = skillById(id)!;
  g.counts['contest:' + id] = g.date.year;
  const score = (P.skills[id] ?? 0) * 0.7 + (P.attrs[s.attr] ?? 40) * 0.3 + roll(g, 'contest:' + id) * 30;
  const notes: Text[] = [];
  if (score >= 72) {
    const prize = id === 'archery' || id === 'riding' || id === 'baduk' ? 20 : 0;
    P.money += prize;
    P.reputation = clamp(P.reputation + 4, 0, 100);
    feel(g, 'proud', 8);
    g.counts.contests = (g.counts.contests ?? 0) + 1;
    const t = T(`Won first place: ${s.contest.en.toLowerCase()}.`, `${s.contest.ko}: 장원을 했다.`);
    g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'life', text: t });
    notes.push(t, T(`Reputation +4${prize ? `, prize ${prize} nyang` : ''}.`, `평판 +4${prize ? `, 상금 ${prize}냥` : ''}.`));
  } else if (score >= 54) {
    P.reputation = clamp(P.reputation + 1, 0, 100);
    feel(g, null, 3);
    notes.push(T('A respectable showing; people noticed. Reputation +1.', '무난한 솜씨로 사람들의 눈에 들었다. 평판 +1.'));
  } else {
    feel(g, null, -3);
    notes.push(T('Others were better today. You will be back.', '오늘은 남들이 더 나았다. 다음을 기약한다.'));
  }
  P.skills[id] = clamp((P.skills[id] ?? 0) + 1, 0, 100);
  P.practised[id] = g.dayCount;
  usePart(g, 'compete:' + id, notes);
  return { game: g, note: T(notes.map((n) => n.en).join(' '), notes.map((n) => n.ko ?? n.en).join(' ')) };
}

/** Skills fade when left alone for a year, slowly and never below a competent floor. */
function skillSeason(g: Game) {
  const P = g.player;
  for (const [id, v] of Object.entries(P.skills)) {
    const last = P.practised[id] ?? -9999;
    const idle = g.dayCount - last;
    if (v > 25 && idle > (v >= 80 ? 540 : 360)) P.skills[id] = v - 1;
  }
}

export function leisureBar(g: Game, id: string): Text | null {
  const l = LEISURE.find((x) => x.id === id);
  if (!l || playerAge(g) < l.minAge) return T('Not yet.', '아직은 아니다.');
  if (id === 'wine' && inMourning(g)) return T('Not while in mourning.', '상중에는 삼간다.');
  if (id === 'graves' && !g.ancestors.length && !Object.values(g.npcs).some((n) => n.kin && !n.alive)) return T('No family graves to tend yet.', '아직 돌볼 선산이 없다.');
  if (l.cost && !canPay(g, l.cost)) return T('You cannot afford it.', '형편이 안 된다.');
  return partBar(g, 'leisure:' + id, l.evening);
}
export function leisure(g0: Game, id: string): Done {
  if (leisureBar(g0, id)) return no(g0);
  const g = clone(g0);
  const P = g.player;
  const l = LEISURE.find((x) => x.id === id)!;
  if (l.cost) pay(g, l.cost);
  const notes: Text[] = [];
  switch (id) {
    case 'stroll':
      P.stress = clamp(P.stress - 5, 0, 100);
      feel(g, null, 4);
      P.fatigue = clamp(P.fatigue - 9, 0, 100);
      notes.push(T('The hills were green and quiet. Happiness +4, stress −5.', '산은 푸르고 고요했다. 즐거움 +4, 근심 −5.'));
      break;
    case 'temple':
      P.stress = clamp(P.stress - 10, 0, 100);
      feel(g, null, 2);
      notes.push(T('A monk poured you tea and asked nothing. Stress −10.', '스님이 차를 따라 줄 뿐 아무것도 묻지 않았다. 근심 −10.'));
      break;
    case 'wine': {
      feel(g, 'happy', 6, 20);
      P.health = clamp(P.health - 1, 0, 100);
      P.fatigue = clamp(P.fatigue + 5, 0, 100);
      const friend = Object.keys(g.rel).find((k) => g.rel[k].met && g.rel[k].regard >= 30 && g.npcs[k]?.alive && !g.npcs[k]?.kin && !g.npcs[k]?.away);
      if (friend) g.rel[friend].regard = clamp(g.rel[friend].regard + 2, -100, 100);
      notes.push(T(`Laughter until late${friend ? ` with ${g.npcs[friend].name.en}` : ''}. Happiness +6.`, `${friend ? `${g.npcs[friend].name.ko}와(과) ` : ''}늦도록 웃었다. 즐거움 +6.`));
      break;
    }
    case 'graves':
      P.honour = clamp(P.honour + 2, 0, 100);
      P.stress = clamp(P.stress - (inMourning(g) ? 6 : 2), 0, 100);
      feel(g, null, 2);
      notes.push(T('The grass is cut and the wine poured. Honour +2.', '벌초를 하고 술을 올렸다. 명예 +2.'));
      break;
  }
  usePart(g, 'leisure:' + id, notes);
  return { game: g, note: T(notes.map((n) => n.en).join(' '), notes.map((n) => n.ko ?? n.en).join(' ')) };
}

// ---------------------------------------------------------------- raising children (GSDD Part IX §11, Part X §7)

export const raisable = (g: Game) => ownKids(g).filter((c) => c.alive && !c.away && npcAge(g, c) <= 17);
export function upbringingOf(n: Npc) {
  return n.upbringing ?? { focus: n.gender === 'man' ? 'classics' : 'culture', style: 'balanced' as Style, progress: 0, trait: null };
}
export function setUpbringing(g0: Game, id: string, focus: Focus | null, style: Style | null): Done {
  const n0 = g0.npcs[id];
  if (!n0 || !raisable(g0).includes(n0)) return no(g0);
  const g = clone(g0);
  const n = g.npcs[id];
  const u = { ...upbringingOf(n) };
  if (focus) u.focus = focus;
  if (style) u.style = style;
  n.upbringing = u;
  return { game: g, note: T(`${n.name.en}: ${FOCI.find((f) => f.id === u.focus)?.name.en.toLowerCase()}, raised ${STYLES.find((s) => s.id === u.style)?.name.en.toLowerCase()}.`, `${n.name.ko}: ${FOCI.find((f) => f.id === u.focus)?.name.ko}, ${STYLES.find((s) => s.id === u.style)?.name.ko} 기른다.`) };
}
export type RaiseAction = 'time' | 'praise' | 'lesson' | 'scold';
export const RAISE: { id: RaiseAction; name: Text; text: Text }[] = [
  { id: 'time', name: T('Spend time together', '함께 시간을 보낸다'), text: T('Closer to you; you are happier too.', '정이 깊어지고 당신도 즐겁다.') },
  { id: 'praise', name: T('Praise them', '칭찬한다'), text: T('Warmer, and a little more eager to learn.', '정이 들고 배움에 조금 더 힘쓴다.') },
  { id: 'lesson', name: T('Teach them yourself', '몸소 가르친다'), text: T('Real progress; tiring for you.', '배움이 크게 늘지만 고되다.') },
  { id: 'scold', name: T('Scold them', '꾸짖는다'), text: T('They work harder, and like you less.', '더 노력하지만 당신을 덜 따른다.') },
];
export function raiseBar(g: Game, id: string, a: RaiseAction): Text | null {
  const n = g.npcs[id];
  if (!n || !raisable(g).includes(n)) return T('Not a child of yours at home.', '집에 있는 당신의 자녀가 아니다.');
  if (playerAge(g) < 16) return T('You are too young yourself.', '당신도 아직 어리다.');
  if (busy(g)) return BUSY;
  if ((g.counts['raise:' + id] ?? -999) > g.dayCount - 90) return T('Once a season for each child.', '자녀마다 한 철에 한 번.');
  if (a === 'lesson' && npcAge(g, n) < 5) return T('Too young for lessons.', '배우기엔 너무 어리다.');
  if ((a === 'scold' || a === 'praise') && npcAge(g, n) < 3) return T('Still a baby.', '아직 갓난아기다.');
  if (a === 'lesson' && g.player.fatigue >= 85) return T('You are too tired.', '너무 지쳤다.');
  return null;
}
export function raise(g0: Game, id: string, a: RaiseAction): Done {
  if (raiseBar(g0, id, a)) return no(g0);
  const g = clone(g0);
  const n = g.npcs[id];
  const r = g.rel[id];
  const u = { ...upbringingOf(n) };
  g.counts['raise:' + id] = g.dayCount;
  const reg = (d: number) => { if (r) r.regard = clamp(r.regard + d, -100, 100); };
  let note: Text;
  switch (a) {
    case 'time': reg(5); feel(g, null, 3); note = T(`A whole afternoon with ${n.name.en}. Regard +5.`, `${n.name.ko}와(과) 오후 내내 함께했다. 호감 +5.`); break;
    case 'praise': reg(3); u.progress += 1; note = T(`${n.name.en} beams. Regard +3.`, `${n.name.ko}의 얼굴이 환해진다. 호감 +3.`); break;
    case 'lesson': reg(1); u.progress += 3; g.player.fatigue = clamp(g.player.fatigue + 8, 0, 100); note = T(`You go through the lesson twice. ${n.name.en} has it now. Progress +3.`, `두 번이나 짚어 주었다. ${n.name.ko}이(가) 이제 안다. 학업 +3.`); break;
    case 'scold': reg(-4); u.progress += 2; note = T(`${n.name.en} sulks, then studies. Regard −4.`, `${n.name.ko}이(가) 토라졌다가 책을 편다. 호감 −4.`); break;
  }
  n.upbringing = u;
  return { game: g, note };
}

/** Each season the children grow according to how they are raised. */
function upbringingSeason(g: Game, say: Say) {
  const tutor = g.econ.staff.find((s) => s.role === 'tutor');
  for (const n of raisable(g)) {
    const age = npcAge(g, n);
    if (age < 4) continue;
    const u = { ...upbringingOf(n) };
    const parentEdu = (g.player.edu[u.focus] ?? 0) / 40;
    const style = u.style === 'strict' ? 1.5 : u.style === 'gentle' ? -0.5 : 0;
    u.progress = clamp(u.progress + 1.5 + (tutor ? tutor.skill / 45 : 0) + style + parentEdu + roll(g, 'grow:' + n.id), 0, 100);
    const r = g.rel[n.id];
    if (r) r.regard = clamp(r.regard + (u.style === 'strict' ? -1 : u.style === 'gentle' ? 1 : 0), -100, 100);
    if (!u.trait && age >= 12) {
      const pick = (xs: string[]) => xs[Math.floor(roll(g, 'trait:' + n.id) * xs.length)];
      u.trait = u.style === 'strict' ? pick(['diligent', 'diligent', 'reserved', 'competitive'])
        : u.style === 'gentle' ? pick(['generous', 'curious', 'diplomatic', 'independent'])
          : u.focus === 'military' ? pick(['courageous', 'competitive', 'diligent'])
            : u.focus === 'culture' ? pick(['curious', 'generous', 'traditional'])
              : pick(['principled', 'diplomatic', 'traditional', 'curious']);
      if (!(u.trait in TRAIT_ATTRS)) u.trait = 'diligent';
      say(T(`${n.name.en} is growing up ${u.trait}.`, `${n.name.ko}의 성품이 드러난다: ${u.trait}.`));
    }
    n.upbringing = u;
  }
}

/** When a child becomes the next player, the upbringing shows (GSDD Part IX §17.4). */
export function applyUpbringing(n: Npc, P: Player) {
  const u = n.upbringing;
  if (!u) return;
  const f = FOCI.find((x) => x.id === u.focus);
  P.edu[u.focus] = clamp((P.edu[u.focus] ?? 0) + Math.round(u.progress * 0.6), 0, 75);
  for (const a of f?.attrs ?? []) P.attrs[a] = clamp((P.attrs[a] ?? 40) + Math.round(u.progress / 8), 5, 90);
  if (u.trait && !P.traits.includes(u.trait)) P.traits.push(u.trait);
  const start = Math.round(u.progress / 2);
  if (u.focus === 'culture') { P.skills.poetry = start; P.skills.music = Math.round(start * 0.8); }
  if (u.focus === 'military' && P.gender === 'man') P.skills.archery = start;
  if (u.focus === 'classics') P.skills.calligraphy = Math.round(start * 0.8);
}

// ---------------------------------------------------------------- people around the player (GSDD Part VIII §5.6)

function newsSeason(g: Game, say: Say) {
  let told = 0;
  const ids = Object.keys(g.npcs).sort();
  for (const id of ids) {
    if (told >= 2) break;
    const n = g.npcs[id];
    const r = g.rel[id];
    if (!n.alive || n.away || n.kin || !r?.met || id === 'king' || n.id.startsWith('child-') || n.id.startsWith('in-law-')) continue;
    if (r.bond !== 'none' || g.proposals.some((p) => p.npc === id)) continue;
    const age = npcAge(g, n);
    const life = n.life ?? { married: null, children: 0 };
    const wed = !!life.married || !!n.spouse;
    if (!wed && age >= 18 && age <= 38 && !n.post?.startsWith('royal') && roll(g, 'npc-wed:' + id) < (age > 25 ? 0.05 : 0.03)) {
      // Never within the same surname: marriages inside one clan were forbidden.
      const surname = n.name.en.split(' ')[0];
      const houses = MATCH_HOUSES.filter(([en]) => !en.startsWith(surname + ' '));
      const h = houses[Math.floor(roll(g, 'npc-house:' + id) * houses.length)];
      life.married = T(`a ${n.gender === 'man' ? 'daughter' : 'son'} of the ${h[0]} house`, `${h[1]} 집안의 ${n.gender === 'man' ? '딸' : '아들'}`);
      n.life = life;
      if (n.romance) n.romance = false;
      const t = T(`News: ${n.name.en} has married ${life.married.en}.`, `소식: ${n.name.ko}이(가) ${life.married.ko}와(과) 혼인했다.`);
      say(t);
      notify(g, 'personal', 'info', t);
      told++;
      continue;
    }
    if (wed && r.regard >= 25 && age <= (n.gender === 'woman' ? 42 : 55) && roll(g, 'npc-child:' + id) < 0.06) {
      life.children += 1;
      n.life = life;
      const son = roll(g, 'npc-sex:' + id) < 0.5;
      const t = T(`News: a ${son ? 'son' : 'daughter'} was born to ${n.name.en}.`, `소식: ${n.name.ko}에게 ${son ? '아들' : '딸'}이 태어났다.`);
      say(t);
      notify(g, 'personal', 'info', t);
      told++;
    }
  }
}

// ---------------------------------------------------------------- the season

export function lifeSeason(g: Game, say: Say) {
  const P = g.player;
  if (!P.alive) return;
  illnessSeason(g, say);
  skillSeason(g);
  upbringingSeason(g, say);
  newsSeason(g, say);
  // Mourning: an early recall to office by royal favour, or its end.
  if (P.mourning) {
    const m = P.mourning;
    if (g.dayCount >= m.until) {
      say(T(`Your mourning for ${m.for.en} has ended. You put away the hemp clothes.${m.leave ? ' You return to your post.' : ''}`, `${m.for.ko ?? m.for.en}의 상이 끝났다. 상복을 벗는다.${m.leave ? ' 벼슬자리로 돌아간다.' : ''}`), true);
      P.mourning = null;
    } else if (m.leave && P.favour >= 55 && m.until - g.dayCount < 630 && roll(g, 'gibok') < 0.2) {
      m.leave = false;
      say(T('The king recalls you to office before your mourning ends (gibok). You serve in mourning white.', '전하께서 상이 끝나기 전에 벼슬로 불러들이셨다 (기복). 소복 차림으로 봉직한다.'), true);
    }
  }
  // Happiness settles toward what life gives (GSDD Part IX §15.3).
  const target = happinessTarget(g);
  P.happiness = clamp(Math.round(P.happiness + (target - P.happiness) * 0.35 + (roll(g, 'mood') - 0.5) * 6), 0, 100);
  if (P.happiness < 25) P.stress = clamp(P.stress + 4, 0, 100);
  if (P.happiness > 70) P.stress = clamp(P.stress - 3, 0, 100);
  g.counts['happy-sum'] = (g.counts['happy-sum'] ?? 0) + P.happiness;
  g.counts['happy-n'] = (g.counts['happy-n'] ?? 0) + 1;
}

/** How the season's illness feeds the player's death roll. */
export { illnessRisk as graveRisk };

// ---------------------------------------------------------------- milestones (GSDD Part IX §15.4)

const grandKids = (g: Game) => {
  const kids = new Set(ownKids(g).map((c) => c.id));
  return Object.values(g.npcs).filter((n) => n.kin === 'grandchild' || n.parents.some((p) => kids.has(p)));
};
const FROM_LOG: Partial<Record<MilestoneId, RegExp>> = {
  'lesser-exam': /lesser examination/i, 'great-exam': /^Passed the (civil|military)/i, 'first-post': /^Appointed/i, marriage: /^Married/i,
};
export function reachedMilestones(g: Game): MilestoneId[] {
  const P = g.player;
  const age = playerAge(g);
  const ids: [MilestoneId, boolean][] = [
    ['first-lessons', age >= 7 && Math.max(0, ...Object.entries(P.edu).filter(([k]) => !k.startsWith('_')).map(([, v]) => v)) >= 5],
    ['capping', age >= ADULT_AGE],
    ['lesser-exam', P.quals.includes('sogwa')],
    ['great-exam', P.quals.includes('munkwa') || P.quals.includes('mukwa')],
    ['first-post', !!P.office],
    ['senior-post', (P.office?.rank ?? 0) >= 3],
    ['marriage', everMarried(g)],
    ['first-child', ownKids(g).length > 0],
    ['grandchild', grandKids(g).length > 0],
    ['estate', (g.counts.estates ?? 0) > 0],
    ['business', (g.counts.businesses ?? 0) > 0],
    ['royal-favour', P.favour >= 60],
    ['pastime-master', Object.values(P.skills).some((v) => v >= 80)],
    ['restored', !!g.flags.restored],
    ['throne', !!g.counts.reigned],
    ['heir', g.generation >= 2],
    ['elder', age >= 60],
  ];
  return ids.filter(([, ok]) => ok).map(([id]) => id);
}
/** Records milestones newly reached. Called after every change; quiet for milestones that predate this save. */
export function syncMilestones(g: Game, announce: boolean) {
  if (!g.milestones || !g.player.alive) return;
  const have = new Set(g.milestones.map((m) => m.id));
  for (const id of reachedMilestones(g)) {
    if (have.has(id)) continue;
    let year = g.date.year;
    let moon = g.date.moon;
    if (id === 'first-lessons') year = Math.min(year, g.player.birthYear + 7);
    if (id === 'capping') year = Math.min(year, g.player.birthYear + ADULT_AGE);
    if (id === 'elder') year = Math.min(year, g.player.birthYear + 60);
    const re = FROM_LOG[id];
    const hit = re ? g.log.find((l) => re.test(l.text.en)) : undefined;
    if (hit) { year = hit.year; moon = hit.moon; }
    g.milestones.push({ id, year, moon });
    if (announce) {
      notify(g, 'personal', 'high', T(`Milestone: ${MILESTONES[id].en}.`, `삶의 이정표: ${MILESTONES[id].ko}.`));
      if (id !== 'capping' && id !== 'first-lessons') feel(g, null, 3);
    }
  }
  g.milestones.sort((a, b) => a.year - b.year || a.moon - b.moon);
}

// ---------------------------------------------------------------- ribbons and legacy (GSDD Part IX §17.5)

export function ribbonFor(g: Game): RibbonId {
  const P = g.player;
  const age = (P.diedYear ?? g.date.year) - P.birthYear;
  const best = (ids: string[]) => Math.max(0, ...ids.map((i) => P.skills[i] ?? 0));
  const sp = spouseId(g);
  const kids = ownKids(g).filter((k) => k.alive).length;
  const avg = (g.counts['happy-n'] ?? 0) >= 8 ? (g.counts['happy-sum'] ?? 0) / (g.counts['happy-n'] ?? 1) : 60;
  if (g.counts.reigned) return 'sovereign';
  if (P.legal === 'commoner') return 'fallen';
  if (g.flags.restored) return 'survivor';
  if (P.office?.track === 'civil' && P.office.rank >= 4) return 'statesman';
  if (P.office?.track === 'military' && (P.office.rank >= 5 || (P.office.rank >= 4 && (g.counts.victories ?? 0) > 0))) return 'general';
  if (P.favour >= 75) return 'courtier';
  if (best(['poetry', 'music', 'painting', 'calligraphy', 'embroidery']) >= 80) return 'artist';
  if (best(['medicine']) >= 80) return 'healer';
  if ((P.quals.includes('munkwa') && (P.edu.classics ?? 0) >= 65) || ((P.edu.classics ?? 0) >= 70 && best(['poetry', 'calligraphy']) >= 55)) return 'scholar';
  if (wealthOf(g) >= 8000) return 'wealthy';
  if (sp && (g.rel[sp]?.regard ?? 0) >= 55 && kids >= 3) return 'devoted';
  if (g.flags['love-match']) return 'romantic';
  if (age >= 80) return 'elder';
  if (avg < 32) return 'melancholy';
  if (age < 30) return 'brief';
  return 'quiet';
}
export const ribbonOf = (id: string | null | undefined) => (id && id in RIBBONS ? RIBBONS[id as RibbonId] : null);

/** A descriptive account of how the life will be remembered, in words rather than a score. */
export function legacyWords(g: Game): { name: Text; text: Text }[] {
  const P = g.player;
  const out: { name: Text; text: Text }[] = [];
  const kids = ownKids(g);
  const alive = kids.filter((k) => k.alive).length;
  const grand = grandKids(g).filter((k) => k.alive).length;
  out.push({ name: T('Family', '가문'), text: alive ? T(`${alive} living child${alive === 1 ? '' : 'ren'}${grand ? ` and ${grand} grandchild${grand === 1 ? '' : 'ren'}` : ''} to carry the name.`, `대를 이을 자녀 ${alive}명${grand ? `, 손주 ${grand}명` : ''}.`) : T('No living children; the line will pass through others.', '살아 있는 자녀가 없어 가문은 다른 이를 통해 이어진다.') });
  const office = P.office ? T(`${P.office.track === 'civil' ? 'Civil' : 'Military'} rank ${P.office.rank} of 5.`, `${P.office.track === 'civil' ? '문관' : '무관'} 5단계 중 ${P.office.rank}단계.`) : P.quals.includes('munkwa') || P.quals.includes('mukwa') ? T('Passed the great examination, without high office.', '대과에 급제했으나 높은 벼슬은 없었다.') : T('No office.', '벼슬은 없었다.');
  out.push({ name: T('Career', '벼슬'), text: g.counts.reigned ? T('Reigned as monarch.', '임금으로 재위했다.') : office });
  const w = wealthOf(g);
  out.push({ name: T('Fortune', '재산'), text: w >= 8000 ? T('Left the house rich.', '집안을 부유하게 남겼다.') : w >= 2000 ? T('Left the house comfortable.', '집안을 넉넉하게 남겼다.') : w >= 300 ? T('Left the house as it was found.', '물려받은 만큼 남겼다.') : T('Left little behind.', '남긴 것이 적다.') });
  out.push({ name: T('Name', '이름'), text: P.reputation >= 70 ? T('Spoken of with admiration.', '칭송받는 이름.') : P.reputation >= 45 ? T('Respected.', '존중받는 이름.') : T('Soon forgotten, or remembered unkindly.', '곧 잊히거나 좋지 않게 기억될 이름.') });
  const best = Object.entries(P.skills).sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] >= 25) out.push({ name: T('Arts', '재주'), text: T(`${skillById(best[0])?.name.en ?? best[0]}: ${best[1] >= 80 ? 'a master' : best[1] >= 50 ? 'accomplished' : 'competent'}.`, `${skillById(best[0])?.name.ko ?? best[0]}: ${best[1] >= 80 ? '대가' : best[1] >= 50 ? '능숙' : '익숙'}.`) });
  if (g.pol.downfall || g.flags.restored || P.legal === 'commoner') out.push({ name: T('Adversity', '시련'), text: g.flags.restored ? T('Fell and was restored.', '몰락했다가 신원되었다.') : P.legal === 'commoner' ? T('Lost the family’s noble standing.', '가문의 양반 신분을 잃었다.') : T('Faced ruin.', '몰락의 위기를 겪었다.') });
  return out;
}

export const lifeName = (g: Game) => playerName(g);

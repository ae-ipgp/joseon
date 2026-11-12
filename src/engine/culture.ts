import type { Game, Text } from '../model/schemas';
import { FESTIVAL_LINES, PATHS, PATRONAGE, PRACTICES, WORK_KINDS, petById, type PathId, type PracticeDef } from '../content/culture';
import { T } from './text';
import { clamp, clone, roll } from './world';
import { playerAge, seasonOf } from './time';
import { bumpAttr, examHeld, study } from './character';
import { canPay, holdsKeys, pay } from './econ';
import { notify } from './bus';
import { feel, inMourning, partBar, usePart } from './life';
import { scenarioById } from '../content/scenarios';

/*
 * v0.6: culture and belief at life-sim depth (GSDD Parts XIII and XVI). What the player practises, writes,
 * pays for and keeps for company. Belief is shown as people of the time held it: a practice calms or
 * honours, and a fortune-teller says what a shrewd observer could see; nothing supernatural is simulated.
 */

type Done = { game: Game; note: Text | null };
type Say = (t: Text, record?: boolean) => void;
const no = (g: Game): Done => ({ game: g, note: null });
const join = (notes: Text[]): Text => T(notes.map((n) => n.en).join(' '), notes.map((n) => n.ko ?? n.en).join(' '));
const busy = (g: Game) => !!(g.active || g.letter || g.report) || !g.player.alive;
const BUSY = T('Finish what is in front of you first.', '눈앞의 일부터 마무리하라.');

// ---------------------------------------------------------------- belief

/** The way the player mostly keeps, once they have kept any practice a few times. */
export function pathOf(g: Game): PathId | null {
  const by: Partial<Record<PathId, number>> = {};
  for (const p of PRACTICES) by[p.path] = (by[p.path] ?? 0) + (g.player.belief.practice[p.id] ?? 0);
  const top = (Object.entries(by) as [PathId, number][]).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] >= 3 ? top[0] : null;
}
export const pathName = (g: Game): Text => {
  const p = pathOf(g);
  return p ? PATHS[p].name : T('No settled way yet', '아직 정한 길이 없음');
};
export function practiceOpen(g: Game, p: PracticeDef): boolean {
  if (playerAge(g) < p.minAge) return false;
  if (g.campaign.mode !== 'historical') return true;
  return (p.from === undefined || g.date.year >= p.from) && (p.to === undefined || g.date.year <= p.to);
}
export const openPractices = (g: Game) => PRACTICES.filter((p) => practiceOpen(g, p));
export function practiceBar(g: Game, id: string): Text | null {
  const p = PRACTICES.find((x) => x.id === id);
  if (!p || !practiceOpen(g, p)) return T('Not to be found in these years.', '이 시절에는 접할 수 없다.');
  if (p.cost && !canPay(g, p.cost)) return T('You cannot afford it.', '형편이 안 된다.');
  if (id === 'fortune' && (g.counts['fortune-year'] ?? 0) === g.date.year) return T('She has read this year already.', '올해 운은 이미 보았다.');
  return partBar(g, 'belief:' + id, p.evening);
}

/** What the mudang says: nothing she could not see for herself (GSDD Part XVI §9). */
function reading(g: Game): Text {
  const P = g.player;
  if (P.conditions.length || P.health < 45) return T('“Your pulse is thin this year. Stay out of the wind and send for a physician before the cold comes.”', '“올해는 기운이 약하오. 찬바람을 피하고 추워지기 전에 의원을 부르시오.”');
  if (g.econ.debts.length) return T('“Money leaves your house by a door you have forgotten. Close it before the harvest.”', '“잊고 있던 문으로 재물이 새고 있소. 추수 전에 닫으시오.”');
  if (P.stress >= 60) return T('“You carry a stone in your chest. Put it down for one season, or it will put you down.”', '“가슴에 돌을 얹고 사시는구려. 한 철만 내려놓으시오. 아니면 그 돌이 당신을 눕힐 것이오.”');
  if (examHeld(g) && P.gender === 'man' && !P.quals.includes('munkwa') && !P.quals.includes('mukwa')) return T('“The brush is strong in your year. If you mean to sit the examination, sit it now.”', '“올해는 붓의 기운이 세오. 과거를 볼 생각이면 지금 보시오.”');
  if (Object.values(g.rel).some((r) => (r.dims?.resentment ?? 0) >= 45 || r.regard <= -30)) return T('“Someone smiles at you and keeps a knife in the sleeve. You already know who.”', '“웃는 낯으로 소매에 칼을 품은 이가 있소. 누군지는 이미 아실 것이오.”');
  if (playerAge(g) >= 20 && !Object.values(g.rel).some((r) => r.bond === 'spouse')) return T('“A red thread is tied to your ankle. It has not been pulled tight yet.”', '“발목에 붉은 실이 매여 있소. 아직 당겨지지 않았을 뿐.”');
  return T('“A quiet year. Do not go looking for trouble and it will not come looking for you.”', '“조용한 한 해요. 화를 찾아 나서지 않으면 화도 찾아오지 않소.”');
}

export function practice(g0: Game, id: string): Done {
  if (practiceBar(g0, id)) return no(g0);
  const g = clone(g0);
  const P = g.player;
  const p = PRACTICES.find((x) => x.id === id)!;
  if (p.cost) pay(g, p.cost);
  P.belief.practice[id] = (P.belief.practice[id] ?? 0) + 1;
  P.belief.conviction = clamp(P.belief.conviction + 3, 0, 100);
  g.counts.practices = (g.counts.practices ?? 0) + 1;
  const notes: Text[] = [];
  const scoffed = (P.office?.rank ?? 0) >= 2 && g.campaign.mode === 'historical';
  switch (id) {
    case 'jesa':
      P.honour = clamp(P.honour + 2, 0, 100);
      P.stress = clamp(P.stress - (inMourning(g) ? 6 : 3), 0, 100);
      feel(g, null, 1);
      notes.push(T('The table is laid and the wine poured. The house is in order with its dead. Honour +2.', '상을 차리고 술을 올렸다. 집안이 조상 앞에 떳떳하다. 명예 +2.'));
      break;
    case 'sitting':
      P.stress = clamp(P.stress - 7, 0, 100);
      if (roll(g, 'sitting') < 0.3) bumpAttr(P, 'discipline', 1);
      notes.push(T('An hour without a single useful thought, which was the point. Stress −7.', '쓸모 있는 생각이라곤 하나도 없던 한 시간. 그게 바로 수양이다. 근심 −7.'));
      break;
    case 'lantern':
      P.stress = clamp(P.stress - 5, 0, 100);
      feel(g, null, 3);
      notes.push(T('Your lantern hangs among a hundred others. Stress −5, happiness +3.', '당신의 연등이 수백 개의 등 사이에 걸렸다. 근심 −5, 행복 +3.'));
      if (scoffed) { P.reputation = clamp(P.reputation - 1, 0, 100); notes.push(T('A colleague saw you there. Reputation −1.', '동료가 그 모습을 보았다. 평판 −1.')); }
      break;
    case 'fortune':
      g.counts['fortune-year'] = g.date.year;
      notes.push(reading(g));
      P.stress = clamp(P.stress - 2, 0, 100);
      if (scoffed) { P.honour = clamp(P.honour - 1, 0, 100); notes.push(T('A scholar should not be seen here. Honour −1.', '선비가 드나들 곳이 아니라고들 한다. 명예 −1.')); }
      break;
    case 'practical':
      notes.push(study(g, 'practical', 2));
      if (roll(g, 'silhak') < 0.25) bumpAttr(P, 'judgement', 1);
      break;
    case 'western':
      notes.push(study(g, 'practical', 2));
      if (roll(g, 'seohak') < 0.3) bumpAttr(P, 'intelligence', 1);
      g.flags.seohak = true;
      notes.push(T('You hide the book behind the Analects.', '책을 논어 뒤에 숨겨 두었다.'));
      break;
  }
  usePart(g, 'belief:' + id, notes);
  return { game: g, note: join(notes) };
}

// ---------------------------------------------------------------- writings

const sk = (g: Game, id: string) => g.player.skills[id] ?? 0;
const ed = (g: Game, id: string) => g.player.edu[id] ?? 0;
function workNeeds(g: Game, kind: string): boolean {
  switch (kind) {
    case 'poem': return sk(g, 'poetry') >= 25;
    case 'essay': return ed(g, 'classics') >= 40;
    case 'travel': return (g.counts.journeys ?? 0) > 0 || g.player.quals.includes('envoy');
    case 'chronicle': return playerAge(g) >= 40;
    case 'commentary': return ed(g, 'classics') >= 65 && sk(g, 'calligraphy') >= 30;
    case 'medical': return sk(g, 'medicine') >= 60;
    case 'album': return sk(g, 'painting') >= 50;
    default: return false;
  }
}
function workQuality(g: Game, kind: string): number {
  const P = g.player;
  const a = (k: string) => P.attrs[k] ?? 40;
  const base = kind === 'poem' ? sk(g, 'poetry') * 0.7 + a('creativity') * 0.3
    : kind === 'essay' ? ed(g, 'classics') * 0.5 + a('creativity') * 0.25 + sk(g, 'calligraphy') * 0.25
      : kind === 'travel' ? a('creativity') * 0.5 + ed(g, 'classics') * 0.3 + Math.min(30, (g.counts.journeys ?? 0) * 8)
        : kind === 'chronicle' ? a('memory') * 0.4 + ed(g, 'classics') * 0.4 + Math.min(20, playerAge(g) / 3)
          : kind === 'commentary' ? ed(g, 'classics') * 0.6 + a('scholarship') * 0.4
            : kind === 'medical' ? sk(g, 'medicine') * 0.7 + a('intelligence') * 0.3
              : sk(g, 'painting') * 0.7 + a('creativity') * 0.3;
  return Math.round(clamp(base + (roll(g, 'work-q:' + kind + P.works.length) - 0.4) * 30, 5, 100));
}
export function composeBar(g: Game, kind: string): Text | null {
  const k = WORK_KINDS.find((x) => x.id === kind);
  if (!k) return T('Unknown.', '알 수 없음.');
  if (busy(g)) return BUSY;
  if (playerAge(g) < 15) return T('You are too young to finish a work.', '작품을 완성하기엔 아직 어리다.');
  if (!workNeeds(g, kind)) return T(`Needs: ${k.needs.en}.`, `필요: ${k.needs.ko}.`);
  if ((g.counts['work-year'] ?? 0) === g.date.year) return T('One finished work a year is enough for any brush.', '한 해에 한 편이면 어느 붓에나 족하다.');
  if (g.player.works.filter((w) => w.kind === kind).length >= k.titles.length) return T('You have said all you have to say in this form.', '이 형식으로 할 말은 다 했다.');
  return partBar(g, 'compose', true);
}
export function compose(g0: Game, kind: string): Done {
  if (composeBar(g0, kind)) return no(g0);
  const g = clone(g0);
  const P = g.player;
  const k = WORK_KINDS.find((x) => x.id === kind)!;
  const used = new Set(P.works.map((w) => w.title.en));
  const free = k.titles.filter((t) => !used.has(t[0]));
  const t = free[Math.floor(roll(g, 'work-title:' + kind) * free.length)];
  const quality = workQuality(g, kind);
  g.counts['work-year'] = g.date.year;
  g.counts.works = (g.counts.works ?? 0) + 1;
  P.works.push({ id: `w${g.dayCount}-${kind}`, kind, title: T(t[0], t[1]), year: g.date.year, quality });
  const rep = quality >= 80 ? 5 : quality >= 55 ? 3 : quality >= 30 ? 1 : 0;
  P.reputation = clamp(P.reputation + rep, 0, 100);
  feel(g, quality >= 55 ? 'proud' : null, quality >= 55 ? 7 : 3, 45);
  const notes: Text[] = [T(`You finish “${t[0]}”.`, `《${t[1]}》을(를) 탈고했다.`)];
  notes.push(quality >= 80 ? T('It is copied from hand to hand across the capital. Reputation +5.', '도성 안에서 손에서 손으로 필사된다. 평판 +5.')
    : quality >= 55 ? T('Friends ask for copies. Reputation +3.', '벗들이 베껴 가기를 청한다. 평판 +3.')
      : quality >= 30 ? T('A respectable piece of work. Reputation +1.', '무난한 글이다. 평판 +1.')
        : T('You will do better next time; you put it in a drawer.', '다음엔 더 잘 쓰리라. 서랍에 넣어 두었다.'));
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'life', text: T(`Finished ${k.name.en.toLowerCase()}: “${t[0]}”.`, `${k.name.ko} 《${t[1]}》 탈고.`) });
  usePart(g, 'compose', notes);
  return { game: g, note: join(notes) };
}

// ---------------------------------------------------------------- patronage

export function patronBar(g: Game, id: string): Text | null {
  const d = PATRONAGE.find((x) => x.id === id);
  if (!d) return T('Unknown.', '알 수 없음.');
  if (busy(g)) return BUSY;
  if (playerAge(g) < 18) return T('Not at your age.', '아직 어린 나이다.');
  if (g.player.legal === 'commoner') return T('You have nothing to give now.', '지금은 베풀 것이 없다.');
  if ((g.counts['patron-day'] ?? -999) > g.dayCount - 90) return T('One act of patronage a season.', '후원은 한 철에 한 번.');
  if (id === 'print' && !g.player.works.length) return T('You have written nothing to print.', '간행할 글이 없다.');
  if (id === 'print' && g.flags[`printed-${g.player.works.length}`]) return T('Your writings so far are already in print.', '지금까지의 글은 이미 간행했다.');
  if (d.house) {
    if (!holdsKeys(g)) return T('Only the head of the house can spend from the treasury.', '집안 곳간은 가장만 쓸 수 있다.');
    if (g.econ.treasury < d.cost) return T('The family treasury cannot bear it.', '곳간이 감당하지 못한다.');
  } else if (!canPay(g, d.cost)) return T('You cannot afford it.', '형편이 안 된다.');
  return null;
}
export function patron(g0: Game, id: string): Done {
  if (patronBar(g0, id)) return no(g0);
  const g = clone(g0);
  const P = g.player;
  const d = PATRONAGE.find((x) => x.id === id)!;
  if (d.house) g.econ.treasury -= d.cost;
  else pay(g, d.cost);
  g.counts['patron-day'] = g.dayCount;
  g.counts.patronage = (g.counts.patronage ?? 0) + 1;
  const up = (k: 'reputation' | 'honour', n: number) => { P[k] = clamp(P[k] + n, 0, 100); };
  let note: Text;
  switch (id) {
    case 'scholar': up('reputation', 2); up('honour', 2); note = T('A thin young man bows very low and promises to remember. Reputation +2, honour +2.', '마른 젊은이가 깊이 절하며 잊지 않겠다고 한다. 평판 +2, 명예 +2.'); break;
    case 'painting': feel(g, null, 4); up('reputation', 1); if (roll(g, 'screen') < 0.25) g.house.prestige = clamp(g.house.prestige + 1, 1, 5); note = T('Eight panels of peonies stand behind the seat of honour. Guests notice.', '여덟 폭 모란 병풍이 상석 뒤에 섰다. 손님들이 눈여겨본다.'); break;
    case 'school': up('reputation', 4); up('honour', 3); feel(g, null, 3); note = T('Thirty children chant the Thousand Characters under your roof tiles. Reputation +4, honour +3.', '서른 명의 아이들이 당신이 올린 기와 아래서 천자문을 외운다. 평판 +4, 명예 +3.'); break;
    case 'temple': P.stress = clamp(P.stress - 6, 0, 100); feel(g, null, 4); P.belief.practice.lantern = (P.belief.practice.lantern ?? 0) + 2; if ((P.office?.rank ?? 0) >= 2 && g.campaign.mode === 'historical') up('reputation', -1); note = T('Fresh dancheong on old beams, and your name on a small wooden tablet. Stress −6.', '낡은 들보에 새 단청, 작은 나무패에 당신의 이름. 근심 −6.'); break;
    case 'print': up('reputation', 3 + Math.min(3, P.works.filter((w) => w.quality >= 55).length)); g.flags[`printed-${P.works.length}`] = true; feel(g, 'proud', 5, 45); note = T('The woodblocks are cut and the first copies go out to friends and academies.', '목판을 새기고 첫 인쇄본을 벗들과 서원에 보냈다.'); break;
    default: up('reputation', 4); up('honour', 4); feel(g, null, 3); for (const st of Object.values(g.econ.provinces)) st.stability = clamp(st.stability + 1, 10, 95); note = T('The storehouse doors stand open for three days. Reputation +4, honour +4.', '사흘 동안 곳간 문을 열어 두었다. 평판 +4, 명예 +4.'); break;
  }
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'life', text: T(`Patronage: ${d.name.en.toLowerCase()}.`, `후원: ${d.name.ko}.`) });
  return { game: g, note };
}

// ---------------------------------------------------------------- companion animals

export function adoptBar(g: Game, id: string): Text | null {
  const d = petById(id);
  if (!d) return T('Unknown.', '알 수 없음.');
  if (busy(g)) return BUSY;
  if (g.player.pet) return T('You already have a companion.', '이미 곁에 두는 짐승이 있다.');
  if (playerAge(g) < 8) return T('Too young to keep one.', '기르기엔 너무 어리다.');
  if (d.who === 'man' && g.player.gender !== 'man' && g.campaign.mode === 'historical') return T('Falconry was a man’s sport.', '매사냥은 사내들의 놀이였다.');
  if (!canPay(g, d.cost)) return T('You cannot afford it.', '형편이 안 된다.');
  return null;
}
export function givePet(g: Game, id: string): Text | null {
  const d = petById(id);
  if (!d || g.player.pet) return null;
  const n = d.names[Math.floor(roll(g, 'pet-name:' + id) * d.names.length)];
  g.player.pet = { kind: id, name: T(n[0], n[1]), born: g.date.year, span: d.span + Math.floor(roll(g, 'pet-span') * 4) - 1 };
  g.counts.pets = (g.counts.pets ?? 0) + 1;
  feel(g, 'happy', 6, 30);
  return T(`${d.name.en}, whom you name ${n[0]}, is yours.`, `${d.name.ko} 한 마리가 식구가 되었다. 이름은 ${n[1]}.`);
}
export function adopt(g0: Game, id: string): Done {
  if (adoptBar(g0, id)) return no(g0);
  const g = clone(g0);
  pay(g, petById(id)!.cost);
  return { game: g, note: givePet(g, id) };
}
export function petBar(g: Game): Text | null {
  if (!g.player.pet) return T('You have no companion.', '곁에 두는 짐승이 없다.');
  return partBar(g, 'pet', true);
}
export function petTime(g0: Game): Done {
  if (petBar(g0)) return no(g0);
  const g = clone(g0);
  const P = g.player;
  const pet = P.pet!;
  P.stress = clamp(P.stress - 4, 0, 100);
  feel(g, null, 2);
  const falcon = pet.kind === 'falcon';
  if (falcon && seasonOf(g.date.moon) === 3 && roll(g, 'hunt') < 0.5) { P.reputation = clamp(P.reputation + 1, 0, 100); }
  const notes = [falcon ? T(`${pet.name.en} takes a pheasant on the winter field.`, `${pet.name.ko ?? pet.name.en}이(가) 들판에서 꿩을 낚아챘다.`) : T(`An hour with ${pet.name.en}. Stress −4.`, `${pet.name.ko ?? pet.name.en}와(과) 보낸 한 시간. 근심 −4.`)];
  usePart(g, 'pet', notes);
  return { game: g, note: join(notes) };
}

// ---------------------------------------------------------------- the military branch (GSDD Part XI §6.5)

export type Branch = 'land' | 'naval' | 'guard' | 'border';
export const BRANCHES: Record<Branch, { name: Text; text: Text; attr: string }> = {
  land: { name: T('Field army', '육군'), text: T('Infantry and cavalry in the provinces. Leadership grows.', '지방의 보병과 기병. 통솔력이 는다.'), attr: 'leadership' },
  naval: { name: T('Navy', '수군'), text: T('Panokseon warships and the southern coast. Strategy grows.', '판옥선과 남해안. 전략이 는다.'), attr: 'strategy' },
  guard: { name: T('Royal guard', '금군'), text: T('The palace gates and the king’s person. Royal favour grows.', '궁궐 문과 임금의 곁. 총애가 는다.'), attr: 'etiquette' },
  border: { name: T('Border garrison', '변방'), text: T('The forts along the Yalu and Tumen. Martial skill grows.', '압록강과 두만강의 진보. 무예가 는다.'), attr: 'martial' },
};
export const branchOf = (g: Game): Branch | null => (['land', 'naval', 'guard', 'border'] as Branch[]).find((b) => g.flags['branch-' + b]) ?? null;
export function branchBar(g: Game, b: Branch): Text | null {
  if (g.player.office?.track !== 'military') return T('Only for military officers.', '무관만 고를 수 있다.');
  if (branchOf(g) === b) return T('This is your branch.', '지금 몸담은 곳이다.');
  if ((g.counts['branch-year'] ?? 0) === g.date.year) return T('A posting lasts at least the year.', '보직은 적어도 한 해는 간다.');
  return busy(g) ? BUSY : null;
}
export function setBranch(g0: Game, b: Branch): Done {
  if (branchBar(g0, b)) return no(g0);
  const g = clone(g0);
  for (const k of ['land', 'naval', 'guard', 'border']) g.flags['branch-' + k] = k === b;
  g.counts['branch-year'] = g.date.year;
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'career', text: T(`Posted to the ${BRANCHES[b].name.en.toLowerCase()}.`, `${BRANCHES[b].name.ko}에 배속되었다.`) });
  return { game: g, note: T(`You are posted to the ${BRANCHES[b].name.en.toLowerCase()}.`, `${BRANCHES[b].name.ko}에 배속되었다.`) };
}

// ---------------------------------------------------------------- the season

export function cultureSeason(g: Game, say: Say) {
  const P = g.player;
  scenarioCheck(g, say);
  if (!P.alive) return;
  const season = seasonOf(g.date.moon);
  // The year's festivals, unless the house is in mourning.
  if (!inMourning(g) && playerAge(g) >= 6) {
    const lines = FESTIVAL_LINES[season];
    say(lines[g.date.year % lines.length]);
    feel(g, null, 1);
  }
  // Conviction fades slowly when nothing is kept up.
  P.belief.conviction = clamp(P.belief.conviction - 1, 0, 100);
  // A companion grows old.
  const pet = P.pet;
  if (pet && g.date.year - pet.born >= pet.span && season === 3) {
    say(T(`${pet.name.en} died this winter, old and well loved.`, `${pet.name.ko ?? pet.name.en}이(가) 이번 겨울 세상을 떠났다. 오래 살았고 사랑받았다.`), true);
    P.pet = null;
    feel(g, 'sad', -8, 90);
  }
  // A posting shapes an officer, a little each spring.
  const b = branchOf(g);
  if (b && P.office?.track === 'military' && season === 0) {
    if (b === 'guard') P.favour = clamp(P.favour + 2, 0, 100);
    else bumpAttr(P, BRANCHES[b].attr, 1);
  } else if (b && P.office?.track !== 'military') {
    for (const k of ['land', 'naval', 'guard', 'border']) g.flags['branch-' + k] = false;
  }
  // Those who read Western books are in danger in the years of persecution.
  if (g.campaign.mode === 'historical' && g.flags.seohak && [1801, 1839, 1866].includes(g.date.year) && season === 0 && !g.flags['seohak-' + g.date.year]) {
    g.flags['seohak-' + g.date.year] = true;
    P.stress = clamp(P.stress + 15, 0, 100);
    feel(g, 'fearful', -6, 120);
    notify(g, 'political', 'critical', T('The persecution has begun. Houses are being searched for Western books.', '박해가 시작되었다. 서학서를 찾아 집집을 뒤지고 있다.'));
    say(T('Officers are searching houses for Western books. Yours are behind the Analects. You do not sleep.', '관원들이 서학서를 찾아 집집을 뒤진다. 당신의 책은 논어 뒤에 있다. 잠이 오지 않는다.'), true);
  }
}
// ---------------------------------------------------------------- scenarios

/** Checks the life's scenario: won when its goal is met, lost when its time has run out. */
export function scenarioCheck(g: Game, say?: Say) {
  const sc = g.scenario;
  if (!sc || sc.status !== 'open') return;
  const d = scenarioById(sc.id);
  if (!d) return;
  if (d.won(g)) {
    sc.status = 'won';
    sc.day = g.dayCount;
    const t = T(`Scenario complete: ${d.name.en}. ${d.goal.en}`, `시나리오 달성: ${d.name.ko}. ${d.goal.ko}`);
    g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'life', text: t });
    notify(g, 'personal', 'critical', t);
    feel(g, 'joyful', 12, 120);
    say?.(t, false);
  } else if ((d.byAge !== undefined && g.generation === 1 && playerAge(g) >= d.byAge) || (!g.player.alive && !d.heirs) || (d.byAge !== undefined && g.generation > 1 && !d.heirs)) {
    sc.status = 'lost';
    sc.day = g.dayCount;
    const t = T(`The scenario “${d.name.en}” has slipped out of reach. The life goes on.`, `시나리오 ‘${d.name.ko}’은(는) 이제 이룰 수 없다. 삶은 계속된다.`);
    notify(g, 'personal', 'high', t);
    say?.(t, false);
  }
}
export { PATHS };

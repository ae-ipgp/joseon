import type { Dims, Game, Mail, Rel, Text } from '../model/schemas';
import { T, signed } from './text';
import { clamp, clone, npcAge, playerName, roll } from './world';
import { playerAge } from './time';
import { emit, remember } from './bus';
import { bumpAttr } from './character';

/**
 * GSDD Part V §12: relationships carry more than affection. Trust, respect, fear, resentment, gratitude
 * and rivalry move separately; interactions test them; people remember what was done; and the player's
 * standing is read across several domains, so one can be admired as a scholar and distrusted at court.
 */

type Say = (t: Text, record?: boolean) => void;
export type DimKey = keyof Dims;
const NEUTRAL: Record<DimKey, number> = { trust: 40, respect: 40, fear: 0, resentment: 0, gratitude: 0, rivalry: 0 };
export const DIM_KEYS: DimKey[] = ['trust', 'respect', 'gratitude', 'resentment', 'rivalry', 'fear'];
export const DIM_NAMES: Record<DimKey, Text> = {
  trust: T('Trust', '신뢰'), respect: T('Respect', '존경'), gratitude: T('Gratitude', '은혜'),
  resentment: T('Resentment', '원망'), rivalry: T('Rivalry', '경쟁심'), fear: T('Fear', '두려움'),
};
export const dimOf = (r: Rel | undefined, k: DimKey) => r?.dims?.[k] ?? NEUTRAL[k];
export function bumpDim(g: Game, id: string, k: DimKey, d: number) {
  const r = g.rel[id];
  if (!r) return;
  r.dims = { ...(r.dims ?? {}), [k]: clamp(dimOf(r, k) + d, 0, 100) };
}

/** What kind of tie this is, in the categories of §12.1. */
export function tieOf(g: Game, id: string): Text {
  const n = g.npcs[id];
  const r = g.rel[id];
  if (!n || !r) return T('Acquaintance', '지인');
  if (r.bond === 'spouse') return T('Spouse', '배우자');
  if (r.bond === 'betrothed') return T('Betrothed', '정혼자');
  if (n.kin === 'child') return T('Child', '자녀');
  if (n.kin) return T('Family', '가족');
  if (g.flags[`ally-${id}`]) return T('Political ally', '정치적 동맹');
  if (dimOf(r, 'rivalry') >= 50 || r.regard <= -30) return T('Rival', '맞수');
  if (n.id === 'tutor' || n.id === 'teacher') return T('Mentor', '스승');
  if (r.regard >= 45) return T('Friend', '벗');
  if (n.faction !== 'none' && n.faction === g.pol.side) return T('Faction member', '같은 당');
  if (n.post) return T('Colleague', '동료');
  return T('Acquaintance', '지인');
}

export type InteractionId = 'compliment' | 'debate' | 'request' | 'invite' | 'apologise' | 'challenge' | 'alliance' | 'end';
export type Interaction = { id: InteractionId; label: Text; hint: Text };
export const INTERACTIONS: Interaction[] = [
  { id: 'compliment', label: T('Compliment', '칭찬하기'), hint: T('Persuasion; a poor compliment is taken as flattery', '설득력. 서툴면 아첨으로 들린다') },
  { id: 'debate', label: T('Debate a point', '논쟁하기'), hint: T('Scholarship; earns respect, may stir rivalry', '학식. 존경을 얻지만 경쟁심을 부를 수 있다') },
  { id: 'request', label: T('Ask for help', '도움 청하기'), hint: T('Needs trust; spends their goodwill', '신뢰가 필요하다. 호의를 쓴다') },
  { id: 'invite', label: T('Invite to your house', '집으로 초대하기'), hint: T('Costs 12 nyang; warmth and trust', '12냥. 정과 신뢰'), },
  { id: 'apologise', label: T('Apologise', '사과하기'), hint: T('Eases resentment; costs a little honour', '원망을 누그러뜨린다. 명예가 조금 깎인다') },
  { id: 'challenge', label: T('Challenge them', '맞서기'), hint: T('Authority; they may fear you, or hate you', '위엄. 두려워하거나 미워하게 된다') },
  { id: 'alliance', label: T('Propose an alliance', '동맹 제안'), hint: T('Needs regard 45 and trust 55', '호감 45, 신뢰 55 필요') },
  { id: 'end', label: T('Break off ties', '관계 끊기'), hint: T('Ends an alliance or a friendship', '동맹이나 우정을 끝낸다') },
];

const ixKey = (id: string) => `ix:${id}`;
/** Why an interaction is not possible now, or null. */
export function interactBar(g: Game, id: string, kind: InteractionId): Text | null {
  const n = g.npcs[id];
  const r = g.rel[id];
  if (!n || !r || !n.alive || n.away) return T('They are not here.', '여기 없다.');
  if (!r.met) return T('You have not been introduced.', '아직 인사를 나누지 않았다.');
  if (g.active || g.letter || g.report) return T('Finish what is in front of you first.', '눈앞의 일부터 마무리하라.');
  if ((g.counts[ixKey(id)] ?? -1) === g.dayCount) return T('You have already spent time with them today.', '오늘은 이미 이야기를 나누었다.');
  const child = playerAge(g) < 15;
  if (child && !['compliment', 'apologise'].includes(kind)) return T('Not at your age.', '아직 어린 나이다.');
  switch (kind) {
    case 'request':
      if (dimOf(r, 'trust') < 45 || r.regard < 20) return T('They do not trust you enough to help.', '도와줄 만큼 당신을 믿지 않는다.');
      if ((g.counts[`asked:${id}`] ?? -999) > g.dayCount - 90) return T('You asked them this season already.', '이번 철에 이미 부탁했다.');
      return null;
    case 'invite':
      if (g.player.mourning && g.dayCount < g.player.mourning.until) return T('Not while in mourning.', '상중에는 손님을 치르지 않는다.');
      return g.player.money < 12 ? T('You cannot afford to host.', '손님을 치를 돈이 없다.') : null;
    case 'apologise':
      return dimOf(r, 'resentment') < 5 && r.regard >= 0 ? T('There is nothing to apologise for.', '사과할 일이 없다.') : null;
    case 'alliance':
      if (g.flags[`ally-${id}`]) return T('You are already allies.', '이미 동맹이다.');
      if (n.kin) return T('Family are already bound to you.', '가족은 이미 한 몸이다.');
      if (npcAge(g, n) < 18) return T('They are too young.', '너무 어리다.');
      return r.regard < 45 || dimOf(r, 'trust') < 55 ? T('Needs regard 45 and trust 55.', '호감 45와 신뢰 55가 필요하다.') : null;
    case 'end':
      return g.flags[`ally-${id}`] || r.regard >= 30 ? null : T('There are no ties to break.', '끊을 관계가 없다.');
    case 'challenge':
      return n.kin === 'mother' || n.kin === 'father' || n.id === 'king' ? T('That would be unthinkable.', '생각조차 할 수 없는 일이다.') : null;
    default:
      return null;
  }
}

const skill = (g: Game, a: string) => g.player.attrs[a] ?? 40;
const pass = (g: Game, key: string, p: number) => roll(g, key) < clamp(p, 0.08, 0.92);

export function interact(g0: Game, id: string, kind: InteractionId): { game: Game; note: Text | null } {
  if (interactBar(g0, id, kind)) return { game: g0, note: null };
  const g = clone(g0);
  const n = g.npcs[id];
  const r = g.rel[id];
  const nm = n.name;
  g.counts[ixKey(id)] = g.dayCount;
  g.counts.interactions = (g.counts.interactions ?? 0) + 1;
  const reg = (d: number) => { r.regard = clamp(r.regard + d, -100, 100); };
  const K = `ix-${kind}:${id}`;
  let out: Text;
  switch (kind) {
    case 'compliment': {
      const ok = pass(g, K, 0.45 + (skill(g, 'persuasion') - 40) / 80 + dimOf(r, 'trust') / 300);
      if (ok) { reg(3); bumpDim(g, id, 'trust', 2); bumpAttr(g.player, 'persuasion', 1); out = T(`${nm.en} is pleased. Regard +3.`, `${nm.ko}이(가) 흐뭇해한다. 호감 +3.`); }
      else { bumpDim(g, id, 'trust', -3); out = T(`${nm.en} smiles thinly; it sounded like flattery. Trust −3.`, `${nm.ko}이(가) 엷게 웃는다. 아첨으로 들린 모양이다. 신뢰 −3.`); }
      break;
    }
    case 'debate': {
      const ok = pass(g, K, 0.4 + (skill(g, 'scholarship') - 40) / 70);
      bumpAttr(g.player, 'scholarship', 1);
      if (ok) { bumpDim(g, id, 'respect', 7); if (n.faction !== g.pol.side && n.faction !== 'none') bumpDim(g, id, 'rivalry', 4); out = T(`You carry the argument. ${nm.en} concedes the point, not entirely gladly. Respect +7.`, `논쟁에서 이겼다. ${nm.ko}이(가) 마지못해 수긍한다. 존경 +7.`); }
      else { bumpDim(g, id, 'respect', -3); out = T(`${nm.en} has the better of it today. Respect −3.`, `오늘은 ${nm.ko}의 말이 더 옳았다. 존경 −3.`); }
      break;
    }
    case 'request': {
      g.counts[`asked:${id}`] = g.dayCount;
      reg(-3);
      bumpDim(g, id, 'gratitude', -10);
      if (n.post && n.faction === g.pol.side && g.pol.side !== 'neutral' as never) {
        g.pol.standing = clamp(g.pol.standing + 5, 0, 100);
        out = T(`${nm.en} speaks for you among the faction. Standing +5.`, `${nm.ko}이(가) 당내에서 당신 편을 들어준다. 당내 입지 +5.`);
      } else if (n.post) {
        g.player.reputation = clamp(g.player.reputation + 2, 0, 100);
        out = T(`${nm.en} puts in a word for you where it counts. Reputation +2.`, `${nm.ko}이(가) 요긴한 곳에 말을 넣어 준다. 평판 +2.`);
      } else {
        const sum = 20 + Math.round(dimOf(r, 'trust') / 4);
        g.player.money += sum;
        out = T(`${nm.en} lends you ${sum} nyang, and will not hear of interest.`, `${nm.ko}이(가) 이자 없이 ${sum}냥을 빌려준다.`);
      }
      remember(g, id, T('You asked for their help.', '당신이 도움을 청했다.'));
      break;
    }
    case 'invite': {
      g.player.money -= 12;
      reg(4); bumpDim(g, id, 'trust', 4);
      g.player.stress = clamp(g.player.stress - 4, 0, 100);
      remember(g, id, T('A long evening as your guest.', '당신 집에서 보낸 긴 저녁.'));
      out = T(`${nm.en} stays late over wine and rice cakes. Regard +4, trust +4.`, `${nm.ko}이(가) 술과 떡을 들며 늦게까지 머문다. 호감 +4, 신뢰 +4.`);
      break;
    }
    case 'apologise': {
      bumpDim(g, id, 'resentment', -15);
      reg(r.regard < 0 ? 6 : 2);
      g.player.honour = clamp(g.player.honour - 1, 0, 100);
      remember(g, id, T('You apologised to them.', '당신이 그에게 사과했다.'));
      out = T(`${nm.en} accepts your apology. Resentment −15.`, `${nm.ko}이(가) 사과를 받아들인다. 원망 −15.`);
      break;
    }
    case 'challenge': {
      const ok = pass(g, K, 0.35 + (skill(g, 'command') - 40) / 70 + g.player.reputation / 300);
      if (ok) { bumpDim(g, id, 'fear', 12); bumpDim(g, id, 'respect', 3); reg(-4); out = T(`${nm.en} gives way. They will think twice before crossing you. Fear +12.`, `${nm.ko}이(가) 물러선다. 다음엔 함부로 나서지 못할 것이다. 두려움 +12.`); }
      else { bumpDim(g, id, 'resentment', 12); bumpDim(g, id, 'rivalry', 10); reg(-8); out = T(`${nm.en} does not give an inch, and will not forget it. Resentment +12.`, `${nm.ko}은(는) 한 치도 물러서지 않았고 이 일을 잊지 않을 것이다. 원망 +12.`); }
      remember(g, id, T('You confronted them.', '당신이 그와 맞섰다.'));
      break;
    }
    case 'alliance': {
      g.flags[`ally-${id}`] = true;
      bumpDim(g, id, 'trust', 5);
      g.counts.alliances = (g.counts.alliances ?? 0) + 1;
      emit(g, { type: 'FACTION_CHANGED', npc: id, text: T(`Alliance agreed with ${nm.en}.`, `${nm.ko}와(과) 동맹을 맺었다.`) });
      g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'politics', text: T(`Made an alliance with ${nm.en}.`, `${nm.ko}와(과) 동맹을 맺었다.`) });
      out = T(`You and ${nm.en} agree to stand together.`, `${nm.ko}와(과) 서로 힘이 되기로 약조했다.`);
      break;
    }
    case 'end': {
      const was = !!g.flags[`ally-${id}`];
      g.flags[`ally-${id}`] = false;
      reg(-25);
      bumpDim(g, id, 'resentment', 20);
      remember(g, id, T('You broke off with them.', '당신이 그와 관계를 끊었다.'));
      out = was ? T(`The alliance with ${nm.en} is over.`, `${nm.ko}와(과)의 동맹이 끝났다.`) : T(`You let ${nm.en} know you are no longer friends.`, `${nm.ko}에게 더는 벗이 아님을 알렸다.`);
      break;
    }
  }
  return { game: g, note: out };
}

/** §12.5: standing read across domains, from what the player has done (not stored, so it never drifts from the record). */
export type Domain = 'family' | 'scholarly' | 'political' | 'military' | 'commercial' | 'court' | 'conduct';
export const DOMAIN_NAMES: Record<Domain, Text> = {
  family: T('Family', '가문'), scholarly: T('Scholarly', '학문'), political: T('Political', '정치'), military: T('Military', '무공'),
  commercial: T('Commercial', '상업'), court: T('Court', '왕실'), conduct: T('Personal conduct', '품행'),
};
export function reputationDomains(g: Game): Record<Domain, number> {
  const P = g.player;
  const a = (k: string) => P.attrs[k] ?? 40;
  const quals = P.quals?.length ?? 0;
  const civil = P.office?.track === 'civil' ? P.office.rank : 0;
  const mil = P.office?.track === 'military' ? P.office.rank : 0;
  const wins = g.counts.victories ?? 0;
  const biz = g.econ.businesses.reduce((n, b) => n + b.repute, 0) / Math.max(1, g.econ.businesses.length);
  const allies = Object.keys(g.flags).filter((k) => k.startsWith('ally-') && g.flags[k]).length;
  const r = (v: number) => Math.round(clamp(v, 0, 100));
  return {
    family: r(g.house.prestige * 16 + (P.legal === 'commoner' ? -40 : 0) + P.honour / 5),
    scholarly: r(a('scholarship') * 0.6 + quals * 12 + civil * 3),
    political: r(P.reputation * 0.4 + g.pol.standing * 0.3 + civil * 4 + allies * 4),
    military: r(a('leadership') * 0.3 + mil * 8 + wins * 8),
    commercial: r((g.econ.businesses.length ? biz * 0.6 : 0) + (g.counts.businesses ?? 0) * 8 + a('administration') * 0.15),
    court: r(P.favour * 0.8 + (P.royal !== 'none' ? 20 : 0)),
    conduct: r(P.honour * 0.7 + a('integrity') * 0.3 - (g.flags.condemned ? 30 : 0)),
  };
}

/** §12.3 letters: write to someone; once each per season. */
export type LetterKind = 'greeting' | 'condolence' | 'support' | 'invitation';
export const LETTER_KINDS: { id: LetterKind; label: Text }[] = [
  { id: 'greeting', label: T('Seasonal greeting', '안부 편지') },
  { id: 'support', label: T('Ask for support', '지지 요청') },
  { id: 'invitation', label: T('Invitation to a poetry gathering', '시회 초대') },
  { id: 'condolence', label: T('Letter of condolence', '위로 편지') },
];
const mailId = (g: Game) => `l${g.dayCount}-${g.mail.length}`;
export function letterBar(g: Game, id: string, kind: LetterKind): Text | null {
  const n = g.npcs[id];
  if (!n || !n.alive || !g.rel[id]?.met) return T('You cannot write to them.', '편지할 수 없는 사람이다.');
  if (playerAge(g) < 10) return T('You are too young to write letters.', '편지를 쓰기엔 너무 어리다.');
  if ((g.counts[`wrote:${id}`] ?? -999) > g.dayCount - 90) return T('You wrote to them this season.', '이번 철에 이미 편지했다.');
  if (g.player.money < 1) return T('You cannot buy paper.', '종이 살 돈이 없다.');
  if (kind === 'condolence' && !Object.values(g.npcs).some((x) => !x.alive && x.diedYear === g.date.year && (x.parents.includes(id) || x.spouse === id || n.parents.includes(x.id)))) return T('They have had no loss this year.', '올해 상을 당하지 않았다.');
  return null;
}
export function writeLetter(g0: Game, id: string, kind: LetterKind): { game: Game; note: Text | null } {
  if (letterBar(g0, id, kind)) return { game: g0, note: null };
  const g = clone(g0);
  const n = g.npcs[id];
  const r = g.rel[id];
  g.player.money -= 1;
  g.counts[`wrote:${id}`] = g.dayCount;
  g.counts.letters = (g.counts.letters ?? 0) + 1;
  const me = playerName(g);
  let note: Text;
  const title = LETTER_KINDS.find((k) => k.id === kind)!.label;
  let body: Text;
  switch (kind) {
    case 'greeting':
      r.regard = clamp(r.regard + 2, -100, 100);
      body = T(`I trust the season finds your household well. — ${me.en}`, `이 철에 댁내 두루 평안하신지요. — ${me.ko}`);
      note = T(`Letter sent to ${n.name.en}. Regard +2.`, `${n.name.ko}에게 편지를 보냈다. 호감 +2.`);
      break;
    case 'support': {
      const ok = r.regard >= 30 && dimOf(r, 'trust') >= 45;
      if (ok && g.pol.side !== 'neutral' as never) g.pol.standing = clamp(g.pol.standing + 3, 0, 100);
      if (!ok) r.regard = clamp(r.regard - 2, -100, 100);
      body = T(`I would be grateful for your voice when the matter comes before the court. — ${me.en}`, `그 일이 조정에 오를 때 한마디 거들어 주시면 고맙겠습니다. — ${me.ko}`);
      note = ok ? T(`${n.name.en} writes back promising support. Standing +3.`, `${n.name.ko}이(가) 지지를 약속하는 답장을 보냈다. 당내 입지 +3.`) : T(`${n.name.en} sends a polite reply that promises nothing.`, `${n.name.ko}이(가) 아무것도 약속하지 않는 정중한 답장을 보냈다.`);
      break;
    }
    case 'invitation':
      r.regard = clamp(r.regard + 3, -100, 100);
      bumpAttr(g.player, 'creativity', 1);
      body = T(`A few friends will gather to write poems under the pines. Your brush would honour us. — ${me.en}`, `벗 몇이 솔숲 아래에서 시를 짓기로 했습니다. 귀한 붓을 모시고자 합니다. — ${me.ko}`);
      note = T(`${n.name.en} comes to the gathering. Regard +3.`, `${n.name.ko}이(가) 시회에 왔다. 호감 +3.`);
      break;
    case 'condolence':
      r.regard = clamp(r.regard + 6, -100, 100);
      bumpDim(g, id, 'gratitude', 12);
      remember(g, id, T('You wrote to them in their grief.', '상중에 위로 편지를 보냈다.'));
      body = T(`I heard of your loss and grieve with your house. — ${me.en}`, `부음을 듣고 함께 슬퍼합니다. — ${me.ko}`);
      note = T(`${n.name.en} is moved by your letter. Regard +6.`, `${n.name.ko}이(가) 편지에 감동했다. 호감 +6.`);
      break;
  }
  g.mail.push({ id: mailId(g), day: g.dayCount, dir: 'out', who: n.name, title, body });
  return { game: g, note };
}

/** Letters that arrive on their own, and the slow working of feelings and condition, each season. */
export function npcSeason(g: Game, say: Say) {
  if (!g.player.alive) return;
  for (const [id, r] of Object.entries(g.rel)) {
    if (!r.dims) continue;
    const d = r.dims;
    if (d.resentment) d.resentment = Math.max(0, d.resentment - 3);
    if (d.fear) d.fear = Math.max(0, d.fear - 2);
    if (d.gratitude) d.gratitude = Math.max(0, d.gratitude - 2);
    // A resentful rival at court can turn feeling into action.
    if ((d.resentment ?? 0) >= 70 && g.npcs[id]?.alive && g.npcs[id]?.post && roll(g, 'grudge:' + id) < 0.15) {
      g.player.reputation = clamp(g.player.reputation - 3, 0, 100);
      say(T(`${g.npcs[id].name.en} speaks against you at court. Reputation −3.`, `${g.npcs[id].name.ko}이(가) 조정에서 당신을 헐뜯는다. 평판 −3.`), true);
      d.resentment = Math.max(0, (d.resentment ?? 0) - 15);
    }
  }
  // Allies who have fallen out drift away.
  for (const k of Object.keys(g.flags)) {
    if (!k.startsWith('ally-') || !g.flags[k]) continue;
    const id = k.slice(5);
    if (!g.npcs[id]?.alive || (g.rel[id]?.regard ?? 0) < 10) {
      g.flags[k] = false;
      if (g.npcs[id]?.alive) say(T(`${g.npcs[id].name.en} no longer counts as your ally.`, `${g.npcs[id].name.ko}은(는) 더는 동맹이 아니다.`), true);
    } else if (g.pol.side !== 'neutral' as never) {
      g.pol.standing = clamp(g.pol.standing + 1, 0, 100);
    }
  }
  // An incoming letter from someone who thinks of you.
  if (playerAge(g) >= 10) {
    const friends = Object.keys(g.rel).filter((id) => g.npcs[id]?.alive && !g.npcs[id]?.away && g.rel[id].met && g.rel[id].regard >= 35 && id !== 'king');
    if (friends.length && roll(g, 'letter-in') < 0.4) {
      const id = friends[Math.floor(roll(g, 'letter-from') * friends.length)];
      const n = g.npcs[id];
      const lines: Text[] = [
        T('The plum by my gate has flowered early. I thought of the evening we talked.', '대문 옆 매화가 일찍 피었소. 그날 저녁 나눈 이야기가 생각났소.'),
        T('I hear good things of your work. Do not let the capital wear you thin.', '그대 일에 좋은 소문이 들리오. 도성살이에 몸 상하지 마시오.'),
        T('Our families have long been friends. Let it stay so in our generation.', '우리 두 집안은 오랜 벗이오. 우리 대에도 그렇게 이어 갑시다.'),
        T('If you pass this way in the autumn, the guest room is yours.', '가을에 이쪽을 지나거든 사랑방을 내어 드리리다.'),
      ];
      const body = lines[Math.floor(roll(g, 'letter-body') * lines.length)];
      const m: Mail = { id: mailId(g), day: g.dayCount, dir: 'in', who: n.name, title: T(`A letter from ${n.name.en}`, `${n.name.ko}의 편지`), body };
      g.mail.push(m);
      if (g.mail.length > 80) g.mail.splice(0, g.mail.length - 80);
      emit(g, { type: 'LETTER_RECEIVED', npc: id, text: m.title });
    }
  }
  // Condition: worry settles toward what the player's circumstances warrant (GSDD Part V §9).
  const P = g.player;
  let target = 14 - Math.round(P.honour / 25);
  if (g.econ.debts.length) target += 8 + Math.min(10, g.econ.debts.length * 3);
  if (g.pol.inquiries.some((q) => !q.outcome)) target += 12;
  if (g.pol.exile) target += 25;
  if (P.legal === 'commoner') target += 15;
  target += g.missions.filter((m) => m.status === 'open').length * 6;
  if (P.fatigue > 70) target += 8;
  if (P.health < 40) target += 10;
  if (g.player.office) target += 4;
  if (Object.values(g.rel).some((r) => r.bond === 'spouse' && r.regard >= 40)) target -= 4;
  P.stress = clamp(Math.round(P.stress + (clamp(target, 0, 100) - P.stress) * 0.35), 0, 100);
  // A season is long enough to recover from any one week's exertion.
  P.fatigue = clamp(Math.min(P.fatigue, 30) - 15, 5, 100);
  if (P.stress >= 75) {
    P.health = clamp(P.health - 3, 0, 100);
    say(T(`Worry is wearing you down. Health −3. (Stress ${P.stress})`, `근심이 몸을 갉아먹는다. 건강 −3. (스트레스 ${P.stress})`), true);
  }
}

/** Daily fatigue: each activity tires, a night's sleep restores. */
export const ACTIVITY_FATIGUE = 7;
export const NIGHT_REST = 18;
export function tireAfter(g: Game, notes: Text[]) {
  const P = g.player;
  P.fatigue = clamp(P.fatigue + ACTIVITY_FATIGUE, 0, 100);
  if (P.fatigue >= 85) {
    P.stress = clamp(P.stress + 2, 0, 100);
    notes.push(T(`You are exhausted (fatigue ${P.fatigue}). Rest, or your work and health will suffer.`, `기진맥진하다 (피로 ${P.fatigue}). 쉬지 않으면 일도 몸도 상한다.`));
  }
}
export const conditionWord = (v: number): Text =>
  v >= 80 ? T('Severe', '극심') : v >= 60 ? T('High', '높음') : v >= 35 ? T('Moderate', '보통') : T('Low', '낮음');
export { signed };

// ---------------------------------------------------------------- historical figures (GSDD Part IV §7)

import { FIGURES, figuresIn } from '../content/figures';
import { study } from './character';

/** Figures the player can seek out this year, in the historical campaign. */
export const figuresNow = (g: Game) => (g.campaign.mode === 'historical' ? figuresIn(g.date.year) : []);

export function figureBar(g: Game, id: string): Text | null {
  const f = FIGURES.find((x) => x.id === id);
  if (!f || !figuresNow(g).includes(f)) return T('They are not to be found this year.', '올해는 만날 수 없다.');
  if (playerAge(g) < 12) return T('You are too young to call on them.', '찾아가기엔 아직 어리다.');
  if (g.active || g.letter || g.report) return T('Finish what is in front of you first.', '눈앞의 일부터 마무리하라.');
  if ((g.counts[`fig:${id}`] ?? -999) > g.dayCount - 90) return T('You saw them this season.', '이번 철에 이미 찾아뵈었다.');
  if (g.player.legal === 'commoner' && f.place !== 'market') return T('A commoner cannot call on them.', '평민은 찾아갈 수 없다.');
  if (f.place === 'throne-hall' && g.player.legal !== 'royal' && g.player.favour < 50 && (g.player.office?.rank ?? 0) < 3) return T('They are inside the palace; you need favour 50 or a senior post.', '궁 안에 있어 총애 50이나 당상관 이상의 자리가 필요하다.');
  if (g.player.fatigue >= 85) return T('You are too tired to travel.', '너무 지쳐 길을 나설 수 없다.');
  return null;
}

/** A reconstructed meeting: the player learns from the figure's field. No words are put in their mouth. */
export function seekFigure(g0: Game, id: string): { game: Game; note: Text | null } {
  if (figureBar(g0, id)) return { game: g0, note: null };
  const g = clone(g0);
  const f = FIGURES.find((x) => x.id === id)!;
  g.counts[`fig:${id}`] = g.dayCount;
  g.counts.figures = (g.counts.figures ?? 0) + 1;
  g.player.fatigue = clamp(g.player.fatigue + 12, 0, 100);
  study(g, f.field, 3);
  bumpAttr(g.player, f.attr, 1);
  g.player.reputation = clamp(g.player.reputation + 1, 0, 100);
  const text = T(`Called on ${f.name.en} (${f.role.en.toLowerCase()}) and came away with much to think about.`, `${f.name.ko}(${f.role.ko})을(를) 찾아뵙고 생각할 거리를 잔뜩 안고 돌아왔다.`);
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'edu', text });
  return { game: g, note: T(`${text.en} (A reconstructed meeting.)`, `${text.ko} (재구성된 만남)`) };
}

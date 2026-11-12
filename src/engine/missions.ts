import { ROYAL_IDS } from '../content/court';
import type { Game, Mission, Text } from '../model/schemas';
import { T } from './text';
import { clamp, clone, roll } from './world';
import { playerAge, seasonOf } from './time';
import { emit, remember } from './bus';
import { bumpAttr } from './character';
import { holdsKeys, pay, canPay } from './econ';
import { openInquiry } from './justice';
import { factionLeader } from './politics';
import { travelCheck } from './day';

/**
 * GSDD Part V §14: missions inside the open life. They arise from the player's circumstances,
 * have a time limit and more than one way through, and each way has its own consequences.
 */

type Say = (t: Text, record?: boolean) => void;
export type Approach = { id: string; label: Text; hint: Text; bar?: (g: Game, m: Mission) => Text | null; run: (g: Game, m: Mission) => Text };
export type MissionDef = {
  id: string;
  cat: Text;
  title: (g: Game, m: Mission) => Text;
  text: (g: Game, m: Mission) => Text;
  /** Who it would concern, or null if nobody suitable; undefined if it needs no one. */
  pick: (g: Game) => string | null | undefined;
  when: (g: Game) => boolean;
  seasons: number;
  approaches: Approach[];
  fail: (g: Game, m: Mission) => Text;
};

const name = (g: Game, m: Mission) => (m.npc ? g.npcs[m.npc]?.name ?? T('someone', '누군가') : T('someone', '누군가'));
const reg = (g: Game, id: string | null, d: number) => {
  if (id && g.rel[id]) g.rel[id].regard = clamp(g.rel[id].regard + d, -100, 100);
};
const dim = (g: Game, id: string | null, key: 'trust' | 'respect' | 'gratitude' | 'resentment' | 'rivalry' | 'fear', d: number) => {
  if (!id || !g.rel[id]) return;
  const r = g.rel[id];
  r.dims = { ...(r.dims ?? {}), [key]: clamp((r.dims?.[key] ?? (key === 'trust' || key === 'respect' ? 40 : 0)) + d, 0, 100) };
};
const check = (g: Game, attr: string, key: string, base = 0) => roll(g, 'mission-check:' + key) < clamp(0.2 + ((g.player.attrs[attr] ?? 50) - 40) / 60 + base, 0.1, 0.92);
const wealthy = (g: Game) => g.player.money + g.econ.treasury >= 600;
const kin = (g: Game) => ['mother', 'father', 'spouse-id', 'sibling'].map((k) => (k === 'spouse-id' ? Object.keys(g.rel).find((id) => g.rel[id].bond === 'spouse') ?? null : k)).filter((id): id is string => !!id && !!g.npcs[id]?.alive && !g.npcs[id]?.away);

export const MISSIONS: MissionDef[] = [
  {
    id: 'ally-support', cat: T('Political', '정치'), seasons: 1,
    pick: (g) => (g.pol.side === 'neutral' ? null : factionLeader(g, g.pol.side)?.id ?? null),
    when: (g) => g.pol.side !== 'neutral' && !!g.player.office && g.player.legal !== 'commoner',
    title: (g, m) => T(`${name(g, m).en} asks for your name on a memorial`, `${name(g, m).ko}이(가) 연명 상소에 이름을 청하다`),
    text: () => T('Your faction is drafting a joint memorial against a rival minister. Your name would count.', '당이 상대 당 판서를 탄핵하는 연명 상소를 준비하고 있다. 당신의 이름이 힘이 될 것이다.'),
    approaches: [
      { id: 'sign', label: T('Sign it', '서명한다'), hint: T('Standing rises; the other side remembers', '당내 입지 상승, 상대 당이 기억한다'), run: (g, m) => { g.pol.standing = clamp(g.pol.standing + 8, 0, 100); g.pol.inf[g.pol.side as 'A' | 'B'] = clamp(g.pol.inf[g.pol.side as 'A' | 'B'] + 3, 5, 95); reg(g, m.npc, 6); dim(g, m.npc, 'trust', 8); return T('Your name heads the second column. Standing +8.', '당신의 이름이 둘째 줄 맨 앞에 올랐다. 당내 입지 +8.'); } },
      { id: 'mediate', label: T('Propose a gentler wording', '어조를 누그러뜨리자고 한다'), hint: T('Needs diplomacy 50', '외교술 50 필요'), bar: (g) => ((g.player.attrs.diplomacy ?? 0) < 50 ? T('Needs diplomacy 50.', '외교술 50이 필요하다.') : null), run: (g, m) => { g.player.reputation = clamp(g.player.reputation + 3, 0, 100); dim(g, m.npc, 'respect', 6); bumpAttr(g.player, 'diplomacy', 1); return T('The memorial goes in, milder, with your name on it. Both sides note your moderation. Reputation +3.', '상소는 누그러진 채 당신의 이름과 함께 올라갔다. 양쪽 모두 당신의 절제를 눈여겨본다. 평판 +3.'); } },
      { id: 'decline', label: T('Decline politely', '정중히 거절한다'), hint: T('Honour rises; standing falls', '명예 상승, 당내 입지 하락'), run: (g, m) => { g.pol.standing = clamp(g.pol.standing - 6, 0, 100); g.player.honour = clamp(g.player.honour + 2, 0, 100); reg(g, m.npc, -6); return T('You keep your name off it. Standing −6, honour +2.', '이름을 올리지 않았다. 당내 입지 −6, 명예 +2.'); } },
    ],
    fail: (g, m) => { g.pol.standing = clamp(g.pol.standing - 4, 0, 100); reg(g, m.npc, -4); return T('The memorial went in without you. Your allies noticed.', '상소는 당신 없이 올라갔다. 동지들이 이를 알아챘다.'); },
  },
  {
    id: 'boundary', cat: T('Family', '가문'), seasons: 2, pick: () => undefined,
    when: (g) => holdsKeys(g) && g.econ.estates.some((e) => e.kind === 'farm') && g.player.legal !== 'commoner',
    title: () => T('A boundary dispute with a neighbouring family', '이웃 가문과의 경계 분쟁'),
    text: (g) => T(`The family next to your farm in ${g.econ.estates.find((e) => e.kind === 'farm')?.name.en ?? 'the country'} has moved the boundary stones and claims two fields.`, `${g.econ.estates.find((e) => e.kind === 'farm')?.name.ko ?? '시골'} 옆 가문이 경계석을 옮기고 논 두 배미를 제 것이라 한다.`),
    approaches: [
      { id: 'talk', label: T('Negotiate with their head', '그 집안 어른과 담판한다'), hint: T('Diplomacy decides', '외교술에 달림'), run: (g) => { if (check(g, 'diplomacy', 'boundary-talk')) { g.player.reputation = clamp(g.player.reputation + 2, 0, 100); return T('Over wine the stones go back where they were. A neighbour, not an enemy. Reputation +2.', '술상 앞에서 경계석이 제자리로 돌아갔다. 원수가 아니라 이웃이다. 평판 +2.'); } const f = g.econ.estates.find((e) => e.kind === 'farm'); if (f) f.area = Math.max(2, f.area - 2); return T('The talks fail and they keep the fields. Farm size −2 gyeol.', '담판이 깨지고 그들이 논을 차지했다. 농장 −2결.'); } },
      { id: 'pay', label: T('Settle with a payment (80)', '80냥으로 합의한다'), hint: T('Costs 80 nyang from the treasury', '곳간에서 80냥'), bar: (g) => (g.econ.treasury < 80 ? T('The treasury cannot cover it.', '곳간이 감당하지 못한다.') : null), run: (g) => { g.econ.treasury -= 80; return T('Eighty nyang and a signed agreement. The matter is closed.', '80냥과 서명된 합의서. 일이 마무리되었다.'); } },
      { id: 'law', label: T('Take it to the magistrate', '고을 원에게 송사를 건다'), hint: T('Administration decides; win or lose in public', '행정력에 달림. 이기든 지든 공개적'), run: (g) => { const f = g.econ.estates.find((e) => e.kind === 'farm'); if (check(g, 'administration', 'boundary-law', 0.05)) { if (f) f.area += 1; g.player.reputation = clamp(g.player.reputation + 1, 0, 100); return T('The magistrate finds for you and fines them a field. Farm size +1 gyeol.', '원님이 당신 손을 들어주고 그들에게 논 한 배미를 물리게 했다. 농장 +1결.'); } if (f) f.area = Math.max(2, f.area - 2); g.player.reputation = clamp(g.player.reputation - 3, 0, 100); return T('The magistrate finds against you, and everyone hears of it. Reputation −3.', '원님이 상대 편을 들었고 온 고을이 그 소식을 들었다. 평판 −3.'); } },
    ],
    fail: (g) => { const f = g.econ.estates.find((e) => e.kind === 'farm'); if (f) { f.area = Math.max(2, f.area - 2); f.productivity = clamp(f.productivity - 5, 15, 95); } return T('While you did nothing, the new stones settled in. The fields are theirs now.', '손 놓은 사이 새 경계석이 굳어졌다. 그 논은 이제 그들 것이다.'); },
  },
  {
    id: 'illness', cat: T('Family', '가족'), seasons: 1, pick: (g) => { const k = kin(g); return k.length ? k[Math.floor(roll(g, 'ill-who') * k.length)] : null; },
    when: (g) => kin(g).length > 0,
    title: (g, m) => T(`${name(g, m).en} has fallen ill`, `${name(g, m).ko}이(가) 병석에 누웠다`),
    text: (g, m) => T(`A fever has kept ${name(g, m).en} in bed for days.`, `${name(g, m).ko}이(가) 며칠째 열로 자리에 누워 있다.`),
    approaches: [
      { id: 'physician', label: T('Send for a physician (30)', '의원을 부른다 (30냥)'), hint: T('Costs 30 nyang', '30냥'), bar: (g) => (canPay(g, 30) ? null : T('You cannot pay a physician.', '의원을 부를 돈이 없다.')), run: (g, m) => { pay(g, 30); reg(g, m.npc, 6); dim(g, m.npc, 'gratitude', 10); return T('The physician’s needles and a bitter decoction do their work.', '의원의 침과 쓴 탕약이 효험을 보였다.'); } },
      { id: 'tend', label: T('Sit by the bedside yourself', '몸소 병상을 지킨다'), hint: T('Tiring; deepens the bond', '고되지만 정이 깊어진다'), run: (g, m) => { g.player.fatigue = clamp(g.player.fatigue + 25, 0, 100); reg(g, m.npc, 10); dim(g, m.npc, 'trust', 10); bumpAttr(g.player, 'empathy', 1); remember(g, m.npc!, T('You nursed them through a fever.', '열병을 앓을 때 곁을 지켜 주었다.')); return T('Three nights without sleep. On the fourth morning the fever breaks.', '사흘 밤을 새웠다. 나흘째 아침 열이 내렸다.'); } },
      { id: 'rites', label: T('Offer prayers at the ancestral shrine', '사당에 고한다'), hint: T('Honour; the outcome is uncertain', '명예. 결과는 알 수 없다'), run: (g, m) => { g.player.honour = clamp(g.player.honour + 2, 0, 100); if (roll(g, 'rites-ill') < 0.6) return T('Whether by the ancestors or by time, the fever passes.', '조상 덕인지 세월 덕인지 열이 내렸다.'); const n = m.npc ? g.npcs[m.npc] : undefined; if (n && g.date.year - n.birthYear > 60 && roll(g, 'rites-ill-2') < 0.3) { n.alive = false; n.diedYear = g.date.year; return T(`${n.name.en} did not recover.`, `${n.name.ko}은(는) 끝내 일어나지 못했다.`); } reg(g, m.npc, -2); return T('The illness lingers for a month before it lifts.', '병이 한 달을 끌다 겨우 물러갔다.'); } },
    ],
    fail: (g, m) => { reg(g, m.npc, -10); dim(g, m.npc, 'resentment', 15); return T('They recovered, slowly, and noticed you were not there.', '그는 천천히 회복했고, 당신이 곁에 없었다는 것을 알았다.'); },
  },
  {
    id: 'business-trouble', cat: T('Business', '사업'), seasons: 1, pick: () => undefined,
    when: (g) => g.econ.businesses.some((b) => b.last <= 0),
    title: (g) => T(`${g.econ.businesses.find((b) => b.last <= 0)?.name.en ?? 'A business'} is in difficulty`, `${g.econ.businesses.find((b) => b.last <= 0)?.name.ko ?? '사업'}이(가) 어려움에 빠졌다`),
    text: () => T('The manager writes that suppliers want cash and customers want credit.', '관리인의 편지: 물주는 현금을 원하고 손님은 외상을 원한다.'),
    approaches: [
      { id: 'capital', label: T('Put in 100 nyang', '100냥을 더 넣는다'), hint: T('Saves it this season', '이번 철을 넘긴다'), bar: (g) => { const b = g.econ.businesses.find((x) => x.last <= 0); return b && (b.owner === 'purse' ? g.player.money : g.econ.treasury) >= 100 ? null : T('Not enough money.', '돈이 모자란다.'); }, run: (g) => { const b = g.econ.businesses.find((x) => x.last <= 0)!; if (b.owner === 'purse') g.player.money -= 100; else g.econ.treasury -= 100; b.capital += 100; b.repute = clamp(b.repute + 4, 0, 100); return T('The suppliers are paid; the shop stays open.', '물주들에게 값을 치르고 가게는 문을 열었다.'); } },
      { id: 'visit', label: T('Go over the books yourself', '직접 장부를 살핀다'), hint: T('Administration decides', '행정력에 달림'), run: (g) => { const b = g.econ.businesses.find((x) => x.last <= 0)!; if (check(g, 'administration', 'biz-books')) { b.manager = clamp(b.manager + 10, 0, 100); return T('You find the leak and plug it. The manager is grateful, or frightened.', '새는 곳을 찾아 막았다. 관리인은 고마워하는지 겁먹었는지 모르겠다.'); } return T('The figures defeat you. The problem stays.', '숫자에 졌다. 문제는 그대로다.'); } },
    ],
    fail: (g) => { const b = g.econ.businesses.find((x) => x.last <= 0); if (b) b.capital = Math.round(b.capital * 0.8); return T('Without help, the business lost a fifth of its capital.', '도움 없이 사업은 자본의 오분의 일을 잃었다.'); },
  },
  {
    id: 'audience', cat: T('Royal', '왕실'), seasons: 1, pick: () => 'king',
    when: (g) => g.player.favour >= 30 && g.player.royal !== 'king' && g.player.royal !== 'regent' && g.player.legal !== 'commoner' && !g.pol.exile,
    title: () => T('The king asks to see you', '전하께서 부르시다'),
    text: () => T('A eunuch brings word: His Majesty wishes to hear your views at a private audience.', '내관이 기별을 가져왔다. 전하께서 사사로이 당신의 의견을 듣고자 하신다.'),
    approaches: [
      { id: 'go', label: T('Attend the audience', '입시한다'), hint: T('Favour rises if you can reach the palace', '궁궐에 들 수 있으면 총애 상승'), bar: (g) => { const c = travelCheck(g, 'throne-hall'); return c.ok || c.here ? null : c.reason; }, run: (g) => { g.player.favour = clamp(g.player.favour + 5, 0, 100); g.player.reputation = clamp(g.player.reputation + 1, 0, 100); bumpAttr(g.player, 'etiquette', 1); emit(g, { type: 'COMMENDATION', text: T('Received in private audience by the king.', '전하께 독대를 허락받았다.') }); return T('You speak plainly and briefly. The king nods more than once. Favour +5.', '짧고 분명하게 아뢰었다. 전하께서 몇 번이고 고개를 끄덕이셨다. 총애 +5.'); } },
      { id: 'excuse', label: T('Send your excuses', '사양한다'), hint: T('Favour falls', '총애 하락'), run: (g) => { g.player.favour = clamp(g.player.favour - 4, 0, 100); return T('The king is not used to being declined. Favour −4.', '전하께서는 거절에 익숙지 않으시다. 총애 −4.'); } },
    ],
    fail: (g) => { g.player.favour = clamp(g.player.favour - 6, 0, 100); return T('You never came. The king has not forgotten. Favour −6.', '끝내 입시하지 않았다. 전하께서 잊지 않으셨다. 총애 −6.'); },
  },
  {
    id: 'child-study', cat: T('Education', '교육'), seasons: 2,
    pick: (g) => Object.values(g.npcs).find((n) => n.alive && n.kin === 'child' && n.parents.includes('player') && g.date.year - n.birthYear >= 6 && g.date.year - n.birthYear <= 14)?.id ?? null,
    when: (g) => Object.values(g.npcs).some((n) => n.alive && n.kin === 'child' && n.parents.includes('player') && g.date.year - n.birthYear >= 6 && g.date.year - n.birthYear <= 14),
    title: (g, m) => T(`${name(g, m).en} needs a teacher`, `${name(g, m).ko}에게 스승이 필요하다`),
    text: (g, m) => T(`${name(g, m).en} has outgrown the primer. Who will teach them now?`, `${name(g, m).ko}이(가) 천자문을 뗐다. 이제 누가 가르칠까?`),
    approaches: [
      { id: 'tutor', label: T('Engage a tutor (40)', '독선생을 들인다 (40냥)'), hint: T('Costs 40 nyang', '40냥'), bar: (g) => (canPay(g, 40) ? null : T('Not enough money.', '돈이 모자란다.')), run: (g, m) => { pay(g, 40); reg(g, m.npc, 5); return T('A tutor moves into the outer quarters.', '독선생이 사랑채에 들었다.'); } },
      { id: 'self', label: T('Teach them yourself', '몸소 가르친다'), hint: T('Tiring; closer bond; scholarship', '고되지만 정이 깊어지고 학식이 는다'), run: (g, m) => { g.player.fatigue = clamp(g.player.fatigue + 15, 0, 100); reg(g, m.npc, 10); dim(g, m.npc, 'respect', 10); bumpAttr(g.player, 'scholarship', 1); return T('Every evening, the same lamp, the same text, a little further each time.', '저녁마다 같은 등잔, 같은 책, 조금씩 더 나아간다.'); } },
      { id: 'seodang', label: T('Send them to the village school (10)', '서당에 보낸다 (10냥)'), hint: T('Cheap; friends of their own', '저렴하고 또래 벗이 생긴다'), bar: (g) => (canPay(g, 10) ? null : T('Not enough money.', '돈이 모자란다.')), run: (g, m) => { pay(g, 10); reg(g, m.npc, 3); return T('They come home inky and full of other children’s stories.', '먹물 범벅에 다른 아이들 이야기를 잔뜩 안고 돌아온다.'); } },
    ],
    fail: (g, m) => { reg(g, m.npc, -5); return T('The child drifted through the year without a teacher.', '아이가 스승 없이 한 해를 보냈다.'); },
  },
  {
    id: 'rumour', cat: T('Social', '사교'), seasons: 1,
    pick: (g) => Object.keys(g.rel).find((id) => g.npcs[id]?.alive && ((g.rel[id].dims?.resentment ?? 0) >= 40 || (g.rel[id].dims?.rivalry ?? 0) >= 40 || g.rel[id].regard < -20)) ?? null,
    when: (g) => g.player.legal !== 'commoner' && Object.keys(g.rel).some((id) => g.npcs[id]?.alive && ((g.rel[id].dims?.resentment ?? 0) >= 40 || (g.rel[id].dims?.rivalry ?? 0) >= 40 || g.rel[id].regard < -20)),
    title: () => T('A rumour about you', '당신에 관한 소문'),
    text: (g, m) => T(`Someone is telling the capital a story about you. The trail leads, they say, to ${name(g, m).en}.`, `누군가 도성에 당신에 관한 이야기를 퍼뜨리고 있다. 들리기로는 ${name(g, m).ko}에게서 나왔다고 한다.`),
    approaches: [
      { id: 'investigate', label: T('Find out who started it', '출처를 캔다'), hint: T('Opens an inquiry', '조사를 시작한다'), run: (g) => { openInquiry(g, 'scandal'); return T('You set people asking questions. An inquiry is open.', '사람을 풀어 물어보게 했다. 조사가 시작되었다.'); } },
      { id: 'confront', label: T('Confront them', '정면으로 따진다'), hint: T('Authority decides; makes it personal', '위엄에 달림. 사사로운 다툼이 된다'), run: (g, m) => { if (check(g, 'command', 'rumour-confront')) { dim(g, m.npc, 'fear', 15); g.player.reputation = clamp(g.player.reputation + 1, 0, 100); return T('They deny everything and the rumour stops the same week.', '그는 모든 걸 부인했고 소문은 그 주에 멎었다.'); } reg(g, m.npc, -10); dim(g, m.npc, 'rivalry', 15); g.player.reputation = clamp(g.player.reputation - 2, 0, 100); return T('The confrontation becomes the new rumour. Reputation −2.', '따지러 간 일이 새 소문이 되었다. 평판 −2.'); } },
      { id: 'banquet', label: T('Answer with a generous banquet (60)', '넉넉한 잔치로 답한다 (60냥)'), hint: T('Costs 60; reputation', '60냥. 평판'), bar: (g) => (canPay(g, 60) ? null : T('Not enough money.', '돈이 모자란다.')), run: (g) => { pay(g, 60); g.player.reputation = clamp(g.player.reputation + 3, 0, 100); return T('Nobody remembers the rumour, only the banquet. Reputation +3.', '사람들은 소문은 잊고 잔치만 기억한다. 평판 +3.'); } },
    ],
    fail: (g) => { g.player.reputation = clamp(g.player.reputation - 4, 0, 100); return T('The rumour did its work. Reputation −4.', '소문이 제 몫을 했다. 평판 −4.'); },
  },
  {
    id: 'storm-damage', cat: T('Estate', '전장'), seasons: 1, pick: () => undefined,
    when: (g) => holdsKeys(g) && g.econ.estates.some((e) => e.condition < 55),
    title: (g) => T(`Repairs needed at ${g.econ.estates.find((e) => e.condition < 55)?.name.en.toLowerCase() ?? 'an estate'}`, `${g.econ.estates.find((e) => e.condition < 55)?.name.ko ?? '전장'} 보수가 필요하다`),
    text: () => T('Roofs leak, a wall has slumped and the tenants are grumbling.', '지붕이 새고 담이 무너졌으며 소작인들이 투덜댄다.'),
    approaches: [
      { id: 'repair', label: T('Pay for repairs (100)', '보수 비용을 댄다 (100냥)'), hint: T('Condition +20', '상태 +20'), bar: (g) => (g.econ.treasury >= 100 ? null : T('The treasury cannot cover it.', '곳간이 감당하지 못한다.')), run: (g) => { const e = g.econ.estates.find((x) => x.condition < 55)!; g.econ.treasury -= 100; e.condition = clamp(e.condition + 20, 0, 100); return T('New tiles, a rebuilt wall, quieter tenants.', '새 기와, 다시 쌓은 담, 잠잠해진 소작인들.'); } },
      { id: 'manager', label: T('Leave it to the estate manager', '마름에게 맡긴다'), hint: T('Needs an estate manager', '마름이 있어야 한다'), bar: (g) => (g.econ.staff.some((s) => s.role === 'manager') ? null : T('You have no estate manager.', '마름이 없다.')), run: (g) => { const e = g.econ.estates.find((x) => x.condition < 55)!; e.condition = clamp(e.condition + 10, 0, 100); g.econ.treasury = Math.max(0, g.econ.treasury - 40); return T('The manager patches what can be patched for forty nyang.', '마름이 40냥으로 땜질할 수 있는 곳은 땜질했다.'); } },
    ],
    fail: (g) => { const e = g.econ.estates.find((x) => x.condition < 55); if (e) e.condition = clamp(e.condition - 12, 5, 100); return T('The damage spread through the season.', '한 철 사이에 피해가 번졌다.'); },
  },
  // v0.6 (GSDD Part XV): the law reaches a life as lawsuits and arrests, each with more than one way through.
  {
    id: 'inheritance-suit', cat: T('Law', '송사'), seasons: 2, pick: (g) => Object.values(g.npcs).find((n) => n.alive && !n.away && (n.kin === 'uncle' || n.kin === 'cousin'))?.id ?? null,
    when: (g) => holdsKeys(g) && g.player.legal !== 'commoner' && Object.values(g.npcs).some((n) => n.alive && !n.away && (n.kin === 'uncle' || n.kin === 'cousin')),
    title: (g, m) => T(`${name(g, m).en} contests the inheritance`, `${name(g, m).ko}이(가) 상속을 다투다`),
    text: (g, m) => T(`${name(g, m).en} has filed a suit at the Hanseong magistracy, claiming a share of the family land under your grandfather’s will.`, `${name(g, m).ko}이(가) 한성부에 소장을 냈다. 조부의 유언에 따라 집안 땅의 한 몫이 제 것이라 한다.`),
    approaches: [
      { id: 'documents', label: T('Produce the division-of-property record', '분재기를 내놓는다'), hint: T('Administration decides; a clean win', '행정력에 달림. 깔끔한 승소'), run: (g, m) => { if (check(g, 'administration', 'suit-docs', 0.1)) { g.player.reputation = clamp(g.player.reputation + 2, 0, 100); dim(g, m.npc, 'respect', 5); return T('The magistrate reads the record twice and dismisses the suit. Reputation +2.', '한성 판윤이 분재기를 두 번 읽고 소를 물리쳤다. 평판 +2.'); } g.econ.treasury = Math.max(0, g.econ.treasury - 150); return T('The seal on the record is questioned. You lose a field’s worth: 150 nyang.', '분재기의 도장이 의심받았다. 논 한 뙈기 값 150냥을 잃었다.'); } },
      { id: 'settle', label: T('Settle within the family (120)', '집안에서 합의한다 (120냥)'), hint: T('Costs 120 from the treasury; keeps the peace', '곳간에서 120냥. 집안의 화목을 지킨다'), bar: (g) => (g.econ.treasury < 120 ? T('The treasury cannot cover it.', '곳간이 감당하지 못한다.') : null), run: (g, m) => { g.econ.treasury -= 120; reg(g, m.npc, 10); dim(g, m.npc, 'gratitude', 10); g.player.honour = clamp(g.player.honour + 1, 0, 100); return T('The suit is withdrawn and the two branches eat at one table again.', '소를 거두고 두 집이 다시 한 상에서 밥을 먹는다.'); } },
      { id: 'influence', label: T('Have a word with the magistrate', '판윤에게 말을 넣는다'), hint: T('Needs reputation 55; costs honour', '평판 55 필요. 명예가 깎인다'), bar: (g) => (g.player.reputation < 55 ? T('Needs reputation 55.', '평판 55가 필요하다.') : null), run: (g, m) => { g.player.honour = clamp(g.player.honour - 4, 0, 100); reg(g, m.npc, -12); dim(g, m.npc, 'resentment', 20); return T('The suit goes nowhere. Everyone knows why. Honour −4.', '소송은 흐지부지되었다. 까닭은 모두가 안다. 명예 −4.'); } },
    ],
    fail: (g, m) => { g.econ.treasury = Math.max(0, g.econ.treasury - 200); reg(g, m.npc, -6); return T('You did not answer the summons and judgment went against you: 200 nyang.', '소환에 응하지 않아 패소했다. 200냥을 잃었다.'); },
  },
  {
    id: 'friend-arrested', cat: T('Law', '송사'), seasons: 1,
    pick: (g) => Object.keys(g.rel).find((id) => g.npcs[id]?.alive && !g.npcs[id]?.away && !g.npcs[id]?.kin && g.rel[id].met && g.rel[id].regard >= 40 && id !== 'king' && !ROYAL_IDS.includes(id)) ?? null,
    when: (g) => g.player.legal !== 'commoner' && playerAge(g) >= 18 && Object.keys(g.rel).some((id) => g.npcs[id]?.alive && !g.npcs[id]?.away && !g.npcs[id]?.kin && g.rel[id].met && g.rel[id].regard >= 40 && id !== 'king' && !ROYAL_IDS.includes(id)),
    title: (g, m) => T(`${name(g, m).en} has been arrested`, `${name(g, m).ko}이(가) 붙잡혀 갔다`),
    text: (g, m) => T(`${name(g, m).en} is held at the State Tribunal over a careless line in a poem. Friends of the accused are being counted.`, `${name(g, m).ko}이(가) 시 한 구절 때문에 의금부에 갇혔다. 누가 그의 벗인지 세고들 있다.`),
    approaches: [
      { id: 'petition', label: T('Sign a petition for release', '석방 상소에 이름을 올린다'), hint: T('Risky if you are out of favour; a friend for life', '총애가 낮으면 위험. 평생의 벗을 얻는다'), run: (g, m) => { reg(g, m.npc, 15); dim(g, m.npc, 'gratitude', 30); dim(g, m.npc, 'trust', 15); g.player.honour = clamp(g.player.honour + 3, 0, 100); if (g.player.favour < 25) { g.player.reputation = clamp(g.player.reputation - 3, 0, 100); g.player.stress = clamp(g.player.stress + 8, 0, 100); return T('Your name is noted by the wrong people. Your friend is released in the spring, and will not forget. Honour +3, reputation −3.', '당신의 이름이 엉뚱한 이들의 눈에 띄었다. 벗은 봄에 풀려났고 이 일을 잊지 않을 것이다. 명예 +3, 평판 −3.'); } return T('The petition is heard. Your friend walks out thin and grateful. Honour +3.', '상소가 받아들여졌다. 벗이 여윈 몸으로 걸어 나와 고마워한다. 명예 +3.'); } },
      { id: 'food', label: T('Send food and bedding to the gaol (15)', '옥에 음식과 이불을 넣는다 (15냥)'), hint: T('Costs 15 nyang; quiet loyalty', '15냥. 조용한 의리'), bar: (g) => (canPay(g, 15) ? null : T('Not enough money.', '돈이 모자란다.')), run: (g, m) => { pay(g, 15); reg(g, m.npc, 8); dim(g, m.npc, 'gratitude', 15); return T('The gaoler takes his share; the rest gets through.', '옥졸이 제 몫을 떼고 나머지는 전해졌다.'); } },
      { id: 'distance', label: T('Keep your distance', '거리를 둔다'), hint: T('Safe; you will remember it', '안전하지만 마음에 남는다'), run: (g, m) => { reg(g, m.npc, -15); dim(g, m.npc, 'resentment', 20); g.player.honour = clamp(g.player.honour - 2, 0, 100); g.player.happiness = clamp(g.player.happiness - 3, 0, 100); return T('You stay home. Nobody blames you aloud. Honour −2.', '집에 머물렀다. 누구도 소리 내어 탓하지는 않는다. 명예 −2.'); } },
    ],
    fail: (g, m) => { reg(g, m.npc, -10); return T('The matter was settled without you, one way or the other.', '일은 당신 없이 어떻게든 결말이 났다.'); },
  },
  {
    id: 'debt-suit', cat: T('Law', '송사'), seasons: 1, pick: () => undefined,
    when: (g) => g.player.legal !== 'commoner' && wealthy(g) && playerAge(g) >= 20,
    title: () => T('A merchant will not repay you', '빚을 갚지 않는 상인'),
    text: () => T('A cloth merchant of Unjongga borrowed 100 nyang against a signed note and now says the note is forged.', '운종가 포목상이 수결한 문서를 쓰고 100냥을 빌려 가더니 이제는 문서가 위조라고 한다.'),
    approaches: [
      { id: 'sue', label: T('Sue at the magistracy', '한성부에 소를 낸다'), hint: T('Judgement decides', '판단력에 달림'), run: (g) => { if (check(g, 'judgement', 'debt-sue', 0.1)) { g.player.money += 100; return T('Three witnesses saw him sign. He pays, with costs: +100 nyang.', '수결하는 것을 본 증인이 셋이다. 그가 소송 비용까지 물었다. +100냥.'); } g.player.reputation = clamp(g.player.reputation - 1, 0, 100); return T('The witnesses have left the city. The suit fails.', '증인들이 도성을 떠났다. 소송은 패했다.'); } },
      { id: 'guild', label: T('Complain to his guild', '시전 도중에 알린다'), hint: T('Half now, no enemy', '절반을 받고 원수는 만들지 않는다'), run: (g) => { g.player.money += 50; return T('The guild head makes him pay half and calls it settled. +50 nyang.', '도중의 행수가 절반을 갚게 하고 끝내자고 했다. +50냥.'); } },
      { id: 'forgive', label: T('Tear up the note', '문서를 찢는다'), hint: T('Honour and a story people tell', '명예, 그리고 사람들이 전하는 이야기'), run: (g) => { g.player.honour = clamp(g.player.honour + 3, 0, 100); g.player.reputation = clamp(g.player.reputation + 2, 0, 100); return T('The market talks about it for a month. Honour +3, reputation +2.', '저자에서 한 달 동안 그 이야기를 했다. 명예 +3, 평판 +2.'); } },
    ],
    fail: () => T('The note lapsed and the money is gone.', '문서의 기한이 지나 돈은 사라졌다.'),
  },
];
export const missionDef = (id: string) => MISSIONS.find((m) => m.id === id);

export function missionsSeason(g: Game, say: Say) {
  if (!g.player.alive || playerAge(g) < 15) return;
  for (const m of g.missions) {
    if (m.status === 'open' && g.dayCount >= m.due) {
      const d = missionDef(m.def);
      m.status = 'failed';
      m.outcome = d ? d.fail(g, m) : T('The matter passed.', '일이 지나갔다.');
      say(T(`Mission failed: ${d?.title(g, m).en ?? ''}. ${m.outcome.en}`, `과업 실패: ${d?.title(g, m).ko ?? ''}. ${m.outcome.ko}`), true);
      emit(g, { type: 'MISSION_FAILED', text: m.outcome });
    }
  }
  g.missions = g.missions.filter((m) => m.status === 'open' || g.dayCount - m.due < 720);
  const open = g.missions.filter((m) => m.status === 'open').length;
  if (open >= 2 || roll(g, 'mission-chance') > 0.55 + (seasonOf(g.date.moon) === 0 ? 0.1 : 0)) return;
  const eligible = MISSIONS.filter((d) => d.when(g) && !g.missions.some((m) => m.def === d.id && (m.status === 'open' || g.dayCount - m.opened < 720)));
  if (!eligible.length) return;
  const d = eligible[Math.floor(roll(g, 'mission-pick') * eligible.length)];
  const npc = d.pick(g);
  if (npc === null) return;
  const m: Mission = { id: `m${g.dayCount}-${d.id}`, def: d.id, npc: npc ?? null, opened: g.dayCount, due: g.dayCount + d.seasons * 90, status: 'open', outcome: null };
  g.missions.push(m);
  emit(g, { type: 'MISSION_OPENED', text: T(`New matter: ${d.title(g, m).en}`, `새 과업: ${d.title(g, m).ko}`) });
}

export function missionBar(g: Game, m: Mission, approachId: string): Text | null {
  const d = missionDef(m.def);
  const a = d?.approaches.find((x) => x.id === approachId);
  if (!d || !a || m.status !== 'open') return T('Closed.', '종결됨.');
  if (g.active || g.letter || g.report) return T('Something needs your attention first.', '먼저 처리할 일이 있다.');
  return a.bar?.(g, m) ?? null;
}

export function resolveMission(g0: Game, missionId: string, approachId: string): { game: Game; note: Text | null } {
  const m0 = g0.missions.find((x) => x.id === missionId);
  if (!m0 || missionBar(g0, m0, approachId)) return { game: g0, note: null };
  const g = clone(g0);
  const m = g.missions.find((x) => x.id === missionId)!;
  const d = missionDef(m.def)!;
  const out = d.approaches.find((x) => x.id === approachId)!.run(g, m);
  m.status = 'done';
  m.outcome = out;
  g.counts.missions = (g.counts.missions ?? 0) + 1;
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'personal', text: T(`${d.title(g, m).en}: ${out.en}`, `${d.title(g, m).ko}: ${out.ko}`) });
  emit(g, { type: 'MISSION_DONE', text: T(`Settled: ${d.title(g, m).en}`, `해결: ${d.title(g, m).ko}`) });
  return { game: g, note: out };
}

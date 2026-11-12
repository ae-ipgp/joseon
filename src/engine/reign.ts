import type { Game, Npc, StateGov, Text } from '../model/schemas';
import { T } from './text';
import { clamp, clone, npcAge, playerName, roll } from './world';
import { dateKey } from './time';
import { heirEligible, isMonarch } from './politics';
import { emit } from './bus';
import { feel } from './life';

/*
 * GSDD Part X at BitLife depth: the ministers' memorials that reach the throne each season, a reign record
 * told in words, abdication, and the line of succession as the court sees it. The full ministry, budget,
 * military and diplomatic dashboards of Part X are deliberately left out.
 */

type Done = { game: Game; note: Text | null };
type Say = (t: Text, record?: boolean) => void;
type Fx = Partial<Record<'treasury' | 'privy' | 'stability' | 'loyalty' | 'cooperation' | 'authority', number>> & { A?: number; B?: number; reputation?: number; honour?: number; legitimacy?: number };
export type MemoDef = { id: string; from: Text; title: Text; text: Text; approve: Fx; reject: Fx; regentOk: boolean };

const M = (id: string, from: [string, string], title: [string, string], text: [string, string], approve: Fx, reject: Fx, regentOk = true): MemoDef => ({
  id, from: T(...from), title: T(...title), text: T(...text), approve, reject, regentOk,
});
export const MEMOS: MemoDef[] = [
  M('remit', ['The Ministry of Taxation', '호조'], ['Remit the land tax in a stricken province', '재해 고을의 전세 감면'], ['The harvest failed in the south. The governor asks that this year’s land tax be forgiven.', '남쪽 고을에 흉년이 들었다. 관찰사가 올해 전세를 감해 달라고 청한다.'], { treasury: -400, stability: 6 }, { stability: -3, cooperation: 1 }),
  M('quota', ['The Ministry of Rites', '예조'], ['Hold a special examination', '별시 설행'], ['A special examination would celebrate the reign and bring new men into service.', '별시를 열어 경사를 기리고 새 인재를 등용하자고 한다.'], { treasury: -150, cooperation: 4, B: 3 }, { B: -2 }),
  M('impeach', ['The Office of the Inspector-General', '사헌부'], ['Impeach a corrupt magistrate', '탐관오리 탄핵'], ['A county magistrate has been selling grain from the relief stores. The censors demand his dismissal.', '한 고을 수령이 환곡을 빼돌려 팔았다. 대간이 파직을 요구한다.'], { stability: 3, cooperation: -2, A: -3, reputation: 2 }, { authority: -2, honour: -1 }),
  M('hall', ['The Ministry of Works', '공조'], ['Rebuild a palace hall', '전각 중건'], ['A hall burned last winter. The ministry proposes rebuilding it in full.', '지난겨울 전각 하나가 불탔다. 공조가 옛 모습대로 다시 짓자고 한다.'], { treasury: -700, authority: 3, stability: -3 }, {}),
  M('garrison', ['The Ministry of Military Affairs', '병조'], ['Strengthen the northern garrisons', '북방 진보 강화'], ['Raiders have been seen across the Yalu. The ministry wants more men and grain on the border.', '압록강 너머에 적의 무리가 보인다. 병조가 국경에 군사와 군량을 늘리자고 한다.'], { treasury: -500, loyalty: 6 }, { loyalty: -3 }),
  M('envoy', ['The Ministry of Rites', '예조'], ['Send a gift embassy to the imperial court', '진하사 파견'], ['Gifts and congratulations would keep relations smooth with the great power to the west.', '예물과 하례로 서쪽 대국과의 관계를 원만히 하자고 한다.'], { treasury: -300, stability: 2 }, { stability: -2, authority: 1 }),
  M('silk', ['The Office of Special Advisers', '홍문관'], ['Forbid luxury at court', '사치 금지령'], ['Scholars urge a ban on imported silk and costly feasts, beginning in the palace.', '학사들이 수입 비단과 호화로운 잔치를 궁궐부터 금하자고 청한다.'], { privy: 100, cooperation: -2, honour: 3 }, { honour: -1 }, false),
  M('recall', ['The Royal Secretariat', '승정원'], ['Recall the exiled scholars', '유배된 선비 해배'], ['Men exiled in the last purge petition to come home. Their friends at court plead for them.', '지난 사화에 유배된 이들이 돌아오기를 청한다. 조정의 벗들이 그들을 위해 간청한다.'], { B: 5, A: -3, cooperation: 3 }, { A: 2, B: -2 }),
  M('merit', ['The State Council', '의정부'], ['Grant land to merit subjects', '공신에게 사패지 하사'], ['Those who served the throne in its hour of need expect their reward in land.', '어려울 때 보위를 지킨 이들이 땅으로 보답받기를 기대한다.'], { loyalty: 3, cooperation: 3, stability: -2, treasury: -200 }, { cooperation: -3 }),
  M('registers', ['The Ministry of Taxation', '호조'], ['Revise the household and slave registers', '호적과 노비안 정비'], ['Many households hide from the registers. A survey would bring in taxes; the great families will object.', '호적에서 숨은 집이 많다. 조사하면 세입이 늘지만 세도가들이 반발할 것이다.'], { treasury: 250, stability: 1, cooperation: -5 }, {}),
  M('history', ['The Office of Special Advisers', '홍문관'], ['Compile a history of the reign', '실록과 문헌 편찬'], ['Scholars propose compiling the records and statutes of the reign into books.', '학사들이 이 치세의 기록과 법전을 책으로 엮자고 한다.'], { treasury: -200, authority: 2, legitimacy: 2 }, {}),
  M('pardon', ['The Ministry of Justice', '형조'], ['Proclaim an amnesty', '대사면'], ['The prisons are full. An amnesty would show mercy, and free some who deserve no mercy.', '옥이 넘친다. 사면하면 자비를 보이겠지만 풀려나선 안 될 이들도 풀려난다.'], { stability: 3, reputation: 2, authority: -2 }, {}),
  // v0.6 (GSDD Part XII): foreign affairs reach the throne as memorials, not as a separate diplomacy game.
  M('border-market', ['The Ministry of Taxation', '호조'], ['Open a border market', '국경 개시'], ['Merchants ask for a licensed market on the northern border: silver and furs for cloth and paper.', '상인들이 북쪽 국경에 허가된 시장을 청한다. 은과 모피를 베와 종이로 바꾸는 장이다.'], { treasury: 350, stability: 1, loyalty: -2 }, { cooperation: -1 }),
  M('castaways', ['The Border Defence Council', '비변사'], ['Foreign sailors wrecked on Jeju', '제주에 표류한 이방인'], ['A foreign ship has broken up off Jeju. The survivors know gunnery and glass-making. Send them home, or keep them?', '낯선 배가 제주 앞바다에서 부서졌다. 살아남은 이들은 화포와 유리 만드는 법을 안다. 돌려보낼 것인가, 붙잡아 둘 것인가?'], { loyalty: 4, authority: 1, stability: -1 }, { reputation: 2, stability: 1 }),
  M('tribute', ['The Ministry of Rites', '예조'], ['The imperial court raises its demands', '늘어난 세폐 요구'], ['The envoys bring a longer list this year: more paper, more ginseng, more silver.', '올해 사신이 가져온 목록은 더 길다. 종이도, 인삼도, 은도 더 내라 한다.'], { treasury: -500, stability: 2, authority: -1 }, { authority: 2, stability: -4, loyalty: 1 }),
  M('waegwan', ['The Ministry of Rites', '예조'], ['Trade through the Japan House', '왜관 무역'], ['The lord of Tsushima asks for more trading ships at Busan each year.', '대마도주가 해마다 부산에 들이는 무역선을 늘려 달라고 청한다.'], { treasury: 250, stability: -1 }, { stability: 1 }),
];
export const memoDef = (id: string) => MEMOS.find((m) => m.id === id);

const FX_NAMES: Record<string, Text> = {
  treasury: T('Treasury', '국고'), privy: T('Privy purse', '내탕'), stability: T('Stability', '민심'), loyalty: T('Military loyalty', '군심'),
  cooperation: T('Cooperation', '조정 협조'), authority: T('Authority', '왕권'), A: T('Ruling faction', '집권 세력'), B: T('Opposition', '재야 세력'),
  reputation: T('Reputation', '평판'), honour: T('Honour', '명예'), legitimacy: T('Legitimacy', '정통성'),
};
export const fxWords = (fx: Fx): Text => {
  const parts = Object.entries(fx).filter(([, v]) => v);
  if (!parts.length) return T('No great change.', '큰 변화 없음.');
  return T(parts.map(([k, v]) => `${FX_NAMES[k].en} ${v! > 0 ? '+' : '−'}${Math.abs(v!)}`).join(', '), parts.map(([k, v]) => `${FX_NAMES[k].ko} ${v! > 0 ? '+' : '−'}${Math.abs(v!)}`).join(', '));
};
function applyFx(g: Game, fx: Fx) {
  const s = g.pol.state!;
  for (const k of ['stability', 'loyalty', 'cooperation', 'authority'] as const) if (fx[k]) s[k] = clamp(s[k] + fx[k]!, 0, 100);
  if (fx.treasury) s.treasury = Math.max(0, s.treasury + fx.treasury);
  if (fx.privy) s.privy = Math.max(0, s.privy + fx.privy);
  if (fx.A) g.pol.inf.A = clamp(g.pol.inf.A + fx.A, 5, 95);
  if (fx.B) g.pol.inf.B = clamp(g.pol.inf.B + fx.B, 5, 95);
  const P = g.player;
  if (fx.reputation) P.reputation = clamp(P.reputation + fx.reputation, 0, 100);
  if (fx.honour) P.honour = clamp(P.honour + fx.honour, 0, 100);
  if (fx.legitimacy) P.legitimacy = clamp(P.legitimacy + fx.legitimacy, 0, 100);
}

/** Each season up to two new memorials reach a reigning player (GSDD Part X §13.2). */
export function memoSeason(g: Game, say: Say) {
  const s = g.pol.state;
  if (!s || !isMonarch(g)) return;
  s.memos = s.memos ?? [];
  // A memorial put off twice is taken as refused.
  for (const m of s.memos.filter((x) => x.delayed && g.dayCount - x.opened >= 180)) {
    const d = memoDef(m.def);
    if (d) applyFx(g, d.reject);
    s.cooperation = clamp(s.cooperation - 1, 0, 100);
    say(T(`Left too long: ${d?.title.en ?? m.def}. The ministers take it as a refusal.`, `너무 오래 미루었다: ${d?.title.ko ?? m.def}. 신하들은 이를 거절로 받아들인다.`));
  }
  s.memos = s.memos.filter((x) => !(x.delayed && g.dayCount - x.opened >= 180));
  const pending = new Set(s.memos.map((m) => m.def));
  const recent = new Set(Object.keys(g.flagDays).filter((k) => k.startsWith('memo:') && g.dayCount - g.flagDays[k] < 720).map((k) => k.slice(5)));
  const pool = MEMOS.filter((m) => !pending.has(m.id) && !recent.has(m.id) && (g.player.royal === 'king' || m.regentOk));
  const n = Math.min(2, 3 - s.memos.length, pool.length);
  for (let i = 0; i < n; i++) {
    const d = pool.splice(Math.floor(roll(g, 'memo:' + i) * pool.length), 1)[0];
    s.memos.push({ id: `memo-${g.dayCount}-${d.id}`, def: d.id, opened: g.dayCount, delayed: false });
    g.flagDays['memo:' + d.id] = g.dayCount;
  }
  if (n) say(T(`${n} new memorial${n === 1 ? '' : 's'} await${n === 1 ? 's' : ''} your decision at court.`, `조정에 결재를 기다리는 상소 ${n}건이 올라왔다.`));
}

export type MemoChoice = 'approve' | 'reject' | 'delay';
export function memoBar(g: Game, id: string, c: MemoChoice): Text | null {
  const s = g.pol.state;
  const m = s?.memos?.find((x) => x.id === id);
  if (!s || !m || !isMonarch(g)) return T('Not before the throne.', '어전에 올라온 일이 아니다.');
  if (g.active || g.letter || g.report) return T('Finish what is in front of you first.', '눈앞의 일부터 마무리하라.');
  const d = memoDef(m.def);
  if (c === 'delay' && m.delayed) return T('It has been put off once already.', '이미 한 번 미루었다.');
  if (c === 'approve' && d && (d.approve.treasury ?? 0) < 0 && s.treasury < -(d.approve.treasury ?? 0)) return T('The state treasury cannot bear it.', '국고가 감당하지 못한다.');
  return null;
}
export function decideMemo(g0: Game, id: string, c: MemoChoice): Done {
  if (memoBar(g0, id, c)) return { game: g0, note: null };
  const g = clone(g0);
  const s = g.pol.state!;
  const m = s.memos!.find((x) => x.id === id)!;
  const d = memoDef(m.def)!;
  if (c === 'delay') {
    m.delayed = true;
    m.opened = g.dayCount;
    return { game: g, note: T(`Put off: ${d.title.en}. The ministers will ask again.`, `미루었다: ${d.title.ko}. 신하들이 다시 청할 것이다.`) };
  }
  // A weak throne sees even approved measures stall.
  const stalled = c === 'approve' && s.authority < 25 && roll(g, 'memo-stall:' + id) < 0.35;
  if (!stalled) applyFx(g, c === 'approve' ? d.approve : d.reject);
  s.memos = s.memos!.filter((x) => x.id !== id);
  g.counts.memorials = (g.counts.memorials ?? 0) + 1;
  g.counts[c === 'approve' ? 'memo-yes' : 'memo-no'] = (g.counts[c === 'approve' ? 'memo-yes' : 'memo-no'] ?? 0) + 1;
  const word = c === 'approve' ? T('Approved', '윤허') : T('Refused', '불윤');
  if (c === 'approve' && !stalled) g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'court', text: T(`Approved the memorial: ${d.title.en.toLowerCase()}.`, `상소를 윤허했다: ${d.title.ko}.`) });
  return {
    game: g,
    note: stalled
      ? T(`Approved, but the order stalls in the ministries: ${d.title.en}.`, `윤허했으나 어명이 관아에서 막혔다: ${d.title.ko}.`)
      : T(`${word.en}: ${d.title.en}. ${fxWords(c === 'approve' ? d.approve : d.reject).en}`, `${word.ko}: ${d.title.ko}. ${fxWords(c === 'approve' ? d.approve : d.reject).ko}`),
  };
}

// ---------------------------------------------------------------- the reign in words (GSDD Part X §22)

const band = (v: number, words: [string, string][]): Text => {
  const i = v >= 75 ? 0 : v >= 55 ? 1 : v >= 35 ? 2 : 3;
  return T(...words[i]);
};
export function reignWords(g: Game): { name: Text; text: Text }[] {
  const s = g.pol.state;
  if (!s) return [];
  const start = g.pol.rulers.filter((r) => r.player).at(-1)?.from;
  const years = start !== undefined ? Math.max(0, Math.floor((dateKey(g.date) - start) / 360)) : 0;
  const t = s.treasury;
  return [
    { name: T('Length of reign', '재위'), text: T(`${years} year${years === 1 ? '' : 's'}.`, `${years}년.`) },
    { name: T('Treasury', '국고'), text: t >= 6000 ? T('Full.', '넉넉하다.') : t >= 3000 ? T('Adequate.', '그럭저럭하다.') : t > 0 ? T('Strained.', '빠듯하다.') : T('Empty.', '바닥났다.') },
    { name: T('The people', '민심'), text: band(s.stability, [['Content.', '평안하다.'], ['Settled.', '안정되어 있다.'], ['Restless.', '술렁인다.'], ['Close to revolt.', '난이 일어날 지경이다.']]) },
    { name: T('The court', '조정'), text: band(s.cooperation, [['Works with you.', '뜻을 함께한다.'], ['Mostly obliging.', '대체로 따른다.'], ['Grudging.', '마지못해 따른다.'], ['Obstructive.', '사사건건 막는다.']]) },
    { name: T('The army', '군'), text: band(s.loyalty, [['Devoted.', '충성스럽다.'], ['Loyal.', '믿을 만하다.'], ['Uncertain.', '미덥지 못하다.'], ['Disaffected.', '등을 돌렸다.']]) },
    { name: T('Royal authority', '왕권'), text: band(s.authority, [['Commanding.', '확고하다.'], ['Firm.', '굳건하다.'], ['Contested.', '흔들린다.'], ['Weak.', '약하다.']]) },
    { name: T('Succession', '후사'), text: s.heir && g.npcs[s.heir]?.alive ? T(`${g.npcs[s.heir].name.en} is named heir.`, `${g.npcs[s.heir].name.ko}이(가) 후계로 책봉되었다.`) : T('No heir named.', '책봉된 후계가 없다.') },
    { name: T('Memorials decided', '결재한 상소'), text: T(`${g.counts.memorials ?? 0} (${g.counts['memo-yes'] ?? 0} approved).`, `${g.counts.memorials ?? 0}건 (윤허 ${g.counts['memo-yes'] ?? 0}건).`) },
  ];
}

// ---------------------------------------------------------------- abdication (GSDD Part X §23.3)

const sonsOf = (g: Game) => Object.values(g.npcs).filter((n) => n.kin === 'child' && n.parents.includes('player') && n.alive && !n.away && n.gender === 'man').sort((a, b) => a.birthYear - b.birthYear);
export function abdicationHeir(g: Game): Npc | null {
  const s = g.pol.state;
  const named = s?.heir ? g.npcs[s.heir] : undefined;
  if (named?.alive && !named.away) return named;
  const law = g.campaign.mode === 'alternative' ? g.campaign.rules?.succession ?? 'male' : 'male';
  if (law === 'absolute') return Object.values(g.npcs).filter((n) => n.kin === 'child' && n.parents.includes('player') && n.alive && !n.away).sort((a, b) => a.birthYear - b.birthYear)[0] ?? null;
  return sonsOf(g)[0] ?? null;
}
export function abdicateBar(g: Game): Text | null {
  if (g.player.royal !== 'king') return T('Only a reigning monarch can abdicate.', '재위 중인 임금만 양위할 수 있다.');
  if (g.active || g.letter || g.report) return T('Finish what is in front of you first.', '눈앞의 일부터 마무리하라.');
  const h = abdicationHeir(g);
  if (!h) return T('There is no heir to take the throne.', '보위를 이을 후계가 없다.');
  if (npcAge(g, h) < 15) return T(`${h.name.en} is too young to reign.`, `${h.name.ko}은(는) 보위에 오르기엔 너무 어리다.`);
  return null;
}
/** The monarch steps down for the heir and lives on as the retired king (sangwang). */
export function abdicate(g0: Game): Done {
  if (abdicateBar(g0)) return { game: g0, note: null };
  const g = clone(g0);
  const h = abdicationHeir(g)!;
  const title = h.given ? T(`King ${h.given.en}`, `${h.given.ko} 임금`) : T('the new king', '새 임금');
  g.pol.rulers.push({ from: dateKey(g.date), title, born: h.birthYear, player: false });
  const old = g.npcs.king;
  g.npcs.king = {
    ...(old ?? h), id: 'king', name: title, given: h.given, gender: h.gender, birthYear: h.birthYear, portrait: { kind: 'king', beard: npcAge(g, h) >= 32 ? 'short' : 'none' },
    alive: true, diedYear: null, away: false, kin: null, parents: [], spouse: h.spouse, role: T('The reigning monarch, your child', '보위에 오른 당신의 자식'), places: ['throne-hall'], post: undefined,
  };
  if (!g.rel.king) g.rel.king = { regard: 60, bond: 'none', met: true, moments: [], talked: 0, gifted: 0 };
  g.rel.king.regard = Math.max(g.rel.king.regard, g.rel[h.id]?.regard ?? 50);
  h.away = true;
  g.player.royal = 'none';
  g.player.favour = 80;
  g.pol.state = null;
  g.flags.abdicated = true;
  g.place = 'residence';
  const P = playerName(g);
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'court', text: T(`Abdicated in favour of ${h.name.en}, and became the retired king.`, `${h.name.ko}에게 양위하고 상왕이 되었다.`) });
  emit(g, { type: 'ROYAL_SUCCESSION', text: T(`${P.en} abdicated; ${title.en} takes the throne.`, `${P.ko}이(가) 양위하고 ${title.ko}이(가) 즉위했다.`) });
  feel(g, null, 6);
  return { game: g, note: T(`You hand the royal seal to ${h.name.en}. You are the retired king now: honoured, consulted, and free.`, `${h.name.ko}에게 국새를 넘겼다. 이제 상왕이다. 예우받고 자문하되 자유롭다.`) };
}

// ---------------------------------------------------------------- the line of succession (GSDD Part X §8.4)

export type Claimant = { id: string; name: Text; place: Text; basis: Text };
export function lineOfSuccession(g: Game): Claimant[] {
  const out: Claimant[] = [];
  const law = g.campaign.mode === 'alternative' ? g.campaign.rules?.succession ?? 'male' : 'male';
  const basis = g.campaign.mode === 'alternative'
    ? T(`Sandbox rule: ${law === 'male' ? 'eldest legitimate son' : law === 'designated' ? 'the heir the monarch names' : 'eldest child'}.`, `샌드박스 규칙: ${law === 'male' ? '적장자' : law === 'designated' ? '임금이 지명한 후계' : '맏이'}.`)
    : T('Recorded practice: a son named crown prince, chosen by the king.', '기록된 관행: 임금이 책봉한 왕세자.');
  if (g.player.royal === 'king') {
    out.push({ id: 'player', name: playerName(g), place: T('Reigning monarch (you)', '재위 중인 임금 (당신)'), basis });
    const s = g.pol.state;
    const kids = Object.values(g.npcs).filter((n) => n.kin === 'child' && n.parents.includes('player') && n.alive && !n.away).sort((a, b) => a.birthYear - b.birthYear);
    for (const k of kids) {
      const eligible = law === 'absolute' || k.gender === 'man';
      out.push({ id: k.id, name: k.name, place: k.id === s?.heir ? T('Named heir', '책봉된 후계') : eligible ? T('Eligible', '계승 자격 있음') : T('Not eligible under the law', '법도상 자격 없음'), basis });
    }
    return out;
  }
  const king = g.npcs.king;
  if (king?.alive) out.push({ id: 'king', name: king.name, place: T('Reigning monarch', '재위 중인 임금'), basis });
  for (const id of ['crown-prince', 'elder-prince', 'younger-prince']) {
    const n = g.npcs[id];
    if (n?.alive && !n.away) out.push({ id, name: n.name, place: id === 'crown-prince' ? T('Crown prince', '왕세자') : T('Prince with a claim', '계승을 다투는 왕자'), basis });
  }
  if (g.player.royal === 'crownPrince') out.push({ id: 'player', name: playerName(g), place: T('Crown prince (you)', '왕세자 (당신)'), basis });
  else if (g.player.legal === 'royal' && g.player.royal === 'none') out.push({ id: 'player', name: playerName(g), place: heirEligible(g) ? T('A possible heir (you)', '후계 후보 (당신)') : T('Royal kin, outside the succession (you)', '계승 밖의 종친 (당신)'), basis });
  return out;
}
export type { StateGov };

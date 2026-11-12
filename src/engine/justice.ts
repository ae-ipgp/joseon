import { politicsAdd } from './difficulty';
import { certificate, emit } from './bus';
import type { Clue, Game, Inquiry, Npc, Text } from '../model/schemas';
import { T } from './text';
import { clamp, clone, roll } from './world';
import { factionMembers, dominant, diverge } from './politics';

/**
 * GSDD Part II §15–16 and Part I §14: investigations with evidence of differing reliability,
 * punishments that stay distinct from one another, the formal loss of status, and restoration
 * that depends on circumstances and is never guaranteed.
 */

type Say = (t: Text, record?: boolean) => void;
export type Done = { game: Game; note: Text | null };
const no = (g: Game, why?: Text): Done => ({ game: g, note: why ?? null });
const logIt = (g: Game, tag: string, text: Text) => g.log.push({ year: g.date.year, moon: g.date.moon, tag, text });

// ---------------------------------------------------------------- inquiries

const KIND_TITLE: Record<Inquiry['kind'], Text> = {
  corruption: T('Bribery in the ministries', '관아의 뇌물 사건'),
  treason: T('A letter of treason', '역모 투서'),
  accounts: T('Missing grain from the state granary', '국창 곡식 횡령 사건'),
  scandal: T('A scandal in a noble house', '양반가의 추문'),
  downfall: T('Who brought you down', '당신을 무너뜨린 자'),
};

/** People who could plausibly be behind something at court. */
function suspectsFor(g: Game, kind: Inquiry['kind']): string[] {
  const officials = Object.values(g.npcs).filter((n) => n.alive && !n.away && n.id !== 'king' && (n.post || n.house) && !n.parents.includes('player') && n.kin !== 'father' && n.kin !== 'mother' && n.id !== 'father' && n.id !== 'mother');
  const pool = officials.length >= 3 ? officials : Object.values(g.npcs).filter((n) => n.alive && n.id !== 'king' && n.id !== 'father' && n.id !== 'mother');
  const pick: Npc[] = [];
  for (let i = 0; pick.length < Math.min(3, pool.length) && i < 20; i++) {
    const n = pool[Math.floor(roll(g, `suspect:${kind}:${i}`) * pool.length)];
    if (n && !pick.includes(n)) pick.push(n);
  }
  return pick.map((n) => n.id);
}

export function openInquiry(g: Game, kind: Inquiry['kind'], say?: Say): Inquiry | null {
  if (g.pol.inquiries.some((i) => !i.outcome && i.kind === kind)) return null;
  const suspects = suspectsFor(g, kind);
  if (suspects.length < 2) return null;
  const falseCharge = kind !== 'downfall' && roll(g, 'false-charge:' + kind) < 0.25;
  const truth = falseCharge ? 'none' : suspects[Math.floor(roll(g, 'truth:' + kind) * suspects.length)];
  const q: Inquiry = {
    id: `inq-${kind}-${g.dayCount}`, kind, title: KIND_TITLE[kind], suspects, truth, clues: [], used: [], opened: g.dayCount,
    due: g.dayCount + (kind === 'downfall' ? 3600 : 180), outcome: null,
  };
  g.pol.inquiries.push(q);
  logIt(g, 'politics', T(`Opened an inquiry: ${q.title.en.toLowerCase()}.`, `조사를 시작했다: ${q.title.ko}.`));
  say?.(T(`You are charged with an inquiry: ${q.title.en.toLowerCase()}. Findings are due within two seasons.`, `${q.title.ko} 조사를 맡았다. 두 철 안에 결과를 올려야 한다.`), true);
  return q;
}

/** Lines of inquiry. Each can be used once per inquiry. */
export const LINES: { id: string; name: Text; text: Text; cost: number; attr: string[]; needs?: 'office' | 'messenger' }[] = [
  { id: 'witness', name: T('Question a witness', '증인 신문'), text: T('Servants and clerks saw more than they say.', '하인과 서리는 말하는 것보다 많이 보았다.'), cost: 0, attr: ['empathy', 'persuasion'] },
  { id: 'records', name: T('Examine the official records', '관아 문서 대조'), text: T('Ledgers do not lie, but they can be rewritten.', '장부는 거짓말을 하지 않지만 고쳐 쓸 수는 있다.'), cost: 0, attr: ['administration', 'intelligence'], needs: 'office' },
  { id: 'letters', name: T('Search for correspondence', '서찰 수색'), text: T('A letter is the best witness, if it is real.', '편지는 최고의 증인이다. 진짜라면.'), cost: 0, attr: ['intelligence', 'courage'] },
  { id: 'informant', name: T('Pay an informant (40 nyang)', '정보원 매수 (40냥)'), text: T('Money opens mouths, not always honest ones.', '돈은 입을 연다. 언제나 정직한 입은 아니지만.'), cost: 40, attr: ['judgement'], needs: 'messenger' },
  { id: 'confront', name: T('Confront a suspect', '혐의자 대질'), text: T('Watch who flinches.', '누가 움찔하는지 보라.'), cost: 0, attr: ['command', 'courage'] },
  { id: 'consult', name: T('Consult the Ministry of Punishments', '형조에 자문'), text: T('Old hands can tell a forged seal from a true one.', '노련한 관원은 위조 인장을 가려낸다.'), cost: 0, attr: ['judgement', 'diplomacy'] },
];

export function lineBar(g: Game, q: Inquiry, lineId: string): Text | null {
  const l = LINES.find((x) => x.id === lineId);
  if (!l || q.outcome) return T('Closed.', '종결됨.');
  if (q.used.includes(lineId)) return T('Already followed.', '이미 조사했다.');
  if (g.flags['inquired']) return T('Enough for today; try again tomorrow.', '오늘은 여기까지. 내일 다시.');
  if (l.needs === 'office' && !g.player.office && g.player.royal !== 'king' && g.player.royal !== 'regent') return T('You need an office to open the archives.', '문서고를 열려면 관직이 있어야 한다.');
  if (l.cost && g.player.money < l.cost) return T(`Needs ${l.cost} nyang.`, `${l.cost}냥이 필요하다.`);
  return null;
}

const RELIABILITY = (w: number): Text => (w >= 0.7 ? T('Solid', '확실함') : w >= 0.45 ? T('Probable', '그럴듯함') : T('Doubtful', '미심쩍음'));
export const reliability = RELIABILITY;

export function follow(g0: Game, inquiryId: string, lineId: string): Done {
  const q0 = g0.pol.inquiries.find((x) => x.id === inquiryId);
  if (!q0 || lineBar(g0, q0, lineId)) return no(g0);
  const g = clone(g0);
  const q = g.pol.inquiries.find((x) => x.id === inquiryId)!;
  const l = LINES.find((x) => x.id === lineId)!;
  g.flags['inquired'] = true;
  q.used.push(lineId);
  if (l.cost) g.player.money -= l.cost;
  const p = g.player;
  const skill = l.attr.reduce((n, a) => n + (p.attrs[a] ?? 50), 0) / l.attr.length + (g.econ.staff.some((s) => s.role === 'messenger') ? 5 : 0);
  const r = roll(g, `line:${q.id}:${lineId}`);
  const honest = r < 0.35 + skill / 140;
  // An honest clue points at the truth (or clears a suspect when the charge is false); a bad one points anywhere.
  let against: string | null;
  if (honest) against = q.truth === 'none' ? null : q.truth;
  else against = roll(g, `line-wrong:${q.id}:${lineId}`) < 0.3 ? null : q.suspects[Math.floor(roll(g, `line-who:${q.id}:${lineId}`) * q.suspects.length)];
  const weight = Math.round((honest ? 0.45 + roll(g, `line-w:${q.id}:${lineId}`) * 0.5 : 0.2 + roll(g, `line-w:${q.id}:${lineId}`) * 0.4) * 100) / 100;
  const who = against ? g.npcs[against]?.name ?? T('someone', '누군가') : null;
  const SAYS: Record<string, [string, string]> = {
    witness: ['A servant swears she saw', '한 하녀가 맹세하기를'],
    records: ['The ledgers show entries in the hand of', '장부에 적힌 글씨는'],
    letters: ['A letter turns up, sealed by', '찾아낸 편지에 찍힌 인장은'],
    informant: ['Your informant names', '정보원이 지목한 사람은'],
    confront: ['Under questioning, the one who flinches is', '대질하자 움찔한 사람은'],
    consult: ['The old clerks think the trail leads to', '노련한 서리들이 보기에 흔적이 닿는 곳은'],
  };
  const [en, ko] = SAYS[lineId];
  const text = who
    ? T(`${en} ${who.en}.`, `${ko} ${who.ko}.`)
    : T(`${l.name.en}: nothing ties any of the accused to it. Perhaps the charge itself is false.`, `${l.name.ko}: 혐의자 누구와도 이어지지 않는다. 고발 자체가 거짓일지도 모른다.`);
  const clue: Clue = { id: `${q.id}:${lineId}`, text, weight, against, source: lineId };
  q.clues.push(clue);
  if (q.kind === 'downfall' && g.pol.downfall && against === q.truth) g.pol.downfall.proof = clamp(g.pol.downfall.proof + Math.round(weight * 30), 0, 100);
  if (lineId === 'confront' && against && g.rel[against]) g.rel[against].regard = clamp(g.rel[against].regard - 8, -100, 100);
  if (lineId === 'letters' && !honest && roll(g, 'caught-searching') < 0.25) {
    p.reputation = clamp(p.reputation - 3, 0, 100);
    return { game: g, note: T(`${text.en} (${RELIABILITY(weight).en}.) You were seen searching where you had no right to. Reputation −3.`, `${text.ko} (${RELIABILITY(weight).ko}.) 함부로 뒤지다 들켰다. 평판 −3.`) };
  }
  return { game: g, note: T(`${text.en} (${RELIABILITY(weight).en}.)`, `${text.ko} (${RELIABILITY(weight).ko}.)`) };
}

/** The weight of evidence gathered against each suspect. */
export function weights(q: Inquiry): Record<string, number> {
  const w: Record<string, number> = { none: 0 };
  for (const s of q.suspects) w[s] = 0;
  for (const c of q.clues) w[c.against ?? 'none'] = (w[c.against ?? 'none'] ?? 0) + c.weight;
  return w;
}

export const OUTCOMES: Record<string, Text> = {
  established: T('Misconduct established', '혐의 입증'),
  conspiracy: T('Conspiracy exposed', '음모 적발'),
  disproven: T('Allegation disproven', '무고로 판명'),
  inconclusive: T('Inquiry inconclusive', '증거 불충분'),
  wrong: T('The wrong person accused', '엉뚱한 사람을 고발함'),
  obstructed: T('Inquiry obstructed', '조사 방해'),
  implicated: T('The investigator implicated', '조사관 연루'),
  lapsed: T('Findings never submitted', '결과 미제출'),
};

/** Submits findings: an accused, or 'none' to declare the charge false. */
export function submit(g0: Game, inquiryId: string, accused: string): Done {
  const q0 = g0.pol.inquiries.find((x) => x.id === inquiryId);
  if (!q0 || q0.outcome) return no(g0);
  const g = clone(g0);
  const q = g.pol.inquiries.find((x) => x.id === inquiryId)!;
  const p = g.player;
  const w = weights(q);
  const strength = w[accused] ?? 0;
  const guilty = q.truth;
  const suspect = guilty !== 'none' ? g.npcs[guilty] : undefined;
  const powerful = suspect && (suspect.faction === 'A' || suspect.faction === 'B') && g.pol.inf[suspect.faction] >= 70;
  let outcome: string;
  if (accused === guilty && guilty !== 'none') {
    if (powerful && strength < 1.6 && roll(g, 'obstruct:' + q.id) < 0.45) outcome = 'obstructed';
    else outcome = strength >= 1.1 ? (q.kind === 'treason' || q.kind === 'downfall' ? 'conspiracy' : 'established') : 'inconclusive';
  } else if (accused === 'none') {
    outcome = guilty === 'none' ? 'disproven' : strength >= 0.8 ? 'inconclusive' : 'inconclusive';
  } else {
    outcome = powerful && roll(g, 'implicate:' + q.id) < 0.3 ? 'implicated' : 'wrong';
  }
  q.outcome = outcome;
  const notes: string[] = [];
  const notesKo: string[] = [];
  const st = (k: 'reputation' | 'favour' | 'honour', d: number, en: string, ko: string) => {
    p[k] = clamp(p[k] + d, 0, 100);
    notes.push(`${en} ${d > 0 ? '+' : '−'}${Math.abs(d)}`);
    notesKo.push(`${ko} ${d > 0 ? '+' : '−'}${Math.abs(d)}`);
  };
  const target = accused !== 'none' ? g.npcs[accused] : undefined;
  switch (outcome) {
    case 'established':
    case 'conspiracy':
      st('reputation', 6, 'Reputation', '평판');
      st('favour', 5, 'Favour', '총애');
      if (target) {
        target.away = true;
        target.places = [];
        if (target.faction === 'A' || target.faction === 'B') g.pol.inf[target.faction] = clamp(g.pol.inf[target.faction] - 8, 5, 95);
      }
      p.service += 6;
      g.counts.solved = (g.counts.solved ?? 0) + 1;
      if (q.kind === 'downfall' && g.pol.downfall) {
        g.pol.downfall.proof = clamp(g.pol.downfall.proof + 25, 0, 100);
        g.flags.avenged = true;
      }
      break;
    case 'disproven':
      st('honour', 5, 'Honour', '명예');
      for (const s of q.suspects) if (g.rel[s]) g.rel[s].regard = clamp(g.rel[s].regard + 6, -100, 100);
      p.service += 4;
      g.counts.solved = (g.counts.solved ?? 0) + 1;
      break;
    case 'inconclusive':
      st('reputation', -1, 'Reputation', '평판');
      break;
    case 'wrong':
      st('honour', -6, 'Honour', '명예');
      st('reputation', -4, 'Reputation', '평판');
      if (target && g.rel[target.id]) {
        g.rel[target.id].regard = clamp(g.rel[target.id].regard - 30, -100, 100);
        g.rel[target.id].dims = { ...(g.rel[target.id].dims ?? {}), resentment: 70 };
      }
      break;
    case 'obstructed':
      st('favour', -2, 'Favour', '총애');
      if (suspect && g.rel[suspect.id]) g.rel[suspect.id].regard = clamp(g.rel[suspect.id].regard - 15, -100, 100);
      break;
    case 'implicated':
      st('reputation', -6, 'Reputation', '평판');
      g.flags['purge-target'] = true;
      break;
  }
  logIt(g, 'politics', T(`Inquiry into ${q.title.en.toLowerCase()}: ${OUTCOMES[outcome].en.toLowerCase()}.`, `${q.title.ko} 조사 결과: ${OUTCOMES[outcome].ko}.`));
  const head = OUTCOMES[outcome];
  return { game: g, note: T(`${head.en}. ${notes.join(', ')}`.trim(), `${head.ko}. ${notesKo.join(', ')}`.trim()) };
}

function inquirySeason(g: Game, say: Say) {
  for (const q of g.pol.inquiries) {
    if (!q.outcome && g.dayCount > q.due) {
      q.outcome = 'lapsed';
      g.player.reputation = clamp(g.player.reputation - 3, 0, 100);
      g.player.service -= 3;
      say(T(`You never submitted findings on ${q.title.en.toLowerCase()}. You are reprimanded. Reputation −3.`, `${q.title.ko}의 조사 결과를 올리지 못해 견책을 받았다. 평판 −3.`), true);
    }
  }
  g.pol.inquiries = g.pol.inquiries.filter((q) => !q.outcome || g.dayCount - q.due < 720);
  const p = g.player;
  const post = p.office?.post ?? '';
  const watchful = ['gamchal', 'daesaheon', 'hyeongjo-jwarang', 'hyeongjo-panseo', 'jeongeon', 'daesagan'].includes(post);
  if (g.flags['audit-ordered']) {
    g.flags['audit-ordered'] = false;
    openInquiry(g, 'corruption', say);
  } else if (p.office && p.legal !== 'commoner' && roll(g, 'assign-inquiry') < (watchful ? 0.3 : 0.06) * (1 + politicsAdd(g) / 3)) {
    const kinds: Inquiry['kind'][] = ['corruption', 'accounts', 'scandal', 'treason'];
    openInquiry(g, kinds[Math.floor(roll(g, 'inquiry-kind') * kinds.length)], say);
  }
}

// ---------------------------------------------------------------- punishment

export type Punishment = 'reprimand' | 'demotion' | 'dismissal' | 'exile' | 'confiscation' | 'revocation' | 'death';
export const PUNISHMENTS: Record<Punishment, Text> = {
  reprimand: T('Reprimand', '견책'), demotion: T('Demotion', '강등'), dismissal: T('Dismissal from office', '파직'),
  exile: T('Exile', '유배'), confiscation: T('Confiscation of property', '재산 몰수'),
  revocation: T('Loss of noble status', '신분 박탈'), death: T('Death by poison', '사약'),
};

/** Applies one punishment. They are kept distinct: dismissal is not exile; exile is not loss of status. */
export function punish(g: Game, kind: Punishment, cause: Text, say?: Say): Text[] {
  const p = g.player;
  const out: Text[] = [];
  const add = (t: Text) => { out.push(t); say?.(t, true); };
  switch (kind) {
    case 'reprimand':
      p.reputation = clamp(p.reputation - 4, 0, 100);
      p.favour = clamp(p.favour - 5, 0, 100);
      add(T('You are formally reprimanded. Reputation −4, favour −5.', '공식 견책을 받았다. 평판 −4, 총애 −5.'));
      break;
    case 'demotion':
      if (p.office && p.office.rank > 1) {
        p.office = { ...p.office, rank: p.office.rank - 1, post: undefined };
        add(T('You are demoted one step.', '한 품계 강등되었다.'));
      } else return punish(g, 'dismissal', cause, say);
      break;
    case 'dismissal':
      if (p.office) {
        p.office = null;
        add(T('You are dismissed from office.', '관직에서 파직되었다.'));
        emit(g, { type: 'OFFICIAL_DISMISSED', text: T('Dismissed from office.', '관직에서 파직되었다.') });
      } else return punish(g, 'reprimand', cause, say);
      break;
    case 'exile': {
      p.office = null;
      const far = ['hamgyeong', 'jeolla', 'pyeongan'][Math.floor(roll(g, 'exile-place') * 3)];
      const years = 1 + Math.floor(roll(g, 'exile-years') * 3);
      g.pol.exile = { until: g.dayCount + years * 360, province: far };
      g.place = 'residence';
      add(T(`You are sent into exile for ${years} year${years > 1 ? 's' : ''}.`, `${years}년 유배형을 받았다.`));
      g.counts.exiled = (g.counts.exiled ?? 0) + 1;
      break;
    }
    case 'confiscation': {
      const lose = g.econ.estates.filter((e) => e.kind !== 'town');
      const taken = lose.slice(0, Math.ceil(lose.length / 2));
      g.econ.estates = g.econ.estates.filter((e) => !taken.includes(e));
      const cash = Math.round(g.econ.treasury / 2);
      g.econ.treasury -= cash;
      add(T(`The state confiscates ${taken.length} estate${taken.length === 1 ? '' : 's'} and ${cash} nyang.`, `나라가 전장 ${taken.length}곳과 ${cash}냥을 몰수했다.`));
      break;
    }
    case 'revocation':
      revoke(g, cause);
      add(T('Your name is struck from the registers of the nobility.', '사족 명부에서 이름이 지워졌다.'));
      break;
    case 'death':
      g.flags['condemned'] = true;
      add(T('A royal order arrives with a bowl of poison.', '어명과 함께 사약이 내려왔다.'));
      break;
  }
  logIt(g, 'downfall', T(`${PUNISHMENTS[kind].en}: ${cause.en.charAt(0).toLowerCase()}${cause.en.slice(1)}`, `${PUNISHMENTS[kind].ko}: ${cause.ko}`));
  return out;
}

/** Formal loss of noble or royal status (Part I §14.3). The downfall screen follows. */
export function revoke(g: Game, cause: Text) {
  const p = g.player;
  g.pol.downfall = { day: g.dayCount, cause, proof: 0, appeals: 0, continued: false, was: { office: p.office, royal: p.royal, legal: p.legal } };
  emit(g, { type: 'SOCIAL_STATUS_REVOKED', text: T(`Status revoked: ${cause.en}`, `신분 박탈: ${cause.ko}`) });
  p.office = null;
  p.legal = 'commoner';
  if (p.royal !== 'none') diverge(g, T(`${p.given.en} was stripped of royal rank.`, `${p.given.ko}이(가) 왕족의 지위를 잃었다.`));
  p.royal = 'none';
  g.pol.state = null;
  g.pol.side = 'neutral';
  g.pol.standing = 0;
  g.pol.exile = null;
  // Property follows the punishment: the house and land go; a rented room in the lower city remains.
  const town = g.econ.estates.find((e) => e.kind === 'town');
  g.econ.estates = town ? [{ ...town, id: 'rented', name: T('A rented house in the lower city', '아랫마을 셋집'), area: 2, value: 120, buildings: [], works: null, condition: 45 }] : [];
  g.econ.treasury = Math.round(g.econ.treasury * 0.1);
  g.econ.staff = g.econ.staff.filter((s) => s.npc === 'maid' || s.role === 'servants').map((s) => (s.role === 'servants' ? { ...s, count: 0, wage: 0 } : s));
  g.econ.businesses = g.econ.businesses.filter((b) => b.owner === 'purse');
  g.econ.role = 'head';
  g.place = 'residence';
  g.counts.downfalls = (g.counts.downfalls ?? 0) + 1;
  openInquiry(g, 'downfall');
}

export const needsDownfallScreen = (g: Game | null) => !!g && g.player.alive && !!g.pol.downfall && !g.pol.downfall.continued && g.player.legal === 'commoner';

export function continueAsCommoner(g0: Game): Game {
  const g = clone(g0);
  if (g.pol.downfall) g.pol.downfall.continued = true;
  logIt(g, 'downfall', T('Chose to go on living as a commoner.', '평민으로 계속 살아가기로 했다.'));
  return g;
}
export function endCampaign(g0: Game): Game {
  const g = clone(g0);
  g.player.alive = false;
  g.player.diedYear = g.date.year;
  g.ending = 'commoner';
  if (g.pol.downfall) g.pol.downfall.continued = true;
  return g;
}

// ---------------------------------------------------------------- restoration

export function appealBar(g: Game): Text | null {
  const d = g.pol.downfall;
  if (!d || g.player.legal !== 'commoner') return T('There is nothing to appeal.', '청원할 일이 없다.');
  if (g.flags['appealed']) return T('One petition a year; the drum has been struck.', '청원은 해마다 한 번. 이미 신문고를 울렸다.');
  if (g.flags['restore-closed']) return T('The throne has ruled that your case is closed for ever.', '조정은 당신의 일을 영영 다시 논하지 않기로 했다.');
  return null;
}

/** Chance that a petition succeeds: proof, friends at court, the king's temper and the rules of the age. */
export function appealChance(g: Game): number {
  const d = g.pol.downfall!;
  const friends = Object.entries(g.rel).filter(([id, r]) => r.regard >= 50 && g.npcs[id]?.alive && (g.npcs[id]?.post || g.npcs[id]?.house)).length;
  const open = g.campaign.rules?.mobility === 'open' ? 0.15 : 0;
  const wasRoyal = d.was.royal !== 'none' || d.was.legal === 'royal' ? -0.05 : 0;
  return clamp(0.04 + d.proof / 160 + friends * 0.04 + (g.flags.avenged ? 0.15 : 0) + open + wasRoyal - d.appeals * 0.03, 0.02, 0.85);
}

export function appeal(g0: Game): Done {
  if (appealBar(g0)) return no(g0);
  const g = clone(g0);
  const d = g.pol.downfall!;
  g.flags['appealed'] = true;
  d.appeals += 1;
  const chance = appealChance(g);
  const r = roll(g, 'appeal:' + d.appeals);
  if (r < chance) {
    const full = d.proof >= 70 || r < chance / 3;
    restore(g, full);
    return { game: g, note: full
      ? T('The king reads your petition and orders your case reopened. Your name is cleared and your rank restored in full.', '전하께서 상소를 읽고 재조사를 명하셨다. 누명이 벗겨지고 신분이 온전히 회복되었다.')
      : T('Your status is restored, but not your offices or lands. It is a beginning.', '신분은 회복되었으나 관직과 전장은 돌아오지 않았다. 그래도 시작이다.') };
  }
  if (d.appeals >= 4 && d.proof < 20 && roll(g, 'closed') < 0.5) {
    g.flags['restore-closed'] = true;
    return { game: g, note: T('The petition is refused, and the court declares the matter closed for ever. You may still live well, and your children may yet do better.', '청원은 기각되었고, 조정은 이 일을 영영 거론하지 말라 하였다. 그래도 잘 살 수는 있고, 자식들은 더 나을 수 있다.') };
  }
  return { game: g, note: T('The petition is received and refused. Gather more proof, and more friends.', '상소는 접수되었으나 기각되었다. 증거와 우군을 더 모아라.') };
}

export function restore(g: Game, full: boolean) {
  const d = g.pol.downfall;
  const p = g.player;
  p.legal = d?.was.legal === 'royal' ? 'royal' : 'yangban';
  if (full && d?.was.office) p.office = { ...d.was.office, rank: Math.max(1, d.was.office.rank - 1), post: undefined };
  p.honour = clamp(p.honour + 10, 0, 100);
  p.reputation = clamp(p.reputation + (full ? 10 : 4), 0, 100);
  if (full) {
    const town = g.econ.estates.find((e) => e.id === 'rented');
    if (town) Object.assign(town, { id: 'restored-home', name: T('Family residence', '본가'), area: 10, value: 900, condition: 55 });
    g.econ.treasury += 300;
  }
  g.pol.downfall = null;
  g.flags.restored = true;
  emit(g, { type: 'STATUS_RESTORED', text: T(full ? 'Rank and honour restored in full.' : 'Status restored.', full ? '관작과 명예가 모두 회복되었다.' : '신분이 회복되었다.'), doc: { title: T('Royal decree of exoneration (sinwon)', '신원 교지'), body: certificate(g, T(full ? 'The former verdict is overturned; rank and honour are restored.' : 'The former verdict is overturned; status is restored.', full ? '이전의 판결을 뒤집고 관작과 명예를 회복함.' : '이전의 판결을 뒤집고 신분을 회복함.')) } });
  g.flags['restored-full'] = full;
  logIt(g, 'downfall', full ? T('Name cleared and rank restored in full.', '누명을 벗고 신분을 온전히 되찾았다.') : T('Status restored in part.', '신분을 일부 되찾았다.'));
  g.counts.restorations = (g.counts.restorations ?? 0) + 1;
}

// ---------------------------------------------------------------- per season

/** Faction purges and royal anger fall on the player here, by degrees. */
export function justiceSeason(g: Game, say: Say) {
  if (!g.player.alive) return;
  inquirySeason(g, say);
  const p = g.player;
  if (seasonOf3(g) === 0) g.flags['appealed'] = false;
  g.flags['inquired'] = false;
  if (g.flags['purge-target'] && p.legal !== 'commoner') {
    g.flags['purge-target'] = false;
    const exposure = g.pol.standing / 100 + (p.office?.rank ?? 0) / 10 + (g.flags.corrupt ? 0.3 : 0) - p.favour / 200 - p.honour / 300;
    const strife = (g.campaign.rules?.strife ?? 3) / 3;
    const r = roll(g, 'purge-fall') / strife;
    const cause = T(`Caught on the losing side of a purge, charged with ${g.flags.corrupt ? 'corruption' : 'disloyalty'}`, `사화의 패자 편에 섰다가 ${g.flags.corrupt ? '부정부패' : '불충'}의 죄목을 받았다`);
    if (r < exposure * 0.15 && p.royal !== 'king') punish(g, 'revocation', cause, say);
    else if (r < exposure * 0.35) punish(g, 'exile', cause, say);
    else if (r < exposure * 0.7) punish(g, p.office ? 'dismissal' : 'reprimand', cause, say);
    else say(T('The purge passes you by, narrowly. Your friends were not so lucky.', '사화가 아슬아슬하게 당신을 비껴갔다. 동지들은 운이 없었다.'));
  }
  if (g.flags['deposed'] && p.royal === 'king') {
    g.flags['deposed'] = false;
    p.royal = 'none';
    g.pol.state = null;
    diverge(g, T(`${p.given.en} was deposed by the ministers.`, `${p.given.ko}이(가) 신하들에게 폐위되었다.`));
    punish(g, 'exile', T('Deposed by the ministers after royal authority collapsed', '왕권이 무너져 신하들에게 폐위되었다'), say);
    say(T('The ministers have deposed you. You are a prince again, and on your way to an island.', '신하들이 당신을 폐위했다. 다시 군(君)으로 강등되어 섬으로 향한다.'), true);
  }
  if (g.flags.corrupt && p.office && roll(g, 'corrupt-found') < 0.08) {
    g.flags.corrupt = false;
    const watch = factionMembers(g, dominant(g) === 'A' ? 'A' : 'B').length;
    punish(g, watch > 2 ? 'confiscation' : 'dismissal', T('Bribes taken in office came to light', '재직 중 받은 뇌물이 드러났다'), say);
  }
}
const seasonOf3 = (g: Game) => Math.floor((g.date.moon - 1) / 3);

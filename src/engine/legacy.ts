import { makeAttrs, syncQualities } from './character';
import { pastLife } from './chronicle2';
import { EDU_FIELDS, TEMPERS } from '../content/attributes';
import { econRole, marryInto } from './econ';
import { ROYAL_TITLES, initState } from './politics';
import { postById } from '../content/government';
import { dateKey } from './time';
import type { Game, Npc, Rel, Text } from '../model/schemas';
import { makeNpc, makeRel, rulerNpc } from '../content/cast';
import { HANBOK } from '../content/families';
import { ENDINGS, OFFICES, prestigeWord, reputationWord } from '../content/lists';
import { surnameOf } from './season';
import { T, josa, numberWord, ordinal } from './text';
import { playerAge } from './time';
import { clamp, npcAge, npcPortrait, playerName, playerPortrait, roll, spouseId } from './world';
import { START_MONEY } from './money';
import { ensureCourt } from './royals';
import { applyUpbringing } from './life';
import { scenarioById } from '../content/scenarios';

const ko = (t: Text) => t.ko ?? t.en;

export const endingTitle = (g: Game): Text => ENDINGS[g.ending ?? 'quiet']?.title ?? ENDINGS.quiet.title;
export const endingSeal = (g: Game): string => ENDINGS[g.ending ?? 'quiet']?.ko ?? ENDINGS.quiet.ko;
/** The year the life closed: an exile's death lies some years after the scene that ended it. */
export const closingYear = (g: Game) => Math.max(g.date.year, g.player.diedYear ?? g.date.year);
export const ageAtDeath = (g: Game) => closingYear(g) - g.player.birthYear;

const ownChildren = (g: Game) => Object.values(g.npcs).filter((n) => n.kin === 'child' && n.parents.includes('player')).sort((a, b) => a.birthYear - b.birthYear);
const grandchildren = (g: Game) => {
  const kids = new Set(ownChildren(g).map((c) => c.id));
  return Object.values(g.npcs).filter((n) => n.kin === 'grandchild' && n.parents.some((p) => kids.has(p))).sort((a, b) => a.birthYear - b.birthYear);
};

/** One or two sentences that sum up the life. */
export function epitaph(g: Game): Text {
  const woman = g.player.gender === 'woman';
  const [He, his] = woman ? ['She', 'her'] : ['He', 'his'];
  const en: string[] = [];
  const kr: string[] = [];
  if (g.flags['letter-burned']) { en.push(`kept ${his} father’s secret`); kr.push('아버지의 비밀을 지켰다.'); }
  else if (g.flags['handed-by-player']) { en.push(`chose the throne over ${his} own father`); kr.push('아버지보다 왕실을 택했다.'); }
  else if (g.flags['letter-kept']) { en.push(`held a letter that could hang ${his} father, and never used it`); kr.push('아버지를 죽음으로 몰 수 있는 서신을 쥐고도 쓰지 않았다.'); }
  if (g.ending === 'exile') { en.push('was exiled to Jeju for life'); kr.push('제주로 종신 유배되었다.'); }
  const sp = spouseId(g);
  if (sp && g.npcs[sp]) {
    const n = g.npcs[sp].name;
    const against = g.flags['married-against-wishes'];
    en.push(`married ${n.en}${against ? ` against ${his} parents’ wishes` : ''}`);
    kr.push(`${against ? '부모의 뜻을 거스르고 ' : ''}${ko(n)}${josa(ko(n), '과', '와')} 혼인했다.`);
  }
  const o = g.player.office;
  if (o) {
    const t = OFFICES[o.track][o.rank - 1];
    en.push(`rose to be ${t.en}`);
    kr.push(`${ko(t)} 자리에 올랐다.`);
  }
  const kids = ownChildren(g).length;
  if (kids) {
    en.push(`raised ${numberWord(kids)} ${kids === 1 ? 'child' : 'children'}`);
    kr.push(`자식 ${kids}명을 길렀다.`);
  }
  if (!en.length) {
    en.push('kept clear of the court’s quarrels');
    kr.push('조정의 다툼에서 멀찍이 비켜서 살았다.');
  }
  const last = en.pop()!;
  const sentence = `${He} ${en.length ? en.join(', ') + (en.length > 1 ? ',' : '') + ' and ' : ''}${last}.`;
  return T(sentence, kr.join(' '));
}

export type Measure = { label: Text; value: Text; note: Text };

export function measures(g: Game): Measure[] {
  const rep = g.player.reputation;
  const kids = ownChildren(g).length;
  const grand = grandchildren(g).length;
  const p = g.house.prestige;
  const fam = p > g.startPrestige ? T('Raised', '높아짐') : p < g.startPrestige ? T('Lowered', '낮아짐') : T('Kept', '지켜냄');
  const o = g.player.office;
  return [
    { label: T('Reputation', '평판'), value: reputationWord(rep), note: T(`${rep} of 100 at the end.`, `마지막 평판 ${rep}/100.`) },
    { label: T('Family standing', '가문의 위세'), value: fam, note: T(`${prestigeWord(p).en}, ${p} of 5. It began at ${g.startPrestige}.`, `${ko(prestigeWord(p))}, ${p}/5. 시작은 ${g.startPrestige}였다.`) },
    {
      label: T('Descendants', '후손'),
      value: T(`${kids} ${kids === 1 ? 'child' : 'children'}, ${grand} ${grand === 1 ? 'grandchild' : 'grandchildren'}`, `자녀 ${kids}명, 손주 ${grand}명`),
      note: kids ? T('Each can carry the line forward.', '누구든 가문을 이어 갈 수 있다.') : T('No one to carry the line.', '대를 이을 이가 없다.'),
    },
    g.player.royal !== 'none'
      ? { label: T('Royal rank', '왕실의 지위'), value: ROYAL_TITLES[g.player.royal] ?? T('—', '—'), note: T('A place in the royal household, held to the end.', '끝까지 지킨 왕실의 자리.') }
      : g.player.legal === 'commoner'
        ? { label: T('Status', '신분'), value: T('Commoner', '평민'), note: T('Noble status was lost and never recovered.', '양반 신분을 잃고 되찾지 못했다.') }
        : o
      ? { label: T('Highest office', '최고 관직'), value: postById(o.post)?.title ?? OFFICES[o.track][o.rank - 1], note: T(`Rank ${o.rank} of 5, ${o.track === 'civil' ? 'civil' : 'military'} service.`, `${o.track === 'civil' ? '문관' : '무관'} ${o.rank}/5단계.`) }
      : { label: T('Royal favour', '왕의 총애'), value: T(String(g.player.favour), String(g.player.favour)), note: g.player.favour >= 50 ? T('The throne remembered the name.', '왕실이 그 이름을 기억했다.') : T('The throne hardly knew the name.', '왕실은 그 이름을 거의 알지 못했다.') },
    {
      label: T('Left to the heirs', '물려준 재산'),
      value: T(`${(g.player.money + g.econ.treasury).toLocaleString('en-US')} nyang, ${g.econ.estates.length} propert${g.econ.estates.length === 1 ? 'y' : 'ies'}`, `${(g.player.money + g.econ.treasury).toLocaleString('en-US')}냥, 재산 ${g.econ.estates.length}곳`),
      note: g.econ.debts.length
        ? T(`With ${g.econ.debts.reduce((n, d) => n + d.principal, 0).toLocaleString('en-US')} nyang of family debt.`, `집안 빚 ${g.econ.debts.reduce((n, d) => n + d.principal, 0).toLocaleString('en-US')}냥과 함께.`)
        : T('The purse, the treasury and the land pass to whoever carries the line.', '주머니와 곳간과 땅은 대를 잇는 이에게 간다.'),
    },
    ...(g.pol.divergence.length ? [{ label: T('History changed', '바뀐 역사'), value: T(`${g.pol.divergence.length} departure${g.pol.divergence.length === 1 ? '' : 's'} from the record`, `기록과 달라진 일 ${g.pol.divergence.length}건`), note: g.pol.divergence[g.pol.divergence.length - 1].text }] : []),
  ];
}

// ---------------------------------------------------------------- heirs

export type Heir = { id: string; npc: Npc; relation: Text; age: number; note: Text; inherit: Text; wait: number };

export function heirsOf(g: Game): Heir[] {
  const year = closingYear(g);
  const list = [...ownChildren(g), ...grandchildren(g)].filter((n) => n.alive && !n.away);
  return list.map((n) => {
    const age = year - n.birthYear;
    const grand = n.kin === 'grandchild';
    const word = n.gender === 'man' ? (grand ? T('Grandson', '손자') : T('Son', '아들')) : grand ? T('Granddaughter', '손녀') : T('Daughter', '딸');
    const sp = n.spouse ? g.npcs[n.spouse] : undefined;
    const marriedOut = n.gender === 'woman' && !!sp;
    const house = marriedOut ? (sp!.house?.surname ?? surnameOf(sp!)) : (n.house?.surname ?? surnameOf(n));
    const wait = Math.max(0, 16 - age);
    const note = wait
      ? T(`Too young to lead the family. The story resumes when ${n.gender === 'man' ? 'he' : 'she'} turns 16.`, `아직 어려 집안을 이끌 수 없다. 열여섯 살이 되면 이야기가 이어진다.`)
      : marriedOut
        ? T(`Married into the ${house.en} family.`, `${ko(house)}씨 집안으로 시집갔다.`)
        : sp
          ? T('Married, with a household of their own.', '혼인하여 제 살림을 꾸렸다.')
          : T('Unmarried. The proposals will begin soon.', '아직 혼인하지 않았다. 곧 혼담이 들어올 것이다.');
    const prestige = marriedOut ? (sp!.house?.prestige ?? 3) : g.marriedInto && g.player.gender === 'woman' ? g.marriedInto.prestige : g.house.prestige;
    const inherit = marriedOut
      ? T(`${n.given?.en ?? n.name.en} belongs to her husband’s family now. You will play in the ${house.en} household, with your mother’s name remembered at court.`,
        `${ko(n.given ?? n.name)}${josa(ko(n.given ?? n.name), '은', '는')} 이제 시집의 사람이다. ${ko(house)}씨 집안에서 이야기가 이어지고, 조정은 어머니의 이름을 기억한다.`)
      : T(`${n.name.en} inherits the ${house.en} house, its standing of ${prestige} of 5, and every grudge the family still holds.`,
        `${ko(n.name)}${josa(ko(n.name), '이', '가')} ${ko(house)}씨 집안과 그 위세 ${prestige}/5, 그리고 집안이 품은 모든 원한을 물려받는다.`);
    return { id: n.id, npc: n, relation: T(`${word.en}, ${age}`, `${ko(word)}, ${age}세`), age, note, inherit, wait };
  });
}

// ---------------------------------------------------------------- the next generation

const FAMILY_FLAGS = ['proposals-open', 'betrothed', 'proposals-wait', 'love-match', 'married-against-wishes', 'match-refused', 'summoned'];

/** Starts the next generation as the chosen heir. The court remembers the family, but at half the warmth. */
export function continueAs(g: Game, heirId: string): Game | null {
  const heir = g.npcs[heirId];
  if (!heir || !heir.alive || g.player.alive) return null;
  const parentId = heir.kin === 'grandchild' ? heir.parents.find((p) => g.npcs[p]?.kin === 'child') : 'player';
  if (!parentId) return null;

  const base = closingYear(g);
  const wait = Math.max(0, 16 - (base - heir.birthYear));
  const year = base + wait;
  const moon = wait ? 1 : g.date.moon;
  const dayCount = g.dayCount + (year - g.date.year) * 360 + 30;
  const generation = g.generation + 1;

  const npcs: Record<string, Npc> = {};
  const rel: Record<string, Rel> = {};
  const put = (id: string, n: Npc, r: Rel) => { npcs[id] = { ...n, id }; rel[id] = r; };
  const prevName = playerName(g);
  const prevWoman = g.player.gender === 'woman';
  const prevSpouse = spouseId(g);
  const heirSpouse = heir.spouse && g.npcs[heir.spouse]?.alive ? heir.spouse : null;
  const marriedOut = heir.gender === 'woman' && !!heirSpouse;

  // The previous player becomes a parent or grandparent of the heir.
  const asNpc = (gender: 'man' | 'woman') => makeNpc({
    id: 'tmp', name: prevName, given: g.player.given, gender, birthYear: g.player.birthYear,
    role: T(`${prevName.en}, ${gender === 'man' ? 'his' : 'her'} life now told in the family record`, `가문의 기록에 남은 ${ko(prevName)}`),
    portrait: playerPortrait(g), alive: false, diedYear: closingYear(g), faction: g.house.faction,
    sees: T('The child who carries the family now.', '이제 가문을 짊어진 자식.'), wants: T('To be remembered at the family rites.', '제사 때 기억되는 것.'),
  });
  if (heir.kin === 'child') {
    put(prevWoman ? 'mother' : 'father', { ...asNpc(g.player.gender), kin: prevWoman ? 'mother' : 'father' }, makeRel(70));
    if (prevSpouse && g.npcs[prevSpouse]) {
      const s = g.npcs[prevSpouse];
      put(prevWoman ? 'father' : 'mother', { ...s, kin: prevWoman ? 'father' : 'mother', spouse: null, places: s.alive ? ['residence'] : [], romance: false, role: s.role }, makeRel(s.alive ? 60 : 50, true));
    }
    for (const [old, now] of [['father', 'grandfather'], ['mother', 'grandmother']] as const) {
      const n = g.npcs[old];
      if (n) put(now, { ...n, kin: now }, makeRel(n.alive ? 40 : 30, true));
    }
    if (g.npcs.sibling) put('uncle', { ...g.npcs.sibling, kin: 'uncle', places: g.npcs.sibling.alive ? ['residence'] : [] }, makeRel(35, true));
    const sibs = ownChildren(g).filter((c) => c.id !== heir.id);
    sibs.forEach((c, i) => put(i === 0 ? 'sibling' : c.id, { ...c, kin: 'sibling', parents: [] }, makeRel(c.alive ? 55 : 40, true)));
  } else {
    // A grandchild: the heir's own parent is the previous player's child.
    const parent = g.npcs[parentId];
    put(prevWoman ? 'grandmother' : 'grandfather', { ...asNpc(g.player.gender), kin: prevWoman ? 'grandmother' : 'grandfather' }, makeRel(65));
    if (prevSpouse && g.npcs[prevSpouse]) put(prevWoman ? 'grandfather' : 'grandmother', { ...g.npcs[prevSpouse], kin: prevWoman ? 'grandfather' : 'grandmother', spouse: null }, makeRel(50, true));
    put(parent.gender === 'man' ? 'father' : 'mother', { ...parent, kin: parent.gender === 'man' ? 'father' : 'mother', spouse: null, parents: [] }, makeRel(60, true));
    const other = parent.spouse ? g.npcs[parent.spouse] : undefined;
    if (other) put(other.gender === 'man' ? 'father' : 'mother', { ...other, kin: other.gender === 'man' ? 'father' : 'mother', spouse: null }, makeRel(55, true));
    const sibs = grandchildren(g).filter((c) => c.id !== heir.id && c.parents.includes(parentId));
    sibs.forEach((c, i) => put(i === 0 ? 'sibling' : c.id, { ...c, kin: 'sibling', parents: [] }, makeRel(55, true)));
  }

  // A daughter who married out lives in her husband's house; her own parents and siblings live elsewhere.
  if (marriedOut) for (const k of Object.keys(npcs)) if (['father', 'mother', 'grandfather', 'grandmother', 'uncle', 'sibling'].includes(npcs[k].kin ?? '')) npcs[k].places = [];

  // The heir's own household.
  if (heirSpouse) {
    const s = g.npcs[heirSpouse];
    put(heirSpouse, { ...s, kin: 'spouse', spouse: 'player', places: ['residence'] }, { ...makeRel(45, true), bond: 'spouse' });
  }
  for (const c of grandchildren(g).filter((c) => c.parents.includes(heir.id))) {
    put(c.id, { ...c, kin: 'child', parents: heirSpouse ? ['player', heirSpouse] : ['player'], role: c.gender === 'man' ? T('Your son', '아들') : T('Your daughter', '딸') }, makeRel(60, true));
  }

  // The court carries on, with the family's old friendships and grudges cooled by half.
  const taken = new Set([heir.id, prevSpouse, heirSpouse, 'king'].filter(Boolean) as string[]);
  for (const n of Object.values(g.npcs)) {
    if (taken.has(n.id) || n.kin || !n.alive || n.away || npcs[n.id]) continue;
    if (n.id.startsWith('in-law-') || n.id.startsWith('child-') || n.id.startsWith('grandchild-')) continue;
    const r = g.rel[n.id];
    if (!r?.met || n.spouse) continue;
    put(n.id, { ...n, romance: false }, { ...makeRel(Math.round(r.regard / 2), true) });
  }
  const king = g.campaign.mode === 'historical' ? rulerNpc(g.campaign, year, moon) : g.npcs.king;
  put('king', king, makeRel(0, g.rel.king?.met ?? false));

  // The heir's house.
  const sp = heirSpouse ? g.npcs[heirSpouse] : undefined;
  const ownHouse = heir.house ?? { surname: surnameOf(heir), prestige: g.house.prestige, faction: g.house.faction, background: g.house.background };
  const fromMarriage = prevWoman && g.marriedInto && heir.kin === 'child';
  const house = {
    background: fromMarriage ? g.marriedInto!.background : g.house.background,
    surname: ownHouse.surname,
    prestige: fromMarriage ? g.marriedInto!.prestige : g.house.prestige,
    wealth: g.house.wealth,
    faction: fromMarriage ? g.marriedInto!.faction : g.house.faction,
  };
  const house0 = house;
  // Children of a king or queen are princes and princesses of the blood.
  const heirRoyal = heir.kin === 'child' && (g.player.royal !== 'none' || g.player.lineage === 'prince') && g.player.legal !== 'commoner';
  const dye = HANBOK[heir.gender];
  const portrait = npcPortrait(g, heir);
  const valid = (s?: string) => !!s && /^#[0-9a-fA-F]{6}$/.test(s);
  const Q = g.player.qualities;
  const lift = (v: number, k: string) => clamp(Math.round(v / 2 + 22 + roll(g, 'heir:' + k) * 8), 20, 70);

  const ancestors = [...g.ancestors, { name: prevName, gender: g.player.gender, born: g.player.birthYear, died: closingYear(g), ending: g.ending ?? 'quiet' }];
  const parentWord = (heir.kin === 'child' ? (prevWoman ? T('mother', '어머니') : T('father', '아버지')) : prevWoman ? T('grandmother', '할머니') : T('grandfather', '할아버지'));
  const next: Game = {
    campaign: g.campaign,
    date: { year, moon, day: 1, phase: 'morning' },
    dayCount,
    seed: g.seed + generation * 7919,
    generation,
    player: {
      surname: ownHouse.surname,
      given: heir.given ?? T(heir.name.en.split(' ').slice(1).join(' ') || heir.name.en),
      gender: heir.gender,
      birthYear: heir.birthYear,
      birthMoon: 1 + ((g.seed + heir.birthYear) % 12),
      colors: { top: valid(portrait.robe) ? portrait.robe! : dye.top[1].hex, bottom: valid(portrait.under) ? portrait.under! : dye.bottom[0].hex },
      qualities: { wit: lift(Q.wit, 'wit'), grace: lift(Q.grace, 'grace'), resolve: lift(Q.resolve, 'resolve') },
      health: year - heir.birthYear >= 45 ? 70 : 82,
      reputation: clamp(Math.round(g.player.reputation / 2 + 25), 10, 80),
      favour: clamp(Math.round(g.player.favour / 4), 0, 30),
      office: null,
      traits: [],
      gifts: ['paper'],
      // The purse passes down, less the funeral; a daughter in another house lives on her husband's means.
      money: marriedOut ? START_MONEY.modest : Math.max(Math.round(g.player.money * 0.8), Math.round(START_MONEY[g.house.wealth] / 8)),
      alive: true,
      diedYear: null,
      attrs: {},
      temper: {},
      edu: {},
      quals: [],
      born: heirRoyal ? 'royal' : 'yangban',
      legal: g.player.legal === 'commoner' ? 'commoner' : heirRoyal ? 'royal' : 'yangban',
      lineage: heirRoyal ? 'prince' : g.player.lineage === 'prince' || g.player.lineage === 'descendant' ? 'descendant' : 'none',
      royal: 'none',
      honour: clamp(Math.round(g.player.honour / 2 + 25), 10, 80),
      legitimacy: heirRoyal ? clamp(Math.round(g.player.legitimacy * 0.6 + 25), 20, 80) : 0,
      service: 0,
      fatigue: 10,
      stress: 20,
      happiness: 50,
      conditions: [],
      skills: {},
      practised: {},
      mourning: { for: prevName, kin: prevWoman ? 'mother' : 'father', until: dayCount + 810, leave: false },
      moodEvent: { kind: 'grieving', until: dayCount + 180 },
      belief: { practice: {}, conviction: 30 },
      works: [],
      pet: g.player.pet,
    },
    notes: [], missions: [], docs: [...g.docs], mail: [], routine: null, milestones: [], scenario: g.scenario && g.scenario.status === 'open' && scenarioById(g.scenario.id)?.heirs ? g.scenario : null,
    lives: [...g.lives, pastLife(g, g.ending ?? null)],
    econ: g.econ,
    pol: {
      ...g.pol,
      side: house0.faction === 'A' || house0.faction === 'B' ? house0.faction : 'neutral',
      standing: Math.round(g.pol.standing / 3),
      vacancies: [], inquiries: [], exile: null, mission: null, state: null,
      downfall: g.pol.downfall ? { ...g.pol.downfall, continued: true, proof: Math.round(g.pol.downfall.proof / 2), appeals: 0 } : null,
    },
    house,
    marriedInto: marriedOut && sp ? (sp.house ?? { surname: surnameOf(sp), prestige: 3, faction: sp.faction, background: 'noble' }) : null,
    startPrestige: house.prestige,
    npcs,
    rel,
    flags: Object.fromEntries(Object.entries(g.flags).filter(([k]) => !FAMILY_FLAGS.includes(k))),
    flagDays: Object.fromEntries(Object.entries(g.flagDays).filter(([k]) => k === 'heir-range' || k === 'gqd-from')),
    place: 'residence',
    done: [],
    log: [
      { year: heir.birthYear, moon: 3, text: T(`Born to the ${ownHouse.surname.en} family.`, `${ko(ownHouse.surname)}씨 집안에서 태어났다.`) },
      { year: closingYear(g), moon: g.date.moon, text: T(`Your ${parentWord.en}, ${prevName.en}, died.`, `${ko(parentWord)} ${ko(prevName)}께서 세상을 떠나셨다.`) },
      ...(sp ? [{ year: Math.min(year, heir.birthYear + 20), moon: 4, text: T(`Married ${sp.name.en}.`, `${ko(sp.name)}${josa(ko(sp.name), '과', '와')} 혼인했다.`) }] : []),
    ],
    proposals: [],
    favoured: null,
    letter: null,
    active: null,
    report: {
      title: T(`The ${ordinal(generation)} generation`, `${generation}대`),
      entries: [
        T(`You are ${heir.name.en}, ${heir.gender === 'man' ? 'son' : 'daughter'} of the ${ownHouse.surname.en} house. ${prevName.en}’s story is now yours to continue.`,
          `당신은 ${ko(ownHouse.surname)}씨 집안의 ${heir.gender === 'man' ? '아들' : '딸'} ${ko(heir.name)}이다. ${ko(prevName)}의 이야기를 이제 당신이 잇는다.`),
        ...(wait ? [T(`The family waited ${numberWord(wait)} ${wait === 1 ? 'year' : 'years'} for you to come of age.`, `집안은 당신이 장성하기를 ${wait}년 동안 기다렸다.`)] : []),
      ],
    },
    queued: null,
    seen: g.seen,
    ancestors,
    ending: null,
    achieved: [],
    counts: {},
  };
  // The heir's own education and attributes, and the household that passes down (GSDD Part III §10).
  const NP = next.player;
  NP.attrs = makeAttrs((k) => roll(g, 'heir-attr:' + k), NP.qualities, { background: house.background, gender: NP.gender, age: year - heir.birthYear, traits: [] });
  for (const t of TEMPERS) NP.temper[t.id] = Math.round((roll(g, 'heir-temper:' + t.id) - 0.5) * 3);
  const yrs = Math.max(0, year - heir.birthYear - 5);
  for (const fl of EDU_FIELDS) NP.edu[fl.id] = Math.min(55, Math.round(yrs * (1.2 + roll(g, 'heir-edu:' + fl.id))));
  NP.edu._focus = 0;
  applyUpbringing(heir, NP);
  syncQualities(NP);
  next.econ = structuredClone(g.econ);
  next.econ.debts = next.econ.debts.filter((d) => d.acct === 'house');
  next.econ.businesses = next.econ.businesses.map((b) => ({ ...b, owner: 'house' }));
  if (marriedOut) marryInto(next, sp?.house?.prestige ?? 3);
  next.pol.divergence = [...g.pol.divergence];
  next.pol.rulers = [...g.pol.rulers];
  if (g.player.royal === 'king') {
    const named = g.pol.state?.heir;
    const eldestSon = ownChildren(g).filter((c) => c.alive && c.gender === 'man').sort((a, b) => a.birthYear - b.birthYear)[0];
    if (heir.id === named || (!named && heir.id === eldestSon?.id)) {
      next.player.royal = 'king';
      next.player.legal = 'royal';
      next.pol.rulers.push({ from: dateKey(next.date), title: T(`King ${NP.given.en}`, `${NP.given.ko ?? NP.given.en} 임금`), born: NP.birthYear, player: true });
      next.pol.state = initState(next, null);
      if (next.npcs.king) { next.npcs.king.alive = false; next.npcs.king.away = true; }
      next.place = 'throne-hall';
    } else {
      next.pol.rulers.push({ from: dateKey(next.date), title: T('a prince of the royal clan', '종친 가운데 한 군'), born: year - 25, player: false });
    }
  }
  ensureCourt(next);
  next.econ.role = econRole(next);
  return next;
}

/** For the legacy screen: how old a person was when the life closed. */
export const ageAt = (g: Game, n: Npc) => closingYear(g) - n.birthYear;
export const lifeAge = (g: Game) => (g.player.alive ? playerAge(g) : ageAtDeath(g));
export { npcAge };

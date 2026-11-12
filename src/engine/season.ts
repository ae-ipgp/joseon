import type { Game, Gender, HouseRef, Npc, Text } from '../model/schemas';
import { ALT_HISTORY, HISTORY, KINGS, reignIndex } from '../content/history';
import { makeNpc, makeRel, plainPortrait, rulerNpc } from '../content/cast';
import { GIVEN_NAMES, HANBOK, MATCH_SURNAMES } from '../content/families';
import { makeProposals } from './effects';
import { settleSeason, spend } from './money';
import { ageing, seasonStudy } from './character';
import { settleEcon } from './econ';
import { diverged, politicsSeason, reignChanged } from './politics';
import { justiceSeason } from './justice';
import { historySeason, silenced } from './chronicle2';
import { missionsSeason } from './missions';
import { npcSeason } from './social';
import { mortalityMul } from './difficulty';
import { feel, illnessRisk, inMourning, lifeSeason, startMourning } from './life';
import { memoSeason } from './reign';
import { cultureSeason } from './culture';
import { certificate, emit } from './bus';
import { royalPresence, royalSuccession, succeedPost } from './royals';
import { ROYAL_IDS } from '../content/court';
import { findSeason } from './events';
import { T, josa } from './text';
import { SEASONS, dateKey, playerAge, seasonOf, seasonStart, seasonYear } from './time';
import { betrothedId, childrensHouse, clamp, clone, livingSpouse, npcAge, playerName, roll, spouseId } from './world';

type Say = (t: Text, record?: boolean, historical?: boolean) => void;

const full = (surname: Text, given: Text): Text => T(`${surname.en} ${given.en}`, `${surname.ko ?? surname.en}${given.ko ?? given.en}`);
const ko = (t: Text) => t.ko ?? t.en;

/** The family name of someone who has no house on record, read from their name. */
export function surnameOf(n: Npc): Text {
  if (n.house) return n.house.surname;
  const en = n.name.en.replace(/^(Court Lady|Lady|Minister|General|Captain)\s+/, '').split(' ')[0];
  const k = (n.name.ko ?? '').replace(/\s.*$/, '');
  return T(en, k ? k.slice(0, 1) : undefined);
}
const houseOf = (n: Npc): HouseRef => n.house ?? { surname: surnameOf(n), prestige: 3, faction: n.faction, background: 'noble' };

// ---------------------------------------------------------------- one season

/**
 * Everything that happens when a new season begins: history, the throne, marriages,
 * births, deaths, promotions and the player's health. Works on `g` in place and leaves a report.
 */
export function processSeason(g: Game, from: { year: number; moon: number; day?: number }) {
  const entries: Text[] = [];
  const say: Say = (t, record = false, historical = false) => {
    entries.push(t);
    if (record) g.log.push({ year: g.date.year, moon: g.date.moon, text: t, ...(historical ? { historical: true } : {}) });
  };
  g.place = 'residence';
  g.date.phase = 'morning';
  g.done = [];
  if (seasonOf(g.date.moon) === 0) g.flags['proposals-wait'] = false;

  if (g.player.alive) {
    chronicle(g, from, say);
    historySeason(g, from, say);
    throne(g, from, say);
    royalPresence(g, (t) => say(t, true));
    matches(g, say);
    household(g, say);
    mortality(g, say);
    ageing(g, say);
    seasonStudy(g, say);
    politicsSeason(g, say);
    memoSeason(g, say);
    justiceSeason(g, say);
    missionsSeason(g, say);
    npcSeason(g, say);
    settleEcon(g, say);
    for (const t of settleSeason(g)) say(t);
    lifeSeason(g, say);
    cultureSeason(g, say);
    body(g, say);
    if (g.flags.condemned && g.player.alive) {
      g.ending = 'condemned';
      die(g, say);
    }
  }
  g.report = { title: seasonYear(g), entries };
  if (g.player.alive) {
    const e = findSeason(g);
    if (e) {
      g.queued = e.id;
      g.seen[e.id] = g.date.year;
    }
  }
}

export const canPass = (g: Game) => g.player.alive && !g.active && !g.letter && !g.report;

/**
 * Lets time pass to the start of the next season, or several. Stops early when the story
 * needs the player or the life ends. All the seasons' news goes into one report.
 */
export function passTime(g0: Game, seasons = 1): Game {
  if (!canPass(g0)) return g0;
  const g = clone(g0);
  const all: Text[] = [];
  let first: Text | null = null;
  let last: Text | null = null;
  let count = 0;
  for (let i = 0; i < seasons; i++) {
    const from = { ...g.date };
    const s = seasonOf(g.date.moon);
    const next = s === 3 ? { year: g.date.year + 1, moon: 1 } : { year: g.date.year, moon: seasonStart(s + 1) };
    g.dayCount += Math.max(1, dateKey(next) - dateKey(g.date));
    g.date = { year: next.year, moon: next.moon, day: 1, phase: 'morning' };
    processSeason(g, from);
    const r = g.report!;
    g.report = null;
    count++;
    first = first ?? r.title;
    last = r.title;
    const sn = SEASONS[seasonOf(g.date.moon)];
    all.push(...(seasons > 1 ? r.entries.map((e) => T(`${sn.en}: ${e.en}`, `${ko(sn)}: ${ko(e)}`)) : r.entries));
    if (!g.player.alive || g.queued) break;
  }
  const title = count > 1 && first && last
    ? T(`From ${first.en.charAt(0).toLowerCase()}${first.en.slice(1)} to ${last.en.charAt(0).toLowerCase()}${last.en.slice(1)}`, `${ko(first)}부터 ${ko(last)}까지`)
    : (last ?? seasonYear(g));
  g.report = { title, entries: all };
  return g;
}

// ---------------------------------------------------------------- history and the throne

function chronicle(g: Game, from: { year: number; moon: number; day?: number }, say: Say) {
  const a = dateKey(from);
  const b = dateKey(g.date);
  const within = (year: number, moon: number) => {
    const k = dateKey({ year, moon });
    return k > a && k <= b;
  };
  if (g.campaign.mode === 'historical') {
    for (const h of HISTORY) if (within(h.year, h.moon) && !silenced(g, h.year, h.moon)) say(h.text, true, true);
  } else if (g.campaign.premise) {
    for (const h of ALT_HISTORY[g.campaign.premise]) if (within(g.campaign.era + h.after, h.moon)) say(h.text, true, true);
  }
}

/** How each reign ended, where it did not end with the king's death. */
const REIGN_END: Record<string, 'abdicated' | 'deposed'> = {
  'King Taejo': 'abdicated', 'King Jeongjong': 'abdicated', 'King Taejong': 'abdicated', 'King Danjong': 'deposed',
  Yeonsangun: 'deposed', Gwanghaegun: 'deposed',
};

function throne(g: Game, from: { year: number; moon: number }, say: Say) {
  if (g.campaign.mode !== 'historical' || diverged(g)) return;
  const before = reignIndex(from.year, from.moon);
  const now = reignIndex(g.date.year, g.date.moon);
  if (now === before) return;
  // The player as heir takes the throne instead of the recorded king: history changes here.
  if (g.player.royal === 'crownPrince' && g.player.alive) {
    reignChanged(g, say);
    return;
  }
  const playerRole = g.player.royal;
  for (let i = before; i < now; i++) {
    const old = KINGS[i].title;
    const next = KINGS[i + 1].title;
    const how = REIGN_END[old.en];
    const en = how === 'abdicated' ? `${old.en} gave up the throne. ${next.en} now reigns.`
      : how === 'deposed' ? `${old.en} was deposed. ${next.en} now reigns.`
        : `${old.en} died. ${next.en} now reigns.`;
    const k = how === 'abdicated' ? `${ko(old)}께서 왕위를 물려주셨다. 이제 ${ko(next)}께서 다스리신다.`
      : how === 'deposed' ? `${ko(old)}이 폐위되었다. 이제 ${ko(next)}께서 다스리신다.`
        : `${ko(old)}께서 승하하셨다. 이제 ${ko(next)}께서 다스리신다.`;
    say(T(en, k), true, true);
  }
  const met = g.rel.king?.met ?? false;
  g.npcs.king = rulerNpc(g.campaign, g.date.year, g.date.moon);
  g.rel.king = makeRel(0, met);
  g.player.favour = Math.round(g.player.favour / 2);
  royalSuccession(g, playerRole);
  if (playerRole === 'crownPrincess') {
    // Her husband, the crown prince, is the new king.
    const cp = g.npcs['crown-prince'];
    if (cp) {
      g.rel.king = { ...(g.rel['crown-prince'] ?? g.rel.king), bond: 'spouse', met: true };
      g.npcs.king.spouse = 'player';
      g.npcs.king.birthYear = cp.birthYear;
      cp.away = true;
      cp.spouse = null;
      g.rel['crown-prince'] = { ...g.rel['crown-prince'], bond: 'none' };
    }
  }
  reignChanged(g, say);
}

// ---------------------------------------------------------------- marriage

const APPROVAL_SCORE = { for: 2, undecided: 0, against: -2 } as const;

function matches(g: Game, say: Say) {
  // No weddings and no matchmaking while in mourning (GSDD Part VIII §12).
  if (inMourning(g)) {
    if (g.flags.betrothed && !g.flags['wedding-waits']) {
      g.flags['wedding-waits'] = true;
      say(T('The wedding must wait until the mourning ends.', '혼례는 상이 끝날 때까지 미룬다.'));
    }
    return;
  }
  g.flags['wedding-waits'] = false;
  if (g.flags.betrothed) {
    const id = betrothedId(g);
    const n = id ? g.npcs[id] : undefined;
    if (!id || !n || !n.alive || n.away) {
      g.flags.betrothed = false;
      if (id && g.rel[id]) g.rel[id].bond = 'none';
      say(T('The betrothal ended before the wedding. Your family will look again.', '혼례를 올리기 전에 정혼이 깨졌다. 집안이 다시 혼처를 찾을 것이다.'), true);
      return;
    }
    if (g.dayCount - (g.flagDays.betrothed ?? g.dayCount) >= 60) wed(g, id, say);
    return;
  }
  if (spouseId(g)) return;
  const limit = g.player.gender === 'woman' ? 23 : 27;
  if (!g.flags['proposals-open'] && g.flags['proposals-wait'] && playerAge(g) >= limit && !g.flags['family-insists']) {
    g.flags['family-insists'] = true;
    g.flags['proposals-wait'] = false;
    g.proposals = makeProposals(g);
    g.favoured = null;
    g.flags['proposals-open'] = true;
    g.flagDays['proposals-open'] = g.dayCount;
    say(T('Your family will not wait any longer. The matchmaker has brought new names; choose one on your Family page, or they will choose for you.',
      '집안은 더는 기다리지 않겠다고 한다. 중매쟁이가 새 혼처를 가져왔다. 가문 화면에서 고르지 않으면 집안이 정할 것이다.'), true);
    return;
  }
  if (!g.flags['proposals-open']) return;
  const opened = g.flagDays['proposals-open'] ?? g.dayCount;
  const live = g.proposals.filter((p) => g.npcs[p.npc]?.alive && !g.npcs[p.npc]?.away);
  const fav = live.find((p) => p.npc === g.favoured);
  const parents = ['father', 'mother'].filter((k) => g.npcs[k]?.alive && !g.npcs[k]?.away);
  if (fav) {
    const refused = parents.length > 0 && parents.every((k) => fav[k as 'father' | 'mother'] === 'against');
    if (!refused) return betroth(g, fav.npc, say, false);
    const n = g.npcs[fav.npc];
    if (g.player.qualities.resolve >= 50) {
      for (const k of parents) if (g.rel[k]) g.rel[k].regard = clamp(g.rel[k].regard - 10, -100, 100);
      g.player.reputation = clamp(g.player.reputation - 3, 0, 100);
      say(T(`Your parents refused the match with ${n.name.en}. You would not give way, and in the end they did.`,
        `부모님은 ${ko(n.name)}${josa(ko(n.name), '과', '와')}의 혼인을 반대하셨다. 당신이 물러서지 않자 끝내 부모님이 물러서셨다.`));
      return betroth(g, fav.npc, say, true);
    }
    if (!g.flags['match-refused']) {
      g.flags['match-refused'] = true;
      say(T(`Your parents refused the match with ${n.name.en}. Unless you change their minds, they will choose for you.`,
        `부모님은 ${ko(n.name)}${josa(ko(n.name), '과', '와')}의 혼인을 반대하셨다. 마음을 돌리지 못하면 부모님이 혼처를 정하실 것이다.`));
      return;
    }
  }
  if (g.dayCount - opened < 150 || !live.length) return;
  const score = (p: (typeof live)[number]) => (parents.includes('father') ? APPROVAL_SCORE[p.father] : 0) + (parents.includes('mother') ? APPROVAL_SCORE[p.mother] / 2 : 0);
  const pick = [...live].sort((a, b) => score(b) - score(a))[0];
  say(T('You did not choose, so your family chose for you.', '당신이 고르지 않자 집안이 혼처를 정했다.'));
  betroth(g, pick.npc, say, false);
}

function betroth(g: Game, id: string, say: Say, insisted: boolean) {
  const n = g.npcs[id];
  const r = g.rel[id];
  if (!n || !r) return;
  if (r.bond === 'lover') g.flags['love-match'] = true;
  r.bond = 'betrothed';
  r.met = true;
  g.flags.betrothed = true;
  g.flagDays.betrothed = g.dayCount;
  g.flags['proposals-open'] = false;
  g.flags['match-refused'] = false;
  if (insisted) g.flags['married-against-wishes'] = true;
  g.proposals = [];
  g.favoured = null;
  say(T(`You are betrothed to ${n.name.en}. The wedding will be held next season.`, `${ko(n.name)}${josa(ko(n.name), '과', '와')} 정혼했다. 혼례는 다음 철에 치른다.`), true);
}

function wed(g: Game, id: string, say: Say) {
  const n = g.npcs[id];
  const r = g.rel[id];
  r.bond = 'spouse';
  r.regard = Math.max(r.regard, 30);
  g.flags.betrothed = false;
  n.spouse = 'player';
  n.kin = 'spouse';
  n.places = ['residence'];
  n.giftable = true;
  if (g.player.gender === 'woman') {
    g.marriedInto = houseOf(n);
    n.house = g.marriedInto;
  }
  r.moments.push({ year: g.date.year, moon: g.date.moon, text: T('Your wedding day.', '혼례를 올린 날.') });
  const love = g.flags['love-match'];
  const against = g.flags['married-against-wishes'];
  // Gifts, the wedding feast and, for a bride, her trousseau.
  const paid = spend(g, 80 + 30 * g.house.prestige);
  if (paid) say(T(`The wedding cost the household ${paid} nyang.`, `혼례에 ${paid}냥이 들었다.`));
  say(T(`Married ${n.name.en}${against ? ', against your parents’ wishes' : ''}.${love ? ' A match of the heart.' : ''}`,
    `${ko(n.name)}${josa(ko(n.name), '과', '와')} 혼례를 올렸다${against ? '. 부모님의 뜻을 거스른 혼인이었다' : ''}.${love ? ' 마음으로 맺은 혼인이다.' : ''}`), true);
  emit(g, { type: 'MARRIAGE_REGISTERED', npc: n.id, text: T(`Married ${n.name.en}.`, `${ko(n.name)}와(과) 혼인했다.`), doc: { title: T('Marriage letter (honseo)', '혼서'), body: certificate(g, T(`Joined in marriage with ${n.name.en}, with the consent of both houses.`, `양가의 허락으로 ${ko(n.name)}와(과) 혼인함.`)) } });
  if (g.player.gender === 'woman' && g.marriedInto) {
    const s = g.marriedInto.surname;
    say(T(`You have moved into the ${s.en} household. Your children will carry the ${s.en} name.`, `${ko(s)}씨 집안으로 시집갔다. 아이들은 ${ko(s)}씨 성을 잇는다.`));
  }
}

// ---------------------------------------------------------------- children and grandchildren

function pickName(g: Game, gender: Gender, key: string): Text {
  const used = new Set(Object.values(g.npcs).map((n) => n.given?.en));
  const pool = GIVEN_NAMES[gender].filter((x) => !used.has(x.en));
  const list = pool.length ? pool : GIVEN_NAMES[gender];
  return list[Math.floor(roll(g, key) * list.length)];
}

function bornTo(g: Game, kin: 'child' | 'grandchild', parents: string[], house: { surname: Text; prestige: number }, key: string): Npc {
  const gender: Gender = roll(g, key + ':g') < 0.5 ? 'man' : 'woman';
  const given = pickName(g, gender, key + ':n');
  const id = `${kin}-${g.generation}-${g.dayCount}-${key.length}`;
  const n = makeNpc({
    id, name: full(house.surname, given), given, gender, birthYear: g.date.year,
    role: kin === 'child' ? (gender === 'man' ? T('Your son', '아들') : T('Your daughter', '딸')) : gender === 'man' ? T('Your grandson', '손자') : T('Your granddaughter', '손녀'),
    portrait: plainPortrait(gender, 0), kin, parents, places: ['residence'], faction: g.house.faction, likes: [['poems', 'fan', 'pouch', 'paper'][Math.floor(roll(g, key + ':l') * 4)]],
    house: { surname: house.surname, prestige: house.prestige, faction: g.house.faction, background: g.house.background },
    sees: kin === 'child' ? T('The parent whose name they carry.', '자기 이름의 뿌리가 되는 부모.') : T('A grandparent full of stories.', '이야기가 많은 할아버지 할머니.'),
    wants: T('To be noticed, and to make the family proud.', '눈에 띄고, 집안을 자랑스럽게 하는 것.'),
  });
  g.npcs[id] = n;
  g.rel[id] = makeRel(kin === 'child' ? 60 : 50, true);
  return n;
}

function household(g: Game, say: Say) {
  const sp = livingSpouse(g);
  const woman = g.player.gender === 'woman';
  const own = Object.values(g.npcs).filter((n) => n.kin === 'child' && n.parents.includes('player'));
  if (sp) {
    const motherAge = woman ? playerAge(g) : npcAge(g, sp);
    const sinceLast = g.dayCount - (g.flagDays['last-birth'] ?? -9999);
    const married = g.dayCount - (g.flagDays.betrothed ?? 0);
    if (motherAge >= 17 && motherAge <= 38 && own.length < 5 && sinceLast >= 360 && married >= 120 && roll(g, 'birth') < (own.length ? 0.07 : 0.25)) {
      const c = bornTo(g, 'child', ['player', sp.id], childrensHouse(g), 'birth');
      g.flagDays['last-birth'] = g.dayCount;
      const word = c.gender === 'man' ? T('son', '아들') : T('daughter', '딸');
      say(T(`Your ${word.en}, ${c.name.en}, was born.`, `${word.ko} ${ko(c.name)}${josa(ko(c.name), '이', '가')} 태어났다.`), true);
      emit(g, { type: 'CHILD_BORN', npc: sp.id, text: T(`Your ${word.en}, ${c.name.en}, was born.`, `${word.ko} ${ko(c.name)}이(가) 태어났다.`) });
      g.rel[sp.id].regard = clamp(g.rel[sp.id].regard + 5, -100, 100);
      g.rel[sp.id].moments.push({ year: g.date.year, moon: g.date.moon, text: T(`${c.name.en} was born.`, `${ko(c.name)}${josa(ko(c.name), '이', '가')} 태어났다.`) });
    }
  }

  // Grown children marry; sons bring their wives home, daughters marry out.
  for (const c of Object.values(g.npcs)) {
    if (c.kin !== 'child' || !c.alive || c.spouse) continue;
    const age = npcAge(g, c);
    if (age < (c.gender === 'man' ? 21 : 18) || roll(g, 'wed:' + c.id) >= 0.3) continue;
    const fam = MATCH_SURNAMES[Math.floor(roll(g, 'wedfam:' + c.id) * MATCH_SURNAMES.length)];
    const want: Gender = c.gender === 'man' ? 'woman' : 'man';
    const given = pickName(g, want, 'wedname:' + c.id);
    const dye = HANBOK[want];
    const colors = { top: dye.top[Math.floor(roll(g, 'wtop:' + c.id) * dye.top.length)].hex, bottom: dye.bottom[Math.floor(roll(g, 'wbot:' + c.id) * dye.bottom.length)].hex };
    const id = `in-law-${c.id}`;
    const spAge = clamp(age + (want === 'man' ? 3 : -2), 16, 40);
    g.npcs[id] = makeNpc({
      id, name: full(fam.surname, given), given, gender: want, birthYear: g.date.year - spAge,
      role: c.gender === 'man' ? T(`${c.given?.en ?? ''}’s wife`, `${ko(c.given ?? c.name)}의 아내`) : T(`${c.given?.en ?? ''}’s husband`, `${ko(c.given ?? c.name)}의 남편`),
      portrait: plainPortrait(want, spAge, colors), faction: fam.faction, spouse: c.id, places: c.gender === 'man' ? ['residence'] : [],
      house: { surname: fam.surname, prestige: fam.prestige, faction: fam.faction, background: 'noble' },
      sees: T('The family they married into.', '시집 또는 처가가 된 집안.'), wants: T('A peaceful house.', '평안한 집안.'),
    });
    g.rel[id] = makeRel(30, true);
    c.spouse = id;
    if (c.gender === 'woman') {
      c.places = [];
      c.role = T(`Your daughter, married into the ${fam.surname.en} family`, `${ko(fam.surname)}씨 집안으로 시집간 딸`);
      say(T(`Your daughter ${c.given?.en} married into the ${fam.surname.en} family.`, `딸 ${ko(c.given ?? c.name)}${josa(ko(c.given ?? c.name), '이', '가')} ${ko(fam.surname)}씨 집안으로 시집갔다.`), true);
    } else {
      say(T(`Your son ${c.given?.en} married ${g.npcs[id].name.en}.`, `아들 ${ko(c.given ?? c.name)}${josa(ko(c.given ?? c.name), '이', '가')} ${ko(g.npcs[id].name)}${josa(ko(g.npcs[id].name), '과', '와')} 혼인했다.`), true);
    }
  }

  // Sons' children are born into the house.
  for (const c of Object.values(g.npcs)) {
    if (c.kin !== 'child' || !c.alive || c.gender !== 'man' || !c.spouse) continue;
    const w = g.npcs[c.spouse];
    if (!w?.alive || npcAge(g, w) > 40) continue;
    const kids = Object.values(g.npcs).filter((n) => n.parents.includes(c.id));
    const since = g.dayCount - (g.flagDays['grand:' + c.id] ?? -9999);
    if (kids.length >= 3 || since < 360 || roll(g, 'grand:' + c.id) >= 0.18) continue;
    const gc = bornTo(g, 'grandchild', [c.id, w.id], { surname: c.house?.surname ?? surnameOf(c), prestige: c.house?.prestige ?? g.house.prestige }, 'grand:' + c.id);
    g.flagDays['grand:' + c.id] = g.dayCount;
    const word = gc.gender === 'man' ? T('grandson', '손자') : T('granddaughter', '손녀');
    say(T(`Your ${word.en}, ${gc.name.en}, was born to ${c.given?.en}.`, `${ko(c.given ?? c.name)}에게서 ${word.ko} ${ko(gc.name)}${josa(ko(gc.name), '이', '가')} 태어났다.`), true);
  }
}

// ---------------------------------------------------------------- deaths

/** Chance of dying in one season at a given age. */
export const seasonalRisk = (age: number) => (age < 50 ? 0.0015 : Math.min(0.3, 0.004 * Math.pow(1.1, age - 50)));

function mortality(g: Game, say: Say) {
  // The first generation's court is safe for its first two years, so the opening story can play out.
  if (g.generation === 1 && g.dayCount < 720) return;
  for (const n of Object.values(g.npcs)) {
    if (!n.alive || n.id === 'king' || n.away || ROYAL_IDS.includes(n.id)) continue;
    const age = npcAge(g, n);
    if (age < 40 || roll(g, 'death:' + n.id) >= seasonalRisk(age) * mortalityMul(g)) continue;
    n.alive = false;
    n.diedYear = g.date.year;
    n.places = [];
    const r = g.rel[n.id];
    if (n.post) {
      const metThem = !!r?.met;
      const news = succeedPost(g, n);
      if (metThem) say(T(`${n.name.en} died, aged ${age}.`, `${ko(n.name)}${josa(ko(n.name), '이', '가')} ${age}세로 세상을 떠났다.`), true);
      if (news && metThem) say(news);
      if (news) continue;
    }
    if (r?.bond === 'betrothed') {
      g.flags.betrothed = false;
      r.bond = 'none';
    }
    if (n.spouse === 'player') {
      say(T(`${n.gender === 'man' ? 'Your husband' : 'Your wife'}, ${n.name.en}, died. The house is in mourning.`,
        `${n.gender === 'man' ? '남편' : '아내'} ${ko(n.name)}${josa(ko(n.name), '이', '가')} 세상을 떠났다. 온 집안이 상을 치른다.`), true);
      startMourning(g, n, say);
      continue;
    }
    if (!n.kin && !r?.met) continue;
    const mourn = n.kin === 'father' || n.kin === 'mother';
    if (mourn) spend(g, 60);
    say(T(`${n.name.en} died, aged ${age}.${mourn ? ' The mourning will last twenty-seven months.' : ''}`,
      `${ko(n.name)}${josa(ko(n.name), '이', '가')} ${age}세로 세상을 떠났다.${mourn ? ' 삼년상을 치른다.' : ''}`), true);
    if (mourn) startMourning(g, n, say);
    else if (n.kin === 'child' || n.kin === 'grandchild') feel(g, 'grieving', -22, 240);
    else if (n.kin) feel(g, 'grieving', -8, 60);
    else if ((r?.regard ?? 0) >= 50) feel(g, null, -4);
  }
}

// ---------------------------------------------------------------- office

// ---------------------------------------------------------------- the player's health and death

function body(g: Game, say: Say) {
  const P = g.player;
  const age = playerAge(g);
  if (seasonOf(g.date.moon) === 0) {
    const fall = age >= 70 ? 6 : age >= 60 ? 4 : age >= 45 ? 2 : 0;
    if (fall) P.health = clamp(P.health - fall, 0, 100);
    else if (P.health < 80) P.health = clamp(P.health + 3, 0, 100);
  }
  // Illness is now a list of named conditions (engine/life.ts); grave ones add to the risk at any age.
  const risk = (age < 45 ? 0 : seasonalRisk(age) * clamp((110 - P.health) / 50, 0.4, 2.2) * mortalityMul(g)) + illnessRisk(g);
  if (P.health <= 0 || roll(g, 'mortal') < risk) die(g, say);
}

export function die(g: Game, say?: Say) {
  const P = g.player;
  P.alive = false;
  P.diedYear = g.date.year;
  g.ending = g.ending ?? endingFor(g);
  const age = playerAge(g);
  const where = g.marriedInto ? T(`in the ${g.marriedInto.surname.en} house`, `${ko(g.marriedInto.surname)}씨 댁에서`) : T('at home', '집에서');
  const t = T(`Died ${where.en}, aged ${age}.`, `${ko(where)} ${age}세로 세상을 떠났다.`);
  if (say) say(t, true);
  else g.log.push({ year: g.date.year, moon: g.date.moon, text: t });
}

/** Which ending a life earned, judged at its close. */
export function endingFor(g: Game): string {
  if (g.ending) return g.ending;
  const sp = spouseId(g);
  const P = g.player;
  if (P.legal === 'commoner') return g.flags.avenged ? 'avenged' : 'commoner';
  if (P.royal === 'king' || g.counts.reigned) return 'monarch';
  if (P.royal === 'regent' || g.log.some((l) => l.tag === 'court' && l.text.en.startsWith('Began to rule'))) return 'regent';
  if (P.royal === 'queen' || P.royal === 'queenDowager') return 'consort';
  if (g.flags.restored) return 'restored';
  if (P.office?.track === 'civil' && P.office.rank >= 5) return 'statesman';
  if (P.office?.track === 'military' && P.office.rank >= 4 && (g.counts.victories ?? 0) > 0) return 'general';
  if ((g.counts.businesses ?? 0) > 0 && g.econ.treasury + P.money >= 6000) return 'merchant';
  if (g.campaign.mode === 'historical' && g.date.year >= 1897) return 'dynasty';
  if (g.flags['letter-burned'] && (g.flags['secret-with-kang'] || sp === 'kang')) return 'keeper';
  if (g.player.favour >= 70) return 'favourite';
  if (g.player.traits.includes('loyal') && g.player.favour >= 40) return 'loyal';
  if (g.flags['love-match']) return 'heart';
  if (g.house.prestige > g.startPrestige || (g.player.office?.rank ?? 0) >= 4) return 'house';
  return 'quiet';
}

/** For reports and the record. */
export const lifeName = (g: Game) => playerName(g);

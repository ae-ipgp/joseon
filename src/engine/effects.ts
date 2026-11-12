import { feel } from './life';
import { givePet } from './culture';
import { conditionById, skillById, type Emotion } from '../content/life';
import type { Effect } from '../model/content';
import { bumpAttr, bumpQuality, examBar, examChance, qualName, study } from './character';
import { attrById } from '../content/attributes';
import { battle, diverge, dominant, serve, startMission, takeRegency } from './politics';
import { openInquiry, punish, restore } from './justice';
import { missionsFor, postsFor } from '../content/government';
import { marryInto } from './econ';
import type { Game, Gender, Npc, Proposal, Text } from '../model/schemas';
import { GIFTS, MAX_GIFTS, OFFICES, QUALITY_NAMES, STAT_NAMES, TRAITS, giftName } from '../content/lists';
import { GIVEN_NAMES, HANBOK, MATCH_SURNAMES } from '../content/families';
import { makeNpc, makeRel, plainPortrait } from '../content/cast';
import { check } from './conditions';
import { T, josa, signed } from './text';
import { playerAge } from './time';
import { clamp, clone, npcAge, roll } from './world';
import { spend } from './money';
import { certificate, emit } from './bus';
import { recordDivergence } from './chronicle2';

/** Applies effects to a game in place and returns what the player should be told. */
export function applyInPlace(g: Game, effects: Effect[]): Text[] {
  const notes: Text[] = [];
  for (const e of effects) {
    if (e.when && !check(e.when, g)) continue;
    switch (e.kind) {
      case 'edu': notes.push(study(g, e.field, e.d)); break;
      case 'attr': {
        bumpAttr(g.player, e.a, e.d);
        const n = attrById(e.a)?.name ?? T(e.a);
        notes.push(T(`${n.en} ${signed(e.d)}`, `${n.ko} ${signed(e.d)}`));
        break;
      }
      case 'honour': g.player.honour = clamp(g.player.honour + e.d, 0, 100); notes.push(T(`Honour ${signed(e.d)}`, `명예 ${signed(e.d)}`)); break;
      case 'legitimacy': g.player.legitimacy = clamp(g.player.legitimacy + e.d, 0, 100); notes.push(T(`Legitimacy ${signed(e.d)}`, `정통성 ${signed(e.d)}`)); break;
      case 'service': serve(g, e.d); break;
      case 'standing':
        if (g.pol.side !== 'neutral') { g.pol.standing = clamp(g.pol.standing + e.d, 0, 100); notes.push(T(`Standing in your faction ${signed(e.d)}`, `당내 입지 ${signed(e.d)}`)); }
        break;
      case 'influence': {
        const side = e.side === 'mine' ? (g.pol.side === 'neutral' ? null : g.pol.side) : e.side;
        if (side) g.pol.inf[side] = clamp(g.pol.inf[side] + e.d, 5, 95);
        break;
      }
      case 'diverge':
        if (!g.flags[e.flag]) {
          g.flags[e.flag] = true;
          recordDivergence(g, e.cls, e.recorded, e.instead);
          notes.push(T(`History has changed: ${e.instead.en}`, `역사가 바뀌었다: ${e.instead.ko}`));
        }
        break;
      case 'qual':
        if (!g.player.quals.includes(e.id)) {
          g.player.quals.push(e.id);
          notes.push(qualName(e.id));
          if (e.id === 'sogwa') emit(g, { type: 'EXAM_PASSED', text: qualName(e.id), doc: { title: T('Certificate of the lesser examination (baekpae)', '백패 (소과 합격증)'), body: certificate(g, T('Passed the lesser examination and is enrolled as a licentiate.', '소과에 합격하여 생원이 됨.')) } });
        }
        break;
      case 'treasury': g.econ.treasury = Math.max(0, g.econ.treasury + e.d); notes.push(T(`Family treasury ${signed(e.d)} nyang`, `집안 곳간 ${signed(e.d)}냥`)); break;
      case 'state': {
        const s2 = g.pol.state;
        if (s2) {
          s2[e.key] = e.key === 'treasury' ? Math.max(0, s2.treasury + e.d) : clamp(s2[e.key] + e.d, 0, 100);
          const names = { authority: T('Royal authority', '왕권'), stability: T('Stability', '민심'), loyalty: T('Military loyalty', '군심'), cooperation: T('Cooperation', '조정 협조'), treasury: T('State treasury', '국고') };
          notes.push(T(`${names[e.key].en} ${signed(e.d)}`, `${names[e.key].ko} ${signed(e.d)}`));
        }
        break;
      }
      case 'punish': notes.push(...punish(g, e.level, e.cause)); break;
      case 'royal': notes.push(...becomeRoyal(g, e.role)); break;
      case 'inquiry': { const q2 = openInquiry(g, e.inq); if (q2) notes.push(T(`Inquiry opened: ${q2.title.en.toLowerCase()}`, `조사 시작: ${q2.title.ko}`)); break; }
      case 'battle': notes.push(...battle(g, e.style)); break;
      case 'happy': feel(g, (e.mood as Emotion | undefined) ?? null, e.d, 60); notes.push(T(`Happiness ${signed(e.d)}`, `행복 ${signed(e.d)}`)); break;
      case 'stress': g.player.stress = clamp(g.player.stress + e.d, 0, 100); notes.push(T(`Stress ${signed(e.d)}`, `근심 ${signed(e.d)}`)); break;
      case 'skill': {
        g.player.skills[e.id] = clamp((g.player.skills[e.id] ?? 0) + e.d, 0, 100);
        g.player.practised[e.id] = g.dayCount;
        const n = skillById(e.id)?.name ?? T(e.id);
        notes.push(T(`${n.en} ${signed(e.d)}`, `${n.ko} ${signed(e.d)}`));
        break;
      }
      case 'practice': g.player.belief.practice[e.id] = (g.player.belief.practice[e.id] ?? 0) + e.d; g.player.belief.conviction = clamp(g.player.belief.conviction + 3, 0, 100); break;
      case 'ail':
        if (conditionById(e.id) && !g.player.conditions.some((c) => c.id === e.id)) {
          g.player.conditions.push({ id: e.id, since: g.dayCount, treated: -1 });
          const n = conditionById(e.id)!.name;
          notes.push(T(`Illness: ${n.en}`, `병: ${n.ko}`));
        }
        break;
      case 'pet': { const t = givePet(g, e.pet); if (t) notes.push(t); break; }
      case 'mission': notes.push(...startMission(g, missionsFor(g.date.year)[0].id)); break;
      case 'proof':
        if (g.pol.downfall) { g.pol.downfall.proof = clamp(g.pol.downfall.proof + e.d, 0, 100); notes.push(T(`Proof ${signed(e.d)}`, `증거 ${signed(e.d)}`)); }
        break;
      case 'restore': restore(g, e.full); notes.push(e.full ? T('Status restored in full', '신분 완전 회복') : T('Status restored in part', '신분 일부 회복')); break;
      case 'quality': {
        bumpQuality(g.player, e.q, e.d);
        const n = QUALITY_NAMES[e.q];
        notes.push(T(`${n.en} ${signed(e.d)}`, `${n.ko} ${signed(e.d)}`));
        break;
      }
      case 'stat': {
        if (e.stat === 'prestige') g.house.prestige = clamp(g.house.prestige + e.d, 1, 5);
        else g.player[e.stat] = clamp(g.player[e.stat] + e.d, 0, 100);
        const n = STAT_NAMES[e.stat];
        notes.push(T(`${n.en} ${signed(e.d)}`, `${n.ko} ${signed(e.d)}`));
        break;
      }
      case 'regard': {
        const r = g.rel[e.npc];
        const npc = g.npcs[e.npc];
        if (!r || !npc || !npc.alive) break;
        r.regard = clamp(r.regard + e.d, -100, 100);
        r.met = true;
        const nm = npc.name;
        notes.push(T(`${nm.en}’s regard ${signed(e.d)}`, `${nm.ko ?? nm.en} 호감 ${signed(e.d)}`));
        break;
      }
      case 'bond': {
        const r = g.rel[e.npc];
        if (r) r.bond = e.to;
        break;
      }
      case 'meet': {
        const r = g.rel[e.npc];
        if (r) r.met = true;
        break;
      }
      case 'flag':
        g.flags[e.flag] = e.v;
        if (e.v) g.flagDays[e.flag] = g.dayCount;
        break;
      case 'record':
        g.log.push({ year: g.date.year, moon: g.date.moon, text: e.text });
        break;
      case 'moment': {
        const r = g.rel[e.npc];
        if (r) r.moments.push({ year: g.date.year, moon: g.date.moon, text: e.text });
        break;
      }
      case 'trait': {
        if (!g.player.traits.includes(e.id) && TRAITS[e.id]) {
          g.player.traits.push(e.id);
          const t = TRAITS[e.id].name;
          notes.push(T(`New trait: ${t.en}`, `새 기질: ${t.ko}`));
        }
        break;
      }
      case 'gift': {
        const gn = giftName(e.id);
        if (g.player.gifts.length >= MAX_GIFTS) notes.push(T('You cannot carry more gifts.', '선물을 더 가질 수 없다.'));
        else {
          g.player.gifts.push(e.id);
          notes.push(T(`You have a gift: ${gn.en}`, `선물이 생겼다: ${gn.ko}`));
        }
        break;
      }
      case 'proposals': {
        g.proposals = makeProposals(g);
        g.favoured = null;
        g.flags['proposals-open'] = true;
        g.flagDays['proposals-open'] = g.dayCount;
        break;
      }
      case 'exam':
        notes.push(...sitExam(g, e.style));
        break;
      case 'end':
        g.player.alive = false;
        g.player.diedYear = g.date.year + e.inYears;
        g.ending = e.ending;
        notes.push(T('This life ends here.', '이 삶은 여기서 끝난다.'));
        break;
      case 'fate': {
        const n = g.npcs[e.npc];
        if (!n) break;
        if (e.fate === 'exiled') { n.away = true; n.places = []; }
        else { n.alive = false; n.diedYear = g.date.year; }
        break;
      }
      case 'note':
        notes.push(e.text);
        break;
      case 'money': {
        const d = e.d < 0 ? -spend(g, -e.d) : e.d;
        if (d > 0) g.player.money += d;
        if (d > 0) g.counts['earned'] = (g.counts['earned'] ?? 0) + d;
        if (d) notes.push(T(`${d > 0 ? '+' : '−'}${Math.abs(d)} nyang`, `${d > 0 ? '+' : '−'}${Math.abs(d)}냥`));
        break;
      }
      case 'invest': {
        if (g.player.money < e.amount || (g.counts['invest-pending'] ?? 0) > 0) break;
        spend(g, e.amount);
        g.counts['invest-pending'] = e.amount;
        notes.push(T(`−${e.amount} nyang, returned next season if the ship comes in`, `−${e.amount}냥, 배가 들어오면 다음 철에 돌아온다`));
        break;
      }
    }
  }
  return notes;
}

export function apply(g0: Game, effects: Effect[]): { game: Game; notes: Text[] } {
  const g = clone(g0);
  const notes = applyInPlace(g, effects);
  return { game: g, notes };
}

// ---------------------------------------------------------------- the examination

function sitExam(g: Game, style: 'safe' | 'bold' | 'faction' | 'military'): Text[] {
  const kind = style === 'military' ? 'mukwa' : 'munkwa';
  const bar = examBar(g, kind);
  if (bar) return [bar];
  const chance = examChance(g, kind, style);
  const pass = roll(g, 'exam:' + g.date.year) < chance;
  if (!pass) {
    g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'edu', text: T('Sat the examination and failed.', '과거를 보았으나 낙방했다.') });
    return [T('You did not pass this time. The next examination will be announced at the gates.', '이번에는 낙방했다. 다음 과거는 대궐 문에 방이 붙을 것이다.')];
  }
  const track = style === 'military' ? 'military' : 'civil';
  g.player.quals.push(kind);
  g.player.reputation = clamp(g.player.reputation + 4, 0, 100);
  if (style === 'bold') g.player.favour = clamp(g.player.favour + 5, 0, 100);
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'edu', text: T(`Passed the ${track === 'civil' ? 'civil' : 'military'} examination.`, `${track === 'civil' ? '문과' : '무과'}에 급제했다.`) });
  emit(g, { type: 'EXAM_PASSED', text: T(`Passed the ${track} examination.`, `${track === 'civil' ? '문과' : '무과'}에 급제했다.`), doc: { title: T('Certificate of examination success (hongpae)', '홍패 (대과 급제 증서)'), body: certificate(g, T(`Passed the ${track === 'civil' ? 'civil service' : 'military'} examination of ${g.date.year}.`, `${g.date.year}년 ${track === 'civil' ? '문과' : '무과'}에 급제함.`)) } });
  // Passing qualifies; a post depends on a vacancy and on who speaks for you (GSDD Part I §8.4).
  const backing = roll(g, 'exam-post:' + g.date.year) < 0.55 + g.player.favour / 300 + (g.pol.side === dominant(g) ? 0.1 : 0);
  if (!backing) {
    return [T('You passed! The roll of graduates is long, though, and no post is free yet. Watch the vacancies at the Ministry of Personnel.', '급제했다! 다만 급제자 명단은 길고 아직 빈자리가 없다. 이조의 빈자리를 살펴보라.'), T('Reputation +4', '평판 +4')];
  }
  const post = postsFor(track, 1, g.date.year)[0];
  g.player.office = { track, rank: 1, post: post?.id };
  g.flagDays.office = g.dayCount;
  g.player.service = 0;
  const office = post?.title ?? OFFICES[track][0];
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'career', text: T(`Appointed ${office.en}.`, `${office.ko}에 임명되었다.`) });
  emit(g, { type: 'OFFICIAL_APPOINTED', text: T(`Appointed ${office.en}.`, `${office.ko}에 임명되었다.`), doc: { title: T('Royal certificate of appointment (gyoji)', '교지 (임명장)'), body: certificate(g, T(`By royal command, appointed ${office.en}.`, `왕명으로 ${office.ko}에 임명함.`)) } });
  return [T(`You passed. You are appointed ${office.en}.`, `급제했다. ${office.ko}에 임명되었다.`), T('Reputation +4', '평판 +4')];
}

/** The player enters the royal household: as heir, as a royal bride, or as regent. */
function becomeRoyal(g: Game, role: 'crownPrince' | 'crownPrincess' | 'queen' | 'regent'): Text[] {
  const p = g.player;
  if (role === 'regent') {
    takeRegency(g);
    return [T('You rule as regent', '섭정이 되었다')];
  }
  if (role === 'crownPrince') {
    p.royal = 'crownPrince';
    p.legitimacy = clamp(p.legitimacy + 12, 0, 100);
    const cp = g.npcs['crown-prince'];
    if (cp) { cp.away = true; cp.places = []; }
    g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'court', text: T('Invested as heir to the throne.', '왕세자로 책봉되었다.') });
    diverge(g, T(`${p.given.en} was named heir to the throne.`, `${p.given.ko}이(가) 왕세자로 책봉되었다.`));
    g.counts.heir = 1;
    return [T('You are the heir to the throne. Legitimacy +12', '왕세자가 되었다. 정통성 +12')];
  }
  const husband = role === 'queen' ? 'king' : 'crown-prince';
  const h = g.npcs[husband];
  if (!h) return [];
  for (const r of Object.values(g.rel)) if (r.bond === 'betrothed' || r.bond === 'romance' || r.bond === 'lover') r.bond = 'none';
  g.flags.betrothed = false;
  g.rel[husband] = { ...(g.rel[husband] ?? { regard: 30, bond: 'none', met: true, moments: [], talked: 0, gifted: 0 }), bond: 'spouse', met: true };
  h.spouse = 'player';
  g.marriedInto = { surname: T('Yi', '이'), prestige: 5, faction: 'crown', background: 'royal' };
  p.legal = 'royal';
  p.royal = role;
  const rival = g.npcs[role === 'queen' ? 'queen-consort' : 'crown-princess'];
  if (rival) { rival.away = true; rival.places = []; }
  marryInto(g, 5);
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'court', text: role === 'queen' ? T('Chosen as queen in the royal selection.', '간택되어 왕비가 되었다.') : T('Chosen as crown princess in the royal selection.', '간택되어 세자빈이 되었다.') });
  diverge(g, role === 'queen' ? T(`${p.given.en} became queen.`, `${p.given.ko}이(가) 왕비가 되었다.`) : T(`${p.given.en} married the crown prince.`, `${p.given.ko}이(가) 세자빈이 되었다.`));
  g.counts.selected = 1;
  return [role === 'queen' ? T('You are Queen of Joseon', '조선의 왕비가 되었다') : T('You are the Crown Princess', '세자빈이 되었다')];
}

// ---------------------------------------------------------------- proposals

/** Who the family is offered. Adds new people from the matchmaker when the court has no one suitable. */
export function makeProposals(g: Game): Proposal[] {
  const woman = g.player.gender === 'woman';
  const want: Gender = woman ? 'man' : 'woman';
  const age = playerAge(g);
  const parents = !!(g.npcs.father?.alive || g.npcs.mother?.alive);
  const fit = (n: Npc | undefined): n is Npc => !!n && n.alive && !n.away && n.gender === want && !n.spouse && !n.kin && n.id !== 'king'
    && npcAge(g, n) >= 16 && Math.abs(npcAge(g, n) - age) <= 12;
  const list: Proposal[] = [];
  const add = (id: string, father: Proposal['father'], mother: Proposal['mother'], note: Text) => {
    const n = g.npcs[id];
    if (!fit(n) || list.some((p) => p.npc === id)) return;
    list.push({ npc: id, father: parents ? father : 'undecided', mother: parents ? mother : 'undecided', note });
    if (g.rel[id]) g.rel[id].met = true;
  };

  for (const [id, r] of Object.entries(g.rel)) {
    if (r.bond !== 'lover') continue;
    const n = g.npcs[id];
    if (!n) continue;
    const self = n.gender === 'man' ? 'himself' : 'herself';
    add(id, g.flags['secret-with-kang'] && id === 'kang' ? 'undecided' : 'against', 'against',
      T(`Asked for your hand ${self}, without a go-between. Your family is shocked, and curious.`, '중매쟁이 없이 직접 청혼해 왔다. 집안은 놀라면서도 궁금해한다.'));
  }
  add('ryu-child', 'against', 'for', T('A {factionA} match. It could end the feud between your fathers, or hand your family to its enemy.', '{factionA} 쪽 혼처. 두 집안의 원한을 끝낼 수도, 집안을 원수에게 넘길 수도 있다.'));
  add(woman ? 'han' : 'han-sister', 'for', 'against', woman
    ? T('Your friend from your brother’s circle. {factionB}, clever, and poor. He holds no office yet.', '오라버니 친구이자 당신의 벗. {factionB}, 영리하지만 가난하고 아직 벼슬이 없다.')
    : T('Your friend Han Seon-woo’s sister. Clever, well read, and from a poor house.', '벗 한선우의 누이. 영리하고 책을 많이 읽었지만 집안이 가난하다.'));
  add('gu-child', 'undecided', 'for', T('A matchmaker’s candidate from a wealthy family in Gyeonggi. You have never met.', '중매쟁이가 데려온 경기도 부잣집 혼처. 만난 적은 없다.'));
  if (!woman) add('seo', 'undecided', 'for', T('A general’s daughter who shoots better than you do.', '당신보다 활을 잘 쏘는 장군의 딸.'));

  // The matchmaker fills the list from outside the court.
  let i = 0;
  while (list.length < 3 && i < 6) {
    const r = roll(g, `match:${i}`);
    const fam = MATCH_SURNAMES[Math.floor(r * MATCH_SURNAMES.length)];
    const used = new Set(Object.values(g.npcs).map((n) => n.given?.en));
    const pool = GIVEN_NAMES[want].filter((n) => !used.has(n.en));
    const given = pool[Math.floor(roll(g, `matchname:${i}`) * pool.length)] ?? GIVEN_NAMES[want][0];
    const candAge = clamp(age + (want === 'man' ? 2 : -2) + Math.floor(roll(g, `matchage:${i}`) * 5) - 2, 16, 40);
    const dye = HANBOK[want];
    const colors = { top: dye.top[Math.floor(roll(g, `mtop:${i}`) * dye.top.length)].hex, bottom: dye.bottom[Math.floor(roll(g, `mbot:${i}`) * dye.bottom.length)].hex };
    const id = `match-${g.dayCount}-${i}`;
    const higher = fam.prestige > g.house.prestige;
    g.npcs[id] = makeNpc({
      id, name: T(`${fam.surname.en} ${given.en}`, `${fam.surname.ko}${given.ko}`), given, gender: want, birthYear: g.date.year - candAge,
      role: want === 'man' ? T(`Son of the ${fam.surname.en} family, found by the matchmaker`, `중매로 들어온 ${fam.surname.ko}씨 집안 아들`) : T(`Daughter of the ${fam.surname.en} family, found by the matchmaker`, `중매로 들어온 ${fam.surname.ko}씨 집안 딸`),
      portrait: plainPortrait(want, candAge, colors), faction: fam.faction, likes: [GIFTS[Math.floor(roll(g, `mlike:${i}`) * GIFTS.length)].id],
      house: { surname: fam.surname, prestige: fam.prestige, faction: fam.faction, background: 'noble' },
      sees: T('A stranger chosen by a matchmaker.', '중매쟁이가 고른 낯선 사람.'),
      wants: T('A household that runs smoothly and a good name.', '잘 돌아가는 살림과 좋은 이름.'),
    });
    g.rel[id] = makeRel(0, true);
    const pr = fam.prestige;
    add(id, higher ? 'for' : pr === g.house.prestige ? 'undecided' : 'against', higher || pr >= 3 ? 'for' : 'undecided',
      T(`The ${fam.surname.en} family${higher ? ', of higher standing than yours' : pr < g.house.prestige ? ', of lower standing than yours' : ''}. You have never met.`,
        `${fam.surname.ko}씨 집안${higher ? '. 당신 집안보다 지체가 높다' : pr < g.house.prestige ? '. 당신 집안보다 지체가 낮다' : ''}. 만난 적은 없다.`));
    i++;
  }
  return list.slice(0, 4);
}

/** Korean particle helper for names in notes. */
export const withWa = (name: string) => name + josa(name, '과', '와');

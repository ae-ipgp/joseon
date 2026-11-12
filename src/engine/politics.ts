import { politicsAdd } from './difficulty';
import type { Game, Npc, StateGov, Text } from '../model/schemas';
import { DEFAULT_POST, NPC_POSTS, TIER_NAMES, conflictIn, defaultPost, missionsFor, postById, postsFor, type Post } from '../content/government';
import { T } from './text';
import { clamp, clone, roll } from './world';
import { dateKey, factionsOf, playerAge, seasonOf } from './time';
import { bumpAttr } from './character';
import { certificate, emit } from './bus';
import { royalPathsOpen } from './chronicle2';

/**
 * GSDD Part II, at the depth the main loop needs: two great factions whose influence rises and falls,
 * posts that fall vacant, a service record, the royal household's titles for the player, and the
 * governance of a monarch or regent. Power is not authority: favour, faction and office are separate numbers.
 */

type Say = (t: Text, record?: boolean) => void;
export type Done = { game: Game; note: Text | null };
const no = (g: Game, why?: Text): Done => ({ game: g, note: why ?? null });
const logIt = (g: Game, tag: string, text: Text) => g.log.push({ year: g.date.year, moon: g.date.moon, tag, text });
export const diverge = (g: Game, text: Text) => {
  g.pol.divergence.push({ year: g.date.year, moon: g.date.moon, text, tag: 'court' });
};

export function initPol(g: Game) {
  const side = g.house.faction === 'A' || g.house.faction === 'B' ? g.house.faction : 'neutral';
  g.pol = {
    inf: { A: 60, B: 40 }, side, standing: side === 'neutral' ? 0 : 20 + g.house.prestige * 6,
    vacancies: [], inquiries: [], exile: null, downfall: null, divergence: [], rulers: [], state: null, mission: null,
  };
  if (g.campaign.mode === 'alternative') {
    const strife = g.campaign.rules?.strife ?? 3;
    g.pol.inf = { A: 50 + strife * 3, B: 50 - strife * 3 };
  }
}

// ---------------------------------------------------------------- factions

export const sideName = (g: Game, side: 'A' | 'B' | 'neutral'): Text => {
  if (side === 'neutral') return T('No faction', '무당파');
  const f = factionsOf(g);
  const t = side === 'A' ? f.a : f.b;
  return T(t.en.replace(/^the /, '').replace(/^./, (c) => c.toUpperCase()), t.ko);
};
export const dominant = (g: Game): 'A' | 'B' => (g.pol.inf.A >= g.pol.inf.B ? 'A' : 'B');
export function factionMembers(g: Game, side: 'A' | 'B'): Npc[] {
  return Object.values(g.npcs).filter((n) => n.alive && !n.away && n.faction === side && n.id !== 'king');
}
export function factionLeader(g: Game, side: 'A' | 'B'): Npc | null {
  const order = ['chief-councillor', 'left-councillor', 'royal-secretary', 'inspector'];
  const m = factionMembers(g, side);
  return m.sort((a, b) => (order.indexOf(a.id) + 99) % 99 - (order.indexOf(b.id) + 99) % 99)[0] ?? null;
}

export function joinSide(g0: Game, side: 'A' | 'B' | 'neutral'): Done {
  if (g0.pol.side === side || g0.flags['side-changed']) return no(g0);
  const g = clone(g0);
  const was = g.pol.side;
  g.pol.side = side;
  g.flags['side-changed'] = true;
  g.flagDays['side-changed'] = g.dayCount;
  g.pol.standing = side === 'neutral' ? 0 : was === 'neutral' ? 15 : 5;
  if (was !== 'neutral' && side !== 'neutral') {
    g.player.honour = clamp(g.player.honour - 6, 0, 100);
    for (const n of factionMembers(g, was)) if (g.rel[n.id]) g.rel[n.id].regard = clamp(g.rel[n.id].regard - 10, -100, 100);
  }
  const t = side === 'neutral'
    ? T('You declare that you serve the throne, not a faction.', '당파가 아니라 오직 임금을 섬기겠다고 밝혔다.')
    : T(`You throw in your lot with ${sideName(g, side).en}.`, `${sideName(g, side).ko}에 몸을 담았다.`);
  logIt(g, 'politics', t);
  emit(g, { type: 'FACTION_CHANGED', text: t });
  return { game: g, note: was !== 'neutral' && side !== 'neutral' ? T(`${t.en} Your old allies call it betrayal. Honour −6.`, `${t.ko} 옛 동지들은 배신이라 부른다. 명예 −6.`) : t };
}

/** A gathering of the faction at a minister's house. Costs a gift; raises standing and a little influence. */
export function factionGathering(g0: Game): Done {
  if (g0.pol.side === 'neutral' || g0.flags['gathered'] || g0.player.legal === 'commoner') return no(g0);
  const g = clone(g0);
  g.flags['gathered'] = true;
  const side = g.pol.side as 'A' | 'B';
  const gain = 4 + Math.round(((g.player.attrs.persuasion ?? 50) + (g.player.attrs.charisma ?? 50)) / 30);
  g.pol.standing = clamp(g.pol.standing + gain, 0, 100);
  g.pol.inf[side] = clamp(g.pol.inf[side] + 1 + (g.player.office?.rank ?? 0) / 2, 5, 95);
  const leader = factionLeader(g, side);
  if (leader && g.rel[leader.id]) g.rel[leader.id].regard = clamp(g.rel[leader.id].regard + 3, -100, 100);
  return { game: g, note: T(`You spend an evening among ${sideName(g, side).en}. Standing +${gain}.`, `${sideName(g, side).ko} 사람들과 저녁을 보냈다. 당내 입지 +${gain}.`) };
}

/** Brokering between the factions: only for the neutral, the diplomatic or the very senior. */
export function broker(g0: Game): Done {
  const p = g0.player;
  if (g0.flags['brokered'] || (p.attrs.diplomacy ?? 0) < 55 || (g0.pol.side !== 'neutral' && (p.office?.rank ?? 0) < 4)) return no(g0);
  const g = clone(g0);
  g.flags['brokered'] = true;
  const ok = roll(g, 'broker') < 0.35 + (p.attrs.diplomacy ?? 50) / 200 + p.reputation / 400;
  if (ok) {
    const mid = (g.pol.inf.A + g.pol.inf.B) / 2;
    g.pol.inf.A = Math.round((g.pol.inf.A + mid) / 2);
    g.pol.inf.B = Math.round((g.pol.inf.B + mid) / 2);
    g.player.reputation = clamp(g.player.reputation + 4, 0, 100);
    g.player.favour = clamp(g.player.favour + 3, 0, 100);
    bumpAttr(g.player, 'diplomacy', 1);
    logIt(g, 'politics', T('Brokered a truce between the factions.', '두 당파 사이를 중재했다.'));
    return { game: g, note: T('Both sides agree to a truce over the vacant posts. Reputation +4, favour +3.', '빈자리를 두고 양쪽이 휴전에 합의했다. 평판 +4, 총애 +3.') };
  }
  g.player.reputation = clamp(g.player.reputation - 2, 0, 100);
  return { game: g, note: T('Neither side trusts a go-between this season. Reputation −2.', '이번 철에는 어느 쪽도 중재인을 믿지 않는다. 평판 −2.') };
}

function factionSeason(g: Game, say: Say) {
  const strife = clamp((g.campaign.rules?.strife ?? 3) + politicsAdd(g), 0.5, 6);
  const drift = (roll(g, 'faction-drift') - 0.5) * 6 * (strife / 3);
  g.pol.inf.A = clamp(Math.round(g.pol.inf.A + drift), 5, 95);
  g.pol.inf.B = clamp(Math.round(g.pol.inf.B - drift), 5, 95);
  if (g.pol.side !== 'neutral') {
    const mine = g.pol.side;
    g.pol.inf[mine] = clamp(g.pol.inf[mine] + Math.round(g.pol.standing / 50 + (g.player.office?.rank ?? 0) / 3), 5, 95);
    g.pol.standing = clamp(g.pol.standing - 1, 0, 100);
  }
  if (seasonOf(g.date.moon) === 0) {
    g.flags['side-changed'] = false;
  }
  g.flags['gathered'] = false;
  g.flags['brokered'] = false;
  // A reversal of power: the court turns over (환국).
  const lead = dominant(g);
  if (g.flags['lead-B'] !== (lead === 'B')) {
    g.flags['lead-B'] = lead === 'B';
    const f = sideName(g, lead);
    say(T(`The balance at court has turned: ${f.en} now hold the great offices.`, `조정의 판도가 뒤집혔다. 이제 ${f.ko}이(가) 요직을 쥐었다.`), true);
    if (g.pol.side === lead) g.player.favour = clamp(g.player.favour + 4, 0, 100);
  }
  // A purge when one side grows too strong.
  const top = Math.max(g.pol.inf.A, g.pol.inf.B);
  if (top >= 78 && roll(g, 'purge') < 0.25 + strife * 0.05) {
    const loser = lead === 'A' ? 'B' : 'A';
    g.pol.inf[loser] = clamp(g.pol.inf[loser] - 15, 5, 95);
    say(T(`A purge: ${sideName(g, lead).en} drive ${sideName(g, loser).en} from office.`, `사화가 일어났다. ${sideName(g, lead).ko}이(가) ${sideName(g, loser).ko}을(를) 조정에서 몰아냈다.`), true);
    for (const n of factionMembers(g, loser)) if (n.post && roll(g, 'purge-npc:' + n.id) < 0.3) { n.away = true; n.places = []; }
    if (g.pol.side === loser && g.player.legal !== 'commoner') g.flags['purge-target'] = true;
  }
}

// ---------------------------------------------------------------- government posts

export function postOf(g: Game): Post | null {
  const o = g.player.office;
  if (!o) return null;
  return postById(o.post) ?? defaultPost(o.track, o.rank, g.date.year);
}
export const officeTitle = (g: Game): Text | null => postOf(g)?.title ?? null;

/** Who holds a post: the player, a cast member, or an unnamed official. */
export function holderOf(g: Game, post: Post): { who: Text; player: boolean } | null {
  if (postOf(g)?.id === post.id) return { who: T('You', '당신'), player: true };
  const npcId = Object.entries(NPC_POSTS).find(([, p]) => p === post.id)?.[0];
  const n = npcId ? g.npcs[npcId] : undefined;
  if (n?.alive && !n.away) return { who: n.name, player: false };
  if (g.pol.vacancies.some((v) => v.post === post.id)) return null;
  return { who: T('an official', '관원'), player: false };
}

function vacancySeason(g: Game) {
  g.pol.vacancies = g.pol.vacancies.filter((v) => v.until > g.dayCount);
  const s = seasonOf(g.date.moon);
  if (s !== 0 && s !== 2) return;
  const n = 1 + Math.floor(roll(g, 'vacancies') * 3);
  for (let i = 0; i < n; i++) {
    const track = roll(g, 'vac-track:' + i) < 0.65 ? 'civil' : 'military';
    const tier = 1 + Math.floor(roll(g, 'vac-tier:' + i) * 4);
    const options = postsFor(track, tier, g.date.year).filter((p) => !Object.values(NPC_POSTS).includes(p.id) || roll(g, 'vac-npc:' + p.id) < 0.2);
    const post = options[Math.floor(roll(g, 'vac-post:' + i) * options.length)];
    if (post && !g.pol.vacancies.some((v) => v.post === post.id) && postOf(g)?.id !== post.id) g.pol.vacancies.push({ post: post.id, until: g.dayCount + 180 });
  }
}

/** Why the player cannot seek a post, or null. */
export function seekBar(g: Game, postId: string): Text | null {
  const post = postById(postId);
  const p = g.player;
  if (!post) return T('No such post.', '그런 자리는 없다.');
  if (p.legal === 'commoner') return T('Commoners hold no office.', '평민은 관직에 나갈 수 없다.');
  if (g.pol.exile) return T('You are in exile.', '유배 중이다.');
  if (p.mourning?.leave && g.dayCount < p.mourning.until) return T('You are on mourning leave.', '상중이라 벼슬을 쉬고 있다.');
  if (p.royal !== 'none') return T('Your place is in the royal household.', '당신의 자리는 왕실에 있다.');
  const qual = post.track === 'civil' ? 'munkwa' : 'mukwa';
  if (!p.office && !p.quals.includes(qual)) return T(`You need to pass the ${post.track === 'civil' ? 'civil' : 'military'} examination first.`, `먼저 ${post.track === 'civil' ? '문과' : '무과'}에 급제해야 한다.`);
  const tier = p.office?.rank ?? 0;
  if (post.tier > tier + 1) return T('That post is too far above your present rank.', '지금 품계로는 너무 높은 자리다.');
  if (p.office && post.tier < tier) return T('That would be a step down.', '그건 좌천이다.');
  if (p.office && post.track !== p.office.track && post.tier > 1) return T('You would have to start again in that branch.', '그 길로 가려면 처음부터 다시 시작해야 한다.');
  if (post.tier >= 3 && p.favour < 40) return T('The king does not know you well enough yet (favour 40).', '전하께서 아직 당신을 잘 모르신다 (총애 40 필요).');
  if (post.tier >= 4 && (p.favour < 55 || p.reputation < 50)) return T('A ministry needs favour 55 and reputation 50.', '판서 자리는 총애 55, 평판 50이 필요하다.');
  if (g.flags['sought:' + postId]) return T('You have already put your name forward.', '이미 이름을 올렸다.');
  return null;
}

export function seekChance(g: Game, postId: string): number {
  const post = postById(postId)!;
  const p = g.player;
  const sideBonus = g.pol.side === dominant(g) ? g.pol.standing / 300 : g.pol.side === 'neutral' ? 0 : -0.08;
  const skill = post.track === 'civil' ? (p.attrs.administration ?? 50) : (p.attrs.leadership ?? 50);
  return clamp(0.22 + p.favour / 350 + p.reputation / 450 + skill / 450 + sideBonus + p.service / 200 - post.tier * 0.06, 0.05, 0.85);
}

export function seekPost(g0: Game, postId: string): Done {
  if (seekBar(g0, postId)) return no(g0);
  const g = clone(g0);
  const post = postById(postId)!;
  g.flags['sought:' + postId] = true;
  if (roll(g, 'seek:' + postId) < seekChance(g, postId)) {
    const first = !g.player.office;
    g.player.office = { track: post.track, rank: post.tier, post: post.id };
    g.flagDays[first ? 'office' : 'promoted'] = g.dayCount;
    g.player.service = 0;
    g.pol.vacancies = g.pol.vacancies.filter((v) => v.post !== postId);
    logIt(g, 'career', T(`Appointed ${post.title.en}.`, `${post.title.ko}에 임명되었다.`));
    emit(g, { type: 'OFFICIAL_APPOINTED', text: T(`Appointed ${post.title.en} (${post.grade.en}).`, `${post.title.ko}(${post.grade.ko})에 임명되었다.`), doc: { title: T('Royal certificate of appointment (gyoji)', '교지 (임명장)'), body: certificate(g, T(`By royal command, appointed ${post.title.en}, ${post.grade.en}.`, `왕명으로 ${post.grade.ko} ${post.title.ko}에 임명함.`)) } });
    if (post.tier === 3 || post.tier === 5) g.house.prestige = clamp(g.house.prestige + 1, 1, 5);
    g.counts.appointments = (g.counts.appointments ?? 0) + 1;
    return { game: g, note: T(`The Ministry of Personnel sends word: you are appointed ${post.title.en} (${post.grade.en}).`, `이조에서 기별이 왔다. ${post.title.ko}(${post.grade.ko})에 임명되었다.`) };
  }
  const other = sideName(g, dominant(g) === 'A' ? 'A' : 'B');
  return { game: g, note: T(`The post went to a man with friends among ${other.en}.`, `그 자리는 ${other.ko}에 줄이 닿은 자에게 돌아갔다.`) };
}

/** Doing the work of one's post. */
export function serve(g: Game, d: number) {
  g.player.service = clamp(g.player.service + d, -20, 40);
}

/** Yearly evaluation and promotion: service, favour, reputation and faction all count; nothing is guaranteed. */
function careerSeason(g: Game, say: Say) {
  const p = g.player;
  const o = p.office;
  if (!o || p.legal === 'commoner') return;
  if (p.mourning?.leave && g.dayCount < p.mourning.until) return;
  p.service += Math.round(((p.attrs.administration ?? 50) + (p.attrs.integrity ?? 50)) / 60) - (g.flags.corrupt ? 2 : 0);
  if (seasonOf(g.date.moon) !== 3) return;
  const score = p.service;
  p.service = 0;
  if (score < 2) {
    if (g.flags['poor-review']) {
      g.flags['poor-review'] = false;
      p.office = null;
      say(T('A second poor evaluation: you are dismissed from office.', '두 번째 낮은 고과로 관직에서 파직되었다.'), true);
      logIt(g, 'career', T('Dismissed after poor evaluations.', '고과가 나빠 파직되었다.'));
      emit(g, { type: 'OFFICIAL_DISMISSED', text: T('Dismissed after poor evaluations.', '고과가 나빠 파직되었다.') });
      return;
    }
    g.flags['poor-review'] = true;
    p.reputation = clamp(p.reputation - 3, 0, 100);
    say(T('Your year-end evaluation is poor. The Ministry of Personnel notes it. Reputation −3.', '연말 고과가 나빴다. 이조가 이를 적어 두었다. 평판 −3.'));
    return;
  }
  g.flags['poor-review'] = false;
  if (o.rank >= 5) return;
  if ((o.rank >= 3 && p.favour < 40) || (o.rank >= 4 && p.favour < 55)) return;
  const since = g.dayCount - (g.flagDays.promoted ?? g.flagDays['office'] ?? 0);
  if (since < 300 * o.rank) return;
  const sideBonus = g.pol.side === dominant(g) ? 0.05 : g.pol.side === 'neutral' ? 0 : -0.05;
  const chance = clamp(0.06 + score / 60 + p.favour / 500 + p.reputation / 700 + sideBonus - o.rank * 0.05, 0.03, 0.5);
  if (roll(g, 'promote') >= chance) return;
  o.rank += 1;
  const options = postsFor(o.track, o.rank, g.date.year);
  const post = options[Math.floor(roll(g, 'promote-post') * options.length)] ?? defaultPost(o.track, o.rank, g.date.year);
  o.post = post.id;
  g.flagDays.promoted = g.dayCount;
  say(T(`Promoted to ${post.title.en} (${post.grade.en}).`, `${post.title.ko}(${post.grade.ko})에 올랐다.`), true);
  logIt(g, 'career', T(`Promoted to ${post.title.en}.`, `${post.title.ko}에 올랐다.`));
  emit(g, { type: 'OFFICIAL_APPOINTED', text: T(`Promoted to ${post.title.en} (${post.grade.en}).`, `${post.title.ko}(${post.grade.ko})에 올랐다.`), doc: { title: T('Royal certificate of appointment (gyoji)', '교지 (임명장)'), body: certificate(g, T(`By royal command, promoted to ${post.title.en}, ${post.grade.en}.`, `왕명으로 ${post.grade.ko} ${post.title.ko}에 승진 임명함.`)) } });
  if (o.rank === 3 || o.rank === 5) {
    g.house.prestige = clamp(g.house.prestige + 1, 1, 5);
    say(T('Your family’s standing rises with you.', '당신과 함께 가문의 위세도 높아졌다.'));
  }
  if (o.track === 'military' && o.rank >= 4 && p.favour > 60) {
    p.favour -= 5;
    say(T('Some at court whisper that a general with so many loyal men bears watching. Favour −5.', '충성스러운 군사를 거느린 장수는 지켜봐야 한다는 수군거림이 돈다. 총애 −5.'));
  }
}

/** Military events in years of war: a commander's decision, resolved by leadership, strategy and arms. */
export function battle(g: Game, style: 'hold' | 'attack' | 'reinforce' | 'flank' | 'ambush'): Text[] {
  const p = g.player;
  const c = conflictIn(g.date.year, g.flags);
  const skill = ((p.attrs.leadership ?? 50) + (p.attrs.strategy ?? 50) + (p.attrs.martial ?? 50) + (p.edu.military ?? 0)) / 4;
  // Sandbox: the strength of the kingdom's armies (GSDD Part IV §18).
  const army = g.campaign.mode === 'alternative' ? ((g.campaign.rules?.military ?? 3) - 3) * 0.05 : 0;
  // v0.6 (GSDD Part XI): a flanking march rewards strategy, an ambush rewards knowing the ground; a posting helps.
  const posted = ['land', 'naval', 'border'].some((b) => g.flags['branch-' + b]) ? 0.05 : 0;
  const arts = ((p.skills?.archery ?? 0) + (p.skills?.riding ?? 0)) / 800;
  const base = style === 'attack' ? (skill - 25) / 60 : style === 'hold' ? (skill - 10) / 60 : style === 'flank' ? (skill - 22) / 60 + ((p.attrs.strategy ?? 50) - 50) / 120 : style === 'ambush' ? (skill - 18) / 60 + ((p.edu.military ?? 0) - 40) / 150 : 0.5;
  const odds = base + army + posted + arts;
  const r = roll(g, 'battle:' + style);
  const notes: Text[] = [];
  if (style === 'reinforce') {
    p.favour = clamp(p.favour - 2, 0, 100);
    notes.push(T('Reinforcements come late but they come. The line holds. Favour −2.', '원군이 늦게나마 도착해 전선을 지켰다. 총애 −2.'));
    return notes;
  }
  if (r < clamp(odds, 0.15, 0.85)) {
    const big = style === 'attack' || style === 'flank' || style === 'ambush';
    p.reputation = clamp(p.reputation + (big ? 8 : 4), 0, 100);
    p.favour = clamp(p.favour + (big ? 6 : 3), 0, 100);
    if (!p.quals.includes('command')) p.quals.push('command');
    bumpAttr(p, 'leadership', 2);
    bumpAttr(p, 'courage', 1);
    if (big) g.house.prestige = clamp(g.house.prestige + (roll(g, 'battle-prestige') < 0.4 ? 1 : 0), 1, 5);
    p.service += 6;
    logIt(g, 'career', T(`Won a victory${c ? ` in ${c.name.en.toLowerCase()}` : ''}.`, `${c ? c.name.ko + '에서 ' : ''}승리를 거두었다.`));
    g.counts.victories = (g.counts.victories ?? 0) + 1;
    notes.push(big ? T('The enemy breaks and runs. Reputation +8, favour +6.', '적이 무너져 달아났다. 평판 +8, 총애 +6.') : T('The line holds and the enemy withdraws. Reputation +4, favour +3.', '전선을 지켜 적이 물러났다. 평판 +4, 총애 +3.'));
  } else {
    const hurt = 4 + Math.floor(roll(g, 'wound') * 10);
    p.health = clamp(p.health - hurt, 0, 100);
    p.reputation = clamp(p.reputation - (style === 'hold' ? 3 : 6), 0, 100);
    notes.push(T(`The day goes against you. You are wounded (health −${hurt}) and your men fall back.`, `싸움은 불리했다. 부상을 입었고 (건강 −${hurt}) 군사들이 물러났다.`));
  }
  return notes;
}

/** An embassy abroad: the player is away for its seasons and comes back with credit, goods and stories. */
export function startMission(g: Game, id: string): Text[] {
  const m = missionsFor(g.date.year).find((x) => x.id === id) ?? missionsFor(g.date.year)[0];
  g.pol.mission = { to: m.id, back: g.dayCount + m.seasons * 90 };
  logIt(g, 'politics', T(`Set out with the ${m.name.en.toLowerCase()} to ${m.to.en}.`, `${m.to.ko}(으)로 가는 ${m.name.ko}에 올랐다.`));
  return [T(`You will be away about ${m.seasons} season${m.seasons > 1 ? 's' : ''}.`, `약 ${m.seasons}철 동안 떠나 있게 된다.`)];
}
function missionSeason(g: Game, say: Say) {
  const m = g.pol.mission;
  if (!m || g.dayCount < m.back) return;
  g.pol.mission = null;
  const p = g.player;
  // v0.6 (GSDD Part XII §6.2): an envoy who speaks the language does better.
  const skill = ((p.attrs.diplomacy ?? 50) + (p.attrs.etiquette ?? 50) + (p.edu.practical ?? 0)) / 3 + (p.skills?.language ?? 0) / 4;
  const good = roll(g, 'mission') < 0.3 + skill / 120;
  if (!p.quals.includes('envoy')) p.quals.push('envoy');
  const trade = Math.round(60 + roll(g, 'mission-trade') * 160);
  p.money += trade;
  p.reputation = clamp(p.reputation + (good ? 6 : 2), 0, 100);
  p.favour = clamp(p.favour + (good ? 6 : 0), 0, 100);
  bumpAttr(p, 'diplomacy', 2);
  g.counts.missions = (g.counts.missions ?? 0) + 1;
  g.counts.embassies = (g.counts.embassies ?? 0) + 1;
  say(good
    ? T(`You are home from the embassy. The talks went well and the king is pleased; the goods you brought back sold for ${trade} nyang.`, `사행에서 돌아왔다. 교섭이 잘 되어 전하께서 기뻐하신다. 가져온 물건을 ${trade}냥에 팔았다.`)
    : T(`You are home from the embassy. Little was gained but nothing lost; your goods sold for ${trade} nyang.`, `사행에서 돌아왔다. 얻은 것은 적으나 잃은 것도 없다. 가져온 물건을 ${trade}냥에 팔았다.`), true);
  logIt(g, 'politics', T('Returned from an embassy abroad.', '외국 사행에서 돌아왔다.'));
}

// ---------------------------------------------------------------- the royal household and the throne

export const ROYAL_TITLES: Record<string, Text> = {
  none: T('—', '—'), crownPrince: T('Crown Prince', '왕세자'), crownPrincess: T('Crown Princess', '세자빈'),
  queen: T('Queen Consort', '왕비'), queenDowager: T('Queen Dowager', '대비'), king: T('Monarch', '국왕'), regent: T('Regent', '섭정'),
};
/** The title the player holds in the royal house, including the retired king after an abdication. */
export const royalTitle = (g: Game): Text | null =>
  g.player.royal !== 'none' ? ROYAL_TITLES[g.player.royal] : g.flags.abdicated ? T('Retired King', '상왕') : null;
export const isMonarch = (g: Game) => g.player.royal === 'king' || g.player.royal === 'regent';
export const diverged = (g: Game) => g.pol.rulers.length > 0;

/** Who the player could be named heir for: the royal line and the campaign's succession law. */
export function heirEligible(g: Game): boolean {
  const p = g.player;
  // Strict continuity keeps the recorded line of succession (GSDD Part IV §17).
  if (!royalPathsOpen(g)) return false;
  if (p.legal !== 'royal' || p.royal !== 'none' || !(p.lineage === 'prince' || p.lineage === 'descendant' || p.lineage === 'disputed')) return false;
  const law = g.campaign.mode === 'alternative' ? g.campaign.rules?.succession ?? 'male' : 'male';
  if (p.gender === 'woman' && law !== 'absolute' && !(g.campaign.mode === 'alternative' && g.campaign.premise === 'queen')) return false;
  const age = playerAge(g);
  return age >= 8 && age <= 45;
}
export const heirSeat = (g: Game) => !g.npcs['crown-prince'] || !g.npcs['crown-prince'].alive || g.npcs['crown-prince'].away;

export function initState(g: Game, regencyUntil: number | null): StateGov {
  const rules = g.campaign.rules;
  return {
    treasury: 6000, privy: 600, tax: 'usual',
    authority: clamp(30 + g.player.legitimacy / 3 + (rules?.authority ?? 3) * 4, 10, 90),
    stability: 60, loyalty: 55, cooperation: 50 + (g.pol.side === 'neutral' ? 5 : 0),
    decrees: [], regencyUntil, heir: null,
  };
}

/** The player takes the throne, in history's place or in an alternative court. */
export function accede(g: Game, say: Say) {
  const p = g.player;
  p.royal = 'king';
  p.legitimacy = clamp(p.legitimacy + 15, 0, 100);
  const title = T(`King ${p.given.en}`, `${p.given.ko} 임금`);
  g.pol.rulers.push({ from: dateKey(g.date), title, born: p.birthYear, player: true });
  g.pol.state = initState(g, null);
  if (g.npcs.king) { g.npcs.king.alive = false; g.npcs.king.diedYear = g.date.year; }
  if (g.npcs['crown-prince']) g.npcs['crown-prince'].away = true;
  say(T('The old king is dead. In the throne hall the ministers bow to you: you are the sovereign of Joseon.', '선왕께서 승하하셨다. 인정전에서 신하들이 당신에게 절을 올린다. 이제 당신이 조선의 임금이다.'), true);
  diverge(g, T(`${p.given.en} ascended the throne in place of the recorded heir.`, `기록된 후계자 대신 ${p.given.ko}이(가) 보위에 올랐다.`));
  logIt(g, 'court', T('Ascended the throne.', '보위에 올랐다.'));
  g.counts.reigned = 1;
  emit(g, { type: 'CORONATION', text: T('Ascended the throne.', '보위에 올랐다.'), doc: { title: T('Proclamation of accession (gyoseo)', '즉위 교서'), body: certificate(g, T('Ascended the throne of Joseon and received the homage of the court.', '조선의 보위에 올라 조정의 하례를 받음.')) } });
}

/** Called by the season when a reign ends. Returns true if the player's place in the royal household took over. */
export function reignChanged(g: Game, say: Say): boolean {
  const p = g.player;
  if (p.royal === 'crownPrince') {
    accede(g, say);
    return true;
  }
  if (p.royal === 'crownPrincess') {
    p.royal = 'queen';
    g.flags['player-queen'] = true;
    say(T('Your husband is now king, and you are Queen of Joseon. The inner court bows to you.', '남편이 보위에 오르고 당신은 조선의 왕비가 되었다. 내명부가 당신에게 절을 올린다.'), true);
    logIt(g, 'court', T('Became queen consort.', '왕비가 되었다.'));
    return false;
  }
  if (p.royal === 'queen') {
    p.royal = 'queenDowager';
    say(T('The king, your husband, has died. You are now the Queen Dowager.', '지아비이신 전하께서 승하하셨다. 이제 당신은 대비다.'), true);
    logIt(g, 'court', T('Became queen dowager.', '대비가 되었다.'));
    const king = g.npcs.king;
    if (king && g.date.year - king.birthYear < 20) {
      g.flags['regency-offer'] = true;
      g.flagDays['regency-offer'] = g.dayCount;
    }
    return false;
  }
  return false;
}

/** Alternative courts and diverged histories: the reigning king may die; succession follows the rules. */
function altThrone(g: Game, say: Say) {
  const p = g.player;
  if (p.royal === 'king') return;
  const king = g.npcs.king;
  if (!king || !king.alive) return;
  if (g.campaign.mode === 'historical' && !diverged(g)) return;
  const age = g.date.year - king.birthYear;
  const risk = age < 50 ? 0.004 : Math.min(0.25, 0.01 * Math.pow(1.09, age - 50));
  if (roll(g, 'alt-king-death') >= risk) return;
  king.alive = false;
  king.diedYear = g.date.year;
  if (p.royal === 'crownPrince') {
    accede(g, say);
    return;
  }
  const heir = g.npcs['crown-prince'];
  const title = heir?.given ? T(`King ${heir.given.en}`, `${heir.given.ko} 임금`) : T('the new king', '새 임금');
  g.pol.rulers.push({ from: dateKey(g.date), title, born: heir?.birthYear ?? g.date.year - 20, player: false });
  say(T(`The king has died. ${title.en.charAt(0).toUpperCase() + title.en.slice(1)} takes the throne.`, `임금께서 승하하셨다. ${title.ko}이(가) 보위에 오른다.`), true);
  g.npcs.king = { ...king, alive: true, diedYear: null, name: title, given: heir?.given ?? null, birthYear: heir?.birthYear ?? g.date.year - 20 };
  if (heir) { heir.away = true; heir.alive = false; }
  reignChanged(g, say);
}

function regencySeason(g: Game, say: Say) {
  const s = g.pol.state;
  if (g.player.royal === 'regent' && s?.regencyUntil && g.date.year >= s.regencyUntil) {
    g.player.royal = 'queenDowager';
    g.pol.state = null;
    say(T('The young king has come of age. You raise the bamboo screen and return the seals of state.', '어린 임금이 장성했다. 발을 걷고 국새를 돌려드렸다.'), true);
    logIt(g, 'court', T('Ended the regency.', '수렴청정을 거두었다.'));
  }
}

export function takeRegency(g: Game) {
  const king = g.npcs.king;
  const until = (king?.birthYear ?? g.date.year - 12) + 20;
  g.player.royal = 'regent';
  g.pol.state = initState(g, until);
  g.flags['regency-offer'] = false;
  logIt(g, 'court', T('Began to rule from behind the bamboo screen as regent.', '수렴청정을 시작했다.'));
  diverge(g, T(`${g.player.given.en} governed as regent for the young king.`, `${g.player.given.ko}이(가) 어린 임금을 대신해 수렴청정했다.`));
}

// ---------------------------------------------------------------- governance (GSDD Part II §9, Part III §16)

export type DecreeDef = { id: string; name: Text; text: Text; cost: number; needs: number; regentOk: boolean };
export const DECREES: DecreeDef[] = [
  { id: 'relief', name: T('Open the granaries for relief', '진휼'), text: T('Feed the provinces struck by disaster. Stability rises.', '재해를 입은 고을을 구휼한다. 민심이 안정된다.'), cost: 600, needs: 0, regentOk: true },
  { id: 'works', name: T('Repair walls, roads and dykes', '성곽과 제방 수축'), text: T('Public works: stability now, revenue later.', '토목 공사. 지금은 민심, 나중엔 세입.'), cost: 900, needs: 20, regentOk: true },
  { id: 'army', name: T('Pay and drill the army', '군비 확충'), text: T('Military loyalty rises.', '군의 충성이 높아진다.'), cost: 700, needs: 20, regentOk: true },
  { id: 'balance', name: T('Appoint from both factions', '탕평'), text: T('Ministers from both sides: cooperation rises, factions cool.', '양쪽에서 고루 등용한다. 협조가 늘고 당쟁이 누그러진다.'), cost: 0, needs: 35, regentOk: true },
  { id: 'purge', name: T('Purge the stronger faction', '환국'), text: T('Drive the dominant faction from office. Authority rises; the court is shaken.', '세도를 부리는 당파를 내친다. 왕권이 서지만 조정이 흔들린다.'), cost: 0, needs: 60, regentOk: false },
  { id: 'audit', name: T('Order an audit of the ministries', '암행 감찰'), text: T('Opens an inquiry into corruption.', '부정부패 조사를 연다.'), cost: 150, needs: 30, regentOk: true },
  { id: 'embassy', name: T('Send an embassy abroad', '사신 파견'), text: T('Prestige and good relations with neighbours.', '이웃 나라와의 관계와 위신.'), cost: 400, needs: 0, regentOk: true },
  { id: 'privy', name: T('Move state funds to the privy purse', '국고를 내탕으로 돌림'), text: T('Money for the palace — and grumbling among the ministers.', '궁궐 살림이 넉넉해지지만 신하들이 수군거린다.'), cost: -400, needs: 0, regentOk: false },
];

export function decreeBar(g: Game, id: string): Text | null {
  const s = g.pol.state;
  const d = DECREES.find((x) => x.id === id);
  if (!s || !d || !isMonarch(g)) return T('Only the throne decrees.', '어명은 임금만 내린다.');
  if (g.player.royal === 'regent' && !d.regentOk) return T('A regent may not do this in the king’s name.', '섭정이 임금의 이름으로 할 수 없는 일이다.');
  if (g.flags['decreed']) return T('One great decree a season.', '한 철에 큰 어명은 하나뿐이다.');
  if (d.cost > 0 && s.treasury < d.cost) return T('The state treasury cannot bear it.', '국고가 감당하지 못한다.');
  if (s.authority < d.needs) return T(`Needs royal authority of ${d.needs}.`, `왕권 ${d.needs} 이상 필요.`);
  return null;
}

export function decree(g0: Game, id: string): Done {
  if (decreeBar(g0, id)) return no(g0);
  const g = clone(g0);
  const s = g.pol.state!;
  const d = DECREES.find((x) => x.id === id)!;
  g.flags['decreed'] = true;
  // A weak throne finds its orders stalled.
  if (s.authority < 30 && roll(g, 'stall:' + id) < 0.4) {
    s.authority = clamp(s.authority - 2, 0, 100);
    return { game: g, note: T('The ministers bow, and do nothing. The order is stalled in the Secretariat. Authority −2.', '신하들은 절만 하고 움직이지 않는다. 어명이 승정원에서 막혔다. 왕권 −2.') };
  }
  if (d.cost > 0) s.treasury -= d.cost;
  s.decrees.push({ id, year: g.date.year });
  const notes: string[] = [];
  const notesKo: string[] = [];
  const add = (key: 'stability' | 'loyalty' | 'cooperation' | 'authority', v: number, en: string, ko: string) => {
    s[key] = clamp(s[key] + v, 0, 100);
    notes.push(`${en} ${v > 0 ? '+' : '−'}${Math.abs(v)}`);
    notesKo.push(`${ko} ${v > 0 ? '+' : '−'}${Math.abs(v)}`);
  };
  switch (id) {
    case 'relief': {
      add('stability', 8, 'Stability', '민심');
      for (const st of Object.values(g.econ.provinces)) if (st.disaster) st.stability = clamp(st.stability + 12, 0, 100);
      g.player.reputation = clamp(g.player.reputation + 3, 0, 100);
      break;
    }
    case 'works': add('stability', 3, 'Stability', '민심'); g.flags['works-done'] = true; break;
    case 'army': add('loyalty', 10, 'Military loyalty', '군심'); break;
    case 'balance': {
      add('cooperation', 8, 'Cooperation', '조정 협조');
      const mid = (g.pol.inf.A + g.pol.inf.B) / 2;
      g.pol.inf.A = Math.round((g.pol.inf.A * 2 + mid) / 3);
      g.pol.inf.B = Math.round((g.pol.inf.B * 2 + mid) / 3);
      break;
    }
    case 'purge': {
      const top = dominant(g);
      g.pol.inf[top] = clamp(g.pol.inf[top] - 30, 5, 95);
      add('authority', 6, 'Authority', '왕권');
      add('cooperation', -10, 'Cooperation', '조정 협조');
      add('stability', -5, 'Stability', '민심');
      logIt(g, 'court', T(`Purged ${sideName(g, top).en} from the court.`, `${sideName(g, top).ko}을(를) 조정에서 몰아냈다.`));
      diverge(g, T(`A purge by royal order drove ${sideName(g, top).en} from power.`, `어명으로 ${sideName(g, top).ko}이(가) 권력에서 밀려났다.`));
      break;
    }
    case 'audit': g.flags['audit-ordered'] = true; add('cooperation', -2, 'Cooperation', '조정 협조'); break;
    case 'embassy': g.player.reputation = clamp(g.player.reputation + 2, 0, 100); g.house.prestige = clamp(g.house.prestige + (roll(g, 'embassy-prestige') < 0.3 ? 1 : 0), 1, 5); add('stability', 2, 'Stability', '민심'); break;
    case 'privy': s.treasury -= 400; s.privy += 400; add('authority', -6, 'Authority', '왕권'); add('cooperation', -8, 'Cooperation', '조정 협조'); break;
  }
  return { game: g, note: T(`${d.name.en}. ${notes.join(', ')}`.trim(), `${d.name.ko}. ${notesKo.join(', ')}`.trim()) };
}

export function setTax(g0: Game, tax: StateGov['tax']): Done {
  if (!isMonarch(g0) || !g0.pol.state || g0.pol.state.tax === tax) return no(g0);
  const g = clone(g0);
  g.pol.state!.tax = tax;
  return { game: g, note: T(`Taxes are now ${tax === 'light' ? 'light' : tax === 'heavy' ? 'heavy' : 'as usual'}.`, `세금을 ${tax === 'light' ? '가볍게' : tax === 'heavy' ? '무겁게' : '예전대로'} 정했다.`) };
}

export function nameHeir(g0: Game, childId: string): Done {
  const s0 = g0.pol.state;
  const c = g0.npcs[childId];
  if (!s0 || g0.player.royal !== 'king' || !c?.alive || !c.parents.includes('player')) return no(g0);
  const law = g0.campaign.mode === 'alternative' ? g0.campaign.rules?.succession ?? 'male' : 'male';
  if (law === 'male' && c.gender !== 'man') return no(g0, T('Under the law of succession only a son may be named.', '종법에 따라 아들만 세자로 책봉할 수 있다.'));
  const g = clone(g0);
  g.pol.state!.heir = childId;
  g.pol.state!.authority = clamp(g.pol.state!.authority + 4, 0, 100);
  logIt(g, 'court', T(`Named ${c.name.en} as heir.`, `${c.name.ko}을(를) 세자로 책봉했다.`));
  return { game: g, note: T(`${c.name.en} is invested as heir. The succession is secure. Authority +4.`, `${c.name.ko}을(를) 후계로 책봉했다. 후사가 안정되었다. 왕권 +4.`) };
}

function stateSeason(g: Game, say: Say) {
  const s = g.pol.state;
  if (!s || !isMonarch(g)) return;
  g.flags['decreed'] = false;
  const provs = Object.values(g.econ.provinces);
  const calm = provs.reduce((n, p) => n + p.stability, 0) / Math.max(1, provs.length);
  const rate = s.tax === 'light' ? 0.7 : s.tax === 'heavy' ? 1.35 : 1;
  const revenue = Math.round(950 * rate * (calm / 70) * (g.flags['works-done'] ? 1.05 : 1));
  const spend = 620 + Math.round(s.loyalty * 3) + (s.privy < 200 ? 100 : 0);
  s.treasury = Math.max(0, s.treasury + revenue - spend);
  if (s.tax === 'heavy') s.stability = clamp(s.stability - 3, 0, 100);
  if (s.tax === 'light') s.stability = clamp(s.stability + 2, 0, 100);
  const struck = provs.filter((p) => p.disaster).length;
  if (struck && !s.decrees.some((d) => d.id === 'relief' && d.year === g.date.year)) s.stability = clamp(s.stability - 2 * struck, 0, 100);
  if (Math.abs(g.pol.inf.A - g.pol.inf.B) > 40) s.cooperation = clamp(s.cooperation - 2, 0, 100);
  if (s.treasury === 0) {
    s.cooperation = clamp(s.cooperation - 5, 0, 100);
    say(T('The state treasury is empty. Salaries go unpaid and the ministers grumble.', '국고가 바닥났다. 녹봉이 밀리고 신하들이 원망한다.'), true);
  }
  const target = (s.stability + s.cooperation + s.loyalty) / 3 * 0.8 + g.player.legitimacy * 0.2 + ((g.campaign.rules?.authority ?? 3) - 3) * 4;
  s.authority = clamp(Math.round(s.authority + (target - s.authority) * 0.25), 0, 100);
  say(T(`The state: revenue ${revenue}, spending ${spend}, treasury ${s.treasury.toLocaleString('en-US')} nyang. Royal authority ${s.authority}.`, `나라 살림: 세입 ${revenue}, 세출 ${spend}, 국고 ${s.treasury.toLocaleString('en-US')}냥. 왕권 ${s.authority}.`));
  if (s.authority < 15 && g.player.royal === 'king' && roll(g, 'deposition') < 0.35) {
    g.flags['deposed'] = true;
  }
}

// ---------------------------------------------------------------- per season

/** Everything political that happens each season. Order matters: the court, then the career, then the state. */
export function politicsSeason(g: Game, say: Say) {
  if (!g.player.alive) return;
  factionSeason(g, say);
  vacancySeason(g);
  careerSeason(g, say);
  missionSeason(g, say);
  altThrone(g, say);
  regencySeason(g, say);
  stateSeason(g, say);
  if (g.player.legal === 'royal' && g.player.royal === 'none') {
    // Legitimacy grows slowly with good conduct and favour, and shrinks with scandal.
    g.player.legitimacy = clamp(g.player.legitimacy + (g.player.favour > 50 ? 1 : 0) + (g.player.honour > 60 ? 1 : 0) - (g.player.reputation < 30 ? 1 : 0), 0, 100);
  }
  if (g.pol.exile && g.dayCount >= g.pol.exile.until) {
    g.pol.exile = null;
    say(T('Your term of exile is over. You may return to the capital.', '유배가 풀렸다. 도성으로 돌아갈 수 있다.'), true);
    logIt(g, 'downfall', T('Released from exile.', '유배에서 풀려났다.'));
  }
}

export const tierName = (track: 'civil' | 'military', rank: number) => TIER_NAMES[track][rank - 1];
export { DEFAULT_POST };

import type { Game, Npc, PortraitSpec, Rel, Status, Text } from '../model/schemas';
import { T } from './text';

export const clone = <V>(v: V): V => structuredClone(v);
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** A deterministic roll in [0, 1) for this game, day and purpose. */
export function roll(g: Game, key: string): number {
  const s = `${g.seed}:${g.dayCount}:${key}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export const npcAge = (g: Game, n: Npc) => (n.alive ? g.date.year : n.diedYear ?? g.date.year) - n.birthYear;

export function spouseId(g: Game): string | null {
  for (const [id, r] of Object.entries(g.rel)) if (r.bond === 'spouse') return id;
  return null;
}
export const everMarried = (g: Game) => spouseId(g) !== null;
export function livingSpouse(g: Game): Npc | null {
  const id = spouseId(g);
  const n = id ? g.npcs[id] : undefined;
  return n && n.alive ? n : null;
}
export function betrothedId(g: Game): string | null {
  for (const [id, r] of Object.entries(g.rel)) if (r.bond === 'betrothed') return id;
  return null;
}

export function statusOf(r: Rel): Status {
  if (r.bond === 'spouse') return 'spouse';
  if (r.bond === 'betrothed') return 'betrothed';
  if (r.bond === 'lover') return 'lover';
  if (r.bond === 'romance' && r.regard >= 0) return 'romanticInterest';
  if (r.regard <= -50) return 'enemy';
  if (r.regard <= -20) return 'rival';
  if (r.regard >= 75) return 'closeFriend';
  if (r.regard >= 40) return 'friend';
  return r.met ? 'acquaintance' : 'stranger';
}

/** How the player names a relative. */
export function kinLabel(g: Game, n: Npc): Text | null {
  const man = n.gender === 'man';
  const playerWoman = g.player.gender === 'woman';
  switch (n.kin) {
    case 'grandfather': return T('Grandfather', '할아버지');
    case 'grandmother': return T('Grandmother', '할머니');
    case 'father': return T('Father', '아버지');
    case 'mother': return T('Mother', '어머니');
    case 'uncle': return man ? T('Uncle', '숙부') : T('Aunt', '고모');
    case 'cousin': return T('Cousin', '사촌');
    case 'sibling': {
      const older = n.birthYear < g.player.birthYear;
      if (man) return older ? T('Elder brother', playerWoman ? '오라버니' : '형') : T('Younger brother', '남동생');
      return older ? T('Elder sister', playerWoman ? '언니' : '누님') : T('Younger sister', '누이동생');
    }
    case 'spouse': return man ? T('Husband', '남편') : T('Wife', '아내');
    case 'child': return man ? T('Son', '아들') : T('Daughter', '딸');
    case 'grandchild': return man ? T('Grandson', '손자') : T('Granddaughter', '손녀');
    default: return null;
  }
}

/** The portrait as it looks now: hair greys with age, children wear braids. */
export function npcPortrait(g: Game, n: Npc): PortraitSpec {
  const age = npcAge(g, n);
  let p: PortraitSpec = { ...n.portrait };
  if (n.kin === 'child' || n.kin === 'grandchild' || p.kind === 'youth' || p.kind === 'boy') {
    if (age < 15) p = { kind: n.gender === 'woman' ? 'youth' : 'boy', robe: n.gender === 'woman' ? '#D9AFA8' : '#B9C7CF', under: n.gender === 'woman' ? '#8E2230' : '#3E5274' };
    else if (p.kind === 'youth' || p.kind === 'boy') p = n.gender === 'woman' ? { kind: 'lady', robe: '#D8BF73', under: '#8E2230' } : { kind: 'scholar', robe: '#A9C4B4' };
  }
  if (n.gender === 'woman' && p.kind === 'lady' && n.spouse) p = { ...p, kind: 'noblewoman' };
  if (age >= 56) p = { ...p, grey: true };
  if (n.gender === 'man' && age >= 45 && (p.kind === 'scholar' || p.kind === 'minister') && (!p.beard || p.beard === 'auto' || p.beard === 'none')) p = { ...p, beard: age >= 55 ? 'long' : 'short' };
  return p;
}

/** Official robes by grade: green for the junior ranks, blue for the middle, red for the hall-sitting seniors. */
export const RANK_ROBES = ['#3F6B4A', '#2C4A7A', '#9C2A2E'];
export function playerPortrait(g: Game): PortraitSpec {
  const p = g.player;
  const age = g.date.year - p.birthYear;
  const grey = age >= 56;
  // Royal robes for the royal household (GSDD Part VII §3.2).
  if (p.royal === 'king' || p.royal === 'regent' && p.gender === 'man') return { kind: 'king', grey, beard: age >= 45 ? 'long' : age >= 28 ? 'short' : 'none' };
  if (p.royal === 'crownPrince') return { kind: 'king', robe: '#26324F', grey, beard: age >= 28 ? 'short' : 'none' };
  if (p.royal === 'queen' || p.royal === 'queenDowager' || p.royal === 'crownPrincess' || (p.royal === 'regent' && p.gender === 'woman')) {
    return { kind: 'queen', robe: p.royal === 'crownPrincess' ? '#2F5E55' : p.royal === 'queenDowager' || p.royal === 'regent' ? '#5A3A4A' : undefined, grey };
  }
  if (p.gender === 'woman') {
    const married = everMarried(g);
    if (p.mourning && g.dayCount < p.mourning.until) return { kind: married ? 'noblewoman' : 'lady', robe: '#E3DCC8', under: '#CFC5AD', accent: '#BDB39A', grey };
    return { kind: married ? 'noblewoman' : 'lady', robe: p.colors.top, under: p.colors.bottom, accent: married ? p.colors.bottom : undefined, grey };
  }
  const beard = age >= 55 ? 'long' : age >= 32 ? 'short' : 'none';
  // Mourning hemp, then the official's round-collared robe in the colour of his grade (GSDD Part VII §3).
  if (p.mourning && g.dayCount < p.mourning.until) return { kind: 'scholar', robe: '#D8CFB8', under: '#BDB39A', beard, grey };
  if (p.office?.track === 'military') return { kind: 'guard', under: p.colors.bottom, grey };
  if (p.office && p.legal !== 'commoner') return { kind: 'minister', robe: RANK_ROBES[Math.min(3, p.office.rank) - 1], beard, grey };
  return { kind: 'scholar', robe: p.colors.top, under: p.colors.bottom, beard, grey };
}

export function playerName(g: Game): Text {
  const p = g.player;
  return T(`${p.surname.en} ${p.given.en}`, `${p.surname.ko ?? p.surname.en}${p.given.ko ?? p.given.en}`);
}

/** The house the player's children belong to. */
export function childrensHouse(g: Game): { surname: Text; prestige: number } {
  if (g.player.gender === 'woman' && g.marriedInto) return { surname: g.marriedInto.surname, prestige: g.marriedInto.prestige };
  return { surname: g.house.surname, prestige: g.house.prestige };
}

/** Whether someone is at this place today. Family and servants are always home; others come and go. */
export function presentToday(g: Game, n: Npc, placeId: string): boolean {
  if (!n.places.includes(placeId)) return false;
  if (n.kin) return true;
  if (n.post === 'steward' || n.post === 'maid') return roll(g, 'home:' + n.id) < 0.6;
  if (n.places.length > 1) return n.places[Math.floor(roll(g, 'where:' + n.id) * n.places.length)] === placeId;
  return roll(g, 'here:' + n.id) < 0.75;
}

/** Who can be found at a place right now: people the player knows first, then strangers who can be approached. */
export function peopleAt(g: Game, placeId: string, limit = 4): Npc[] {
  if (g.date.phase === 'evening') return [];
  const rank = (n: Npc) => (n.kin ? 2 : 0) + (g.rel[n.id]?.met ? 1 : 0);
  const all = Object.values(g.npcs)
    .filter((n) => n.alive && !n.away && (g.rel[n.id]?.met || n.meet) && presentToday(g, n, placeId))
    .filter((n) => !(n.id === 'king' || (placeId === 'throne-hall' && !g.flags.summoned)))
    .sort((a, b) => rank(b) - rank(a) || (g.rel[b.id]?.regard ?? 0) - (g.rel[a.id]?.regard ?? 0) || roll(g, 'order:' + a.id) - roll(g, 'order:' + b.id));
  // A servant at home keeps one place among the family.
  const staff = all.filter((n) => n.post === 'steward' || n.post === 'maid');
  const rest = all.filter((n) => !staff.includes(n));
  return staff.length ? [...rest.slice(0, limit - 1), staff[0]] : rest.slice(0, limit);
}

export function childrenOf(g: Game): Npc[] {
  return Object.values(g.npcs).filter((n) => n.kin === 'child').sort((a, b) => a.birthYear - b.birthYear);
}

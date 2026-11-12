import type { Game, Npc, Text } from '../model/schemas';
import { ROSTER, ROYAL_IDS, rosterEntry } from '../content/court';
import { GIVEN_NAMES, MATCH_SURNAMES } from '../content/families';
import { makeRel } from '../content/cast';
import { T } from './text';
import { roll } from './world';

/**
 * Who holds the royal titles, and who fills the court's posts.
 * Royal titles pass by succession: when a king dies, his queen becomes the queen dowager and
 * the queen dowager becomes the grand queen dowager, keeping what the player built with each of them.
 */

/**
 * Years when Joseon had a named crown prince or heir apparent, from designation to accession or death.
 * Approximate, from the standard king lists: have them reviewed with the reign list in history.ts.
 */
const HEIR_YEARS: [number, number][] = [
  [1421, 1450], [1450, 1452], [1455, 1468], [1483, 1494], [1502, 1506], [1520, 1544], [1557, 1563],
  [1592, 1608], [1608, 1623], [1625, 1649], [1651, 1659], [1667, 1674], [1690, 1720], [1721, 1724],
  [1725, 1728], [1736, 1776], [1784, 1786], [1812, 1830], [1875, 1897],
];
const heirIndex = (year: number) => HEIR_YEARS.findIndex(([a, b]) => year >= a && year < b);
/** How long a grand queen dowager is seen at court, in days, before she dies. */
const GQD_YEARS = 9;

const woman = (g: Game) => g.player.gender === 'woman';

/** A fresh holder of a roster post for the current year. */
function fresh(g: Game, id: string): Npc | null {
  const r = rosterEntry(id);
  if (!r || (r.in && !r.in(g.campaign))) return null;
  return { ...r.make(g.date.year, woman(g), g.campaign), id, places: [...r.places] };
}

/** Adds anyone on the court roster this world is missing, for new worlds, older saves and new generations. */
export function ensureCourt(g: Game) {
  for (const r of ROSTER) {
    if (g.npcs[r.id] || (r.in && !r.in(g.campaign))) continue;
    const n = fresh(g, r.id);
    if (!n) continue;
    g.npcs[r.id] = n;
    g.rel[r.id] = makeRel(r.regard, !!r.known);
  }
  royalPresence(g);
}

/** Puts each royal at court or out of sight, by campaign and date. */
export function royalPresence(g: Game, say?: (t: Text) => void) {
  const c = g.campaign;
  const alt = c.mode === 'alternative';
  const y = g.date.year;
  const want: Record<string, boolean> = {
    'queen-dowager': true,
    'queen-consort': !(alt && c.premise === 'queen'),
    'royal-consort': !(alt && c.premise === 'queen'),
    princess: true,
    'elder-prince': alt && c.premise === 'heirs',
    'younger-prince': alt && c.premise === 'heirs',
  };

  // The grand queen dowager: from the start in two alternative courts; in history, after a reign changes.
  if (alt && c.premise !== 'peace' && g.flagDays['gqd-from'] === undefined && !g.flags['gqd-gone']) g.flagDays['gqd-from'] = 0;
  const gqdFrom = g.flagDays['gqd-from'];
  let gqd = gqdFrom !== undefined && !g.flags['gqd-gone'];
  if (gqd && g.dayCount - gqdFrom > GQD_YEARS * 360) {
    gqd = false;
    g.flags['gqd-gone'] = true;
    if (g.rel['grand-queen-dowager']?.met) say?.(T('The Grand Queen Dowager has died. The court is in mourning.', '대왕대비마마께서 승하하셨다. 온 조정이 상을 치른다.'));
  }
  want['grand-queen-dowager'] = gqd;

  // The crown prince and his wife.
  if (alt) {
    want['crown-prince'] = c.premise === 'peace';
    want['crown-princess'] = c.premise === 'peace' && (!!g.flags['wedding-done'] || y >= c.era + 5);
  } else {
    const i = heirIndex(y);
    const prev = g.flagDays['heir-range'];
    if (i >= 0 && i !== prev) {
      const [from] = HEIR_YEARS[i];
      for (const id of ['crown-prince', 'crown-princess']) {
        const n = fresh(g, id);
        if (!n) continue;
        n.birthYear = from - (id === 'crown-prince' ? 8 : 7);
        g.npcs[id] = n;
        g.rel[id] = makeRel(rosterEntry(id)!.regard, false);
      }
      if (prev !== undefined && say) say(T('A new crown prince has been named. The court bows to the heir.', '새 세자가 책봉되었다. 조정이 세자 저하께 예를 올린다.'));
      g.flagDays['heir-range'] = i;
    }
    want['crown-prince'] = i >= 0;
    want['crown-princess'] = i >= 0 && y >= HEIR_YEARS[i][0] + 3;
  }

  for (const id of ROYAL_IDS) {
    const n = g.npcs[id];
    const r = rosterEntry(id);
    if (!n || !r) continue;
    const here = !!want[id];
    n.away = !here;
    n.places = here ? [...r.places] : [];
  }
}

/** A new reign: the queen becomes the queen dowager, the queen dowager the grand queen dowager. */
export function royalSuccession(g: Game, playerRole: string = 'none') {
  if (g.campaign.mode !== 'historical') return;
  // The player's own place in the household moves on its own (politics.reignChanged).
  const playerQueen = playerRole === 'queen' || playerRole === 'crownPrincess';
  const move = (from: string, to: string) => {
    const old = g.npcs[from];
    const n = fresh(g, to);
    if (!old || !n) return;
    n.birthYear = old.birthYear;
    g.npcs[to] = n;
    g.rel[to] = { ...g.rel[from], bond: 'none' };
  };
  move('queen-dowager', 'grand-queen-dowager');
  if (playerRole !== 'queen') move('queen-consort', 'queen-dowager');
  else if (g.npcs['queen-dowager']) g.npcs['queen-dowager'].away = true;
  g.flagDays['gqd-from'] = g.dayCount;
  g.flags['gqd-gone'] = false;
  // A new queen, consort and princess for the new king.
  const king = g.npcs.king;
  for (const id of ['queen-consort', 'royal-consort', 'princess']) {
    if (id === 'queen-consort' && playerQueen && playerRole === 'crownPrincess') continue;
    const n = fresh(g, id);
    if (!n) continue;
    if (id === 'queen-consort' && king) n.birthYear = king.birthYear + 2;
    if (id === 'royal-consort' && king) n.birthYear = king.birthYear + 8;
    if (id === 'princess') n.birthYear = g.date.year - 9;
    g.npcs[id] = n;
    g.rel[id] = makeRel(rosterEntry(id)!.regard, false);
  }
}

const SERVANT_NAMES: Record<'man' | 'woman', Text[]> = {
  man: [T('Dol-soe', '돌쇠'), T('Mak-dong', '막동'), T('Man-seok', '만석'), T('Gap-dol', '갑돌')],
  woman: [T('Ok-i', '옥이'), T('Bun-i', '분이'), T('Geum-i', '금이'), T('Kkot-bun', '꽃분')],
};

/** When the holder of a post dies, someone new takes it under the same id. Returns news for the report. */
export function succeedPost(g: Game, dead: Npc): Text | null {
  const r = rosterEntry(dead.id);
  if (!r?.successor || r.royal) return null;
  const s = r.successor;
  const key = `succ:${dead.id}:${g.date.year}`;
  const age = s.ages[0] + Math.floor(roll(g, key + ':age') * (s.ages[1] - s.ages[0] + 1));
  const base = fresh(g, dead.id);
  if (!base) return null;
  let name: Text;
  let given: Text;
  if (s.servant) {
    const pool = SERVANT_NAMES[dead.gender];
    given = pool[Math.floor(roll(g, key + ':n') * pool.length)];
    name = given;
  } else {
    const fam = MATCH_SURNAMES[Math.floor(roll(g, key + ':s') * MATCH_SURNAMES.length)];
    given = GIVEN_NAMES[dead.gender][Math.floor(roll(g, key + ':n') * GIVEN_NAMES[dead.gender].length)];
    name = s.minister
      ? T(`Minister ${fam.surname.en} ${given.en}`, `${fam.surname.ko}${given.ko} 대감`)
      : T(`${s.title.en} ${fam.surname.en} ${given.en}`, `${s.title.ko} ${fam.surname.ko}${given.ko}`);
    if (s.minister) base.house = { surname: fam.surname, prestige: 4, faction: base.faction, background: 'political' };
  }
  g.npcs[dead.id] = { ...base, name, given, birthYear: g.date.year - age };
  g.rel[dead.id] = makeRel(Math.round(r.regard / 2), !!r.known);
  return T(`${name.en} takes the post of ${s.title.en.toLowerCase()}.`, `${name.ko}${'이(가)'} ${s.title.ko} 자리를 이어받았다.`);
}

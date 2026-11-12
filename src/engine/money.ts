import type { Game, House, Text } from '../model/schemas';
import { T } from './text';
import { clamp, livingSpouse, roll } from './world';

/**
 * Money is counted in nyang (냥), the unit of the copper coins strung by the hundred.
 * A season brings household income and, with office, a salary; the household costs something to keep.
 * The house's wealth tier follows the purse, and a richer house earns more.
 */

export type Wealth = House['wealth'];
export const WEALTH_ORDER: Wealth[] = ['poor', 'modest', 'comfortable', 'rich'];
/** Where each tier begins, in nyang. The last band runs to the top of the bar. */
const TIER_FLOOR: Record<Wealth, number> = { poor: 0, modest: 150, comfortable: 700, rich: 2800 };
const BAR_TOP = 12000;

export const START_MONEY: Record<Wealth, number> = { poor: 60, modest: 260, comfortable: 950, rich: 3400 };
/** What the market charges for each kind of gift. */
export const PRICES: Record<string, number> = { poems: 12, paper: 8, fan: 10, pouch: 15 };
export const PHYSICIAN_FEE = 30;
export const INVEST_STAKE = 100;

/** Rents and harvests from the family's land, per season. A grander house earns more and spends more. */
const HOUSEHOLD_INCOME: Record<Wealth, number> = { poor: 25, modest: 50, comfortable: 110, rich: 220 };
const UPKEEP: Record<Wealth, number> = { poor: 12, modest: 32, comfortable: 92, rich: 205 };
/** Office salary per season, by rank 1 to 5. */
const SALARY = [0, 20, 35, 55, 80, 110];

export function wealthOf(money: number): Wealth {
  if (money >= TIER_FLOOR.rich) return 'rich';
  if (money >= TIER_FLOOR.comfortable) return 'comfortable';
  if (money >= TIER_FLOOR.modest) return 'modest';
  return 'poor';
}

/** Where the purse sits on a four-band bar, 0 to 100. Each band is a quarter; within a band the scale is logarithmic. */
export function wealthBar(money: number): number {
  const w = wealthOf(money);
  const i = WEALTH_ORDER.indexOf(w);
  const lo = TIER_FLOOR[w];
  const hi = i < 3 ? TIER_FLOOR[WEALTH_ORDER[i + 1]] : BAR_TOP;
  const f = clamp((Math.log(money + 1) - Math.log(lo + 1)) / (Math.log(hi + 1) - Math.log(lo + 1)), 0, 1);
  return Math.round((i + f) * 25);
}

export const formatMoney = (n: number, lang: 'en' | 'ko') => (lang === 'ko' ? `${n.toLocaleString('en-US')}냥` : `${n.toLocaleString('en-US')} nyang`);
export const moneyText = (n: number): Text => T(`${n.toLocaleString('en-US')} nyang`, `${n.toLocaleString('en-US')}냥`);

export type Accounts = { household: number; salary: number; upkeep: number; total: number };

/** One season's income and costs. */
export function seasonAccounts(g: Game): Accounts {
  // A married woman's household is her husband's, whose standing sets its means.
  const tier = g.marriedInto ? wealthOf(g.player.money) : g.house.wealth;
  const household = g.marriedInto ? 30 + g.marriedInto.prestige * 25 : HOUSEHOLD_INCOME[tier];
  const salary = SALARY[g.player.office?.rank ?? 0];
  const kids = Object.values(g.npcs).filter((n) => n.alive && n.kin === 'child' && n.parents.includes('player') && !(n.gender === 'woman' && n.spouse)).length;
  const upkeep = (g.marriedInto ? 15 + g.marriedInto.prestige * 17 : UPKEEP[tier]) + kids * 4 + (livingSpouse(g) ? 5 : 0);
  return { household, salary, upkeep, total: household + salary - upkeep };
}

/** Settles any silk shipment from the market. The household's own accounts are kept in econ.ts. */
export function settleSeason(g: Game): Text[] {
  const out: Text[] = [];
  const stake = g.counts['invest-pending'] ?? 0;
  if (stake > 0) {
    g.counts['invest-pending'] = 0;
    // Wit helps pick honest partners. The shipment can be lost at sea.
    const r = roll(g, 'invest');
    const mult = r < 0.18 ? 0 : 0.7 + r * 1.3 + g.player.qualities.wit / 250;
    const back = Math.round(stake * mult);
    g.player.money += back;
    out.push(back === 0
      ? T(`The silk shipment was lost on the Yellow Sea. The ${stake} nyang are gone.`, `비단 배가 서해에서 침몰했다. ${stake}냥을 잃었다.`)
      : T(`The silk shipment came in: ${back} nyang back on ${stake}.`, `비단 배가 들어왔다. ${stake}냥을 넣어 ${back}냥을 돌려받았다.`));
    if (back > 0) g.counts['invest-wins'] = (g.counts['invest-wins'] ?? 0) + 1;
  }
  return out;
}

/** Spends money, never below nothing. Returns what was actually spent. */
export function spend(g: Game, amount: number): number {
  // The purse first; whoever holds the keys can dip into the family treasury.
  const fromPurse = Math.min(g.player.money, amount);
  g.player.money -= fromPurse;
  let rest = amount - fromPurse;
  const keys = g.econ && (g.econ.role === 'head' || g.econ.role === 'admin');
  if (rest > 0 && keys) {
    const more = Math.min(g.econ.treasury, rest);
    g.econ.treasury -= more;
    rest -= more;
  }
  return amount - rest;
}
/** What the player can spend right now: the purse, and the treasury for whoever holds the keys. */
export const spendable = (g: Game) => g.player.money + (g.econ && (g.econ.role === 'head' || g.econ.role === 'admin') ? g.econ.treasury : 0);

export const WEALTH_WORDS: Record<Wealth, Text> = {
  poor: T('Poor', '가난한 형편'), modest: T('Modest', '넉넉지 않은 형편'), comfortable: T('Comfortable', '넉넉한 형편'), rich: T('Rich', '부유한 형편'),
};

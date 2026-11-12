import { automated, economyMul } from './difficulty';
import { certificate, emit } from './bus';
import type { Business, Estate, Game, Ledger, ProvinceState, Staff, Text } from '../model/schemas';
import {
  ALLOWANCE, BUILDINGS, BUSINESS_KINDS, DISASTERS, ESTATE_KINDS, GOODS, HOUSEHOLD_BASE, LENDERS, PROVINCES, SEASON_WEATHER, SERVANT_WAGE,
  STAFF_ROLES, TRAVEL, buildingById, businessKind, estateKind, goodById, provinceById, staffRole,
} from '../content/economy';
import { T } from './text';
import { clamp, clone, roll } from './world';
import { addDays, seasonOf } from './time';
import { WEALTH_ORDER, wealthOf, type Wealth } from './money';

/**
 * GSDD Part III, simplified to serve the main loop (Simplified Scope §6): the family treasury is kept apart
 * from the player's purse; estates, staff and businesses settle once a season; regional prices and weather
 * give the numbers a reason. Routine work is delegated; the player makes the big decisions.
 */

type Say = (t: Text, record?: boolean) => void;
export type Acct = 'purse' | 'house';
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const nyang = (n: number) => T(`${fmt(n)} nyang`, `${fmt(n)}냥`);
const uid = (g: Game, p: string) => `${p}-${g.dayCount}-${Math.floor(roll(g, 'uid:' + p + JSON.stringify(g.econ.estates.length + g.econ.businesses.length + g.econ.staff.length)) * 1e6)}`;

// ---------------------------------------------------------------- who holds the keys

/** head: runs the house; admin: its mistress; member: lives on an allowance. */
export function econRole(g: Game): Game['econ']['role'] {
  if (!g.player.alive) return 'none';
  if (g.player.legal === 'commoner') return 'head';
  if (g.date.year - g.player.birthYear < 15) return 'member';
  if (g.player.gender === 'woman' && g.marriedInto) return 'admin';
  const father = g.npcs.father;
  if (father && father.alive && !father.away) return 'member';
  return g.player.gender === 'man' ? 'head' : 'admin';
}
export const holdsKeys = (g: Game) => g.econ.role === 'head' || g.econ.role === 'admin';

export function balance(g: Game, acct: Acct) {
  return acct === 'purse' ? g.player.money : g.econ.treasury;
}
function credit(g: Game, acct: Acct, d: number) {
  if (acct === 'purse') g.player.money = Math.max(0, Math.round(g.player.money + d));
  else g.econ.treasury = Math.max(0, Math.round(g.econ.treasury + d));
}
/** Pays from one account, falling back to the treasury for a player who holds the keys. Returns what was paid. */
export function pay(g: Game, amount: number, acct: Acct = 'purse'): number {
  const first = Math.min(balance(g, acct), amount);
  credit(g, acct, -first);
  let rest = amount - first;
  if (rest > 0 && acct === 'purse' && holdsKeys(g)) {
    const more = Math.min(g.econ.treasury, rest);
    g.econ.treasury -= more;
    rest -= more;
  }
  return amount - rest;
}
export const canPay = (g: Game, amount: number, acct: Acct = 'purse') =>
  balance(g, acct) + (acct === 'purse' && holdsKeys(g) ? g.econ.treasury : 0) >= amount;

/** Family wealth band follows what the house can actually spend. */
export const houseWealth = (g: Game): Wealth => wealthOf(g.econ.treasury + g.player.money);

// ---------------------------------------------------------------- starting a household

const STEWARDS = [T('Kim', '김'), T('Pak', '박'), T('Choe', '최'), T('Jeong', '정'), T('Yi', '이'), T('Jo', '조'), T('Gang', '강'), T('Seo', '서')];
function staffName(g: Game, role: string): Text {
  const s = STEWARDS[Math.floor(roll(g, 'staff-name:' + role + g.econ.staff.length) * STEWARDS.length)];
  const r = staffRole(role);
  const title: Record<string, Text> = {
    steward: T('Steward', '집사'), manager: T('Overseer', '마름'), clerk: T('Clerk', '서사'), tutor: T('Master', '훈장'),
    physician: T('Physician', '의원'), attendant: T('Attendant', '몸종'), cook: T('Cook', '찬모'), guard: T('Watchman', '청지기'), messenger: T('Runner', '심부름꾼'),
  };
  const t = title[role] ?? r.name;
  return T(`${t.en} ${s.en}`, `${s.ko} ${t.ko}`);
}
export function makeStaff(g: Game, role: string, skill?: number): Staff {
  const r = staffRole(role);
  const sk = skill ?? Math.round(35 + roll(g, 'staff-skill:' + role + g.dayCount) * 45);
  return { id: uid(g, 'st-' + role), role, name: staffName(g, role), skill: sk, loyalty: 60, wage: Math.round(r.wage * (0.7 + sk / 120)) };
}
export function makeServants(count: number): Staff {
  return { id: 'servants', role: 'servants', name: T('Household servants', '집안 하인'), skill: 50, loyalty: 60, wage: count * SERVANT_WAGE, count };
}

function estate(g: Game, kind: string, province: string, area: number, extra: Partial<Estate> = {}): Estate {
  const k = estateKind(kind);
  const p = provinceById(province);
  return {
    id: uid(g, 'es-' + kind + province), kind, province, area,
    name: kind === 'town' ? T('Family residence', '본가') : T(`${k.name.en}, ${p.name.en}`, `${p.name.ko} ${k.name.ko}`),
    value: Math.round(k.value * (kind === 'town' ? 0.5 + area / 20 : area / 10)),
    condition: 70, productivity: 50, security: 50, buildings: [], works: null, care: 1, manager: null, ...extra,
  };
}

function freshProvinces(g: Game): Record<string, ProvinceState> {
  const out: Record<string, ProvinceState> = {};
  for (const p of PROVINCES) out[p.id] = { weather: 'clear', disaster: null, warn: null, prices: {}, stability: 70 };
  g.econ.provinces = out;
  updatePrices(g);
  return g.econ.provinces;
}

/** Sets up estates, staff and the treasury for a new life. `wealth` is the family's band. */
export function initEcon(g: Game, wealth: Wealth, startMoney: number) {
  g.econ = { treasury: startMoney, role: 'member', estates: [], staff: [], businesses: [], debts: [], cargo: [], provinces: {}, ledger: [], stores: 1 };
  const home = g.house.background === 'military' || g.house.background === 'declining' ? 'chungcheong' : g.house.background === 'landed' ? 'jeolla' : 'gyeonggi';
  const plan: Record<Wealth, [string, string, number][]> = {
    poor: [['town', 'hanseong', 6], ['farm', home, 8]],
    modest: [['town', 'hanseong', 10], ['farm', home, 16], ['forest', 'gangwon', 6]],
    comfortable: [['town', 'hanseong', 14], ['farm', home, 24], ['forest', 'gangwon', 10], ['shops', 'hanseong', 10]],
    rich: [['town', 'hanseong', 20], ['farm', home, 32], ['farm', 'jeolla', 16], ['forest', 'gangwon', 15], ['shops', 'hanseong', 15], ['villa', 'gyeonggi', 10]],
  };
  for (const [kind, prov, area] of plan[wealth]) g.econ.estates.push(estate(g, kind, prov, area));
  const town = g.econ.estates[0];
  if (wealth === 'rich' || wealth === 'comfortable') town.buildings.push('shrine', 'storehouse');
  if (wealth === 'rich') town.buildings.push('library', 'garden', 'pavilion');
  if (g.house.background === 'scholarly' || g.house.background === 'noble') town.buildings.push('library');
  if (g.house.background === 'military') town.buildings.push('stable');
  town.buildings = [...new Set(town.buildings)];
  const servants: Record<Wealth, number> = { poor: 1, modest: 3, comfortable: 6, rich: 12 };
  g.econ.staff.push(makeServants(servants[wealth]));
  if (wealth !== 'poor') {
    const st = makeStaff(g, 'steward', 55);
    if (g.npcs.steward) { st.npc = 'steward'; st.name = g.npcs.steward.name; }
    g.econ.staff.push(st);
  }
  if (g.npcs.maid) g.econ.staff.push({ ...makeStaff(g, 'attendant', 50), npc: 'maid', name: g.npcs.maid.name });
  if (wealth === 'comfortable' || wealth === 'rich') g.econ.staff.push(makeStaff(g, 'manager'), makeStaff(g, 'tutor'));
  if (wealth === 'rich') g.econ.staff.push(makeStaff(g, 'clerk'), makeStaff(g, 'physician'), makeStaff(g, 'guard'), makeStaff(g, 'cook'));
  if (g.house.background === 'declining') g.econ.debts.push({ id: 'old-debt', lender: LENDERS[1].name, principal: 400, rate: LENDERS[1].rate, since: g.dayCount, acct: 'house' });
  freshProvinces(g);
  g.econ.role = econRole(g);
}

/** A married woman runs her husband's household: it replaces her father's in her accounts. */
export function marryInto(g: Game, prestige: number) {
  const band: Wealth = prestige >= 5 ? 'rich' : prestige >= 4 ? 'comfortable' : prestige >= 2 ? 'modest' : 'poor';
  const keepProv = g.econ.provinces;
  const purse = g.player.money;
  const background = g.house.background;
  initEcon(g, band, Math.round([180, 400, 900, 2400][WEALTH_ORDER.indexOf(band)]));
  g.house.background = background;
  g.econ.provinces = keepProv;
  g.player.money = purse;
  g.econ.role = econRole(g);
}

// ---------------------------------------------------------------- markets, weather and disasters

export function price(g: Game, prov: string, good: string): number {
  return g.econ.provinces[prov]?.prices[good] ?? goodById(good).base;
}

function updatePrices(g: Game) {
  const s = seasonOf(g.date.moon);
  for (const p of PROVINCES) {
    const st = g.econ.provinces[p.id];
    if (!st) continue;
    for (const good of GOODS) {
      let v = good.base * (p.makes.includes(good.id) ? 0.75 : p.id === 'hanseong' ? 1.2 : 1.1);
      if (good.id === 'rice') v *= [1.2, 1.3, 0.75, 0.95][s];
      if (st.disaster && DISASTERS[st.disaster]?.hurts.includes(good.id)) v *= 1.6;
      v *= 0.9 + roll(g, `price:${p.id}:${good.id}`) * 0.2;
      st.prices[good.id] = Math.max(1, Math.round(v));
    }
  }
}

function weatherAndDisasters(g: Game, say: Say) {
  const s = seasonOf(g.date.moon);
  const strife = g.campaign.rules?.strife ?? 3;
  for (const p of PROVINCES) {
    const st = g.econ.provinces[p.id];
    if (!st) continue;
    const pool = SEASON_WEATHER[s].filter((w) => !(w === 'snow' && !p.north && roll(g, 'snowsouth:' + p.id) < 0.5));
    st.weather = pool[Math.floor(roll(g, 'weather:' + p.id) * pool.length)];
    // A warning comes true more often than not; preparation is the point of it.
    st.disaster = null;
    if (st.warn && DISASTERS[st.warn].seasons.includes(s) && roll(g, 'disaster:' + p.id) < 0.65) st.disaster = st.warn;
    else if (roll(g, 'surprise:' + p.id) < 0.015) {
      const can = Object.keys(DISASTERS).filter((d) => DISASTERS[d].seasons.includes(s));
      st.disaster = can[Math.floor(roll(g, 'surprise-kind:' + p.id) * can.length)] ?? null;
    }
    if (st.disaster === 'storm' || st.disaster === 'flood') st.weather = 'storm';
    if (st.disaster === 'freeze') st.weather = 'cold';
    st.warn = null;
    const next = (s + 1) % 4;
    if (roll(g, 'warn:' + p.id) < 0.07) {
      const can = Object.keys(DISASTERS).filter((d) => DISASTERS[d].seasons.includes(next));
      st.warn = can[Math.floor(roll(g, 'warn-kind:' + p.id) * can.length)] ?? null;
    }
    st.stability = clamp(st.stability + (st.disaster ? -8 : 2) - (strife - 3), 20, 95);
  }
  const ours = new Set(g.econ.estates.map((e) => e.province).concat(['hanseong']));
  for (const p of PROVINCES) {
    const st = g.econ.provinces[p.id];
    if (st?.disaster && ours.has(p.id)) {
      const d = DISASTERS[st.disaster];
      say(T(`${d.name.en} in ${p.name.en}: ${d.text.en.charAt(0).toLowerCase()}${d.text.en.slice(1)}`, `${p.name.ko}에 ${d.name.ko}: ${d.text.ko}`), true);
    }
    if (st?.warn && ours.has(p.id)) {
      const d = DISASTERS[st.warn];
      say(T(`From ${p.name.en}: ${d.warn.en.charAt(0).toLowerCase()}${d.warn.en.slice(1)} (Risk of ${d.name.en.toLowerCase()} next season.)`, `${p.name.ko}에서 온 소식: ${d.warn.ko} (다음 철에 ${d.name.ko} 우려)`));
    }
  }
}

// ---------------------------------------------------------------- the seasonal settlement

const SEASON_YIELD: Record<string, number[]> = { farm: [0.4, 0.6, 2.4, 0.6], forest: [1, 0.8, 1.1, 1.1], shops: [1, 1, 1, 1] };

export function estateIncome(g: Game, e: Estate): number {
  const k = estateKind(e.kind);
  if (!k.income) return 0;
  const s = seasonOf(g.date.moon);
  const st = g.econ.provinces[e.province];
  let v = (k.income * e.area) / 10;
  v *= (SEASON_YIELD[e.kind] ?? [1, 1, 1, 1])[s];
  v *= 0.5 + e.productivity / 100;
  v *= 0.55 + e.condition / 220;
  if (e.kind === 'farm') {
    if (e.buildings.includes('weir')) v *= 1.12;
    if (e.buildings.includes('mill')) v *= 1.1;
    const w = st?.weather;
    v *= w === 'storm' ? 0.85 : w === 'heat' ? 0.92 : w === 'clear' ? 1.05 : 1;
  }
  if (e.kind === 'shops') v *= 0.7 + (st?.stability ?? 70) / 230;
  if (st?.disaster) {
    const d = DISASTERS[st.disaster];
    const hit = d.hurts.includes(k.good ?? '-') || (e.kind === 'shops' && st.disaster === 'epidemic');
    if (hit) {
      let loss = st.disaster === 'drought' && e.buildings.includes('weir') ? 0.25 : 0.45;
      if (g.econ.estates.some((x) => x.buildings.includes('storehouse'))) loss *= 0.75;
      v *= 1 - loss;
    }
  }
  // Sandbox: the weight of taxation on the land.
  const tax = g.campaign.mode === 'alternative' ? 1 - ((g.campaign.rules?.tax ?? 3) - 3) * 0.06 : 1;
  return Math.max(0, Math.round(v * economyMul(g) * tax));
}

export function upkeepOf(g: Game) {
  const band = houseWealth(g);
  const base = HOUSEHOLD_BASE[band];
  const wages = g.econ.staff.reduce((n, s) => n + s.wage, 0);
  const buildings = g.econ.estates.reduce((n, e) => n + e.buildings.reduce((m, b) => m + (buildingById(b)?.upkeep ?? 0), 0), 0);
  const care = g.econ.estates.reduce((n, e) => n + Math.round(e.value * [0, 0.002, 0.006][e.care]), 0);
  const kids = Object.values(g.npcs).filter((n) => n.alive && n.kin === 'child' && n.parents.includes('player') && !(n.gender === 'woman' && n.spouse)).length;
  const spouse = Object.values(g.npcs).some((n) => n.alive && g.rel[n.id]?.bond === 'spouse') ? 5 : 0;
  return { base, wages, buildings, care, family: kids * 3 + spouse, total: base + wages + buildings + care + kids * 3 + spouse };
}

const SALARY = [0, 20, 35, 55, 80, 110];

/** Runs once a season. Returns nothing; writes to the report through `say` and to the ledger. */
export function settleEcon(g: Game, say: Say) {
  g.econ.role = econRole(g);
  const lines: Ledger['lines'] = [];
  const book = (text: Text, d: number, acct: Ledger['lines'][number]['acct']) => {
    if (Math.round(d) !== 0) lines.push({ text, d: Math.round(d), acct });
  };
  weatherAndDisasters(g, say);
  updatePrices(g);
  const s = seasonOf(g.date.moon);
  const keys = holdsKeys(g);
  const steward = g.econ.staff.find((x) => x.role === 'steward');
  const manager = g.econ.staff.find((x) => x.role === 'manager');
  const clerk = g.econ.staff.find((x) => x.role === 'clerk');
  const guard = g.econ.staff.find((x) => x.role === 'guard');

  // Estates: income, wear, building works.
  let income = 0;
  if (automated(g) && keys) {
    for (const e of g.econ.estates) {
      if (e.condition < 45 && g.econ.treasury >= 80) {
        g.econ.treasury -= 60;
        e.condition = clamp(e.condition + 15, 0, 100);
        book(T(`Steward’s repairs at ${e.name.en.toLowerCase()}`, `집사의 ${e.name.ko} 보수`), -60, 'house');
      }
    }
  }
  for (const e of g.econ.estates) {
    const v = estateIncome(g, e);
    if (v) {
      income += v;
      book(T(`${e.name.en}: ${s === 2 && e.kind === 'farm' ? 'harvest' : 'income'}`, `${e.name.ko}: ${s === 2 && e.kind === 'farm' ? '추수' : '수입'}`), v, 'house');
    }
    e.condition = clamp(e.condition + [-4, 0, 2][e.care] - (g.econ.provinces[e.province]?.disaster && ['flood', 'storm'].includes(g.econ.provinces[e.province].disaster!) ? 10 : 0), 5, 100);
    if (e.kind !== 'town' && e.kind !== 'villa') {
      const looked = (manager && manager.loyalty > 35) || e.seen === g.date.year;
      const cap = 55 + (manager ? manager.skill / 3 : 0) + (e.buildings.includes('tenants') ? 8 : 0);
      // Without a manager or a visit, an estate drifts toward middling; with one it climbs toward what the manager can manage.
      const aim = looked ? cap : 45;
      e.productivity = clamp(e.productivity + Math.sign(aim - e.productivity), 15, 95);
    }
    const k = estateKind(e.kind);
    e.value = Math.round(k.value * (e.kind === 'town' ? 0.5 + e.area / 20 : e.area / 10) * (0.6 + e.condition / 250) + e.buildings.reduce((n, b) => n + (buildingById(b)?.cost ?? 0) * 0.6, 0));
    if (e.works) {
      e.works.left -= 1;
      if (e.works.left <= 0) {
        const b = buildingById(e.works.id);
        e.buildings.push(e.works.id);
        e.works = null;
        if (b) {
          say(T(`The ${b.name.en.toLowerCase()} at ${e.name.en.toLowerCase()} is finished.`, `${e.name.ko}의 ${b.name.ko}이(가) 완공되었다.`), true);
          if (b.prestige) g.player.reputation = clamp(g.player.reputation + b.prestige * 2, 0, 100);
          if (b.id === 'shrine') g.player.honour = clamp(g.player.honour + 5, 0, 100);
        }
      }
    }
  }

  // The household: base costs, wages, upkeep, children and the steward's care.
  const up = upkeepOf(g);
  const leak = Math.round(income * (steward ? Math.max(0, 0.06 - steward.skill / 1500) : 0.08));
  book(T('Food, clothing and fuel', '식량, 의복, 땔감'), -up.base, 'house');
  if (up.wages) book(T('Wages of the household', '식솔 품삯'), -up.wages, 'house');
  if (up.buildings + up.care) book(T('Upkeep of buildings and land', '건물과 토지 관리'), -(up.buildings + up.care), 'house');
  if (up.family) book(T('Spouse and children', '배우자와 자녀'), -up.family, 'house');
  if (leak) book(T('Lost to waste and pilfering', '낭비와 좀도둑'), -leak, 'house');
  if (s === 2) {
    const rites = 10 + g.house.prestige * 6;
    book(T('Autumn ancestral rites', '가을 시제'), -rites, 'house');
  }

  // Stores of grain: filled after harvest, drawn when a disaster strikes home.
  const homeProv = g.econ.estates.find((e) => e.kind === 'farm')?.province ?? 'gyeonggi';
  if (s === 2) g.econ.stores = Math.min(g.econ.stores + 1, g.econ.estates.some((e) => e.buildings.includes('storehouse')) ? 4 : 2);
  if (g.econ.provinces[homeProv]?.disaster && g.econ.stores > 0) {
    g.econ.stores -= 1;
    book(T('Grain from the stores softened a bad season', '곳간의 곡식으로 흉한 철을 넘겼다'), Math.round(up.base * 0.6), 'house');
  }

  // Staff morale: unpaid or ill-treated people steal, or leave.
  const pressed = g.econ.treasury + lines.reduce((n, l) => n + (l.acct === 'house' ? l.d : 0), 0) < 0;
  for (const st of g.econ.staff) {
    st.loyalty = clamp(st.loyalty + (pressed ? -12 : 2) + (st.wage >= staffRoleWage(st) * 1.2 ? 2 : 0), 0, 100);
  }
  const disloyal = g.econ.staff.find((x) => x.loyalty < 30 && x.role !== 'servants');
  if (disloyal && roll(g, 'theft') < (guard ? 0.12 : 0.3)) {
    const lost = Math.min(220, Math.round(g.econ.treasury * (0.05 + roll(g, 'theft-size') * 0.1)));
    if (lost > 0) {
      book(T(`Missing from the strongbox; ${disloyal.name.en} is suspected`, `금고에서 돈이 사라졌다. ${disloyal.name.ko}이(가) 의심받는다`), -lost, 'house');
      say(T(`${lost} nyang went missing from the strongbox. Suspicion falls on ${disloyal.name.en}.`, `금고에서 ${lost}냥이 사라졌다. ${disloyal.name.ko}에게 의심이 쏠린다.`), true);
    }
  }

  // Businesses.
  for (const b of g.econ.businesses) {
    const r = runBusiness(g, b, !!clerk);
    b.last = r.profit;
    if (r.event) say(r.event, true);
    const back = b.aim === 'growth' && r.profit > 0 ? Math.round(r.profit / 2) : 0;
    b.capital = Math.max(0, b.capital + back + (r.capitalHit ?? 0));
    book(T(`${b.name.en}: ${r.profit >= 0 ? 'profit' : 'loss'}`, `${b.name.ko}: ${r.profit >= 0 ? '이익' : '손실'}`), r.profit - back, b.owner);
  }

  // Consignments arrive and are sold at the market they were sent to.
  for (const c of g.econ.cargo) {
    const lost = provinceById(c.from).days + provinceById(c.to).days >= 9 && roll(g, 'cargo-loss:' + c.good + c.to) < 0.08;
    const g2 = goodById(c.good);
    if (lost) {
      say(T(`The ${g2.name.en.toLowerCase()} sent to ${provinceById(c.to).name.en} was lost on the road.`, `${provinceById(c.to).name.ko}로 보낸 ${g2.name.ko}이(가) 길에서 사라졌다.`), true);
      continue;
    }
    const got = Math.round(c.qty * price(g, c.to, c.good) * 0.95);
    book(T(`Sold ${c.qty} ${g2.unit.en}s of ${g2.name.en.toLowerCase()} in ${provinceById(c.to).name.en} (paid ${c.paid})`, `${provinceById(c.to).name.ko}에서 ${g2.name.ko} ${c.qty}${g2.unit.ko} 판매 (산 값 ${c.paid})`), got, c.owner);
    g.counts['trades'] = (g.counts['trades'] ?? 0) + 1;
  }
  g.econ.cargo = [];

  // Debts gather interest; a ruinous debt brings creditors to the gate.
  for (const d of g.econ.debts) {
    const interest = Math.round(d.principal * d.rate);
    d.principal += interest;
    if (interest) lines.push({ text: T(`Interest owed to ${d.lender.en.toLowerCase()} (added to the debt)`, `${d.lender.ko}에게 진 빚의 이자 (빚에 더해짐)`), d: 0, acct: d.acct });
  }
  const owed = g.econ.debts.reduce((n, d) => n + d.principal, 0);
  if (owed > 2500 && keys && roll(g, 'creditors') < 0.3) {
    const sellable = g.econ.estates.filter((e) => e.kind !== 'town').sort((a, b) => a.value - b.value)[0];
    if (sellable) {
      g.econ.estates = g.econ.estates.filter((e) => e !== sellable);
      const worth = Math.round(sellable.value * 0.7);
      let left = worth;
      for (const d of g.econ.debts) {
        const take = Math.min(d.principal, left);
        d.principal -= take;
        left -= take;
      }
      g.econ.debts = g.econ.debts.filter((d) => d.principal > 0);
      credit(g, 'house', left);
      say(T(`Creditors forced the sale of ${sellable.name.en.toLowerCase()} for ${worth} nyang.`, `빚쟁이들의 독촉에 ${sellable.name.ko}을(를) ${worth}냥에 넘겼다.`), true);
      g.player.reputation = clamp(g.player.reputation - 4, 0, 100);
    }
  }

  // The player's own income: salary, and an allowance when someone else holds the keys.
  // An official on mourning leave draws no salary.
  const onLeave = !!g.player.mourning?.leave && g.dayCount < g.player.mourning.until;
  const salary = g.player.legal !== 'commoner' && !onLeave ? SALARY[g.player.office?.rank ?? 0] : 0;
  if (salary) book(T('Salary of office', '녹봉'), salary, 'purse');
  if (g.econ.role === 'member') {
    const a = ALLOWANCE[houseWealth(g)];
    book(T('Allowance from the family', '집안에서 받는 용돈'), a, 'purse');
    book(T('Allowance paid out', '용돈 지급'), -a, 'house');
  }
  if (g.player.legal === 'commoner') {
    const work = Math.round(8 + (g.player.attrs.administration ?? 40) / 8 + (g.player.attrs.scholarship ?? 40) / 10);
    book(T('Wages for copying and teaching', '필사와 훈장 일로 번 품삯'), work, 'purse');
  }
  if (g.player.royal === 'king' || g.player.royal === 'regent' || g.player.royal === 'queen' || g.player.royal === 'queenDowager') {
    book(T('Allowance from the royal household', '내수사에서 오는 몫'), 60, 'purse');
  }

  for (const l of lines) credit(g, l.acct === 'state' ? 'house' : l.acct, l.d);
  // A member of the family still in the father's house: the family pays from its treasury, so their purse stays theirs.
  const net = lines.filter((l) => l.acct === 'house').reduce((n, l) => n + l.d, 0);
  const mine = lines.filter((l) => l.acct === 'purse').reduce((n, l) => n + l.d, 0);
  if (keys || g.econ.role === 'member') {
    say(T(`House accounts ${net >= 0 ? '+' : '−'}${fmt(Math.abs(net))} nyang; your purse ${mine >= 0 ? '+' : '−'}${fmt(Math.abs(mine))}.`, `집안 살림 ${net >= 0 ? '+' : '−'}${fmt(Math.abs(net))}냥, 내 주머니 ${mine >= 0 ? '+' : '−'}${fmt(Math.abs(mine))}냥.`));
  }
  g.econ.ledger.push({ year: g.date.year, moon: g.date.moon, lines });
  if (g.econ.ledger.length > 24) g.econ.ledger.splice(0, g.econ.ledger.length - 24);

  // Wealth band of the house.
  const before = g.house.wealth;
  const now = houseWealth(g);
  if (now !== before && !g.marriedInto) {
    g.house.wealth = now;
    const up2 = WEALTH_ORDER.indexOf(now) > WEALTH_ORDER.indexOf(before);
    say(up2 ? T('Your household is now counted among the better-off.', '집안 살림이 한결 넉넉해졌다.') : T('Your household has grown poorer.', '집안 살림이 기울었다.'), true);
  }
}

const staffRoleWage = (s: Staff) => (s.role === 'servants' ? (s.count ?? 1) * SERVANT_WAGE : staffRole(s.role).wage);

function runBusiness(g: Game, b: Business, clerk: boolean): { profit: number; event?: Text; capitalHit?: number } {
  const k = businessKind(b.kind);
  const st = g.econ.provinces[b.province];
  const s = seasonOf(g.date.moon);
  const demand = k.good ? price(g, b.province, k.good) / goodById(k.good).base : 1;
  const aimM = b.aim === 'steady' ? 0.85 : b.aim === 'growth' ? 1.15 : 1;
  const aimR = b.aim === 'steady' ? 0.6 : b.aim === 'growth' ? 1.2 : 0.9;
  let profit = b.capital * k.margin * clamp(demand, 0.6, 1.6) * aimM * (0.6 + b.manager / 125) * (0.8 + b.repute / 250) * (0.75 + (st?.stability ?? 70) / 280);
  if (b.kind === 'ginseng' && s !== 2) profit *= 0.5;
  if (b.kind === 'ginseng' && s === 2) profit *= 2.5;
  profit *= 0.85 + roll(g, 'biz:' + b.id) * 0.3;
  if (b.aim === 'quality') b.repute = clamp(b.repute + 3, 0, 100);
  const risk = k.risk * aimR * (1.3 - b.manager / 100) * (st?.disaster ? 1.6 : 1);
  if (roll(g, 'biz-risk:' + b.id) < risk) {
    const r = roll(g, 'biz-what:' + b.id);
    if (r < 0.35 && !clerk) {
      const hit = Math.round(b.capital * 0.15);
      return { profit: Math.round(profit * 0.3), capitalHit: -hit, event: T(`Your manager at ${b.name.en.toLowerCase()} cooked the books: ${hit} nyang gone.`, `${b.name.ko}의 관리인이 장부를 속였다. ${hit}냥이 사라졌다.`) };
    }
    if (r < 0.65) return { profit: 0, event: T(`${b.name.en} had nothing to sell this season: supplies ran short.`, `${b.name.ko}은(는) 이번 철 물건이 동나 장사를 하지 못했다.`) };
    if (r < 0.85) {
      const hit = Math.round(b.capital * 0.1);
      return { profit: Math.round(profit * 0.5), capitalHit: -hit, event: T(`Thieves broke into ${b.name.en.toLowerCase()}: ${hit} nyang of stock gone.`, `도둑이 ${b.name.ko}에 들었다. ${hit}냥어치 물건을 잃었다.`) };
    }
    const hit = Math.round(b.capital * 0.25);
    return { profit: 0, capitalHit: -hit, event: T(`A fire at ${b.name.en.toLowerCase()} destroyed ${hit} nyang of stock.`, `${b.name.ko}에 불이 나 ${hit}냥어치를 잃었다.`) };
  }
  return { profit: Math.round(profit) };
}

// ---------------------------------------------------------------- player decisions

export type Done = { game: Game; note: Text | null };
const no = (g: Game, why?: Text): Done => ({ game: g, note: why ?? null });

export function moveFunds(g0: Game, d: number): Done {
  if (!holdsKeys(g0)) return no(g0);
  const g = clone(g0);
  const amt = d > 0 ? Math.min(d, g.econ.treasury) : -Math.min(-d, g.player.money);
  g.econ.treasury -= amt;
  g.player.money += amt;
  return { game: g, note: amt > 0 ? T(`Drew ${fmt(amt)} nyang from the family treasury.`, `집안 곳간에서 ${fmt(amt)}냥을 꺼냈다.`) : T(`Put ${fmt(-amt)} nyang into the family treasury.`, `집안 곳간에 ${fmt(-amt)}냥을 넣었다.`) };
}

/** A member asks the head of the family for money. The answer depends on the father's regard. */
export function askFunds(g0: Game): Done {
  if (g0.econ.role !== 'member' || g0.flags['asked-funds']) return no(g0);
  const g = clone(g0);
  g.flags['asked-funds'] = true;
  g.flagDays['asked-funds'] = g.dayCount;
  const regard = g.rel.father?.regard ?? 50;
  if (roll(g, 'ask-funds') < regard / 100) {
    const amt = Math.min(Math.round(g.econ.treasury * 0.1), 200);
    g.econ.treasury -= amt;
    g.player.money += amt;
    return { game: g, note: T(`Your father sent ${amt} nyang, with a long letter about thrift.`, `아버지께서 절약에 관한 긴 편지와 함께 ${amt}냥을 보내셨다.`) };
  }
  if (g.rel.father) g.rel.father.regard = clamp(g.rel.father.regard - 2, 0, 100);
  return { game: g, note: T('Your father refused. “When I was your age…”', '아버지께서 거절하셨다. “내가 네 나이 때는…”') };
}

export function setCare(g0: Game, estateId: string, care: number): Done {
  if (!holdsKeys(g0)) return no(g0);
  const g = clone(g0);
  const e = g.econ.estates.find((x) => x.id === estateId);
  if (!e) return no(g0);
  e.care = clamp(Math.round(care), 0, 2);
  return { game: g, note: null };
}

export function canBuild(g: Game, e: Estate, b: string): boolean {
  const def = buildingById(b);
  return !!def && holdsKeys(g) && !e.works && !e.buildings.includes(b) && def.on.includes(e.kind) && g.econ.treasury >= def.cost && g.player.legal !== 'commoner';
}
export function startBuilding(g0: Game, estateId: string, b: string): Done {
  const e0 = g0.econ.estates.find((x) => x.id === estateId);
  if (!e0 || !canBuild(g0, e0, b)) return no(g0);
  const g = clone(g0);
  const e = g.econ.estates.find((x) => x.id === estateId)!;
  const def = buildingById(b)!;
  g.econ.treasury -= def.cost;
  e.works = { id: b, left: def.seasons };
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'wealth', text: T(`Began building a ${def.name.en.toLowerCase()} at ${e.name.en.toLowerCase()}.`, `${e.name.ko}에 ${def.name.ko}을(를) 짓기 시작했다.`) });
  g.counts.built = (g.counts.built ?? 0) + 1;
  return { game: g, note: T(`Work begins on the ${def.name.en.toLowerCase()}: ${def.cost} nyang, ${def.seasons} season${def.seasons > 1 ? 's' : ''}.`, `${def.name.ko} 공사를 시작했다. ${def.cost}냥, ${def.seasons}철 소요.`) };
}

export function hire(g0: Game, role: string): Done {
  if (!holdsKeys(g0) || g0.econ.staff.some((s) => s.role === role)) return no(g0);
  const g = clone(g0);
  const s = makeStaff(g, role);
  g.econ.staff.push(s);
  return { game: g, note: T(`${s.name.en} joins the household at ${s.wage} nyang a season.`, `${s.name.ko}이(가) 철마다 ${s.wage}냥을 받고 식솔이 되었다.`) };
}
export function dismiss(g0: Game, staffId: string): Done {
  if (!holdsKeys(g0)) return no(g0);
  const g = clone(g0);
  const s = g.econ.staff.find((x) => x.id === staffId);
  if (!s || s.role === 'servants') return no(g0);
  g.econ.staff = g.econ.staff.filter((x) => x !== s);
  for (const o of g.econ.staff) o.loyalty = clamp(o.loyalty - 3, 0, 100);
  return { game: g, note: T(`${s.name.en} leaves your service.`, `${s.name.ko}을(를) 내보냈다.`) };
}
export function setWage(g0: Game, staffId: string, up: boolean): Done {
  if (!holdsKeys(g0)) return no(g0);
  const g = clone(g0);
  const s = g.econ.staff.find((x) => x.id === staffId);
  if (!s) return no(g0);
  const step = s.role === 'servants' ? (s.count ?? 1) : Math.max(1, Math.round(s.wage * 0.2));
  s.wage = Math.max(1, s.wage + (up ? step : -step));
  s.loyalty = clamp(s.loyalty + (up ? 8 : -10), 0, 100);
  return { game: g, note: null };
}
export function setServants(g0: Game, d: number): Done {
  if (!holdsKeys(g0)) return no(g0);
  const g = clone(g0);
  const s = g.econ.staff.find((x) => x.role === 'servants');
  if (!s) return no(g0);
  const per = s.wage / Math.max(1, s.count ?? 1);
  s.count = clamp((s.count ?? 1) + d, 0, 40);
  s.wage = Math.round(per * s.count);
  return { game: g, note: null };
}

export function openBusiness(g0: Game, kind: string, province: string, capital: number, owner: Acct): Done {
  const k = businessKind(kind);
  if (capital < k.min || balance(g0, owner) < capital || (owner === 'house' && !holdsKeys(g0))) return no(g0);
  const g = clone(g0);
  credit(g, owner, -capital);
  const p = provinceById(province);
  const b: Business = { id: uid(g, 'biz-' + kind), kind, province, capital, aim: 'steady', manager: Math.round(40 + roll(g, 'biz-mgr' + kind) * 35), repute: 40, last: 0, opened: g.date.year, owner, name: T(`${k.name.en}, ${p.name.en}`, `${p.name.ko} ${k.name.ko}`) };
  g.econ.businesses.push(b);
  let note = T(`You open ${k.name.en.toLowerCase()} in ${p.name.en} with ${fmt(capital)} nyang.`, `${p.name.ko}에 ${fmt(capital)}냥을 들여 ${k.name.ko}을(를) 열었다.`);
  if (g.player.legal !== 'commoner' && !(g.campaign.rules?.commerce)) {
    g.player.reputation = clamp(g.player.reputation - 3, 0, 100);
    note = T(`${note.en} It is in a steward’s name; still, people talk. Reputation −3.`, `${note.ko} 집사 명의로 했지만 사람들은 수군거린다. 평판 −3.`);
  }
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'wealth', text: T(`Established ${b.name.en.toLowerCase()}.`, `${b.name.ko}을(를) 세웠다.`) });
  g.counts.businesses = (g.counts.businesses ?? 0) + 1;
  emit(g, { type: 'BUSINESS_ESTABLISHED', text: T(`Established ${b.name.en.toLowerCase()}.`, `${b.name.ko}을(를) 세웠다.`) });
  return { game: g, note };
}
export function setAim(g0: Game, id: string, aim: Business['aim']): Done {
  const g = clone(g0);
  const b = g.econ.businesses.find((x) => x.id === id);
  if (!b) return no(g0);
  b.aim = aim;
  return { game: g, note: null };
}
export function addCapital(g0: Game, id: string, amount: number): Done {
  const b0 = g0.econ.businesses.find((x) => x.id === id);
  if (!b0 || balance(g0, b0.owner) < amount) return no(g0);
  const g = clone(g0);
  const b = g.econ.businesses.find((x) => x.id === id)!;
  credit(g, b.owner, -amount);
  b.capital += amount;
  return { game: g, note: T(`Added ${fmt(amount)} nyang to ${b.name.en.toLowerCase()}.`, `${b.name.ko}에 ${fmt(amount)}냥을 더 넣었다.`) };
}
export function replaceManager(g0: Game, id: string): Done {
  const g = clone(g0);
  const b = g.econ.businesses.find((x) => x.id === id);
  if (!b || balance(g, b.owner) < 30) return no(g0);
  credit(g, b.owner, -30);
  b.manager = Math.round(45 + roll(g, 'new-mgr:' + id) * 50);
  return { game: g, note: T(`A new manager takes over ${b.name.en.toLowerCase()} (fee 30 nyang).`, `새 관리인이 ${b.name.ko}을(를) 맡았다 (사례 30냥).`) };
}
export function closeBusiness(g0: Game, id: string): Done {
  const g = clone(g0);
  const b = g.econ.businesses.find((x) => x.id === id);
  if (!b) return no(g0);
  const back = Math.round(b.capital * 0.7);
  credit(g, b.owner, back);
  g.econ.businesses = g.econ.businesses.filter((x) => x !== b);
  return { game: g, note: T(`You close ${b.name.en.toLowerCase()} and recover ${fmt(back)} nyang.`, `${b.name.ko}을(를) 접고 ${fmt(back)}냥을 거두었다.`) };
}

export function borrow(g0: Game, lender: string, amount: number, acct: Acct): Done {
  const L = LENDERS.find((x) => x.id === lender);
  const owed = g0.econ.debts.filter((d) => d.lender.en === L?.name.en).reduce((n, d) => n + d.principal, 0);
  if (!L || amount <= 0 || owed + amount > L.max || (acct === 'house' && !holdsKeys(g0))) return no(g0);
  const g = clone(g0);
  g.econ.debts.push({ id: uid(g, 'debt'), lender: L.name, principal: amount, rate: L.rate, since: g.dayCount, acct });
  credit(g, acct, amount);
  return { game: g, note: T(`Borrowed ${fmt(amount)} nyang from ${L.name.en.toLowerCase()} at ${Math.round(L.rate * 100)}% a season.`, `${L.name.ko}에게서 철마다 ${Math.round(L.rate * 100)}% 이자로 ${fmt(amount)}냥을 빌렸다.`) };
}
export function repay(g0: Game, debtId: string): Done {
  const d0 = g0.econ.debts.find((x) => x.id === debtId);
  if (!d0) return no(g0);
  const g = clone(g0);
  const d = g.econ.debts.find((x) => x.id === debtId)!;
  const paid = Math.min(balance(g, d.acct), d.principal);
  credit(g, d.acct, -paid);
  d.principal -= paid;
  g.econ.debts = g.econ.debts.filter((x) => x.principal > 0);
  return { game: g, note: T(`Repaid ${fmt(paid)} nyang to ${d.lender.en.toLowerCase()}.`, `${d.lender.ko}에게 ${fmt(paid)}냥을 갚았다.`) };
}

/** Land offered for sale this year. Historical rules keep some of it from some buyers. */
export function estateOffers(g: Game): { kind: string; province: string; area: number; cost: number; ok: boolean; why: Text | null }[] {
  const out: { kind: string; province: string; area: number; cost: number; ok: boolean; why: Text | null }[] = [];
  const kinds = ['farm', 'forest', 'shops', 'villa'];
  for (let i = 0; i < 3; i++) {
    const kind = kinds[Math.floor(roll(g, `offer-kind:${g.date.year}:${i}`) * kinds.length)];
    const pool = kind === 'shops' ? ['hanseong'] : PROVINCES.filter((p) => p.id !== 'hanseong').map((p) => p.id);
    const province = pool[Math.floor(roll(g, `offer-prov:${g.date.year}:${i}`) * pool.length)];
    const area = Math.round(5 + roll(g, `offer-area:${g.date.year}:${i}`) * 15);
    const k = estateKind(kind);
    const cost = Math.round(k.value * (area / 10) * (0.85 + roll(g, `offer-cost:${g.date.year}:${i}`) * 0.4));
    let why: Text | null = null;
    if (!holdsKeys(g)) why = T('Only the head of the household buys land.', '땅은 집안 어른만 살 수 있다.');
    else if (g.player.legal === 'commoner' && kind !== 'shops') why = T('A commoner cannot buy a noble’s estate.', '평민은 양반의 전장을 살 수 없다.');
    else if (kind === 'villa' && g.house.prestige < 3) why = T('Such a house would draw remarks about your station.', '그런 별서는 분수에 넘친다는 말을 듣는다.');
    else if (g.econ.treasury < cost) why = T('The treasury cannot cover it.', '곳간이 감당하지 못한다.');
    out.push({ kind, province, area, cost, ok: !why, why });
  }
  return out;
}
export function buyEstate(g0: Game, idx: number): Done {
  const o = estateOffers(g0)[idx];
  if (!o?.ok || g0.flags[`bought:${g0.date.year}:${idx}`]) return no(g0);
  const g = clone(g0);
  g.econ.treasury -= o.cost;
  const e = estate(g, o.kind, o.province, o.area, { condition: 55 });
  g.econ.estates.push(e);
  g.flags[`bought:${g.date.year}:${idx}`] = true;
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'wealth', text: T(`Bought ${e.name.en.toLowerCase()}.`, `${e.name.ko}을(를) 사들였다.`) });
  g.counts.estates = (g.counts.estates ?? 0) + 1;
  emit(g, { type: 'PROPERTY_ACQUIRED', text: T(`Bought ${e.name.en.toLowerCase()}.`, `${e.name.ko}을(를) 사들였다.`), doc: { title: T('Deed of sale (mun-gi)', '매매 문기'), body: certificate(g, T(`Purchased ${e.name.en.toLowerCase()} (${e.area} gyeol) for ${fmt(o.cost)} nyang, before witnesses.`, `${e.name.ko}(${e.area}결)을(를) ${fmt(o.cost)}냥에 증인 앞에서 매입함.`)) } });
  return { game: g, note: T(`The deed to ${e.name.en.toLowerCase()} is yours for ${fmt(o.cost)} nyang.`, `${fmt(o.cost)}냥에 ${e.name.ko}의 문서를 넘겨받았다.`) };
}
export function sellEstate(g0: Game, id: string): Done {
  const e0 = g0.econ.estates.find((x) => x.id === id);
  if (!e0 || e0.kind === 'town' || !holdsKeys(g0)) return no(g0);
  const g = clone(g0);
  const worth = Math.round(e0.value * 0.9);
  g.econ.estates = g.econ.estates.filter((x) => x.id !== id);
  g.econ.treasury += worth;
  g.player.reputation = clamp(g.player.reputation - 1, 0, 100);
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'wealth', text: T(`Sold ${e0.name.en.toLowerCase()}.`, `${e0.name.ko}을(를) 팔았다.`) });
  return { game: g, note: T(`Sold ${e0.name.en.toLowerCase()} for ${fmt(worth)} nyang.`, `${e0.name.ko}을(를) ${fmt(worth)}냥에 팔았다.`) };
}

/** Buys goods where they are cheap and sends them to sell next season. */
export function sendCargo(g0: Game, good: string, from: string, to: string, qty: number, owner: Acct): Done {
  const unit = price(g0, from, good);
  const haul = Math.round(qty * (provinceById(from).days + provinceById(to).days + 1) * 0.35);
  const cost = qty * unit + haul;
  if (qty <= 0 || from === to || balance(g0, owner) < cost || (owner === 'house' && !holdsKeys(g0)) || g0.econ.cargo.length >= 3) return no(g0);
  const g = clone(g0);
  credit(g, owner, -cost);
  g.econ.cargo.push({ good, qty, from, to, paid: cost, owner });
  const gd = goodById(good);
  return { game: g, note: T(`${qty} ${gd.unit.en}s of ${gd.name.en.toLowerCase()} bought in ${provinceById(from).name.en} and sent to ${provinceById(to).name.en} (${fmt(cost)} nyang with carriage). They sell next season.`, `${provinceById(from).name.ko}에서 ${gd.name.ko} ${qty}${gd.unit.ko}을(를) 사 ${provinceById(to).name.ko}로 보냈다 (운임 포함 ${fmt(cost)}냥). 다음 철에 팔린다.`) };
}

/** A journey to a province to see your estates and businesses there. Takes days but stays within the season. */
export function journeyDays(g: Game, province: string, mode: string) {
  const m = TRAVEL.find((x) => x.id === mode) ?? TRAVEL[1];
  const stable = g.econ.estates.some((e) => e.buildings.includes('stable'));
  const each = Math.max(1, Math.ceil(provinceById(province).days / (m.speed * (stable && mode === 'horse' ? 1.2 : 1))));
  return { days: each * 2 + 2, cost: (each * 2 + 2) * m.cost };
}
export function canJourney(g: Game, province: string, mode: string): Text | null {
  if (province === 'hanseong') return T('You are already in the capital.', '이미 도성에 있다.');
  if (g.date.year - g.player.birthYear < 15) return T('Children do not travel alone.', '아이 혼자 길을 떠날 수는 없다.');
  if (g.pol.exile) return T('You may not leave your place of exile.', '유배지를 떠날 수 없다.');
  if (g.active || g.letter || g.report) return T('Something needs your attention first.', '먼저 처리할 일이 있다.');
  const { days, cost } = journeyDays(g, province, mode);
  const left = (3 - ((g.date.moon - 1) % 3)) * 30 - g.date.day;
  if (days > left) return T(`Too late in the season for a ${days}-day journey.`, `${days}일 걸리는 길을 떠나기엔 철이 너무 늦었다.`);
  if (!canPay(g, cost)) return T(`The journey costs ${cost} nyang.`, `여비가 ${cost}냥 든다.`);
  return null;
}
export function journey(g0: Game, province: string, mode: string): Done {
  if (canJourney(g0, province, mode)) return no(g0);
  const g = clone(g0);
  const { days, cost } = journeyDays(g, province, mode);
  pay(g, cost);
  g.date = { ...addDays(g.date, days), phase: 'morning' };
  g.dayCount += days;
  g.place = 'residence';
  g.done = [];
  const p = provinceById(province);
  const seen: string[] = [];
  for (const e of g.econ.estates.filter((x) => x.province === province)) {
    e.seen = g.date.year;
    e.condition = clamp(e.condition + 6, 0, 100);
    e.productivity = clamp(e.productivity + 5, 0, 100);
    seen.push(e.name.en.toLowerCase());
  }
  for (const b of g.econ.businesses.filter((x) => x.province === province)) {
    b.repute = clamp(b.repute + 5, 0, 100);
    b.manager = clamp(b.manager + 4, 0, 100);
  }
  g.player.attrs.endurance = clamp((g.player.attrs.endurance ?? 50) + 1, 0, 100);
  g.counts.journeys = (g.counts.journeys ?? 0) + 1;
  g.log.push({ year: g.date.year, moon: g.date.moon, tag: 'wealth', text: T(`Travelled to ${p.name.en}.`, `${p.name.ko}에 다녀왔다.`) });
  const what = seen.length ? T(` You inspected your holdings there; the tenants and managers will remember it.`, ' 그곳의 전장을 둘러보았다. 소작인과 관리인들이 기억할 것이다.') : T(' You met the local gentry and heard what the markets are saying.', ' 그 고을 양반들을 만나고 장시 소식을 들었다.');
  g.player.reputation = clamp(g.player.reputation + 1, 0, 100);
  return { game: g, note: T(`${days} days to ${p.name.en} and back (${cost} nyang).${what.en}`, `${p.name.ko}까지 오가는 데 ${days}일 (${cost}냥).${what.ko}`) };
}

/** Buys grain for the stores. */
export function layIn(g0: Game): Done {
  const cost = Math.round(price(g0, 'hanseong', 'rice') * 12);
  const cap = g0.econ.estates.some((e) => e.buildings.includes('storehouse')) ? 4 : 2;
  if (!holdsKeys(g0) || g0.econ.treasury < cost || g0.econ.stores >= cap) return no(g0);
  const g = clone(g0);
  g.econ.treasury -= cost;
  g.econ.stores += 1;
  return { game: g, note: T(`Twelve sacks of rice laid in the storehouse for ${cost} nyang.`, `${cost}냥으로 쌀 열두 섬을 곳간에 들였다.`) };
}

export const KINDS = { ESTATE_KINDS, BUILDINGS, STAFF_ROLES, BUSINESS_KINDS };
export { nyang };

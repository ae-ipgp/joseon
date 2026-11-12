import { z } from 'zod';
import { GameZ, TextZ, type Game, type PortraitSpec, type Text } from '../model/schemas';
import { placeById } from '../content/places';
import { playerName, playerPortrait } from '../engine/world';
import { START_MONEY } from '../engine/money';
import { withHangul } from '../engine/newGame';
import { makeAttrs, syncQualities } from '../engine/character';
import { initEcon } from '../engine/econ';
import { initPol } from '../engine/politics';

/** Bump when the shape of `Game` changes, and add a step to `migrate`. */
export const SAVE_VERSION = 6;
export type SlotId = 'auto' | 1 | 2 | 3;
export const SLOTS: SlotId[] = ['auto', 1, 2, 3];
const key = (slot: SlotId) => `joseon:save:${slot}`;

export type SaveSummary = {
  name: Text;
  campaign: 'historical' | 'alternative';
  premise: string | null;
  year: number;
  moon: number;
  day: number;
  phase: string;
  location: Text;
  portrait: PortraitSpec;
  generation: number;
  alive: boolean;
};

const SummaryZ = z.object({
  name: TextZ,
  campaign: z.enum(['historical', 'alternative']),
  premise: z.string().nullable(),
  year: z.number(),
  moon: z.number(),
  day: z.number(),
  phase: z.string(),
  location: TextZ,
  portrait: z.any(),
  generation: z.number(),
  alive: z.boolean(),
});

const SaveFileZ = z.object({
  version: z.number().int(),
  savedAt: z.string(),
  slot: z.union([z.literal('auto'), z.number()]),
  summary: SummaryZ,
  /** v0.4: a name the player gave the save. */
  label: z.string().max(60).optional(),
  game: z.unknown(),
});

export type SlotView =
  | { slot: SlotId; state: 'empty' }
  | { slot: SlotId; state: 'ok'; savedAt: string; summary: SaveSummary; label?: string; restored?: boolean }
  | { slot: SlotId; state: 'unreadable'; reason: 'newer' | 'broken' };

/** Minimal storage interface so tests can pass an in-memory store. */
export type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const defaultStore = (): KV | null => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
};

export function summarize(g: Game): SaveSummary {
  return {
    name: playerName(g),
    campaign: g.campaign.mode,
    premise: g.campaign.premise,
    year: g.date.year,
    moon: g.date.moon,
    day: g.date.day,
    phase: g.date.phase,
    location: placeById(g.place).name,
    portrait: playerPortrait(g),
    generation: g.generation,
    alive: g.player.alive,
  };
}

/** Upgrades older save files one version at a time. Version 1 is the first format. */
export function migrate(version: number, game: unknown): unknown {
  let g = structuredClone(game);
  for (let v = version; v < SAVE_VERSION; v++) {
    if (v === 1) g = fromV1(g);
    if (v === 2) g = fromV2(g);
    if (v <= 3) g = fromV3(g);
    if (v <= 4) g = fromV4(g);
    if (v <= 5) g = fromV5(g);
  }
  return g;
}

type Loose = Record<string, any>;
/** Version 4 added notifications, missions, documents, letters, routines, past lives and the condition pair. */
/** Version 6 added belief, writings, a companion animal and scenarios (v0.6). */
function fromV5(raw: unknown): unknown {
  const g = raw as Loose;
  if (!g || typeof g !== 'object' || !g.player) return g;
  g.player.belief ??= { practice: {}, conviction: 30 };
  g.player.works ??= [];
  g.player.pet ??= null;
  g.scenario ??= null;
  return g;
}
/** Version 5 added mood, illness, pastimes, mourning and milestones (v0.5). */
function fromV4(raw: unknown): unknown {
  const g = raw as Loose;
  if (!g || typeof g !== 'object' || !g.player) return g;
  g.player.happiness ??= 60;
  g.player.conditions ??= [];
  g.player.skills ??= {};
  g.player.practised ??= {};
  g.player.mourning ??= null;
  g.player.moodEvent ??= null;
  g.milestones ??= [];
  // The 3D view is gone; its settings live in the settings record, not in saves.
  return g;
}
function fromV3(raw: unknown): unknown {
  const g = raw as Loose;
  if (!g || typeof g !== 'object' || !g.player) return g;
  g.player.fatigue ??= 10;
  g.player.stress ??= 15;
  g.notes ??= [];
  g.missions ??= [];
  g.docs ??= [];
  g.mail ??= [];
  g.routine ??= null;
  g.lives ??= [];
  return g;
}
/** Version 3 added the attributes, education, status, household economy and politics of the v2.0 specs. */
function fromV2(raw: unknown): unknown {
  const g = raw as Loose;
  if (!g || typeof g !== 'object' || !g.player) return g;
  const P = g.player as Loose;
  const age = (g.date?.year ?? 1724) - (P.birthYear ?? 1700);
  const royal = g.house?.background === 'royal' || g.house?.background === 'collateral';
  let n = 0;
  P.attrs = makeAttrs(() => ((n = (n * 9301 + 49297) % 233280) / 233280), P.qualities ?? { wit: 50, grace: 50, resolve: 50 }, { background: g.house?.background ?? 'noble', gender: P.gender ?? 'man', age, traits: P.traits ?? [] });
  P.temper = {};
  P.edu = { classics: Math.min(60, age), admin: Math.min(40, age), military: Math.min(40, age), culture: Math.min(50, age), practical: Math.min(50, age), _focus: 0 };
  P.quals = P.office ? [P.office.track === 'military' ? 'mukwa' : 'munkwa'] : [];
  P.born = royal ? 'royal' : 'yangban';
  P.legal = royal ? 'royal' : 'yangban';
  P.lineage = royal ? (g.house.background === 'royal' ? 'prince' : 'descendant') : 'none';
  P.royal = 'none';
  P.honour = 50;
  P.legitimacy = royal ? 50 : 0;
  P.service = 0;
  syncQualities(P as never);
  const money = typeof P.money === 'number' ? P.money : 200;
  initEcon(g as never, g.house?.wealth ?? 'modest', Math.round(money * 0.85));
  P.money = Math.round(money * 0.15);
  initPol(g as never);
  return g;
}
/** Version 2 added money, achievements, running counts and hangul spellings for typed names. */
function fromV1(raw: unknown): unknown {
  const g = raw as Loose;
  if (!g || typeof g !== 'object') return g;
  const wealth = (g.house?.wealth ?? 'modest') as keyof typeof START_MONEY;
  if (g.player && typeof g.player.money !== 'number') g.player.money = START_MONEY[wealth] ?? START_MONEY.modest;
  if (g.player?.given) g.player.given = withHangul(g.player.given);
  if (!Array.isArray(g.achieved)) g.achieved = [];
  if (!g.counts || typeof g.counts !== 'object') g.counts = {};
  return g;
}

export type WriteResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' };

/**
 * Writes are atomic in effect (GSDD Part VI §7.4): the new file is written beside the old one and read back
 * before it replaces it, and the previous version is kept as a backup in case the new one is ever damaged.
 */
export function writeSlot(slot: SlotId, game: Game, store: KV | null = defaultStore(), now = new Date()): WriteResult {
  if (!store) return { ok: false, reason: 'unavailable' };
  let prev: string | null = null;
  try { prev = store.getItem(key(slot)); } catch { prev = null; }
  let label: string | undefined;
  try { label = prev ? (JSON.parse(prev) as { label?: string }).label : undefined; } catch { label = undefined; }
  const file = { version: SAVE_VERSION, savedAt: now.toISOString(), slot, summary: summarize(game), ...(label ? { label } : {}), game };
  const text = JSON.stringify(file);
  try {
    store.setItem(key(slot) + ':tmp', text);
    if (store.getItem(key(slot) + ':tmp') !== text) throw new Error('verify');
  } catch {
    try { store.removeItem(key(slot) + ':tmp'); } catch { /* nothing to clean */ }
    return { ok: false, reason: 'quota' };
  }
  try {
    if (prev) {
      try { store.setItem(key(slot) + ':bak', prev); } catch { /* the backup is a courtesy; the save itself matters */ }
    }
    store.setItem(key(slot), text);
    store.removeItem(key(slot) + ':tmp');
    return { ok: true };
  } catch {
    return { ok: false, reason: 'quota' };
  }
}

function parseFile(slot: SlotId, raw: string): { view: SlotView; game?: Game } {
  try {
    const file = SaveFileZ.parse(JSON.parse(raw));
    if (file.version > SAVE_VERSION) return { view: { slot, state: 'unreadable', reason: 'newer' } };
    const game = GameZ.parse(migrate(file.version, file.game));
    return { view: { slot, state: 'ok', savedAt: file.savedAt, summary: file.summary as SaveSummary, ...(file.label ? { label: file.label } : {}) }, game };
  } catch {
    return { view: { slot, state: 'unreadable', reason: 'broken' } };
  }
}

export function readSlot(slot: SlotId, store: KV | null = defaultStore()): { view: SlotView; game?: Game } {
  const get = (k: string) => {
    try { return store?.getItem(k) ?? null; } catch { return null; }
  };
  const raw = get(key(slot));
  if (!raw) return { view: { slot, state: 'empty' } };
  const r = parseFile(slot, raw);
  if (r.view.state === 'unreadable' && r.view.reason === 'broken') {
    const bak = get(key(slot) + ':bak');
    if (bak) {
      const b = parseFile(slot, bak);
      if (b.view.state === 'ok') return { view: { ...b.view, restored: true }, game: b.game };
    }
  }
  return r;
}

/** Gives a save a name of the player's choosing; an empty name clears it. */
export function renameSlot(slot: SlotId, label: string, store: KV | null = defaultStore()): boolean {
  try {
    const raw = store?.getItem(key(slot));
    if (!raw || !store) return false;
    const file = JSON.parse(raw) as Record<string, unknown>;
    const name = label.trim().slice(0, 60);
    if (name) file.label = name;
    else delete file.label;
    store.setItem(key(slot), JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}

/** The save file as text, for the player to keep (GSDD Part VI §7.6). */
export function exportSlot(slot: SlotId, store: KV | null = defaultStore()): string | null {
  try { return store?.getItem(key(slot)) ?? null; } catch { return null; }
}

export type ImportResult = { ok: true; game: Game } | { ok: false; reason: 'newer' | 'broken' | 'quota' | 'unavailable' };
/** Reads a save file the player brings back, checks it in full and writes it to a slot. */
export function importSave(text: string, slot: SlotId, store: KV | null = defaultStore()): ImportResult {
  const r = parseFile(slot, text);
  if (r.view.state !== 'ok' || !r.game) return { ok: false, reason: r.view.state === 'unreadable' ? r.view.reason : 'broken' };
  const w = writeSlot(slot, r.game, store);
  if (!w.ok) return { ok: false, reason: w.reason };
  if (r.view.label) renameSlot(slot, r.view.label, store);
  return { ok: true, game: r.game };
}

export const listSlots = (store: KV | null = defaultStore()): SlotView[] => SLOTS.map((s) => readSlot(s, store).view);

export function deleteSlot(slot: SlotId, store: KV | null = defaultStore()) {
  try {
    store?.removeItem(key(slot));
    store?.removeItem(key(slot) + ':bak');
  } catch {
    // Nothing to remove if storage is unavailable.
  }
}

/** The most recently saved readable life, for the main menu's Continue. */
export function latestSlot(store: KV | null = defaultStore()): (SlotView & { state: 'ok' }) | null {
  const ok = listSlots(store).filter((v): v is SlotView & { state: 'ok' } => v.state === 'ok');
  ok.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  return ok[0] ?? null;
}

export function memoryStore(): KV & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v);
    },
    removeItem: (k) => {
      data.delete(k);
    },
  };
}

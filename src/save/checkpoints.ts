import type { Game } from '../model/schemas';
import { SAVE_VERSION, migrate, summarize, type SaveSummary } from './storage';
import { GameZ } from '../model/schemas';

/**
 * GSDD Part VI §7.3: automatic checkpoints in IndexedDB, separate from the save slots in LocalStorage.
 * One is written at the start of each season and at each new generation; the last twelve of each
 * family line are kept, so a player can step back after a disaster. Everything stays in this browser.
 */
export type Checkpoint = { id: string; line: number; at: string; reason: string; summary: SaveSummary; version: number; game: unknown };
const DB = 'joseon';
const STORE = 'checkpoints';
const KEEP = 12;

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }).createIndex('line', 'line');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

const done = <T,>(req: IDBRequest<T>) => new Promise<T | null>((res) => { req.onsuccess = () => res(req.result); req.onerror = () => res(null); });

export async function listCheckpoints(line?: number): Promise<Checkpoint[]> {
  const db = await open();
  if (!db) return [];
  try {
    const all = (await done(db.transaction(STORE, 'readonly').objectStore(STORE).getAll())) as Checkpoint[] | null;
    return (all ?? []).filter((c) => line === undefined || c.line === line).sort((a, b) => b.at.localeCompare(a.at));
  } catch {
    return [];
  } finally {
    db.close();
  }
}

/** Saves a checkpoint and trims the oldest beyond the limit. Never throws. */
export async function addCheckpoint(g: Game, reason: string): Promise<boolean> {
  const db = await open();
  if (!db) return false;
  try {
    const cp: Checkpoint = { id: `${g.seed}-${g.generation}-${g.dayCount}`, line: g.seed, at: new Date().toISOString(), reason, summary: summarize(g), version: SAVE_VERSION, game: structuredClone(g) };
    await done(db.transaction(STORE, 'readwrite').objectStore(STORE).put(cp));
    const mine = ((await done(db.transaction(STORE, 'readonly').objectStore(STORE).getAll())) as Checkpoint[] | null ?? []).filter((c) => c.line === g.seed).sort((a, b) => b.at.localeCompare(a.at));
    if (mine.length > KEEP) {
      const tx = db.transaction(STORE, 'readwrite').objectStore(STORE);
      for (const old of mine.slice(KEEP)) tx.delete(old.id);
    }
    return true;
  } catch {
    return false;
  } finally {
    db.close();
  }
}

/** The checkpoint's game, upgraded and checked, or null if it cannot be used. */
export function checkpointGame(cp: Checkpoint): Game | null {
  try {
    if (cp.version > SAVE_VERSION) return null;
    return GameZ.parse(migrate(cp.version, cp.game));
  } catch {
    return null;
  }
}

export async function clearCheckpoints(): Promise<void> {
  const db = await open();
  if (!db) return;
  try { await done(db.transaction(STORE, 'readwrite').objectStore(STORE).clear()); } catch { /* nothing to clear */ } finally { db.close(); }
}

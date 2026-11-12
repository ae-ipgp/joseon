import type { Text } from '../model/schemas';
import type { KV } from './storage';

/**
 * The record of achievements across every life played in this browser.
 * Kept apart from save slots so deleting a save never takes an achievement away.
 */
export type HonourEntry = { first: string; times: number; by: Text; year: number };
export type Book = Record<string, HonourEntry>;
const KEY = 'joseon:honours';

const defaultStore = (): KV | null => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
};

export function readBook(store: KV | null = defaultStore()): Book {
  try {
    const raw = store?.getItem(KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === 'object' ? (v as Book) : {};
  } catch {
    return {};
  }
}

/** Adds achievements earned by `by` in `year`. Earning one again counts it again. */
export function recordHonours(ids: string[], by: Text, year: number, store: KV | null = defaultStore(), now = new Date()): Book {
  const book = readBook(store);
  for (const id of ids) {
    const e = book[id];
    book[id] = e ? { ...e, times: e.times + 1 } : { first: now.toISOString(), times: 1, by, year };
  }
  try {
    store?.setItem(KEY, JSON.stringify(book));
  } catch {
    // Without storage the record lasts for this visit only.
  }
  return book;
}

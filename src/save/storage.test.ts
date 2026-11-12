import { describe, it, expect } from 'vitest';
import { newGame } from '../engine/newGame';
import { deleteSlot, latestSlot, listSlots, memoryStore, readSlot, writeSlot, SAVE_VERSION } from './storage';

const game = () =>
  newGame({
    campaign: { mode: 'historical', era: 1724, premise: null },
    background: 'noble', gender: 'woman', givenName: '', age: 19,
    colors: { top: '#D8BF73', bottom: '#8E2230' }, seed: 7,
  });

describe('saves', () => {
  it('round-trips a game through a slot', () => {
    const store = memoryStore();
    const g = game();
    expect(writeSlot(1, g, store)).toEqual({ ok: true });
    const r = readSlot(1, store);
    expect(r.view.state).toBe('ok');
    expect(r.game).toEqual(g);
    if (r.view.state === 'ok') {
      expect(r.view.summary.year).toBe(g.date.year);
      expect(r.view.summary.generation).toBe(1);
    }
  });

  it('lists empty slots and finds the latest', () => {
    const store = memoryStore();
    expect(listSlots(store).every((s) => s.state === 'empty')).toBe(true);
    expect(latestSlot(store)).toBe(null);
    writeSlot(2, game(), store, new Date('2026-01-01T10:00:00Z'));
    writeSlot('auto', game(), store, new Date('2026-01-02T10:00:00Z'));
    expect(latestSlot(store)?.slot).toBe('auto');
    deleteSlot('auto', store);
    expect(latestSlot(store)?.slot).toBe(2);
  });

  it('refuses a save from a newer version without losing it', () => {
    const store = memoryStore();
    writeSlot(3, game(), store);
    const key = [...store.data.keys()][0];
    const file = JSON.parse(store.data.get(key)!);
    file.version = SAVE_VERSION + 1;
    store.setItem(key, JSON.stringify(file));
    const r = readSlot(3, store);
    expect(r.view.state).toBe('unreadable');
    if (r.view.state === 'unreadable') expect(r.view.reason).toBe('newer');
    expect(r.game).toBeUndefined();
    expect(store.data.get(key)).toBeDefined();
  });

  it('marks damaged saves as unreadable', () => {
    const store = memoryStore();
    writeSlot(1, game(), store);
    const key = [...store.data.keys()][0];
    store.setItem(key, '{"version":1,"game":');
    const a = readSlot(1, store);
    expect(a.view.state).toBe('unreadable');
    if (a.view.state === 'unreadable') expect(a.view.reason).toBe('broken');

    const file = JSON.parse(JSON.stringify({ version: SAVE_VERSION, savedAt: 'x', slot: 1, summary: {}, game: { nonsense: true } }));
    store.setItem(key, JSON.stringify(file));
    expect(readSlot(1, store).view.state).toBe('unreadable');
  });

  it('works without storage at all', () => {
    expect(writeSlot(1, game(), null)).toEqual({ ok: false, reason: 'unavailable' });
    expect(readSlot(1, null).view.state).toBe('empty');
  });
});

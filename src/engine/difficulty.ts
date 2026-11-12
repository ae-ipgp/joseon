import type { Game } from '../model/schemas';

/**
 * GSDD Part V §27: difficulty is a set of separate dials rather than one number,
 * so a player can keep a gentle economy and a harsh court, or the reverse.
 */
export type Level = 'gentle' | 'normal' | 'harsh';
export const LEVELS: Level[] = ['gentle', 'normal', 'harsh'];
export const DEFAULT_DIFFICULTY = { mortality: 'normal' as Level, economy: 'normal' as Level, politics: 'normal' as Level, automation: false };

const level = (g: Game, k: 'mortality' | 'economy' | 'politics'): Level => g.campaign.difficulty?.[k] ?? 'normal';
/** Multiplies the seasonal risk of death and serious illness. */
export const mortalityMul = (g: Game) => ({ gentle: 0.55, normal: 1, harsh: 1.5 })[level(g, 'mortality')];
/** Multiplies estate and business income. */
export const economyMul = (g: Game) => ({ gentle: 1.2, normal: 1, harsh: 0.82 })[level(g, 'economy')];
/** Adds to faction strife and to the chance of accusations. */
export const politicsAdd = (g: Game) => ({ gentle: -1, normal: 0, harsh: 1.5 })[level(g, 'politics')];
/** The steward repairs estates and settles small matters without asking. */
export const automated = (g: Game) => !!g.campaign.difficulty?.automation;

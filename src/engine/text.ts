import type { Text } from '../model/schemas';

export type Lang = 'en' | 'ko';

/** Builds a player-facing string pair. Korean is optional and falls back to English. */
export const T = (en: string, ko?: string): Text => (ko === undefined ? { en } : { en, ko });

export function pick(t: Text | null | undefined, lang: Lang): string {
  if (!t) return '';
  return lang === 'ko' ? t.ko ?? t.en : t.en;
}

/** Replaces {tokens} with values from the context; unknown tokens are left as they are. */
export function fill(s: string, ctx: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in ctx ? ctx[k] : m));
}

/** Korean particle that depends on whether the word ends in a final consonant. */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return `${withoutFinal}(${withFinal})`;
  return (code - 0xac00) % 28 !== 0 ? withFinal : withoutFinal;
}

/**
 * Settles written-out Korean particles from the syllable before them:
 * "운종가(으)로" → "운종가로", "한선우이(가)" → "한선우가", "설화은(는)" → "설화는".
 */
export function particles(s: string): string {
  const final = (ch: string) => (ch.charCodeAt(0) - 0xac00) % 28;
  return s
    .replace(/([가-힣])\(으\)로/g, (_m, ch: string) => ch + (final(ch) !== 0 && final(ch) !== 8 ? '으로' : '로'))
    .replace(/([가-힣])(이|을|은|과)\((가|를|는|와)\)/g, (_m, ch: string, a: string, b: string) => ch + (final(ch) !== 0 ? a : b));
}

/** A signed number with a real minus sign. */
export const signed = (d: number) => (d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : '0');

/** Joins two Texts with a separator, per language. */
export const join = (a: Text, b: Text, sep = ' '): Text => ({ en: `${a.en}${sep}${b.en}`, ko: `${a.ko ?? a.en}${sep}${b.ko ?? b.en}` });

/** Maps both languages through a function. */
export const mapText = (t: Text, f: (s: string, lang: Lang) => string): Text => ({ en: f(t.en, 'en'), ko: f(t.ko ?? t.en, 'ko') });

const EN_NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const numberWord = (n: number) => EN_NUM[n] ?? String(n);

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

import type { Text } from '../model/schemas';
import type { Lang } from '../engine/text';
import { particles, pick } from '../engine/text';
import { render } from '../engine/tokens';
import { useSettings } from '../store/settings';
import { useGame } from '../store/game';
import { STRINGS, type StringKey } from './strings';

export function translate(lang: Lang, key: StringKey, params?: Record<string, string | number>): string {
  const pair = STRINGS[key];
  let s: string = lang === 'ko' ? pair[1] : pair[0];
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return lang === 'ko' ? particles(s) : s;
}

/** `t` for interface words, `tx` for content Text with the game's names and factions filled in, `pk` for a plain Text. */
export function useT() {
  const lang = useSettings((s) => s.lang);
  const game = useGame((s) => s.game);
  return {
    lang,
    t: (key: StringKey, params?: Record<string, string | number>) => translate(lang, key, params),
    tx: (text: Text | null | undefined) => (text ? render(text, game, lang) : ''),
    pk: (text: Text | null | undefined) => pick(text, lang),
    /** A name used inside a sentence: "the Rear Garden", not "The Rear Garden". */
    nm: (text: Text | null | undefined) => {
      const s = text ? render(text, game, lang) : '';
      return lang === 'en' ? s.replace(/^The /, 'the ') : s;
    },
    /** Lower-cases the first letter in English, for words that follow a comma. */
    lc: (s: string) => (lang === 'en' ? s.charAt(0).toLowerCase() + s.slice(1) : s),
  };
}

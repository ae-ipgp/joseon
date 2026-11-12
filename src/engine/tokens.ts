import type { Game, Text } from '../model/schemas';
import { fill, josa, particles, pick, type Lang } from './text';
import { factionsOf, introOf, palaceOf, rulerOf } from './time';
import { livingSpouse, playerName, spouseId } from './world';

/** Values for {tokens} in content, in one language. Korean tokens also get particle variants: {x_i}, {x_eul}, {x_eun}, {x_wa}. */
export function tokens(g: Game | null, lang: Lang): Record<string, string> {
  if (!g) return {};
  const n = (id: string) => (g.npcs[id] ? pick(g.npcs[id].name, lang) : '');
  const f = factionsOf(g);
  const io = introOf(g);
  const woman = g.player.gender === 'woman';
  const sp = livingSpouse(g) ?? (spouseId(g) ? g.npcs[spouseId(g)!] : null);
  const base: Record<string, string> = {
    player: pick(playerName(g), lang),
    given: pick(g.player.given, lang),
    surname: pick(g.player.surname, lang),
    father: n('father'),
    mother: n('mother'),
    sibling: n('sibling'),
    king: pick(rulerOf(g).title, lang),
    palace: pick(palaceOf(g), lang),
    factionA: pick(f.a, lang),
    factionB: pick(f.b, lang),
    spouse: sp ? pick(sp.name, lang) : '',
    child: lang === 'ko' ? (woman ? '딸' : '아들') : woman ? 'daughter' : 'son',
    intro1: pick(io.intro[0], lang),
    intro2: pick(io.intro[1], lang),
    accusation: pick(io.accusation, lang),
  };
  const out: Record<string, string> = { ...base };
  for (const [k, v] of Object.entries(base)) {
    if (lang === 'ko') {
      out[`${k}_i`] = v + josa(v, '이', '가');
      out[`${k}_eul`] = v + josa(v, '을', '를');
      out[`${k}_eun`] = v + josa(v, '은', '는');
      out[`${k}_wa`] = v + josa(v, '과', '와');
    } else {
      out[`${k}_i`] = v; out[`${k}_eul`] = v; out[`${k}_eun`] = v; out[`${k}_wa`] = v;
    }
  }
  // English sentences often start with a faction: capitalise when used at the start.
  if (lang === 'en') {
    out.FactionA = out.factionA.charAt(0).toUpperCase() + out.factionA.slice(1);
    out.FactionB = out.factionB.charAt(0).toUpperCase() + out.factionB.slice(1);
  }
  return out;
}

/** Content text in one language with tokens filled in. Tokens inside the intro and accusation are filled too. */
export function render(t: Text | null | undefined, g: Game | null, lang: Lang): string {
  const ctx = tokens(g, lang);
  let s = fill(pick(t, lang), ctx);
  s = fill(s, ctx);
  if (lang === 'ko') s = particles(s);
  // A token such as "the Noron" can open a sentence: capitalise sentence starts in English.
  if (lang === 'en') s = s.replace(/(^|[.!?]\s+|“)([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase());
  return s;
}

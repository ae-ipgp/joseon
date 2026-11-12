/**
 * Turns a romanized given name into hangul (Giseok → 기석) and hangul into romanization (기석 → Gi-seok),
 * so a name typed in one script can be shown in both languages.
 *
 * Romanized names are split into syllables by a small search that prefers common name syllables
 * ("hyun", "joon", "woo"), the Revised Romanization rules, and Korean syllable structure
 * (a consonant between two vowels starts the next syllable). Hyphens, spaces and apostrophes
 * mark syllable breaks the player chose. Names that are not Korean get a loanword-style reading.
 */

// Hangul syllables are composed from 19 initials × 21 vowels × 28 finals (including none).

const compose = (cho: number, jung: number, jong = 0) => String.fromCharCode(0xac00 + (cho * 21 + jung) * 28 + jong);
const isHangul = (ch: string) => ch >= '가' && ch <= '힣';
export const hasHangul = (s: string) => /[가-힣]/.test(s);

// ---------------------------------------------------------------- romanization → hangul

type Mode = 'korean' | 'foreign';

/** Initial consonants, longest first. Values are indexes into CHO. */
const INITIALS: [string, number, number][] = [
  // [spelling, cho index, extra cost]
  ['kk', 1, 0], ['tt', 4, 0], ['pp', 8, 0], ['ss', 10, 0], ['jj', 13, 0], ['ch', 14, 0], ['kh', 15, 0.2], ['th', 9, 0.5], ['sh', 9, 0.1], ['ph', 17, 0.3],
  ['g', 0, 0], ['k', 0, 0], ['n', 2, 0], ['d', 3, 0], ['t', 16, 0], ['r', 5, 0], ['l', 5, 0.1], ['m', 6, 0], ['b', 7, 0], ['p', 17, 0],
  ['s', 9, 0], ['j', 12, 0], ['h', 18, 0], ['f', 17, 0.4], ['v', 7, 0.4], ['z', 12, 0.4], ['q', 15, 0.4],
];
/** Vowels, longest first. Values are indexes into JUNG. */
const VOWELS: [string, number, number][] = [
  ['yae', 3, 0], ['yeo', 6, 0], ['wae', 10, 0], ['eui', 19, 0.1], ['yoo', 17, 0.1], ['woo', 13, 0.1],
  ['ae', 1, 0], ['ya', 2, 0], ['eo', 4, 0], ['ye', 7, 0], ['wa', 9, 0], ['oe', 11, 0], ['yo', 12, 0], ['wo', 14, 0], ['we', 15, 0], ['wi', 16, 0],
  ['yu', 17, 0], ['eu', 18, 0], ['ui', 19, 0], ['oo', 13, 0.1], ['ee', 20, 0.1], ['wu', 13, 0.2],
  ['a', 0, 0], ['e', 5, 0], ['o', 8, 0], ['u', 13, 0], ['i', 20, 0], ['y', 20, 0.5],
];
/** Final consonants. Values are indexes into JONG. */
const FINALS: [string, number, number][] = [
  ['ng', 21, 0], ['k', 1, 0], ['g', 1, 0.1], ['n', 4, 0], ['l', 8, 0], ['r', 8, 0.3], ['m', 16, 0], ['p', 17, 0], ['b', 17, 0.1],
  ['t', 19, 0.2], ['d', 7, 0.3], ['s', 19, 0.4],
];

/** Name syllables people spell outside the Revised Romanization, and the usual hangul for them. */
const NAME_SYLLABLES: Record<string, string> = {
  hyun: '현', hyeon: '현', kyung: '경', kyeong: '경', gyeong: '경', gyung: '경', myung: '명', myeong: '명', hyung: '형', hyeong: '형',
  jung: '정', jeong: '정', joong: '중', sung: '성', seong: '성', young: '영', yeong: '영', chul: '철', cheol: '철', suk: '석', seok: '석',
  sook: '숙', joon: '준', jun: '준', woo: '우', wook: '욱', uk: '욱', hoon: '훈', hun: '훈', hee: '희', hui: '희', heui: '희', min: '민',
  yeon: '연', yun: '윤', yoon: '윤', eun: '은', seung: '승', kyu: '규', gyu: '규', lee: '이', yi: '이', ji: '지', bin: '빈', won: '원',
  yong: '용', kwang: '광', gwang: '광', il: '일', ho: '호', soo: '수', su: '수', ah: '아', eui: '의', oh: '오', doo: '두', du: '두',
  joo: '주', ju: '주', choon: '춘', chun: '춘', kook: '국', gook: '국', guk: '국', duk: '덕', deok: '덕', taek: '택', tae: '태', hye: '혜',
  yeol: '열', yul: '율', seol: '설', sul: '설', hwa: '화', chae: '채', shin: '신', sin: '신', sun: '선', seon: '선', soon: '순', mi: '미',
  ok: '옥', hae: '해', han: '한', kang: '강', gang: '강', dong: '동', jin: '진', chan: '찬', gun: '건', geon: '건', keon: '건', seo: '서',
  so: '소', da: '다', ha: '하', na: '나', ye: '예', yu: '유', yoo: '유', nam: '남', gi: '기', ki: '기', kyo: '교', gyo: '교', hyo: '효',
  ryeo: '려', ryu: '류', jae: '재', je: '제', hwan: '환', kwan: '관', gwan: '관', kwon: '권', gwon: '권', hyuk: '혁', hyeok: '혁',
  jong: '종', jeon: '전', si: '시', shi: '시', se: '세', bo: '보', beom: '범', bum: '범', byung: '병', byeong: '병', pyo: '표',
  ryeong: '령', ryung: '령', rin: '린', rim: '림', ram: '람', rang: '랑', ra: '라', ri: '리', ro: '로', ru: '루', mun: '문', moon: '문',
  sang: '상', san: '산', in: '인', on: '온', an: '안', ae: '애', a: '아', i: '이', u: '우', o: '오', eul: '을', hak: '학', baek: '백',
  kyeol: '결', gyeol: '결', seul: '슬', neul: '늘', reum: '름', bom: '봄', byeol: '별', bit: '빛', saem: '샘',
};

const VOWEL_CHARS = 'aeiouwy';
const isV = (ch: string | undefined) => !!ch && VOWEL_CHARS.includes(ch);
/** A true vowel. Glides (w, y) start a new syllable after a final consonant without trouble: Hyun-woo, Min-young. */
const isPureV = (ch: string | undefined) => !!ch && 'aeiou'.includes(ch);

type Cand = { end: number; text: string; cost: number; open: boolean; onsetL: boolean; finalL: boolean };

/** Every way a syllable can start at position i of the chunk. */
function candidates(s: string, i: number, mode: Mode, chunkStart: boolean): Cand[] {
  const out: Cand[] = [];
  const nextStartsVowel = (end: number) => end < s.length && isPureV(s[end]);

  // Known name syllables.
  if (mode === 'korean') {
    for (let len = 5; len >= 1; len--) {
      const piece = s.slice(i, i + len);
      const h = NAME_SYLLABLES[piece];
      if (piece.length !== len || !h) continue;
      const lastC = !isV(piece[piece.length - 1]);
      let cost = 1;
      if (!chunkStart && isV(piece[0])) cost += 0.6;
      if (lastC && nextStartsVowel(i + len)) cost += 1;
      out.push({ end: i + len, text: h, cost, open: !lastC, onsetL: false, finalL: false });
    }
  }

  // Initial + vowel + optional silent h + optional final.
  const inits: [string, number, number][] = [['', 11, chunkStart ? 0 : 0.6], ...INITIALS.filter(([r]) => s.startsWith(r, i))];
  for (const [ir, cho, ic] of inits) {
    let cIdx = cho;
    // English k, as in Kate, is ㅋ; in Korean names it is usually ㄱ.
    if (ir === 'k' && mode === 'foreign') cIdx = 15;
    const vStart = i + ir.length;
    for (const [vr, jung0, vc] of VOWELS) {
      if (!s.startsWith(vr, vStart)) continue;
      if ((vr === 'woo' || vr === 'wu') && ir) continue; // "woo" is 우 on its own, never after a consonant.
      if (vr === 'y' && vStart + 1 < s.length) continue; // y is a vowel only at the end: Lily.
      let jung = jung0;
      // sh + a/o/u/eo/e reads as 샤/쇼/슈/셔/셰.
      if (ir === 'sh') jung = ({ 0: 2, 8: 12, 13: 17, 4: 6, 5: 7 } as Record<number, number>)[jung0] ?? jung0;
      let after = vStart + vr.length;
      let cost = 1.3 + ic + vc;
      // A silent h after a vowel: John, Sarah.
      const silentH = s[after] === 'h' && !isV(s[after + 1]);
      if (silentH) { after += 1; cost += 0.3; }
      const base = { cho: cIdx, jung };
      out.push({ end: after, text: compose(base.cho, base.jung), cost, open: true, onsetL: ir === 'l', finalL: false });
      for (const [fr, jong, fc] of FINALS) {
        if (!s.startsWith(fr, after)) continue;
        const end = after + fr.length;
        // Loanwords rarely close a syllable on a stop: Hikmah is 히크마, Ahmad is 아마드.
        let c = cost + fc + (mode === 'foreign' && 'kgtdsbp'.includes(fr) ? 2 : 0);
        if (nextStartsVowel(end)) c += 1;
        // ng only closes a syllable before a consonant or at the end.
        out.push({ end, text: compose(base.cho, base.jung, jong), cost: c, open: false, onsetL: ir === 'l', finalL: fr === 'l' });
      }
    }
  }

  // A lone consonant reads with ㅡ, as loanwords do: the "th" in Elizabeth is 스.
  for (const [ir, cho] of INITIALS) {
    if (!s.startsWith(ir, i) || isV(s[i + ir.length])) continue;
    out.push({ end: i + ir.length, text: compose(ir === 'k' ? 15 : cho, 18), cost: mode === 'foreign' ? 1.8 : 3, open: true, onsetL: false, finalL: false });
  }
  return out;
}

/** The cheapest reading of one chunk of letters, or null if it cannot be read. */
function readChunk(s: string, mode: Mode): { text: string; cost: number } | null {
  if (!s) return { text: '', cost: 0 };
  const best: ({ cost: number; parts: Cand[] } | null)[] = Array(s.length + 1).fill(null);
  best[0] = { cost: 0, parts: [] };
  for (let i = 0; i < s.length; i++) {
    const b = best[i];
    if (!b) continue;
    for (const c of candidates(s, i, mode, i === 0)) {
      const cost = b.cost + c.cost;
      const cur = best[c.end];
      if (!cur || cost < cur.cost) best[c.end] = { cost, parts: [...b.parts, c] };
    }
  }
  const done = best[s.length];
  if (!done) return null;
  // Loanwords double an l between vowels: Elizabeth is 엘리자베스, not 에리자베스.
  const parts = done.parts.map((p) => p.text);
  if (mode === 'foreign') {
    for (let k = 1; k < done.parts.length; k++) {
      const prev = parts[k - 1];
      const code = prev.charCodeAt(0) - 0xac00;
      if (done.parts[k].onsetL && done.parts[k - 1].open && isHangul(prev) && code % 28 === 0) parts[k - 1] = String.fromCharCode(prev.charCodeAt(0) + 8);
    }
  }
  return { text: parts.join(''), cost: done.cost };
}

function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD').replace(/ŏ/g, 'eo').replace(/ŭ/g, 'eu').replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`]/g, "'")
    .replace(/ph/g, 'f').replace(/ck/g, 'k').replace(/qu/g, 'kw').replace(/x/g, 'ks')
    .replace(/c(?=[eiy])/g, 's').replace(/c(?!h)/g, 'k')
    .replace(/[^a-z' -]/g, '');
}

const looksForeign = (s: string) => /[fvzq]|th|ck|tt$|ss$|d$|[kmylrfst]ah$|ly$|[^aeiouywng'\- ]{3}/.test(s) || /(?:^|[^aeiou])(?:ie|ea|ay|ey|oa)(?:$|[^aeiou])/.test(s);

/** Hangul for a romanized given name, or null when it cannot be read. */
export function toHangul(raw: string): string | null {
  const s = normalize(raw.trim());
  if (!s.replace(/[' -]/g, '')) return null;
  const chunks = s.split(/[' -]+/).filter(Boolean);
  const read = (mode: Mode) => {
    let text = '';
    let cost = 0;
    for (const c of chunks) {
      const r = readChunk(c, mode);
      if (!r) return null;
      text += r.text;
      cost += r.cost;
    }
    return { text, cost };
  };
  const korean = looksForeign(s) ? null : read('korean');
  // Korean readings that need lone consonants are probably not Korean names.
  if (korean && korean.cost / Math.max(1, korean.text.length) < 2) return korean.text;
  return read('foreign')?.text ?? korean?.text ?? null;
}

// ---------------------------------------------------------------- hangul → romanization

const CHO_R = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const JUNG_R = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const JONG_R = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];

function syllableRoman(ch: string, first: boolean): string {
  const code = ch.charCodeAt(0) - 0xac00;
  const cho = Math.floor(code / 588);
  const jung = Math.floor((code % 588) / 28);
  const jong = code % 28;
  // 우 alone reads as "woo" in names written for English readers, as in Seon-woo.
  if (cho === 11 && jung === 13 && jong === 0) return first ? 'u' : 'woo';
  return CHO_R[cho] + JUNG_R[jung] + JONG_R[jong];
}

/** Revised Romanization for a hangul given name, written the way the game writes names: Gi-seok, Seol-hwa. */
export function toRoman(hangul: string): string {
  const syl = [...hangul.trim()].filter(isHangul);
  if (!syl.length) return hangul.trim();
  const parts = syl.map((ch, i) => syllableRoman(ch, i === 0));
  const s = parts.length > 1 ? `${parts[0]}-${parts.slice(1).join('')}` : parts[0];
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** A typed Latin name with its first letter capitalized and spacing tidied. */
export function tidyRoman(raw: string): string {
  const s = raw.trim().replace(/\s+/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}


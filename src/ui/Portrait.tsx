import type { PortraitSpec } from '../model/schemas';

type Kind = PortraitSpec['kind'];
type Def = {
  robe: string; under: string; accent: string;
  hair: 'braid' | 'bun' | 'top'; hat: 'none' | 'gat' | 'jeollip' | 'samo' | 'ikseon' | 'band';
  wear: 'jeogori' | 'dopo' | 'guard' | 'round' | 'royal' | 'dangui';
  beard: 'none' | 'short' | 'long'; male: boolean;
};

/** Costume rules per kind of person. Colours can be overridden; the cut and hat cannot. */
const KINDS: Record<Kind, Def> = {
  lady: { robe: '#D8BF73', under: '#8E2230', accent: '#6B1626', hair: 'braid', hat: 'none', wear: 'jeogori', beard: 'none', male: false },
  noblewoman: { robe: '#D9B6AE', under: '#5A2140', accent: '#5A2140', hair: 'bun', hat: 'none', wear: 'jeogori', beard: 'none', male: false },
  courtlady: { robe: '#6E8560', under: '#263247', accent: '#6B1626', hair: 'bun', hat: 'none', wear: 'jeogori', beard: 'none', male: false },
  queen: { robe: '#8C1C26', under: '#2C3E63', accent: '#B08D57', hair: 'bun', hat: 'none', wear: 'dangui', beard: 'none', male: false },
  scholar: { robe: '#A9C4B4', under: '#6B1626', accent: '#6B1626', hair: 'top', hat: 'gat', wear: 'dopo', beard: 'none', male: true },
  guard: { robe: '#1F2A3D', under: '#8E2230', accent: '#B08D57', hair: 'top', hat: 'jeollip', wear: 'guard', beard: 'none', male: true },
  minister: { robe: '#7A2230', under: '#22324A', accent: '#B08D57', hair: 'top', hat: 'samo', wear: 'round', beard: 'long', male: true },
  king: { robe: '#8C1C26', under: '#B08D57', accent: '#B08D57', hair: 'top', hat: 'ikseon', wear: 'royal', beard: 'short', male: true },
  // Children of both sexes wear the unmarried braid; boys keep it until they are married or capped.
  youth: { robe: '#D9AFA8', under: '#8E2230', accent: '#6B1626', hair: 'braid', hat: 'none', wear: 'jeogori', beard: 'none', male: false },
  boy: { robe: '#B9C7CF', under: '#3E5274', accent: '#3E5274', hair: 'braid', hat: 'none', wear: 'dopo', beard: 'none', male: true },
  // Servants and merchants: a topknot held by a horsehair headband, no hat, plain cotton.
  commoner: { robe: '#CFC3A8', under: '#5A4A3A', accent: '#5A4A3A', hair: 'top', hat: 'band', wear: 'dopo', beard: 'short', male: true },
};

const valid = (v?: string) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((c) => c.toString(16).padStart(2, '0')).join('');
}

const INK = '#1B1513';
/** GSDD Part VII §2.6: faces for the moods the game shows. Brows, eyes and mouth only; the likeness stays. */
const FACE: Record<'calm' | 'smile' | 'sad' | 'stern' | 'worried', { brows: string; eyes: string; mouth: string }> = {
  calm: { brows: 'M82,88.5 Q89,85.5 95,87.5 M105,87.5 Q111,85.5 118,88.5', eyes: 'M83,98 Q89,101.5 95,98 M105,98 Q111,101.5 117,98', mouth: 'M95,118 Q100,120 105,118' },
  smile: { brows: 'M82,87.5 Q89,84 95,86.5 M105,86.5 Q111,84 118,87.5', eyes: 'M83,99 Q89,95.5 95,99 M105,99 Q111,95.5 117,99', mouth: 'M93.5,116.5 Q100,123 106.5,116.5' },
  sad: { brows: 'M82,89.5 Q89,88 95,85 M105,85 Q111,88 118,89.5', eyes: 'M83,99 Q89,101 95,98.5 M105,98.5 Q111,101 117,99', mouth: 'M95,120 Q100,116.5 105,120' },
  stern: { brows: 'M82,86 Q89,87 95,89.8 M105,89.8 Q111,87 118,86', eyes: 'M83,98.5 L95,98.5 M105,98.5 L117,98.5', mouth: 'M95,119 L105,119' },
  worried: { brows: 'M82,88 Q89,86.5 95,85.5 M105,85.5 Q111,86.5 118,88', eyes: 'M83,98 Q89,100.5 95,98 M105,98 Q111,100.5 117,98', mouth: 'M95,119 Q97.5,117.5 100,119 Q102.5,120.5 105,119' },
};
const SKIN = '#E7C7A3';
const SKIN2 = '#D2A882';
const WHITE = '#F3EEE3';

/**
 * A costume-accurate bust, 200 × 240. These props are the contract for commissioned art:
 * swap the drawing, keep the props.
 */
export function Portrait({ spec, className, style }: { spec: PortraitSpec; className?: string; style?: Record<string, string | number> }) {
  const d = KINDS[spec.kind] ?? KINDS.lady;
  const HAIR = spec.grey ? '#8E8780' : INK;
  const longHair = !d.male || d.hair === 'braid';
  const robe = valid(spec.robe) ? spec.robe! : d.robe;
  const under = valid(spec.under) ? spec.under! : d.under;
  const accent = valid(spec.accent) ? spec.accent! : d.accent;
  const beard = spec.beard && spec.beard !== 'auto' ? spec.beard : d.beard;
  const expr = spec.expr ?? 'calm';
  const robeDark = shade(robe, -0.32), underDark = shade(under, -0.35), accentDark = shade(accent, -0.35);
  const body = d.wear === 'guard' ? under : robe;
  const ribbon = spec.kind === 'lady' ? accent : under;
  const y = (p: string) => p;
  const s = (fill: string) => ({ fill });
  const line = (stroke: string, w: number, extra: Record<string, string | number> = {}) => ({ fill: 'none', stroke, strokeWidth: w, ...extra });

  return (
    <svg viewBox="0 0 200 240" aria-hidden="true" className={className} style={{ display: 'block', overflow: 'visible', ...style }}>
      {longHair && <path d="M66,100 C62,60 80,46 100,46 C120,46 138,60 134,100 C134,112 128,120 120,124 L80,124 C72,120 66,112 66,100 Z" style={s(HAIR)} />}
      {d.hair === 'bun' && (
        <g>
          <ellipse cx="100" cy="118" rx="31" ry="12" style={s(HAIR)} />
          <rect x="50" y="113" width="100" height="5" rx="2.5" style={s('#B08D57')} />
          <circle cx="50" cy="115.5" r="4.2" style={s('#C9A86A')} />
          <circle cx="150" cy="115.5" r="3" style={s('#C9A86A')} />
        </g>
      )}
      <path d="M89,116 L89,152 Q100,160 111,152 L111,116 Z" style={s(SKIN2)} />
      <path d="M12,240 C16,198 38,172 72,162 L90,150 Q100,156 110,150 L128,162 C162,172 184,198 188,240 Z" style={s(body)} />

      {d.wear === 'guard' && (
        <g>
          <path d="M46,240 C48,204 60,180 80,166 L90,152 Q100,158 110,152 L120,166 C140,180 152,204 154,240 Z" style={s(robe)} />
          <path d="M46,240 C48,204 60,180 80,166 M154,240 C152,204 140,180 120,166" style={line(robeDark, 1.4)} />
          <path d="M84,152 Q100,143 116,152 L113,158 Q100,151 87,158 Z" style={s(robeDark)} />
          <path d="M85,154 L92,152 L106,180 L99,185 Z" style={s(robeDark)} />
          <path d="M110,152 L120,154 L82,226 L70,222 Z" style={s(robeDark)} />
          <path d="M111,151 L119,153 L113,165 L106,162 Z" style={s(WHITE)} />
          <path d="M85,154 L90,152 L95,162 L91,164 Z" style={s(WHITE)} />
          <path d="M46,226 Q100,212 154,226 L154,234 Q100,220 46,234 Z" style={s(accent)} />
        </g>
      )}
      {d.wear === 'jeogori' && (
        <g>
          <path d="M50,240 C52,226 54,218 58,214 Q100,198 142,214 C146,218 148,226 150,240 Z" style={s(under)} />
          <path d="M76,210 L74,240 M90,205 L89,240 M110,205 L111,240 M124,210 L126,240" style={line(underDark, 1.2, { opacity: 0.6 })} />
          <path d="M44,192 Q50,216 52,240 M156,192 Q150,216 148,240 M58,214 Q100,198 142,214" style={line(robeDark, 1.1, { opacity: 0.55 })} />
          <path d="M84,152 Q100,143 116,152 L113,158 Q100,151 87,158 Z" style={s(accent)} />
          <path d="M85,154 L92,152 L106,178 L99,183 Z" style={s(accent)} />
          <path d="M110,152 L119,154 L86,212 L76,207 Z" style={s(accent)} />
          <path d="M111,151 L118,153 L112,164 L106,161 Z" style={s(WHITE)} />
          <path d="M85,154 L90,152 L95,162 L91,164 Z" style={s(WHITE)} />
          <path d="M78,213 L68,240 L77,240 L84,214 Z" style={s(accent)} />
          <path d="M84,213 L89,240 L97,240 L89,212 Z" style={s(accent)} />
          <ellipse cx="82" cy="210" rx="7" ry="4.5" style={s(accent)} />
          <path d="M76,210 Q82,206 88,210" style={line(accentDark, 1)} />
        </g>
      )}
      {d.wear === 'dangui' && (
        <g>
          <path d="M40,240 C44,214 52,196 66,186 L134,186 C148,196 156,214 160,240 Z" style={s(under)} />
          <path d="M84,152 Q100,143 116,152 L113,158 Q100,151 87,158 Z" style={s(robeDark)} />
          <path d="M110,152 L119,154 L86,212 L76,207 Z" style={s(robeDark)} />
          <path d="M111,151 L118,153 L112,164 L106,161 Z" style={s(WHITE)} />
          <circle cx="100" cy="218" r="18" style={s(accent)} />
          <circle cx="58" cy="206" r="9" style={s(accent)} />
          <circle cx="142" cy="206" r="9" style={s(accent)} />
          <path d="M92,224 C88,212 102,206 108,212 C113,217 106,226 99,222" style={line(robe, 2, { strokeLinecap: 'round' })} />
        </g>
      )}
      {d.wear === 'dopo' && (
        <g>
          <path d="M42,190 Q48,216 50,240 M158,190 Q152,216 150,240" style={line(robeDark, 1.1, { opacity: 0.5 })} />
          <path d="M84,152 Q100,143 116,152 L113,158 Q100,151 87,158 Z" style={s(robeDark)} />
          <path d="M85,154 L92,152 L108,184 L101,189 Z" style={s(robeDark)} />
          <path d="M110,152 L120,154 L76,240 L63,240 Z" style={s(robeDark)} />
          <path d="M111,151 L119,153 L113,165 L106,162 Z" style={s(WHITE)} />
          <path d="M85,154 L90,152 L95,162 L91,164 Z" style={s(WHITE)} />
          <path d="M24,226 Q100,204 176,226" style={line(under, 3.2)} />
          <circle cx="96" cy="213" r="3.6" style={s(under)} />
          <path d="M95,216 L92,240 M98,216 L99,240" style={line(under, 2)} />
        </g>
      )}
      {(d.wear === 'round' || d.wear === 'royal') && (
        <g>
          <path d="M80,150 Q100,166 120,150 L125,153 Q100,176 75,153 Z" style={s(robeDark)} />
          <path d="M86,150 Q100,160 114,150 L113,147 Q100,156 87,147 Z" style={s(WHITE)} />
          <path d="M44,192 Q50,216 52,240 M156,192 Q150,216 148,240" style={line(robeDark, 1.1, { opacity: 0.5 })} />
        </g>
      )}
      {d.wear === 'round' && (
        <g>
          <rect x="74" y="192" width="52" height="50" style={{ fill: under, stroke: accent, strokeWidth: 1.5 }} />
          <path d="M90,224 Q80,208 76,214 Q84,216 92,228 Z" style={s('#EFE8DA')} />
          <path d="M108,224 Q120,208 124,214 Q116,216 106,228 Z" style={s('#EFE8DA')} />
          <ellipse cx="100" cy="224" rx="9" ry="5.5" style={s('#EFE8DA')} />
          <path d="M106,221 Q114,210 110,203" style={line('#EFE8DA', 2.2, { strokeLinecap: 'round' })} />
          <circle cx="110" cy="202" r="2.6" style={s('#B23A3A')} />
          <path d="M80,236 q4,-4 8,0 q4,-4 8,0 M104,236 q4,-4 8,0 q4,-4 8,0" style={line(accent, 1.2)} />
        </g>
      )}
      {d.wear === 'royal' && (
        <g>
          <circle cx="100" cy="214" r="24" style={s(accent)} />
          <circle cx="100" cy="214" r="19.5" style={line(robeDark, 1)} />
          <path d="M88,222 C84,208 100,198 108,205 C116,212 108,225 99,221 C93,218 97,210 104,212" style={line(robe, 2.4, { strokeLinecap: 'round' })} />
          <circle cx="44" cy="200" r="16" style={s(accent)} />
          <circle cx="156" cy="200" r="16" style={s(accent)} />
          <path d="M38,206 C35,196 46,190 50,196 C53,201 46,206 43,202 M150,206 C147,196 158,190 162,196 C165,201 158,206 155,202" style={line(robe, 1.8, { strokeLinecap: 'round' })} />
        </g>
      )}
      {d.hair === 'braid' && (
        <g style={{ stroke: '#3A2E2A', strokeWidth: 0.8 }}>
          {[[70, 122, 6.8], [66, 134, 6.8], [62, 146, 6.8], [59, 158, 6.6], [56, 170, 6.4], [54, 182, 6], [52, 193, 5.6]].map(([cx, cy, rx]) => (
            <ellipse key={cy} cx={cx} cy={cy} rx={rx} ry="7.5" style={s(HAIR)} />
          ))}
          <path d="M45,200 L59,200 L61,236 L52,229 L43,236 Z" style={{ fill: ribbon, stroke: 'none' }} />
        </g>
      )}

      {d.male && (
        <g>
          <ellipse cx="71.5" cy="97" rx="4.5" ry="8" style={s(SKIN2)} />
          <ellipse cx="128.5" cy="97" rx="4.5" ry="8" style={s(SKIN2)} />
        </g>
      )}
      <path d="M71,92 C71,66 84,56 100,56 C116,56 129,66 129,92 C129,114 117,132 100,132 C83,132 71,114 71,92 Z" style={s(SKIN)} />
      <path d="M76,108 C80,122 90,131 100,132 C88,128 80,120 76,108 Z" style={{ fill: SKIN2, opacity: 0.5 }} />
      {!d.male && (
        <g>
          <circle cx="84" cy="109" r="7" style={{ fill: '#D98E86', opacity: 0.22 }} />
          <circle cx="116" cy="109" r="7" style={{ fill: '#D98E86', opacity: 0.22 }} />
        </g>
      )}
      <path d={y(FACE[expr].brows)} style={line(INK, d.male ? 2.4 : 1.3, { strokeLinecap: 'round', opacity: 0.88 })} />
      <path d={FACE[expr].eyes} style={line(INK, 1.8, { strokeLinecap: 'round' })} />
      <path d="M99,103 Q97,110 101,111.5" style={line('#B98B68', 1.1, { strokeLinecap: 'round' })} />
      {d.male || expr !== 'calm'
        ? <path d={FACE[expr].mouth} style={line(d.male ? '#8F5A4A' : '#A33F48', d.male ? 1.4 : 1.8, { strokeLinecap: 'round' })} />
        : <path d="M94.5,118 Q100,115.8 105.5,118 Q100,122 94.5,118 Z" style={s('#A33F48')} />}
      {expr === 'smile' && !d.male && (
        <g>
          <circle cx="84" cy="109" r="7" style={{ fill: '#D98E86', opacity: 0.3 }} />
          <circle cx="116" cy="109" r="7" style={{ fill: '#D98E86', opacity: 0.3 }} />
        </g>
      )}

      {longHair && (
        <g>
          <path d="M68,102 C66,64 82,48 100,48 C118,48 134,64 132,102 C130,90 126,80 118,74 C112,70 106,70 100,72 C94,70 88,70 82,74 C74,80 70,90 68,102 Z" style={s(HAIR)} />
          <path d="M100,49 L100,71" style={line('#4A3B35', 1.2)} />
          <path d="M84,57 Q91,52 97,53" style={line('#4F403A', 1.6, { strokeLinecap: 'round', opacity: 0.7 })} />
          {spec.kind === 'queen' && <path d="M84,50 Q100,40 116,50 L112,54 Q100,46 88,54 Z" style={s('#C9A86A')} />}
        </g>
      )}
      {d.male && !longHair && (
        <g>
          <path d="M71,84 C71,66 84,56 100,56 C116,56 129,66 129,84 Q100,76 71,84 Z" style={s(HAIR)} />
          <path d="M71,80 Q100,72 129,80 L129,87 Q100,79 71,87 Z" style={{ fill: HAIR, opacity: 0.92 }} />
          <path d="M71.5,87 L72.5,100 L76,87 Z M128.5,87 L127.5,100 L124,87 Z" style={s(HAIR)} />
        </g>
      )}
      {beard === 'long' && (
        <g>
          <path d="M90,124 Q100,131 110,124 Q112,152 104,180 Q100,188 96,180 Q88,152 90,124 Z" style={{ fill: HAIR, opacity: 0.9 }} />
          <path d="M86,116 Q93,111 100,114 Q107,111 114,116 Q107,119.5 100,117 Q93,119.5 86,116 Z" style={s(HAIR)} />
        </g>
      )}
      {beard === 'short' && (
        <g>
          <path d="M93,124 Q100,129 107,124 Q106,140 100,147 Q94,140 93,124 Z" style={{ fill: HAIR, opacity: 0.9 }} />
          <path d="M86,116 Q93,111 100,114 Q107,111 114,116 Q107,119.5 100,117 Q93,119.5 86,116 Z" style={s(HAIR)} />
        </g>
      )}

      {d.hat === 'gat' && (
        <g>
          <path d="M81,62 L83,24 Q100,19 117,24 L119,62 Z" style={{ fill: INK, opacity: 0.86 }} />
          <ellipse cx="100" cy="24" rx="17" ry="4" style={s('#2A211E')} />
          <path d="M81,57 Q100,61 119,57 L119,62 Q100,66 81,62 Z" style={s('#2A211E')} />
          <ellipse cx="100" cy="64" rx="66" ry="10" style={{ fill: INK, opacity: 0.72 }} />
          <ellipse cx="100" cy="64" rx="66" ry="10" style={line('#4A3D37', 0.8)} />
          <path d="M78,70 Q72,120 100,140 M122,70 Q128,120 100,140" style={line('#2A211E', 1.2)} />
          <path d="M100,140 Q95,172 101,206" style={line('#3A2E2A', 2.8, { strokeDasharray: '0.1 4.4', strokeLinecap: 'round' })} />
        </g>
      )}
      {d.hat === 'jeollip' && (
        <g>
          <path d="M74,66 Q73,30 100,28 Q127,30 126,66 Z" style={s(INK)} />
          <path d="M75,58 Q100,54 125,58 L125,63 Q100,59 75,63 Z" style={{ fill: accent, opacity: 0.85 }} />
          <ellipse cx="100" cy="67" rx="50" ry="8.5" style={s(INK)} />
          <path d="M110,30 Q138,12 160,20" style={line('#2F5E55', 2, { strokeLinecap: 'round' })} />
          <circle cx="160" cy="20" r="4.5" style={{ fill: '#2F5E55', stroke: accent, strokeWidth: 1 }} />
          <path d="M100,29 C93,20 86,14 91,9 C95,15 99,14 100,8 C101,14 105,15 109,9 C114,14 107,20 100,29 Z" style={s(under)} />
          <circle cx="100" cy="28" r="3" style={s(accent)} />
        </g>
      )}
      {d.hat === 'samo' && (
        <g>
          <ellipse cx="52" cy="62" rx="24" ry="7" transform="rotate(-6 52 62)" style={s(INK)} />
          <ellipse cx="148" cy="62" rx="24" ry="7" transform="rotate(6 148 62)" style={s(INK)} />
          <ellipse cx="100" cy="50" rx="22" ry="20" style={s(INK)} />
          <path d="M69,82 Q66,56 100,54 Q134,56 131,82 Q100,74 69,82 Z" style={s(INK)} />
          <path d="M77,73 Q100,65 123,73" style={line('#3D322D', 1)} />
        </g>
      )}
      {d.hat === 'band' && (
        <g>
          <ellipse cx="100" cy="52" rx="11" ry="9.5" style={s(HAIR)} />
          <rect x="96" y="43" width="8" height="4" rx="2" style={s('#B08D57')} />
          <path d="M71,79 Q100,69 129,79 L129,88 Q100,78 71,88 Z" style={{ fill: INK, opacity: 0.95 }} />
          <path d="M73,83 Q100,74 127,83" style={line('#3D322D', 0.8)} />
        </g>
      )}
      {d.hat === 'ikseon' && (
        <g>
          <ellipse cx="80" cy="34" rx="9" ry="18" transform="rotate(-20 80 34)" style={s(INK)} />
          <ellipse cx="120" cy="34" rx="9" ry="18" transform="rotate(20 120 34)" style={s(INK)} />
          <ellipse cx="100" cy="48" rx="23" ry="20" style={s(INK)} />
          <path d="M69,82 Q66,56 100,54 Q134,56 131,82 Q100,74 69,82 Z" style={s(INK)} />
          <path d="M77,73 Q100,65 123,73" style={line('#3D322D', 1)} />
        </g>
      )}
    </svg>
  );
}

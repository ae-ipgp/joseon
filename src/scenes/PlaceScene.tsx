import { memo, useId, useMemo, type ReactNode } from 'react';
import type { SceneKind } from '../model/content';
import { band, bareTree, cluster, eave, ell, hips, japsang, peak, range, rects, ridge, rng, roof, stars } from './kit';

type Props = { kind: SceneKind; time: 'day' | 'night'; season: number; className?: string };

/** Mixes a colour toward another, 0 to 1. */
function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return '#' + [c(16), c(8), c(0)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
const NIGHT = '#0B0A12';

const DAY = {
  sky1: '#E7D8B9', sky2: '#CDB38A', haze: 0.65, stars: 0, moon: 0, hillFar: '#A39A84', hillNear: '#877E6B', mist: '#F2EADA', mistOp: 0.55,
  wall: '#CFC0A2', wallLine: '#B5A584', wallCap: '#3B3632', ground: '#B4A27F', paving: '#A8977A', door: '#6B2A22',
  roof: '#34302D', roofLine: '#48433E', ridge: '#DED6C6', dan1: '#3E6B62', dan2: '#8C2A22', dan3: '#D9C27A', column: '#7A2A22', wood: '#6B4A35',
  interior: '#2A2420', lat: '#CDB792', latLine: '#5A4636', glow: 0, stone: '#9C9488', stoneDark: '#7D766B',
  water1: '#7C8B81', water2: '#4C5B56', ripple: '#B2BEB4', refl: 0.34, trunk: '#3A2A24', lotus: '#6E6A3C', lantern: 0, vig: 0.24,
  straw: '#B49A62', strawDark: '#8C7444', red: '#9A2B24',
};
type Pal = typeof DAY & { leaf1: string; leaf2: string; leaf3: string; snow: string; snowOp: number; fruit: string };

const SEASON_LEAVES: [string, string, string][] = [
  ['#E3A9B4', '#C98896', '#9DB07A'], // spring: blossom and new leaves
  ['#55704A', '#6F8A55', '#8FA265'], // summer
  ['#8E2A2A', '#B04A2C', '#C99A45'], // autumn: maples
  ['#6B5E52', '#7A6C5E', '#857867'], // winter: bare wood
];

function palette(time: 'day' | 'night', season: number): Pal {
  const leaves = SEASON_LEAVES[season] ?? SEASON_LEAVES[2];
  const winter = season === 3;
  let p: Pal = {
    ...DAY, leaf1: leaves[0], leaf2: leaves[1], leaf3: leaves[2], snow: '#F1EEE6', snowOp: winter ? 0.9 : 0,
    fruit: season === 2 ? '#E07A2E' : season === 3 ? '#C9622A' : 'transparent',
  };
  if (winter) p = { ...p, sky1: '#DCD8CE', sky2: '#B9B3A6', ground: '#CFC9BC', paving: '#C2BBAD', hillFar: '#A8A69E', hillNear: '#8E8B83', mist: '#F4F2EC' };
  if (season === 0) p = { ...p, sky1: '#EADFC8', sky2: '#D4C29C' };
  if (season === 1) p = { ...p, sky1: '#E4DCC0', sky2: '#C6B88F', hillFar: '#8F9A80', hillNear: '#76806A' };
  if (time === 'day') return p;
  const dark = (c: string, t = 0.72) => mix(c, NIGHT, t);
  return {
    ...p,
    sky1: '#08090F', sky2: '#26141D', haze: 0, stars: 0.6, moon: 1, hillFar: '#1A1922', hillNear: '#14131A', mist: '#8E87A0', mistOp: 0.12,
    wall: '#2A2730', wallLine: '#221F28', wallCap: '#111017', ground: '#1E1B22', paving: '#25222A', door: '#2A1416',
    roof: '#121118', roofLine: '#1C1A22', ridge: '#4B4754', dan1: '#1D2E2B', dan2: '#3A1A1C', dan3: '#4A4232', column: '#3A1A18', wood: '#2A2020',
    interior: '#0A090D', lat: '#2A2530', latLine: '#141218', glow: 0.16, stone: '#35333B', stoneDark: '#2A2830',
    water1: '#161A26', water2: '#090B11', ripple: '#3E4660', refl: 0.5, trunk: '#0E0B0B', lotus: '#1E2219', lantern: 1, vig: 0.62,
    straw: '#3A3226', strawDark: '#2A241C', red: '#4A1A18',
    leaf1: dark(p.leaf1), leaf2: dark(p.leaf2), leaf3: dark(p.leaf3), snow: '#8D93A6', snowOp: winter ? 0.7 : 0, fruit: season >= 2 ? '#5A3420' : 'transparent',
  };
}

type Ids = { tile: string; dan: string; lat: string; sky: string; haze: string; halo: string; lamp: string; mist: string; water: string; vig: string; grain: string; clip: string };

/** One hall: columns, lattice doors, painted band, roof and ridge. */
function Hall({ cx, top, w, h, bodyH, P, ids, cols = 6, ridged = true, painted = true, tiers = 1, lit = 1 }: {
  cx: number; top: number; w: number; h: number; bodyH: number; P: Pal; ids: Ids; cols?: number; ridged?: boolean; painted?: boolean; tiers?: 1 | 2; lit?: number;
}) {
  const bodyTop = top + h * 0.92;
  const bw = w * 0.78;
  const x0 = cx - bw / 2;
  const colXs = Array.from({ length: cols }, (_, i) => x0 + 8 + (i * (bw - 26)) / (cols - 1));
  const upper = tiers === 2 ? { top: top - h * 1.05, w: w * 0.72, h: h * 0.95 } : null;
  return (
    <g>
      {upper && (
        <g>
          <rect x={cx - upper.w * 0.36} y={upper.top + upper.h * 0.9} width={upper.w * 0.72} height={top - upper.top - upper.h * 0.9 + 6} style={{ fill: P.interior }} />
          <rect x={cx - upper.w * 0.36} y={upper.top + upper.h * 0.95} width={upper.w * 0.72} height={14} style={{ fill: `url(#${ids.lat})` }} />
          <path d={rects(range(cx - upper.w * 0.34, cx + upper.w * 0.34, upper.w * 0.17), upper.top + upper.h * 0.9, 10, top - upper.top - upper.h * 0.9)} style={{ fill: painted ? P.column : P.wood }} />
          {painted && <path d={band(cx, upper.top, upper.w, upper.h, 14)} style={{ fill: `url(#${ids.dan})` }} />}
          <path d={roof(cx, upper.top, upper.w, upper.h)} style={{ fill: `url(#${ids.tile})` }} />
          <path d={roof(cx, upper.top, upper.w, upper.h)} style={{ fill: P.snow, opacity: P.snowOp * 0.55 }} />
          <path d={eave(cx, upper.top, upper.w, upper.h)} style={{ fill: 'none', stroke: P.ridge, strokeWidth: 2, opacity: 0.5 }} />
          <path d={hips(cx, upper.top, upper.w, upper.h)} style={{ fill: 'none', stroke: P.ridge, strokeWidth: 5, strokeLinecap: 'round' }} />
          <path d={japsang(cx, upper.top, upper.w, upper.h)} style={{ fill: P.roof }} />
          {ridged && <path d={ridge(cx, upper.top, upper.w)} style={{ fill: P.ridge }} />}
        </g>
      )}
      <rect x={x0} y={bodyTop} width={bw} height={bodyH} style={{ fill: P.interior }} />
      <rect x={x0} y={bodyTop + bodyH * 0.38} width={bw} height={bodyH * 0.5} style={{ fill: '#F2C27A', opacity: P.glow * lit }} />
      <rect x={x0} y={bodyTop + 16} width={bw} height={Math.min(26, bodyH * 0.22)} style={{ fill: `url(#${ids.lat})` }} />
      <rect x={x0} y={bodyTop + bodyH * 0.42} width={bw} height={bodyH * 0.5} style={{ fill: `url(#${ids.lat})`, opacity: 0.55 }} />
      <path d={rects(colXs, bodyTop, 14, bodyH)} style={{ fill: painted ? P.column : P.wood }} />
      <rect x={x0 - 6} y={bodyTop} width={bw + 12} height={14} style={{ fill: painted ? P.dan1 : P.wood }} />
      {painted && <rect x={x0 - 6} y={bodyTop + 5} width={bw + 12} height={3} style={{ fill: P.dan3, opacity: 0.7 }} />}
      {painted && <path d={band(cx, top, w, h, 18)} style={{ fill: `url(#${ids.dan})` }} />}
      <path d={roof(cx, top, w, h)} style={{ fill: `url(#${ids.tile})` }} />
      <path d={roof(cx, top, w, h)} style={{ fill: P.snow, opacity: P.snowOp * 0.55 }} />
      <path d={eave(cx, top, w, h)} style={{ fill: 'none', stroke: P.ridge, strokeWidth: 2, opacity: 0.5 }} />
      <path d={hips(cx, top, w, h)} style={{ fill: 'none', stroke: P.ridge, strokeWidth: 5, strokeLinecap: 'round' }} />
      {painted && <path d={japsang(cx, top, w, h)} style={{ fill: P.roof }} />}
      {ridged && <path d={ridge(cx, top, w)} style={{ fill: P.ridge }} />}
      <rect x={x0 - 10} y={bodyTop + bodyH} width={bw + 20} height={10} style={{ fill: P.stone }} />
    </g>
  );
}

/** A long low corridor building (haenggak) running to the frame's edge. */
function Corridor({ x0, x1, top, P, ids }: { x0: number; x1: number; top: number; P: Pal; ids: Ids }) {
  return (
    <g>
      <rect x={x0} y={top + 26} width={x1 - x0} height={70} style={{ fill: P.interior }} />
      <path d={rects(range(x0 + 10, x1, 64), top + 26, 10, 70)} style={{ fill: P.column }} />
      <rect x={x0} y={top + 40} width={x1 - x0} height={16} style={{ fill: `url(#${ids.lat})` }} />
      <path d={`M${x0 - 20},${top + 34}L${x1 + 20},${top + 34}L${x1},${top}L${x0},${top}Z`} style={{ fill: `url(#${ids.tile})` }} />
      <path d={`M${x0 - 20},${top + 34}L${x1 + 20},${top + 34}L${x1},${top}L${x0},${top}Z`} style={{ fill: P.snow, opacity: P.snowOp * 0.5 }} />
      <rect x={x0} y={top - 6} width={x1 - x0} height={7} style={{ fill: P.ridge }} />
    </g>
  );
}

function Lantern({ x, y, ids }: { x: number; y: number; ids: Ids }) {
  return (
    <g>
      <circle cx={x} cy={y + 20} r="70" style={{ fill: `url(#${ids.lamp})` }} />
      <path d={`M${x},${y - 30}V${y}`} style={{ stroke: '#4A4652', strokeWidth: 1.2 }} />
      <rect x={x - 12} y={y} width="24" height="16" rx="3" style={{ fill: '#3A5A8C' }} />
      <rect x={x - 12} y={y + 14} width="24" height="18" rx="3" style={{ fill: '#B23A3A' }} />
      <rect x={x - 10} y={y - 3} width="20" height="4" style={{ fill: '#C9A86A' }} />
      <rect x={x - 10} y={y + 31} width="20" height="4" style={{ fill: '#C9A86A' }} />
    </g>
  );
}

/** Foliage for one tree: three layers of leaves, or bare branches in winter. */
function Tree({ trunk, leaves, bare, P }: { trunk: string; leaves: [string, string, string]; bare: string; P: Pal }) {
  const winter = P.snowOp > 0;
  return (
    <g>
      <path d={trunk} style={{ fill: 'none', stroke: P.trunk, strokeWidth: 7, strokeLinecap: 'round' }} />
      {winter ? (
        <path d={bare} style={{ fill: 'none', stroke: P.trunk, strokeWidth: 2.4, strokeLinecap: 'round', opacity: 0.85 }} />
      ) : (
        <g>
          <path d={leaves[2]} style={{ fill: P.leaf3 }} />
          <path d={leaves[1]} style={{ fill: P.leaf2 }} />
          <path d={leaves[0]} style={{ fill: P.leaf1 }} />
        </g>
      )}
    </g>
  );
}

function useArt(kind: SceneKind) {
  return useMemo(() => {
    const r = rng(kind.length * 97 + kind.charCodeAt(0) * 13);
    // Every shape takes its own seed from where it stands, so a re-render never redraws it differently.
    const seeded = (...a: number[]) => rng(a.reduce((h, v) => (Math.imul(h, 31) + Math.round(v)) | 0, 7919) >>> 0 || 1);
    const tree = (cx: number, cy: number, spread: number, n: number, rmin: number, rmax: number) => {
      const t = seeded(cx, cy, spread, n);
      return [cluster(t, cx, cy, spread, n, rmin, rmax), cluster(t, cx, cy, spread, n, rmin, rmax), cluster(t, cx, cy, spread, n, rmin, rmax)] as [string, string, string];
    };
    const cl = (cx: number, cy: number, spread: number, n: number, rmin: number, rmax: number) => cluster(seeded(cx, cy, spread, n, 1), cx, cy, spread, n, rmin, rmax);
    const bare = (x: number, base: number, h: number) => bareTree(seeded(x, base, h, 2), x, base, h);
    let ripples = '';
    for (let i = 0; i < 46; i++) ripples += `M${Math.round(r() * 1600)},${Math.round(664 + r() * 224)}h${Math.round(18 + r() * 70)}`;
    let pads = '';
    [[180, 770], [262, 812], [430, 724], [520, 864], [700, 790], [820, 846], [1500, 830], [1420, 770], [610, 700]].forEach((p) => { pads += ell(p[0], p[1], 30 + r() * 10, 8 + r() * 3); });
    let edge = '';
    for (let x = 0; x < 1600;) { const w = 34 + r() * 26; edge += `M${Math.round(x)},632h${Math.round(w)}v12h${-Math.round(w)}Z`; x += w + 3; }
    let paving = '';
    for (let y = 700; y < 900; y += 28) paving += `M0,${y}H1600`;
    for (let i = 0; i < 26; i++) { const x = -200 + i * 80; paving += `M${800 + (x - 800) * 0.35},690L${x},900`; }
    return { tree, cl, bare, ripples, pads, edge, paving, stars: stars(r, 44) };
  }, [kind]);
}

function PlaceSceneInner({ kind, time, season, className }: Props) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ids: Ids = {
    tile: raw + 't', dan: raw + 'd', lat: raw + 'l', sky: raw + 's', haze: raw + 'h', halo: raw + 'o', lamp: raw + 'p',
    mist: raw + 'm', water: raw + 'w', vig: raw + 'v', grain: raw + 'g', clip: raw + 'c',
  };
  const P = palette(time, season);
  const A = useArt(kind);
  const night = time === 'night';
  const winter = season === 3;

  let body: ReactNode = null;
  if (kind === 'garden') {
    body = (
      <g>
        <Tree trunk="M120,520 L114,600 M226,500 L232,600 M790,500 L786,580 M1480,470 L1474,620 M1528,480 L1536,620" leaves={A.tree(170, 470, 150, 26, 18, 40)} bare={A.bare(170, 600, 150) + A.bare(1500, 620, 170)} P={P} />
        <Tree trunk="" leaves={A.tree(1480, 420, 170, 30, 20, 44)} bare="" P={P} />
        <path d="M-20,542 L790,542 L770,522 L0,522 Z" style={{ fill: P.wallCap }} />
        <rect x="0" y="516" width="772" height="7" style={{ fill: P.ridge }} />
        <rect x="-10" y="540" width="790" height="76" style={{ fill: P.wall }} />
        <path d="M0,560H780M0,580H780M0,600H780" style={{ fill: 'none', stroke: P.wallLine, strokeWidth: 1, opacity: 0.6 }} />
        <rect x="548" y="514" width="104" height="102" style={{ fill: P.wall }} />
        <rect x="566" y="536" width="68" height="80" style={{ fill: P.door }} />
        <path d={roof(600, 470, 200, 56)} style={{ fill: `url(#${ids.tile})` }} />
        <path d={ridge(600, 470, 200)} style={{ fill: P.ridge }} />
        <rect x="0" y="612" width="1600" height="34" style={{ fill: P.ground }} />
        <rect x="0" y="642" width="1600" height="258" style={{ fill: `url(#${ids.water})` }} />
        <path d={A.ripples} style={{ fill: 'none', stroke: P.ripple, strokeWidth: 1.4, strokeLinecap: 'round', opacity: 0.45 }} />
        {night && <ellipse cx="360" cy="730" rx="46" ry="5" style={{ fill: '#EDE3CC', opacity: 0.5 }} />}
        {!winter && <path d={A.pads} style={{ fill: P.lotus }} />}
        {winter && <path d={A.pads} style={{ fill: P.snow, opacity: 0.5 }} />}
        <path d={A.edge} style={{ fill: P.stone, stroke: P.stoneDark, strokeWidth: 1 }} />
        <g clipPath={`url(#${ids.clip})`} opacity={P.refl}>
          <g transform="translate(0,1292) scale(1,-1)">
            <Hall cx={1120} top={300} w={560} h={130} bodyH={150} P={P} ids={ids} cols={4} />
          </g>
        </g>
        <Hall cx={1120} top={300} w={560} h={130} bodyH={150} P={P} ids={ids} cols={4} />
        <path d={rects([930, 1038, 1198, 1306], 580, 20, 70)} style={{ fill: P.stone, stroke: P.stoneDark, strokeWidth: 1 }} />
        {night && <g><Lantern x={980} y={462} ids={ids} /><Lantern x={1262} y={462} ids={ids} /></g>}
        <path d="M-20,40 C80,60 160,70 260,110 C300,126 340,128 384,120" style={{ fill: 'none', stroke: P.trunk, strokeWidth: 8, strokeLinecap: 'round' }} />
        <path d="M150,72 C170,40 200,30 232,24 M260,110 C272,140 300,160 332,170" style={{ fill: 'none', stroke: P.trunk, strokeWidth: 4, strokeLinecap: 'round' }} />
        {!winter && <g><path d={A.tree(110, 60, 80, 26, 7, 15)[1]} style={{ fill: P.leaf2 }} /><path d={A.tree(280, 80, 70, 22, 6, 13)[0]} style={{ fill: P.leaf1 }} /></g>}
      </g>
    );
  } else if (kind === 'queen') {
    body = (
      <g>
        <Tree trunk="M260,520 L256,600 M1360,500 L1366,600" leaves={A.tree(260, 430, 150, 24, 18, 38)} bare={A.bare(260, 600, 170) + A.bare(1360, 600, 160)} P={P} />
        <Tree trunk="" leaves={A.tree(1360, 420, 150, 24, 18, 38)} bare="" P={P} />
        <Corridor x0={-20} x1={330} top={470} P={P} ids={ids} />
        <Corridor x0={1270} x1={1620} top={470} P={P} ids={ids} />
        <Hall cx={800} top={300} w={900} h={140} bodyH={168} P={P} ids={ids} cols={8} ridged={false} />
        <rect x="360" y="606" width="880" height="40" style={{ fill: P.stone }} />
        <path d={rects(range(370, 1240, 46), 612, 40, 28)} style={{ fill: 'none', stroke: P.stoneDark, strokeWidth: 1 }} />
        <path d="M740,646h120v8h-120ZM728,654h144v8h-144ZM716,662h168v8h-168Z" style={{ fill: P.stoneDark }} />
        <rect x="0" y="646" width="1600" height="254" style={{ fill: P.paving }} />
        <path d={A.paving} style={{ fill: 'none', stroke: P.stoneDark, strokeWidth: 1, opacity: 0.35 }} />
        <rect x="0" y="646" width="1600" height="254" style={{ fill: P.snow, opacity: P.snowOp * 0.35 }} />
        {[180, 380, 1220, 1420].map((x) => (
          <g key={x}>
            <path d={`M${x - 34},780 L${x + 34},780 L${x + 26},840 L${x - 26},840 Z`} style={{ fill: P.wood }} />
            {!winter && <path d={A.cl(x, 760, 26, 12, 7, 13)} style={{ fill: season === 1 ? P.leaf3 : P.leaf1 }} />}
          </g>
        ))}
        {night && <g><Lantern x={560} y={520} ids={ids} /><Lantern x={1040} y={520} ids={ids} /></g>}
      </g>
    );
  } else if (kind === 'throne') {
    body = (
      <g>
        <path d={peak(800, 560, 520, 120)} style={{ fill: P.hillNear }} />
        <Corridor x0={-20} x1={300} top={500} P={P} ids={ids} />
        <Corridor x0={1300} x1={1620} top={500} P={P} ids={ids} />
        <Hall cx={800} top={392} w={920} h={118} bodyH={120} P={P} ids={ids} cols={8} tiers={2} />
        <rect x="420" y="608" width="760" height="34" style={{ fill: P.stone }} />
        <rect x="330" y="642" width="940" height="44" style={{ fill: P.stone }} />
        <path d={rects(range(424, 1176, 26), 600, 6, 10) + rects(range(334, 1266, 26), 634, 6, 10)} style={{ fill: P.stoneDark }} />
        <path d="M410,600H1190M320,634H1280" style={{ stroke: P.stoneDark, strokeWidth: 3 }} />
        <path d="M750,608h100v78h-100Z" style={{ fill: P.stoneDark, opacity: 0.5 }} />
        <rect x="0" y="686" width="1600" height="214" style={{ fill: P.paving }} />
        <path d={A.paving} style={{ fill: 'none', stroke: P.stoneDark, strokeWidth: 1, opacity: 0.35 }} />
        <path d="M760,686 L840,686 L900,900 L700,900 Z" style={{ fill: P.stone, opacity: 0.45 }} />
        <rect x="0" y="686" width="1600" height="214" style={{ fill: P.snow, opacity: P.snowOp * 0.35 }} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const y = 716 + i * 32, s = 0.6 + i * 0.12;
          return (
            <g key={i}>
              <path d={`M${700 - i * 46},${y}l${-7 * s},${18 * s}h${14 * s}Z`} style={{ fill: P.stoneDark }} />
              <path d={`M${900 + i * 46},${y}l${-7 * s},${18 * s}h${14 * s}Z`} style={{ fill: P.stoneDark }} />
            </g>
          );
        })}
        {night && <g><Lantern x={380} y={560} ids={ids} /><Lantern x={1220} y={560} ids={ids} /></g>}
      </g>
    );
  } else if (kind === 'residence') {
    body = (
      <g>
        <path d={peak(1150, 560, 420, 300)} style={{ fill: P.hillNear }} />
        <Hall cx={1000} top={372} w={640} h={110} bodyH={128} P={P} ids={ids} cols={6} painted={false} />
        <Hall cx={400} top={444} w={440} h={90} bodyH={96} P={P} ids={ids} cols={4} painted={false} />
        <rect x="0" y="620" width="1600" height="280" style={{ fill: P.ground }} />
        <rect x="0" y="620" width="1600" height="280" style={{ fill: P.snow, opacity: P.snowOp * 0.5 }} />
        <path d="M-20,632 L640,632 L626,616 L0,616 Z M860,632 L1620,632 L1600,616 L874,616 Z" style={{ fill: P.wallCap }} />
        <rect x="0" y="630" width="640" height="64" style={{ fill: P.wall }} />
        <rect x="860" y="630" width="740" height="64" style={{ fill: P.wall }} />
        <path d={rects(range(20, 640, 70), 650, 30, 22) + rects(range(880, 1600, 70), 650, 30, 22)} style={{ fill: 'none', stroke: P.wallLine, strokeWidth: 1.5 }} />
        <rect x="660" y="560" width="180" height="134" style={{ fill: P.interior }} />
        <rect x="682" y="586" width="68" height="108" style={{ fill: P.door }} />
        <rect x="750" y="586" width="68" height="108" style={{ fill: P.door }} />
        <path d={roof(750, 520, 260, 60)} style={{ fill: `url(#${ids.tile})` }} />
        <path d={ridge(750, 520, 260)} style={{ fill: P.ridge }} />
        <path d="M60,760h200v30h-200Z" style={{ fill: P.stone }} />
        {[[90, 740, 22], [140, 732, 30], [196, 738, 26], [240, 746, 18]].map(([x, y, s]) => (
          <g key={x}>
            <ellipse cx={x} cy={y} rx={s} ry={s * 1.05} style={{ fill: night ? '#2A1A14' : '#5A3422' }} />
            <ellipse cx={x} cy={y - s * 0.9} rx={s * 0.55} ry={s * 0.18} style={{ fill: night ? '#1E120E' : '#3E2418' }} />
          </g>
        ))}
        <Tree trunk="M1420,760 C1410,680 1440,620 1426,540 M1426,600 L1380,560 M1430,580 L1480,540" leaves={A.tree(1430, 470, 130, 24, 16, 34)} bare={A.bare(1426, 760, 260)} P={P} />
        <path d={A.cl(1430, 500, 90, 12, 4, 6)} style={{ fill: P.fruit }} />
      </g>
    );
  } else if (kind === 'academy') {
    const gold: [string, string, string] = season === 2 ? ['#D9B03A', '#C99A2E', '#E6C65A'] : season === 0 ? ['#9DB07A', '#B5C48C', '#86A06A'] : ['#55704A', '#6F8A55', '#8FA265'];
    const Pg = night ? P : { ...P, leaf1: gold[0], leaf2: gold[1], leaf3: gold[2] };
    body = (
      <g>
        <path d="M0,520H1600V560H0Z" style={{ fill: P.wall }} />
        <path d="M-20,524 L1620,524 L1600,508 L0,508 Z" style={{ fill: P.wallCap }} />
        <Hall cx={800} top={368} w={820} h={108} bodyH={118} P={P} ids={ids} cols={7} painted={false} />
        <rect x="0" y="606" width="1600" height="294" style={{ fill: P.ground }} />
        <rect x="0" y="606" width="1600" height="294" style={{ fill: P.snow, opacity: P.snowOp * 0.5 }} />
        <path d="M740,606 L860,606 L940,900 L660,900 Z" style={{ fill: P.stone, opacity: 0.5 }} />
        <Tree trunk="M220,900 C200,760 240,640 214,480 M214,600 L150,540 M220,560 L290,500" leaves={A.tree(220, 360, 200, 34, 22, 46)} bare={A.bare(214, 900, 520)} P={Pg} />
        <Tree trunk="M1380,900 C1400,760 1360,640 1388,470 M1388,600 L1450,540 M1384,560 L1310,500" leaves={A.tree(1380, 350, 200, 34, 22, 46)} bare={A.bare(1388, 900, 540)} P={Pg} />
        {season === 2 && !night && <path d={A.cl(800, 820, 520, 60, 2.5, 4.5)} style={{ fill: '#D9B03A', opacity: 0.8 }} />}
      </g>
    );
  } else if (kind === 'market') {
    // Shopfronts of Unjongga: mud walls, cloth on display, cloth awnings and thatched roofs tied down with rope.
    const shop = (key: string, x: number, base: number, w: number, s: number, goods: string[]) => {
      const h = 100 * s, top = base - h, gw = (w - 34 * s) / goods.length;
      const mound = `M${x - 16 * s},${top + 10 * s} C${x - 2 * s},${top - 46 * s} ${x + w + 2 * s},${top - 46 * s} ${x + w + 16 * s},${top + 10 * s} Z`;
      let ropes = '';
      for (let k = 1; k <= 3; k++) ropes += `M${x - 16 * s + k * 6 * s},${top + 10 * s - k * 9 * s} C${x + w * 0.2},${top - 46 * s + k * 12 * s} ${x + w * 0.8},${top - 46 * s + k * 12 * s} ${x + w + 16 * s - k * 6 * s},${top + 10 * s - k * 9 * s}`;
      for (let k = 1; k < 6; k++) { const rx = x + (w * k) / 6; ropes += `M${rx},${top - 30 * s}L${rx + (k - 3) * 4 * s},${top + 10 * s}`; }
      return (
        <g key={key}>
          <rect x={x} y={top} width={w} height={h} fill={P.wall} />
          <rect x={x + 10 * s} y={top + 30 * s} width={w - 20 * s} height={h - 30 * s} fill={P.interior} />
          {goods.map((c, i) => <rect key={i} x={x + 17 * s + i * gw} y={top + 52 * s} width={gw - 6 * s} height={h - 58 * s} fill={night ? mix(c, NIGHT, 0.7) : c} />)}
          {goods.map((c, i) => <rect key={'b' + i} x={x + 17 * s + i * gw} y={top + 52 * s + (h - 58 * s) * 0.45} width={gw - 6 * s} height={3 * s} fill={night ? '#1A1418' : mix(c, '#000000', 0.25)} />)}
          <path d={mound} fill={P.straw} />
          <path d={ropes} fill="none" stroke={P.strawDark} strokeWidth={1.6 * s} />
          <path d={mound} fill={P.snow} opacity={P.snowOp * 0.8} />
          <path d={`M${x - 4 * s},${top + 30 * s} L${x + w + 4 * s},${top + 30 * s} L${x + w + 24 * s},${top + 54 * s} L${x - 24 * s},${top + 54 * s} Z`} fill={night ? '#3A2A20' : '#E2D6BC'} />
          <path d={`M${x - 24 * s},${top + 54 * s} V${base} M${x + w + 24 * s},${top + 54 * s} V${base}`} stroke={P.wood} strokeWidth={4 * s} />
        </g>
      );
    };
    body = (
      <g>
        <rect x="0" y="470" width="1600" height="50" fill={P.wall} opacity="0.8" />
        <rect x="700" y="420" width="200" height="100" fill={P.wall} />
        <path d="M770,520 L770,470 Q800,446 830,470 L830,520 Z" fill={P.interior} />
        <Hall cx={800} top={300} w={360} h={90} bodyH={34} P={P} ids={ids} cols={4} tiers={2} />
        <rect x="0" y="560" width="1600" height="340" fill={P.ground} />
        <rect x="0" y="560" width="1600" height="340" fill={P.snow} opacity={P.snowOp * 0.45} />
        <path d="M720,560 L880,560 L1240,900 L360,900 Z" fill={P.paving} opacity="0.6" />
        {shop('l2', 470, 640, 190, 0.8, ['#A9C4B4', '#EDE6D6', '#D8BF73'])}
        {shop('r2', 940, 640, 190, 0.8, ['#D9AFA8', '#3E5274', '#5A2140'])}
        {shop('l1', 110, 720, 300, 1.25, ['#8E2230', '#2C3E63', '#D8BF73', '#2F5E55'])}
        {shop('r1', 1190, 720, 300, 1.25, ['#5A2140', '#B08D57', '#2F5E55', '#EDE6D6'])}
        {[[700, 700, 16], [742, 712, 20], [880, 708, 18]].map(([x, y, r]) => (
          <g key={x}>
            <ellipse cx={x} cy={y} rx={r * 1.3} ry={r * 0.9} fill={night ? '#2A2016' : '#8C6E3E'} />
            <ellipse cx={x} cy={y - r * 0.7} rx={r * 1.1} ry={r * 0.3} fill={night ? '#1E1810' : '#6B5230'} />
          </g>
        ))}
        {night && <g><Lantern x={560} y={560} ids={ids} /><Lantern x={1040} y={560} ids={ids} /><Lantern x={260} y={600} ids={ids} /><Lantern x={1340} y={600} ids={ids} /></g>}
      </g>
    );
  } else if (kind === 'temple') {
    // A mountain temple: a painted hall under a peak, a five-storey stone pagoda, a stone lantern and old pines.
    const tiersY = [0, 1, 2, 3, 4];
    body = (
      <g>
        <path d={peak(520, 600, 760, 330)} style={{ fill: P.hillFar }} />
        <path d={peak(1180, 600, 640, 250)} style={{ fill: P.hillNear }} />
        <path d={peak(520, 600, 760, 330)} style={{ fill: P.snow, opacity: P.snowOp * 0.5 }} />
        <rect x="0" y="470" width="1600" height="130" fill={`url(#${ids.mist})`} />
        <Hall cx={930} top={338} w={720} h={112} bodyH={126} P={P} ids={ids} cols={5} painted lit={night ? 1 : 0.4} />
        <rect x="0" y="606" width="1600" height="294" style={{ fill: P.ground }} />
        <rect x="0" y="606" width="1600" height="294" style={{ fill: P.snow, opacity: P.snowOp * 0.55 }} />
        <path d="M840,606 L1020,606 L1130,900 L730,900 Z" style={{ fill: P.stone, opacity: 0.55 }} />
        <path d={range(620, 880, 34).map((y, i) => `M${830 - i * 13},${y}H${1030 + i * 13}`).join('')} style={{ fill: 'none', stroke: P.stoneDark, strokeWidth: 2, opacity: 0.5 }} />
        <g>
          <rect x="296" y="786" width="188" height="20" style={{ fill: P.stoneDark }} />
          <rect x="312" y="768" width="156" height="20" style={{ fill: P.stone }} />
          {tiersY.map((i) => {
            const w = 128 - i * 20;
            const y = 722 - i * 54;
            return (
              <g key={i}>
                <rect x={390 - w * 0.3} y={y} width={w * 0.6} height="46" style={{ fill: P.stone }} />
                <path d={`M${390 - w / 2 - 14},${y + 4} Q390,${y - 14} ${390 + w / 2 + 14},${y + 4} L${390 + w / 2 + 4},${y - 8} L${390 - w / 2 - 4},${y - 8} Z`} style={{ fill: P.stoneDark }} />
              </g>
            );
          })}
          <path d="M386,498 h8 v-44 h-8 Z M378,470 h24 v6 h-24 Z M382,454 h16 v5 h-16 Z" style={{ fill: P.stoneDark }} />
          <rect x="296" y="786" width="188" height="6" style={{ fill: P.snow, opacity: P.snowOp }} />
        </g>
        <g>
          <rect x="1296" y="792" width="56" height="14" style={{ fill: P.stoneDark }} />
          <rect x="1316" y="730" width="16" height="62" style={{ fill: P.stone }} />
          <rect x="1300" y="690" width="48" height="40" style={{ fill: P.stone }} />
          <rect x="1312" y="700" width="24" height="22" style={{ fill: night ? '#F2C27A' : P.stoneDark }} />
          <path d="M1288,692 Q1324,664 1360,692 Z" style={{ fill: P.stoneDark }} />
          {night && <circle cx="1324" cy="712" r="80" style={{ fill: `url(#${ids.lamp})` }} />}
        </g>
        <Tree trunk="M120,900 C132,780 96,660 128,500 M128,640 L70,590 M124,580 L196,530" leaves={A.tree(128, 400, 170, 30, 20, 40)} bare={A.bare(128, 900, 480)} P={{ ...P, leaf1: night ? P.leaf1 : '#3F5A42', leaf2: night ? P.leaf2 : '#4E6B4A', leaf3: night ? P.leaf3 : '#2F4A36' }} />
        <Tree trunk="M1500,900 C1484,800 1520,700 1492,560 M1492,680 L1560,640" leaves={A.tree(1492, 470, 150, 26, 18, 36)} bare={A.bare(1492, 900, 420)} P={{ ...P, leaf1: night ? P.leaf1 : '#3F5A42', leaf2: night ? P.leaf2 : '#4E6B4A', leaf3: night ? P.leaf3 : '#2F4A36' }} />
        {season === 1 && (
          <g>
            <path d="M560,560 Q760,610 930,566 Q1100,610 1300,560" style={{ fill: 'none', stroke: P.trunk, strokeWidth: 1.5, opacity: 0.7 }} />
            {range(600, 1280, 68).map((x, i) => (
              <g key={x}>
                <ellipse cx={x} cy={590 + Math.sin(i * 1.3) * 10} rx="13" ry="16" style={{ fill: ['#C8474E', '#E0A23A', '#5E8E6E', '#D97A8C'][i % 4], opacity: night ? 1 : 0.9 }} />
                {night && <circle cx={x} cy={590 + Math.sin(i * 1.3) * 10} r="34" style={{ fill: `url(#${ids.lamp})` }} />}
              </g>
            ))}
          </g>
        )}
        {night && <g><Lantern x={700} y={590} ids={ids} /><Lantern x={1160} y={590} ids={ids} /></g>}
      </g>
    );
  } else if (kind === 'offices') {
    // The palace offices: plain-painted halls around a paved court, with the bronze sundial on its stone stand.
    body = (
      <g>
        <path d={peak(820, 560, 460, 140)} style={{ fill: P.hillNear }} />
        <Corridor x0={640} x1={980} top={452} P={P} ids={ids} />
        <Hall cx={360} top={352} w={680} h={104} bodyH={124} P={P} ids={ids} cols={6} painted={false} />
        <Hall cx={1250} top={372} w={600} h={98} bodyH={112} P={P} ids={ids} cols={5} painted={false} />
        <rect x="0" y="606" width="1600" height="294" style={{ fill: P.paving }} />
        <path d={A.paving} style={{ fill: 'none', stroke: P.stoneDark, strokeWidth: 1, opacity: 0.35 }} />
        <rect x="0" y="606" width="1600" height="294" style={{ fill: P.snow, opacity: P.snowOp * 0.35 }} />
        <path d="M748,606 L852,606 L930,900 L670,900 Z" style={{ fill: P.stone, opacity: 0.45 }} />
        <g>
          <rect x="764" y="740" width="72" height="44" style={{ fill: P.stone, stroke: P.stoneDark, strokeWidth: 1.2 }} />
          <rect x="752" y="782" width="96" height="14" style={{ fill: P.stoneDark }} />
          <path d="M770,708 a30,30 0 0 0 60,0 Z" style={{ fill: night ? '#2A2A26' : '#5E6A4E' }} />
          <path d="M770,708 h60 M800,708 v-18" style={{ fill: 'none', stroke: night ? '#4A4A40' : '#8E9A72', strokeWidth: 2.4 }} />
          <path d="M776,716 h48 M784,726 h32" style={{ fill: 'none', stroke: night ? '#1E1E1A' : '#3E4A34', strokeWidth: 1.2 }} />
          <path d="M774,740 l8,-30 M826,740 l-8,-30" style={{ stroke: night ? '#2A2A26' : '#5E6A4E', strokeWidth: 4, strokeLinecap: 'round' }} />
        </g>
        {[[120, 820], [1480, 820]].map(([x, y]) => (
          <g key={x}>
            <rect x={x - 26} y={y - 8} width="52" height="10" style={{ fill: P.stoneDark }} />
            <path d={`M${x - 20},${y - 8} L${x - 16},${y - 92} L${x + 16},${y - 92} L${x + 20},${y - 8} Z`} style={{ fill: night ? '#3A2A22' : P.wood }} />
            <path d={`M${x - 14},${y - 80}h28M${x - 14},${y - 60}h28M${x - 14},${y - 40}h28`} style={{ stroke: night ? '#1E1612' : P.stoneDark, strokeWidth: 1.4 }} />
          </g>
        ))}
        {night && <g><Lantern x={560} y={520} ids={ids} /><Lantern x={1040} y={530} ids={ids} /></g>}
      </g>
    );
  } else {
    // The State Tribunal: high walls, a heavy gate and the red arrow gate before it.
    body = (
      <g>
        <rect x="0" y="470" width="1600" height="150" style={{ fill: P.wall }} />
        <path d="M-20,478 L1620,478 L1600,458 L0,458 Z" style={{ fill: P.wallCap }} />
        <path d="M0,500H1600M0,540H1600M0,580H1600" style={{ stroke: P.wallLine, strokeWidth: 1, opacity: 0.6 }} />
        <Hall cx={800} top={360} w={520} h={110} bodyH={150} P={P} ids={ids} cols={4} painted={false} />
        <rect x="690" y="500" width="110" height="128" style={{ fill: P.door }} />
        <rect x="800" y="500" width="110" height="128" style={{ fill: P.door }} />
        <path d="M745,520v90M855,520v90" style={{ stroke: '#2A1A14', strokeWidth: 6, strokeDasharray: '2 18', strokeLinecap: 'round' }} />
        <rect x="0" y="620" width="1600" height="280" style={{ fill: P.ground }} />
        <rect x="0" y="620" width="1600" height="280" style={{ fill: P.snow, opacity: P.snowOp * 0.5 }} />
        <path d={A.bare(220, 760, 360) + A.bare(1400, 760, 320)} style={{ fill: 'none', stroke: P.trunk, strokeWidth: 3, strokeLinecap: 'round' }} />
        <path d="M220,760 C214,640 228,540 220,400 M1400,760 C1408,660 1392,560 1400,440" style={{ fill: 'none', stroke: P.trunk, strokeWidth: 9, strokeLinecap: 'round' }} />
        <g>
          <rect x="520" y="400" width="18" height="420" style={{ fill: P.red }} />
          <rect x="1062" y="400" width="18" height="420" style={{ fill: P.red }} />
          <rect x="500" y="420" width="600" height="16" style={{ fill: P.red }} />
          <rect x="500" y="452" width="600" height="12" style={{ fill: P.red }} />
          <path d={rects(range(560, 1060, 26), 360, 5, 92)} style={{ fill: P.red }} />
          <path d={range(560, 1060, 26).map((x) => `M${x - 3},362l5.5,-14l5.5,14Z`).join('')} style={{ fill: P.red }} />
          <circle cx="800" cy="392" r="24" style={{ fill: night ? '#2A2A40' : '#2C3E63' }} />
          <path d="M776,392 a24,24 0 0 1 48,0 a12,12 0 0 1 -24,0 a12,12 0 0 0 -24,0Z" style={{ fill: night ? '#4A1A18' : '#9A2B24' }} />
        </g>
        {night && <g><Lantern x={600} y={600} ids={ids} /><Lantern x={1000} y={600} ids={ids} /></g>}
      </g>
    );
  }

  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.sky1} /><stop offset="1" stopColor={P.sky2} /></linearGradient>
        <radialGradient id={ids.haze}><stop offset="0" stopColor="#FFF6E2" stopOpacity="0.9" /><stop offset="1" stopColor="#FFF6E2" stopOpacity="0" /></radialGradient>
        <radialGradient id={ids.halo}><stop offset="0" stopColor="#EDE3CC" stopOpacity="0.35" /><stop offset="1" stopColor="#EDE3CC" stopOpacity="0" /></radialGradient>
        <radialGradient id={ids.lamp}><stop offset="0" stopColor="#F2C27A" stopOpacity="0.55" /><stop offset="1" stopColor="#F2C27A" stopOpacity="0" /></radialGradient>
        <linearGradient id={ids.mist} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.mist} stopOpacity="0" /><stop offset="0.5" stopColor={P.mist} stopOpacity={P.mistOp} /><stop offset="1" stopColor={P.mist} stopOpacity="0" /></linearGradient>
        <linearGradient id={ids.water} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.water1} /><stop offset="1" stopColor={P.water2} /></linearGradient>
        <radialGradient id={ids.vig} cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity={P.vig} /></radialGradient>
        <pattern id={ids.tile} width="9" height="60" patternUnits="userSpaceOnUse"><rect width="9" height="60" fill={P.roof} /><rect width="2.2" height="60" fill={P.roofLine} /></pattern>
        <pattern id={ids.dan} width="18" height="22" patternUnits="userSpaceOnUse"><rect width="18" height="22" fill={P.dan1} /><circle cx="9" cy="8" r="4.6" fill={P.dan3} /><circle cx="9" cy="8" r="2" fill={P.dan2} /><rect y="15" width="18" height="7" fill={P.dan2} /></pattern>
        <pattern id={ids.lat} width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill={P.lat} /><path d="M0 0H10M0 0V10" stroke={P.latLine} strokeWidth="1.3" /></pattern>
        <clipPath id={ids.clip}><rect x="0" y="646" width="1600" height="254" /></clipPath>
        <filter id={ids.grain} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      </defs>
      <rect width="1600" height="900" fill={`url(#${ids.sky})`} />
      <circle cx="420" cy="150" r="380" fill={`url(#${ids.haze})`} opacity={P.haze} />
      <path d={A.stars} fill="#EDE3CC" opacity={P.stars} />
      <circle cx="360" cy="170" r="210" fill={`url(#${ids.halo})`} opacity={P.moon} />
      <circle cx="360" cy="170" r="58" fill="#EDE3CC" opacity={P.moon} />
      <path d="M0,470 C120,400 220,380 330,410 C430,360 520,300 640,330 C740,280 820,300 900,350 C1000,320 1100,340 1200,370 C1320,330 1450,350 1600,400 L1600,600 L0,600 Z" fill={P.hillFar} />
      <path d="M0,470 C120,400 220,380 330,410 C430,360 520,300 640,330 C740,280 820,300 900,350 C1000,320 1100,340 1200,370 C1320,330 1450,350 1600,400 L1600,420 L0,500 Z" fill={P.snow} opacity={P.snowOp * 0.45} />
      <path d="M0,520 C140,470 260,470 380,500 C500,460 640,450 760,490 C880,470 1000,480 1120,500 C1260,470 1420,480 1600,500 L1600,620 L0,620 Z" fill={P.hillNear} />
      <rect x="0" y="440" width="1600" height="140" fill={`url(#${ids.mist})`} />
      {body}
      <rect width="1600" height="900" fill={`url(#${ids.vig})`} />
      <rect width="1600" height="900" filter={`url(#${ids.grain})`} opacity="0.06" />
    </svg>
  );
}

/** A location as a 1600 × 900 illustration that fills its box. Day or night, and dressed for the season. */
export const PlaceScene = memo(PlaceSceneInner);

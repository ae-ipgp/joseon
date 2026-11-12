import { useMemo, useState } from 'react';
import { ChevronLeft, Clock, Lock } from 'lucide-react';
import { useUi } from '../store/ui';
import { useGame } from '../store/game';
import { useT } from '../i18n/useT';
import { Fibre, Medallion } from '../ui/parts';
import { PLACES } from '../content/places';
import { activitiesAt, travelCheck } from '../engine/day';
import { PHASE_NAMES, dateLine, usesGyeongbokgung } from '../engine/time';
import { npcPortrait } from '../engine/world';
import { peak } from '../scenes/kit';
import type { Game } from '../model/schemas';

function pinOf(g: Game, id: string) {
  const p = PLACES.find((x) => x.id === id)!;
  return usesGyeongbokgung(g) && p.gbg ? { x: p.gbg.x, y: p.gbg.y, side: p.gbg.side, name: p.gbg.name, area: p.gbg.area } : { ...p.map, name: p.name, area: p.area };
}

function useTerrain() {
  return useMemo(() => {
    const f = (n: number) => Math.round(n * 10) / 10;
    const pk = (x: number, base: number, w: number, h: number) => `M${f(x - w)},${base}Q${f(x - w * 0.35)},${f(base - h)} ${x},${f(base - h)}Q${f(x + w * 0.35)},${f(base - h)} ${f(x + w)},${base}Z`;
    const ct = (x: number, base: number, w: number, h: number) => `M${f(x - w * 0.5)},${base}Q${f(x - w * 0.15)},${f(base - h * 0.62)} ${f(x + w * 0.08)},${f(base - h * 0.7)}`;
    const groups: [number, number, number[][]][] = [
      [430, 112, [[-60, 0, 46, 54], [0, -6, 54, 80], [64, 2, 44, 52]]],
      [150, 286, [[-30, 0, 40, 60], [18, -8, 48, 84], [64, 6, 36, 44]]],
      [880, 270, [[-34, 4, 40, 50], [10, -4, 46, 70], [56, 8, 34, 40]]],
      [476, 676, [[-56, 0, 44, 50], [0, -4, 54, 78], [60, 2, 42, 48]]],
    ];
    let mountains = '', contours = '', range = '';
    for (const [cx, base, list] of groups) for (const q of list) { mountains += pk(cx + q[0], base + q[1], q[2], q[3]); contours += ct(cx + q[0], base + q[1], q[2], q[3]); }
    for (let x = 30; x < 980; x += 52) range += pk(x, 66 + ((x * 7) % 13), 34, 22 + ((x * 13) % 17));
    return { mountains, contours, range, far: peak(500, 60, 520, 20) };
  }, []);
}

export function MapScreen() {
  const { t, tx, pk, nm, lc } = useT();
  const g = useGame((s) => s.game)!;
  const travel = useGame((s) => s.travel);
  const go = useUi((s) => s.go);
  const [sel, setSel] = useState(g.place);
  const T = useTerrain();
  const gbg = usesGyeongbokgung(g);

  const place = PLACES.find((p) => p.id === sel) ?? PLACES[0];
  const pin = pinOf(g, place.id);
  const check = travelCheck(g, place.id);
  const phaseWord = pk(PHASE_NAMES[g.date.phase]).toLowerCase();
  const people = Object.values(g.npcs)
    .filter((n) => n.alive && !n.away && (g.rel[n.id]?.met || n.meet) && n.places.includes(place.id) && n.id !== 'king')
    .sort((a, b) => Number(!!g.rel[b.id]?.met) - Number(!!g.rel[a.id]?.met))
    .slice(0, 8);
  const acts = activitiesAt(g, place.id);
  const travelText = check.here ? t('youAreHere') : !check.ok ? tx(check.reason) : check.costs ? t('costsPhase', { phase: phaseWord }) : t('shortWalk');

  const goThere = () => {
    if (check.here) { go('play'); return; }
    travel(place.id);
    const after = useGame.getState().game;
    if (after && !after.active) go('play');
  };

  return (
    <main className="paper-screen">
      <Fibre seed={9} />
      <header className="bar">
        <button className="bar-link" type="button" onClick={() => go('play')} style={{ paddingLeft: 0 }}><ChevronLeft size={20} strokeWidth={1.6} />{t('returnHere')}</button>
        <p style={{ fontSize: 14, color: 'var(--gold-light)' }}>{tx(dateLine(g.date))}, {lc(pk(PHASE_NAMES[g.date.phase]))}</p>
      </header>

      <div className="wrap" style={{ maxWidth: 1360, paddingTop: 'clamp(20px, 3vh, 36px)', paddingBottom: 32, display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
        <section aria-labelledby="mp-h" style={{ flex: '1.7 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h1 id="mp-h" style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 300, lineHeight: 1.15 }}>{t('mapTitle')}</h1>
            <p className="ko echo" lang="ko" style={{ fontSize: 22, color: 'var(--jaju)' }}>한성</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ position: 'relative', width: '100%', minWidth: 560, aspectRatio: '1000 / 720' }}>
              <svg viewBox="0 0 1000 720" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
                <rect x="6" y="6" width="988" height="708" fill="none" stroke="#5E4A34" strokeWidth="3" />
                <rect x="14" y="14" width="972" height="692" fill="none" stroke="#8C7B66" strokeWidth="1" />
                <path d={T.range} fill="#A8BBAA" opacity="0.55" stroke="#3A4A44" strokeWidth="1.1" />
                <path d={T.mountains} fill="#9DB3A4" opacity="0.7" stroke="#2E3C37" strokeWidth="1.3" />
                <path d={T.contours} fill="none" stroke="#2E3C37" strokeWidth="0.9" opacity="0.55" />
                <path d="M150,440 C260,428 380,474 520,452 C640,434 760,472 900,456" fill="none" stroke="#6E8C88" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
                <path d="M150,370 C300,384 600,394 888,410 M470,394 C452,480 432,560 420,618" fill="none" stroke="#C9B48E" strokeWidth="9" strokeLinecap="round" opacity="0.7" />
                <path d="M430,96 C560,92 710,112 830,170 C886,220 904,300 888,382 C876,470 826,560 704,604 C604,632 520,640 470,624 C380,614 300,602 222,560 C150,520 120,420 140,320 C160,236 262,140 430,96 Z" fill="none" stroke="#8C7B66" strokeWidth="5" />
                <path d="M430,96 C560,92 710,112 830,170 C886,220 904,300 888,382 C876,470 826,560 704,604 C604,632 520,640 470,624 C380,614 300,602 222,560 C150,520 120,420 140,320 C160,236 262,140 430,96 Z" fill="none" stroke="#EDE3CC" strokeWidth="1.6" strokeDasharray="2 7" />
                <path d="M412,612h18v12h-18Z M880,402h16v14h-16Z M132,362h16v14h-16Z M462,90h16v12h-16Z" fill="#5E4A34" />
                <text x="152" y="360" fontSize="13" fill="#5E5048">{pk({ en: 'West Gate', ko: '서대문' })}</text>
                <text x="436" y="648" fontSize="13" fill="#5E5048">{pk({ en: 'South Gate', ko: '숭례문' })}</text>
                <rect x="352" y="152" width="140" height="140" fill={gbg ? '#6B1626' : 'none'} fillOpacity={gbg ? 0.07 : 1} stroke={gbg ? '#6B1626' : '#8C7B66'} strokeWidth="1.5" strokeDasharray={gbg ? undefined : '5 5'} />
                <text x="362" y={gbg ? 284 : 214} fontSize="13" fill={gbg ? '#6B1626' : '#5E5048'} fontStyle={gbg ? undefined : 'italic'}>{pk({ en: 'Gyeongbokgung', ko: '경복궁' })}</text>
                {!gbg && <text x="362" y="232" fontSize="13" fill="#5E5048" fontStyle="italic">{t('ruinsNote')}</text>}
                <path d="M556,140 L774,128 L794,236 L744,322 L556,322 Z" fill={gbg ? 'none' : '#6B1626'} fillOpacity={gbg ? 1 : 0.07} stroke={gbg ? '#8C7B66' : '#6B1626'} strokeWidth="1.5" strokeDasharray={gbg ? '5 5' : undefined} />
                <text x="566" y="314" fontSize="14" fill={gbg ? '#5E5048' : '#6B1626'}>{pk({ en: 'Changdeokgung', ko: '창덕궁' })}</text>
                <circle cx="936" cy="70" r="22" fill="none" stroke="#5E4A34" strokeWidth="1.2" />
                <path d="M936,40 L942,70 L936,64 L930,70 Z" fill="#6B1626" />
                <text x="936" y="86" fontSize="15" textAnchor="middle" fill="#1B1513" className="ko">북</text>
              </svg>
              {PLACES.map((p) => {
                const q = pinOf(g, p.id);
                const c = travelCheck(g, p.id);
                const locked = !!p.requires && !c.ok && !c.here && c.reason === p.locked;
                const cls = 'pin' + (q.side === 'l' ? ' l' : q.side === 'b' ? ' b' : '') + (c.here ? ' here' : '') + (locked ? ' locked' : '');
                return (
                  <button key={p.id} className={cls} type="button" aria-pressed={sel === p.id} onClick={() => setSel(p.id)} style={{ left: `${q.x}%`, top: `${q.y}%` }}>
                    <span className="mk"><i /></span>
                    <span className="lb">{tx(q.name).replace(/^The (.)/, (_m, c: string) => c.toUpperCase())}{c.here && <span className="sr-only">, {t('hereSr')}</span>}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'var(--muted-paper)' }}>{t('mapNote')}</p>
        </section>

        <aside aria-live="polite" style={{ flex: '1 1 340px', minWidth: 0, position: 'relative', background: '#EFE6D2', boxShadow: '0 18px 44px rgba(58,45,40,.22)', alignSelf: 'stretch' }}>
          <div className="band" aria-hidden="true" />
          <div className="detail" key={place.id} style={{ padding: '28px 30px 30px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <p className="ko echo" lang="ko" style={{ fontSize: 40, lineHeight: 1.1, color: 'var(--jaju)' }}>{pin.name.ko}</p>
              <h2 style={{ marginTop: 8, fontSize: 28, fontWeight: 400, lineHeight: 1.2 }}>{tx(pin.name)}</h2>
              <p style={{ marginTop: 4, fontSize: 15, color: 'var(--muted-paper)' }}>{tx(pin.area)}</p>
            </div>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, padding: '10px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
              {!check.ok && !check.here ? <Lock size={18} strokeWidth={1.6} /> : <Clock size={18} strokeWidth={1.6} />}
              <span>{travelText}</span>
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-paper-2)' }}>{tx(place.desc)}</p>
            <div>
              <h3 style={{ marginBottom: 10, fontSize: 15, fontWeight: 500 }}>{t('whoHere')}</h3>
              {people.length ? (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '12px 20px' }}>
                  {people.map((n) => (
                    <li key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Medallion spec={npcPortrait(g, n)} size={44} /><span style={{ fontSize: 15 }}>{tx(n.name)}</span></li>
                  ))}
                </ul>
              ) : <p style={{ fontSize: 15, color: 'var(--text-paper-2)' }}>{t('nobodyKnown')}</p>}
            </div>
            {acts.length > 0 && (
              <div>
                <h3 style={{ marginBottom: 6, fontSize: 15, fontWeight: 500 }}>{t('whatHere')}</h3>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 16, lineHeight: 1.75, color: 'var(--text-paper-2)' }}>
                  {acts.map((a) => <li key={a.id}>{tx(a.title)}</li>)}
                </ul>
              </div>
            )}
            {place.aside && <p style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--jaju)' }}>{tx(place.aside)}</p>}
            <div style={{ paddingTop: 6 }}>
              {check.here
                ? <button className="btn btn-wine" type="button" onClick={() => go('play')}>{t('stayHere')}</button>
                : <button className="btn btn-wine" type="button" disabled={!check.ok} onClick={goThere}>{t('goTo', { place: nm(pin.name) })}</button>}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

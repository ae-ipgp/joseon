import { faceFor } from '../engine/life';
import { useState } from 'react';
import { Gift, MapPin } from 'lucide-react';
import { useUi } from '../store/ui';
import { useGame } from '../store/game';
import { useT } from '../i18n/useT';
import { Medallion, MoonGate, RegardMeter, Seal } from '../ui/parts';
import { RecordsBar } from './RecordsBar';
import { STATUS_NAMES, giftName } from '../content/lists';
import { canGift } from '../engine/day';
import { factionsOf, yearNumber } from '../engine/time';
import { kinLabel, npcAge, npcPortrait, statusOf } from '../engine/world';
import { signed } from '../engine/text';
import type { Npc } from '../model/schemas';

type Filter = 'all' | 'heart' | 'friends' | 'allies' | 'court' | 'family' | 'rivals' | 'departed';

export function PeopleScreen() {
  const { t, tx, pk, lang } = useT();
  const g = useGame((s) => s.game)!;
  const gift = useGame((s) => s.gift);
  const go = useUi((s) => s.go);
  const focus = useUi((s) => s.focusNpc);
  const setFocus = useUi((s) => s.setFocusNpc);
  const [filter, setFilter] = useState<Filter>('all');
  const [giving, setGiving] = useState(false);
  const [note, setNote] = useState('');

  const known = Object.values(g.npcs).filter((n) => g.rel[n.id] && (g.rel[n.id].met || n.kin));
  const gone = (n: Npc) => !n.alive || n.away;
  const inFilter = (n: Npc) => {
    const r = g.rel[n.id];
    switch (filter) {
      case 'heart': return !gone(n) && (['romance', 'lover', 'betrothed', 'spouse'].includes(r.bond) || (n.romance && r.regard >= 30));
      case 'friends': return !gone(n) && !n.kin && r.regard >= 45;
      case 'allies': return !gone(n) && !!g.flags[`ally-${n.id}`];
      case 'court': return !gone(n) && !n.kin;
      case 'family': return !!n.kin && !gone(n);
      case 'rivals': return !gone(n) && r.regard <= -20;
      case 'departed': return gone(n);
      default: return !gone(n);
    }
  };
  const list = known.filter(inFilter).sort((a, b) => g.rel[b.id].regard - g.rel[a.id].regard);
  const selId = focus && g.npcs[focus] ? focus : list[0]?.id ?? known[0]?.id;
  const d = selId ? g.npcs[selId] : null;
  const r = d ? g.rel[d.id] : null;
  const f = factionsOf(g);
  const facLabel = (n: Npc) => (n.faction === 'A' ? tx(f.a) : n.faction === 'B' ? tx(f.b) : n.faction === 'crown' ? pk({ en: 'Serves the throne', ko: '왕실을 섬김' }) : pk({ en: 'No faction', ko: '당파 없음' }));
  const sub = (n: Npc) => {
    const k = kinLabel(g, n);
    if (!n.alive) return t('died', { year: tx(yearNumber(g, n.diedYear ?? g.date.year)) });
    if (n.away) return t('away');
    return k ? `${tx(k)}, ${npcAge(g, n)}` : tx(n.role);
  };
  const filters: [Filter, string][] = [['all', t('everyone')], ['heart', t('heart')], ['friends', lang === 'ko' ? '벗' : 'Friends'], ['allies', lang === 'ko' ? '동맹' : 'Allies'], ['court', t('court')], ['family', t('family')], ['rivals', t('rivals')], ['departed', t('departed')]];
  const give = (id: string) => {
    if (!d) return;
    const res = gift(d.id, id);
    setGiving(false);
    if (res.text) setNote(tx(res.text));
  };
  const pick = (id: string) => { setFocus(id); setGiving(false); setNote(''); };

  return (
    <main className="ink-screen" style={{ display: 'flex', flexDirection: 'column', background: 'radial-gradient(80% 60% at 70% 0%, #2B1418 0%, #1B1513 65%)' }}>
      <RecordsBar current="people" />
      <div className="wrap" style={{ flex: 1, maxWidth: 1320, paddingTop: 'clamp(24px, 4vh, 40px)', paddingBottom: 48, display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
        <section aria-labelledby="rl-h" style={{ flex: '0 1 380px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <h1 id="rl-h" style={{ fontSize: 'clamp(30px, 3vw, 40px)', fontWeight: 300, lineHeight: 1.1 }}>{t('peopleTitle')}</h1>
            <p className="ko echo" lang="ko" style={{ marginTop: 8, fontSize: 18, color: 'var(--gold-light)' }}>인연</p>
          </div>
          <div role="group" aria-label={t('peopleTitle')} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {filters.map(([id, label]) => <button key={id} className="chip" type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderBottom: '1px solid rgba(201,168,106,.18)' }}>
            {list.length === 0 && <li style={{ padding: '14px', color: 'var(--muted-ink)', fontSize: 15 }}>—</li>}
            {list.map((n) => {
              const rel = g.rel[n.id];
              return (
                <li key={n.id}>
                  <button className="who" type="button" aria-pressed={n.id === selId} onClick={() => pick(n.id)}>
                    <Medallion spec={{ ...npcPortrait(g, n), expr: faceFor(g, n.id) }} size={52} gone={gone(n)} />
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 17, color: n.id === selId ? 'var(--text-ink)' : 'var(--text-ink-2)' }}>{tx(n.name)}</span>
                      <span style={{ fontSize: 13, color: 'var(--muted-ink)' }}>{sub(n)}</span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, textAlign: 'right' }}>
                      <span style={{ fontSize: 13, color: 'var(--gold-light)' }}>{tx(STATUS_NAMES[statusOf(rel)])}</span>
                      <span style={{ fontSize: 15, color: 'var(--text-ink-2)' }}>{signed(rel.regard)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {d && r && (
          <article className="paper detail" key={d.id} aria-labelledby="rl-name" style={{ flex: '1 1 560px', minWidth: 0, boxShadow: '0 30px 70px rgba(0,0,0,.45)' }}>
            <div className="band" aria-hidden="true" />
            <div style={{ padding: 'clamp(24px, 3vw, 40px)', display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center' }}>
                <MoonGate spec={npcPortrait(g, d)} />
                <div style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p className="ko echo" lang="ko" style={{ fontSize: 30, color: 'var(--jaju)' }}>{d.name.ko}</p>
                  <h2 id="rl-name" style={{ fontSize: 'clamp(30px, 3vw, 40px)', fontWeight: 300, lineHeight: 1.1 }}>{tx(d.name)}</h2>
                  <p style={{ marginTop: 4, fontSize: 16, color: 'var(--text-paper-2)' }}>{tx(d.role)}{kinLabel(g, d) ? `. ${tx(kinLabel(g, d))}, ${lang === 'ko' ? `${npcAge(g, d)}세` : `${npcAge(g, d)}`}` : ''}</p>
                  {d.life?.married && <p style={{ marginTop: 4, fontSize: 15, color: 'var(--muted-paper)' }}>{tx({ en: `Married to ${d.life.married.en}${d.life.children ? `, ${d.life.children} child${d.life.children === 1 ? '' : 'ren'}` : ''}`, ko: `${d.life.married.ko ?? d.life.married.en}와(과) 혼인${d.life.children ? `, 자녀 ${d.life.children}명` : ''}` })}</p>}
                  <p style={{ marginTop: 8, alignSelf: 'flex-start', padding: '4px 10px', border: '1px solid #8C7B66', fontSize: 13, color: 'var(--text-paper-2)' }}>{gone(d) ? sub(d) : facLabel(d)}</p>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 22, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 14 }}>
                    {tx(STATUS_NAMES[statusOf(r)])}
                    {(r.bond === 'betrothed' || r.bond === 'spouse') && <Seal text={r.bond === 'spouse' ? '혼' : '약'} size={34} tilt={-6} />}
                  </p>
                  <p style={{ fontSize: 15, color: 'var(--text-paper-2)' }}>{pk({ en: 'Regard', ko: '호감' })} <span style={{ fontSize: 22, fontWeight: 300, color: 'var(--ink)' }}>{signed(r.regard)}</span></p>
                </div>
                <RegardMeter value={r.regard} label={t('regardLabel', { n: signed(r.regard) })} words={[t('hostile'), t('indifferent'), t('devoted')]} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '24px 36px', paddingTop: 22, borderTop: '1px solid var(--rule)' }}>
                <div>
                  <h3 style={{ marginBottom: 10, fontSize: 15, fontWeight: 500, color: 'var(--muted-paper)' }}>{t('howSee')}</h3>
                  <p style={{ fontSize: 20, fontWeight: 300, lineHeight: 1.55 }}>“{tx(d.sees)}”</p>
                </div>
                <div>
                  <h3 style={{ marginBottom: 10, fontSize: 15, fontWeight: 500, color: 'var(--muted-paper)' }}>{t('whatWant')}</h3>
                  <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--text-paper-2)' }}>{tx(d.wants)}</p>
                </div>
              </div>
              <div style={{ paddingTop: 22, borderTop: '1px solid var(--rule)' }}>
                <h3 style={{ marginBottom: 8, fontSize: 15, fontWeight: 500, color: 'var(--muted-paper)' }}>{t('moments')}</h3>
                {r.moments.length === 0 && <p style={{ fontSize: 15, color: 'var(--text-paper-2)' }}>{t('noMoments')}</p>}
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {r.moments.map((m, k) => (
                    <li key={k} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 16, padding: '10px 0', borderTop: '1px solid rgba(201,185,150,.55)', fontSize: 16, lineHeight: 1.55 }}>
                      <span style={{ color: 'var(--jaju)' }}>{tx(yearNumber(g, m.year))}</span><span style={{ color: 'var(--text-paper-2)' }}>{tx(m.text)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {!gone(d) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 22, borderTop: '1px solid var(--rule)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {d.places.length > 0 && <button className="btn btn-line" type="button" onClick={() => go('map')}><MapPin size={18} strokeWidth={1.6} />{t('findOnMap')}</button>}
                    <button className="btn btn-line" type="button" aria-expanded={giving} disabled={!canGift(g, d.id)} onClick={() => setGiving(!giving)}>
                      <Gift size={18} strokeWidth={1.6} />{!d.giftable ? t('noGift') : r.gifted === g.dayCount ? t('giftSent') : t('sendGift')}
                    </button>
                  </div>
                  {giving && (
                    <div role="group" aria-label={t('chooseGift')} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {g.player.gifts.map((x, k) => <button key={x + k} className="gift" type="button" onClick={() => give(x)}><span>{pk(giftName(x))}</span></button>)}
                    </div>
                  )}
                  {d.giftable && g.player.gifts.length === 0 && <p style={{ fontSize: 14, color: 'var(--muted-paper)' }}>{t('noGifts')}</p>}
                  {note && <p role="status" style={{ padding: '12px 16px', background: 'rgba(47,94,85,.1)', fontSize: 15, lineHeight: 1.5 }}>{note}</p>}
                </div>
              )}
            </div>
          </article>
        )}
      </div>
    </main>
  );
}

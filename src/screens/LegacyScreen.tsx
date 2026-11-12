import { useState } from 'react';
import { useUi } from '../store/ui';
import { useGame } from '../store/game';
import { useT } from '../i18n/useT';
import { Medallion, Seal } from '../ui/parts';
import { Portrait } from '../ui/Portrait';
import { ageAtDeath, closingYear, endingSeal, endingTitle, epitaph, heirsOf, measures } from '../engine/legacy';
import { dateKey, yearNumber } from '../engine/time';
import { npcPortrait, playerName, playerPortrait } from '../engine/world';
import { ell, peak } from '../scenes/kit';
import { achievementById } from '../content/achievements';
import { Atmosphere } from '../ui/Atmosphere';
import { FOCI, RIBBONS } from '../content/life';
import { scenarioById } from '../content/scenarios';
import { legacyWords, ribbonFor } from '../engine/life';

export function LegacyScreen() {
  const { t, tx, lang } = useT();
  const g = useGame((s) => s.game)!;
  const heir = useGame((s) => s.heir);
  const quit = useGame((s) => s.quit);
  const go = useUi((s) => s.go);
  const heirs = heirsOf(g);
  const [sel, setSel] = useState(heirs[0]?.id ?? null);
  if (g.player.alive) return null;
  const chosen = heirs.find((h) => h.id === sel) ?? heirs[0];
  const name = playerName(g);
  const end = closingYear(g);
  // The moments that define the life: its own deeds, marriage, children and death, not other people's news.
  const own = [...g.log].sort((a, b) => dateKey(a) - dateKey(b)).filter((l) => !l.historical && !/ died, aged |^A fever /.test(l.text.en));
  const life = own.length > 9 ? [...own.slice(0, 8), own[own.length - 1]] : own;

  const goOn = () => {
    if (!chosen) return;
    if (heir(chosen.id)) go('play');
  };
  const endHere = () => { quit(); go('menu'); };

  return (
    <main className="ink-screen" style={{ overflow: 'hidden', background: '#120E10' }}>
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="lg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0E0B10" /><stop offset="0.55" stopColor="#1E1218" /><stop offset="0.8" stopColor="#3A1E22" /><stop offset="1" stopColor="#1A1014" /></linearGradient>
          <radialGradient id="lg-dawn"><stop offset="0" stopColor="#E2C98E" stopOpacity="0.5" /><stop offset="1" stopColor="#E2C98E" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="1600" height="1000" fill="url(#lg-sky)" />
        <circle cx="1180" cy="780" r="420" fill="url(#lg-dawn)" />
        <path d={ell(1180, 780, 46, 46)} fill="#E2C98E" opacity="0.55" />
        <path d={peak(380, 1000, 520, 640) + peak(980, 1000, 560, 600) + peak(1500, 1000, 420, 680)} fill="#2A1A1E" opacity="0.9" />
        <path d="M0,830 C160,780 300,800 420,840 C560,790 700,780 840,830 C980,800 1120,800 1260,850 C1400,820 1500,830 1600,850 L1600,1000 L0,1000 Z" fill="#1C1216" />
        <rect x="0" y="790" width="1600" height="60" fill="#EDE3CC" opacity="0.05" />
      </svg>
      <Atmosphere air="embers" strength={0.9} />

      <header style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '18px clamp(20px, 4vw, 48px)' }}>
        <p style={{ fontSize: 15, color: 'var(--gold-light)' }}>{tx(yearNumber(g, end))}</p>
        <button className="bar-link" type="button" onClick={() => go('menu')}>{t('mainMenu')}</button>
      </header>

      <div className="wrap" style={{ maxWidth: 1240, paddingTop: 8, paddingBottom: 64, display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px, 5vw, 72px)', alignItems: 'flex-start' }}>
        <aside aria-label={tx(name)} style={{ flex: '0 1 300px', minWidth: 240, margin: '0 auto' }}>
          <div className="unroll" style={{ padding: '0 14px' }}>
            <div className="roller" aria-hidden="true" />
            <div style={{ background: 'repeating-linear-gradient(135deg, #4A2A2E 0 3px, #52303A 3px 6px)', padding: '18px 16px 22px' }}>
              <div style={{ position: 'relative', background: 'var(--hanji-inset)', boxShadow: 'inset 0 0 0 1px var(--gold)', padding: '22px 52px 0 12px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: 12, top: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <p className="ko" lang="ko" style={{ writingMode: 'vertical-rl', fontSize: 26, letterSpacing: '0.08em', color: 'var(--ink)' }}>{name.ko}</p>
                  <p style={{ writingMode: 'vertical-rl', fontSize: 13, color: 'var(--muted-paper)' }}>{g.player.birthYear}–{end}</p>
                </div>
                <Portrait spec={playerPortrait(g)} style={{ width: '100%', height: 'auto' }} />
              </div>
            </div>
            <div className="roller" aria-hidden="true" />
          </div>
        </aside>

        <div className="later" style={{ flex: '1 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 36 }}>
          <div>
            <p style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Seal text={endingSeal(g).slice(0, 1)} size={40} />
              <span style={{ fontSize: 17, color: '#E2C98E' }}>{t('anEnding', { title: tx(endingTitle(g)) })}</span>
            </p>
            <h1 style={{ marginTop: 18, fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.015em', color: 'var(--text-ink)' }}>{tx(name)}</h1>
            <p style={{ marginTop: 6, fontSize: 17, color: 'var(--muted-ink)' }}>{t('diedLine', { from: g.player.birthYear, to: end })}, {t('aged', { n: ageAtDeath(g) })}</p>
            <p style={{ marginTop: 18, fontSize: 22, fontWeight: 300, lineHeight: 1.55, color: 'var(--text-ink-2)', maxWidth: '46ch' }}>{tx(epitaph(g))}</p>
            {(() => {
              const rb = RIBBONS[ribbonFor(g)];
              return (
                <p className="ribbon" title={tx(rb.text)}>
                  <span className="ribbon-seal ko" lang="ko" aria-hidden="true">{rb.seal}</span>
                  <span><span className="ribbon-k">{lang === 'ko' ? '이 삶의 이름' : 'This life’s ribbon'}</span><strong>{tx(rb.name)}</strong> · {tx(rb.text)}</span>
                </p>
              );
            })()}
          </div>

          {g.scenario && scenarioById(g.scenario.id) && (
            <p className={`ribbon scenario-result st-${g.scenario.status}`}>
              <span className="ribbon-seal ko" lang="ko" aria-hidden="true">{scenarioById(g.scenario.id)!.seal}</span>
              <span><span className="ribbon-k">{lang === 'ko' ? '시나리오' : 'Scenario'}</span><strong>{tx(scenarioById(g.scenario.id)!.name)}</strong> · {g.scenario.status === 'won' ? (lang === 'ko' ? '달성했다.' : 'achieved.') : g.scenario.status === 'open' && scenarioById(g.scenario.id)!.heirs ? (lang === 'ko' ? '후대가 이어 갈 수 있다.' : 'an heir may still finish it.') : (lang === 'ko' ? '이루지 못했다.' : 'not achieved.')}</span>
            </p>
          )}
          <section aria-labelledby="lg-remember">
            <h2 id="lg-remember" className="h2">{lang === 'ko' ? '어떻게 기억될까' : 'How this life will be remembered'} <span className="ko" lang="ko">遺德</span></h2>
            <dl className="remember">
              {legacyWords(g).map((w, k) => <div key={k}><dt>{tx(w.name)}</dt><dd>{tx(w.text)}</dd></div>)}
            </dl>
          </section>

          <section aria-labelledby="lg-life">
            <h2 id="lg-life" className="h2">{t('theLife')} <span className="ko" lang="ko">행장</span></h2>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {life.map((l, k) => (
                <li key={k} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 16, padding: '11px 0', borderTop: '1px solid rgba(201,168,106,.22)', fontSize: 16, lineHeight: 1.55 }}>
                  <span style={{ color: 'var(--gold-light)' }}>{lang === 'ko' ? `${l.year}년` : l.year}</span><span style={{ color: 'var(--text-ink-2)' }}>{tx(l.text)}</span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="lg-meas" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '22px 28px' }}>
            <h2 id="lg-meas" className="h2" style={{ gridColumn: '1 / -1', margin: 0 }}>{t('whatLeft')} <span className="ko" lang="ko">남긴 것</span></h2>
            {measures(g).map((m, k) => (
              <div key={k} style={{ paddingTop: 12, borderTop: '1px solid rgba(201,168,106,.4)' }}>
                <p style={{ fontSize: 13, color: 'var(--muted-ink)' }}>{tx(m.label)}</p>
                <p style={{ marginTop: 4, fontSize: 20, fontWeight: 300, color: 'var(--text-ink)' }}>{tx(m.value)}</p>
                <p style={{ marginTop: 4, fontSize: 14, lineHeight: 1.5, color: 'var(--muted-ink)' }}>{tx(m.note)}</p>
              </div>
            ))}
          </section>

          {g.achieved.length > 0 && (
            <section aria-labelledby="lg-hon">
              <h2 id="lg-hon" className="h2">{t('achievementsThisLife')} <span className="ko" lang="ko">업적</span></h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '14px 22px' }}>
                {g.achieved.map((id) => achievementById(id)).filter((a) => !!a).map((a) => (
                  <li key={a!.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--text-ink-2)' }}><Seal text={a!.seal} size={30} tilt={-4} />{tx(a!.title)}</li>
                ))}
              </ul>
              <button className="bar-link" type="button" onClick={() => go('honours')} style={{ marginTop: 14, paddingLeft: 0 }}>{t('seeAll')}</button>
            </section>
          )}

          <section aria-labelledby="lg-heir">
            <h2 id="lg-heir" className="h2">{t('continueLine')} <span className="ko" lang="ko">대를 잇다</span></h2>
            {heirs.length === 0 ? (
              <>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: '#D9CCB0', maxWidth: '60ch' }}>{t('noHeirs')}</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
                  <button className="btn btn-gold" type="button" onClick={() => { quit(); go('campaign'); }}>{t('newLifeHere')}</button>
                  <button className="btn btn-ghost" type="button" onClick={endHere}>{t('mainMenu')}</button>
                </div>
              </>
            ) : (
              <>
                <p aria-live="polite" style={{ marginBottom: 22, fontSize: 16, lineHeight: 1.6, color: '#D9CCB0', maxWidth: '60ch' }}>{chosen ? tx(chosen.inherit) : ''}</p>
                <div role="group" aria-label={t('continueLine')} style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                  {heirs.slice(0, 6).map((h) => (
                    <button key={h.id} className="heir" type="button" aria-pressed={chosen?.id === h.id} onClick={() => setSel(h.id)}>
                      {chosen?.id === h.id && <Seal text="뜻" stamp />}
                      <Medallion spec={npcPortrait(g, h.npc)} size={76} ring="0 0 0 2px var(--gold-light)" />
                      <span className="ko echo" lang="ko" style={{ fontSize: 17, color: 'var(--gold-light)' }}>{h.npc.name.ko}</span>
                      <span style={{ fontSize: 17, color: 'var(--text-ink)' }}>{tx(h.npc.name)}</span>
                      <span style={{ fontSize: 13, color: 'var(--muted-ink)' }}>{tx(h.relation)}</span>
                      <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-ink-2)' }}>{tx(h.note)}</span>
                      {h.npc.upbringing && (
                        <span style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--muted-ink)' }}>
                          {tx(FOCI.find((f) => f.id === h.npc.upbringing!.focus)?.name ?? { en: '' })} · {lang === 'ko' ? '배움' : 'learning'} {Math.round(h.npc.upbringing.progress)}{h.npc.upbringing.trait ? ` · ${h.npc.upbringing.trait}` : ''}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
                  <button className="btn btn-gold" type="button" onClick={goOn}>{t('continueAs', { name: chosen ? tx(chosen.npc.name) : '' })}</button>
                  <button className="btn btn-ghost" type="button" onClick={endHere}>{t('endHere')}</button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

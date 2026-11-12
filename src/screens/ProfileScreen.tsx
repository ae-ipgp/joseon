import { useUi } from '../store/ui';
import { useGame } from '../store/game';
import { useT } from '../i18n/useT';
import { BrushMeter, Fibre } from '../ui/parts';
import { WealthBar } from '../ui/Wealth';
import { Portrait } from '../ui/Portrait';
import { RecordsBar } from './RecordsBar';
import { ProfileExtra } from './ProfileExtra';
import { officeTitle } from '../engine/politics';
import { familyOf } from '../content/families';
import { OFFICES, QUALITY_NAMES, QUALITY_TEXT, TRAITS, healthWord, reputationText, reputationWord } from '../content/lists';
import { ENDINGS } from '../content/lists';
import { dateKey, factionsOf, playerAge, seasonYear, yearNumber, zodiac } from '../engine/time';
import { betrothedId, childrenOf, livingSpouse, playerName, playerPortrait, spouseId } from '../engine/world';
import type { Quality } from '../model/schemas';

export function ProfileScreen() {
  const { t, tx, pk, lang } = useT();
  const g = useGame((s) => s.game)!;
  const go = useUi((s) => s.go);
  const P = g.player;
  const woman = P.gender === 'woman';
  const name = playerName(g);
  const fam = familyOf(g.house.background);
  const f = factionsOf(g);
  const sp = spouseId(g);
  const living = livingSpouse(g);
  const bet = betrothedId(g);
  const kids = childrenOf(g).filter((c) => c.parents.includes('player'));
  const marital = living ? t('married', { name: tx(living.name) }) : sp ? t('widowed') : bet ? t('betrothedTo', { name: tx(g.npcs[bet].name) }) : t('unmarriedCap');
  const faction = g.house.faction === 'A' ? tx(f.a) : g.house.faction === 'B' ? tx(f.b) : '—';
  const line = g.generation === 1 ? pk(woman ? fam.line.woman : fam.line.man) : t('generationN', { n: g.generation });
  const log = [...g.log].sort((a, b) => dateKey(a) - dateKey(b));
  const seal = (P.given.ko ?? P.given.en).slice(0, 2);

  return (
    <main className="paper-screen">
      <Fibre seed={2} />
      <RecordsBar current="profile" />
      <div className="wrap" style={{ maxWidth: 1280, paddingTop: 'clamp(28px, 4vh, 48px)', paddingBottom: 56, display: 'flex', flexWrap: 'wrap', gap: 'clamp(28px, 4vw, 56px)', alignItems: 'flex-start' }}>
        <aside aria-label={tx(name)} style={{ flex: '0 1 340px', minWidth: 260, margin: '0 auto' }}>
          <div style={{ padding: '0 14px' }}>
            <div className="roller" aria-hidden="true" />
            <div style={{ background: 'repeating-linear-gradient(135deg, #3E5A55 0 3px, #44625C 3px 6px)', padding: '20px 18px 24px' }}>
              <div style={{ position: 'relative', background: 'var(--hanji-inset)', boxShadow: 'inset 0 0 0 1px var(--gold)', padding: '22px 54px 0 14px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: 12, top: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <p className="ko" lang="ko" style={{ writingMode: 'vertical-rl', fontSize: 28, letterSpacing: '0.08em', color: 'var(--ink)' }}>{name.ko}</p>
                  <span className="seal ko" lang="ko" aria-hidden="true" style={{ width: 30, height: 30, fontSize: 13, ['--tilt' as string]: '0deg' }}>{seal}</span>
                </div>
                <Portrait spec={playerPortrait(g)} style={{ width: '100%', height: 'auto' }} />
              </div>
            </div>
            <div className="roller" aria-hidden="true" />
          </div>
          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: 'var(--muted-paper)' }}>{t('portraitNote', { when: lang === 'ko' ? tx(seasonYear(g)) : tx(seasonYear(g)).replace(/^./, (c) => c.toLowerCase()) })}</p>
        </aside>

        <div style={{ flex: '1 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 30 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.015em' }}>{tx(name)}</h1>
            <p style={{ marginTop: 10, fontSize: 19, color: 'var(--jaju)' }}>{line}</p>
            <dl className="facts" style={{ margin: '22px 0 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap: '16px 24px' }}>
              <div><dt>{t('age')}</dt><dd>{playerAge(g)}</dd></div>
              <div><dt>{t('born')}</dt><dd>{tx(yearNumber(g, P.birthYear))}, {lang === 'ko' ? `${pk(zodiac(P.birthYear))}띠` : `year of the ${zodiac(P.birthYear).en}`}</dd></div>
              <div><dt>{t('status')}</dt><dd>{P.legal === 'commoner' ? (lang === 'ko' ? '평민' : 'Commoner') : P.legal === 'royal' ? (lang === 'ko' ? '왕족' : 'Royal family') : t(woman ? 'yangbanWoman' : 'yangbanMan')}, {marital.charAt(0).toLowerCase() + marital.slice(1)}</dd></div>
              <div><dt>{t('faction')}</dt><dd>{faction}</dd></div>
              <div><dt>{t('office')}</dt><dd>{P.office ? tx(officeTitle(g) ?? OFFICES[P.office.track][P.office.rank - 1]) : t('noOffice')}</dd></div>
            </dl>
          </div>

          <section className="sec" aria-labelledby="pf-st">
            <h2 id="pf-st" className="h2">{t('standing')} <span className="ko" lang="ko">평판</span></h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '22px 36px' }}>
              <BrushMeter label={`${t('reputation')}: ${tx(reputationWord(P.reputation))}`} value={P.reputation} note={tx(reputationText(P.reputation))} />
              <BrushMeter label={`${t('health')}: ${tx(healthWord(P.health))}`} value={P.health} />
              <BrushMeter label={t('favour')} value={P.favour} />
              <WealthBar g={g} />
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '30px 40px' }}>
            <section className="sec" aria-labelledby="pf-q">
              <h2 id="pf-q" className="h2">{t('qualities')} <span className="ko" lang="ko">자질</span></h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(['wit', 'grace', 'resolve'] as Quality[]).map((q) => <BrushMeter key={q} label={tx(QUALITY_NAMES[q])} value={P.qualities[q]} note={tx(QUALITY_TEXT[q])} />)}
              </div>
            </section>
            <section className="sec" aria-labelledby="pf-p">
              <h2 id="pf-p" className="h2">{t('temperament')} <span className="ko" lang="ko">성품</span></h2>
              {P.traits.length === 0 && <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-paper-2)' }}>{t('noTraits')}</p>}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {P.traits.map((id) => TRAITS[id] && (
                  <li key={id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 14, alignItems: 'start' }}>
                    <span className="ko" lang="ko" style={{ fontSize: 22, lineHeight: 1.2, color: 'var(--jaju)' }}>{TRAITS[id].ko}</span>
                    <span><span style={{ display: 'block', fontSize: 16, fontWeight: 500 }}>{tx(TRAITS[id].name)}</span><span style={{ display: 'block', fontSize: 15, lineHeight: 1.5, color: 'var(--text-paper-2)' }}>{tx(TRAITS[id].text)}</span></span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <ProfileExtra g={g} />

          <section className="sec" aria-labelledby="pf-h">
            <h2 id="pf-h" className="h2">{t('household')} <span className="ko" lang="ko">집안</span></h2>
            <p style={{ fontSize: 16, lineHeight: 1.6 }}>{marital}{kids.length ? `. ${t('children')}: ${kids.map((k) => tx(k.given ?? k.name)).join(', ')}` : ''}</p>
            <button className="link-paper" type="button" onClick={() => go('family')}>{t('familyTree')}</button>
          </section>

          <section className="sec" aria-labelledby="pf-r">
            <h2 id="pf-r" className="h2">{t('lifeRecord')} <span className="ko" lang="ko">행장</span></h2>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {log.map((r, k) => (
                <li key={k} className={'tl' + (r.historical ? ' hist' : '')}>
                  <span className="dot" aria-hidden="true" />
                  <span style={{ fontSize: 15, color: 'var(--muted-paper)' }}>{tx(yearNumber(g, r.year))}{r.moon ? (lang === 'ko' ? ` ${r.moon}월` : `, moon ${r.moon}`) : ''}</span>
                  <span style={{ fontSize: 16, lineHeight: 1.55, paddingLeft: 14 }}>{tx(r.text)}</span>
                </li>
              ))}
            </ol>
          </section>

          {g.ancestors.length > 0 && (
            <section className="sec" aria-labelledby="pf-a">
              <h2 id="pf-a" className="h2">{t('ancestors')} <span className="ko" lang="ko">선대</span></h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {g.ancestors.map((a, k) => (
                  <li key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '10px 0', borderTop: '1px solid var(--rule)', fontSize: 16 }}>
                    <span>{tx(a.name)}, {t('diedLine', { from: a.born, to: a.died })}</span>
                    <span style={{ color: 'var(--jaju)' }}>{tx(ENDINGS[a.ending]?.title)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

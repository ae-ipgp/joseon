import { ChevronLeft } from 'lucide-react';
import { useUi } from '../store/ui';
import { useGame } from '../store/game';
import { useT } from '../i18n/useT';
import { Fibre, Seal } from '../ui/parts';
import { Coin } from '../ui/Wealth';
import { RecordsBar } from './RecordsBar';
import { ACHIEVEMENTS, CATEGORIES, rewardText } from '../content/achievements';
import { readBook } from '../save/honours';
import { RIBBONS } from '../content/life';

/** Every achievement, earned in any life or not yet, grouped by kind, with its reward. */
export function HonoursScreen() {
  const { t, tx, lang } = useT();
  const g = useGame((s) => s.game);
  const go = useUi((s) => s.go);
  useUi((s) => s.honours.length);
  const book = readBook();
  const earnedEver = ACHIEVEMENTS.filter((a) => book[a.id]).length;
  const thisLife = g ? g.achieved.length : 0;
  const pct = Math.round((earnedEver / ACHIEVEMENTS.length) * 100);

  return (
    <main className="paper-screen">
      <Fibre seed={11} />
      {g ? <RecordsBar current="honours" /> : (
        <header className="bar">
          <button className="bar-link" type="button" onClick={() => go('menu')} style={{ paddingLeft: 0 }}><ChevronLeft size={20} strokeWidth={1.6} />{t('mainMenu')}</button>
        </header>
      )}
      <div className="wrap" style={{ maxWidth: 1240, paddingTop: 'clamp(28px, 4vh, 48px)', paddingBottom: 64, display: 'flex', flexDirection: 'column', gap: 36 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px 40px', flexWrap: 'wrap' }}>
          <div>
            <p className="ko echo" lang="ko" style={{ marginBottom: 8, fontSize: 22, color: 'var(--jaju)' }}>업적</p>
            <h1 style={{ fontSize: 'clamp(40px, 5vw, 60px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.015em' }}>{t('achievementsTitle')}</h1>
            <p style={{ marginTop: 12, maxWidth: '60ch', fontSize: 17, lineHeight: 1.6, color: 'var(--text-paper-2)' }}>{t('achievementsIntro')}</p>
          </div>
          <div style={{ minWidth: 'min(320px, 100%)', flex: '0 1 360px' }}>
            <p style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 16 }}>
              <span>{t('earnedOf', { n: earnedEver, total: ACHIEVEMENTS.length })}</span>
              {g && <span style={{ color: 'var(--jaju)' }}>{t('inThisLife', { n: thisLife })}</span>}
            </p>
            <div className="wealth-bar" style={{ marginTop: 8 }} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t('earnedOf', { n: earnedEver, total: ACHIEVEMENTS.length })}>
              <span className="fill" style={{ width: `${Math.max(2, pct)}%` }} />
            </div>
          </div>
        </div>

        {CATEGORIES.map((c) => {
          const list = ACHIEVEMENTS.filter((a) => a.cat === c.id);
          const got = list.filter((a) => book[a.id]).length;
          return (
            <section key={c.id} className="sec" aria-labelledby={`hn-${c.id}`}>
              <h2 id={`hn-${c.id}`} className="h2" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>{tx(c.name)}</span>
                <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--muted-paper)' }}>{got} / {list.length}</span>
              </h2>
              <ul className="honour-grid">
                {list.map((a) => {
                  const e = book[a.id];
                  const mine = !!g?.achieved.includes(a.id);
                  const reward = rewardText(a.reward);
                  return (
                    <li key={a.id} className={'honour-tile' + (e ? ' got' : '')}>
                      {e ? <Seal text={a.seal} size={46} tilt={-5} /> : <span className="seal-empty ko" lang="ko" aria-hidden="true">{a.seal}</span>}
                      <div style={{ minWidth: 0 }}>
                        <p style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 17, fontWeight: 500 }}>{tx(a.title)}</span>
                          {mine && <span className="mini-chip">{t('thisLife')}</span>}
                        </p>
                        <p style={{ marginTop: 3, fontSize: 15, lineHeight: 1.5, color: 'var(--text-paper-2)' }}>{tx(a.how)}</p>
                        {reward && <p style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--muted-paper)' }}>{a.reward?.money ? <Coin size={13} /> : null}{t('rewardIs', { reward: tx(reward) })}</p>}
                        {e && (
                          <p style={{ marginTop: 6, fontSize: 13, color: 'var(--jaju)' }}>
                            {t('firstEarned', { name: tx(e.by), year: lang === 'ko' ? `${e.year}년` : e.year })}{e.times > 1 ? `, ${t('timesEarned', { n: e.times })}` : ''}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        <section className="sec" aria-labelledby="hn-ribbons">
          <h2 id="hn-ribbons" className="h2" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span>{lang === 'ko' ? '삶의 이름' : 'Ribbons'}</span>
            <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--muted-paper)' }}>{Object.keys(RIBBONS).filter((id) => book['ribbon:' + id]).length} / {Object.keys(RIBBONS).length}</span>
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-paper-2)', maxWidth: '60ch', marginBottom: 14 }}>{lang === 'ko' ? '삶이 끝날 때 그 삶을 한마디로 부르는 이름이 붙는다. 여러 삶을 살아 모두 모아 보라.' : 'When a life ends it is given one word that sums it up. Live many lives to collect them all.'}</p>
          <ul className="honour-grid">
            {(Object.entries(RIBBONS) as [string, (typeof RIBBONS)[keyof typeof RIBBONS]][]).map(([id, r]) => {
              const e = book['ribbon:' + id];
              return (
                <li key={id} className={'honour-tile' + (e ? ' got' : '')}>
                  {e ? <Seal text={r.seal} size={46} tilt={-5} /> : <span className="seal-empty ko" lang="ko" aria-hidden="true">{r.seal}</span>}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 17, fontWeight: 500 }}>{tx(r.name)}</p>
                    <p style={{ marginTop: 3, fontSize: 15, lineHeight: 1.5, color: 'var(--text-paper-2)' }}>{tx(r.text)}</p>
                    {e && <p style={{ marginTop: 6, fontSize: 13, color: 'var(--jaju)' }}>{t('firstEarned', { name: tx(e.by), year: lang === 'ko' ? `${e.year}년` : e.year })}{e.times > 1 ? `, ${t('timesEarned', { n: e.times })}` : ''}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}

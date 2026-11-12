import type { Campaign } from '../model/schemas';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUi } from '../store/ui';
import { useT } from '../i18n/useT';
import { ERAS, PREMISES, eraOf, premiseOf } from '../content/campaigns';
import { ContinuityPicker, DEFAULT_RULES, DifficultyPicker, SandboxRules, YearPicker } from './CampaignExtra';
import { cycleName } from '../engine/time';
import { hips, peak, range, rects, roof } from '../scenes/kit';
import { Seal } from '../ui/parts';

const W = range(232, 376, 24);
const ILL = {
  peaks: peak(120, 200, 150, 70) + peak(300, 200, 170, 40) + peak(500, 200, 150, 80),
  near: peak(40, 200, 110, 120) + peak(580, 200, 110, 116),
  low: roof(300, 110, 280, 38), up: roof(300, 58, 200, 40),
  hips: hips(300, 110, 280, 38) + hips(300, 58, 200, 40),
  win: rects(W, 146, 16, 16),
};

function Palace({ fill, accent, line }: { fill: string; accent: string; line: string }) {
  return (
    <g>
      <rect x="160" y="178" width="280" height="22" fill={fill} />
      <rect x="190" y="164" width="220" height="16" fill={fill} />
      <rect x="222" y="134" width="156" height="32" fill={fill} />
      <path d={ILL.win} fill={accent} opacity="0.55" />
      <rect x="252" y="84" width="96" height="30" fill={fill} />
      <path d={ILL.low} fill={fill} /><path d={ILL.up} fill={fill} />
      <path d={ILL.hips} fill="none" stroke={line} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

export function CampaignScreen() {
  const { t, pk, lang } = useT();
  const go = useUi((s) => s.go);
  const draft = useUi((s) => s.draftCampaign);
  const setRaw = useUi((s) => s.setDraftCampaign);
  // Continuity and difficulty survive switching eras and modes.
  const setDraft = (c: Campaign) => setRaw({ ...c, ...(c.continuity ?? draft.continuity ? { continuity: c.continuity ?? draft.continuity } : {}), ...(c.difficulty ?? draft.difficulty ? { difficulty: c.difficulty ?? draft.difficulty } : {}) });
  const hist = draft.mode === 'historical';
  const era = eraOf(hist ? draft.era : 1724);
  const prem = premiseOf(draft.premise ?? 'queen');
  const summary = hist
    ? t('summaryHist', { year: era.year, king: pk(era.king) })
    : t('summaryAlt', { premise: lang === 'ko' ? pk(prem.title) : prem.title.en.toLowerCase() });

  return (
    <main className="ink-screen" style={{ display: 'flex', flexDirection: 'column', background: 'radial-gradient(90% 60% at 50% 0%, #2E1419 0%, #1B1513 70%)' }}>
      <header className="bar" style={{ background: 'transparent' }}>
        <button className="bar-link" type="button" onClick={() => go('menu')} style={{ paddingLeft: 0 }}><ChevronLeft size={20} strokeWidth={1.6} />{t('mainMenu')}</button>
        <ol className="steps" aria-label={t('newLife')}>
          <li className="step" aria-current="step"><span className="n">1</span>{t('stepCampaign')}</li>
          <li className="step"><span className="n">2</span>{t('stepCharacter')}</li>
        </ol>
      </header>

      <div className="wrap" style={{ flex: 1, maxWidth: 1240, paddingTop: 'clamp(28px, 5vh, 56px)', paddingBottom: 32, display: 'flex', flexDirection: 'column', gap: 'clamp(28px, 4vh, 44px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px 32px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 'clamp(34px, 4vw, 52px)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.01em', maxWidth: '18ch' }}>{t('campaignTitle')}</h1>
          <p className="ko echo" lang="ko" style={{ fontSize: 22, color: 'var(--gold-light)' }}>어느 조선에서 살 것인가</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'stretch' }}>
          <section className="camp" data-on={hist} aria-labelledby="cp-h1" style={{ flex: '1 1 420px', minWidth: 0 }}>
            {hist && <Seal text="선" stamp />}
            <button className="camp-head" type="button" aria-pressed={hist} onClick={() => setDraft({ mode: 'historical', era: hist ? draft.era : 1724, premise: null })}>
              <svg viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: 'block', width: '100%', height: 180 }}>
                <defs><linearGradient id="cp-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EDE1C6" /><stop offset="1" stopColor="#CFB284" /></linearGradient></defs>
                <rect width="600" height="200" fill="url(#cp-day)" />
                <circle cx="452" cy="62" r="30" fill="#8E2230" />
                <path d={ILL.peaks} fill="#A99C83" opacity="0.75" />
                <path d={ILL.near} fill="#8C7F68" opacity="0.8" />
                <Palace fill="#2A211E" accent="#C99A5A" line="#CFC6B4" />
              </svg>
              <div style={{ padding: '26px 30px 6px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p className="ko echo" lang="ko" style={{ fontSize: 20, color: 'var(--jaju)' }}>역사 속 조선</p>
                <h2 id="cp-h1" style={{ fontSize: 32, fontWeight: 400, lineHeight: 1.15 }}>{t('historical')}</h2>
                <p style={{ marginTop: 6, fontSize: 17, lineHeight: 1.65, color: 'var(--text-paper-2)', maxWidth: '52ch' }}>{t('historicalText')}</p>
              </div>
            </button>
            <div style={{ padding: '18px 30px 30px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
              <p id="cp-era-l" style={{ fontSize: 15, fontWeight: 500 }}>{t('whereBegins')}</p>
              <div role="group" aria-labelledby="cp-era-l" style={{ position: 'relative', height: 62, margin: '0 22px' }}>
                <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 31, height: 1, background: '#8C7B66' }} />
                {ERAS.map((e) => (
                  <button key={e.year} className="era" type="button" aria-pressed={hist && draft.era === e.year} aria-label={`${e.year}, ${pk(e.king)}`}
                    onClick={() => setDraft({ mode: 'historical', era: e.year, premise: null })}
                    style={{ left: `${(((e.year - 1392) / (1897 - 1392)) * 100).toFixed(2)}%` }}>
                    <span>{e.year}</span><span className="dot" />
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted-paper)', marginTop: -8 }}><span>{t('founded')}</span><span>{t('empire')}</span></div>
              <YearPicker draft={draft} set={setDraft} />
              {hist && <ContinuityPicker draft={draft} set={setDraft} />}
              <div className="detail" key={era.year} style={{ borderTop: '1px solid var(--rule)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 40, fontWeight: 300, lineHeight: 1, color: 'var(--jaju)' }}>{era.year}</span>
                  <span style={{ fontSize: 15, color: 'var(--muted-paper)' }}>{pk(cycleName(era.year))}</span>
                </div>
                <p style={{ fontSize: 20, fontWeight: 500 }}>{pk(era.title)}</p>
                <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--text-paper-2)', maxWidth: '56ch' }}>{pk(era.text)}</p>
                <dl style={{ margin: '6px 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontSize: 15 }}>
                  <dt style={{ color: 'var(--muted-paper)' }}>{t('atCourt')}</dt><dd style={{ margin: 0 }}>{pk(era.court)}</dd>
                  <dt style={{ color: 'var(--muted-paper)' }}>{t('royalSeat')}</dt><dd style={{ margin: 0 }}>{pk(era.palace)}</dd>
                </dl>
              </div>
            </div>
          </section>

          <section className="camp" data-on={!hist} aria-labelledby="cp-h2" style={{ flex: '1 1 420px', minWidth: 0 }}>
            {!hist && <Seal text="선" stamp />}
            <button className="camp-head" type="button" aria-pressed={!hist} onClick={() => setDraft({ mode: 'alternative', era: 1724, premise: draft.premise ?? 'queen' })}>
              <svg viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: 'block', width: '100%', height: 180 }}>
                <defs><linearGradient id="cp-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#120E12" /><stop offset="0.62" stopColor="#3A1220" /><stop offset="0.62" stopColor="#1A1218" /><stop offset="1" stopColor="#0D0A0E" /></linearGradient></defs>
                <rect width="600" height="200" fill="url(#cp-night)" />
                <circle cx="160" cy="54" r="26" fill="#EDE3CC" />
                <ellipse cx="160" cy="160" rx="22" ry="3.5" fill="#EDE3CC" opacity="0.45" />
                <g transform="translate(300,124) scale(0.6) translate(-300,-200)"><Palace fill="#0D090A" accent="#C99A5A" line="#4A3E44" /></g>
                <g transform="translate(300,124) scale(0.6,-0.6) translate(-300,-200)" opacity="0.32"><Palace fill="#6B1626" accent="#C99A5A" line="#6B1626" /></g>
                <path d="M120,140h80M260,150h120M410,140h70M190,170h60M330,178h110M80,186h70" stroke="#EDE3CC" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
              </svg>
              <div style={{ padding: '26px 30px 6px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p className="ko echo" lang="ko" style={{ fontSize: 20, color: 'var(--jaju)' }}>또 다른 조선</p>
                <h2 id="cp-h2" style={{ fontSize: 32, fontWeight: 400, lineHeight: 1.15 }}>{t('alternative')}</h2>
                <p style={{ marginTop: 6, fontSize: 17, lineHeight: 1.65, color: 'var(--text-paper-2)', maxWidth: '52ch' }}>{t('alternativeText')}</p>
              </div>
            </button>
            <div style={{ padding: '18px 30px 30px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <p id="cp-prem-l" style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{t('choosePremise')}</p>
              <div role="group" aria-labelledby="cp-prem-l" style={{ display: 'flex', flexDirection: 'column' }}>
                {PREMISES.map((p) => (
                  <button key={p.id} className="prem" type="button" aria-pressed={!hist && draft.premise === p.id} onClick={() => setDraft({ mode: 'alternative', era: 1724, premise: p.id, rules: draft.rules ?? DEFAULT_RULES })}>
                    <span className="ring" />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 500 }}>{pk(p.title)}</span>
                      <span style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text-paper-2)' }}>{pk(p.text)}</span>
                    </span>
                  </button>
                ))}
              </div>
              {!hist && <SandboxRules draft={draft} set={setDraft} />}
            </div>
          </section>
        </div>
        <DifficultyPicker draft={draft} set={setDraft} />
      </div>

      <footer className="sticky-foot">
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 16, color: '#D9CCB0' }} aria-live="polite">{t('beginsIn')} <span style={{ color: 'var(--hanji)', fontWeight: 500 }}>{summary}</span></p>
          <button className="btn btn-gold" type="button" onClick={() => go('create')}>{t('stepCharacter')}<ChevronRight size={18} strokeWidth={1.6} /></button>
        </div>
      </footer>
    </main>
  );
}

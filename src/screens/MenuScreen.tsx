import { useMemo } from 'react';
import { MenuBackdrop } from '../scenes/MenuBackdrop';
import { Atmosphere } from '../ui/Atmosphere';
import { useUi } from '../store/ui';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';
import { useT } from '../i18n/useT';
import { latestSlot, readSlot } from '../save/storage';
import { playerName } from '../engine/world';
import { seasonYear } from '../engine/time';
import { Medallion } from '../ui/parts';
import { playerPortrait } from '../engine/world';
import { slotLine } from './sheets';
import { DEFAULT_RULES } from './CampaignExtra';
import { useL } from '../ui/kit';

export function MenuScreen() {
  const { t, lang, pk } = useT();
  const go = useUi((s) => s.go);
  const openSheet = useUi((s) => s.openSheet);
  const game = useGame((s) => s.game);
  const load = useGame((s) => s.load);
  const update = useSettings((s) => s.update);
  const latest = useMemo(() => (game ? null : latestSlot()), [game]);
  const { L } = useL();
  const setDraft = useUi((s) => s.setDraftCampaign);
  const draft = useUi((s) => s.draftCampaign);

  const resume = () => {
    if (game) {
      go(game.player.alive ? (game.active ? 'scene' : 'play') : 'legacy');
      return;
    }
    if (!latest) return;
    const r = readSlot(latest.slot);
    if (!r.game) return;
    load(r.game);
    go(r.game.player.alive ? (r.game.active ? 'scene' : 'play') : 'legacy');
  };

  let sub = '';
  let detail = '';
  if (game) {
    sub = `${pk(playerName(game))}, ${pk(seasonYear(game)).toLowerCase()}`;
    detail = game.generation > 1 ? t('generationN', { n: game.generation }) : '';
  } else if (latest) {
    const n = latest.summary.name;
    sub = `${lang === 'ko' ? n.ko ?? n.en : n.en}${latest.summary.alive ? '' : `, ${t('ended').toLowerCase()}`}`;
    const ln = slotLine(latest, lang);
    detail = `${latest.label ? `${latest.label} · ` : ''}${ln.a}${latest.summary.generation > 1 ? ` · ${t('generationN', { n: latest.summary.generation })}` : ''} · ${ln.b}`;
  }
  const portrait = game ? playerPortrait(game) : latest?.summary.portrait;
  const newHistorical = () => { setDraft({ mode: 'historical', era: draft.mode === 'historical' ? draft.era : 1724, premise: null, continuity: draft.continuity, difficulty: draft.difficulty }); go('campaign'); };
  const newSandbox = () => { setDraft({ mode: 'alternative', era: 1724, premise: draft.premise ?? 'queen', rules: draft.rules ?? DEFAULT_RULES, difficulty: draft.difficulty }); go('campaign'); };
  const canResume = !!game || !!latest;

  return (
    <main className="ink-screen" style={{ overflow: 'hidden', background: '#120E10' }}>
      <MenuBackdrop />
      <div className="mm-cloud" style={{ top: '12%' }} aria-hidden="true" />
      <div className="mm-cloud mm-cloud-2" style={{ top: '38%', animationDuration: '52s', opacity: 0.1 }} aria-hidden="true" />
      <div className="mm-lanterns" aria-hidden="true">
        {[[58, 70, 0], [66, 120, 1.2], [74, 54, 0.6], [83, 150, 2], [91, 90, 1.5]].map(([x, len, d], i) => (
          <span key={i} className="mm-lantern" style={{ left: `${x}%`, animationDelay: `${-d}s` }}><i style={{ height: len }} /><b style={{ animationDelay: `${-d * 1.3}s` }} /></span>
        ))}
      </div>
      <Atmosphere air="petals" strength={0.8} />
      <div className="mm-veil" aria-hidden="true" />
      <div className="mm-layout">
        <div className="mm-body">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            <h1 className="mm-title ko" lang="ko" aria-label="Joseon: The Crown and the Legacy">조선</h1>
            <span className="seal ko mm-after" lang="ko" aria-hidden="true" style={{ width: 64, height: 64, fontSize: 18, lineHeight: 1.1, ['--tilt' as string]: '-4deg' }}>
              <span>왕관<br />유산</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 40, alignSelf: 'stretch', flex: 1, minWidth: 0, paddingTop: 10 }}>
            <div className="mm-after" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {lang === 'ko' ? (
                <>
                  <p className="mm-word ko" lang="ko" style={{ fontSize: 'clamp(44px, 5vw, 64px)', lineHeight: 1.05 }}>왕관과 유산</p>
                  <p lang="en" style={{ fontSize: 18, color: 'var(--gold-light)' }}>Joseon: The Crown &amp; the Legacy</p>
                </>
              ) : (
                <>
                  <p className="mm-word">Joseon</p>
                  <p style={{ fontSize: 22, color: 'var(--gold-light)' }}>{t('menuSubtitle')}</p>
                </>
              )}
            </div>
            <nav className="mm-after" aria-label={t('mainMenu')} style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 460 }}>
              {canResume && (
                <button className="mm-item mm-continue" type="button" onClick={resume}>
                  <span className="mk" />
                  {portrait && <Medallion spec={portrait} size={46} gone={latest ? !latest.summary.alive : false} />}
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <span>{t('menuContinue')}</span>
                    <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--gold-light)' }}>{sub}</span>
                    {detail && <span className="mm-detail">{detail}</span>}
                  </span>
                </button>
              )}
              <button className="mm-item" type="button" onClick={newHistorical}><span className="mk" /><span>{L('New historical campaign', '새 역사 캠페인')}</span></button>
              <button className="mm-item" type="button" onClick={newSandbox}><span className="mk" /><span>{L('New sandbox campaign', '새 샌드박스 캠페인')}</span></button>
              <button className="mm-item" type="button" onClick={() => go('scenarios')}><span className="mk" /><span>{L('Scenarios', '시나리오')}</span></button>
              <button className="mm-item" type="button" onClick={() => openSheet('load')}><span className="mk" /><span>{t('menuLoad')}</span></button>
              <button className="mm-item" type="button" onClick={() => go('honours')}><span className="mk" /><span>{L('Campaign archive', '캠페인 기록')}</span></button>
              <button className="mm-item" type="button" onClick={() => openSheet('settings')}><span className="mk" /><span>{t('menuSettings')}</span></button>
              <div className="mm-small">
                <button type="button" onClick={() => go('handbook')}>{L('Handbook', '길잡이')}</button>
                <button type="button" onClick={() => go('credits')}>{L('Credits', '만든 이')}</button>
              </div>
            </nav>
          </div>
        </div>
        <footer className="mm-after" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px 24px', borderTop: '1px solid rgba(176,141,87,.28)', paddingTop: 14 }}>
          <div role="group" aria-label={t('language')} style={{ display: 'flex', gap: 4 }}>
            <button className="lang" type="button" aria-pressed={lang === 'en'} onClick={() => update({ lang: 'en' })}>English</button>
            <button className="lang" type="button" lang="ko" aria-pressed={lang === 'ko'} onClick={() => update({ lang: 'ko' })}>한국어</button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted-ink)' }}>{t('menuVersion')}</p>
        </footer>
      </div>
    </main>
  );
}

import { useState } from 'react';
import { Sheet, Medallion } from '../ui/parts';
import { useUi } from '../store/ui';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';
import { useT } from '../i18n/useT';
import { listSlots, readSlot, type SlotId, type SlotView } from '../save/storage';
import { premiseOf } from '../content/campaigns';
import { SEASONS, seasonOf } from '../engine/time';
import type { Lang } from '../engine/text';
import { useL } from '../ui/kit';
import { clearErrors, environment, readErrors } from '../save/diagnostics';

/** "Historical Joseon, autumn of 1724" for a slot, without loading the whole game. */
export function slotLine(v: SlotView & { state: 'ok' }, lang: Lang): { a: string; b: string } {
  const s = v.summary;
  const season = SEASONS[seasonOf(s.moon)];
  const sea = lang === 'ko' ? season.ko ?? season.en : season.en.toLowerCase();
  const camp = s.campaign === 'historical'
    ? (lang === 'ko' ? `역사 속 조선, ${s.year}년 ${sea}` : `Historical Joseon, ${sea} of ${s.year}`)
    : (lang === 'ko' ? `또 다른 조선, ${premiseOf(s.premise as never).title.ko}` : `Alternative Joseon, ${premiseOf(s.premise as never).title.en.toLowerCase()}`);
  const place = lang === 'ko' ? s.location.ko ?? s.location.en : s.location.en;
  const when = new Date(v.savedAt);
  const stamp = when.toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return { a: camp, b: `${place}. ${stamp}` };
}

export const slotName = (slot: SlotId, t: ReturnType<typeof useT>['t']) => (slot === 'auto' ? t('autosave') : t('slot', { n: slot }));

export function LoadSheet() {
  const { t, lang } = useT();
  const close = () => useUi.getState().openSheet(null);
  const go = useUi((s) => s.go);
  const load = useGame((s) => s.load);
  const [views] = useState(() => listSlots());
  const open = (slot: SlotId) => {
    const r = readSlot(slot);
    if (!r.game) return;
    load(r.game);
    go(r.game.player.alive ? (r.game.active ? 'scene' : 'play') : 'legacy');
  };
  return (
    <Sheet title={t('menuLoad')} ko="저장된 삶" onClose={close} closeLabel={t('close')}>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, borderBottom: '1px solid var(--rule)' }}>
        {views.map((v) => (
          <li key={String(v.slot)} className="slot">
            {v.state === 'ok' ? <Medallion spec={v.summary.portrait} size={60} gone={!v.summary.alive} /> : <Medallion size={60} />}
            <div className="slot-text">
              <p style={{ fontSize: 13, color: 'var(--jaju)' }}>{slotName(v.slot, t)}</p>
              {v.state === 'ok' && (
                <>
                  <p style={{ fontSize: 19, fontWeight: 500 }}>{lang === 'ko' ? v.summary.name.ko ?? v.summary.name.en : v.summary.name.en}</p>
                  <p style={{ fontSize: 14, color: 'var(--text-paper-2)' }}>{slotLine(v, lang).a}{v.summary.generation > 1 ? `, ${t('generationN', { n: v.summary.generation })}` : ''}</p>
                  <p style={{ fontSize: 13, color: 'var(--muted-paper)' }}>{v.summary.alive ? slotLine(v, lang).b : t('ended')}</p>
                </>
              )}
              {v.state === 'empty' && <p style={{ fontSize: 17 }}>{t('emptySlot')}</p>}
              {v.state === 'unreadable' && (
                <>
                  <p style={{ fontSize: 17 }}>{t('unreadable')}</p>
                  <p style={{ fontSize: 14, color: 'var(--muted-paper)' }}>{t(v.reason === 'newer' ? 'unreadableNewer' : 'unreadableBroken')}</p>
                </>
              )}
            </div>
            {v.state === 'ok' && <button className="btn btn-wine btn-small" type="button" onClick={() => open(v.slot)}>{t('load')}</button>}
            {v.state === 'empty' && v.slot !== 'auto' && <button className="btn btn-line btn-small" type="button" onClick={() => go('campaign')}>{t('begin')}</button>}
          </li>
        ))}
      </ol>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted-paper)' }}>{t('loadNote')}</p>
    </Sheet>
  );
}

export function SettingsSheet() {
  const { t } = useT();
  const close = () => useUi.getState().openSheet(null);
  const s = useSettings();
  return (
    <Sheet title={t('settingsTitle')} ko="설정" onClose={close} closeLabel={t('close')}>
      <div role="group" aria-labelledby="set-lang">
        <p id="set-lang" className="label">{t('language')}</p>
        <div className="seg">
          <button type="button" aria-pressed={s.lang === 'en'} onClick={() => s.update({ lang: 'en' })}>English</button>
          <button type="button" lang="ko" aria-pressed={s.lang === 'ko'} onClick={() => s.update({ lang: 'ko' })}>한국어</button>
        </div>
      </div>
      <div role="group" aria-labelledby="set-speed">
        <p id="set-speed" className="label">{t('textSpeed')}</p>
        <div className="seg">
          {(['slow', 'normal', 'fast'] as const).map((k) => (
            <button key={k} type="button" aria-pressed={s.speed === k} onClick={() => s.update({ speed: k })}>{t(k)}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="set-music" style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('music')}</span><span style={{ fontWeight: 400, color: 'var(--muted-paper)' }}>{s.music}</span></label>
        <input id="set-music" type="range" min={0} max={100} value={s.music} onChange={(e) => s.update({ music: Number(e.target.value) })} />
      </div>
      <div>
        <label className="label" htmlFor="set-sfx" style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('sfx')}</span><span style={{ fontWeight: 400, color: 'var(--muted-paper)' }}>{s.sfx}</span></label>
        <input id="set-sfx" type="range" min={0} max={100} value={s.sfx} onChange={(e) => s.update({ sfx: Number(e.target.value) })} />
        <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: 'var(--muted-paper)' }}>{t('audioNote')}</p>
      </div>
      <label htmlFor="set-calm" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', color: 'var(--text-paper)' }}>
        <input id="set-calm" type="checkbox" checked={s.calm} onChange={(e) => s.update({ calm: e.target.checked })} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{t('calm')}</span>
          <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--muted-paper)' }}>{t('calmNote')}</span>
        </span>
      </label>
      <MoreSettings />
      <div><button className="btn btn-wine" type="button" onClick={close}>{t('done')}</button></div>
    </Sheet>
  );
}

/** Reading comfort, ambience and diagnostics (GSDD Part V §29, Part VI §13). */
function MoreSettings() {
  const { L } = useL();
  const s = useSettings();
  const [errors, setErrors] = useState(() => readErrors());
  const seg = <K extends string>(id: string, label: string, value: K, opts: [K, string][], on: (k: K) => void) => (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="label">{label}</p>
      <div className="seg">{opts.map(([k, name]) => <button key={k} type="button" aria-pressed={value === k} onClick={() => on(k)}>{name}</button>)}</div>
    </div>
  );
  const check = (id: string, label: string, note: string, value: boolean, on: (v: boolean) => void) => (
    <label htmlFor={id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', color: 'var(--text-paper)' }}>
      <input id={id} type="checkbox" checked={value} onChange={(e) => on(e.target.checked)} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--muted-paper)' }}>{note}</span>
      </span>
    </label>
  );
  return (
    <>
      {seg('set-text', L('Text size', '글자 크기'), s.textSize, [['normal', L('Normal', '보통')], ['large', L('Large', '크게')], ['larger', L('Larger', '더 크게')]], (textSize) => s.update({ textSize }))}
      <div role="group" aria-labelledby="set-theme">
        <p id="set-theme" className="label">{L('Theme', '테마')}</p>
        <div className="theme-pick">
          {([['hanji', L('Ink & Hanji', '먹과 한지'), '#EDE3CC', '#6B1626', '#1B1513'], ['dancheong', L('Dancheong', '단청'), '#F1E4C6', '#B3262E', '#1F4E46'], ['celadon', L('Celadon', '청자'), '#E4EBDD', '#2F5E55', '#22343A'], ['night', L('Lantern night', '등불의 밤'), '#2A2320', '#C9A86A', '#120E10']] as const).map(([id, name, a, b, c]) => (
            <button key={id} type="button" className="theme-chip" aria-pressed={s.theme === id} onClick={() => s.update({ theme: id })}>
              <span className="theme-sw" style={{ background: `linear-gradient(135deg, ${a} 0 50%, ${b} 50% 75%, ${c} 75%)` }} />{name}
            </button>
          ))}
        </div>
      </div>
      {check('set-contrast', L('High contrast', '고대비'), L('Darker text and stronger lines on paper; brighter text on ink.', '종이 위 글씨와 선을 더 진하게, 먹색 위 글씨를 더 밝게.'), s.contrast, (contrast) => s.update({ contrast }))}
      {check('set-tips', L('Tips', '도움말'), L('Short hints the first time you open each part of the game.', '게임의 각 부분을 처음 열 때 짧은 도움말을 보여 준다.'), s.tips, (tips) => s.update({ tips }))}
      <div>
        <label className="label" htmlFor="set-amb" style={{ display: 'flex', justifyContent: 'space-between' }}><span>{L('Ambience', '주변음')}</span><span style={{ fontWeight: 400, color: 'var(--muted-paper)' }}>{s.ambience}</span></label>
        <input id="set-amb" type="range" min={0} max={100} value={s.ambience} onChange={(e) => s.update({ ambience: Number(e.target.value) })} />
        <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: 'var(--muted-paper)' }}>{L('Wind, birds, insects and rain, with the season and the weather.', '철과 날씨에 따라 바람, 새, 풀벌레, 빗소리.')}</p>
      </div>
      <details className="diag">
        <summary>{L('Diagnostics', '진단 정보')}</summary>
        <p className="kit-note">{L('Kept only in this browser. Nothing is sent anywhere.', '이 브라우저에만 보관하며 어디로도 보내지 않는다.')}</p>
        <p className="kit-sub" style={{ wordBreak: 'break-word' }}>{environment()}</p>
        <ol className="diag-log">
          {errors.slice().reverse().map((e, i) => <li key={i}><span className="kit-sub">{e.at}</span> {e.message}</li>)}
          {errors.length === 0 && <li className="kit-note">{L('No errors recorded.', '기록된 오류가 없다.')}</li>}
        </ol>
        {errors.length > 0 && <button className="btn btn-line btn-small" type="button" onClick={() => { clearErrors(); setErrors([]); }}>{L('Clear the log', '기록 지우기')}</button>}
      </details>
    </>
  );
}

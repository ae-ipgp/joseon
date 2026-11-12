import { useEffect, useRef, useState } from 'react';
import { ChevronRight, History } from 'lucide-react';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';
import { useT } from '../i18n/useT';
import { PlaceScene } from '../scenes/PlaceScene';
import { Atmosphere, airFor } from '../ui/Atmosphere';
import { Portrait } from '../ui/Portrait';
import { Modal, Seal } from '../ui/parts';
import { placeById } from '../content/places';
import { activeEvent, openChoices, visibleLines } from '../engine/events';
import { seasonOf } from '../engine/time';
import { npcPortrait, playerName } from '../engine/world';
import { placeName } from './PlayScreen';
import { CONFIDENCE } from '../content/monarchs';
import type { Choice, Line } from '../model/content';
import type { Text } from '../model/schemas';

type Phase = 'lines' | 'choose' | 'say' | 'react' | 'result';
const SPEED = { slow: 26, normal: 13, fast: 0 } as const;

/** Reveals a line letter by letter; a click shows the rest at once. */
function useTypewriter(text: string, key: string) {
  const speed = useSettings((s) => s.speed);
  const calm = useSettings((s) => s.calm);
  const ms = calm ? 0 : SPEED[speed];
  const [n, setN] = useState(ms ? 0 : text.length);
  useEffect(() => {
    if (!ms) { setN(text.length); return; }
    setN(0);
    const id = setInterval(() => setN((v) => { if (v >= text.length) { clearInterval(id); return v; } return v + 1; }), ms);
    return () => clearInterval(id);
  }, [key, text, ms]);
  return { shown: text.slice(0, n), done: n >= text.length, finish: () => setN(text.length) };
}

const tone = (s: string) => (/−\d/.test(s) ? 'down' : /\+\d/.test(s) ? 'up' : '');

export function SceneScreen() {
  const { t, tx, pk, nm, lang } = useT();
  const g = useGame((s) => s.game)!;
  const result = useGame((s) => s.sceneResult);
  const choose = useGame((s) => s.choose);
  const finishScene = useGame((s) => s.finishScene);
  const e = activeEvent(g);
  const [phase, setPhase] = useState<Phase>('lines');
  const [i, setI] = useState(0);
  const [stamping, setStamping] = useState<string | null>(null);
  const [picked, setPicked] = useState<Choice | null>(null);
  const [log, setLog] = useState<{ who: string; text: string }[]>([]);
  const [showLog, setShowLog] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const lines = e ? visibleLines(g, e.lines) : [];
  const choices = e ? openChoices(g, e) : [];
  const prompt: Line = e?.prompt ?? { who: 'narr', text: { en: 'What will you do?', ko: '어떻게 하겠는가?' } };
  const reaction = picked ? visibleLines(g, picked.reaction) : [];

  // Skip straight to the choice when a scene has no lines left to read.
  const effPhase: Phase = phase === 'lines' && i >= lines.length ? 'choose' : phase;
  let line: Line | null = null;
  if (effPhase === 'lines') line = lines[i];
  else if (effPhase === 'choose') line = prompt;
  else if (effPhase === 'say' && picked) line = { who: 'player', text: picked.say };
  else if ((effPhase === 'react' || effPhase === 'result') && reaction.length) line = reaction[Math.min(i, reaction.length - 1)];

  const lineText = line ? tx(line.text) : '';
  const tw = useTypewriter(lineText, `${effPhase}-${i}-${picked?.id ?? ''}`);
  // Behind the result card the last line is shown whole.
  const shown = effPhase === 'result' ? lineText : tw.shown;
  if (!e) return null;

  const speaker = (who: string) => (who === 'narr' ? t('narration') : who === 'player' ? tx(playerName(g)) : g.npcs[who] ? tx(g.npcs[who].name) : who);
  const remember = (l: Line | null) => { if (l) setLog((x) => [...x, { who: speaker(l.who), text: tx(l.text) }, ...(l.aside ? [{ who: t('narration'), text: tx(l.aside) }] : [])]); };

  const advance = () => {
    if (!tw.done) { tw.finish(); return; }
    remember(line);
    if (effPhase === 'lines') { setI(i + 1); return; }
    if (effPhase === 'say') { setI(0); setPhase(reaction.length ? 'react' : 'result'); return; }
    if (effPhase === 'react') {
      if (i < reaction.length - 1) { setI(i + 1); return; }
      if (picked?.again) {
        useGame.setState({ sceneResult: null });
        setPicked(null); setStamping(null); setI(0); setPhase('choose');
      } else setPhase('result');
    }
  };

  const pick = (c: Choice) => {
    if (stamping) return;
    remember(prompt);
    setStamping(c.id);
    const calm = useSettings.getState().calm;
    timer.current = setTimeout(() => {
      const r = choose(c.id);
      if (!r.ok) { setStamping(null); return; }
      setPicked(c); setI(0); setPhase('say');
    }, calm ? 0 : 700);
  };

  const cast = e.cast !== 'narr' && g.npcs[e.cast]?.alive ? g.npcs[e.cast] : null;
  const place = placeById(e.place);
  const noChoices = effPhase === 'choose' && choices.length === 0;
  const canContinue = effPhase === 'lines' || effPhase === 'say' || effPhase === 'react' || noChoices;
  const total = lines.length;
  const progress = effPhase === 'lines' ? t('lineOf', { a: i + 1, b: total }) : effPhase === 'choose' && !noChoices ? t('choose') : '';
  const plate = line && line.who !== 'narr';
  const isMe = line?.who === 'player';
  const whoNpc = line && !isMe && line.who !== 'narr' ? g.npcs[line.who] : undefined;

  return (
    <main className="ink-screen" style={{ overflow: 'hidden', background: '#08090F' }}>
      <PlaceScene kind={place.scene} time={e.time} season={seasonOf(g.date.moon)} />
      <Atmosphere air={airFor(seasonOf(g.date.moon), e.time === 'night', g.econ.provinces.hanseong?.weather)} strength={0.7} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,5,8,.6) 0%, rgba(6,5,8,0) 22%, rgba(6,5,8,0) 46%, rgba(6,5,8,.78) 100%)' }} />
      {cast && (
        <div className="dl-kang-wrap" style={{ position: 'absolute', right: 'clamp(0px, 7vw, 140px)', bottom: 0, width: 'min(540px, 42vw)' }}>
          <div className="dl-kang" key={cast.id}><Portrait spec={npcPortrait(g, cast)} style={{ width: '100%', height: 'auto' }} /></div>
        </div>
      )}

      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '16px clamp(16px, 3vw, 32px)', background: 'rgba(8,6,8,.72)', borderBottom: '1px solid rgba(201,168,106,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 16, color: 'var(--text-ink)' }}>{tx(e.title)}</p>
          <p className="ko" lang="ko" style={{ fontSize: 16, color: 'var(--gold-light)' }}>{lang === 'ko' ? tx(placeName(g, e.place)) : e.title.ko}</p>
          <span className={'basis' + (e.basis ? ' hist' : '')} title={e.basis ? (lang === 'ko' ? '기록된 상황을 바탕으로 장면을 재구성했다.' : 'A documented situation; the scene itself is a reconstruction.') : undefined}>
            {e.basis
              ? `${lang === 'ko' ? '역사 속 상황' : 'Historical setting'} · ${tx(CONFIDENCE[e.basis])}`
              : g.campaign.mode === 'alternative' ? (lang === 'ko' ? '대체 역사' : 'Alternative history') : (lang === 'ko' ? '허구의 이야기' : 'Fictional story')}
          </span>
        </div>
        <button className="hud-btn" type="button" aria-expanded={showLog} onClick={() => setShowLog(!showLog)}><History size={18} strokeWidth={1.6} />{t('history')}</button>
      </header>

      {showLog && (
        <aside aria-label={t('saidSoFar')} style={{ position: 'absolute', zIndex: 4, top: 77, right: 0, bottom: 0, width: 'min(420px, 100%)', overflow: 'auto', padding: '24px 28px', background: 'rgba(12,9,10,.96)', borderLeft: '1px solid rgba(201,168,106,.3)' }}>
          <h2 style={{ marginBottom: 14, fontSize: 20, fontWeight: 400 }}>{t('saidSoFar')}</h2>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...log, ...(line ? [{ who: speaker(line.who), text: lineText }] : [])].map((l, k) => (
              <li key={k} style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 12, borderTop: '1px solid rgba(201,168,106,.2)' }}>
                <span style={{ fontSize: 13, color: 'var(--gold-light)' }}>{l.who}</span>
                <span style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-ink-2)' }}>{l.text}</span>
              </li>
            ))}
          </ol>
        </aside>
      )}

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2, padding: '0 clamp(14px, 3vw, 32px) clamp(16px, 3vh, 32px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 34 }}>
          {effPhase === 'choose' && !noChoices && tw.done && (
            <div className="choices" role="group" aria-label={t('choose')} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
              {choices.map((c) => (
                <button key={c.id} className="choice" type="button" data-sfx="stamp" data-picked={stamping === c.id} data-dim={!!stamping && stamping !== c.id} disabled={!!stamping} onClick={() => pick(c)}>
                  <span style={{ fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.45 }}>{tx(c.label)}</span>
                  {c.tags.length > 0 && <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{c.tags.map((tg, k) => <span key={k} className="tag">{tx(tg)}</span>)}</span>}
                  {stamping === c.id && <Seal text="결" stamp tilt={-8} />}
                </button>
              ))}
            </div>
          )}

          <section className="dbox" aria-live="polite" aria-label={t('dialogue')} onClick={() => { if (!tw.done) tw.finish(); }}>
            {plate && (
              <p className={'plate' + (isMe ? ' me' : '')}>
                <span className="ko" lang="ko" style={{ fontSize: 19, color: isMe ? 'var(--gold-light)' : undefined }}>{isMe ? playerName(g).ko : whoNpc?.name.ko}</span>
                {/* In Korean the name is already in hangul, so the plate adds only the role. */}
                {lang === 'ko'
                  ? !isMe && whoNpc && <span style={{ fontSize: 15 }}>{tx(whoNpc.role)}</span>
                  : <span style={{ fontSize: 15 }}>{isMe ? tx(playerName(g)) : whoNpc ? `${tx(whoNpc.name)}, ${tx(whoNpc.role)}` : ''}</span>}
              </p>
            )}
            {line && line.who === 'narr'
              ? <p style={{ fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.7, fontStyle: 'italic', fontWeight: 300, color: '#D9CCB0', maxWidth: '64ch', minHeight: '1.7em' }}>{shown}</p>
              : <p style={{ fontSize: 'clamp(19px, 1.7vw, 23px)', lineHeight: 1.65, color: 'var(--text-ink)', maxWidth: '62ch', minHeight: '1.65em' }}>{shown}</p>}
            {line?.aside && tw.done && <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.65, fontStyle: 'italic', fontWeight: 300, color: '#C9B48E', maxWidth: '64ch' }}>{tx(line.aside)}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16, minHeight: 44 }}>
              <p style={{ fontSize: 13, color: 'var(--muted-ink)' }}>{progress}</p>
              {canContinue && (
                <button className="cont" type="button" onClick={(ev) => { ev.stopPropagation(); if (noChoices) finishScene(); else advance(); }}>
                  {t('continue')}<ChevronRight size={16} strokeWidth={1.6} />
                </button>
              )}
            </div>
          </section>
        </div>
      </div>

      {effPhase === 'result' && result && <ResultCard notes={result.notes} title={result.choice.title ?? null} placeLabel={nm(placeName(g, g.place))} alive={g.player.alive} onClose={finishScene} pk={pk} tx={tx} t={t} />}
    </main>
  );
}

function ResultCard({ notes, title, placeLabel, alive, onClose, tx, t }: {
  notes: Text[]; title: Text | null; placeLabel: string; alive: boolean; onClose: () => void;
  tx: (x: Text | null | undefined) => string; pk: (x: Text | null | undefined) => string; t: ReturnType<typeof useT>['t'];
}) {
  return (
    <Modal labelledBy="res-h" className="decree paper">
      <span style={{ position: 'absolute', right: 28, top: -18 }}><Seal text="결" size={58} stamp /></span>
      <p className="ko echo" lang="ko" style={{ fontSize: 18, color: 'var(--jaju)' }}>{title?.ko ?? '결정'}</p>
      <h2 id="res-h" style={{ marginTop: 6, fontSize: 32, fontWeight: 300, lineHeight: 1.15 }}>{title ? tx(title) : t('resultTitle')}</h2>
      <ul style={{ listStyle: 'none', margin: '22px 0 0', padding: 0 }}>
        {notes.length === 0 && <li style={{ padding: '12px 0', borderTop: '1px solid var(--rule)', fontSize: 16 }}>{t('nothingChanged')}</li>}
        {notes.map((n, k) => {
          const s = tx(n);
          const m = s.match(/^(.*?)\s([+−]\d+)$/);
          return (
            <li key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, padding: '12px 0', borderTop: '1px solid var(--rule)', fontSize: 16, lineHeight: 1.5 }}>
              <span>{m ? m[1] : s}</span>
              {m && <span className={tone(m[2])} style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{m[2]}</span>}
            </li>
          );
        })}
      </ul>
      <p style={{ marginTop: 14, fontSize: 14, color: 'var(--muted-paper)' }}>{t('savedAfterDecision')}</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
        <button className="btn btn-wine" type="button" onClick={onClose}>{alive ? t('returnTo', { place: placeLabel }) : t('seeEnding')}</button>
      </div>
    </Modal>
  );
}

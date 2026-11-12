import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Award, Bell, ClipboardList, Flower2, HeartPulse, Clock, Coins, Gift, Hourglass, House, Landmark, Map as MapIcon, Menu, Moon, Repeat, Save, ScrollText, User, Users } from 'lucide-react';
import { unread } from '../engine/bus';
import { playerAge } from '../engine/time';
import { emotionOf, faceFor, faceOf, healthWarning } from '../engine/life';
import { EMOTIONS } from '../content/life';
import { missionDef } from '../engine/missions';
import { DIM_NAMES, INTERACTIONS, dimOf, interact, interactBar, tieOf } from '../engine/social';
import { followRoutine, setRoutine } from '../engine/routine';
import { useAct } from '../ui/kit';
import { Tip } from '../ui/Tip';
import { useSettings } from '../store/settings';
import { spendable } from '../engine/money';
import { stageName } from '../engine/character';
import { officeTitle, royalTitle } from '../engine/politics';
import { useUi } from '../store/ui';
import { useGame } from '../store/game';
import { useT } from '../i18n/useT';
import { PlaceScene } from '../scenes/PlaceScene';
import { Atmosphere, airFor } from '../ui/Atmosphere';
import { SceneLife } from '../ui/SceneLife';
import { Medallion, Modal, Seal } from '../ui/parts';
import { placeById } from '../content/places';
import { eventById } from '../content/events';
import { familyOf } from '../content/families';
import { STATUS_NAMES, giftName } from '../content/lists';
import { activitiesAt, activityCost, canAct, canGift } from '../engine/day';
import { formatMoney, wealthBar } from '../engine/money';
import { Coin } from '../ui/Wealth';
import { sfx } from '../audio/sound';
import { canPass } from '../engine/season';
import { PHASES, PHASE_NAMES, dateLine, seasonOf, yearLine } from '../engine/time';
import { npcPortrait, peopleAt, playerName, playerPortrait, statusOf } from '../engine/world';
import { usesGyeongbokgung } from '../engine/time';
import type { Game, Text } from '../model/schemas';

export function placeName(g: Game, id: string): Text {
  const p = placeById(id);
  return usesGyeongbokgung(g) && p.gbg ? p.gbg.name : p.name;
}
export function placeArea(g: Game, id: string): Text {
  const p = placeById(id);
  return usesGyeongbokgung(g) && p.gbg ? p.gbg.area : p.area;
}

/** True on phone-width screens, where the scene is cropped and people stand closer together. */
function useNarrow() {
  const q = '(max-width: 600px)';
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setNarrow(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return narrow;
}

/** Year, date and the three parts of the day. */
export function CalendarBadge({ g }: { g: Game }) {
  const { t, tx, pk } = useT();
  const i = PHASES.indexOf(g.date.phase);
  return (
    <div className="raised cal" style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ fontSize: 13, color: 'var(--gold-light)' }}>{tx(yearLine(g))}</p>
      <p style={{ fontSize: 19, color: 'var(--text-ink)' }}>{tx(dateLine(g.date))}</p>
      <ol aria-label={t('timeOfDay')} style={{ listStyle: 'none', margin: '4px 0 0', padding: 0, display: 'flex', gap: 14 }}>
        {PHASES.map((p, k) => (
          <li key={p} className={'phase' + (k < i ? ' past' : '')} aria-current={k === i ? 'true' : undefined}><span className="d" />{pk(PHASE_NAMES[p])}</li>
        ))}
      </ol>
    </div>
  );
}

function LetterModal({ g }: { g: Game }) {
  const { t, tx } = useT();
  const read = useGame((s) => s.read);
  const toast = useUi((s) => s.showToast);
  const e = g.letter ? eventById(g.letter) : undefined;
  if (!e?.letter) return null;
  const L = e.letter;
  const act = (go: boolean) => {
    const r = read(go);
    const msg = [r.text ? tx(r.text) : '', ...r.notes.map(tx)].filter(Boolean).join(' ');
    if (msg) toast(msg);
  };
  return (
    <Modal labelledBy="letter-h">
      <p className="ko" lang="ko" style={{ fontSize: 18, color: 'var(--jaju)' }}>{L.seal}</p>
      <h2 id="letter-h" style={{ marginTop: 6, fontSize: 32, fontWeight: 300, lineHeight: 1.15 }}>{tx(e.title)}</h2>
      <p style={{ marginTop: 16, fontSize: 17, lineHeight: 1.7, color: 'var(--text-paper-2)' }}>{tx(L.intro)}</p>
      <div style={{ position: 'relative', margin: '22px 0 0', padding: '22px 76px 22px 24px', background: 'var(--hanji-inset)', border: '1px solid var(--rule)' }}>
        <p style={{ fontSize: 21, fontWeight: 300, lineHeight: 1.55 }}>{tx(L.body)}</p>
        <span style={{ position: 'absolute', right: 18, top: '50%', marginTop: -21 }}><Seal text={L.seal.slice(0, 1)} size={42} tilt={-7} label={t('letterFrom', { seal: L.seal })} /></span>
      </div>
      {L.note && <p style={{ marginTop: 14, fontSize: 14, color: 'var(--muted-paper)' }}>{tx(L.note)}</p>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
        <button className="btn btn-wine" type="button" data-sfx="paper" onClick={() => act(true)}>{tx(L.go)}</button>
        {L.decline && <button className="btn btn-line" type="button" onClick={() => act(false)}>{tx(L.decline)}</button>}
      </div>
    </Modal>
  );
}

function ReportModal({ g }: { g: Game }) {
  const { t, tx } = useT();
  const close = useGame((s) => s.closeReport);
  if (!g.report) return null;
  const r = g.report;
  return (
    <Modal labelledBy="report-h" className="decree paper">
      <p className="ko" lang="ko" style={{ fontSize: 18, color: 'var(--jaju)' }}>세월</p>
      <h2 id="report-h" style={{ marginTop: 6, fontSize: 30, fontWeight: 300, lineHeight: 1.2 }}>{tx(r.title)}</h2>
      <ul style={{ listStyle: 'none', margin: '20px 0 0', padding: 0, maxHeight: '52vh', overflow: 'auto' }}>
        {r.entries.length === 0 && <li style={{ padding: '12px 0', borderTop: '1px solid var(--rule)', fontSize: 16, lineHeight: 1.6 }}>{t('quietSeason')}</li>}
        {r.entries.map((e, i) => (
          <li key={i} style={{ padding: '11px 0', borderTop: '1px solid var(--rule)', fontSize: 16, lineHeight: 1.6 }}>{tx(e)}</li>
        ))}
      </ul>
      <div style={{ marginTop: 24 }}>
        <button className="btn btn-wine" type="button" onClick={close}>{g.player.alive ? t('goOn') : t('seeEnding')}</button>
      </div>
    </Modal>
  );
}

export function PlayScreen() {
  const { t, tx, pk, lang } = useT();
  const g = useGame((s) => s.game)!;
  const narrow = useNarrow();
  const [rawVw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1440));
  const act = useGame((s) => s.act);
  const skip = useGame((s) => s.skip);
  const rest = useGame((s) => s.rest);
  const pass = useGame((s) => s.pass);
  const talk = useGame((s) => s.talk);
  const gift = useGame((s) => s.gift);
  const go = useUi((s) => s.go);
  const toast = useUi((s) => s.showToast);
  const setFocus = useUi((s) => s.setFocusNpc);
  const goMatters = useUi((s) => s.goMatters);
  const run = useAct();
  const apply = useGame((s) => s.apply);
  const zoom = useSettings((s) => (s.textSize === 'larger' ? 1.2 : s.textSize === 'large' ? 1.1 : 1));
  const [more, setMore] = useState(false);
  const [plan, setPlan] = useState<{ morning: string; afternoon: string }>({ morning: '', afternoon: '' });
  const [sel, setSel] = useState<string | null>(null);
  const [giving, setGiving] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const [popPos, setPopPos] = useState<{ left: number; top: number } | null>(null);

  const vw = rawVw / zoom;
  const place = placeById(g.place);
  const bell = unread(g);
  const openM = g.missions.filter((m) => m.status === 'open').sort((a, b) => a.due - b.due);
  const firstM = openM[0];
  const firstDef = firstM ? missionDef(firstM.def) : undefined;
  const routine = g.routine;
  const followDays = (days: number) => {
    const note = apply((x) => { const r = followRoutine(x, days); return { game: r.game, note: r.note }; }, true);
    if (note) toast(tx(note));
  };
  const evening = g.date.phase === 'evening';
  const people = peopleAt(g, g.place, narrow || vw < 1250 ? 3 : 4);
  // On a wide screen people stand evenly in the open ground between the rail and the activity panel, in the order of their places in the scene.
  const order = people.map((_n, i) => ({ i, x: (place.slots[i] ?? { x: 30 + i * 20 }).x })).sort((a, b) => a.x - b.x).map((o) => o.i);
  const selNpc = sel ? people.find((n) => n.id === sel) ?? null : null;
  const acts = activitiesAt(g, g.place);
  const phaseWord = pk(PHASE_NAMES[g.date.phase]).toLowerCase();
  const busy = !!(g.active || g.letter || g.report);
  const fam = familyOf(g.house.background);
  const woman = g.player.gender === 'woman';

  const doAct = (id: string) => {
    const r = act(id);
    if (!r.ok) return;
    sfx(r.notes.some((n) => /nyang$/.test(n.en) && n.en.startsWith('+')) ? 'coin' : 'pluck');
    const msg = [r.text ? tx(r.text) : '', r.notes.map(tx).join(', ')].filter(Boolean).join(' ');
    if (msg) toast(msg);
    setSel(null);
  };
  const doTalk = (id: string) => {
    const r = talk(id);
    if (r.text) toast(tx(r.text));
  };
  const doGift = (id: string, giftId: string) => {
    const r = gift(id, giftId);
    if (r.text) toast(tx(r.text));
    setGiving(false);
  };

  // The card for the person in focus sits below them, or above, or beside them: wherever it fits on screen.
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  useLayoutEffect(() => {
    if (!selNpc || narrow) { if (popPos) setPopPos(null); return; }
    const stage = stageRef.current;
    const pop = popRef.current;
    const anchor = stage?.querySelector<HTMLElement>(`[data-npc="${selNpc.id}"] .med`);
    if (!stage || !pop || !anchor) return;
    const S = stage.getBoundingClientRect();
    const A = anchor.getBoundingClientRect();
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const pad = 12;
    const topLimit = 84;
    const bottom = Math.min(S.height, window.innerHeight - S.top) - pad;
    const ax = A.left - S.left;
    const ay = A.top - S.top;
    let top = ay + A.height + 40;
    let left = ax + A.width / 2 - w / 2;
    if (top + h > bottom) {
      const above = ay - 12 - h;
      if (above >= topLimit) top = above;
      else {
        top = Math.max(topLimit, Math.min(bottom - h, ay + A.height / 2 - h / 2));
        left = ax + A.width + 16 + w < S.width - pad ? ax + A.width + 16 : ax - 16 - w;
      }
    }
    left = Math.max(pad, Math.min(S.width - w - pad, left));
    top = Math.max(pad, top);
    if (!popPos || Math.abs(popPos.left - left) > 0.5 || Math.abs(popPos.top - top) > 0.5) setPopPos({ left, top });
  });
  useEffect(() => {
    if (!sel) return;
    const away = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.('.pop') || el?.closest?.('.npc-btn')) return;
      setSel(null);
      setGiving(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSel(null); setGiving(false); } };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [sel]);

  return (
    <main className="ink-screen">
      <div className="gp-stage" ref={stageRef} onMouseMove={(e) => {
        // A slight parallax: the scene leans a few pixels against the pointer.
        const el = stageRef.current as HTMLElement | null;
        if (!el) return;
        el.style.setProperty('--px', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        el.style.setProperty('--py', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      }}>
        <div className="scene-fade" key={`${place.scene}-${evening ? 'n' : 'd'}-${seasonOf(g.date.moon)}`}><PlaceScene kind={place.scene} time={evening ? 'night' : 'day'} season={seasonOf(g.date.moon)} /></div>
        <Atmosphere air={airFor(seasonOf(g.date.moon), evening, g.econ.provinces.hanseong?.weather)} />
        <SceneLife night={evening} morning={g.date.phase === 'morning'} />
        {evening && <div className="night-glow" aria-hidden="true" />}
        {evening && <div key={`${g.dayCount}-night`} className="nightfall" aria-hidden="true" />}
        <div aria-hidden="true" style={{ position: 'absolute', inset: '0 0 auto 0', height: 180, zIndex: 1, background: 'linear-gradient(180deg, rgba(14,10,10,.55), rgba(14,10,10,0))', pointerEvents: 'none' }} />

        <header className="gp-top">
          <CalendarBadge g={g} />
          <div className="gp-loc" style={{ textAlign: 'center', paddingTop: 6, textShadow: '0 2px 18px rgba(0,0,0,.7)' }}>
            <h1 style={{ fontSize: 30, fontWeight: 400, color: 'var(--text-ink)' }}>{tx(placeName(g, g.place))}</h1>
            {lang === 'ko'
              ? <p style={{ marginTop: 4, fontSize: 16, color: '#E2C98E' }}>{tx(placeArea(g, g.place))}</p>
              : <p className="ko" lang="ko" style={{ marginTop: 4, fontSize: 18, color: '#E2C98E' }}>{placeName(g, g.place).ko}</p>}
          </div>
          <div className="raised" style={{ display: 'flex' }}>
            <button className="hud-btn hud-bell" type="button" aria-label={lang === 'ko' ? `알림 ${bell}건` : `Notices, ${bell} unread`} onClick={() => goMatters('notes')}><Bell size={18} strokeWidth={1.6} />{bell > 0 && <span className="bell-n">{bell > 99 ? '99+' : bell}</span>}<span className="hud-label">{lang === 'ko' ? '알림' : 'Notices'}</span></button>
            <button className="hud-btn" type="button" aria-label={t('save')} onClick={() => go('saves')}><Save size={18} strokeWidth={1.6} /><span className="hud-label">{t('save')}</span></button>
            <button className="hud-btn" type="button" aria-label={t('menu')} onClick={() => go('menu')}><Menu size={18} strokeWidth={1.6} /><span className="hud-label">{t('menu')}</span></button>
          </div>
        </header>

        {!evening && people.map((n, i) => {
          const raw = place.slots[i] ?? { x: 30 + i * 20, y: 60 };
          // On a phone the scene is cropped to its middle, so people spread out to keep their names apart.
          const slot = narrow ? { x: Math.max(16, Math.min(84, 50 + (raw.x - 50) * 1.9 + (i - 1) * 4)), y: raw.y + (i % 2 ? 8 : 0) } : raw;
          const k = order.indexOf(i);
          const span = vw - 210 - 430;
          const left = vw > 900 ? `${210 + ((k + 0.5) * span) / people.length}px` : `${slot.x}%`;
          const open = sel === n.id;
          return (
            <div key={n.id} className="npc" data-npc={n.id} style={{ left, top: vw > 900 && 210 + ((k + 0.5) * span) / people.length < 350 ? `min(${slot.y}%, calc(100vh - 400px))` : `${slot.y}%`, zIndex: open ? 7 : 2 }}>
              <button className="npc-btn" type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => { setSel(open ? null : n.id); setGiving(false); setMore(false); setPopPos(null); }}>
                <Medallion spec={{ ...npcPortrait(g, n), expr: faceFor(g, n.id) }} size={narrow ? 52 : 72} />
                <span className="tag">{narrow ? tx(n.given ?? n.name) : tx(n.name)}</span>
              </button>
            </div>
          );
        })}
        {!evening && selNpc && (() => {
          const n = selNpc;
          const r = g.rel[n.id];
          return (
            <div ref={popRef} className="pop paper" role="dialog" aria-label={tx(n.name)}
              style={narrow ? undefined : { left: popPos?.left ?? 0, top: popPos?.top ?? 0, visibility: popPos ? 'visible' : 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <p style={{ fontSize: 19, fontWeight: 500 }}>{tx(n.name)}</p>
                <p className="ko echo" lang="ko" style={{ fontSize: 16, color: 'var(--jaju)' }}>{n.name.ko}</p>
              </div>
              <p style={{ marginTop: 2, fontSize: 14, color: 'var(--muted-paper)' }}>{tx(n.role)}</p>
              <p style={{ margin: '10px 0 2px', fontSize: 14 }}>{r.met ? t('regardN', { status: pk(STATUS_NAMES[statusOf(r)]), n: r.regard }) : t('notMetYet')}</p>
              {r.met && <p className="pop-dims">{tx(tieOf(g, n.id))} · {tx(DIM_NAMES.trust)} {dimOf(r, 'trust')} · {tx(DIM_NAMES.respect)} {dimOf(r, 'respect')}{dimOf(r, 'resentment') >= 20 ? ` · ${tx(DIM_NAMES.resentment)} ${dimOf(r, 'resentment')}` : ''}{dimOf(r, 'rivalry') >= 20 ? ` · ${tx(DIM_NAMES.rivalry)} ${dimOf(r, 'rivalry')}` : ''}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 6 }}>
                <button className="act" type="button" disabled={busy} onClick={() => doTalk(n.id)}>
                  <span className="act-t" style={{ fontSize: 16 }}>{r.met ? t('talk') : t('introduce')}</span>
                  <span className="act-meta">{t('talkMeta')}</span>
                </button>
                <button className="act" type="button" disabled={busy || !canGift(g, n.id)} aria-expanded={giving} onClick={() => setGiving(!giving)}>
                  <span className="act-t" style={{ fontSize: 16 }}>{t('giveGift')}</span>
                  <span className="act-meta"><Gift size={14} strokeWidth={1.6} />{g.player.gifts.length ? g.player.gifts.map((x) => pk(giftName(x))).join(', ') : t('noGifts')}</span>
                </button>
                {giving && (
                  <div role="group" aria-label={t('chooseGift')} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0 10px' }}>
                    {g.player.gifts.map((x, k) => (
                      <button key={x + k} className="gift" type="button" data-sfx="gift" style={{ minWidth: 0 }} onClick={() => doGift(n.id, x)}>{pk(giftName(x))}</button>
                    ))}
                  </div>
                )}
                {r.met && (
                  <button className="act" type="button" aria-expanded={more} onClick={() => setMore(!more)}>
                    <span className="act-t" style={{ fontSize: 16 }}>{lang === 'ko' ? '다른 일' : 'More'}</span>
                    <span className="act-meta">{lang === 'ko' ? '칭찬, 논쟁, 부탁, 초대, 사과, 맞서기, 동맹' : 'Compliment, debate, ask, invite, apologise, challenge, ally'}</span>
                  </button>
                )}
                {r.met && more && (
                  <div className="ix-grid" role="group" aria-label={lang === 'ko' ? '다른 일' : 'More'}>
                    {INTERACTIONS.map((ix) => {
                      const why = interactBar(g, n.id, ix.id);
                      return <button key={ix.id} type="button" className="ix" disabled={!!why} title={why ? tx(why) : tx(ix.hint)} onClick={() => { run((x) => interact(x, n.id, ix.id)); setMore(false); }}>{tx(ix.label)}</button>;
                    })}
                  </div>
                )}
              </div>
              {r.met && <button className="link-paper" type="button" onClick={() => { setFocus(n.id); go('people'); }}>{t('seeHistory', { name: tx(n.given ?? n.name) })}</button>}
            </div>
          );
        })()}
      </div>

      <nav className="gp-rail raised" aria-label={t('game')}>
        <button className="rail" type="button" onClick={() => go('map')}><MapIcon size={22} strokeWidth={1.6} />{t('map')}</button>
        <button className="rail" type="button" onClick={() => go('profile')}><User size={22} strokeWidth={1.6} />{t('profile')}</button>
        <button className="rail" type="button" onClick={() => go('people')}><Users size={22} strokeWidth={1.6} />{t('people')}</button>
        <button className="rail" type="button" onClick={() => go('family')}><House size={22} strokeWidth={1.6} />{t('family')}</button>
        <button className="rail" type="button" onClick={() => go('honours')}><Award size={22} strokeWidth={1.6} />{t('achievementsShort')}</button>
        <button className="rail" type="button" onClick={() => go('affairs')}><Landmark size={22} strokeWidth={1.6} />{lang === 'ko' ? '조정' : 'Court'}</button>
        <button className="rail" type="button" onClick={() => go('estate')}><Coins size={22} strokeWidth={1.6} />{lang === 'ko' ? '살림' : 'Wealth'}</button>
        <button className="rail" type="button" onClick={() => go('archive')}><ScrollText size={22} strokeWidth={1.6} />{lang === 'ko' ? '사록' : 'Archive'}</button>
        <button className="rail" type="button" onClick={() => go('life')}><HeartPulse size={22} strokeWidth={1.6} />{lang === 'ko' ? '취미·건강' : 'Pastimes'}{g.player.conditions.length > 0 && <span className="rail-n">{g.player.conditions.length}</span>}</button>
        <button className="rail" type="button" onClick={() => go('culture')}><Flower2 size={22} strokeWidth={1.6} />{lang === 'ko' ? '풍류' : 'Culture'}</button>
        <button className="rail" type="button" onClick={() => goMatters('missions')}><ClipboardList size={22} strokeWidth={1.6} />{lang === 'ko' ? '과업' : 'Matters'}{openM.length > 0 && <span className="rail-n">{openM.length}</span>}</button>
      </nav>

      <aside className="gp-side paper" aria-labelledby="gp-act-h" style={{ padding: '22px 24px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <h2 id="gp-act-h" style={{ fontSize: 22, fontWeight: 400 }}>{t(evening ? 'nowEvening' : g.date.phase === 'morning' ? 'nowMorning' : 'nowAfternoon')}</h2>
          <p className="ko" lang="ko" style={{ fontSize: 16, color: 'var(--jaju)' }}>할 일</p>
        </div>
        <p style={{ margin: '6px 0 8px', fontSize: 14, lineHeight: 1.55, color: 'var(--muted-paper)' }}>{evening ? t('eveningNote') : t('actNote', { phase: phaseWord })}</p>
        {firstM && firstDef && (
          <button type="button" className="matter-chip" onClick={() => goMatters('missions')}>
            <span className="kit-sub">{lang === 'ko' ? `처리할 일 ${openM.length}건 · ${Math.max(0, firstM.due - g.dayCount)}일 남음` : `${openM.length} matter${openM.length === 1 ? '' : 's'} in hand · ${Math.max(0, firstM.due - g.dayCount)} days left`}</span>
            <span>{tx(firstDef.title(g, firstM))}</span>
          </button>
        )}
        {!evening && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {acts.map((a) => {
              const done = g.done.includes(a.id);
              const cost = activityCost(a);
              const short = cost > spendable(g);
              const waiting = a.effects.some((e) => e.kind === 'invest') && (g.counts['invest-pending'] ?? 0) > 0;
              return (
                <button key={a.id} className="act" type="button" data-sfx="none" disabled={!canAct(g, a)} onClick={() => doAct(a.id)}>
                  <span className="act-t">{tx(a.title)}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-paper-2)' }}>{tx(a.text)}</span>
                  <span className="act-meta">
                    <Clock size={14} strokeWidth={1.6} />{done ? t('doneToday') : waiting ? t('shipAtSea') : t('takes', { phase: phaseWord })}
                    {cost > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 10, color: short ? 'var(--seal)' : undefined }}><Coin size={13} />{short ? t('cantAfford', { cost: formatMoney(cost, lang) }) : formatMoney(cost, lang)}</span>}
                  </span>
                </button>
              );
            })}
            {people.length === 0 && <p style={{ padding: '12px 0 4px', fontSize: 14, color: 'var(--muted-paper)', borderTop: '1px solid var(--rule)' }}>{t('noOneHere')}</p>}
            <button className="act" type="button" disabled={busy} onClick={skip} style={{ borderBottom: '1px solid var(--rule)' }}>
              <span className="act-t" style={{ fontSize: 15 }}>{t('letPass', { phase: phaseWord })}</span>
            </button>
          </div>
        )}
        {evening && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ padding: '12px 0 4px', fontSize: 14, color: 'var(--muted-paper)', borderTop: '1px solid var(--rule)' }}>{t('nightNoOne')}</p>
            <button className="act" type="button" disabled={busy} onClick={rest} style={{ borderBottom: '1px solid var(--rule)' }}>
              <span className="act-t"><Moon size={16} strokeWidth={1.6} style={{ verticalAlign: '-2px', marginRight: 8 }} />{t('rest')}</span>
            </button>
          </div>
        )}
        <details className="routine" open={!!routine}>
          <summary><Repeat size={15} strokeWidth={1.6} />{lang === 'ko' ? '하루 일과' : 'Daily routine'}</summary>
          {routine ? (
            <>
              <p className="kit-sub">{tx(placeName(g, routine.place))}: {[routine.morning, routine.afternoon].map((id) => (id ? tx(activitiesAt(g, routine.place).find((a) => a.id === id)?.title ?? { en: '—' }) : '—')).join(' · ')}</p>
              <div className="routine-btns">
                <button className="btn btn-line btn-small" type="button" disabled={busy || evening} onClick={() => followDays(1)}>{lang === 'ko' ? '오늘 따르기' : 'Follow today'}</button>
                <button className="btn btn-line btn-small" type="button" disabled={busy || evening} onClick={() => followDays(6)}>{lang === 'ko' ? '엿새 따르기' : 'Follow 6 days'}</button>
                <button className="btn-text" type="button" onClick={() => run((x) => setRoutine(x, null), 'paper')}>{lang === 'ko' ? '지우기' : 'Clear'}</button>
              </div>
            </>
          ) : (
            <>
              <p className="kit-sub">{lang === 'ko' ? '여기서 할 일을 정해 두면 날마다 그대로 할 수 있다.' : 'Choose what you do here each day, then follow it day after day.'}</p>
              <div className="routine-form">
                {(['morning', 'afternoon'] as const).map((ph) => (
                  <label key={ph}>{pk(PHASE_NAMES[ph])}
                    <select className="kit-select" value={plan[ph]} onChange={(e) => setPlan({ ...plan, [ph]: e.currentTarget.value })}>
                      <option value="">{lang === 'ko' ? '쉬기' : 'Rest'}</option>
                      {acts.map((a) => <option key={a.id} value={a.id}>{tx(a.title)}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <button className="btn btn-line btn-small" type="button" disabled={!plan.morning && !plan.afternoon} onClick={() => run((x) => setRoutine(x, { place: g.place, morning: plan.morning || null, afternoon: plan.afternoon || null, evening: null }), 'paper')}>{lang === 'ko' ? '이곳의 일과로 정하기' : 'Make this my routine here'}</button>
            </>
          )}
        </details>
        <div style={{ marginTop: 18 }}>
          <p style={{ fontSize: 15, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}><Hourglass size={16} strokeWidth={1.6} />{t('timeTitle')}</p>
          <p style={{ margin: '4px 0 8px', fontSize: 13, lineHeight: 1.5, color: 'var(--muted-paper)' }}>{t('timeNote')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            <button className="btn btn-line btn-small btn-time" type="button" aria-label={t('passSeasonLong')} disabled={!canPass(g)} data-sfx="drum" onClick={() => pass(1)}>{t('passSeason')}</button>
            <button className="btn btn-line btn-small btn-time" type="button" aria-label={t('passYearLong')} disabled={!canPass(g)} data-sfx="drum" onClick={() => pass(4)}>{t('passYear')}</button>
            <button className="btn btn-line btn-small btn-time" type="button" aria-label={t('passYearsLong')} disabled={!canPass(g)} data-sfx="drum" onClick={() => pass(20)}>{t('passYears')}</button>
          </div>
        </div>
      </aside>

      <button className="gp-me raised" type="button" onClick={() => go('profile')} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 18px 12px 12px', color: 'var(--hanji)', textAlign: 'left', cursor: 'pointer' }}>
        <Medallion spec={{ ...playerPortrait(g), expr: faceOf(g) }} size={60} ring={healthWarning(g) ? '0 0 0 2px #C0565F' : '0 0 0 2px var(--gold-light)'} />
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span style={{ fontSize: 17, color: 'var(--text-ink)', display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>{tx(playerName(g))}<span className="mood-chip">{tx(EMOTIONS[emotionOf(g)].name)}</span></span>
          <span style={{ fontSize: 13, color: 'var(--gold-light)' }}>{g.generation === 1 ? pk(woman ? fam.line.woman : fam.line.man) : t('generationN', { n: g.generation })}</span>
          <span className="hud-status"><b className="hud-age">{lang === 'ko' ? `${playerAge(g)}세` : `Age ${playerAge(g)}`}</b> · {tx(stageName(g))}{g.player.legal === 'commoner' ? (lang === 'ko' ? ' · 평민' : ' · Commoner') : royalTitle(g) ? ` · ${tx(royalTitle(g))}` : officeTitle(g) ? ` · ${tx(officeTitle(g))}` : ''}{g.pol.exile ? (lang === 'ko' ? ' · 유배 중' : ' · In exile') : ''}</span>
          <span style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '4px 10px', alignItems: 'center', fontSize: 12, color: '#D9CCB0', marginTop: 4 }}>
            <span>{t('health')}</span><span className="meter"><span style={{ width: `${g.player.health}%` }} /></span><span>{g.player.health}</span>
            <span>{lang === 'ko' ? '행복' : 'Happiness'}</span><span className="meter happy"><span style={{ width: `${g.player.happiness}%` }} /></span><span>{g.player.happiness}</span>
            <span>{t('reputation')}</span><span className="meter"><span style={{ width: `${g.player.reputation}%` }} /></span><span>{g.player.reputation}</span>
            <span>{lang === 'ko' ? '피로' : 'Fatigue'}</span><span className={'meter cond' + (g.player.fatigue >= 70 ? ' warn' : '')}><span style={{ width: `${g.player.fatigue}%` }} /></span><span>{g.player.fatigue}</span>
            <span>{t('wealth')}</span><span className="meter wealth-meter"><span style={{ width: `${Math.max(2, wealthBar(spendable(g)))}%` }} /></span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontVariantNumeric: 'tabular-nums' }}><Coin size={11} />{spendable(g).toLocaleString('en-US')}</span>
          </span>
        </span>
      </button>

      <div className="tip-slot"><Tip id="play" dark en="Tap a person to talk, give a gift or do more. Matters that need you gather under the bell; set a daily routine to pass ordinary days quickly." ko="인물을 눌러 이야기하거나 선물하거나 다른 일을 해 보자. 처리할 일은 종 아래에 모이고, 하루 일과를 정하면 평범한 날을 빨리 보낼 수 있다." /></div>
      {g.letter && <LetterModal g={g} />}
      {!g.letter && g.report && <ReportModal g={g} />}
    </main>
  );
}

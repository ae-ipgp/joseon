import { useState } from 'react';
import { useGame } from '../store/game';
import { useUi } from '../store/ui';
import { Fibre } from '../ui/parts';
import { RecordsBar } from './RecordsBar';
import { Btn, Card, Tabs, useAct, useL } from '../ui/kit';
import { missionBar, missionDef, resolveMission } from '../engine/missions';
import { NOTE_CATS, unread } from '../engine/bus';
import { LETTER_KINDS, letterBar, writeLetter, type LetterKind } from '../engine/social';
import { clone } from '../engine/world';
import { T } from '../engine/text';
import type { Game } from '../model/schemas';

type Tab = 'missions' | 'letters' | 'notes';
const CAT_NAME = new Map(NOTE_CATS);

const markRead = (ids: string[] | 'all') => (g0: Game) => {
  const g = clone(g0);
  for (const n of g.notes) if (ids === 'all' || ids.includes(n.id)) n.read = true;
  return { game: g, note: null };
};

/** GSDD Part V §14 missions, §12.3 letters and §25 notifications, in one place. */
export function MissionsScreen() {
  const g = useGame((s) => s.game)!;
  const apply = useGame((s) => s.apply);
  const { L, tx, lang } = useL();
  const act = useAct();
  const start = useUi((s) => s.missionsTab);
  const [tab, setTab] = useState<Tab>(start ?? 'missions');
  const [cat, setCat] = useState('all');
  const [to, setTo] = useState('');
  const [kind, setKind] = useState<LetterKind>('greeting');
  const days = (d: number) => (lang === 'ko' ? `${d}일` : `${d} day${d === 1 ? '' : 's'}`);
  const open = g.missions.filter((m) => m.status === 'open');
  const closed = g.missions.filter((m) => m.status !== 'open').slice(-12).reverse();
  const notes = [...g.notes].reverse().filter((n) => cat === 'all' || n.cat === cat);
  const writable = Object.values(g.npcs).filter((n) => n.alive && g.rel[n.id]?.met && n.id !== 'king').sort((a, b) => (g.rel[b.id]?.regard ?? 0) - (g.rel[a.id]?.regard ?? 0));
  const target = to || writable[0]?.id || '';
  const why = target ? letterBar(g, target, kind) : T('There is no one you can write to yet.', '아직 편지할 사람이 없다.');
  const n = unread(g);
  return (
    <main className="paper-screen">
      <Fibre seed={11} />
      <RecordsBar current="missions" />
      <div className="wrap kit-wrap">
        <h1 className="kit-title">{L('Matters in hand', '처리할 일')} <span className="ko" lang="ko">庶務</span></h1>
        <Tabs<Tab> label={L('Sections', '구역')} value={tab} onChange={setTab} tabs={[
          ['missions', L(`Matters (${open.length})`, `과업 (${open.length})`)], ['letters', L('Letters', '서신')], ['notes', L(`Notices (${n})`, `알림 (${n})`)],
        ]} />
        {tab === 'missions' && (
          <div className="kit-grid">
            <Card title={L('Open matters', '진행 중인 과업')} ko="懸案">
              <p className="kit-note">{L('Matters arise from your circumstances. Each has more than one way through, and each way has its own cost. Left alone past the deadline, they resolve themselves, usually badly.', '과업은 당신의 처지에서 생겨난다. 해결하는 길은 여럿이고 길마다 대가가 다르다. 기한을 넘기면 저절로 결말이 나는데, 대개 좋지 않다.')}</p>
              {open.length === 0 && <p className="kit-note">{L('Nothing presses on you this season.', '이번 철에는 급한 일이 없다.')}</p>}
              {open.map((m) => {
                const d = missionDef(m.def);
                if (!d) return null;
                return (
                  <div key={m.id} className="mission">
                    <p className="kit-sub">{tx(d.cat)} · {L('time left', '남은 기한')}: {days(Math.max(0, m.due - g.dayCount))}</p>
                    <h4>{tx(d.title(g, m))}</h4>
                    <p>{tx(d.text(g, m))}</p>
                    <div className="mission-ways">
                      {d.approaches.map((a) => {
                        const bar = missionBar(g, m, a.id);
                        return (
                          <div key={a.id} className="kit-line">
                            <div><span>{tx(a.label)}</span><span className="kit-sub">{tx(a.hint)}</span></div>
                            <Btn tone="wine" why={bar ? tx(bar) : null} onClick={() => act((x) => resolveMission(x, m.id, a.id))}>{L('Do this', '이렇게 한다')}</Btn>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card title={L('Settled matters', '마무리된 일')} ko="結案">
              <ul className="kit-list">
                {closed.map((m) => {
                  const d = missionDef(m.def);
                  return <li key={m.id} className={m.status === 'failed' ? 'off' : ''}><b>{d ? tx(d.title(g, m)) : m.def}</b> <span className="kit-sub">{m.status === 'done' ? L('Settled', '해결') : L('Failed', '실패')}</span>{m.outcome && <span>{tx(m.outcome)}</span>}</li>;
                })}
                {closed.length === 0 && <li className="kit-note">{L('None yet.', '아직 없다.')}</li>}
              </ul>
            </Card>
          </div>
        )}
        {tab === 'letters' && (
          <div className="kit-grid">
            <Card title={L('Write a letter', '편지 쓰기')} ko="書簡">
              <div className="kit-form">
                <label>{L('To', '받는 이')}
                  <select className="kit-select" value={target} onChange={(e) => setTo(e.currentTarget.value)}>
                    {writable.map((p) => <option key={p.id} value={p.id}>{tx(p.name)}</option>)}
                  </select>
                </label>
                <label>{L('Kind', '종류')}
                  <select className="kit-select" value={kind} onChange={(e) => setKind(e.currentTarget.value as LetterKind)}>
                    {LETTER_KINDS.map((k) => <option key={k.id} value={k.id}>{tx(k.label)}</option>)}
                  </select>
                </label>
              </div>
              <div className="kit-actions" style={{ marginTop: 10 }}>
                <Btn tone="wine" why={why ? tx(why) : null} onClick={() => act((x) => writeLetter(x, target, kind), 'paper')}>{L('Seal and send (1 nyang)', '봉해서 보낸다 (1냥)')}</Btn>
              </div>
            </Card>
            <Card title={L('Correspondence', '오간 편지')} ko="往復">
              <ul className="kit-list letters">
                {[...g.mail].reverse().map((m) => (
                  <li key={m.id} className={m.dir}>
                    <span className="kit-sub">{m.dir === 'in' ? L('Received from', '받음') : L('Sent to', '보냄')} {tx(m.who)} · {tx(m.title)}</span>
                    <span className="letter-body">{tx(m.body)}</span>
                  </li>
                ))}
                {g.mail.length === 0 && <li className="kit-note">{L('No letters yet.', '아직 편지가 없다.')}</li>}
              </ul>
            </Card>
          </div>
        )}
        {tab === 'notes' && (
          <Card title={L('Notices', '알림')} ko="消息" aside={<Btn onClick={() => apply(markRead('all'))} disabled={n === 0}>{L('Mark all read', '모두 읽음')}</Btn>}>
            <div className="kit-actions" role="group" aria-label={L('Filter', '분류')}>
              {NOTE_CATS.filter(([c]) => c === 'all' || g.notes.some((x) => x.cat === c)).map(([c, name]) => (
                <button key={c} type="button" className="mini-chip kit-focus" aria-pressed={cat === c} onClick={() => setCat(c)}>{tx(name)}</button>
              ))}
            </div>
            <ol className="kit-timeline notes">
              {notes.slice(0, 80).map((x) => (
                <li key={x.id} className={`pri-${x.pri}${x.read ? ' read' : ''}`} onClick={() => !x.read && apply(markRead([x.id]))}>
                  <span className="kit-sub">{tx(CAT_NAME.get(x.cat) ?? { en: x.cat })}{x.pri === 'critical' ? ` · ${L('critical', '긴급')}` : x.pri === 'high' ? ` · ${L('important', '중요')}` : ''}</span>
                  <span>{tx(x.text)}</span>
                </li>
              ))}
              {notes.length === 0 && <li><span className="kit-note">{L('Nothing to report.', '알릴 것이 없다.')}</span></li>}
            </ol>
          </Card>
        )}
      </div>
    </main>
  );
}

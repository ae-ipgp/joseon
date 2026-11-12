import { useGame } from '../store/game';
import type { Game } from '../model/schemas';
import { Fibre } from '../ui/parts';
import { Tip } from '../ui/Tip';
import { RecordsBar } from './RecordsBar';
import { Btn, Card, Meter, useAct, useL } from '../ui/kit';
import { EMOTIONS, LEISURE, MILESTONES, TREATMENTS, skillBand, type MilestoneId } from '../content/life';
import {
  compete, competeBar, conditionsOf, contentment, emotionOf, happinessTarget, healthWarning, inMourning, leisure, leisureBar,
  openSkills, practise, practiseBar, treat, treatBar, treatmentCost,
} from '../engine/life';
import { conditionWord } from '../engine/social';
import { PHASE_NAMES } from '../engine/time';

/**
 * The BitLife-style "activities" page (GSDD Part IX §12, §14, §15, §18.5): how the player feels, what ails
 * them and how to treat it, the pastimes they practise, small pleasures, and the milestones of the life so far.
 */
export function LifeScreen() {
  const g = useGame((s) => s.game)!;
  const { L, tx, lang } = useL();
  const act = useAct();
  const P = g.player;
  const emo = EMOTIONS[emotionOf(g)];
  const sources = contentment(g).sort((a, b) => b.d - a.d);
  const warn = healthWarning(g);
  const conds = conditionsOf(g);
  const skills = openSkills(g);
  const phase = tx(PHASE_NAMES[g.date.phase]);
  const evening = g.date.phase === 'evening';
  const target = happinessTarget(g);
  return (
    <main className="paper-screen">
      <Fibre seed={15} />
      <RecordsBar current="life" />
      <div className="wrap kit-wrap">
        <h1 className="kit-title">{L('Pastimes & health', '취미와 건강')} <span className="ko" lang="ko">起居</span></h1>
        <p className="kit-note">{evening
          ? L('It is evening: some pastimes can be enjoyed by lamplight, one each evening.', '저녁이다. 등잔 아래 즐길 수 있는 취미가 있으며, 저녁마다 한 가지씩 할 수 있다.')
          : L(`It is ${phase.toLowerCase()}. A pastime or outing takes the rest of the ${phase.toLowerCase()}.`, `지금은 ${phase}. 취미나 나들이는 남은 ${phase}을(를) 쓴다.`)}</p>
        <Tip id="life" en="Like any life, this one has moods, illnesses and pleasures. Practise a pastime to get better at it; leave it a year and it fades a little." ko="여느 삶처럼 기분과 병과 즐거움이 있다. 취미는 연습할수록 늘고, 한 해를 손 놓으면 조금씩 녹슨다." />
        <div className="kit-grid">
          <Card title={L('How you feel', '마음')} ko="心">
            <p className="mood-line"><span className={`mood-dot mood-${emo.face}`} aria-hidden="true" /> <strong>{tx(emo.name)}</strong> · {tx(emo.text)}</p>
            <Meter label={L('Happiness', '행복')} value={P.happiness} tone="gold" note={L(`It is drifting toward ${target}.`, `${target} 쪽으로 움직이고 있다.`)} />
            <ul className="kit-list sources">
              {sources.map((s) => (
                <li key={s.id} className={s.d > 0 ? 'up' : 'down'}><span><b>{tx(s.name)}</b> <span className="kit-in">{s.d > 0 ? '+' : '−'}{Math.abs(s.d)}</span></span><span>{tx(s.text)}</span></li>
              ))}
              {!sources.length && <li className="kit-note">{L('Nothing much, good or bad.', '좋은 일도 나쁜 일도 별로 없다.')}</li>}
            </ul>
          </Card>
          <Card title={L('Health', '건강')} ko="身">
            <Meter label={L('Health', '건강')} value={P.health} tone="jade" />
            <Meter label={`${L('Fatigue', '피로')} · ${tx(conditionWord(P.fatigue))}`} value={P.fatigue} tone="gold" />
            <Meter label={`${L('Stress', '근심')} · ${tx(conditionWord(P.stress))}`} value={P.stress} tone="wine" />
            {warn && <p className="health-warn" role="alert">{tx(warn)}</p>}
            {inMourning(g) && <p className="kit-note">{L(`In mourning for ${P.mourning!.for.en}${P.mourning!.leave ? ', on leave from office' : ''}.`, `${P.mourning!.for.ko ?? P.mourning!.for.en}의 상중${P.mourning!.leave ? ', 벼슬을 쉬고 있다' : ''}.`)}</p>}
            {conds.length === 0 && <p className="kit-note">{L('No illness at present.', '지금은 앓는 데가 없다.')}</p>}
            {conds.map((c) => (
              <div key={c.id} className="cond">
                <p><strong>{tx(c.def.name)}</strong> <span className="kit-in">{c.def.chronic ? L('lasting', '고질') : c.def.severity === 3 ? L('grave', '위중') : c.def.severity === 2 ? L('serious', '중함') : L('mild', '가벼움')}</span></p>
                <p className="kit-sub">{tx(c.def.text)}{c.treated >= 0 && g.dayCount - c.treated < 120 ? ` ${L('Under treatment.', '치료 중.')}` : ''}</p>
                <div className="kit-actions">
                  {TREATMENTS.map((t) => {
                    const why = treatBar(g, c.id, t.id);
                    if (t.id === 'royal' && why && P.royal === 'none' && P.legal !== 'royal' && P.favour < 60) return null;
                    const cost = treatmentCost(g, t.id, c.def.severity);
                    return <Btn key={t.id} why={why ? tx(why) : null} onClick={() => act((x) => treat(x, c.id, t.id), 'paper')}>{tx(t.name)}{cost ? ` · ${cost}${lang === 'ko' ? '냥' : ' nyang'}` : ''}</Btn>;
                  })}
                </div>
              </div>
            ))}
          </Card>
        </div>
        <Card title={L('Pastimes', '취미')} ko="藝">
          <div className="skills">
            {skills.map((s) => {
              const v = P.skills[s.id] ?? 0;
              const why = practiseBar(g, s.id);
              const cwhy = competeBar(g, s.id);
              return (
                <div key={s.id} className="skill">
                  <div className="skill-top"><strong>{tx(s.name)}</strong><span className="kit-in">{tx(skillBand(v))} · {v}</span></div>
                  <div className="kit-meter-track"><div className="kit-meter-fill gold" style={{ width: `${v}%` }} /></div>
                  <p className="kit-sub">{tx(s.text)}{v >= 80 ? ` ${tx(s.master)}` : ''}</p>
                  <div className="kit-actions">
                    <Btn tone="wine" why={why ? tx(why) : null} onClick={() => act((x) => practise(x, s.id), 'paper')}>{L('Practise', '연습')}</Btn>
                    <Btn why={cwhy ? tx(cwhy) : null} onClick={() => act((x) => compete(x, s.id))}>{tx(s.contest)}</Btn>
                  </div>
                </div>
              );
            })}
            {!skills.length && <p className="kit-note">{L('You are too young for pastimes yet.', '아직 취미를 즐기기엔 어리다.')}</p>}
          </div>
        </Card>
        <div className="kit-grid">
          <Card title={L('Simple pleasures', '소일거리')} ko="閑">
            {LEISURE.map((l) => {
              const why = leisureBar(g, l.id);
              return (
                <div key={l.id} className="kit-line">
                  <div><span>{tx(l.name)}{l.cost ? ` · ${l.cost}${lang === 'ko' ? '냥' : ' nyang'}` : ''}</span><span className="kit-sub">{tx(l.text)}</span></div>
                  <Btn why={why ? tx(why) : null} onClick={() => act((x) => leisure(x, l.id), 'paper')}>{L('Go', '하기')}</Btn>
                </div>
              );
            })}
          </Card>
          <Card title={L('Milestones of this life', '삶의 이정표')} ko="里程">
            <ol className="kit-timeline">
              {g.milestones.map((m) => <li key={m.id}><span className="kit-sub">{m.year}</span><span>{tx(MILESTONES[m.id as MilestoneId] ?? { en: m.id })}</span></li>)}
              {!g.milestones.length && <li><span className="kit-note">{L('None yet.', '아직 없다.')}</span></li>}
            </ol>
          </Card>
        </div>
        <Card title={L('This life in numbers', '숫자로 보는 삶')} ko="計">
          <div className="numbers">
            {numbers(g).map(([en, ko, v]) => (
              <div key={en} className="number"><b>{v.toLocaleString('en-US')}</b><span>{L(en, ko)}</span></div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}

/** BitLife-style tallies of one life, from the counters the game already keeps. */
function numbers(g: Game): [string, string, number][] {
  const c = (k: string) => g.counts[k] ?? 0;
  const known = Object.keys(g.rel).filter((id) => g.rel[id].met).length;
  const friends = Object.keys(g.rel).filter((id) => g.rel[id].met && g.rel[id].regard >= 45 && g.npcs[id]?.alive).length;
  const kids = Object.values(g.npcs).filter((n) => n.kin === 'child' && n.parents.includes('player')).length;
  return [
    ['Seasons lived in play', '플레이한 철', c('happy-n')],
    ['People known', '아는 사람', known],
    ['Friends', '벗', friends],
    ['Children', '자녀', kids],
    ['Conversations', '나눈 대화', c('talks')],
    ['Gifts given', '준 선물', c('gifts')],
    ['Letters written', '쓴 편지', c('letters')],
    ['Practice sessions', '연습한 횟수', c('practised')],
    ['Contests won', '겨루기 우승', c('contests')],
    ['Works finished', '완성한 작품', g.player.works.length],
    ['Matters settled', '해결한 과업', c('missions')],
    ['Journeys', '여행', c('journeys')],
    ['Illnesses treated', '치료한 횟수', c('treatments')],
    ['Acts of patronage', '후원', c('patronage')],
    ['Victories', '승전', c('victories')],
    ['Milestones', '이정표', g.milestones.length],
  ];
}

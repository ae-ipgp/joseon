import { useState } from 'react';
import { useGame } from '../store/game';
import { Fibre, Seal } from '../ui/parts';
import { Tip } from '../ui/Tip';
import { RecordsBar } from './RecordsBar';
import { Btn, Card, Meter, Tabs, useAct, useL } from '../ui/kit';
import { PATHS, PATRONAGE, PETS, WORK_KINDS, petById, workBand, type PathId } from '../content/culture';
import { scenarioById } from '../content/scenarios';
import {
  adopt, adoptBar, compose, composeBar, openPractices, pathOf, patron, patronBar, petBar, petTime, practice, practiceBar,
} from '../engine/culture';
import { PHASE_NAMES } from '../engine/time';

type Tab = 'belief' | 'writing' | 'patronage' | 'companion';

/**
 * Culture and belief at life-sim depth (GSDD Parts XIII and XVI): what the player keeps, writes, pays for
 * and has for company. Also shows the life's scenario, when it has one.
 */
export function CultureScreen() {
  const g = useGame((s) => s.game)!;
  const { L, tx, lang } = useL();
  const act = useAct();
  const [tab, setTab] = useState<Tab>('belief');
  const P = g.player;
  const path = pathOf(g);
  const nyang = (n: number) => (lang === 'ko' ? `${n}냥` : `${n} nyang`);
  const sc = g.scenario ? scenarioById(g.scenario.id) : undefined;
  const phase = tx(PHASE_NAMES[g.date.phase]);
  return (
    <main className="paper-screen">
      <Fibre seed={17} />
      <RecordsBar current="culture" />
      <div className="wrap kit-wrap">
        <h1 className="kit-title">{L('Culture & belief', '풍류와 믿음')} <span className="ko" lang="ko">風流</span></h1>
        <p className="kit-note">{L(`It is ${phase.toLowerCase()}. Practices and writing take the rest of it; patronage and adopting a companion take no time.`, `지금은 ${phase}. 수행과 저술은 남은 ${phase}을(를) 쓰고, 후원과 짐승 들이기는 시간을 쓰지 않는다.`)}</p>
        <Tip id="culture" en="Keep a practice a few times and it becomes your way. Write when your arts are ready, give when you can, and let a dog choose you." ko="수행을 몇 번 이어 가면 그것이 당신의 길이 된다. 재주가 익으면 글을 쓰고, 넉넉하면 베풀고, 강아지가 당신을 고르게 두자." />
        {sc && g.scenario && (
          <section className={`scenario-strip st-${g.scenario.status}`} aria-label={L('Scenario', '시나리오')}>
            <Seal text={sc.seal} size={46} tilt={-5} />
            <div>
              <p className="kit-sub">{L('Scenario', '시나리오')} · {g.scenario.status === 'won' ? L('achieved', '달성') : g.scenario.status === 'lost' ? L('out of reach', '놓침') : L('in progress', '진행 중')}</p>
              <p className="scenario-name">{tx(sc.name)}</p>
              <p>{tx(sc.goal)} <span className="kit-in">{tx(sc.progress(g))}</span></p>
            </div>
          </section>
        )}
        <Tabs<Tab> label={L('Sections', '구역')} value={tab} onChange={setTab} tabs={[
          ['belief', L('Belief', '믿음')], ['writing', L(`Writing (${P.works.length})`, `저술 (${P.works.length})`)], ['patronage', L('Patronage', '후원')], ['companion', L('Companion', '벗 삼은 짐승')],
        ]} />
        {tab === 'belief' && (
          <div className="kit-grid">
            <Card title={L('Your way', '당신의 길')} ko="道">
              <div className="path-now">
                {path ? <Seal text={PATHS[path].seal} size={52} tilt={-4} /> : <span className="seal-empty ko" lang="ko" aria-hidden="true">道</span>}
                <div>
                  <p className="scenario-name">{path ? tx(PATHS[path].name) : L('No settled way yet', '아직 정한 길이 없다')}</p>
                  <p className="kit-sub">{path ? tx(PATHS[path].text) : L('Keep any practice three times and it becomes yours.', '어떤 수행이든 세 번 이어 가면 당신의 길이 된다.')}</p>
                </div>
              </div>
              <Meter label={L('Conviction', '신념')} value={P.belief.conviction} tone="jade" note={L('Rises with practice and fades slowly without it. A firm conviction steadies the mind.', '수행하면 오르고 놓으면 서서히 옅어진다. 굳은 신념은 마음을 붙들어 준다.')} />
              <ul className="kit-list">
                {(Object.keys(PATHS) as PathId[]).map((id) => (
                  <li key={id} className={path === id ? 'on' : ''}><span><b>{tx(PATHS[id].name)}</b></span><span>{tx(PATHS[id].text)}</span></li>
                ))}
              </ul>
              <p className="kit-note">{L('Beliefs are shown as people of the time held them. The game takes no side among them.', '믿음은 그 시대 사람들이 지녔던 대로 그렸다. 게임은 어느 쪽 편도 들지 않는다.')}</p>
            </Card>
            <Card title={L('Practices', '수행')} ko="修">
              {openPractices(g).map((p) => {
                const why = practiceBar(g, p.id);
                const n = P.belief.practice[p.id] ?? 0;
                return (
                  <div key={p.id} className="kit-line">
                    <div><span>{tx(p.name)}{p.cost ? ` · ${nyang(p.cost)}` : ''}{n ? <span className="kit-in"> ×{n}</span> : null}</span><span className="kit-sub">{tx(p.text)}</span></div>
                    <Btn tone="wine" why={why ? tx(why) : null} onClick={() => act((x) => practice(x, p.id), 'paper')}>{L('Do this', '행한다')}</Btn>
                  </div>
                );
              })}
              {!openPractices(g).length && <p className="kit-note">{L('You are too young for these yet.', '아직은 어리다.')}</p>}
            </Card>
          </div>
        )}
        {tab === 'writing' && (
          <div className="kit-grid">
            <Card title={L('Finish a work', '작품을 완성한다')} ko="著">
              <p className="kit-note">{L('One finished work a year. How good it is depends on your arts and learning, and a little on the day.', '한 해에 한 편. 됨됨이는 재주와 학문에, 그리고 조금은 그날의 운에 달렸다.')}</p>
              {WORK_KINDS.map((k) => {
                const why = composeBar(g, k.id);
                return (
                  <div key={k.id} className="kit-line">
                    <div><span>{tx(k.name)}</span><span className="kit-sub">{tx(k.text)} {L('Needs:', '필요:')} {tx(k.needs)}.</span></div>
                    <Btn tone="wine" why={why ? tx(why) : null} onClick={() => act((x) => compose(x, k.id), 'paper')}>{L('Write', '쓴다')}</Btn>
                  </div>
                );
              })}
            </Card>
            <Card title={L('Your works', '저술 목록')} ko="文集">
              <div className="works">
                {[...P.works].reverse().map((w) => (
                  <article key={w.id} className={'work' + (w.quality >= 80 ? ' great' : '')}>
                    <span className="work-spine ko" lang="ko" aria-hidden="true">{w.title.ko ?? ''}</span>
                    <div>
                      <p className="work-title">{tx(w.title)}</p>
                      <p className="kit-sub">{tx(WORK_KINDS.find((k) => k.id === w.kind)?.name ?? { en: w.kind })} · {w.year} · {tx(workBand(w.quality))}</p>
                    </div>
                  </article>
                ))}
                {!P.works.length && <p className="kit-note">{L('Nothing finished yet. Poetry at 25 is enough for a first collection.', '아직 완성한 것이 없다. 시작이 25면 첫 시집을 낼 수 있다.')}</p>}
              </div>
            </Card>
          </div>
        )}
        {tab === 'patronage' && (
          <Card title={L('Patronage', '후원')} ko="施">
            <p className="kit-note">{L('One act a season. Gifts marked “family treasury” need the keys of the house.', '한 철에 한 번. ‘집안 곳간’ 표시가 있는 것은 곳간 열쇠가 있어야 한다.')}</p>
            <div className="skills">
              {PATRONAGE.map((d) => {
                const why = patronBar(g, d.id);
                return (
                  <div key={d.id} className="skill">
                    <div className="skill-top"><strong>{tx(d.name)}</strong><span className="kit-in">{nyang(d.cost)}{d.house ? ` · ${L('family treasury', '집안 곳간')}` : ''}</span></div>
                    <p className="kit-sub">{tx(d.text)}</p>
                    <div className="kit-actions"><Btn why={why ? tx(why) : null} onClick={() => act((x) => patron(x, d.id), 'coin')}>{L('Give', '베푼다')}</Btn></div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
        {tab === 'companion' && (
          <div className="kit-grid">
            <Card title={L('Your companion', '곁의 짐승')} ko="伴">
              {P.pet ? (
                <div className="pet-now">
                  <PetArt kind={P.pet.kind} />
                  <div>
                    <p className="scenario-name">{tx(P.pet.name)}</p>
                    <p className="kit-sub">{tx(petById(P.pet.kind)?.name ?? { en: P.pet.kind })} · {L(`${g.date.year - P.pet.born} years with you`, `함께한 지 ${g.date.year - P.pet.born}년`)}</p>
                    <p className="kit-sub">{tx(petById(P.pet.kind)?.text ?? { en: '' })}</p>
                    <div className="kit-actions" style={{ marginTop: 10 }}>
                      <Btn tone="wine" why={petBar(g) ? tx(petBar(g)) : null} onClick={() => act(petTime, 'paper')}>{P.pet.kind === 'falcon' ? L('Fly the falcon', '매를 날린다') : L('Spend time together', '함께 시간을 보낸다')}</Btn>
                    </div>
                  </div>
                </div>
              ) : <p className="kit-note">{L('No companion yet. One may also find you by itself.', '아직 곁에 두는 짐승이 없다. 제 발로 찾아올 수도 있다.')}</p>}
            </Card>
            <Card title={L('Take in a companion', '짐승을 들인다')} ko="畜">
              {PETS.map((d) => {
                const why = adoptBar(g, d.id);
                return (
                  <div key={d.id} className="kit-line">
                    <div><span>{tx(d.name)} · {nyang(d.cost)}</span><span className="kit-sub">{tx(d.text)}</span></div>
                    <Btn why={why ? tx(why) : null} onClick={() => act((x) => adopt(x, d.id), 'coin')}>{L('Take in', '들인다')}</Btn>
                  </div>
                );
              })}
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

/** A small ink drawing of the companion, in the manner of a folk painting. */
export function PetArt({ kind, size = 96 }: { kind: string; size?: number }) {
  const ink = '#2A211D';
  const body = kind === 'cat' ? (
    <g>
      <path d="M30,74 C22,50 34,34 50,34 C66,34 78,50 70,74 Z" fill="#E9DFC8" stroke={ink} strokeWidth="2" />
      <path d="M34,40 L30,24 L44,34 Z M66,40 L70,24 L56,34 Z" fill="#E9DFC8" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      <path d="M42,50 q3,-3 6,0 M52,50 q3,-3 6,0" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M48,57 l2,2 l2,-2 M50,59 v3" stroke={ink} strokeWidth="1.6" fill="none" />
      <path d="M70,72 C86,70 86,52 78,48" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M38,44 l6,3 M62,44 l-6,3 M46,36 v6 M54,36 v6" stroke="#C0682E" strokeWidth="2" strokeLinecap="round" />
    </g>
  ) : kind === 'falcon' ? (
    <g>
      <path d="M50,20 C66,22 70,44 62,64 L50,80 L40,62 C32,42 36,22 50,20 Z" fill="#8A7A66" stroke={ink} strokeWidth="2" />
      <path d="M44,34 q6,-5 12,0" stroke={ink} strokeWidth="2" fill="none" />
      <circle cx="46" cy="30" r="2.2" fill={ink} />
      <path d="M40,32 l-8,3 l8,2 Z" fill="#D9A93A" stroke={ink} strokeWidth="1.2" />
      <path d="M44,48 q6,5 12,0 M43,56 q7,5 14,0" stroke="#EDE3CC" strokeWidth="1.6" fill="none" />
      <path d="M30,84 H70" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M46,80 v5 M54,78 v7" stroke="#D9A93A" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  ) : kind === 'crane' ? (
    <g>
      <path d="M36,60 C40,44 60,42 68,56 C72,64 60,70 48,68 Z" fill="#F4EEDD" stroke={ink} strokeWidth="2" />
      <path d="M62,50 C72,54 78,62 76,70 L64,64 Z" fill={ink} />
      <path d="M40,58 C34,44 34,30 40,22" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="41" cy="20" r="4.5" fill="#F4EEDD" stroke={ink} strokeWidth="1.6" />
      <path d="M38,16 q3,-3 6,0 Z" fill="#B3262E" />
      <path d="M37,21 l-12,3 l12,1 Z" fill="#6B5A3A" />
      <path d="M50,68 v18 M56,68 v18 M46,86 h8 M52,86 h8" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  ) : (
    <g>
      <path d="M26,72 C22,52 32,40 50,40 C68,40 78,52 74,72 Z" fill={kind === 'jindo' ? '#F1E6CC' : '#CDBE9E'} stroke={ink} strokeWidth="2" />
      <path d="M34,46 C26,40 26,28 34,30 L42,40 Z M66,46 C74,40 74,28 66,30 L58,40 Z" fill={kind === 'jindo' ? '#F1E6CC' : '#B7A684'} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="43" cy="52" r="2.4" fill={ink} /><circle cx="57" cy="52" r="2.4" fill={ink} />
      <ellipse cx="50" cy="59" rx="3.4" ry="2.4" fill={ink} />
      <path d="M50,61 v4 M50,65 q-4,4 -8,1 M50,65 q4,4 8,1" stroke={ink} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {kind !== 'jindo' && <path d="M32,48 q4,6 2,12 M38,44 q2,8 -1,14 M62,44 q-2,8 1,14 M68,48 q-4,6 -2,12 M44,42 q1,5 -1,9 M56,42 q-1,5 1,9" stroke="#8C7B5C" strokeWidth="1.6" fill="none" strokeLinecap="round" />}
      <path d="M74,68 C88,62 84,46 78,44" stroke={ink} strokeWidth="3.4" fill="none" strokeLinecap="round" />
    </g>
  );
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="pet-art" aria-hidden="true">
      <circle cx="50" cy="52" r="46" fill="#EFE6D0" stroke="#B08D57" strokeWidth="1.5" />
      <path d="M12,82 C30,76 70,76 88,82" stroke="#8FA58B" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
      {body}
    </svg>
  );
}

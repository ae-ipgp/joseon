import { EMOTIONS, skillById } from '../content/life';
import { conditionsOf, emotionOf, healthWarning } from '../engine/life';
import { useState } from 'react';
import type { Game } from '../model/schemas';
import { Meter, useL } from '../ui/kit';
import { ATTR_GROUPS, EDU_FIELDS, QUALS, TEMPERS, attrBand, attrsOf, eduBand, temperWord } from '../content/attributes';
import { objectives, stageName } from '../engine/character';
import { officeTitle, royalTitle, sideName } from '../engine/politics';
import { WEALTH_WORDS } from '../engine/money';
import { prestigeWord } from '../content/lists';
import { DOMAIN_NAMES, conditionWord, reputationDomains, type Domain } from '../engine/social';
import { Tip } from '../ui/Tip';

/** GSDD Part I §19.1 and §19.4: the attributes, the separate dimensions of status, education and current aims. */
export function ProfileExtra({ g }: { g: Game }) {
  const { L, tx } = useL();
  const P = g.player;
  const [open, setOpen] = useState<string | null>('mind');
  const influence = Math.round(Math.min(100, (P.office?.rank ?? 0) * 10 + g.house.prestige * 6 + P.favour / 4 + (g.pol.side !== 'neutral' ? g.pol.standing / 5 : 0) + P.reputation / 6));
  const authority = P.royal === 'king' || P.royal === 'regent' ? g.pol.state?.authority ?? 0 : (P.office?.rank ?? 0) * 18;
  const goals = objectives(g);
  const status: [string, string][] = [
    [L('Life stage', '생애 단계'), tx(stageName(g))],
    [L('Born', '출생 신분'), P.born === 'royal' ? L('Royal family', '왕족') : L('Yangban', '양반')],
    [L('Legal status now', '현재 법적 신분'), P.legal === 'royal' ? L('Royal family', '왕족') : P.legal === 'commoner' ? L('Commoner', '평민') : L('Yangban', '양반')],
    [L('Royal standing', '왕실 지위'), royalTitle(g) ? tx(royalTitle(g)) : P.lineage !== 'none' ? L('Of royal descent', '왕실 후손') : '—'],
    [L('Office', '관직'), officeTitle(g) ? tx(officeTitle(g)) : '—'],
    [L('Family standing', '가문의 위세'), `${tx(prestigeWord(g.house.prestige))} (${g.house.prestige}/5)`],
    [L('Household means', '살림 형편'), tx(WEALTH_WORDS[g.house.wealth])],
    [L('Faction', '당파'), tx(sideName(g, g.pol.side))],
  ];
  return (
    <>
      <section className="sec" aria-labelledby="pf-goal">
        <h2 id="pf-goal" className="h2">{L('Current objectives', '지금의 목표')} <span className="ko" lang="ko">志向</span></h2>
        <ul className="kit-list">
          {goals.map((o) => (
            <li key={o.id} className={o.done ? 'kit-done' : ''}>
              <strong>{o.done ? '✓ ' : ''}{tx(o.text)}</strong>
              {o.progress !== undefined && !o.done && <span className="kit-progress"><span style={{ width: `${Math.round(o.progress * 100)}%` }} /></span>}
            </li>
          ))}
          {goals.length === 0 && <li className="kit-note">{L('The days ask nothing in particular of you.', '요즘은 딱히 해야 할 일이 없다.')}</li>}
        </ul>
      </section>
      <section className="sec" aria-labelledby="pf-status">
        <h2 id="pf-status" className="h2">{L('Status, in its parts', '신분과 지위')} <span className="ko" lang="ko">身分</span></h2>
        <dl className="facts kit-facts">{status.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        <div className="kit-meters">
          <Meter label={L('Honour', '명예')} value={P.honour} note={L('Integrity as others judge it', '남들이 보는 곧은 몸가짐')} />
          <Meter label={L('Influence', '영향력')} value={influence} note={L('What you can sway: office, family, favour, faction', '관직, 가문, 총애, 당파로 움직일 수 있는 것')} />
          <Meter label={L('Formal authority', '공식 권한')} value={authority} note={L('Power that comes with a post, not a person', '사람이 아니라 자리에 딸린 권한')} />
          {(P.lineage !== 'none' || P.royal !== 'none') && <Meter label={L('Legitimacy', '정통성')} value={P.legitimacy} tone="wine" note={L('Recognition of your royal claim', '왕실의 혈통으로서 인정받는 정도')} />}
        </div>
        <p className="kit-note">{L('Wealth does not make a noble, losing office does not unmake one, and royal blood is not the right to rule. Each is kept apart.', '재산이 양반을 만들지 않고, 관직을 잃는다고 양반이 아닌 것도 아니며, 왕족의 피가 곧 다스릴 권리도 아니다. 모두 따로 셈한다.')}</p>
      </section>
      <section className="sec" aria-labelledby="pf-rep">
        <h2 id="pf-rep" className="h2">{L('Standing, domain by domain', '분야별 평판')} <span className="ko" lang="ko">名聲</span></h2>
        <div className="kit-meters">
          {(Object.entries(reputationDomains(g)) as [Domain, number][]).map(([k, v]) => <Meter key={k} label={tx(DOMAIN_NAMES[k])} value={v} tone={k === 'court' ? 'wine' : k === 'commercial' ? 'gold' : undefined} />)}
        </div>
        <p className="kit-note">{L('Read from what you have done, so a person can be admired as a scholar and distrusted at court.', '당신이 해 온 일에서 읽어 낸다. 학자로는 존경받고 조정에서는 의심받을 수도 있다.')}</p>
      </section>
      <section className="sec" aria-labelledby="pf-cond">
        <h2 id="pf-cond" className="h2">{L('Condition', '몸 상태')} <span className="ko" lang="ko">氣力</span></h2>
        <p className="mood-line"><span className={`mood-dot mood-${EMOTIONS[emotionOf(g)].face}`} aria-hidden="true" /> <strong>{tx(EMOTIONS[emotionOf(g)].name)}</strong> · {tx(EMOTIONS[emotionOf(g)].text)}</p>
        {healthWarning(g) && <p className="health-warn" role="alert">{tx(healthWarning(g))}</p>}
        <div className="kit-meters">
          <Meter label={L('Happiness', '행복')} value={P.happiness} tone="gold" />
          <Meter label={`${L('Health', '건강')}${P.conditions.length ? ` · ${conditionsOf(g).map((c) => tx(c.def.name)).join(', ')}` : ''}`} value={P.health} tone="jade" />
          <Meter label={`${L('Fatigue', '피로')} · ${tx(conditionWord(P.fatigue))}`} value={P.fatigue} tone="gold" note={L('Each activity tires; a night’s sleep restores.', '일할 때마다 쌓이고 밤잠으로 풀린다.')} />
          <Meter label={`${L('Stress', '근심')} · ${tx(conditionWord(P.stress))}`} value={P.stress} tone="wine" note={L('Debts, inquiries and exile add to it; a settled house eases it. Above 75 it wears down health.', '빚, 조사, 유배가 쌓고 안정된 집안이 덜어 준다. 75를 넘으면 건강이 상한다.')} />
        </div>
        {Object.keys(P.skills).length > 0 && (
          <p className="kit-note" style={{ marginTop: 10 }}>{L('Pastimes', '취미')}: {Object.entries(P.skills).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id, v]) => `${tx(skillById(id)?.name ?? { en: id })} ${v}`).join(' · ')}</p>
        )}
      </section>
      <Tip id="profile" en="Your standing is read in parts: attributes, status, reputation by domain and condition. None of them is the whole of you." ko="당신의 처지는 여러 갈래로 읽힌다. 능력, 신분, 분야별 평판, 몸 상태. 어느 하나가 당신의 전부는 아니다." />
      <section className="sec" aria-labelledby="pf-attr">
        <h2 id="pf-attr" className="h2">{L('Attributes', '능력')} <span className="ko" lang="ko">才能</span></h2>
        {ATTR_GROUPS.map((grp) => {
          const list = attrsOf(grp.id);
          const avg = Math.round(list.reduce((n, a) => n + (a.id === 'health' ? P.health : P.attrs[a.id] ?? 50), 0) / list.length);
          const isOpen = open === grp.id;
          return (
            <div key={grp.id} className="kit-group">
              <button type="button" className="kit-group-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : grp.id)}>
                <span>{tx(grp.name)}</span><span className="kit-sub">{tx(attrBand(avg))} · {avg}</span>
              </button>
              {isOpen && (
                <div className="kit-group-body">
                  {list.map((a) => {
                    const v = a.id === 'health' ? P.health : P.attrs[a.id] ?? 50;
                    return <Meter key={a.id} label={`${tx(a.name)} · ${tx(attrBand(v))}`} value={v} note={tx(a.text)} />;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>
      <div className="kit-two">
        <section className="sec" aria-labelledby="pf-edu">
          <h2 id="pf-edu" className="h2">{L('Education', '학업')} <span className="ko" lang="ko">學業</span></h2>
          <dl className="facts kit-facts">
            {EDU_FIELDS.map((f) => <div key={f.id}><dt>{tx(f.name)}</dt><dd>{tx(eduBand(P.edu[f.id] ?? 0))} ({P.edu[f.id] ?? 0})</dd></div>)}
            <div><dt>{L('Qualifications', '자격')}</dt><dd>{P.quals.length ? P.quals.map((q) => tx(QUALS[q]?.name)).join(', ') : '—'}</dd></div>
          </dl>
        </section>
        <section className="sec" aria-labelledby="pf-temper">
          <h2 id="pf-temper" className="h2">{L('Tendencies', '기질')} <span className="ko" lang="ko">氣質</span></h2>
          <p className="kit-note">{TEMPERS.map((t) => temperWord(t.id, P.temper[t.id] ?? 0)).filter(Boolean).map((w) => tx(w)).join(' · ') || L('Even-tempered in every way', '모든 면에서 무난한 기질')}</p>
        </section>
      </div>
    </>
  );
}

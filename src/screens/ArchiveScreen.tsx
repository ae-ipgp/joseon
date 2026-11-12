import { useState } from 'react';
import { useGame } from '../store/game';
import { Fibre } from '../ui/parts';
import { RecordsBar } from './RecordsBar';
import { Card, Facts, Tabs, useL } from '../ui/kit';
import { HISTORY, KINGS } from '../content/history';
import { ANNALS, CATEGORY_NAMES, FACTION_PROFILES, PERIODS, PLACES_HISTORY, RULES, periodOf, ruleActive } from '../content/annals';
import { CONFIDENCE, MONARCHS, SOURCES, type Confidence } from '../content/monarchs';
import { FIGURES } from '../content/figures';
import { INSTITUTIONS } from '../content/government';
import { DIVERGENCE_NAMES, biography, silenced, type DivergenceClass } from '../engine/chronicle2';
import { dateKey, rulerOf, yearNumber } from '../engine/time';
import type { LifeEntry } from '../model/schemas';

type Tab = 'life' | 'bio' | 'docs' | 'kingdom' | 'kings' | 'figures' | 'state' | 'places' | 'lives' | 'sources';
const TAGS: [string, string, string][] = [
  ['all', 'Everything', '전체'], ['edu', 'Education', '학업'], ['career', 'Career', '관직'], ['family', 'Family', '가족'],
  ['politics', 'Politics', '정치'], ['court', 'Royal court', '왕실'], ['wealth', 'Wealth', '재산'], ['downfall', 'Downfall', '몰락'],
];
/** Old records have no heading; a few words in them are enough to file them. */
function tagOf(r: LifeEntry): string {
  if (r.tag) return r.tag;
  const t = r.text.en.toLowerCase();
  if (/married|born|died|child|son|daughter|betroth|widow/.test(t)) return 'family';
  if (/examination|appointed|promoted|office|post/.test(t)) return 'career';
  if (/nyang|shipment|estate/.test(t)) return 'wealth';
  return 'all';
}

function Conf({ c }: { c: Confidence }) {
  const { tx } = useL();
  return <span className={`conf conf-${c}`}>{tx(CONFIDENCE[c])}</span>;
}

/** Master §15 Historical Archive, GSDD Part I §19.3, Part IV §13 and §19, Part V §23. */
export function ArchiveScreen() {
  const g = useGame((s) => s.game)!;
  const { L, tx, lang } = useL();
  const [tab, setTab] = useState<Tab>('life');
  const [tag, setTag] = useState('all');
  const [q, setQ] = useState('');
  const hist = g.campaign.mode === 'historical';
  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());
  const log = [...g.log].sort((a, b) => dateKey(a) - dateKey(b)).filter((r) => (tag === 'all' || tagOf(r) === tag) && match(tx(r.text)));
  const now = dateKey(g.date);
  const annalFor = (y: number, m: number) => ANNALS.find((a) => a.year === y && a.moon === m);
  const history = hist
    ? HISTORY.filter((h) => h.year >= g.campaign.era - 1 && dateKey(h) <= now && !silenced(g, h.year, h.moon)).map((h) => ({ ...h, kind: 'record' as const, cls: null as string | null, conf: (annalFor(h.year, h.moon)?.confidence ?? 'verified') as Confidence }))
    : [];
  const extra = hist
    ? ANNALS.filter((a) => !a.echo && a.year >= g.campaign.era - 1 && dateKey(a) <= now && !silenced(g, a.year, a.moon)).map((a) => ({ year: a.year, moon: a.moon, text: a.text, kind: 'record' as const, cls: null as string | null, conf: a.confidence }))
    : [];
  const merged = [...history, ...extra, ...g.pol.divergence.map((d) => ({ ...d, kind: 'diverge' as const, cls: d.tag ?? 'moderate', conf: 'alternate' as Confidence }))]
    .filter((r) => match(tx(r.text)))
    .sort((a, b) => dateKey(a) - dateKey(b));
  const when = (r: { year: number; moon: number }) => `${tx(yearNumber(g, r.year))}${lang === 'ko' ? ` ${r.moon}월` : `, moon ${r.moon}`}`;
  const yr = g.date.year;
  const period = hist ? periodOf(yr) : null;

  const tabs: [Tab, string][] = [
    ['life', L('Life record', '행장')], ['bio', L('Biography', '전기')], ['docs', L('Documents', '문서')], ['lives', L('Family lives', '가문의 삶')],
    ['kingdom', L('The kingdom', '나라의 기록')], ['kings', L('Monarchs', '역대 임금')], ['figures', L('Figures', '인물')],
    ['state', L('Institutions & law', '제도와 법')], ['places', L('Places', '장소')], ['sources', L('Sources', '전거')],
  ];
  return (
    <main className="paper-screen">
      <Fibre seed={8} />
      <RecordsBar current="archive" />
      <div className="wrap kit-wrap">
        <h1 className="kit-title">{L('The archive', '사록')} <span className="ko" lang="ko">史錄</span></h1>
        <Tabs<Tab> label={L('Sections', '구역')} value={tab} onChange={setTab} tabs={tabs} />
        {['life', 'kingdom', 'figures'].includes(tab) && (
          <label className="kit-search">
            <span className="sr-only">{L('Search', '검색')}</span>
            <input type="search" value={q} placeholder={L('Search the archive', '사록 검색')} onChange={(e) => setQ(e.currentTarget.value)} />
          </label>
        )}
        {tab === 'life' && (
          <Card title={L('Life record', '행장')} ko="行狀">
            <div className="kit-actions" role="group" aria-label={L('Filter', '분류')}>
              {TAGS.map(([id, en, ko]) => <button key={id} type="button" className="mini-chip kit-focus" aria-pressed={tag === id} onClick={() => setTag(id)}>{L(en, ko)}</button>)}
            </div>
            <ol className="kit-timeline">
              {log.map((r, i) => <li key={i} className={r.historical ? 'hist' : ''}><span className="kit-sub">{when(r)}</span><span>{tx(r.text)}</span></li>)}
              {log.length === 0 && <li><span className="kit-note">{L('Nothing recorded under this heading yet.', '이 항목에는 아직 기록이 없다.')}</span></li>}
            </ol>
          </Card>
        )}
        {tab === 'bio' && (
          <Card title={L('A biography', '전기')} ko="傳">
            <p className="kit-note">{L('Written only from what happened in this campaign.', '이 캠페인에서 실제로 일어난 일만으로 썼다.')}</p>
            <div className="bio">{biography(g).map((p, i) => <p key={i}>{tx(p)}</p>)}</div>
          </Card>
        )}
        {tab === 'docs' && (
          <Card title={L('Official documents', '문서함')} ko="文書">
            <p className="kit-note">{L('Certificates, deeds and royal letters issued to you are kept here.', '당신에게 내려진 교지와 증서, 문기를 보관한다.')}</p>
            <div className="docs">
              {[...g.docs].reverse().map((d) => (
                <article key={d.id} className="doc-cert">
                  <span className="doc-seal ko" lang="ko" aria-hidden="true">{d.seal}</span>
                  <h4>{tx(d.title)}</h4>
                  <p>{tx(d.body)}</p>
                  <p className="kit-sub">{when(d)}</p>
                </article>
              ))}
              {g.docs.length === 0 && <p className="kit-note">{L('No documents yet. Pass an examination, take office or buy land, and the papers will come.', '아직 문서가 없다. 과거에 급제하거나 관직에 오르거나 땅을 사면 문서가 생긴다.')}</p>}
            </div>
          </Card>
        )}
        {tab === 'lives' && (
          <Card title={L('Lives of the family', '가문의 삶')} ko="家乘">
            <ol className="kit-timeline">
              {g.lives.map((l, i) => (
                <li key={i}><span className="kit-sub">{L(`Generation ${i + 1}`, `${i + 1}대`)} · {l.born}–{l.died ?? '?'}</span><span><b>{tx(l.name)}</b>. {tx(l.summary)}</span></li>
              ))}
              <li className="div"><span className="kit-sub">{L(`Generation ${g.generation}`, `${g.generation}대`)} · {g.player.birthYear}–</span><span><b>{tx({ en: `${g.player.surname.en} ${g.player.given.en}`, ko: `${g.player.surname.ko ?? ''}${g.player.given.ko ?? ''}` })}</b>. {L('The life you are living now.', '지금 살고 있는 삶.')}</span></li>
            </ol>
          </Card>
        )}
        {tab === 'kingdom' && (
          <Card title={L('Annals of the reign', '실록')} ko="實錄">
            <p className="kit-note">{hist
              ? L('Recorded history is shown with how well it is attested. Where this campaign has changed it, the entry is marked with the class of change.', '기록된 역사는 사료의 확실성과 함께 싣고, 이 캠페인에서 바뀐 일은 변화의 정도와 함께 표시했다.')
              : L('An alternative Joseon: its history is what happens in it.', '또 하나의 조선. 이곳의 역사는 이곳에서 일어나는 일이다.')}</p>
            {period && <p className="kit-note"><b>{tx(period.name)}</b> ({period.from}–{period.to}): {tx(period.text)}</p>}
            <ol className="kit-timeline">
              {merged.map((r, i) => (
                <li key={i} className={r.kind === 'diverge' ? 'div' : 'hist'}>
                  <span className="kit-sub">{when(r)} {r.kind === 'diverge' ? <span className="conf conf-alternate">{tx(DIVERGENCE_NAMES[(r.cls as DivergenceClass) in DIVERGENCE_NAMES ? (r.cls as DivergenceClass) : 'moderate'])}</span> : <Conf c={r.conf} />}</span>
                  <span>{tx(r.text)}</span>
                </li>
              ))}
              {merged.length === 0 && <li><span className="kit-note">{L('No great events yet.', '아직 큰일은 없다.')}</span></li>}
            </ol>
          </Card>
        )}
        {tab === 'kings' && (
          <Card title={L('The monarchs', '역대 왕')} ko="王代">
            <p className="kit-note">{L(`Reigning now: ${rulerOf(g).title.en}.`, `지금 재위: ${rulerOf(g).title.ko}.`)} <Conf c="verified" /> {L('names and reign dates;', '왕명과 재위 연도;')} <Conf c="well-supported" /> {L('character and policies.', '성품과 정책.')}</p>
            <div className="kings">
              {KINGS.map((k, i) => {
                const m = MONARCHS[i];
                const next = KINGS[i + 1];
                const cur = hist && !g.pol.rulers.length && k.from[0] <= yr && (!next || next.from[0] > yr);
                return (
                  <details key={i} className={'king' + (cur ? ' cur' : '')} open={cur}>
                    <summary><span className="kit-sub">{k.from[0]}–{next ? next.from[0] : 1897}</span> {tx(k.title)}{cur ? ` · ${L('reigning', '재위 중')}` : ''}</summary>
                    {m && <Facts items={[
                      [L('Personal name', '이름'), tx(m.personal)], [L('Lived', '생몰'), `${m.born}–${m.died}`],
                      [L('Lineage', '계보'), tx(m.lineage)], [L('Character', '성품'), tx(m.traits)], [L('Reign', '치적'), tx(m.policies)],
                    ]} />}
                  </details>
                );
              })}
            </div>
            {g.pol.rulers.length > 0 && (
              <ol className="kit-timeline">
                {g.pol.rulers.map((r, i) => <li key={'alt' + i} className="div"><span className="kit-sub">{L('from', '부터')} {Math.floor(r.from / 360)} <Conf c="alternate" /></span><span>{tx(r.title)}{r.player ? ` · ${L('you', '당신')}` : ''}</span></li>)}
              </ol>
            )}
          </Card>
        )}
        {tab === 'figures' && (
          <Card title={L('Figures of Joseon', '조선의 인물')} ko="人物">
            <p className="kit-note">{L('Historical people keep their documented lives. Any meeting with them in play is a reconstruction; they are given no invented words.', '역사 인물은 기록된 삶을 그대로 따른다. 게임 속 만남은 재구성이며, 지어낸 말을 그들의 입에 넣지 않는다.')}</p>
            <div className="figures">
              {FIGURES.filter((f) => match(tx(f.name) + tx(f.role))).map((f) => {
                const living = hist && yr >= f.born && yr <= f.died;
                return (
                  <article key={f.id} className={'figure' + (living ? ' alive' : '')}>
                    <h4>{tx(f.name)} <span className="kit-sub">{f.born}–{f.died}</span></h4>
                    <p className="kit-sub">{tx(f.role)} <Conf c={f.confidence} /></p>
                    <p>{tx(f.text)}</p>
                    {living && <p className="kit-sub">{L('Living in this year.', '지금 살아 있다.')}</p>}
                  </article>
                );
              })}
            </div>
          </Card>
        )}
        {tab === 'state' && (
          <>
            <Card title={L('Institutions this year', '올해의 관청')} ko="官制">
              <ul className="kit-list">
                {INSTITUTIONS.filter((i) => (i.from ?? 0) <= yr && (i.to ?? 9999) >= yr).map((i) => <li key={i.id}><span><b>{tx(i.name)}</b>{i.from ? <span className="kit-in"> {i.from}–{i.to ?? ''}</span> : null}</span><span>{tx(i.role)}</span></li>)}
              </ul>
            </Card>
            <Card title={L('Laws and rules of the period', '시대의 법제')} ko="法制">
              <ul className="kit-list">
                {RULES.map((r) => {
                  const on = !hist || ruleActive(r.id, yr);
                  return <li key={r.id} className={on ? '' : 'off'}><span><b>{tx(r.name)}</b> <span className="kit-in">{r.from}–{r.to}</span> <Conf c={r.confidence} />{on ? '' : <span className="kit-in"> · {L('not in force this year', '올해는 시행되지 않음')}</span>}</span><span>{tx(r.text)}</span></li>;
                })}
              </ul>
            </Card>
            <Card title={L('Factions through the dynasty', '붕당의 흐름')} ko="朋黨">
              <ul className="kit-list">
                {FACTION_PROFILES.map((f) => {
                  const on = hist && yr >= f.from && yr <= f.to;
                  return <li key={f.id} className={on ? 'on' : ''}><span><b>{tx(f.name)}</b> <span className="kit-in">{f.from}–{f.to}{on ? ` · ${L('active now', '지금 활동')}` : ''}</span></span><span>{tx(f.text)} {L('Leading figures:', '주요 인물:')} {tx(f.leaders)}. {L('Base:', '기반:')} {tx(f.base)}.</span></li>;
                })}
              </ul>
            </Card>
            <Card title={L('Periods', '시대 구분')} ko="時代">
              <ul className="kit-list">{PERIODS.map((p) => <li key={p.id} className={period?.id === p.id ? 'on' : ''}><span><b>{tx(p.name)}</b> <span className="kit-in">{p.from}–{p.to}</span></span><span>{tx(p.text)}</span></li>)}</ul>
            </Card>
          </>
        )}
        {tab === 'places' && (
          <Card title={L('Places in history', '역사 속 장소')} ko="地誌">
            <ul className="kit-list">
              {PLACES_HISTORY.map((p, i) => {
                const exists = !hist || (yr >= p.from && (p.to === null || yr <= p.to));
                return <li key={i} className={exists ? '' : 'off'}><span><b>{tx(p.name)}</b> <span className="kit-in">{p.from}{p.to ? `–${p.to}` : ''}{exists ? '' : L(' · not standing this year', ' · 올해는 없음')}</span></span><span>{tx(p.text)}</span></li>;
              })}
            </ul>
          </Card>
        )}
        {tab === 'sources' && (
          <Card title={L('Sources and evidence', '전거와 근거')} ko="典據">
            <p className="kit-note">{L('Historical content is classified by how well it is attested (GSDD Part IV §13):', '역사 내용은 근거의 확실성에 따라 분류했다:')}</p>
            <ul className="kit-list">
              {(Object.keys(CONFIDENCE) as Confidence[]).map((c) => <li key={c}><Conf c={c} /></li>)}
            </ul>
            <p className="kit-note">{L('Standard references used:', '참고한 주요 전거:')}</p>
            <ul className="kit-list">{Object.values(SOURCES).map((s, i) => <li key={i}>{tx(s)}</li>)}</ul>
            <p className="kit-note">{L('Annal categories:', '실록 분류:')} {Object.values(CATEGORY_NAMES).map(tx).join(', ')}. {L('Dates and summaries should be reviewed by a historian before release.', '연대와 요약은 출시 전 역사학자의 검토가 필요하다.')}</p>
          </Card>
        )}
      </div>
    </main>
  );
}

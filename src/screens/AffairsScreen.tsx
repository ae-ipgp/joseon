import { useState } from 'react';
import { useGame } from '../store/game';
import { Fibre } from '../ui/parts';
import { RecordsBar } from './RecordsBar';
import { Btn, Card, Facts, Meter, Tabs, fmt, useAct, useL } from '../ui/kit';
import { EDU_FIELDS, QUALS, eduBand } from '../content/attributes';
import { INSTITUTIONS, POSTS, conflictIn, institutionById, postById } from '../content/government';
import { provinceById } from '../content/economy';
import { examBar, examChance, examHeld, focusOf } from '../engine/character';
import {
  DECREES, royalTitle, broker, decree, decreeBar, dominant, factionGathering, factionLeader, factionMembers, heirEligible, heirSeat,
  holderOf, isMonarch, joinSide, nameHeir, postOf, seekBar, seekChance, seekPost, setTax, sideName, tierName,
} from '../engine/politics';
import { LINES, OUTCOMES, appeal, appealBar, appealChance, follow, lineBar, reliability, submit, weights } from '../engine/justice';
import { factionsOf, playerAge, rulerOf } from '../engine/time';
import { clone } from '../engine/world';
import type { Game } from '../model/schemas';
import { monarchNow } from '../engine/chronicle2';
import { BRANCHES, branchBar, branchOf, setBranch, type Branch } from '../engine/culture';
import { abdicate, abdicateBar, abdicationHeir, decideMemo, fxWords, lineOfSuccession, memoBar, memoDef, reignWords } from '../engine/reign';
import { figureBar, figuresNow, seekFigure } from '../engine/social';
import { CONFIDENCE } from '../content/monarchs';
import { factionsActive } from '../content/annals';
import { Tip } from '../ui/Tip';

type Tab = 'career' | 'factions' | 'court' | 'justice';

export function AffairsScreen() {
  const g = useGame((s) => s.game)!;
  const { L } = useL();
  const [tab, setTab] = useState<Tab>(g.player.legal === 'commoner' ? 'justice' : isMonarch(g) ? 'court' : 'career');
  return (
    <main className="paper-screen">
      <Fibre seed={5} />
      <RecordsBar current="affairs" />
      <div className="wrap kit-wrap">
        <h1 className="kit-title">{L('Court & career', '조정과 출사')} <span className="ko" lang="ko">朝廷</span></h1>
        <Tabs<Tab> label={L('Sections', '구역')} value={tab} onChange={setTab} tabs={[
          ['career', L('Career', '관직')], ['factions', L('Factions', '당파')], ['court', isMonarch(g) ? L('Governance', '국정') : L('Royal court', '왕실')], ['justice', L('Inquiries', '조사')],
        ]} />
        <Tip id="affairs" en="Posts follow vacancies and backing. In the historical campaign the institutions, factions and laws change with the year: the archive explains each." ko="관직은 빈자리와 천거에 달려 있다. 역사 캠페인에서는 관청, 붕당, 법이 해마다 달라지며 사록에 각각 설명이 있다." />
        {tab === 'career' && <Career g={g} />}
        {tab === 'factions' && <Factions g={g} />}
        {tab === 'court' && <Court g={g} />}
        {tab === 'justice' && <Justice g={g} />}
      </div>
    </main>
  );
}

function Career({ g }: { g: Game }) {
  const { L, tx } = useL();
  const act = useAct();
  const P = g.player;
  const post = postOf(g);
  const held = examHeld(g);
  const civBar = examBar(g, 'munkwa');
  const milBar = examBar(g, 'mukwa');
  const focus = focusOf(P);
  const setFocus = (i: number) => act((x) => {
    const y = clone(x);
    y.player.edu._focus = i;
    return { game: y, note: null };
  });
  return (
    <div className="kit-grid">
      <Card title={L('Education', '교육')} ko="學業">
        {EDU_FIELDS.map((f, i) => (
          <div key={f.id} className="kit-row">
            <Meter label={`${tx(f.name)} · ${tx(eduBand(P.edu[f.id] ?? 0))}`} value={P.edu[f.id] ?? 0} note={tx(f.text)} tone="jade" />
            <button type="button" className="mini-chip kit-focus" aria-pressed={focus.id === f.id} onClick={() => setFocus(i)}>{focus.id === f.id ? L('Focus', '집중') : L('Make focus', '집중하기')}</button>
          </div>
        ))}
        <p className="kit-note">{L('A child studies the focus every season; study at home, the Academy and the offices also counts.', '아이는 철마다 집중 분야를 공부한다. 집, 성균관, 관아에서 한 공부도 모두 쌓인다.')}</p>
      </Card>
      <Card title={L('Examinations', '과거')} ko="科擧">
        <Facts items={[
          [L('This year', '올해'), held === 'regular' ? L('A regular examination (every third year)', '식년시가 열린다 (3년마다)') : held === 'special' ? L('A special examination', '별시가 열린다') : L('No examination', '과거 없음')],
          [L('Qualifications', '자격'), P.quals.length ? P.quals.map((q) => tx(QUALS[q]?.name)).join(', ') : L('None yet', '아직 없음')],
        ]} />
        <p className="kit-note">{civBar && milBar ? (civBar.en === milBar.en ? tx(civBar) : `${tx(civBar)} ${tx(milBar)}`) : L(`Chance in the civil examination now: about ${Math.round(examChance(g, 'munkwa', 'safe') * 100)}%. Military: about ${Math.round(examChance(g, 'mukwa', 'military') * 100)}%. The examination opens in spring at the Academy.`, `지금 문과 합격 가능성 약 ${Math.round(examChance(g, 'munkwa', 'safe') * 100)}%, 무과 약 ${Math.round(examChance(g, 'mukwa', 'military') * 100)}%. 과거는 봄에 성균관에서 열린다.`)}</p>
      </Card>
      <Card title={L('Your post', '현재 관직')} ko="官職">
        {post ? (
          <>
            <Facts items={[
              [L('Post', '관직'), tx(post.title)], [L('Grade', '품계'), tx(post.grade)],
              [L('Institution', '관아'), tx(institutionById(post.inst).name)], [L('Step', '단계'), `${tx(tierName(post.track, post.tier))} (${post.tier}/5)`],
              [L('Duty', '맡은 일'), tx(post.duty)], [L('Service this year', '올해 근무 평가'), String(P.service)],
            ]} />
            <p className="kit-note">{L('Attend to duties at the Palace Offices to build your record. Promotion is reviewed at year’s end and is never certain.', '궁궐 관아에서 맡은 일을 보아 근무 평가를 쌓아라. 승진은 연말에 심사하며 장담할 수 없다.')}</p>
          </>
        ) : <p className="kit-note">{P.royal !== 'none' ? L('Members of the royal household hold no ordinary office.', '왕실 사람은 보통 관직을 맡지 않는다.') : L('You hold no office. Pass an examination, then seek a vacancy below.', '관직이 없다. 과거에 급제한 뒤 아래의 빈자리를 구하라.')}</p>}
      </Card>
      {P.office?.track === 'military' && (
        <Card title={L('Your posting', '보직')} ko="兵種">
          <p className="kit-note">{L('Where an officer serves shapes him. A posting lasts at least a year; field, naval and border service help in battle, and the guard keeps you near the king.', '어디서 복무하느냐가 무관을 만든다. 보직은 적어도 한 해는 간다. 육군·수군·변방 복무는 전투에 도움이 되고, 금군은 임금 곁에 머물게 한다.')}</p>
          {(Object.keys(BRANCHES) as Branch[]).map((b) => {
            const why = branchBar(g, b);
            const mine = branchOf(g) === b;
            return (
              <div key={b} className="kit-line">
                <div><span><strong>{tx(BRANCHES[b].name)}</strong>{mine ? <span className="kit-in"> · {L('your posting', '현재 보직')}</span> : null}</span><span className="kit-sub">{tx(BRANCHES[b].text)}</span></div>
                <Btn why={why && !mine ? tx(why) : null} disabled={mine} onClick={() => act((x) => setBranch(x, b))}>{mine ? L('Serving', '복무 중') : L('Request', '청한다')}</Btn>
              </div>
            );
          })}
        </Card>
      )}
      <Card title={L('Vacancies', '빈자리')} ko="闕員">
        {g.pol.vacancies.length === 0 && <p className="kit-note">{L('No posts are open this season. The Ministry of Personnel posts new ones in spring and autumn.', '이번 철에는 빈자리가 없다. 이조는 봄과 가을에 빈자리를 낸다.')}</p>}
        {g.pol.vacancies.map((v) => {
          const p = postById(v.post)!;
          const why = seekBar(g, v.post);
          return (
            <div key={v.post} className="kit-line">
              <div><strong>{tx(p.title)}</strong><span className="kit-sub">{tx(p.grade)} · {tx(institutionById(p.inst).name)}</span></div>
              <div className="kit-line-act">
                {!why && <span className="kit-sub">{L(`about ${Math.round(seekChance(g, v.post) * 100)}%`, `약 ${Math.round(seekChance(g, v.post) * 100)}%`)}</span>}
                <Btn why={why ? tx(why) : null} onClick={() => act((x) => seekPost(x, v.post))}>{L('Seek it', '청하기')}</Btn>
              </div>
            </div>
          );
        })}
      </Card>
      <Card title={L('Government of Joseon', '조선의 관제')} ko="官制">
        <ul className="kit-list">
          {INSTITUTIONS.filter((i) => (i.from ?? 0) <= g.date.year && (i.to ?? 9999) >= g.date.year).map((inst) => {
            const posts = POSTS.filter((p) => p.inst === inst.id && (p.from ?? 0) <= g.date.year && (p.to ?? 9999) >= g.date.year);
            return (
              <li key={inst.id}>
                <strong>{tx(inst.name)}</strong><span className="kit-sub">{tx(inst.role)}</span>
                {posts.map((p) => {
                  const h = holderOf(g, p);
                  return <span key={p.id} className="kit-post">{tx(p.title)} — {h ? (h.player ? <em>{tx(h.who)}</em> : tx(h.who)) : <em className="kit-vacant">{L('vacant', '공석')}</em>}</span>;
                })}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function Factions({ g }: { g: Game }) {
  const { L, tx } = useL();
  const act = useAct();
  const f = factionsOf(g);
  const top = dominant(g);
  const sides: ('A' | 'B')[] = ['A', 'B'];
  return (
    <div className="kit-grid">
      {sides.map((s) => {
        const lead = factionLeader(g, s);
        const members = factionMembers(g, s);
        return (
          <Card key={s} title={tx(sideName(g, s))} ko={s === top ? '執權' : '在野'} aside={<span className="mini-chip">{s === top ? L('In power', '집권') : L('Out of power', '재야')}</span>}>
            <Meter label={L('Influence at court', '조정 내 영향력')} value={g.pol.inf[s]} tone={s === 'A' ? 'wine' : 'jade'} />
            <Facts items={[
              [L('Leader', '영수'), lead ? tx(lead.name) : L('No one of note', '이름난 이 없음')],
              [L('Members you know of', '아는 인사'), members.length ? members.slice(0, 5).map((m) => tx(m.name)).join(', ') : '—'],
            ]} />
            <Btn disabled={g.pol.side === s || !!g.flags['side-changed'] || g.player.legal === 'commoner'} onClick={() => act((x) => joinSide(x, s))}>{L('Join them', '이 당에 들기')}</Btn>
          </Card>
        );
      })}
      {g.campaign.mode === 'historical' && factionsActive(g.date.year).length > 0 && (
        <Card title={L('The factions of this age', '이 시대의 붕당')} ko="朋黨">
          <ul className="kit-list">
            {factionsActive(g.date.year).map((p) => <li key={p.id}><span><strong>{tx(p.name)}</strong> <span className="kit-in">{p.from}–{p.to} · {tx(p.leaders)}</span></span><span>{tx(p.text)} {L('Base:', '기반:')} {tx(p.base)}.</span></li>)}
          </ul>
          <p className="kit-note">{L('In play the court is reduced to the side in power and the side out of it; these are the historical groups behind them.', '게임에서는 조정을 집권 세력과 재야 세력의 둘로 줄였다. 그 뒤에 있는 실제 붕당이 이들이다.')}</p>
        </Card>
      )}
      <Card title={L('Your position', '나의 입장')} ko="立場">
        <Facts items={[
          [L('Your side', '소속'), tx(sideName(g, g.pol.side))],
          [L('Family tradition', '가문의 전통'), g.house.faction === 'A' ? tx(f.a) : g.house.faction === 'B' ? tx(f.b) : '—'],
          [L('Royal favour', '왕의 총애'), String(g.player.favour)],
        ]} />
        {g.pol.side !== 'neutral' && <Meter label={L('Standing within the faction', '당내 입지')} value={g.pol.standing} />}
        <div className="kit-actions">
          <Btn disabled={g.pol.side === 'neutral' || !!g.flags['side-changed']} onClick={() => act((x) => joinSide(x, 'neutral'))}>{L('Declare for the throne alone', '오직 임금 편에 서기')}</Btn>
          <Btn disabled={g.pol.side === 'neutral' || !!g.flags.gathered || g.player.legal === 'commoner'} onClick={() => act(factionGathering)}>{L('Attend a faction gathering', '당파 모임에 나가기')}</Btn>
          <Btn disabled={!!g.flags.brokered || (g.player.attrs.diplomacy ?? 0) < 55} onClick={() => act(broker)}>{L('Broker between the factions', '두 당파 사이를 중재하기')}</Btn>
        </div>
        <p className="kit-note">{L('Neutrality protects you in a purge but slows your rise. Changing sides costs honour; you may change once a year. Brokering needs diplomacy 55.', '중립은 사화 때 몸을 지켜 주지만 출세는 더디다. 당을 바꾸면 명예를 잃으며, 한 해에 한 번만 바꿀 수 있다. 중재에는 외교술 55가 필요하다.')}</p>
      </Card>
    </div>
  );
}

function Court({ g }: { g: Game }) {
  const { L, tx } = useL();
  const act = useAct();
  const [confirmAbdicate, setConfirmAbdicate] = useState(false);
  const P = g.player;
  const king = g.npcs.king;
  const ruler = rulerOf(g);
  const royals = ['grand-queen-dowager', 'queen-dowager', 'queen-consort', 'crown-prince', 'crown-princess', 'royal-consort', 'princess', 'elder-prince', 'younger-prince']
    .map((id) => g.npcs[id]).filter((n) => n && n.alive && !n.away);
  const s = g.pol.state;
  const war = conflictIn(g.date.year, g.flags);
  return (
    <div className="kit-grid">
      <Card title={L('The throne', '보위')} ko="寶位">
        <Facts items={[
          [L('Reigning', '재위'), P.royal === 'king' ? L('You', '당신') : tx(ruler.title)],
          [L('Age', '나이'), P.royal === 'king' ? String(playerAge(g)) : king ? String(g.date.year - king.birthYear) : '—'],
          [L('Succession', '후계'), heirSeat(g) ? (P.royal === 'crownPrince' ? L('You are the heir', '당신이 세자다') : L('No heir is named', '세자가 책봉되지 않음')) : L('A crown prince is named', '세자가 책봉됨')],
          [L('At war', '전쟁'), war ? tx(war.name) : L('At peace', '평시')],
        ]} />
        {war && <p className="kit-note">{tx(war.text)}</p>}
      </Card>
      {(() => {
        const m = monarchNow(g);
        return m ? (
          <Card title={L('The monarch', '임금')} ko="君主" aside={<span className="mini-chip">{tx(CONFIDENCE['well-supported'])}</span>}>
            <Facts items={[
              [L('Temple name', '묘호'), tx(m.temple)], [L('Personal name', '이름'), tx(m.personal)],
              [L('Reign', '재위'), `${m.from}–${m.to}`], [L('Lineage', '계보'), tx(m.lineage)],
            ]} />
            <p className="kit-note">{tx(m.traits)}</p>
            <p className="kit-note">{tx(m.policies)}</p>
          </Card>
        ) : null;
      })()}
      {figuresNow(g).length > 0 && (
        <Card title={L('Figures of the age', '이 시대의 인물')} ko="人物">
          <p className="kit-note">{L('Historical people of this year. Calling on them is a reconstructed meeting: you learn from their field; no words are put in their mouths.', '올해의 역사 인물들. 찾아가는 만남은 재구성이다. 그들의 분야에서 배우되, 지어낸 말을 그들의 입에 넣지 않는다.')}</p>
          {figuresNow(g).map((f) => {
            const why = figureBar(g, f.id);
            return (
              <div key={f.id} className="kit-line">
                <div><span><strong>{tx(f.name)}</strong> · {tx(f.role)}</span><span className="kit-sub">{tx(f.text)}</span></div>
                <Btn why={why ? tx(why) : null} onClick={() => act((x) => seekFigure(x, f.id), 'paper')}>{L('Seek them out', '찾아가기')}</Btn>
              </div>
            );
          })}
        </Card>
      )}
      <Card title={L('The royal household', '왕실')} ko="王室">
        <ul className="kit-list">{royals.map((n) => <li key={n!.id}><strong>{tx(n!.name)}</strong><span className="kit-sub">{tx(n!.role)}</span></li>)}</ul>
      </Card>
      <Card title={L('Your royal standing', '왕실 안의 나')} ko="身位">
        <Facts items={[
          [L('Lineage', '혈통'), P.lineage === 'prince' ? L('Of the blood royal', '왕의 직계') : P.lineage === 'descendant' ? L('Descendant of a former king', '선왕의 후손') : P.lineage === 'disputed' ? L('A disputed claim', '논란 있는 혈통') : L('Not of royal blood', '왕족 아님')],
          [L('Place', '지위'), royalTitle(g) ? tx(royalTitle(g)) : '—'],
          [L('Legitimacy', '정통성'), P.lineage === 'none' && P.royal === 'none' ? '—' : String(P.legitimacy)],
        ]} />
        <p className="kit-note">{heirEligible(g)
          ? L('You could be named heir if the seat is empty and the king trusts you: legitimacy 55 and favour 55.', '세자 자리가 비어 있고 임금의 신임을 얻으면 세자가 될 수 있다. 정통성 55, 총애 55가 필요하다.')
          : P.gender === 'woman' && P.royal === 'none' && P.legal === 'yangban' ? L('An unmarried daughter of a good house may be called to a royal selection when the crown prince takes a wife.', '세자가 배필을 맞을 때, 혼인하지 않은 양가의 딸은 간택에 불려 갈 수 있다.')
          : L('Royal descent and the right to rule are not the same thing.', '왕족의 혈통과 다스릴 권리는 같은 것이 아니다.')}</p>
      </Card>
      {s && isMonarch(g) && (
        <>
          <Card title={P.royal === 'regent' ? L('Regency', '섭정') : L('Royal authority', '왕권')} ko="王權">
            <Meter label={L('Royal authority', '왕권')} value={s.authority} tone="wine" />
            <Meter label={L('Stability of the realm', '민심')} value={s.stability} />
            <Meter label={L('Cooperation of the government', '조정 협조')} value={s.cooperation} />
            <Meter label={L('Loyalty of the army', '군심')} value={s.loyalty} />
            <Facts items={[
              [L('State treasury', '국고'), `${fmt(s.treasury)} ${L('nyang', '냥')}`],
              [L('Privy purse', '내탕금'), `${fmt(s.privy)} ${L('nyang', '냥')}`],
              ...(s.regencyUntil ? [[L('Regency ends', '섭정 종료'), String(s.regencyUntil)] as [string, string]] : []),
            ]} />
            <p className="label">{L('Taxation', '세금')}</p>
            <div className="seg" role="group" aria-label={L('Taxation', '세금')}>
              {(['light', 'usual', 'heavy'] as const).map((t) => <button key={t} type="button" aria-pressed={s.tax === t} onClick={() => act((x) => setTax(x, t))}>{t === 'light' ? L('Light', '가볍게') : t === 'heavy' ? L('Heavy', '무겁게') : L('Usual', '예전대로')}</button>)}
            </div>
          </Card>
          <Card title={L('Decrees', '어명')} ko="王命">
            {DECREES.map((d) => {
              const why = decreeBar(g, d.id);
              return (
                <div key={d.id} className="kit-line">
                  <div><strong>{tx(d.name)}</strong><span className="kit-sub">{tx(d.text)}{d.cost > 0 ? ` · ${fmt(d.cost)} ${L('nyang', '냥')}` : ''}</span></div>
                  <Btn why={why ? tx(why) : null} onClick={() => act((x) => decree(x, d.id))}>{L('Decree', '명하기')}</Btn>
                </div>
              );
            })}
            {P.royal === 'king' && (
              <>
                <p className="label" style={{ marginTop: 16 }}>{L('Name an heir', '세자 책봉')}</p>
                {Object.values(g.npcs).filter((n) => n.alive && n.kin === 'child' && n.parents.includes('player')).map((c) => (
                  <div key={c.id} className="kit-line"><span>{tx(c.name)} ({g.date.year - c.birthYear})</span><Btn disabled={s.heir === c.id} onClick={() => act((x) => nameHeir(x, c.id))}>{s.heir === c.id ? L('Heir', '세자') : L('Name heir', '책봉')}</Btn></div>
                ))}
              </>
            )}
          </Card>
          <Card title={L('Memorials before the throne', '올라온 상소')} ko="上疏">
            <p className="kit-note">{L('Proposals from the ministries. Approve, refuse, or put one off for a season; each choice has consequences.', '각 관청에서 올린 건의다. 윤허하거나 물리치거나 한 철 미룰 수 있으며, 어느 쪽이든 결과가 따른다.')}</p>
            {(s.memos ?? []).length === 0 && <p className="kit-note">{L('No memorials are waiting. More arrive each season.', '기다리는 상소가 없다. 철마다 새로 올라온다.')}</p>}
            {(s.memos ?? []).map((m) => {
              const d = memoDef(m.def);
              if (!d) return null;
              return (
                <div key={m.id} className="memo">
                  <p className="kit-sub">{tx(d.from)}{m.delayed ? ` · ${L('put off once', '한 번 미룸')}` : ''}</p>
                  <h4>{tx(d.title)}</h4>
                  <p>{tx(d.text)}</p>
                  <p className="kit-sub">{L('If approved', '윤허하면')}: {tx(fxWords(d.approve))} · {L('If refused', '물리치면')}: {tx(fxWords(d.reject))}</p>
                  <div className="kit-actions">
                    {(['approve', 'reject', 'delay'] as const).map((c) => {
                      const why = memoBar(g, m.id, c);
                      return <Btn key={c} tone={c === 'approve' ? 'wine' : 'line'} why={why ? tx(why) : null} onClick={() => act((x) => decideMemo(x, m.id, c))}>{c === 'approve' ? L('Approve', '윤허') : c === 'reject' ? L('Refuse', '불윤') : L('Put off', '미루기')}</Btn>;
                    })}
                  </div>
                </div>
              );
            })}
          </Card>
          <Card title={L('The reign so far', '치세의 기록')} ko="治世">
            <Facts items={reignWords(g).map((w) => [tx(w.name), tx(w.text)] as [string, string])} />
            {P.royal === 'king' && (() => {
              const why = abdicateBar(g);
              const h = abdicationHeir(g);
              return (
                <div style={{ marginTop: 14 }}>
                  <p className="kit-note">{L('A monarch may step down for the heir and live on as the retired king (sangwang).', '임금은 후계에게 양위하고 상왕으로 물러날 수 있다.')}</p>
                  {!confirmAbdicate ? (
                    <Btn why={why ? tx(why) : null} onClick={() => setConfirmAbdicate(true)}>{h ? L(`Abdicate for ${h.name.en}`, `${h.name.ko ?? h.name.en}에게 양위`) : L('Abdicate', '양위')}</Btn>
                  ) : (
                    <div className="kit-actions">
                      <Btn tone="wine" onClick={() => { act((x) => abdicate(x)); setConfirmAbdicate(false); }}>{L('Yes, hand over the seal', '그렇다, 국새를 넘긴다')}</Btn>
                      <Btn onClick={() => setConfirmAbdicate(false)}>{L('Not yet', '아직 아니다')}</Btn>
                    </div>
                  )}
                </div>
              );
            })()}
          </Card>
        </>
      )}
      {(P.legal === 'royal' || isMonarch(g) || g.npcs['crown-prince']?.alive) && (
        <Card title={L('The line of succession', '왕위 계승')} ko="繼統">
          <ul className="kit-list">
            {lineOfSuccession(g).map((c, i) => <li key={c.id + i} className={c.id === 'player' ? 'on' : ''}><span><b>{tx(c.name)}</b></span><span>{tx(c.place)}</span></li>)}
          </ul>
          <p className="kit-note">{tx(lineOfSuccession(g)[0]?.basis ?? { en: '' })}</p>
        </Card>
      )}
    </div>
  );
}

function Justice({ g }: { g: Game }) {
  const { L, tx } = useL();
  const act = useAct();
  const d = g.pol.downfall;
  const open = g.pol.inquiries.filter((q) => !q.outcome);
  const closed = g.pol.inquiries.filter((q) => q.outcome);
  const [pick, setPick] = useState<Record<string, string>>({});
  return (
    <div className="kit-grid">
      {g.pol.exile && (
        <Card title={L('Exile', '유배')} ko="流配">
          <p className="kit-note">{L(`You are in exile in ${provinceById(g.pol.exile.province).name.en}. You may not go to the palace or the city until it ends (about ${Math.ceil((g.pol.exile.until - g.dayCount) / 360)} year(s)).`, `${provinceById(g.pol.exile.province).name.ko}에 유배 중이다. 풀려날 때까지(약 ${Math.ceil((g.pol.exile.until - g.dayCount) / 360)}년) 궁궐과 도성에 갈 수 없다.`)}</p>
        </Card>
      )}
      {d && (
        <Card title={L('Your downfall', '몰락')} ko="伸寃">
          <Facts items={[[L('Cause', '사유'), tx(d.cause)], [L('Petitions made', '청원 횟수'), String(d.appeals)]]} />
          <Meter label={L('Proof of what was done to you', '억울함을 밝힐 증거')} value={d.proof} tone="jade" />
          <p className="kit-note">{L(`A petition now would succeed about ${Math.round(appealChance(g) * 100)}% of the time. Proof, friends with standing at court and exposing who brought you down all help. Restoration is never certain, and may be partial.`, `지금 청원하면 성공 가능성은 약 ${Math.round(appealChance(g) * 100)}%다. 증거, 조정에 연줄 있는 벗, 당신을 무너뜨린 자를 밝히는 일이 모두 도움이 된다. 복권은 장담할 수 없고, 일부만 돌아올 수도 있다.`)}</p>
          <Btn tone="wine" why={appealBar(g) ? tx(appealBar(g)) : null} onClick={() => act(appeal, 'paper')}>{L('Strike the petition drum (sinmungo)', '신문고를 울려 청원하기')}</Btn>
        </Card>
      )}
      {open.length === 0 && !d && <Card title={L('Inquiries', '조사')} ko="推鞫"><p className="kit-note">{L('No inquiry is in your hands. Officials of the Inspector-General’s office and the Ministry of Punishments are given them most often; a monarch can order an audit.', '맡은 조사가 없다. 사헌부와 형조 관리가 가장 자주 맡으며, 임금은 감찰을 명할 수 있다.')}</p></Card>}
      {open.map((q) => {
        const w = weights(q);
        const choice = pick[q.id] ?? q.suspects[0];
        return (
          <Card key={q.id} title={tx(q.title)} ko="推問" aside={<span className="mini-chip">{L(`${Math.max(0, Math.ceil((q.due - g.dayCount) / 30))} moons left`, `${Math.max(0, Math.ceil((q.due - g.dayCount) / 30))}달 남음`)}</span>}>
            <p className="label">{L('Suspects', '혐의자')}</p>
            <ul className="kit-list">
              {q.suspects.map((s) => <li key={s}><strong>{tx(g.npcs[s]?.name)}</strong><span className="kit-sub">{tx(g.npcs[s]?.role)} · {L('weight of evidence', '증거의 무게')} {(w[s] ?? 0).toFixed(1)}</span></li>)}
              <li><strong>{L('No one: the charge is false', '아무도 아님: 고발이 거짓')}</strong><span className="kit-sub">{L('weight of evidence', '증거의 무게')} {(w.none ?? 0).toFixed(1)}</span></li>
            </ul>
            <p className="label">{L('Evidence', '증거')}</p>
            {q.clues.length === 0 && <p className="kit-note">{L('Nothing yet. Follow a line of inquiry; each takes the day.', '아직 없다. 조사의 갈래를 따라가라. 갈래마다 하루가 걸린다.')}</p>}
            <ul className="kit-list">{q.clues.map((c) => <li key={c.id}><span>{tx(c.text)}</span><span className="kit-sub">{tx(reliability(c.weight))}</span></li>)}</ul>
            <div className="kit-actions">
              {LINES.map((l) => {
                const why = lineBar(g, q, l.id);
                return <Btn key={l.id} why={why ? tx(why) : null} onClick={() => act((x) => follow(x, q.id, l.id), 'paper')}>{tx(l.name)}</Btn>;
              })}
            </div>
            <p className="label" style={{ marginTop: 14 }}>{L('Submit findings', '결과 보고')}</p>
            <div className="kit-actions">
              <select className="field kit-select" value={choice} onChange={(e) => setPick({ ...pick, [q.id]: e.target.value })} aria-label={L('Accuse', '지목')}>
                {q.suspects.map((s) => <option key={s} value={s}>{tx(g.npcs[s]?.name)}</option>)}
                <option value="none">{L('No one: the charge is false', '아무도 아님: 무고')}</option>
              </select>
              <Btn tone="wine" onClick={() => act((x) => submit(x, q.id, choice))}>{L('Submit', '올리기')}</Btn>
            </div>
            <p className="kit-note">{L('Accusing the wrong person costs honour and makes an enemy. Powerful suspects can obstruct a weak case.', '엉뚱한 사람을 지목하면 명예를 잃고 원수를 만든다. 힘 있는 혐의자는 약한 증거를 뭉갤 수 있다.')}</p>
          </Card>
        );
      })}
      {closed.length > 0 && (
        <Card title={L('Closed inquiries', '종결된 조사')} ko="結案">
          <ul className="kit-list">{closed.map((q) => <li key={q.id}><strong>{tx(q.title)}</strong><span className="kit-sub">{tx(OUTCOMES[q.outcome!])}</span></li>)}</ul>
        </Card>
      )}
    </div>
  );
}


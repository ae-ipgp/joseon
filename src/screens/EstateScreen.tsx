import { useState } from 'react';
import { useGame } from '../store/game';
import { Fibre } from '../ui/parts';
import { RecordsBar } from './RecordsBar';
import { Btn, Card, Facts, Meter, Tabs, fmt, useAct, useL } from '../ui/kit';
import {
  BUILDINGS, BUSINESS_KINDS, DISASTERS, GOODS, LENDERS, PROVINCES, STAFF_ROLES, TRAVEL, WEATHER, buildingById, businessKind, estateKind, provinceById, staffRole,
} from '../content/economy';
import {
  addCapital, askFunds, borrow, buyEstate, canBuild, canJourney, closeBusiness, dismiss, estateIncome, estateOffers, hire, holdsKeys, journey, journeyDays,
  layIn, moveFunds, openBusiness, price, repay, replaceManager, sellEstate, sendCargo, setAim, setCare, setServants, setWage, startBuilding, upkeepOf,
} from '../engine/econ';
import { WEALTH_WORDS } from '../engine/money';
import { yearNumber } from '../engine/time';
import type { Game } from '../model/schemas';

type Tab = 'money' | 'estates' | 'staff' | 'business' | 'provinces';

export function EstateScreen() {
  const g = useGame((s) => s.game)!;
  const { L } = useL();
  const [tab, setTab] = useState<Tab>('money');
  return (
    <main className="paper-screen">
      <Fibre seed={6} />
      <RecordsBar current="estate" />
      <div className="wrap kit-wrap">
        <h1 className="kit-title">{L('House & wealth', '집안 살림')} <span className="ko" lang="ko">家産</span></h1>
        <Tabs<Tab> label={L('Sections', '구역')} value={tab} onChange={setTab} tabs={[
          ['money', L('Finances', '재정')], ['estates', L('Estates', '전장')], ['staff', L('Household', '식솔')], ['business', L('Business & trade', '사업과 교역')], ['provinces', L('Provinces', '팔도')],
        ]} />
        {tab === 'money' && <Money g={g} />}
        {tab === 'estates' && <Estates g={g} />}
        {tab === 'staff' && <Staff g={g} />}
        {tab === 'business' && <Business g={g} />}
        {tab === 'provinces' && <Provinces g={g} />}
      </div>
    </main>
  );
}

function roleText(g: Game, L: (en: string, ko: string) => string) {
  const r = g.econ.role;
  return r === 'head' ? L('You are head of the household and hold its keys.', '당신이 집안의 가장이며 곳간 열쇠를 쥐고 있다.')
    : r === 'admin' ? L('You run the household as its mistress and hold its keys.', '안주인으로서 살림을 맡아 곳간 열쇠를 쥐고 있다.')
      : L('Your father holds the keys. You live on an allowance and may ask him for more.', '아버지께서 곳간 열쇠를 쥐고 계신다. 용돈으로 지내며 더 청할 수는 있다.');
}

function Money({ g }: { g: Game }) {
  const { L, tx } = useL();
  const act = useAct();
  const keys = holdsKeys(g);
  const up = upkeepOf(g);
  const owed = g.econ.debts.reduce((n, d) => n + d.principal, 0);
  return (
    <div className="kit-grid">
      <Card title={L('Purse and treasury', '주머니와 곳간')} ko="財政">
        <Facts items={[
          [L('Your purse', '내 주머니'), `${fmt(g.player.money)} ${L('nyang', '냥')}`],
          [L('Family treasury', '집안 곳간'), `${fmt(g.econ.treasury)} ${L('nyang', '냥')}`],
          [L('Household standing', '살림 형편'), tx(WEALTH_WORDS[g.house.wealth])],
          [L('Family debts', '집안 빚'), owed ? `${fmt(owed)} ${L('nyang', '냥')}` : L('None', '없음')],
          [L('Grain in store', '곳간의 곡식'), L(`${g.econ.stores} season(s)`, `${g.econ.stores}철 분량`)],
        ]} />
        <p className="kit-note">{roleText(g, L)}</p>
        <div className="kit-actions">
          {keys ? (
            <>
              <Btn disabled={g.econ.treasury < 100} onClick={() => act((x) => moveFunds(x, 100), 'coin')}>{L('Draw 100 to your purse', '주머니로 100냥')}</Btn>
              <Btn disabled={g.player.money < 100} onClick={() => act((x) => moveFunds(x, -100), 'coin')}>{L('Put 100 in the treasury', '곳간에 100냥')}</Btn>
              <Btn onClick={() => act(layIn, 'coin')}>{L('Lay in grain', '곡식 들이기')}</Btn>
            </>
          ) : <Btn disabled={!!g.flags['asked-funds']} onClick={() => act(askFunds, 'paper')}>{L('Ask your father for money', '아버지께 돈을 청하기')}</Btn>}
        </div>
      </Card>
      <Card title={L('Each season the house spends', '철마다 드는 살림')} ko="用度">
        <Facts items={[
          [L('Food, clothing, fuel', '식량, 의복, 땔감'), fmt(up.base)], [L('Wages', '품삯'), fmt(up.wages)],
          [L('Upkeep of buildings and land', '건물과 토지 관리'), fmt(up.buildings + up.care)], [L('Spouse and children', '배우자와 자녀'), fmt(up.family)],
          [L('Total', '합계'), `${fmt(up.total)} ${L('nyang', '냥')}`],
        ]} />
        <p className="kit-note">{L('Estates pay in when they produce: farms mostly at the autumn harvest. The steward stops waste; the ancestral rites fall in autumn.', '전장의 수입은 생산될 때 들어온다. 농장은 대부분 가을 추수 때. 집사가 낭비를 막고, 시제는 가을에 든다.')}</p>
      </Card>
      <Card title={L('Debts and lenders', '빚과 돈놀이')} ko="債務">
        {g.econ.debts.map((d) => (
          <div key={d.id} className="kit-line">
            <div><strong>{tx(d.lender)}</strong><span className="kit-sub">{fmt(d.principal)} {L('nyang', '냥')} · {Math.round(d.rate * 100)}% {L('a season', '/철')} · {d.acct === 'house' ? L('family', '집안') : L('yours', '개인')}</span></div>
            <Btn onClick={() => act((x) => repay(x, d.id), 'coin')}>{L('Repay', '갚기')}</Btn>
          </div>
        ))}
        {LENDERS.map((l) => (
          <div key={l.id} className="kit-line">
            <div><strong>{tx(l.name)}</strong><span className="kit-sub">{Math.round(l.rate * 100)}% {L('a season, up to', '/철, 최대')} {fmt(l.max)}</span></div>
            <div className="kit-line-act">
              <Btn onClick={() => act((x) => borrow(x, l.id, 100, 'purse'), 'coin')}>{L('Borrow 100', '100냥 빌리기')}</Btn>
              {keys && <Btn onClick={() => act((x) => borrow(x, l.id, 500, 'house'), 'coin')}>{L('500 for the house', '집안 몫 500냥')}</Btn>}
            </div>
          </div>
        ))}
        <p className="kit-note">{L('Interest is added each season. A ruinous debt brings creditors who force the sale of land.', '이자는 철마다 붙는다. 빚이 지나치면 빚쟁이들이 땅을 팔게 한다.')}</p>
      </Card>
      <Card title={L('The ledger', '장부')} ko="置簿">
        {g.econ.ledger.length === 0 && <p className="kit-note">{L('The first entries are written when the season turns.', '철이 바뀌면 첫 기록이 적힌다.')}</p>}
        {[...g.econ.ledger].reverse().slice(0, 4).map((e, i) => (
          <div key={i} className="kit-ledger">
            <p className="label">{tx(yearNumber(g, e.year))} · {L(`moon ${e.moon}`, `${e.moon}월`)}</p>
            {e.lines.map((l, k) => <div key={k} className="kit-ledger-line"><span>{tx(l.text)}</span><span className={l.d < 0 ? 'neg' : 'pos'}>{l.d ? (l.d > 0 ? '+' : '−') + fmt(Math.abs(l.d)) : '·'}</span></div>)}
          </div>
        ))}
      </Card>
    </div>
  );
}

function Estates({ g }: { g: Game }) {
  const { L, tx } = useL();
  const act = useAct();
  const keys = holdsKeys(g);
  const offers = estateOffers(g);
  const [build, setBuild] = useState<Record<string, string>>({});
  return (
    <div className="kit-grid">
      {g.econ.estates.map((e) => {
        const k = estateKind(e.kind);
        const options = BUILDINGS.filter((b) => b.on.includes(e.kind) && !e.buildings.includes(b.id));
        const sel = build[e.id] ?? options[0]?.id;
        return (
          <Card key={e.id} title={tx(e.name)} ko={e.kind === 'town' ? '本家' : '田莊'} aside={<span className="mini-chip">{tx(provinceById(e.province).name)}</span>}>
            <p className="kit-note">{tx(k.text)}</p>
            <Facts items={[
              [L('Size', '규모'), L(`${e.area} gyeol`, `${e.area}결`)], [L('Value', '값어치'), `${fmt(e.value)} ${L('nyang', '냥')}`],
              ...(k.income ? [[L('This season', '이번 철'), `${fmt(estateIncome(g, e))} ${L('nyang', '냥')}`] as [string, string]] : []),
              [L('Buildings', '건물'), e.buildings.length ? e.buildings.map((b) => tx(buildingById(b)?.name)).join(', ') : '—'],
            ]} />
            <Meter label={L('Condition', '상태')} value={e.condition} tone="jade" />
            {k.income > 0 && <Meter label={L('Productivity', '생산성')} value={e.productivity} />}
            {e.works && <p className="kit-note">{L(`Building: ${buildingById(e.works.id)?.name.en ?? ''}, ${e.works.left} season(s) left.`, `공사 중: ${buildingById(e.works.id)?.name.ko ?? ''}, ${e.works.left}철 남음.`)}</p>}
            {keys && (
              <>
                <p className="label">{L('Maintenance', '관리 비용')}</p>
                <div className="seg" role="group" aria-label={L('Maintenance', '관리 비용')}>
                  {[L('None', '안 함'), L('Usual', '보통'), L('Generous', '넉넉히')].map((n, i) => <button key={i} type="button" aria-pressed={e.care === i} onClick={() => act((x) => setCare(x, e.id, i))}>{n}</button>)}
                </div>
                {options.length > 0 && !e.works && (
                  <div className="kit-actions" style={{ marginTop: 12 }}>
                    <select className="field kit-select" value={sel} onChange={(ev) => setBuild({ ...build, [e.id]: ev.target.value })} aria-label={L('Build', '짓기')}>
                      {options.map((b) => <option key={b.id} value={b.id}>{tx(b.name)} · {fmt(b.cost)} · {tx(b.effect)}</option>)}
                    </select>
                    <Btn disabled={!sel || !canBuild(g, e, sel)} onClick={() => act((x) => startBuilding(x, e.id, sel!), 'coin')}>{L('Build', '짓기')}</Btn>
                  </div>
                )}
                {e.kind !== 'town' && <Btn onClick={() => act((x) => sellEstate(x, e.id), 'coin')}>{L(`Sell for ${fmt(e.value * 0.9)}`, `${fmt(e.value * 0.9)}냥에 팔기`)}</Btn>}
              </>
            )}
          </Card>
        );
      })}
      <Card title={L('Land for sale this year', '올해 나온 땅')} ko="賣物">
        {offers.map((o, i) => (
          <div key={i} className="kit-line">
            <div><strong>{tx(estateKind(o.kind).name)}, {tx(provinceById(o.province).name)}</strong><span className="kit-sub">{L(`${o.area} gyeol`, `${o.area}결`)} · {fmt(o.cost)} {L('nyang', '냥')}{o.why ? ` · ${tx(o.why)}` : ''}</span></div>
            <Btn disabled={!o.ok || !!g.flags[`bought:${g.date.year}:${i}`]} onClick={() => act((x) => buyEstate(x, i), 'coin')}>{L('Buy', '사기')}</Btn>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Staff({ g }: { g: Game }) {
  const { L, tx } = useL();
  const act = useAct();
  const keys = holdsKeys(g);
  const free = STAFF_ROLES.filter((r) => !g.econ.staff.some((s) => s.role === r.id));
  return (
    <div className="kit-grid">
      <Card title={L('The household', '식솔')} ko="家率">
        {g.econ.staff.map((s) => (
          <div key={s.id} className="kit-staff">
            <div className="kit-line">
              <div><strong>{s.role === 'servants' ? L(`Household servants (${s.count ?? 0})`, `집안 하인 (${s.count ?? 0}명)`) : tx(s.name)}</strong><span className="kit-sub">{s.role === 'servants' ? L('Cooking, cleaning, carrying, gate', '밥, 청소, 짐, 문간') : tx(staffRole(s.role).name)} · {fmt(s.wage)} {L('nyang a season', '냥/철')}{s.role !== 'servants' ? ` · ${L('skill', '솜씨')} ${s.skill}` : ''}</span></div>
              {keys && (
                <div className="kit-line-act">
                  {s.role === 'servants' ? (
                    <>
                      <Btn onClick={() => act((x) => setServants(x, -1))}>−</Btn>
                      <Btn onClick={() => act((x) => setServants(x, 1))}>+</Btn>
                    </>
                  ) : (
                    <>
                      <Btn onClick={() => act((x) => setWage(x, s.id, true))}>{L('Raise pay', '품삯 올리기')}</Btn>
                      <Btn onClick={() => act((x) => setWage(x, s.id, false))}>{L('Cut pay', '품삯 깎기')}</Btn>
                      <Btn onClick={() => act((x) => dismiss(x, s.id))}>{L('Dismiss', '내보내기')}</Btn>
                    </>
                  )}
                </div>
              )}
            </div>
            <Meter label={L('Loyalty', '충성')} value={s.loyalty} tone={s.loyalty < 30 ? 'wine' : 'jade'} />
          </div>
        ))}
        <p className="kit-note">{L('Unpaid or badly paid people steal or leave. Guards make theft less likely; a clerk catches fraud.', '품삯이 밀리거나 박하면 훔치거나 떠난다. 청지기는 도둑을 막고, 서사는 부정을 잡는다.')}</p>
      </Card>
      {keys && (
        <Card title={L('Take someone on', '사람 들이기')} ko="雇用">
          {free.map((r) => (
            <div key={r.id} className="kit-line">
              <div><strong>{tx(r.name)}</strong><span className="kit-sub">{tx(r.text)} · {L('about', '약')} {r.wage} {L('nyang a season', '냥/철')}</span></div>
              <Btn onClick={() => act((x) => hire(x, r.id))}>{L('Hire', '들이기')}</Btn>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function Business({ g }: { g: Game }) {
  const { L, tx } = useL();
  const act = useAct();
  const keys = holdsKeys(g);
  const [kind, setKind] = useState(BUSINESS_KINDS[0].id);
  const [prov, setProv] = useState('hanseong');
  const [cap, setCap] = useState(300);
  const [owner, setOwner] = useState<'purse' | 'house'>('purse');
  const [good, setGood] = useState('rice');
  const [from, setFrom] = useState('jeolla');
  const [to, setTo] = useState('hanseong');
  const [qty, setQty] = useState(10);
  const k = businessKind(kind);
  const unit = price(g, from, good);
  return (
    <div className="kit-grid">
      {g.econ.businesses.map((b) => (
        <Card key={b.id} title={tx(b.name)} ko="商業" aside={<span className="mini-chip">{b.owner === 'house' ? L('Family', '집안') : L('Yours', '개인')}</span>}>
          <Facts items={[
            [L('Capital', '자본'), `${fmt(b.capital)} ${L('nyang', '냥')}`], [L('Last season', '지난 철'), `${b.last >= 0 ? '+' : '−'}${fmt(Math.abs(b.last))}`],
            [L('Since', '개업'), String(b.opened)],
          ]} />
          <Meter label={L('Manager’s skill', '관리인 솜씨')} value={b.manager} />
          <Meter label={L('Reputation', '평판')} value={b.repute} tone="jade" />
          <p className="label">{L('Aim', '방침')}</p>
          <div className="seg" role="group" aria-label={L('Aim', '방침')}>
            {(['steady', 'growth', 'quality'] as const).map((a) => <button key={a} type="button" aria-pressed={b.aim === a} onClick={() => act((x) => setAim(x, b.id, a))}>{a === 'steady' ? L('Steady', '안정') : a === 'growth' ? L('Growth', '확장') : L('Quality', '품질')}</button>)}
          </div>
          <div className="kit-actions" style={{ marginTop: 12 }}>
            <Btn onClick={() => act((x) => addCapital(x, b.id, 100), 'coin')}>{L('Add 100', '100냥 더 넣기')}</Btn>
            <Btn onClick={() => act((x) => replaceManager(x, b.id))}>{L('New manager (30)', '관리인 교체 (30)')}</Btn>
            <Btn onClick={() => act((x) => closeBusiness(x, b.id), 'coin')}>{L('Close', '접기')}</Btn>
          </div>
        </Card>
      ))}
      <Card title={L('Open an enterprise', '사업 열기')} ko="創業">
        <label className="label" htmlFor="bz-kind">{L('Trade', '업종')}</label>
        <select id="bz-kind" className="field kit-select" value={kind} onChange={(e) => setKind(e.target.value)}>{BUSINESS_KINDS.map((x) => <option key={x.id} value={x.id}>{tx(x.name)} ({L('from', '최소')} {x.min})</option>)}</select>
        <p className="kit-note">{tx(k.text)}</p>
        <label className="label" htmlFor="bz-prov">{L('Where', '어디에')}</label>
        <select id="bz-prov" className="field kit-select" value={prov} onChange={(e) => setProv(e.target.value)}>{PROVINCES.map((p) => <option key={p.id} value={p.id}>{tx(p.name)}</option>)}</select>
        <label className="label" htmlFor="bz-cap">{L('Capital (nyang)', '자본 (냥)')}</label>
        <input id="bz-cap" className="field" type="number" min={k.min} step={50} value={cap} onChange={(e) => setCap(Math.max(0, Number(e.target.value) || 0))} />
        {keys && (
          <div className="seg" role="group" aria-label={L('Whose money', '누구 돈')} style={{ marginTop: 12 }}>
            <button type="button" aria-pressed={owner === 'purse'} onClick={() => setOwner('purse')}>{L('Your purse', '내 주머니')}</button>
            <button type="button" aria-pressed={owner === 'house'} onClick={() => setOwner('house')}>{L('Family treasury', '집안 곳간')}</button>
          </div>
        )}
        <div className="kit-actions" style={{ marginTop: 12 }}>
          <Btn tone="wine" disabled={cap < k.min} onClick={() => act((x) => openBusiness(x, kind, prov, cap, keys ? owner : 'purse'), 'coin')}>{L('Open it', '열기')}</Btn>
        </div>
        <p className="kit-note">{g.campaign.rules?.commerce ? L('In this Joseon, nobles may trade openly.', '이 조선에서는 양반도 떳떳이 장사할 수 있다.') : L('A noble trades through a steward; people still talk (reputation −3). Profits depend on the manager, the market, the province’s calm and the season.', '양반은 집사 명의로 장사한다. 그래도 말이 난다 (평판 −3). 이익은 관리인, 시세, 고을의 안정, 계절에 달렸다.')}</p>
      </Card>
      <Card title={L('Send goods to market', '물건 보내기')} ko="交易">
        <div className="kit-form">
          <select className="field kit-select" value={good} onChange={(e) => setGood(e.target.value)} aria-label={L('Goods', '물품')}>{GOODS.map((x) => <option key={x.id} value={x.id}>{tx(x.name)}</option>)}</select>
          <select className="field kit-select" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={L('Buy in', '사는 곳')}>{PROVINCES.map((p) => <option key={p.id} value={p.id}>{L('Buy in', '사는 곳')} {tx(p.name)} ({price(g, p.id, good)})</option>)}</select>
          <select className="field kit-select" value={to} onChange={(e) => setTo(e.target.value)} aria-label={L('Sell in', '파는 곳')}>{PROVINCES.map((p) => <option key={p.id} value={p.id}>{L('Sell in', '파는 곳')} {tx(p.name)} ({price(g, p.id, good)})</option>)}</select>
          <input className="field" type="number" min={1} max={200} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} aria-label={L('Quantity', '수량')} />
        </div>
        <p className="kit-note">{L(`Cost now about ${fmt(qty * unit)} nyang plus carriage. It sells next season at that season’s price; long roads risk loss.`, `지금 약 ${fmt(qty * unit)}냥에 운임이 더 든다. 다음 철 그곳 시세로 팔리며, 먼 길엔 잃을 위험이 있다.`)}</p>
        <Btn disabled={from === to} onClick={() => act((x) => sendCargo(x, good, from, to, qty, keys ? owner : 'purse'), 'coin')}>{L('Send', '보내기')}</Btn>
        {g.econ.cargo.length > 0 && <ul className="kit-list">{g.econ.cargo.map((c, i) => <li key={i}>{c.qty} × {tx(GOODS.find((x) => x.id === c.good)?.name)}: {tx(provinceById(c.from).name)} → {tx(provinceById(c.to).name)}</li>)}</ul>}
      </Card>
    </div>
  );
}

function Provinces({ g }: { g: Game }) {
  const { L, tx } = useL();
  const act = useAct();
  const [sel, setSel] = useState('jeolla');
  const [mode, setMode] = useState('horse');
  const p = provinceById(sel);
  const st = g.econ.provinces[sel];
  const why = canJourney(g, sel, mode);
  const j = journeyDays(g, sel, mode);
  return (
    <div className="kit-grid">
      <Card title={L('The eight provinces', '팔도')} ko="八道">
        <svg viewBox="0 0 100 100" className="kit-map" role="img" aria-label={L('Map of Joseon', '조선 지도')}>
          <path d="M44 6 L58 8 L72 14 L70 26 L62 34 L66 44 L68 58 L72 70 L66 84 L54 92 L42 94 L34 86 L36 74 L32 64 L38 56 L30 48 L26 38 L22 28 L30 20 L38 12 Z" className="kit-land" />
          {PROVINCES.map((pr) => {
            const s = g.econ.provinces[pr.id];
            const ours = g.econ.estates.some((e) => e.province === pr.id) || g.econ.businesses.some((b) => b.province === pr.id);
            return (
              <g key={pr.id} className={'kit-pin' + (sel === pr.id ? ' on' : '') + (s?.disaster ? ' hit' : '')} onClick={() => setSel(pr.id)} role="button" tabIndex={0} aria-label={tx(pr.name)} onKeyDown={(e) => { if (e.key === 'Enter') setSel(pr.id); }}>
                <circle cx={pr.x} cy={pr.y} r={ours ? 2.6 : 1.8} />
                <text x={pr.x + 3} y={pr.y + 1}>{tx(pr.name)}</text>
              </g>
            );
          })}
        </svg>
      </Card>
      <Card title={tx(p.name)} ko={p.seat.ko} aside={st?.disaster ? <span className="mini-chip">{tx(DISASTERS[st.disaster].name)}</span> : undefined}>
        <p className="kit-note">{tx(p.text)}</p>
        <Facts items={[
          [L('Seat', '감영'), tx(p.seat)], [L('Weather', '날씨'), st ? tx(WEATHER[st.weather]) : '—'],
          [L('Warnings', '조짐'), st?.warn ? tx(DISASTERS[st.warn].warn) : L('None heard', '들리는 바 없음')],
          [L('From the capital', '도성에서'), L(`${p.days} days on horseback`, `말로 ${p.days}일`)],
        ]} />
        <Meter label={L('Calm of the province', '고을 민심')} value={st?.stability ?? 70} tone="jade" />
        <p className="label">{L('Prices here', '이곳 시세')}</p>
        <ul className="kit-prices">{GOODS.map((x) => <li key={x.id}><span>{tx(x.name)}</span><span>{price(g, sel, x.id)} / {tx(x.unit)}</span></li>)}</ul>
        {p.id !== 'hanseong' && (
          <>
            <p className="label">{L('Travel there', '그곳으로 가기')}</p>
            <div className="seg" role="group" aria-label={L('How to travel', '가는 방법')}>
              {TRAVEL.filter((m) => !m.needs || ['jeolla', 'gyeongsang', 'hwanghae', 'chungcheong', 'gyeonggi'].includes(sel)).map((m) => <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>{tx(m.name)}</button>)}
            </div>
            <p className="kit-note">{L(`${j.days} days there and back, ${j.cost} nyang. You will inspect any land and businesses you hold there.`, `오가는 데 ${j.days}일, ${j.cost}냥. 그곳의 전장과 사업을 둘러본다.`)}</p>
            <Btn tone="wine" why={why ? tx(why) : null} onClick={() => act((x) => journey(x, sel, mode), 'paper')}>{L('Set out', '길을 떠나기')}</Btn>
          </>
        )}
      </Card>
    </div>
  );
}

import type { Campaign, Rules } from '../model/schemas';
import { DEFAULT_DIFFICULTY, LEVELS, type Level } from '../engine/difficulty';
import { useL } from '../ui/kit';
import { conflictIn } from '../content/government';
import { KINGS, reignIndex } from '../content/history';

export const DEFAULT_RULES: Rules = { womenOffice: false, succession: 'male', mobility: 'rigid', authority: 3, strife: 3, commerce: false };

/** Master §3.1: any starting year from 1392 to 1897. */
export function YearPicker({ draft, set }: { draft: Campaign; set: (c: Campaign) => void }) {
  const { L, tx } = useL();
  const hist = draft.mode === 'historical';
  const year = hist ? draft.era : 1724;
  const k = KINGS[reignIndex(year, 1)];
  const war = conflictIn(year);
  return (
    <div className="kit-year">
      <label className="label" htmlFor="cp-year">{L('Or choose any year', '또는 아무 해나 고르기')}: <strong>{year}</strong> · {tx(k.title)}{war ? ` · ${tx(war.name)}` : ''}</label>
      <input id="cp-year" type="range" min={1392} max={1897} step={1} value={year} onChange={(e) => set({ mode: 'historical', era: Number(e.target.value), premise: null })} />
      <p className="kit-note">{L('The five marked years open with their own story. Any other year opens with the court as history left it; the people and events of the reign follow.', '표시된 다섯 해는 저마다의 이야기로 시작한다. 다른 해는 역사 속 그 조정의 모습으로 시작하며, 그 치세의 사람들과 사건이 이어진다.')}</p>
    </div>
  );
}

/** Master §3.2 and GSDD Part II §18: rules that apply to the whole alternative kingdom. */
export function SandboxRules({ draft, set }: { draft: Campaign; set: (c: Campaign) => void }) {
  const { L } = useL();
  const r = draft.rules ?? DEFAULT_RULES;
  const put = (patch: Partial<Rules>) => set({ ...draft, rules: { ...r, ...patch } });
  const seg = <K extends keyof Rules>(key: K, opts: [Rules[K], string][], label: string) => (
    <div className="kit-rule">
      <p className="label">{label}</p>
      <div className="seg" role="group" aria-label={label}>
        {opts.map(([v, n]) => <button key={String(v)} type="button" aria-pressed={r[key] === v} onClick={() => put({ [key]: v } as Partial<Rules>)}>{n}</button>)}
      </div>
    </div>
  );
  return (
    <div className="kit-rules">
      <p style={{ fontSize: 15, fontWeight: 500 }}>{L('Begin from a scenario', '시나리오로 시작하기')}</p>
      <div className="presets" role="group" aria-label={L('Scenarios', '시나리오')}>
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className="preset" aria-pressed={r.preset === p.id} onClick={() => set({ ...draft, rules: { ...DEFAULT_RULES, ...p.rules, preset: p.id } })}>
            <span className="preset-t">{L(p.en[0], p.ko[0])}</span>
            <span className="preset-x">{L(p.en[1], p.ko[1])}</span>
          </button>
        ))}
      </div>
      <p className="kit-note">{L('Scenarios are fictional starting points, not claims about Joseon history. Every rule below can still be changed.', '시나리오는 허구의 출발점일 뿐 조선 역사에 대한 주장이 아니다. 아래 법도는 모두 바꿀 수 있다.')}</p>
      <p style={{ fontSize: 15, fontWeight: 500 }}>{L('The rules of this kingdom', '이 나라의 법도')}</p>
      {seg('succession', [['male', L('Eldest son', '적장자')], ['designated', L('Designated', '지명')], ['absolute', L('Eldest child', '장자녀')]], L('Royal succession', '왕위 계승'))}
      {seg('womenOffice', [[false, L('Men only', '남성만')], [true, L('Open to women', '여성에게도')]], L('Examinations and office', '과거와 관직'))}
      {seg('mobility', [['rigid', L('Rigid', '엄격')], ['open', L('Open', '유연')]], L('Social mobility', '신분 이동'))}
      {seg('commerce', [[false, L('Frowned on', '천시')], [true, L('Respectable', '존중')]], L('Nobles in trade', '양반의 상업'))}
      {seg('authority', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], L('Strength of the throne', '왕권의 세기'))}
      {seg('strife', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], L('Factional strife', '당쟁의 격렬함'))}
      {seg('dynasty', [['yi', L('House of Yi', '이씨 왕실')], ['wang', L('House of Wang', '왕씨 왕실')], ['new', L('A new house', '새 왕가')]], L('Royal house', '왕실'))}
      {seg('military', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], L('Military strength', '군사력'))}
      {seg('foreign', [['peace', L('Peace', '평화')], ['tension', L('Tension', '긴장')], ['war', L('War', '전쟁')]], L('Foreign relations', '대외 관계'))}
      {seg('tax', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], L('Weight of taxation', '세금의 무게'))}
      <p className="kit-note">{L('These rules hold for everyone: who may inherit, who may serve, how hard it is to fall and climb back.', '이 법도는 모두에게 적용된다. 누가 계승하고, 누가 출사하며, 떨어지고 다시 오르기가 얼마나 어려운지.')}</p>
    </div>
  );
}

/** GSDD Part IV §18.2: seven sandbox scenarios, each a set of starting rules. */
const PRESETS: { id: string; en: [string, string]; ko: [string, string]; rules: Partial<Rules> }[] = [
  { id: 'unbroken', en: ['The Unbroken Dynasty', 'A strong throne, a settled court, peace on the borders.'], ko: ['끊이지 않는 왕조', '강한 왕권, 안정된 조정, 평화로운 국경.'], rules: { authority: 5, strife: 1, foreign: 'peace', dynasty: 'yi' } },
  { id: 'reformist', en: ['The Reformist Monarch', 'A king who opens trade and lightens taxes; the court resists.'], ko: ['개혁 군주', '교역을 열고 세금을 줄이는 임금, 반발하는 조정.'], rules: { authority: 4, strife: 3, commerce: true, mobility: 'open', tax: 2 } },
  { id: 'new-house', en: ['The Rise of a New Royal House', 'The old line has ended; a new house holds an uncertain throne.'], ko: ['새 왕가의 등장', '옛 왕통이 끊기고 새 왕가가 불안한 보위를 지킨다.'], rules: { dynasty: 'new', authority: 2, strife: 4, succession: 'designated' } },
  { id: 'factional', en: ['The Great Factional Struggle', 'Purge follows purge; the throne is weak.'], ko: ['대당쟁', '사화가 꼬리를 물고 왕권은 약하다.'], rules: { authority: 1, strife: 5 } },
  { id: 'military', en: ['The Military Ascendancy', 'Generals stand above ministers; the borders are at war.'], ko: ['무신의 시대', '장수가 대신 위에 서고 국경에는 전쟁이 한창이다.'], rules: { military: 5, foreign: 'war', authority: 3, strife: 3 } },
  { id: 'equal', en: ['The Equal Court', 'Women sit the examinations and the eldest child inherits.'], ko: ['평등한 조정', '여성도 과거를 보고 맏이가 계승한다.'], rules: { womenOffice: true, succession: 'absolute', mobility: 'open' } },
  { id: 'divided', en: ['The Divided Kingdom', 'Two courts, heavy taxes and foreign tension.'], ko: ['갈라진 나라', '두 조정, 무거운 세금, 대외 긴장.'], rules: { authority: 2, strife: 5, foreign: 'tension', tax: 5, military: 2 } },
];

/** GSDD Part IV §17: how far recorded history may bend in this campaign. */
export function ContinuityPicker({ draft, set }: { draft: Campaign; set: (c: Campaign) => void }) {
  const { L } = useL();
  const c = draft.continuity ?? 'limited';
  const opts: ['strict' | 'limited' | 'dynamic', string, string][] = [
    ['strict', L('Strict', '엄격'), L('The record holds. Your own life is yours; the throne and the great events go as they went.', '기록이 지켜진다. 당신의 삶은 당신 것이지만, 왕위와 큰 사건은 역사대로 흘러간다.')],
    ['limited', L('Limited', '제한'), L('Your life may touch history in moderate ways, and the royal paths are open; the great turning points hold.', '당신의 삶이 중간 정도까지 역사에 닿을 수 있고 왕실의 길도 열린다. 큰 전환점은 그대로다.')],
    ['dynamic', L('Dynamic', '역동'), L('Anything can change, if you are in the right place to change it. Every departure is recorded.', '그 자리에 있다면 무엇이든 바뀔 수 있다. 모든 변화는 기록된다.')],
  ];
  return (
    <div className="kit-rule" style={{ borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
      <p className="label">{L('Historical continuity', '역사의 연속성')}</p>
      <div className="seg" role="group" aria-label={L('Historical continuity', '역사의 연속성')}>
        {opts.map(([k, n]) => <button key={k} type="button" aria-pressed={c === k} onClick={() => set({ ...draft, continuity: k })}>{n}</button>)}
      </div>
      <p className="kit-note">{opts.find((o) => o[0] === c)![2]}</p>
    </div>
  );
}

/** GSDD Part V §27.2: separate dials for how hard life is. */
export function DifficultyPicker({ draft, set }: { draft: Campaign; set: (c: Campaign) => void }) {
  const { L } = useL();
  const d = draft.difficulty ?? DEFAULT_DIFFICULTY;
  const name: Record<Level, string> = { gentle: L('Gentle', '순함'), normal: L('Normal', '보통'), harsh: L('Harsh', '혹독') };
  const row = (k: 'mortality' | 'economy' | 'politics', label: string) => (
    <div className="kit-rule">
      <p className="label">{label}</p>
      <div className="seg" role="group" aria-label={label}>
        {LEVELS.map((v) => <button key={v} type="button" aria-pressed={d[k] === v} onClick={() => set({ ...draft, difficulty: { ...d, [k]: v } })}>{name[v]}</button>)}
      </div>
    </div>
  );
  return (
    <section className="kit-card camp-diff" aria-label={L('How hard life is', '삶의 난이도')}>
      <header className="kit-card-head"><h3>{L('How hard life is', '삶의 난이도')}<span className="ko" lang="ko">難易</span></h3></header>
      <div className="kit-two">
        {row('mortality', L('Illness and death', '병과 죽음'))}
        {row('economy', L('Harvests and trade', '수확과 장사'))}
        {row('politics', L('Court intrigue', '조정의 암투'))}
        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', fontSize: 15 }}>
          <input type="checkbox" checked={d.automation} onChange={(e) => set({ ...draft, difficulty: { ...d, automation: e.target.checked } })} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={{ fontWeight: 500 }}>{L('Steward handles routine estate business', '집사가 전장 일을 알아서 처리')}</span><span className="kit-note">{L('Repairs are made without asking when the treasury allows.', '곳간이 허락하면 묻지 않고 보수한다.')}</span></span>
        </label>
      </div>
    </section>
  );
}

import type { Background, Gender, Player } from '../model/schemas';
import { useL } from '../ui/kit';
import { EDU_FIELDS, START_TRAITS, TEMPERS, TRAIT_KIND } from '../content/attributes';
import { TRAITS } from '../content/lists';
import { ageStages } from '../engine/newGame';
import type { Wealth } from '../engine/money';

export type Custom = { prestige: number; wealth: Wealth; faction: 'A' | 'B' | 'none' } | null;

/** GSDD Part I §3.2 C (custom house) and B (royal standing). */
export function HouseExtra({ bg, custom, setCustom, lineage, setLineage, historical }: {
  bg: Background; custom: Custom; setCustom: (c: Custom) => void; lineage: Player['lineage']; setLineage: (l: Player['lineage']) => void; historical: boolean;
}) {
  const { L } = useL();
  const royal = bg === 'royal' || bg === 'collateral';
  const c = custom ?? { prestige: 3, wealth: 'modest' as Wealth, faction: 'B' as const };
  // Historical rules keep out impossible houses: the highest standing does not come with nothing.
  const fix = (n: NonNullable<Custom>): NonNullable<Custom> => (historical && n.prestige >= 5 && n.wealth === 'poor' ? { ...n, wealth: 'modest' } : n);
  return (
    <div className="kit-create">
      {royal && (
        <div>
          <p className="label">{L('Your royal standing', '왕실 안의 위치')}</p>
          <div className="seg" role="group" aria-label={L('Royal standing', '왕실 위치')}>
            {([['prince', L('Prince or princess of the blood', '왕자·왕녀')], ['descendant', L('Descendant of a former king', '선왕의 후손')], ['disputed', L('A disputed claim', '논란의 혈통')]] as [Player['lineage'], string][]).map(([v, n]) => (
              <button key={v} type="button" aria-pressed={(lineage === 'none' ? (bg === 'royal' ? 'prince' : 'descendant') : lineage) === v} onClick={() => setLineage(v)}>{n}</button>
            ))}
          </div>
          <p className="kit-note">{L('Close kin of the king may not hold office; a distant descendant may. A disputed claim starts with little legitimacy, and much to prove.', '임금의 가까운 친척은 벼슬할 수 없고, 먼 후손은 할 수 있다. 논란의 혈통은 정통성이 낮은 채 시작하며 증명할 것이 많다.')}</p>
        </div>
      )}
      {!royal && (
        <div>
          <label className="kit-check"><input type="checkbox" checked={!!custom} onChange={(e) => setCustom(e.target.checked ? c : null)} /> {L('Shape this house yourself', '가문을 직접 꾸미기')}</label>
          {custom && (
            <div className="kit-create">
              <p className="label">{L('Family standing', '가문의 위세')}</p>
              <div className="seg" role="group">{[1, 2, 3, 4, 5].map((v) => <button key={v} type="button" aria-pressed={c.prestige === v} onClick={() => setCustom(fix({ ...c, prestige: v }))}>{v}</button>)}</div>
              <p className="label">{L('Means', '살림 형편')}</p>
              <div className="seg" role="group">{([['poor', L('Poor', '가난')], ['modest', L('Modest', '보통')], ['comfortable', L('Comfortable', '넉넉')], ['rich', L('Rich', '부유')]] as [Wealth, string][]).map(([v, n]) => <button key={v} type="button" aria-pressed={c.wealth === v} onClick={() => setCustom(fix({ ...c, wealth: v }))}>{n}</button>)}</div>
              <p className="label">{L('Side at court', '조정에서의 편')}</p>
              <div className="seg" role="group">{([['A', L('With those in power', '집권 세력')], ['B', L('With the opposition', '재야 세력')], ['none', L('Neither', '어느 쪽도')]] as ['A' | 'B' | 'none', string][]).map(([v, n]) => <button key={v} type="button" aria-pressed={c.faction === v} onClick={() => setCustom({ ...c, faction: v })}>{n}</button>)}</div>
              {historical && <p className="kit-note">{L('In a historical campaign the highest houses are never penniless.', '역사 캠페인에서 최고 명문가는 빈털터리일 수 없다.')}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AgeStages({ age, setAge }: { age: number; setAge: (n: number) => void }) {
  const { tx, L } = useL();
  return (
    <div>
      <p className="label">{L('Begin as', '시작 시기')}</p>
      <div className="seg" role="group" aria-label={L('Begin as', '시작 시기')}>
        {ageStages.map((s) => <button key={s.age} type="button" aria-pressed={(age < 13 && s.age === 8) || (age >= 13 && age < 15 && s.age === 13) || (age >= 15 && age < 30 && s.age === 19) || (age >= 30 && s.age === 32)} onClick={() => setAge(s.age)}>{tx(s.name)}</button>)}
      </div>
      <p className="kit-note">{tx(ageStages.find((s) => (age < 13 ? 8 : age < 15 ? 13 : age < 30 ? 19 : 32) === s.age)?.text)}</p>
    </div>
  );
}

/** Steps 9–11 of the creation flow: personality, traits, review of the starting position. */
export function CharacterStep({ traits, setTraits, temper, setTemper, focus, setFocus, age, bg, gender, historical }: {
  traits: string[]; setTraits: (t: string[]) => void; temper: Record<string, number>; setTemper: (t: Record<string, number>) => void;
  focus: number; setFocus: (n: number) => void; age: number; bg: Background; gender: Gender; historical: boolean;
}) {
  const { L, tx } = useL();
  const toggle = (id: string) => setTraits(traits.includes(id) ? traits.filter((x) => x !== id) : traits.length >= 2 ? [traits[1], id] : [...traits, id]);
  const royal = bg === 'royal' || bg === 'collateral';
  const pros: string[] = [];
  const cons: string[] = [];
  if (royal) { pros.push(L('Royal blood and the palace open to you', '왕족의 피, 열려 있는 궁궐')); cons.push(L('Watched by every faction; close kin barred from office', '모든 당파의 감시, 가까운 종친은 벼슬 불가')); }
  if (gender === 'woman' && historical) { pros.push(L('Household authority, marriage alliances, the royal selection', '살림의 권한, 혼인 동맹, 간택')); cons.push(L('No examinations or office in this age', '이 시대엔 과거와 관직이 막혀 있음')); }
  if (gender === 'man' && !royal) { pros.push(L('The examinations and a career in office', '과거와 관직의 길')); cons.push(L('The family expects you to rise', '집안의 기대를 짊어짐')); }
  if (bg === 'declining') cons.push(L('Debts and a leaking roof', '빚과 새는 지붕'));
  if (bg === 'landed') pros.push(L('Rich harvests', '넉넉한 수확'));
  if (age < 15) pros.push(L('Years of study before anyone judges you', '평가받기 전 공부할 세월'));
  return (
    <div className="pane kit-create">
      <div>
        <h1 style={{ fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 300, lineHeight: 1.15 }}>{L('Character', '성품')}</h1>
        <p className="kit-note">{L('Tendencies shape how people react to you. Traits can change as you live. Choose up to two.', '기질은 사람들의 반응을 바꾼다. 특성은 살아가며 바뀔 수 있다. 두 가지까지 고르라.')}</p>
      </div>
      <div className="kit-traits" role="group" aria-label={L('Traits', '특성')}>
        {START_TRAITS.map((id) => TRAITS[id] && (
          <button key={id} type="button" className={'kit-trait ' + TRAIT_KIND[id]} aria-pressed={traits.includes(id)} onClick={() => toggle(id)} title={tx(TRAITS[id].text)}>{tx(TRAITS[id].name)}</button>
        ))}
      </div>
      <div className="kit-tempers">
        {TEMPERS.map((t) => (
          <div key={t.id} className="kit-temper">
            <span>{tx(t.low)}</span>
            <input type="range" min={-2} max={2} step={1} value={temper[t.id] ?? 0} onChange={(e) => setTemper({ ...temper, [t.id]: Number(e.target.value) })} aria-label={`${tx(t.low)} – ${tx(t.high)}`} />
            <span>{tx(t.high)}</span>
          </div>
        ))}
      </div>
      {age < 15 && (
        <div>
          <p className="label">{L('What your lessons concentrate on', '공부의 중심')}</p>
          <div className="seg kit-wrap-seg" role="group">{EDU_FIELDS.map((f, i) => <button key={f.id} type="button" aria-pressed={focus === i} onClick={() => setFocus(i)}>{tx(f.name)}</button>)}</div>
        </div>
      )}
      <div className="kit-review">
        <p className="label">{L('Your starting position', '시작하는 처지')}</p>
        <ul>{pros.map((p) => <li key={p} className="pro">+ {p}</li>)}{cons.map((c) => <li key={c} className="con">− {c}</li>)}</ul>
      </div>
    </div>
  );
}

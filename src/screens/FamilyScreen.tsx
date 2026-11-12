import { Btn, useAct, useL } from '../ui/kit';
import { RAISE, faceFor, raisable, raise, raiseBar, setUpbringing, upbringingOf } from '../engine/life';
import { FOCI, STYLES, type Focus } from '../content/life';
import { useState } from 'react';
import { Check, Minus, X } from 'lucide-react';
import { useUi } from '../store/ui';
import { useGame } from '../store/game';
import { useT } from '../i18n/useT';
import { Fibre, Medallion, Seal } from '../ui/parts';
import { WealthBar } from '../ui/Wealth';
import { RecordsBar } from './RecordsBar';
import { ENDINGS, WEALTH, prestigeWord } from '../content/lists';
import { wealthOf } from '../engine/money';
import { factionsOf, yearNumber } from '../engine/time';
import { childrensHouse, kinLabel, npcAge, npcPortrait, playerName, playerPortrait, spouseId } from '../engine/world';
import type { Approval, Npc } from '../model/schemas';

const ROWS: { key: string; kins: string[]; ko: string }[] = [
  { key: 'grandparents', kins: ['grandfather', 'grandmother'], ko: '조부모' },
  { key: 'parents', kins: ['father', 'mother', 'uncle'], ko: '부모' },
  { key: 'yourGeneration', kins: ['sibling', 'cousin'], ko: '나의 대' },
  { key: 'children', kins: ['child'], ko: '자녀' },
  { key: 'grandchildren', kins: ['grandchild'], ko: '손주' },
];

function ApprovalMark({ a, label }: { a: Approval; label: string }) {
  const Icon = a === 'for' ? Check : a === 'against' ? X : Minus;
  return <span className={'ap ' + a}><Icon size={16} strokeWidth={1.8} />{label}</span>;
}

export function FamilyScreen() {
  const { t, tx, pk, lc, lang } = useT();
  const g = useGame((s) => s.game)!;
  const favour = useGame((s) => s.favour);
  const setFocus = useUi((s) => s.setFocusNpc);
  const go = useUi((s) => s.go);
  const [sel, setSel] = useState<string>('player');

  const sp = spouseId(g);
  const members = Object.values(g.npcs).filter((n) => n.kin && n.kin !== 'spouse');
  const rows = ROWS.map((r) => ({ ...r, people: members.filter((n) => r.kins.includes(n.kin!)).sort((a, b) => a.birthYear - b.birthYear) }))
    .filter((r) => r.key === 'yourGeneration' || r.people.length);
  const spouse = sp ? g.npcs[sp] : null;
  const f = factionsOf(g);
  const heirNpc = g.player.gender === 'man' || !g.marriedInto
    ? members.filter((n) => n.kin === 'child' && n.alive && n.gender === 'man' && n.parents.includes('player')).sort((a, b) => a.birthYear - b.birthYear)[0]
    : null;
  const house = childrensHouse(g);
  const p = g.house.prestige;

  const node = (id: string, n: Npc | null, isPlayer = false) => {
    const spec = isPlayer ? playerPortrait(g) : n ? npcPortrait(g, n) : undefined;
    const name = isPlayer ? tx(playerName(g)) : n ? tx(n.name) : t('spouseEmpty');
    const rel = isPlayer ? t('you') : n ? (tx(kinLabel(g, n)) || tx(n.role)) + (n.alive ? '' : `, ${lc(t('died', { year: tx(yearNumber(g, n.diedYear ?? g.date.year)) }))}`) : '';
    return (
      <button key={id} className="node" type="button" aria-pressed={sel === id} onClick={() => setSel(id)} style={{ position: 'static', transform: 'none' }}>
        <Medallion spec={spec} size={64} gone={!!n && !n.alive} />
        <span className="nm">{name}</span>
        <span className="rl">{rel}</span>
      </button>
    );
  };

  const detailNpc = sel === 'player' ? null : g.npcs[sel] ?? null;
  const detail = sel === 'player'
    ? { ko: playerName(g).ko, name: tx(playerName(g)), rel: t('you'), life: t('yearsOld', { n: g.date.year - g.player.birthYear }), text: '' }
    : detailNpc
      ? {
        ko: detailNpc.name.ko, name: tx(detailNpc.name), rel: tx(kinLabel(g, detailNpc)) || tx(detailNpc.role),
        life: detailNpc.alive ? (detailNpc.away ? t('away') : t('yearsOld', { n: npcAge(g, detailNpc) })) : t('died', { year: tx(yearNumber(g, detailNpc.diedYear ?? g.date.year)) }),
        text: tx(detailNpc.wants) || tx(detailNpc.role),
      }
      : null;

  return (
    <main className="paper-screen">
      <Fibre seed={6} />
      <RecordsBar current="family" />
      <div className="wrap" style={{ maxWidth: 1320, paddingTop: 'clamp(28px, 4vh, 44px)', paddingBottom: 56, display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px 32px', flexWrap: 'wrap' }}>
          <div>
            <p className="ko echo" lang="ko" style={{ marginBottom: 8, fontSize: 22, color: 'var(--jaju)' }}>{g.house.surname.ko}씨 가문</p>
            <h1 style={{ fontSize: 'clamp(38px, 4.5vw, 60px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.015em' }}>
              {lang === 'ko' ? `${g.house.surname.ko}씨 가문` : `The ${g.house.surname.en} family`}
            </h1>
          </div>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--text-paper-2)', maxWidth: '44ch' }}>
            {tx(prestigeWord(p))}, {tx(WEALTH[wealthOf(g.player.money)]).toLowerCase()}. {g.marriedInto ? t('childrenCarry', { name: pk(house.surname) }) : ''}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'stretch' }}>
          <section aria-labelledby="fm-tree" style={{ flex: '1.7 1 620px', minWidth: 0 }}>
            <h2 id="fm-tree" className="h2">{t('familyTree')} <span className="ko" lang="ko">족보</span></h2>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
              {rows.map((r) => (
                <li key={r.key} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12, alignItems: 'center', padding: '16px 0', borderTop: '1px dashed var(--rule)' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span className="ko" lang="ko" style={{ writingMode: 'vertical-rl', fontSize: 17, color: 'var(--jaju)' }}>{r.ko}</span>
                    <span className="echo" style={{ fontSize: 12, color: 'var(--muted-paper)', textAlign: 'center' }}>{t(r.key as 'parents')}</span>
                  </span>
                  <span style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: '14px 6px' }}>
                    {r.key === 'yourGeneration' ? (
                      <>
                        {r.people.filter((n) => n.birthYear <= g.player.birthYear).map((n) => node(n.id, n))}
                        <span style={{ display: 'flex', alignItems: 'flex-start' }}>
                          {node('player', null, true)}
                          <span aria-hidden="true" style={{ width: 28, height: 2, marginTop: 31, background: spouse ? 'var(--jaju)' : 'transparent', borderTop: spouse ? undefined : '2px dashed #8C7B66' }} />
                          {node(spouse ? spouse.id : 'spouse-empty', spouse)}
                        </span>
                        {r.people.filter((n) => n.birthYear > g.player.birthYear).map((n) => node(n.id, n))}
                      </>
                    ) : r.people.map((n) => node(n.id, n))}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <aside className="detail" key={sel} aria-live="polite" style={{ flex: '1 1 320px', minWidth: 0, background: '#EFE6D2', boxShadow: '0 18px 44px rgba(58,45,40,.2)' }}>
            <div className="band" aria-hidden="true" />
            {detail ? (
              <div style={{ padding: '26px 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                  <Medallion spec={sel === 'player' ? playerPortrait(g) : detailNpc ? npcPortrait(g, detailNpc) : undefined} size={88} gone={!!detailNpc && !detailNpc.alive} />
                  <div style={{ minWidth: 0 }}>
                    <p className="ko echo" lang="ko" style={{ fontSize: 24, color: 'var(--jaju)' }}>{detail.ko}</p>
                    <h2 style={{ marginTop: 2, fontSize: 28, fontWeight: 300, lineHeight: 1.15 }}>{detail.name}</h2>
                    <p style={{ marginTop: 4, fontSize: 15, color: 'var(--muted-paper)' }}>{detail.rel}</p>
                  </div>
                </div>
                <p style={{ padding: '10px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', fontSize: 15 }}>{detail.life}</p>
                {detail.text && <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--text-paper-2)' }}>{detail.text}</p>}
                {detailNpc && g.rel[detailNpc.id]?.met && <button className="link-paper" type="button" onClick={() => { setFocus(detailNpc.id); go('people'); }}>{t('seeHistory', { name: tx(detailNpc.given ?? detailNpc.name) })}</button>}
              </div>
            ) : (
              <div style={{ padding: '26px 28px' }}><p style={{ fontSize: 16 }}>{t('spouseEmpty')}</p></div>
            )}
          </aside>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', gap: '40px 48px' }}>
          <section className="sec" aria-labelledby="fm-st">
            <h2 id="fm-st" className="h2">{t('houseStanding')} <span className="ko" lang="ko">가세</span></h2>
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px', fontSize: 16, lineHeight: 1.5 }}>
              <dt style={{ color: 'var(--muted-paper)' }}>{t('prestige')}</dt>
              <dd style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span>{t('ofFive', { word: tx(prestigeWord(p)), n: p })}</span>
                <span aria-hidden="true" style={{ display: 'inline-flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((k) => <i key={k} style={{ width: 9, height: 9, transform: 'rotate(45deg)', background: k <= p ? 'var(--jaju)' : 'transparent', boxShadow: k <= p ? undefined : 'inset 0 0 0 1.5px #8C7B66' }} />)}
                </span>
              </dd>
              <dt style={{ color: 'var(--muted-paper)' }}>{t('faction')}</dt><dd style={{ margin: 0 }}>{g.house.faction === 'A' ? tx(f.a) : g.house.faction === 'B' ? tx(f.b) : '—'}</dd>
              <dt style={{ color: 'var(--muted-paper)' }}>{t('heir')}</dt><dd style={{ margin: 0 }}>{heirNpc ? tx(heirNpc.name) : '—'}</dd>
            </dl>
            <div style={{ marginTop: 22 }}><WealthBar g={g} /></div>
            {g.ancestors.length > 0 && (
              <ul style={{ listStyle: 'none', margin: '22px 0 0', padding: 0 }}>
                {g.ancestors.map((a, k) => (
                  <li key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '10px 0', borderTop: '1px solid var(--rule)', fontSize: 15 }}>
                    <span>{t('lateYear', { name: tx(a.name), from: a.born, to: a.died })}</span>
                    <span style={{ color: 'var(--jaju)' }}>{tx(ENDINGS[a.ending]?.title)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="sec" aria-labelledby="fm-dy">
            <h2 id="fm-dy" className="h2">{lang === 'ko' ? '가문의 대' : 'The dynasty'} <span className="ko" lang="ko">世系</span></h2>
            {(() => {
              const kids = Object.values(g.npcs).filter((n) => n.alive && (n.kin === 'child' || n.kin === 'grandchild'));
              const married = kids.filter((n) => n.spouse).length;
              const rows: [string, string][] = [
                [lang === 'ko' ? '이 집안의 대' : 'Generation', String(g.generation)],
                [lang === 'ko' ? '살아 있는 자손' : 'Living descendants', String(kids.length)],
                [lang === 'ko' ? '혼인한 자손' : 'Married descendants', String(married)],
                [lang === 'ko' ? '집안 문서' : 'Family documents', String(g.docs.length)],
              ];
              return (
                <>
                  <dl className="facts kit-facts">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
                  <ol className="kit-timeline">
                    {g.lives.map((l, i) => <li key={i}><span className="kit-sub">{lang === 'ko' ? `${i + 1}대` : `Generation ${i + 1}`} · {l.born}–{l.died ?? '?'}</span><span>{tx(l.name)}. {tx(l.summary)}</span></li>)}
                    <li className="div"><span className="kit-sub">{lang === 'ko' ? `${g.generation}대 · 지금` : `Generation ${g.generation} · now`}</span><span>{tx(playerName(g))}</span></li>
                  </ol>
                </>
              );
            })()}
          </section>

          <RaisingChildren />

          <section className="sec" aria-labelledby="fm-pr">
            <h2 id="fm-pr" className="h2">{t('proposals')} <span className="ko" lang="ko">혼담</span></h2>
            {spouse ? (
              <p style={{ fontSize: 16, lineHeight: 1.6 }}>{t('married', { name: tx(spouse.name) })}{spouse.alive ? '' : `. ${t('widowed')}`}</p>
            ) : g.flags['proposals-open'] && g.proposals.length ? (
              <>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-paper-2)', maxWidth: '60ch' }}>{t('proposalsNote')}</p>
                <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
                  {g.proposals.map((pr) => {
                    const n = g.npcs[pr.npc];
                    if (!n) return null;
                    const on = g.favoured === pr.npc;
                    return (
                      <li key={pr.npc} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid var(--rule)' }}>
                        <Medallion spec={npcPortrait(g, n)} size={56} />
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p style={{ fontSize: 18, fontWeight: 500 }}>{tx(n.name)}<span style={{ fontWeight: 400, fontSize: 15, color: 'var(--muted-paper)' }}>, {npcAge(g, n)}</span></p>
                          <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text-paper-2)' }}>{tx(pr.note)}</p>
                          <p style={{ display: 'flex', gap: '6px 18px', flexWrap: 'wrap', marginTop: 2 }}>
                            {g.npcs.father?.alive && <ApprovalMark a={pr.father} label={`${t('father')}: ${t(pr.father)}`} />}
                            {g.npcs.mother?.alive && <ApprovalMark a={pr.mother} label={`${t('mother')}: ${t(pr.mother)}`} />}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
                            <button className="btn btn-line btn-small" type="button" aria-pressed={on} onClick={() => favour(on ? null : pr.npc)}>{on ? t('favoured') : t('favourThis')}</button>
                            {on && <Seal text="뜻" size={44} stamp tilt={-7} />}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : g.flags.betrothed ? (
              <p style={{ fontSize: 16, lineHeight: 1.6 }}>{Object.entries(g.rel).filter(([, r]) => r.bond === 'betrothed').map(([id]) => t('betrothedTo', { name: tx(g.npcs[id]?.name) })).join('')}</p>
            ) : (
              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-paper-2)', maxWidth: '60ch' }}>{t('noProposals')}</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

/** GSDD Part IX §11.3: how each child is being raised, and a little time with them each season. */
function RaisingChildren() {
  const g = useGame((s) => s.game)!;
  const { L, tx } = useL();
  const act = useAct();
  const kids = raisable(g);
  if (!kids.length) return null;
  return (
    <section className="sec" aria-labelledby="fm-raise">
      <h2 id="fm-raise" className="h2">{L('Raising the children', '자녀 양육')} <span className="ko" lang="ko">養育</span></h2>
      <p className="kit-note">{L('Choose what each child learns and how strictly. It shapes the adult they become, and the heir you may one day play.', '자녀마다 무엇을 얼마나 엄하게 가르칠지 정한다. 어른이 된 모습, 그리고 언젠가 이어 할 후계자의 모습이 달라진다.')}</p>
      <div className="raise-grid">
        {kids.map((n) => {
          const u = upbringingOf(n);
          const age = npcAge(g, n);
          const r = g.rel[n.id];
          return (
            <article key={n.id} className="raise">
              <header>
                <Medallion spec={{ ...npcPortrait(g, n), expr: faceFor(g, n.id) }} size={52} />
                <div>
                  <p style={{ fontSize: 17, fontWeight: 500 }}>{tx(n.name)} <span className="kit-in">{L(`aged ${age}`, `${age}세`)}</span></p>
                  <p className="kit-sub">{L('Regard', '호감')} {r?.regard ?? 0} · {L('Learning', '배움')} {Math.round(u.progress)}{u.trait ? ` · ${u.trait}` : ''}</p>
                </div>
              </header>
              <div className="kit-meter-track"><div className="kit-meter-fill jade" style={{ width: `${Math.min(100, u.progress)}%` }} /></div>
              <label className="raise-field">{L('Learning', '배울 것')}
                <select className="kit-select" value={u.focus} onChange={(e) => act((x) => setUpbringing(x, n.id, e.currentTarget.value as Focus, null), 'paper')}>
                  {FOCI.map((f) => <option key={f.id} value={f.id}>{tx(f.name)}</option>)}
                </select>
              </label>
              <div className="seg seg-small" role="group" aria-label={L('How strictly', '엄하기')}>
                {STYLES.map((s) => <button key={s.id} type="button" aria-pressed={u.style === s.id} title={tx(s.text)} onClick={() => act((x) => setUpbringing(x, n.id, null, s.id), 'paper')}>{tx(s.name)}</button>)}
              </div>
              <div className="kit-actions">
                {RAISE.map((a) => {
                  const why = raiseBar(g, n.id, a.id);
                  return <Btn key={a.id} why={why ? tx(why) : null} onClick={() => act((x) => raise(x, n.id, a.id))}>{tx(a.name)}</Btn>;
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

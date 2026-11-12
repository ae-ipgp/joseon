import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useGame } from '../store/game';
import { useUi } from '../store/ui';
import { Fibre, Seal } from '../ui/parts';
import { useL } from '../ui/kit';
import { SCENARIOS, type ScenarioDef } from '../content/scenarios';
import { FAMILIES, HANBOK } from '../content/families';
import { readBook } from '../save/honours';
import type { Gender } from '../model/schemas';

/** v0.6: lives begun with a goal. Pick one, name the person, begin. */
export function ScenarioScreen() {
  const go = useUi((s) => s.go);
  const start = useGame((s) => s.start);
  const { L, tx, lang } = useL();
  const [pick, setPick] = useState<ScenarioDef | null>(null);
  const [gender, setGender] = useState<Gender>('woman');
  const [name, setName] = useState('');
  const book = readBook();
  const choose = (s: ScenarioDef) => { setPick(s); setGender(s.gender === 'any' ? 'woman' : s.gender); setName(''); };
  const begin = () => {
    if (!pick) return;
    const dyes = HANBOK[gender];
    start({
      campaign: pick.campaign, background: pick.background, gender, givenName: name.trim(), age: pick.age,
      colors: { top: dyes.top[0].hex, bottom: dyes.bottom[0].hex }, scenario: pick.id,
      startYear: pick.campaign.mode === 'historical' ? pick.campaign.era : undefined,
    });
    go('play');
  };
  const fam = (s: ScenarioDef) => FAMILIES.find((f) => f.id === s.background);
  const stars = (n: number) => '◆'.repeat(n) + '◇'.repeat(3 - n);
  return (
    <main className="ink-screen scenario-screen">
      <header className="bar">
        <button className="bar-link" type="button" onClick={() => go('menu')} style={{ paddingLeft: 0 }}><ChevronLeft size={20} strokeWidth={1.6} />{L('Main menu', '주 메뉴')}</button>
      </header>
      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 80 }}>
        <p className="ko echo" lang="ko" style={{ color: 'var(--gold-light)', fontSize: 18 }}>이야기 시작</p>
        <h1 className="scenario-h">{L('Scenarios', '시나리오')}</h1>
        <p className="scenario-lede">{L('Twelve lives that begin with a purpose. Each sets the family, the year and the age, and names what counts as success. They are fictional lives set in the period, not history.', '목표를 품고 시작하는 열두 개의 삶. 저마다 가문과 해와 나이가 정해져 있고 무엇이 성공인지 일러 준다. 시대를 배경으로 한 허구의 삶이며 역사가 아니다.')}</p>
        <div className="scenario-grid">
          {SCENARIOS.map((s, i) => {
            const won = book['scenario:' + s.id];
            return (
              <button key={s.id} type="button" className={'scenario-card' + (pick?.id === s.id ? ' on' : '') + (won ? ' won' : '')} style={{ animationDelay: `${i * 55}ms` }} aria-pressed={pick?.id === s.id} onClick={() => choose(s)}>
                <span className="scenario-seal"><Seal text={s.seal} size={44} tilt={-6} /></span>
                <span className="scenario-meta">{s.campaign.mode === 'historical' ? s.campaign.era : L('Alternative Joseon', '또 다른 조선')} · {tx(fam(s)?.type ?? { en: s.background })} · {L(`age ${s.age}`, `${s.age}세`)}</span>
                <span className="scenario-name">{tx(s.name)}</span>
                <span className="scenario-text">{tx(s.text)}</span>
                <span className="scenario-goal"><b>{L('Goal', '목표')}</b> {tx(s.goal)}</span>
                <span className="scenario-foot"><span title={L('Difficulty', '난이도')}>{stars(s.hard)}</span>{s.heirs && <span>{L('heirs may finish it', '후대가 이어도 된다')}</span>}{won && <span className="scenario-won">{L(`Achieved by ${won.by.en}`, `${won.by.ko ?? won.by.en} 달성`)}</span>}</span>
              </button>
            );
          })}
        </div>
      </div>
      {pick && (
        <div className="sticky-foot scenario-foot-bar">
          <div className="scenario-form">
            <strong>{tx(pick.name)}</strong>
            {pick.gender === 'any' && (
              <div className="seg seg-small seg-ink" role="group" aria-label={L('Born as', '성별')}>
                <button type="button" aria-pressed={gender === 'woman'} onClick={() => setGender('woman')}>{L('Daughter', '딸')}</button>
                <button type="button" aria-pressed={gender === 'man'} onClick={() => setGender('man')}>{L('Son', '아들')}</button>
              </div>
            )}
            <label className="scenario-name-in"><span className="sr-only">{L('Given name', '이름')}</span>
              <input value={name} maxLength={12} placeholder={lang === 'ko' ? '이름 (비워 두면 기본 이름)' : 'Given name (blank for the default)'} onChange={(e) => setName(e.currentTarget.value)} />
            </label>
          </div>
          <button className="btn btn-gold" type="button" onClick={begin}>{L('Begin this life', '이 삶을 시작한다')}</button>
        </div>
      )}
      <Fibre seed={3} />
    </main>
  );
}

import { useMemo, useState } from 'react';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { useUi } from '../store/ui';
import { useGame } from '../store/game';
import { useT } from '../i18n/useT';
import { DEFAULT_NAMES, FAMILIES, HANBOK, familyOf } from '../content/families';
import { eraOf, premiseOf } from '../content/campaigns';
import { MAX_AGE, MIN_AGE, givenText } from '../engine/newGame';
import { AgeStages, CharacterStep, HouseExtra, type Custom } from './CreateExtra';
import type { Player } from '../model/schemas';
import { hasHangul } from '../engine/names';
import { Portrait } from '../ui/Portrait';
import { Fibre } from '../ui/parts';
import { ell, rng } from '../scenes/kit';
import type { Background, Gender } from '../model/schemas';

/** The painted peony screen behind the portrait. */
function PeonyScreen() {
  const d = useMemo(() => {
    const r = rng(5);
    const blooms: [number, number, number][] = [[110, 240, 30], [214, 168, 34], [356, 236, 30], [476, 186, 32], [290, 330, 26], [150, 360, 22], [450, 340, 24]];
    let petals = '', light = '', cores = '', leaves = '', stems = '';
    const leaf = (x: number, y: number, a: number, len: number) => {
      const tx = x + Math.cos(a) * len, ty = y + Math.sin(a) * len, px = -Math.sin(a) * len * 0.32, py = Math.cos(a) * len * 0.32, mx = (x + tx) / 2, my = (y + ty) / 2;
      return `M${x},${y}Q${mx + px},${my + py} ${tx},${ty}Q${mx - px},${my - py} ${x},${y}Z`;
    };
    for (const b of blooms) {
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + r() * 0.3; petals += ell(b[0] + Math.cos(a) * b[2] * 0.55, b[1] + Math.sin(a) * b[2] * 0.48, b[2] * 0.46, b[2] * 0.46); }
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.4; light += ell(b[0] + Math.cos(a) * b[2] * 0.28, b[1] + Math.sin(a) * b[2] * 0.24, b[2] * 0.3, b[2] * 0.3); }
      cores += ell(b[0], b[1], b[2] * 0.14, b[2] * 0.14);
      stems += `M${b[0]},${b[1] + b[2] * 0.4}Q${b[0] + (300 - b[0]) * 0.3},${b[1] + 90} ${250 + r() * 100},430`;
      for (let i = 0; i < 4; i++) leaves += leaf(b[0] + (r() - 0.5) * 40, b[1] + b[2] * 0.6 + r() * 40, r() * Math.PI * 2, 26 + r() * 22);
    }
    return { petals, light, cores, leaves, stems };
  }, []);
  return (
    <svg viewBox="0 0 600 560" preserveAspectRatio="xMidYMax slice" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <rect width="600" height="560" fill="#221A17" />
      <rect x="0" y="486" width="600" height="74" fill="#7A5A34" />
      <path d="M0,500H600M0,520H600M0,542H600M60,486V560M180,486V560M300,486V560M420,486V560M540,486V560" stroke="#6A4C2A" strokeWidth="1.2" />
      <rect x="36" y="44" width="132" height="442" fill="#E4D6B9" /><rect x="168" y="44" width="132" height="442" fill="#D9CAAA" />
      <rect x="300" y="44" width="132" height="442" fill="#E4D6B9" /><rect x="432" y="44" width="132" height="442" fill="#D9CAAA" />
      <path d={d.leaves} fill="#3E5A4E" opacity="0.85" />
      <path d={d.stems} fill="none" stroke="#3A3A2A" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M150,486 C140,446 176,420 214,430 C240,404 300,410 316,440 C356,430 400,450 404,486 Z" fill="#6E6A60" opacity="0.55" />
      <path d={d.petals} fill="#8E2230" opacity="0.88" />
      <path d={d.light} fill="#B4505A" opacity="0.85" />
      <path d={d.cores} fill="#D9B65C" />
      <path d="M36,44h528v442h-528Z M168,44V486M300,44V486M432,44V486" fill="none" stroke="#3A2420" strokeWidth="9" />
      <path d="M44,52h116v426h-116Z M176,52h116v426h-116Z M308,52h116v426h-116Z M440,52h116v426h-116Z" fill="none" stroke="#8C6E3E" strokeWidth="2" />
    </svg>
  );
}

export function CreateScreen() {
  const { t, pk, lang } = useT();
  const go = useUi((s) => s.go);
  const draft = useUi((s) => s.draftCampaign);
  const start = useGame((s) => s.start);
  const [step, setStep] = useState(0);
  const [bg, setBg] = useState<Background>('noble');
  const [gender, setGender] = useState<Gender>('woman');
  const [name, setName] = useState('');
  const [ko, setKo] = useState('');
  const [koEdited, setKoEdited] = useState(false);
  const [age, setAge] = useState(19);
  const [top, setTop] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [traits, setTraits] = useState<string[]>([]);
  const [temper, setTemper] = useState<Record<string, number>>({});
  const [focus, setFocus] = useState(0);
  const [lineage, setLineage] = useState<Player['lineage']>('none');
  const [custom, setCustom] = useState<Custom>(null);

  const fam = familyOf(bg);
  const dyes = HANBOK[gender];
  const colors = { top: (dyes.top[top] ?? dyes.top[0]).hex, bottom: (dyes.bottom[bottom] ?? dyes.bottom[0]).hex };
  const given = givenText(name, gender, koEdited ? ko : undefined);
  const typedHangul = hasHangul(name);
  const fullName = lang === 'ko' ? `${fam.surname.ko}${given.ko ?? given.en}` : `${fam.surname.en} ${given.en}`;
  const woman = gender === 'woman';
  const ageNote = woman ? t(age <= 17 ? 'ageWoman1' : age <= 22 ? 'ageWoman2' : 'ageWoman3') : t(age <= 19 ? 'ageMan1' : age <= 25 ? 'ageMan2' : 'ageMan3');
  const spec = woman ? { kind: 'lady' as const, robe: colors.top, under: colors.bottom, accent: colors.bottom } : { kind: 'scholar' as const, robe: colors.top, under: colors.bottom };
  const campLabel = draft.mode === 'historical' ? `${t('historical')}, ${eraOf(draft.era).year}` : `${t('alternative')}, ${pk(premiseOf(draft.premise).title)}`;

  const enter = () => {
    start({ campaign: draft, background: bg, gender, givenName: name, givenKo: koEdited && !typedHangul ? ko : undefined, age, colors, traits, temper, focus, lineage, custom: custom ?? undefined, startYear: draft.mode === 'historical' ? draft.era : undefined });
    go('play');
  };
  const tabs = [t('tabFamily'), t('tabPerson'), t('tabLook'), lang === 'ko' ? '성품' : 'Character'];

  return (
    <main className="ink-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <header className="bar">
        <button className="bar-link" type="button" onClick={() => go('campaign')} style={{ paddingLeft: 0 }}><ChevronLeft size={20} strokeWidth={1.6} />{t('stepCampaign')}</button>
        <ol className="steps" aria-label={t('newLife')}>
          <li className="step done"><span className="n">1</span>{t('stepCampaign')}</li>
          <li className="step" aria-current="step"><span className="n">2</span>{t('stepCharacter')}</li>
        </ol>
        <p style={{ fontSize: 14, color: 'var(--gold-light)', border: '1px solid rgba(201,168,106,.5)', padding: '6px 12px' }}>{campLabel}</p>
      </header>

      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
        <section aria-label={fullName} style={{ flex: '1 1 440px', minWidth: 0, position: 'relative', minHeight: 'clamp(440px, 60vh, 640px)', overflow: 'hidden', background: '#221A17' }}>
          <PeonyScreen />
          <div style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', width: 'min(420px, 74%)' }}>
            <Portrait spec={spec} style={{ width: '100%', height: 'auto' }} />
          </div>
          <div className="raised" aria-live="polite" style={{ position: 'absolute', left: 'clamp(16px, 3vw, 32px)', top: 'clamp(16px, 3vw, 32px)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '70%' }}>
            <p style={{ fontSize: 26, lineHeight: 1.15, color: 'var(--text-ink)' }}>{fullName}</p>
            <p style={{ fontSize: 15, color: 'var(--gold-light)' }}>{pk(woman ? fam.line.woman : fam.line.man)}</p>
            <p style={{ fontSize: 14, color: 'var(--muted-ink)' }}>{t('yearsOld', { n: age })}, {t('unmarried')}</p>
          </div>
        </section>

        <section className="paper" aria-label={t('stepCharacter')} style={{ flex: '1.25 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Fibre seed={4} />
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: 'clamp(24px, 4vh, 40px) clamp(20px, 4vw, 56px) 28px', gap: 24, maxWidth: 720 }}>
            <nav aria-label={t('stepCharacter')} style={{ display: 'flex', gap: 24, flexWrap: 'wrap', borderBottom: '1px solid var(--rule)' }}>
              {tabs.map((label, i) => (
                <button key={label} className="tab" type="button" aria-current={step === i ? 'step' : undefined} onClick={() => setStep(i)}><span className="n">{i + 1}</span>{label}</button>
              ))}
            </nav>

            {step === 0 && (
              <div className="pane" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <h1 style={{ fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 300, lineHeight: 1.15 }}>{t('familyTitle')}</h1>
                  <p style={{ marginTop: 10, fontSize: 17, lineHeight: 1.65, color: 'var(--text-paper-2)', maxWidth: '56ch' }}>{t('familyIntro')}</p>
                </div>
                <div role="group" aria-label={t('tabFamily')} style={{ display: 'flex', flexDirection: 'column', marginTop: 6 }}>
                  {FAMILIES.map((f) => (
                    <button key={f.id} className="fam" type="button" aria-pressed={bg === f.id} onClick={() => setBg(f.id)}>
                      <span className="tile" lang="ko" aria-hidden="true">{f.char}</span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                        <span style={{ fontSize: 19, fontWeight: 500 }}>{pk(f.house)}</span>
                        <span style={{ fontSize: 14, color: 'var(--jaju)' }}>{pk(f.type)}</span>
                        <span style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--text-paper-2)', marginTop: 4 }}>{pk(f.adv)}</span>
                        <span style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--muted-paper)' }}>{pk(f.bur)}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <HouseExtra bg={bg} custom={custom} setCustom={setCustom} lineage={lineage} setLineage={setLineage} historical={draft.mode === 'historical'} />
              </div>
            )}

            {step === 1 && (
              <div className="pane" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <div>
                  <h1 style={{ fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 300, lineHeight: 1.15 }}>{t('personTitle')}</h1>
                  <p style={{ marginTop: 10, fontSize: 17, lineHeight: 1.65, color: 'var(--text-paper-2)', maxWidth: '56ch' }}>{t('personIntro')}</p>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ width: 96 }}>
                    <p className="label">{t('surname')}</p>
                    <p style={{ minHeight: 52, display: 'flex', alignItems: 'center', fontSize: 24, fontWeight: 300, borderBottom: '1.5px dashed #8C7B66' }}>{pk(fam.surname)}</p>
                  </div>
                  <div style={{ flex: '1 1 220px' }}>
                    <label className="label" htmlFor="cr-name">{t('givenName')}</label>
                    <input id="cr-name" className="field" type="text" value={name} maxLength={24} autoComplete="off" placeholder={pk(DEFAULT_NAMES[gender])} onChange={(e) => setName(e.target.value)} aria-describedby="cr-name-hint" />
                    <p id="cr-name-hint" style={{ marginTop: 8, fontSize: 14, color: 'var(--muted-paper)' }}>{typedHangul ? t('nameInRoman', { name: given.en }) : t('givenHint', { name: pk(DEFAULT_NAMES[gender]) })}</p>
                  </div>
                  {!typedHangul && (
                    <div style={{ flex: '0 1 150px' }}>
                      <label className="label" htmlFor="cr-ko">{t('nameInHangul')}</label>
                      <input id="cr-ko" className="field ko" lang="ko" type="text" value={koEdited ? ko : given.ko ?? ''} maxLength={8} autoComplete="off" aria-describedby="cr-ko-hint"
                        onChange={(e) => { setKo(e.target.value); setKoEdited(e.target.value.trim() !== ''); }} />
                      <p id="cr-ko-hint" style={{ marginTop: 8, fontSize: 14, color: 'var(--muted-paper)' }}>{t('hangulHint')}</p>
                    </div>
                  )}
                </div>
                <div role="group" aria-labelledby="cr-g">
                  <p id="cr-g" className="label">{t('gender')}</p>
                  <div className="seg" style={{ maxWidth: 360 }}>
                    <button type="button" aria-pressed={woman} onClick={() => { setGender('woman'); setTop(0); setBottom(0); }}>{t('woman')}</button>
                    <button type="button" aria-pressed={!woman} onClick={() => { setGender('man'); setTop(0); setBottom(0); }}>{t('man')}</button>
                  </div>
                </div>
                <div role="group" aria-labelledby="cr-a">
                  <p id="cr-a" className="label">{t('age')}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <button className="round" type="button" aria-label={t('younger')} disabled={age <= MIN_AGE} onClick={() => setAge(age - 1)}><Minus size={20} strokeWidth={1.6} /></button>
                    <span style={{ fontSize: 36, fontWeight: 300, minWidth: '2ch', textAlign: 'center' }} aria-live="polite">{age}</span>
                    <button className="round" type="button" aria-label={t('older')} disabled={age >= MAX_AGE} onClick={() => setAge(age + 1)}><Plus size={20} strokeWidth={1.6} /></button>
                  </div>
                  <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.6, color: 'var(--text-paper-2)' }}>{ageNote}</p>
                  <AgeStages age={age} setAge={setAge} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="pane" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <div>
                  <h1 style={{ fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 300, lineHeight: 1.15 }}>{t('lookTitle')}</h1>
                  <p style={{ marginTop: 10, fontSize: 17, lineHeight: 1.65, color: 'var(--text-paper-2)', maxWidth: '56ch' }}>{t('lookIntro')}</p>
                </div>
                {([[t(woman ? 'jacket' : 'robe'), dyes.top, top, setTop], [t(woman ? 'skirt' : 'cord'), dyes.bottom, bottom, setBottom]] as const).map(([label, list, sel, setSel]) => (
                  <div key={label} role="group" aria-label={label}>
                    <p className="label">{label}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 10px' }}>
                      {list.map((c, i) => (
                        <button key={c.hex} className="sw" type="button" aria-pressed={sel === i} aria-label={`${c.en}, ${c.ko}`} onClick={() => setSel(i)}>
                          <span className="chip" style={{ background: c.hex }} />
                          <span className="ko" lang="ko" style={{ fontSize: 15 }}>{c.ko}</span>
                          <span className="echo" style={{ fontSize: 12, color: 'var(--muted-paper)' }}>{c.en}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <p style={{ paddingTop: 18, borderTop: '1px solid var(--rule)', fontSize: 16, lineHeight: 1.65, color: 'var(--text-paper-2)', maxWidth: '58ch' }}>{t(woman ? 'hairWoman' : 'hairMan')}</p>
              </div>
            )}

            {step === 3 && <CharacterStep traits={traits} setTraits={setTraits} temper={temper} setTemper={setTemper} focus={focus} setFocus={setFocus} age={age} bg={bg} gender={gender} historical={draft.mode === 'historical'} />}

            <div style={{ marginTop: 'auto', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-line" type="button" onClick={() => (step === 0 ? go('campaign') : setStep(step - 1))}>{t('back')}</button>
              {step < 3
                ? <button className="btn btn-wine" type="button" onClick={() => setStep(step + 1)}>{step === 2 ? (lang === 'ko' ? '다음: 성품' : 'Next: character') : t(step === 0 ? 'nextPerson' : 'nextLook')}</button>
                : <button className="btn btn-wine" type="button" onClick={enter}>{t('enter')}</button>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

import type { Quality, Text } from '../model/schemas';
import { T } from '../engine/text';

/** GSDD Part I §4: five groups of five attributes on a 0–100 scale. */
export type AttrGroup = 'mind' | 'social' | 'lead' | 'body' | 'person';
export type AttrDef = { id: string; group: AttrGroup; name: Text; text: Text };

export const ATTR_GROUPS: { id: AttrGroup; name: Text; quality: Quality | null }[] = [
  { id: 'mind', name: T('Intellect', '지적 능력'), quality: 'wit' },
  { id: 'social', name: T('Social', '사교 능력'), quality: 'grace' },
  { id: 'lead', name: T('Leadership', '통솔 능력'), quality: 'resolve' },
  { id: 'body', name: T('Physical', '신체 능력'), quality: null },
  { id: 'person', name: T('Character', '인품'), quality: 'resolve' },
];

const A = (id: string, group: AttrGroup, en: string, ko: string, ten: string, tko: string): AttrDef => ({ id, group, name: T(en, ko), text: T(ten, tko) });

export const ATTRS: AttrDef[] = [
  A('intelligence', 'mind', 'Intelligence', '지능', 'General reasoning and problem-solving', '사리 판단과 문제 해결'),
  A('scholarship', 'mind', 'Scholarship', '학식', 'Classical and academic knowledge', '경서와 학문의 깊이'),
  A('memory', 'mind', 'Memory', '기억력', 'Holding on to what you learn', '배운 것을 간직하는 힘'),
  A('administration', 'mind', 'Administration', '행정력', 'Organising people, records and money', '사람과 문서와 재물을 다스리는 솜씨'),
  A('creativity', 'mind', 'Creativity', '창의력', 'Original thought and the arts', '새로운 생각과 예술적 재능'),
  A('charisma', 'social', 'Charisma', '매력', 'Presence and personal appeal', '사람을 끄는 풍모'),
  A('diplomacy', 'social', 'Diplomacy', '외교술', 'Negotiation and settling quarrels', '협상과 분쟁 조정'),
  A('persuasion', 'social', 'Persuasion', '설득력', 'Bringing others round', '남의 마음을 돌리는 말솜씨'),
  A('empathy', 'social', 'Empathy', '공감력', 'Reading what others feel', '남의 마음을 헤아리는 힘'),
  A('etiquette', 'social', 'Etiquette', '예법', 'Ceremony and correct conduct', '의례와 몸가짐'),
  A('leadership', 'lead', 'Leadership', '통솔력', 'Directing people', '사람을 이끄는 힘'),
  A('strategy', 'lead', 'Strategy', '전략', 'Planning far ahead', '멀리 내다보는 계책'),
  A('judgement', 'lead', 'Judgement', '판단력', 'Deciding well', '옳게 결정하는 힘'),
  A('discipline', 'lead', 'Discipline', '절제력', 'Consistency and self-control', '꾸준함과 자기 절제'),
  A('command', 'lead', 'Authority', '위엄', 'Commanding respect', '존경을 이끌어 내는 위엄'),
  A('strength', 'body', 'Strength', '근력', 'Physical power', '몸의 힘'),
  A('agility', 'body', 'Agility', '민첩성', 'Coordination and movement', '몸놀림과 날렵함'),
  A('endurance', 'body', 'Endurance', '지구력', 'Stamina', '오래 버티는 힘'),
  A('martial', 'body', 'Martial ability', '무예', 'Bow, sword and horse', '활과 칼과 말 다루는 솜씨'),
  A('courage', 'person', 'Courage', '용기', 'Facing danger', '위험 앞에 서는 마음'),
  A('patience', 'person', 'Patience', '인내심', 'Bearing delay', '기다릴 줄 아는 마음'),
  A('ambition', 'person', 'Ambition', '야망', 'The wish to rise', '높이 오르려는 뜻'),
  A('integrity', 'person', 'Integrity', '청렴', 'Keeping to principle', '원칙을 지키는 곧음'),
  A('resilience', 'person', 'Resilience', '회복력', 'Recovering from blows', '시련에서 일어서는 힘'),
];
/** Health is the 25th attribute; it lives on the player as `health`. */
export const HEALTH_ATTR = A('health', 'body', 'Health', '건강', 'General physical condition', '전반적인 몸 상태');
export const attrById = (id: string) => ATTRS.find((a) => a.id === id) ?? (id === 'health' ? HEALTH_ATTR : undefined);
export const attrsOf = (group: AttrGroup) => [...ATTRS.filter((a) => a.group === group), ...(group === 'body' ? [HEALTH_ATTR] : [])];

/** Which attributes make up each headline quality. */
export const QUALITY_ATTRS: Record<Quality, string[]> = {
  wit: ATTRS.filter((a) => a.group === 'mind').map((a) => a.id),
  grace: ATTRS.filter((a) => a.group === 'social').map((a) => a.id),
  resolve: ATTRS.filter((a) => a.group === 'lead' || a.group === 'person').map((a) => a.id),
};

/** §4.2: the scale is internal; players see words. */
export function attrBand(v: number): Text {
  if (v < 20) return T('Severely limited', '매우 부족');
  if (v < 40) return T('Below average', '평균 이하');
  if (v < 60) return T('Average', '보통');
  if (v < 80) return T('Above average', '뛰어남');
  if (v < 95) return T('Exceptional', '탁월함');
  return T('Extraordinary', '비범함');
}

/** §5.1: tendencies, −2 to +2. */
export const TEMPERS: { id: string; low: Text; high: Text }[] = [
  { id: 'social', low: T('Introverted', '내성적'), high: T('Outgoing', '외향적') },
  { id: 'daring', low: T('Cautious', '신중함'), high: T('Adventurous', '모험적') },
  { id: 'heart', low: T('Compassionate', '자애로움'), high: T('Ruthless', '냉혹함') },
  { id: 'pride', low: T('Humble', '겸손함'), high: T('Proud', '자부심 강함') },
  { id: 'outlook', low: T('Traditional', '보수적'), high: T('Reform-minded', '개혁적') },
  { id: 'temper', low: T('Patient', '참을성 있음'), high: T('Impulsive', '충동적') },
  { id: 'faith', low: T('Loyal', '의리 있음'), high: T('Opportunistic', '기회주의적') },
];
export function temperWord(id: string, v: number): Text | null {
  const t = TEMPERS.find((x) => x.id === id);
  if (!t || v === 0) return null;
  const w = v < 0 ? t.low : t.high;
  return Math.abs(v) >= 2 ? T(`Very ${w.en.toLowerCase()}`, `매우 ${w.ko}`) : w;
}

/** §5.2: traits players may begin with, by kind. The existing story traits stay in content/lists.ts. */
export const TRAIT_KIND: Record<string, 'good' | 'neutral' | 'flaw'> = {
  diligent: 'good', generous: 'good', courageous: 'good', diplomatic: 'good', principled: 'good',
  reserved: 'neutral', curious: 'neutral', traditional: 'neutral', independent: 'neutral', competitive: 'neutral',
  arrogant: 'flaw', greedy: 'flaw', jealous: 'flaw', deceitful: 'flaw', impulsive: 'flaw', vindictive: 'flaw',
  composed: 'good', 'quick-witted': 'good', proud: 'flaw', discreet: 'neutral', loyal: 'good', honest: 'good', ruthless: 'flaw', devoted: 'good', bold: 'neutral',
};
/** Attribute nudges a starting trait gives. */
export const TRAIT_ATTRS: Record<string, Record<string, number>> = {
  diligent: { discipline: 8, scholarship: 4 }, generous: { empathy: 6, charisma: 3 }, courageous: { courage: 10 },
  diplomatic: { diplomacy: 8, persuasion: 3 }, principled: { integrity: 10 },
  reserved: { patience: 5, charisma: -3 }, curious: { creativity: 6, intelligence: 2 }, traditional: { etiquette: 6, creativity: -2 },
  independent: { resilience: 6, diplomacy: -2 }, competitive: { ambition: 8, empathy: -2 },
  arrogant: { command: 5, empathy: -6 }, greedy: { ambition: 5, integrity: -6 }, jealous: { ambition: 4, empathy: -4 },
  deceitful: { persuasion: 6, integrity: -8 }, impulsive: { courage: 5, patience: -8 }, vindictive: { resilience: 4, empathy: -6 },
};
export const START_TRAITS = Object.keys(TRAIT_ATTRS);

/** GSDD Part I §7.1. */
export const STAGES: { id: string; from: number; name: Text; play: Text }[] = [
  { id: 'infancy', from: 0, name: T('Infancy', '영아기'), play: T('Family care', '가족의 보살핌') },
  { id: 'early', from: 3, name: T('Early childhood', '유아기'), play: T('Family and first lessons', '가족과 첫 배움') },
  { id: 'child', from: 7, name: T('Childhood', '아동기'), play: T('Education and character', '교육과 인성') },
  { id: 'youth', from: 13, name: T('Adolescence', '청소년기'), play: T('Advanced study, preparation for adult life', '심화 학습과 성인 준비') },
  { id: 'young', from: 18, name: T('Young adulthood', '청년기'), play: T('Career and marriage', '출사와 혼인') },
  { id: 'adult', from: 30, name: T('Adulthood', '장년기'), play: T('Career, family and influence', '관직, 가족, 영향력') },
  { id: 'mature', from: 45, name: T('Maturity', '중년기'), play: T('Leadership, inheritance, mentorship', '가문 영도, 상속, 후학 양성') },
  { id: 'old', from: 60, name: T('Old age', '노년기'), play: T('Legacy and succession', '유산과 계승') },
];
export const stageOf = (age: number) => [...STAGES].reverse().find((s) => age >= s.from) ?? STAGES[0];
/** Below this age the player lives a child's life: home, lessons, family. */
export const ADULT_AGE = 15;

/** GSDD Part I §8.1. */
export const EDU_FIELDS: { id: string; name: Text; text: Text; attrs: string[] }[] = [
  { id: 'classics', name: T('Classics', '경학'), text: T('Confucian texts, ethics, history, literature, poetry', '유교 경전, 윤리, 역사, 문학, 시'), attrs: ['scholarship', 'memory', 'judgement'] },
  { id: 'admin', name: T('Administration', '행정'), text: T('Governance, law, records and finance', '통치, 법률, 문서, 재정'), attrs: ['administration', 'judgement', 'discipline'] },
  { id: 'military', name: T('Military arts', '병학'), text: T('Archery, horsemanship, strategy, command', '활쏘기, 말타기, 병법, 지휘'), attrs: ['martial', 'strategy', 'strength'] },
  { id: 'culture', name: T('Arts and rites', '예악'), text: T('Calligraphy, painting, music, poetry, ceremony', '서예, 그림, 음악, 시, 의례'), attrs: ['creativity', 'etiquette', 'charisma'] },
  { id: 'practical', name: T('Household and commerce', '가정과 실무'), text: T('Household and estate management, trade, letters to foreigners', '살림과 전장 관리, 상거래, 외국 문서'), attrs: ['administration', 'diplomacy', 'empathy'] },
];
export const eduField = (id: string) => EDU_FIELDS.find((f) => f.id === id) ?? EDU_FIELDS[0];
export const eduBand = (v: number): Text =>
  v < 15 ? T('Beginner', '입문') : v < 35 ? T('Grounded', '기초') : v < 55 ? T('Able', '숙달') : v < 75 ? T('Learned', '정통') : T('Master', '대가');

/** Qualifications. */
export const QUALS: Record<string, { name: Text; text: Text }> = {
  sogwa: { name: T('Licentiate (saengwon)', '생원'), text: T('Passed the lesser examination; may enter the National Academy', '소과에 합격하여 성균관에 들 수 있다') },
  munkwa: { name: T('Civil examination graduate', '문과 급제'), text: T('Qualified for civil office', '문관 임용 자격') },
  mukwa: { name: T('Military examination graduate', '무과 급제'), text: T('Qualified for military office', '무관 임용 자격') },
  household: { name: T('Mistress of a household', '안살림 주관'), text: T('Trusted with the keys of a great house', '큰 집안의 곳간 열쇠를 맡았다') },
  envoy: { name: T('Veteran envoy', '사행 경험'), text: T('Has travelled on a royal embassy', '사신단에 참여한 경험') },
  command: { name: T('Proven commander', '실전 지휘 경험'), text: T('Has led soldiers in the field', '실전에서 병사를 이끌었다') },
};

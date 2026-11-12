import type { Text } from '../model/schemas';
import { T } from '../engine/text';

/*
 * v0.5 content for the personal life layer (GSDD Parts VII–IX, taken at BitLife depth): moods, illnesses
 * and their treatment, pastimes that are practised and can fade, life milestones and the ribbon a life
 * earns at its end. Plain data; the rules are in engine/life.ts.
 */

// ---------------------------------------------------------------- mood (Part IX §3.3)

export type Emotion = 'joyful' | 'happy' | 'content' | 'unsettled' | 'sad' | 'grieving' | 'anxious' | 'angry' | 'proud' | 'fearful' | 'exhausted';
export const EMOTIONS: Record<Emotion, { name: Text; text: Text; face: 'smile' | 'calm' | 'sad' | 'stern' | 'worried' }> = {
  joyful: { name: T('Joyful', '기쁨'), text: T('Something wonderful has happened.', '좋은 일이 있었다.'), face: 'smile' },
  happy: { name: T('Happy', '행복'), text: T('Life is going well.', '삶이 순조롭다.'), face: 'smile' },
  content: { name: T('Content', '평온'), text: T('Settled and at ease.', '마음이 편안하다.'), face: 'calm' },
  unsettled: { name: T('Unsettled', '울적'), text: T('Something is missing.', '무언가 허전하다.'), face: 'calm' },
  sad: { name: T('Unhappy', '슬픔'), text: T('Days feel heavy.', '하루하루가 무겁다.'), face: 'sad' },
  grieving: { name: T('Grieving', '애통'), text: T('In mourning for someone dear.', '소중한 이를 잃고 상중이다.'), face: 'sad' },
  anxious: { name: T('Anxious', '근심'), text: T('Worry keeps you awake.', '근심으로 잠을 이루지 못한다.'), face: 'worried' },
  angry: { name: T('Angry', '분노'), text: T('Someone has wronged you.', '누군가 당신을 모욕했다.'), face: 'stern' },
  proud: { name: T('Proud', '자부'), text: T('You have earned something.', '스스로 이룬 것이 있다.'), face: 'smile' },
  fearful: { name: T('Afraid', '두려움'), text: T('Danger is close.', '위험이 가까이 있다.'), face: 'worried' },
  exhausted: { name: T('Exhausted', '탈진'), text: T('You need rest.', '쉬어야 한다.'), face: 'worried' },
};

// ---------------------------------------------------------------- illness (Part IX §12)

export type ConditionDef = {
  id: string;
  name: Text;
  text: Text;
  /** 1 mild, 2 serious, 3 grave. */
  severity: 1 | 2 | 3;
  /** Health lost each season while it lasts. */
  drain: number;
  /** Chance each season that it passes by itself. 0 for conditions that stay. */
  passes: number;
  chronic?: boolean;
  /** Who catches it: age range and season (0 spring … 3 winter), relative weight. */
  minAge: number;
  maxAge?: number;
  seasons?: number[];
  weight: number;
  /** It also wears down an attribute. */
  attr?: string;
};

export const CONDITIONS: ConditionDef[] = [
  { id: 'cold', name: T('A heavy cold', '고뿔'), text: T('Aching, sneezing and a running nose.', '몸살에 재채기, 콧물.'), severity: 1, drain: 2, passes: 0.7, minAge: 0, seasons: [0, 3], weight: 5 },
  { id: 'fever', name: T('Fever', '열병'), text: T('A burning fever that comes and goes.', '오르내리는 신열.'), severity: 2, drain: 5, passes: 0.5, minAge: 0, seasons: [1, 2], weight: 3 },
  { id: 'stomach', name: T('Indigestion', '체증'), text: T('Pain and heaviness after every meal.', '먹을 때마다 배가 아프고 더부룩하다.'), severity: 1, drain: 2, passes: 0.6, minAge: 10, seasons: [1], weight: 3 },
  { id: 'cough', name: T('A lingering cough', '해수'), text: T('A dry cough that will not leave the chest.', '가슴에서 떠나지 않는 마른기침.'), severity: 2, drain: 3, passes: 0.3, minAge: 20, seasons: [2, 3], weight: 2 },
  { id: 'injury', name: T('A bad fall', '낙상'), text: T('A twisted leg and a bruised side.', '다리를 삐고 옆구리를 다쳤다.'), severity: 1, drain: 3, passes: 0.5, minAge: 8, weight: 2, attr: 'agility' },
  { id: 'smallpox', name: T('Smallpox', '마마'), text: T('The most feared illness of all: fever, then the spots.', '가장 두려운 병. 열이 오르고 반점이 돋는다.'), severity: 3, drain: 12, passes: 0.55, minAge: 0, maxAge: 40, weight: 0.25 },
  { id: 'consumption', name: T('Consumption', '노채'), text: T('A wasting illness of the lungs.', '폐를 갉아먹는 소모병.'), severity: 3, drain: 4, passes: 0.12, minAge: 20, weight: 0.25, attr: 'endurance' },
  { id: 'joints', name: T('Aching joints', '관절통'), text: T('Knees and hands that ache in cold weather.', '추우면 쑤시는 무릎과 손마디.'), severity: 1, drain: 1, passes: 0, chronic: true, minAge: 50, weight: 1.5, attr: 'strength' },
  { id: 'eyes', name: T('Failing eyesight', '안질'), text: T('Small characters swim on the page.', '작은 글자가 흐릿하다.'), severity: 1, drain: 0, passes: 0, chronic: true, minAge: 52, weight: 1.2, attr: 'memory' },
  { id: 'heart', name: T('A weak heart', '심기 허약'), text: T('Breathless on the stairs, palpitations at night.', '계단에서 숨이 차고 밤에 가슴이 두근거린다.'), severity: 2, drain: 2, passes: 0, chronic: true, minAge: 55, weight: 1, attr: 'endurance' },
];
export const conditionById = (id: string) => CONDITIONS.find((c) => c.id === id);

export type TreatmentDef = { id: string; name: Text; text: Text; cost: (severity: number) => number; cure: number; comfort: number };
export const TREATMENTS: TreatmentDef[] = [
  { id: 'physician', name: T('Send for a physician', '의원을 부른다'), text: T('Pulse-reading, acupuncture and a prescription.', '진맥과 침, 처방.'), cost: (s) => 12 + s * 12, cure: 0.7, comfort: 2 },
  { id: 'royal', name: T('Call the royal physician', '어의를 청한다'), text: T('The palace physicians, for those the court favours.', '조정의 총애를 받는 이에게 오는 내의원 어의.'), cost: () => 0, cure: 0.85, comfort: 3 },
  { id: 'herbs', name: T('Buy herbal medicine', '탕약을 지어 온다'), text: T('A decoction from the apothecary in the market.', '장터 약방에서 지은 탕약.'), cost: (s) => 4 + s * 3, cure: 0.45, comfort: 1 },
  { id: 'rest', name: T('Rest at home', '집에서 조리한다'), text: T('Warm rice gruel, a heated floor and sleep.', '따뜻한 죽과 뜨끈한 구들, 그리고 잠.'), cost: () => 0, cure: 0.25, comfort: 2 },
  { id: 'rite', name: T('Hold a rite for recovery', '굿을 한다'), text: T('A shaman’s rite to drive the illness out; it comforts the household.', '무당을 불러 병을 쫓는 굿. 집안의 마음을 달래 준다.'), cost: () => 15, cure: 0.1, comfort: 8 },
];

// ---------------------------------------------------------------- pastimes (Part IX §4, §14.2)

export type SkillDef = {
  id: string;
  name: Text;
  text: Text;
  /** The attribute that helps, and the one it strengthens. */
  attr: string;
  /** Historical campaign: who practised it. The sandbox opens every pastime to everyone. */
  who: 'any' | 'man' | 'woman';
  minAge: number;
  /** Can be practised in the evening. */
  evening: boolean;
  /** What reaching mastery brings. */
  master: Text;
  contest: Text;
};
export const SKILLS: SkillDef[] = [
  { id: 'calligraphy', name: T('Calligraphy', '서예'), text: T('The brush, the ink stone and endless practice.', '붓과 벼루, 그리고 끝없는 연습.'), attr: 'scholarship', who: 'any', minAge: 6, evening: true, master: T('Helps in the examinations; your hand is admired.', '과거에 도움이 되고 글씨가 칭송받는다.'), contest: T('Enter a calligraphy gathering', '휘호 모임에 나간다') },
  { id: 'poetry', name: T('Poetry', '시작'), text: T('Verse in the classical forms and in Korean.', '한시와 시조 짓기.'), attr: 'creativity', who: 'any', minAge: 8, evening: true, master: T('Helps in the examinations; invitations to poetry gatherings.', '과거에 도움이 되고 시회에 초대받는다.'), contest: T('Compete at a poetry gathering', '시회에서 겨룬다') },
  { id: 'music', name: T('Zither', '거문고·가야금'), text: T('The geomungo of the scholar, the gayageum of the inner rooms.', '선비의 거문고, 안채의 가야금.'), attr: 'creativity', who: 'any', minAge: 8, evening: true, master: T('Your playing calms you and charms guests.', '연주가 마음을 다스리고 손님을 사로잡는다.'), contest: T('Play at a music gathering', '풍류 모임에서 연주한다') },
  { id: 'painting', name: T('Ink painting', '서화'), text: T('Orchids, bamboo, plum and chrysanthemum.', '사군자: 매화, 난초, 국화, 대나무.'), attr: 'creativity', who: 'any', minAge: 8, evening: false, master: T('Your paintings are gifts that open doors.', '당신의 그림은 문을 여는 선물이 된다.'), contest: T('Show your paintings', '그림을 내보인다') },
  { id: 'baduk', name: T('Baduk', '바둑'), text: T('Black and white stones on nineteen lines.', '열아홉 줄 위의 흑백 돌.'), attr: 'strategy', who: 'any', minAge: 7, evening: true, master: T('A sharper strategic mind.', '전략적 사고가 날카로워진다.'), contest: T('Play in a baduk match', '바둑 대국에 나선다') },
  { id: 'archery', name: T('Archery', '궁술'), text: T('The horn bow at the archery pavilion.', '활터에서 각궁을 당긴다.'), attr: 'martial', who: 'man', minAge: 10, evening: false, master: T('Helps in the military examination and in battle.', '무과와 전투에 도움이 된다.'), contest: T('Shoot in an archery contest', '활쏘기 대회에 나간다') },
  { id: 'riding', name: T('Horsemanship', '마술'), text: T('Riding, and shooting from the saddle.', '말 타기와 말 위에서 활쏘기.'), attr: 'agility', who: 'man', minAge: 12, evening: false, master: T('Helps in the military examination and on the road.', '무과와 먼 길에 도움이 된다.'), contest: T('Ride in a mounted contest', '말 타기 겨루기에 나간다') },
  { id: 'embroidery', name: T('Embroidery', '자수'), text: T('Silk thread on silk: flowers, cranes, longevity symbols.', '비단에 비단실로 놓는 꽃과 학, 십장생.'), attr: 'patience', who: 'woman', minAge: 8, evening: true, master: T('Your work makes fine gifts.', '솜씨가 귀한 선물이 된다.'), contest: T('Show your embroidery', '수놓은 것을 내보인다') },
  { id: 'medicine', name: T('Herbal lore', '의약 지식'), text: T('Reading the medical classics and knowing the herbs.', '의서를 읽고 약초를 익힌다.'), attr: 'intelligence', who: 'any', minAge: 12, evening: true, master: T('Illness in your house is caught early and treated cheaply.', '집안의 병을 일찍 알아채고 적은 돈으로 다스린다.'), contest: T('Debate cures with the physicians', '의원들과 처방을 논한다') },
  { id: 'language', name: T('Spoken Chinese', '한어'), text: T('The interpreters’ tongue, learned from a jungin teacher. Embassies go better for those who speak it.', '역관의 말. 중인 스승에게 배운다. 말이 통하면 사행이 순조롭다.'), attr: 'memory', who: 'any', minAge: 10, evening: true, master: T('You need no interpreter at a foreign court.', '외국 조정에서 통역이 필요 없다.'), contest: T('Interpret for visiting envoys', '사신 접대에서 통역한다') },
];
export const skillById = (id: string) => SKILLS.find((s) => s.id === id);
export const skillBand = (v: number): Text =>
  v >= 80 ? T('Master', '대가') : v >= 50 ? T('Accomplished', '능숙') : v >= 25 ? T('Competent', '익숙') : v > 0 ? T('Beginner', '초보') : T('Untried', '처음');

/** Simple pleasures: each takes a part of the day. */
export type LeisureDef = { id: string; name: Text; text: Text; cost: number; evening: boolean; minAge: number };
export const LEISURE: LeisureDef[] = [
  { id: 'stroll', name: T('Walk in the hills', '산길을 걷는다'), text: T('Fresh air and a long view. Happiness and calm.', '맑은 바람과 먼 풍경. 즐거움과 평온.'), cost: 0, evening: false, minAge: 6 },
  { id: 'temple', name: T('Visit a mountain temple', '산사에 다녀온다'), text: T('Incense and quiet. Eases stress greatly.', '향 내음과 고요. 근심이 크게 가신다.'), cost: 3, evening: false, minAge: 10 },
  { id: 'wine', name: T('Drink with friends', '벗들과 술잔을 기울인다'), text: T('Laughter and too much rice wine. Happy now, tired later.', '웃음과 넘치는 막걸리. 지금은 즐겁고 내일은 고단하다.'), cost: 5, evening: true, minAge: 16 },
  { id: 'graves', name: T('Tend the ancestral graves', '선산에 성묘한다'), text: T('Cut the grass, pour the wine, remember them. Honour and peace.', '벌초하고 술을 올리며 조상을 기린다. 명예와 마음의 평안.'), cost: 2, evening: false, minAge: 8 },
];

// ---------------------------------------------------------------- upbringing (Part IX §11.3, Part X §7.3)

export type Focus = 'classics' | 'military' | 'culture' | 'admin' | 'practical';
export const FOCI: { id: Focus; name: Text; attrs: string[] }[] = [
  { id: 'classics', name: T('The classics and the examinations', '경서와 과거 공부'), attrs: ['scholarship', 'memory'] },
  { id: 'military', name: T('Bow, horse and the military arts', '활과 말, 무예'), attrs: ['martial', 'strength'] },
  { id: 'culture', name: T('Poetry, music and painting', '시서화와 음악'), attrs: ['creativity', 'etiquette'] },
  { id: 'admin', name: T('Household and estate management', '살림과 전장 관리'), attrs: ['administration', 'discipline'] },
  { id: 'practical', name: T('Accounts, trade and practical learning', '셈과 장사, 실용 학문'), attrs: ['intelligence', 'judgement'] },
];
export type Style = 'gentle' | 'balanced' | 'strict';
export const STYLES: { id: Style; name: Text; text: Text }[] = [
  { id: 'gentle', name: T('Gentle', '자애롭게'), text: T('Slower lessons, a warmer bond, a kinder child.', '배움은 느리나 정이 깊고 너그러운 아이로 자란다.') },
  { id: 'balanced', name: T('Balanced', '알맞게'), text: T('The usual way of a good house.', '좋은 집안의 보통 방식.') },
  { id: 'strict', name: T('Strict', '엄하게'), text: T('Faster lessons, a cooler bond, a disciplined child.', '배움은 빠르나 정은 멀어지고 절제하는 아이로 자란다.') },
];

// ---------------------------------------------------------------- milestones and ribbons (Part IX §15.4, §17.5)

export type MilestoneId =
  | 'first-lessons' | 'capping' | 'lesser-exam' | 'great-exam' | 'first-post' | 'senior-post' | 'marriage' | 'first-child'
  | 'grandchild' | 'estate' | 'business' | 'royal-favour' | 'pastime-master' | 'restored' | 'throne' | 'heir' | 'elder';
export const MILESTONES: Record<MilestoneId, Text> = {
  'first-lessons': T('First lessons', '첫 배움'),
  capping: T('Came of age', '관례·계례'),
  'lesser-exam': T('Passed the lesser examination', '소과 합격'),
  'great-exam': T('Passed the great examination', '대과 급제'),
  'first-post': T('First appointment', '첫 벼슬'),
  'senior-post': T('A senior post', '당상관'),
  marriage: T('Marriage', '혼인'),
  'first-child': T('First child', '첫아이'),
  grandchild: T('First grandchild', '첫 손주'),
  estate: T('Acquired an estate', '전장 마련'),
  business: T('Founded a business', '사업 시작'),
  'royal-favour': T('Royal recognition', '임금의 총애'),
  'pastime-master': T('Mastered an art', '한 가지 재주의 대가'),
  restored: T('Restored the family’s status', '가문의 신원'),
  throne: T('Ascended the throne', '즉위'),
  heir: T('Carried on the family line', '가문을 이음'),
  elder: T('Reached sixty', '환갑'),
};

export type RibbonId =
  | 'sovereign' | 'statesman' | 'general' | 'scholar' | 'artist' | 'wealthy' | 'devoted' | 'romantic' | 'courtier'
  | 'survivor' | 'fallen' | 'elder' | 'brief' | 'melancholy' | 'healer' | 'quiet';
export const RIBBONS: Record<RibbonId, { seal: string; name: Text; text: Text }> = {
  sovereign: { seal: '王', name: T('The Sovereign', '군주'), text: T('Ruled Joseon.', '조선을 다스렸다.') },
  statesman: { seal: '相', name: T('The Statesman', '재상'), text: T('Rose to the highest offices of state.', '나라의 가장 높은 벼슬에 올랐다.') },
  general: { seal: '將', name: T('The General', '장수'), text: T('Commanded armies.', '군사를 이끌었다.') },
  scholar: { seal: '儒', name: T('The Scholar', '선비'), text: T('Lived by learning.', '학문으로 살았다.') },
  artist: { seal: '藝', name: T('The Artist', '예인'), text: T('Mastered an art.', '한 가지 예술을 완성했다.') },
  wealthy: { seal: '富', name: T('The Wealthy', '부호'), text: T('Left the family rich.', '집안을 부유하게 남겼다.') },
  devoted: { seal: '家', name: T('The Pillar of the Family', '가문의 기둥'), text: T('A loving spouse and a house full of children.', '다정한 배우자와 자식이 가득한 집.') },
  romantic: { seal: '情', name: T('The Romantic', '정인'), text: T('Married for love.', '사랑으로 혼인했다.') },
  courtier: { seal: '寵', name: T('The Favourite', '총신'), text: T('Held the monarch’s ear.', '임금의 신임을 얻었다.') },
  survivor: { seal: '復', name: T('The Survivor', '재기'), text: T('Fell, and rose again.', '몰락했다가 다시 일어섰다.') },
  fallen: { seal: '落', name: T('The Fallen', '몰락'), text: T('Died outside the noble ranks.', '양반의 반열 밖에서 죽었다.') },
  elder: { seal: '壽', name: T('The Elder', '장수'), text: T('Lived past eighty.', '여든을 넘겨 살았다.') },
  brief: { seal: '短', name: T('Gone Too Soon', '요절'), text: T('Died young.', '젊어서 세상을 떠났다.') },
  melancholy: { seal: '愁', name: T('The Melancholy', '수심'), text: T('A life lived mostly in sorrow.', '대부분 슬픔 속에 산 삶.') },
  healer: { seal: '醫', name: T('The Healer', '의인'), text: T('Knew the herbs and cured the house.', '약초를 알고 집안의 병을 다스렸다.') },
  quiet: { seal: '靜', name: T('A Quiet Life', '조용한 삶'), text: T('Lived simply, without great events.', '큰일 없이 소박하게 살았다.') },
};

/** Surnames and houses for people who marry outside the player's story. */
export const MATCH_HOUSES: [string, string][] = [
  ['Kim of Andong', '안동 김씨'], ['Yi of Jeonju', '전주 이씨'], ['Park of Miryang', '밀양 박씨'], ['Jeong of Dongnae', '동래 정씨'],
  ['Choe of Gyeongju', '경주 최씨'], ['Han of Cheongju', '청주 한씨'], ['Yun of Papyeong', '파평 윤씨'], ['Shin of Pyeongsan', '평산 신씨'],
  ['Jo of Pungyang', '풍양 조씨'], ['Hong of Namyang', '남양 홍씨'], ['Kang of Jinju', '진주 강씨'], ['Min of Yeoheung', '여흥 민씨'],
];

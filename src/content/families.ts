import type { Background, Faction, Gender, House, PortraitSpec, Text } from '../model/schemas';
import { T } from '../engine/text';

type Person = { given: Text; full?: Text };
export type FamilyDef = {
  id: Background;
  char: string;
  surname: Text;
  house: Text;
  type: Text;
  adv: Text;
  bur: Text;
  prestige: number;
  wealth: House['wealth'];
  faction: Faction;
  /** How the player is introduced, by gender. */
  line: { woman: Text; man: Text };
  grandfather: Person;
  grandmother: Text;
  father: Person & { role: Text; portrait: PortraitSpec };
  mother: Text;
  uncle: Person & { role: Text };
  cousin: Person;
  brother: Person;
  sister: Person;
  qualities: { wit: number; grace: number; resolve: number };
  reputation: number;
  favour: number;
};

export const FAMILIES: FamilyDef[] = [
  {
    id: 'noble', char: '윤', surname: T('Yun', '윤'),
    house: T('The Yun family', '윤씨 가문'), type: T('Established noble family', '명문 사대부 가문'),
    adv: T('An old, respected name and a library to match.', '오래되고 존경받는 이름, 그에 걸맞은 서고.'),
    bur: T('A modest fortune. Your marriage must lift the family.', '재산은 넉넉지 않다. 당신의 혼사가 가문을 일으켜야 한다.'),
    prestige: 3, wealth: 'modest', faction: 'B',
    line: { woman: T('Eldest daughter of the Yun family', '윤씨 가문의 맏딸'), man: T('Eldest son of the Yun family', '윤씨 가문의 맏아들') },
    grandfather: { given: T('Gyeong-su', '경수') }, grandmother: T('Lady Song', '송씨 부인'),
    father: { given: T('Sang-cheol', '상철'), role: T('Deputy Minister of Rites', '예조 참판'), portrait: { kind: 'minister', robe: '#6E2A34', beard: 'short' } },
    mother: T('Lady Kim', '김씨 부인'),
    uncle: { given: T('Sang-hun', '상훈'), role: T('County magistrate in Chungcheong', '충청도 고을 현감') },
    cousin: { given: T('Mi-ryeong', '미령') },
    brother: { given: T('Jae-hwan', '재환') }, sister: { given: T('Seo-hui', '서희') },
    qualities: { wit: 46, grace: 45, resolve: 36 }, reputation: 52, favour: 10,
  },
  {
    id: 'military', char: '신', surname: T('Shin', '신'),
    house: T('The Shin family', '신씨 가문'), type: T('Military aristocratic family', '무반 가문'),
    adv: T('Friends in the Royal Guard and the barracks.', '내금위와 군영에 벗이 많다.'),
    bur: T('Scholars at court look down on soldiers’ houses.', '조정의 문신들은 무반 가문을 낮춰 본다.'),
    prestige: 3, wealth: 'modest', faction: 'B',
    line: { woman: T('Daughter of General Shin’s house', '신 장군 댁 따님'), man: T('Son of General Shin’s house', '신 장군 댁 아드님') },
    grandfather: { given: T('Mun-ho', '문호') }, grandmother: T('Lady Oh', '오씨 부인'),
    father: { given: T('Ik-hyeon', '익현'), role: T('General of the Capital Garrison', '훈련도감 대장'), portrait: { kind: 'minister', robe: '#2C3E63', beard: 'short' } },
    mother: T('Lady Jeong', '정씨 부인'),
    uncle: { given: T('Ik-jun', '익준'), role: T('Commander of a northern fort', '북방 진의 첨사') },
    cousin: { given: T('Da-eun', '다은') },
    brother: { given: T('Jae-ho', '재호') }, sister: { given: T('Yu-jin', '유진') },
    qualities: { wit: 38, grace: 42, resolve: 46 }, reputation: 48, favour: 12,
  },
  {
    id: 'political', char: '조', surname: T('Jo', '조'),
    house: T('The Jo family', '조씨 가문'), type: T('Powerful political family', '권세 있는 정치 가문'),
    adv: T('Your father leads a court faction. Doors open for you.', '아버지가 조정의 한 당파를 이끈다. 문이 쉽게 열린다.'),
    bur: T('Every rival faction is watching your family.', '모든 반대 당파가 당신 가문을 지켜본다.'),
    prestige: 4, wealth: 'comfortable', faction: 'B',
    line: { woman: T('Daughter of the faction leader Jo', '당수 조 대감 댁 따님'), man: T('Son of the faction leader Jo', '당수 조 대감 댁 아드님') },
    grandfather: { given: T('Hyeon-do', '현도') }, grandmother: T('Lady Park', '박씨 부인'),
    father: { given: T('Myeong-hwan', '명환'), role: T('Minister of Personnel, leader of his faction', '이조 판서, 당파의 영수'), portrait: { kind: 'minister', robe: '#5A2140', beard: 'long' } },
    mother: T('Lady Kwon', '권씨 부인'),
    uncle: { given: T('Myeong-seok', '명석'), role: T('Inspector in the Office of the Censor-General', '사간원 정언') },
    cousin: { given: T('Eun-bi', '은비') },
    brother: { given: T('Jae-yun', '재윤') }, sister: { given: T('Hye-won', '혜원') },
    qualities: { wit: 44, grace: 43, resolve: 40 }, reputation: 58, favour: 16,
  },
  {
    id: 'royal', char: '이', surname: T('Yi', '이'),
    house: T('The royal Yi', '왕실 전주 이씨'), type: T('Royal bloodline', '왕족'),
    adv: T('Royal blood. Few in the palace can refuse you.', '왕실의 피. 궁 안에서 당신을 거절할 이는 드물다.'),
    bur: T('Any hint of ambition can be called treason.', '조금의 야심도 역모로 몰릴 수 있다.'),
    prestige: 5, wealth: 'rich', faction: 'B',
    line: { woman: T('Daughter of a royal prince', '왕자군의 따님'), man: T('Son of a royal prince', '왕자군의 아드님') },
    grandfather: { given: T('Deok', '덕'), full: T('Prince Deokpyeong', '덕평군') }, grandmother: T('Lady Min', '민씨 부인'),
    father: { given: T('Hwon', '훤'), full: T('Prince Haeseong', '해성군'), role: T('A royal prince, cousin to the king', '임금의 종친, 해성군'), portrait: { kind: 'minister', robe: '#4A2F5A', beard: 'short' } },
    mother: T('Lady Hong', '홍씨 부인'),
    uncle: { given: T('Chan', '찬'), full: T('Prince Haeyang', '해양군'), role: T('A royal prince who prefers his country estate', '시골 별장을 즐기는 종친') },
    cousin: { given: T('Seol', '설') },
    brother: { given: T('Jun', '준') }, sister: { given: T('Ha-rin', '하린') },
    qualities: { wit: 40, grace: 50, resolve: 37 }, reputation: 60, favour: 24,
  },
  {
    id: 'collateral', char: '이', surname: T('Yi', '이'),
    house: T('A Yi branch house', '이씨 방계 가문'), type: T('Collateral royal branch', '왕실 방계'),
    adv: T('Royal kin, far enough from the throne to live freely.', '왕실의 친척이되, 왕좌와는 자유로울 만큼 멀다.'),
    bur: T('Close enough to the throne to tempt plotters.', '역모를 꾀하는 자들이 탐낼 만큼은 가깝다.'),
    prestige: 2, wealth: 'modest', faction: 'B',
    line: { woman: T('Daughter of a distant royal branch', '왕실 방계 가문의 따님'), man: T('Son of a distant royal branch', '왕실 방계 가문의 아드님') },
    grandfather: { given: T('Gwang-u', '광우') }, grandmother: T('Lady Nam', '남씨 부인'),
    father: { given: T('Sang-mun', '상문'), role: T('A minor official of the royal clan office', '종친부의 낮은 관리'), portrait: { kind: 'minister', robe: '#3E5274', beard: 'short' } },
    mother: T('Lady Jang', '장씨 부인'),
    uncle: { given: T('Sang-hak', '상학'), role: T('A scholar who never took office', '벼슬하지 않은 선비') },
    cousin: { given: T('Yeon', '연') },
    brother: { given: T('Jae-min', '재민') }, sister: { given: T('Seo-a', '서아') },
    qualities: { wit: 42, grace: 44, resolve: 42 }, reputation: 46, favour: 12,
  },
  {
    id: 'scholarly', char: '권', surname: T('Kwon', '권'),
    house: T('The Kwon family', '권씨 가문'), type: T('Scholarly family', '학자 가문'),
    adv: T('Three generations of scholars; their commentaries are read at the Academy.', '삼대에 걸친 학자 집안. 그 주석서가 성균관에서 읽힌다.'),
    bur: T('Learning does not pay for roof tiles. The family lives on its reputation.', '학문이 기왓값을 대 주지는 않는다. 집안은 명성으로 산다.'),
    prestige: 3, wealth: 'modest', faction: 'B',
    line: { woman: T('Daughter of the Kwon scholars', '권씨 학자 집안의 딸'), man: T('Son of the Kwon scholars', '권씨 학자 집안의 아들') },
    grandfather: { given: T('Ui-jeong', '의정') }, grandmother: T('Lady Pak', '박씨 부인'),
    father: { given: T('Hyeok', '혁'), role: T('Lecturer at the National Academy', '성균관 사성'), portrait: { kind: 'scholar', robe: '#3E4F5C', beard: 'long' } },
    mother: T('Lady Jeong', '정씨 부인'),
    uncle: { given: T('Ho', '호'), role: T('Retired scholar in Andong', '안동의 처사'), },
    cousin: { given: T('Ga-on', '가온') },
    brother: { given: T('Seon', '선') }, sister: { given: T('Ha-yeon', '하연') },
    qualities: { wit: 54, grace: 42, resolve: 38 }, reputation: 56, favour: 12,
  },
  {
    id: 'landed', char: '민', surname: T('Min', '민'),
    house: T('The Min family', '민씨 가문'), type: T('Wealthy landowning family', '부유한 지주 가문'),
    adv: T('Rice land in three provinces and granaries to match.', '세 도에 걸친 논과 그에 걸맞은 곳간.'),
    bur: T('Old-money families look down on new money; officials look at your granaries.', '오래된 가문은 졸부라 깔보고, 관리들은 곳간을 넘본다.'),
    prestige: 2, wealth: 'rich', faction: 'none',
    line: { woman: T('Daughter of the landed Min family', '지주 민씨 집안의 딸'), man: T('Heir of the landed Min family', '지주 민씨 집안의 후계')},
    grandfather: { given: T('Chi-gu', '치구') }, grandmother: T('Lady Yi', '이씨 부인'),
    father: { given: T('Yeong-ik', '영익'), role: T('Head of the family estates', '집안 전장의 주인'), portrait: { kind: 'minister', robe: '#5B4A2E', beard: 'short' } },
    mother: T('Lady Seo', '서씨 부인'),
    uncle: { given: T('Yeong-hwan', '영환'), role: T('Manager of the Jeolla estates', '전라도 전장 관리인') },
    cousin: { given: T('Bo-ra', '보라') },
    brother: { given: T('Gyu-ho', '규호') }, sister: { given: T('Na-ri', '나리') },
    qualities: { wit: 44, grace: 44, resolve: 42 }, reputation: 44, favour: 6,
  },
  {
    id: 'declining', char: '홍', surname: T('Hong', '홍'),
    house: T('The Hong family', '홍씨 가문'), type: T('Declining noble family', '기운 양반 가문'),
    adv: T('A great name that people still bow to, out of habit.', '사람들이 습관처럼 아직 고개를 숙이는 큰 이름.'),
    bur: T('Debts, a leaking roof and relatives who remember better days.', '빚, 새는 지붕, 그리고 좋던 시절만 기억하는 친척들.'),
    prestige: 3, wealth: 'poor', faction: 'B',
    line: { woman: T('Daughter of the fallen Hong family', '몰락한 홍씨 가문의 딸'), man: T('Son of the fallen Hong family', '몰락한 홍씨 가문의 아들') },
    grandfather: { given: T('Ui-seop', '의섭') }, grandmother: T('Lady Han', '한씨 부인'),
    father: { given: T('Gyeong-mo', '경모'), role: T('Former magistrate, dismissed in a purge', '사화에 파직된 전 현령'), portrait: { kind: 'scholar', robe: '#4A4A48', beard: 'long' } },
    mother: T('Lady Choe', '최씨 부인'),
    uncle: { given: T('Gyeong-u', '경우'), role: T('Clerk in a provincial office', '지방 관아의 아전 노릇') },
    cousin: { given: T('Ye-seul', '예슬') },
    brother: { given: T('Mun-su', '문수') }, sister: { given: T('Eun-ha', '은하') },
    qualities: { wit: 48, grace: 40, resolve: 46 }, reputation: 38, favour: 4,
  },
];
export const familyOf = (id: Background) => FAMILIES.find((f) => f.id === id) ?? FAMILIES[0];

export const DEFAULT_NAMES: Record<Gender, Text> = { woman: T('Seol-hwa', '설화'), man: T('Hwan', '환') };

export type Dye = { ko: string; en: string; hex: string };
export const HANBOK: Record<Gender, { top: Dye[]; bottom: Dye[] }> = {
  woman: {
    top: [
      { ko: '송화색', en: 'Pine pollen', hex: '#D8BF73' }, { ko: '옥색', en: 'Jade', hex: '#A9C4B4' }, { ko: '분홍', en: 'Blossom', hex: '#D9AFA8' },
      { ko: '연두', en: 'Spring green', hex: '#A9B97A' }, { ko: '백색', en: 'White', hex: '#EDE6D6' },
    ],
    bottom: [
      { ko: '다홍', en: 'Crimson', hex: '#8E2230' }, { ko: '쪽빛', en: 'Indigo', hex: '#2C3E63' }, { ko: '자주', en: 'Plum', hex: '#5A2140' },
      { ko: '남색', en: 'Navy', hex: '#263247' }, { ko: '청록', en: 'Blue-green', hex: '#2F5E55' },
    ],
  },
  man: {
    top: [
      { ko: '옥색', en: 'Jade', hex: '#A9C4B4' }, { ko: '백색', en: 'White', hex: '#E9E2D2' }, { ko: '쪽빛', en: 'Indigo', hex: '#3E5274' },
      { ko: '담청', en: 'Pale blue', hex: '#B9C7CF' }, { ko: '회색', en: 'Ash', hex: '#8C8A84' },
    ],
    bottom: [
      { ko: '다홍', en: 'Crimson', hex: '#8E2230' }, { ko: '쪽빛', en: 'Indigo', hex: '#2C3E63' }, { ko: '자주', en: 'Plum', hex: '#5A2140' },
      { ko: '황색', en: 'Ochre', hex: '#B08D57' }, { ko: '흑색', en: 'Black', hex: '#1B1513' },
    ],
  },
};

/** Names for children and for matches the matchmaker finds. */
export const GIVEN_NAMES: Record<Gender, Text[]> = {
  man: [T('Ui-jin', '의진'), T('Hyeon', '현'), T('Jae-won', '재원'), T('Seong-jae', '성재'), T('Gyeong-min', '경민'), T('Hak-su', '학수'), T('Jeong-hyeon', '정현'), T('Tae-yun', '태윤'), T('Ji-seok', '지석'), T('Mun-su', '문수')],
  woman: [T('Seo-yun', '서윤'), T('Yeon-hui', '연희'), T('Hye-in', '혜인'), T('So-yeong', '소영'), T('Yun-jeong', '윤정'), T('Eun-suk', '은숙'), T('Jeong-a', '정아'), T('Su-ryeon', '수련'), T('Hye-rin', '혜린'), T('Ga-on', '가온')],
};
export const MATCH_SURNAMES: { surname: Text; prestige: number; faction: Faction }[] = [
  { surname: T('Jeong', '정'), prestige: 3, faction: 'B' },
  { surname: T('Song', '송'), prestige: 3, faction: 'A' },
  { surname: T('Hong', '홍'), prestige: 4, faction: 'A' },
  { surname: T('Nam', '남'), prestige: 2, faction: 'B' },
  { surname: T('Kwon', '권'), prestige: 3, faction: 'none' },
  { surname: T('Min', '민'), prestige: 4, faction: 'A' },
  { surname: T('Hwang', '황'), prestige: 2, faction: 'none' },
  { surname: T('An', '안'), prestige: 3, faction: 'B' },
];

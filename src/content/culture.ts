import type { Text } from '../model/schemas';
import { T } from '../engine/text';

/*
 * v0.6 content for culture and belief (GSDD Parts XIII and XVI, taken at life-sim depth): the ways of belief
 * a person may keep, the practices that go with them, the things one can write, patronage, companion
 * animals and the festivals of the year. Belief is described as the people of the time held it;
 * nothing here presents the supernatural as fact.
 */

// ---------------------------------------------------------------- belief (Part XVI §2–3, §12)

export type PathId = 'confucian' | 'buddhist' | 'folk' | 'silhak' | 'seohak';
export const PATHS: Record<PathId, { name: Text; text: Text; seal: string }> = {
  confucian: { seal: '儒', name: T('The Way of the sages', '유학'), text: T('Neo-Confucian learning and ancestral rites: the creed of the state and of every good house.', '성리학과 제사. 나라와 모든 사대부가의 가르침.') },
  buddhist: { seal: '佛', name: T('Buddhist devotion', '불교'), text: T('Lanterns, sutras and mountain temples. Out of favour at court, alive in the inner rooms and the hills.', '연등과 불경과 산사. 조정에서는 밀려났으나 안채와 산중에 살아 있다.') },
  folk: { seal: '巫', name: T('Household spirits', '무속'), text: T('The mudang, the house gods and the reading of fortunes. Scholars scoff; most households ask anyway.', '무당과 가신과 점. 선비들은 비웃지만 집집이 찾는다.') },
  silhak: { seal: '實', name: T('Practical learning', '실학'), text: T('Learning for use: farming, maps, medicine, trade. A scholar’s creed from the seventeenth century on.', '쓰임을 위한 학문: 농사, 지도, 의술, 상업. 17세기부터의 학풍.') },
  seohak: { seal: '西', name: T('Western learning', '서학'), text: T('Books from the West by way of Beijing: astronomy, geometry and a foreign faith. Dangerous in the persecutions.', '북경을 거쳐 온 서양의 책: 천문, 기하, 그리고 낯선 신앙. 박해 때는 위험하다.') },
};

export type PracticeDef = {
  id: string;
  path: PathId;
  name: Text;
  text: Text;
  cost: number;
  evening: boolean;
  minAge: number;
  /** Historical campaign: the years in which it is to be found. */
  from?: number;
  to?: number;
};
export const PRACTICES: PracticeDef[] = [
  { id: 'jesa', path: 'confucian', name: T('Hold the ancestral rite', '제사를 지낸다'), text: T('Lay the table, pour the wine, bow. Honour, and peace with the dead.', '상을 차리고 술을 올리고 절한다. 명예와 마음의 평안.'), cost: 8, evening: true, minAge: 15 },
  { id: 'sitting', path: 'confucian', name: T('Quiet sitting', '정좌한다'), text: T('The scholar’s meditation: sit, breathe, watch the mind. Stress falls.', '선비의 수양. 앉아 숨을 고르고 마음을 살핀다. 근심이 가라앉는다.'), cost: 0, evening: true, minAge: 12 },
  { id: 'lantern', path: 'buddhist', name: T('Offer a lantern at the temple', '절에 연등을 올린다'), text: T('A paper lantern and a wish. Stress falls; happiness rises.', '종이 연등 하나와 소원 하나. 근심이 줄고 마음이 밝아진다.'), cost: 4, evening: false, minAge: 8 },
  { id: 'fortune', path: 'folk', name: T('Ask a mudang to read the year', '무당에게 한 해 운을 묻는다'), text: T('She reads your four pillars and says what she sees. People of the time believed it; judge for yourself.', '사주를 짚고 보이는 것을 말해 준다. 그 시대 사람들은 믿었다. 판단은 당신 몫이다.'), cost: 6, evening: false, minAge: 15 },
  { id: 'practical', path: 'silhak', name: T('Read the practical scholars', '실학서를 읽는다'), text: T('Farming manuals, maps, treatises on coin and trade. Practical learning grows.', '농서와 지도, 화폐와 상업에 관한 글. 실용 학문이 는다.'), cost: 2, evening: true, minAge: 15, from: 1650 },
  { id: 'western', path: 'seohak', name: T('Read books from the West', '서학서를 읽는다'), text: T('Ricci’s maps, Euclid, and a catechism passed hand to hand. Much to learn; something to hide.', '곤여만국전도, 기하원본, 그리고 손에서 손으로 도는 교리서. 배울 것도 많고 숨길 것도 있다.'), cost: 5, evening: true, minAge: 16, from: 1784, to: 1886 },
];

// ---------------------------------------------------------------- writings (Part XIII §7.6)

export type WorkKind = { id: string; name: Text; text: Text; needs: Text; titles: [string, string][] };
export const WORK_KINDS: WorkKind[] = [
  { id: 'poem', name: T('A collection of poems', '시집'), text: T('Verses of the seasons and of people you have known.', '계절과 사람을 읊은 시들.'), needs: T('Poetry 25', '시작 25'),
    titles: [['Snow on the Plum Branch', '매화 가지의 눈'], ['Songs of the Rear Garden', '후원의 노래'], ['Rain at the Paper Window', '창호에 듣는 비'], ['Moon over the Han River', '한강의 달'], ['Leaves of a Quiet Year', '고요한 해의 잎새'], ['The Crane’s Shadow', '학의 그림자']] },
  { id: 'essay', name: T('Essays', '수필집'), text: T('Short prose on conduct, friendship and the times.', '처세와 벗과 시절을 다룬 짧은 글.'), needs: T('Classics 40', '경서 40'),
    titles: [['Idle Talk by Lamplight', '등잔 아래 한담'], ['On Friendship and Wine', '벗과 술에 대하여'], ['Notes from the Outer Room', '사랑방 잡록'], ['Words I Could Not Say at Court', '조정에서 못다 한 말'], ['A Brush in Winter', '겨울의 붓']] },
  { id: 'travel', name: T('A travel record', '기행문'), text: T('What you saw on the road, in the provinces or beyond the border.', '길 위에서, 지방에서, 국경 너머에서 본 것.'), needs: T('One journey or an embassy', '여행 한 번 또는 사행'),
    titles: [['Record of the Eight Provinces', '팔도 유람기'], ['Diary of the Northern Road', '북행 일기'], ['Beyond the Yalu', '압록강 너머'], ['Inns and Mountain Passes', '주막과 고갯길'], ['Sea Roads of the South', '남해 뱃길']] },
  { id: 'chronicle', name: T('A family chronicle', '가승'), text: T('The house’s story, set down for those who come after.', '후손을 위해 적어 두는 집안의 내력.'), needs: T('Age 40', '나이 40'),
    titles: [['Chronicle of Our House', '우리 집안의 내력'], ['What My Father Told Me', '아버님께 들은 이야기'], ['Instructions to My Descendants', '후손에게 주는 글'], ['The Family Through Three Reigns', '세 임금을 거친 가문']] },
  { id: 'commentary', name: T('A commentary on the classics', '경서 주해'), text: T('Your own reading of the sages, argued line by line.', '성현의 글을 한 줄 한 줄 풀이한 당신의 해석.'), needs: T('Classics 65, calligraphy 30', '경서 65, 서예 30'),
    titles: [['Questions on the Doctrine of the Mean', '중용 질의'], ['A Reading of the Analects', '논어 강설'], ['On Principle and Material Force', '이기설'], ['Notes on the Book of Rites', '예기 차록']] },
  { id: 'medical', name: T('Medical notes', '의방 초록'), text: T('Remedies that worked, set down plainly for the household.', '효험 본 처방을 집안을 위해 쉽게 적은 글.'), needs: T('Herbal lore 60', '의약 지식 60'),
    titles: [['Remedies of One Household', '한 집안의 처방'], ['Simple Cures for the Countryside', '시골 구급방'], ['Notes on Fevers', '온역 잡기']] },
  { id: 'album', name: T('A painting album', '화첩'), text: T('Leaves of ink: orchids, bamboo, mountains in mist.', '먹으로 그린 난초와 대나무, 안개 낀 산.'), needs: T('Ink painting 50', '서화 50'),
    titles: [['Album of the Four Gentlemen', '사군자첩'], ['Mountains in Mist', '운산도첩'], ['Flowers and Insects', '초충도첩'], ['Scenes of the Capital', '경도 풍속첩']] },
];
export const workBand = (q: number): Text => (q >= 80 ? T('Celebrated', '명작') : q >= 55 ? T('Fine', '수작') : q >= 30 ? T('Respectable', '무난함') : T('Minor', '습작'));

// ---------------------------------------------------------------- patronage (Part XIII §10, Part XVI §15)

export type PatronDef = { id: string; name: Text; text: Text; cost: number; house: boolean };
export const PATRONAGE: PatronDef[] = [
  { id: 'scholar', name: T('Support a poor scholar', '가난한 선비를 후원한다'), text: T('Rice, paper and a room for a year. If he passes, he will not forget.', '한 해 치 쌀과 종이와 방. 급제하면 잊지 않을 것이다.'), cost: 60, house: false },
  { id: 'painting', name: T('Commission a folding screen', '병풍을 주문한다'), text: T('Eight panels from a court painter. The house looks its standing.', '화원의 여덟 폭 병풍. 집안의 격이 드러난다.'), cost: 90, house: true },
  { id: 'school', name: T('Endow a village school', '서당을 세운다'), text: T('A roof, a teacher and a shelf of primers for the village children.', '마을 아이들을 위한 지붕과 훈장과 책 한 시렁.'), cost: 150, house: true },
  { id: 'temple', name: T('Repair a temple hall', '절 법당을 중수한다'), text: T('New tiles and fresh paint for an old mountain hall.', '오래된 산사 법당에 새 기와와 단청.'), cost: 120, house: true },
  { id: 'print', name: T('Print your writings', '문집을 간행한다'), text: T('Woodblocks cut and bound copies sent to friends and academies.', '목판을 새기고 책을 묶어 벗과 서원에 보낸다.'), cost: 110, house: false },
  { id: 'relief', name: T('Give relief rice to the poor', '가난한 이들에게 구휼미를 낸다'), text: T('Open the storehouse in a hungry season.', '보릿고개에 곳간을 연다.'), cost: 100, house: true },
];

// ---------------------------------------------------------------- companion animals

export type PetDef = { id: string; name: Text; text: Text; cost: number; span: number; who: 'any' | 'man'; names: [string, string][] };
export const PETS: PetDef[] = [
  { id: 'sapsali', name: T('A sapsali dog', '삽살개'), text: T('Shaggy, loyal, said to drive off ghosts.', '털북숭이에 충직하고 귀신을 쫓는다는 개.'), cost: 8, span: 13, who: 'any', names: [['Bok-sil', '복실'], ['Gom', '곰'], ['Dol-i', '돌이'], ['Samsik', '삼식']] },
  { id: 'jindo', name: T('A Jindo dog', '진돗개'), text: T('From the southern island: proud and brave, one master only.', '남쪽 섬에서 온 개. 당당하고 용맹하며 주인은 하나뿐.'), cost: 15, span: 14, who: 'any', names: [['Baek-gu', '백구'], ['Hwang-gu', '황구'], ['Nuri', '누리'], ['Baram', '바람']] },
  { id: 'cat', name: T('A cat', '고양이'), text: T('Keeps the granary free of mice and the lap warm.', '곳간의 쥐를 잡고 무릎을 덥혀 준다.'), cost: 4, span: 15, who: 'any', names: [['Nabi', '나비'], ['Geum-son', '금손'], ['Bom', '봄'], ['Kkam-i', '까미']] },
  { id: 'falcon', name: T('A hunting falcon', '사냥매'), text: T('A trained haedongcheong for winter hunts. A gentleman’s pride.', '겨울 사냥을 위한 길들인 해동청. 사내의 자랑.'), cost: 60, span: 11, who: 'man', names: [['Song-gol', '송골'], ['Bora', '보라'], ['Cheong', '청']] },
  { id: 'crane', name: T('A garden crane', '정원의 학'), text: T('The scholar’s bird: a pair of red-crowned cranes in the garden.', '선비의 새. 뜰을 거니는 단정학.'), cost: 45, span: 24, who: 'any', names: [['Cheong-hak', '청학'], ['Un', '운'], ['Seol', '설']] },
];
export const petById = (id: string) => PETS.find((p) => p.id === id);

// ---------------------------------------------------------------- the year's festivals (Part XIII §12)

/** One line for the season report each year: season 0 spring … 3 winter. */
export const FESTIVAL_LINES: Text[][] = [
  [T('Daeboreum: you cracked nuts at dawn and watched the first full moon rise.', '정월 대보름: 새벽에 부럼을 깨고 첫 보름달을 맞았다.'), T('Samjinnal: azalea rice cakes on the hillside, and the swallows back from the south.', '삼짇날: 산자락에서 화전을 부치고, 강남 갔던 제비가 돌아왔다.')],
  [T('The eighth of the fourth moon: paper lanterns hung along every eave.', '사월 초파일: 처마마다 연등이 걸렸다.'), T('Yudu: the household washed its hair in the east-flowing stream.', '유두: 온 식구가 동쪽으로 흐르는 물에 머리를 감았다.')],
  [T('Chilseok: magpies were scarce, and it rained a little at dusk, as it should.', '칠석: 까치가 보이지 않더니 해 질 녘에 비가 조금 내렸다.'), T('Jungyangjeol: chrysanthemum wine on the hill, and poems that improved with each cup.', '중양절: 산에 올라 국화주를 마시니 잔을 거듭할수록 시가 좋아졌다.')],
  [T('Dongji: red-bean porridge at every door to keep the long night out.', '동지: 긴 밤을 물리려 문마다 팥죽을 뿌렸다.'), T('The last night of the year: lamps lit in every room, and no one slept.', '섣달그믐: 방마다 불을 밝히고 아무도 잠들지 않았다.')],
];

import type { Text } from '../model/schemas';
import { T } from '../engine/text';

/**
 * GSDD Part III, kept to what the main loop needs: the eight provinces and the capital, a few goods,
 * estates and buildings, household posts, businesses, weather and disasters. Amounts are in nyang.
 */

export type ProvinceDef = {
  id: string;
  name: Text;
  seat: Text;
  /** Days on horseback from Hanseong. */
  days: number;
  /** Where the province sits on the map, in percent. */
  x: number;
  y: number;
  /** Goods it produces cheaply. */
  makes: string[];
  north: boolean;
  text: Text;
};
export const PROVINCES: ProvinceDef[] = [
  { id: 'hanseong', name: T('Hanseong', '한성'), seat: T('the capital', '도성'), days: 0, x: 44, y: 49, makes: [], north: false, text: T('The capital: the court, the ministries and the great markets of Unjongga.', '도읍. 조정과 관아, 운종가의 큰 시전이 있다.') },
  { id: 'gyeonggi', name: T('Gyeonggi', '경기도'), seat: T('Suwon', '수원'), days: 1, x: 47, y: 54, makes: ['rice', 'salt'], north: false, text: T('The capital province of rice fields and royal tombs.', '논과 왕릉이 많은 도읍의 울타리.') },
  { id: 'chungcheong', name: T('Chungcheong', '충청도'), seat: T('Gongju', '공주'), days: 3, x: 47, y: 65, makes: ['rice', 'cotton'], north: false, text: T('Scholars’ country, with fertile plains.', '선비의 고장, 기름진 들판.') },
  { id: 'jeolla', name: T('Jeolla', '전라도'), seat: T('Jeonju', '전주'), days: 6, x: 42, y: 79, makes: ['rice', 'paper', 'cotton'], north: false, text: T('The granary of the kingdom; Jeonju paper is the best there is.', '나라의 곳간. 전주 한지는 으뜸이다.') },
  { id: 'gyeongsang', name: T('Gyeongsang', '경상도'), seat: T('Daegu', '대구'), days: 6, x: 63, y: 73, makes: ['cotton', 'salt', 'rice'], north: false, text: T('The largest province, facing Japan across the strait.', '가장 큰 도. 바다 건너 일본을 마주한다.') },
  { id: 'gangwon', name: T('Gangwon', '강원도'), seat: T('Wonju', '원주'), days: 3, x: 61, y: 46, makes: ['timber', 'ginseng'], north: false, text: T('Mountains, timber and the Diamond Mountains.', '산과 목재, 그리고 금강산.') },
  { id: 'hwanghae', name: T('Hwanghae', '황해도'), seat: T('Haeju', '해주'), days: 3, x: 33, y: 44, makes: ['rice', 'salt'], north: true, text: T('Rice and salt on the western sea.', '서해의 쌀과 소금.') },
  { id: 'pyeongan', name: T('Pyeongan', '평안도'), seat: T('Pyongyang', '평양'), days: 6, x: 33, y: 29, makes: ['silk', 'ginseng'], north: true, text: T('The road to China; Uiju merchants trade across the Yalu.', '중국으로 가는 길목. 의주 상인이 압록강 너머와 거래한다.') },
  { id: 'hamgyeong', name: T('Hamgyeong', '함경도'), seat: T('Hamhung', '함흥'), days: 10, x: 60, y: 22, makes: ['timber', 'ginseng'], north: true, text: T('The cold north-east frontier, birthplace of the dynasty.', '추운 동북 변경. 왕조가 일어난 곳.') },
];
export const provinceById = (id: string) => PROVINCES.find((p) => p.id === id) ?? PROVINCES[0];

export const GOODS: { id: string; name: Text; unit: Text; base: number }[] = [
  { id: 'rice', name: T('Rice', '쌀'), unit: T('sack', '섬'), base: 10 },
  { id: 'cotton', name: T('Cotton cloth', '무명'), unit: T('bolt', '필'), base: 14 },
  { id: 'silk', name: T('Silk', '비단'), unit: T('bolt', '필'), base: 40 },
  { id: 'salt', name: T('Salt', '소금'), unit: T('sack', '섬'), base: 8 },
  { id: 'ginseng', name: T('Ginseng', '인삼'), unit: T('bundle', '근'), base: 60 },
  { id: 'timber', name: T('Timber', '목재'), unit: T('load', '바리'), base: 12 },
  { id: 'paper', name: T('Paper', '한지'), unit: T('bundle', '권'), base: 16 },
];
export const goodById = (id: string) => GOODS.find((g) => g.id === id) ?? GOODS[0];

export type EstateKind = { id: string; name: Text; text: Text; good: string | null; income: number; value: number; prestige: number };
export const ESTATE_KINDS: EstateKind[] = [
  { id: 'town', name: T('Residence in the capital', '도성 저택'), text: T('The family seat: halls, courtyards and the household that runs them.', '가문의 본가. 사랑채, 안채, 그리고 살림을 꾸리는 사람들.'), good: null, income: 0, value: 900, prestige: 1 },
  { id: 'farm', name: T('Farm estate', '농장'), text: T('Rice land worked by tenants; the harvest comes in autumn.', '소작인이 부치는 논. 가을에 거둔다.'), good: 'rice', income: 50, value: 1200, prestige: 0 },
  { id: 'forest', name: T('Woodland', '임야'), text: T('Timber and firewood for sale.', '목재와 땔감을 판다.'), good: 'timber', income: 24, value: 600, prestige: 0 },
  { id: 'shops', name: T('Shop fronts', '점포'), text: T('Market stalls let to merchants for rent.', '상인에게 세를 주는 가게.'), good: null, income: 34, value: 900, prestige: 0 },
  { id: 'villa', name: T('Country house', '별서'), text: T('A retreat for study and rest, and a sign of standing.', '공부와 휴식을 위한 별장이자 신분의 표지.'), good: null, income: 0, value: 800, prestige: 1 },
];
export const estateKind = (id: string) => ESTATE_KINDS.find((k) => k.id === id) ?? ESTATE_KINDS[0];

/** GSDD Part III §7.2. `on` says which estates can have it. */
export type BuildingDef = { id: string; name: Text; text: Text; on: string[]; cost: number; seasons: number; upkeep: number; prestige: number; effect: Text };
export const BUILDINGS: BuildingDef[] = [
  { id: 'shrine', name: T('Ancestral shrine', '사당'), text: T('Where the family tablets are kept and the rites performed.', '신주를 모시고 제사를 올리는 곳.'), on: ['town'], cost: 420, seasons: 2, upkeep: 4, prestige: 2, effect: T('Honour and family standing', '명예와 가문의 위세') },
  { id: 'library', name: T('Library', '서고'), text: T('Shelves of the classics and histories.', '경서와 사서를 갖춘 서고.'), on: ['town', 'villa'], cost: 380, seasons: 2, upkeep: 4, prestige: 1, effect: T('Faster study of the classics', '경학 공부가 빨라진다') },
  { id: 'study', name: T('Study hall', '서재'), text: T('A quiet room for tutors and pupils.', '스승과 제자를 위한 조용한 방.'), on: ['town', 'villa'], cost: 260, seasons: 1, upkeep: 3, prestige: 0, effect: T('Faster study in every field', '모든 공부가 빨라진다') },
  { id: 'pavilion', name: T('Pavilion', '정자'), text: T('An open pavilion for poetry and guests.', '시회와 손님맞이를 위한 정자.'), on: ['town', 'villa'], cost: 340, seasons: 1, upkeep: 3, prestige: 1, effect: T('Gatherings raise more regard', '모임에서 더 많은 호감을 얻는다') },
  { id: 'garden', name: T('Lotus pond garden', '연못 정원'), text: T('A square pond with a round island.', '네모난 연못에 둥근 섬.'), on: ['town', 'villa'], cost: 240, seasons: 1, upkeep: 2, prestige: 1, effect: T('Health recovers faster', '건강 회복이 빨라진다') },
  { id: 'guesthall', name: T('Guest hall', '별당'), text: T('Rooms for visitors of rank.', '귀한 손님을 위한 별채.'), on: ['town'], cost: 520, seasons: 2, upkeep: 5, prestige: 1, effect: T('Banquets cost less and do more', '연회 비용이 줄고 효과가 커진다') },
  { id: 'storehouse', name: T('Storehouse', '곳간'), text: T('Grain stored against a bad year.', '흉년에 대비한 곡식 창고.'), on: ['town', 'farm'], cost: 200, seasons: 1, upkeep: 2, prestige: 0, effect: T('Holds more grain; disasters hurt less', '곡식을 더 쌓고 재해 피해가 준다') },
  { id: 'stable', name: T('Stable', '마구간'), text: T('Horses for travel and riding practice.', '나들이와 말타기 연습을 위한 말.'), on: ['town', 'villa'], cost: 230, seasons: 1, upkeep: 4, prestige: 0, effect: T('Travel is quicker; riding practice', '여행이 빨라지고 말타기를 익힌다') },
  { id: 'walls', name: T('Repaired walls and gate', '담장과 대문 보수'), text: T('Stout walls and a watchman’s room.', '튼튼한 담과 문간방.'), on: ['town', 'villa', 'shops'], cost: 160, seasons: 1, upkeep: 1, prestige: 0, effect: T('Security against theft', '도둑을 막는다') },
  { id: 'weir', name: T('Irrigation weir', '보(洑)'), text: T('Water held back for the dry months.', '가뭄에 대비해 물을 가둔다.'), on: ['farm'], cost: 300, seasons: 2, upkeep: 2, prestige: 0, effect: T('Higher harvests; drought hurts less', '수확이 늘고 가뭄 피해가 준다') },
  { id: 'mill', name: T('Mill', '방앗간'), text: T('Grain husked on the estate, not sold raw.', '곡식을 직접 찧어 판다.'), on: ['farm'], cost: 220, seasons: 1, upkeep: 2, prestige: 0, effect: T('Higher farm income', '농장 수입이 는다') },
  { id: 'tenants', name: T('Tenant cottages', '행랑과 소작인 집'), text: T('Better homes keep good tenants.', '좋은 집이 좋은 소작인을 붙잡는다.'), on: ['farm', 'forest'], cost: 180, seasons: 1, upkeep: 1, prestige: 0, effect: T('Productivity holds up', '생산성이 유지된다') },
];
export const buildingById = (id: string) => BUILDINGS.find((b) => b.id === id);

/** GSDD Part III §6.1. One person per post; servants are counted, not named. */
export type StaffRole = { id: string; name: Text; text: Text; wage: number; key: boolean };
export const STAFF_ROLES: StaffRole[] = [
  { id: 'steward', name: T('Steward', '집사'), text: T('Runs the household; a good one stops money leaking away.', '살림을 맡는다. 유능하면 새는 돈을 막는다.'), wage: 8, key: true },
  { id: 'manager', name: T('Estate manager', '마름'), text: T('Runs the country estates in your absence.', '없는 동안 시골 전장을 관리한다.'), wage: 9, key: true },
  { id: 'clerk', name: T('Accounts clerk', '서사'), text: T('Keeps the books; catches fraud.', '장부를 맡는다. 부정을 잡아낸다.'), wage: 6, key: false },
  { id: 'tutor', name: T('Tutor', '독선생'), text: T('Teaches you or your children at home.', '집에서 당신이나 아이들을 가르친다.'), wage: 10, key: false },
  { id: 'physician', name: T('Household physician', '집안 의원'), text: T('Keeps the family in health.', '식구들의 건강을 돌본다.'), wage: 10, key: false },
  { id: 'attendant', name: T('Personal attendant', '몸종'), text: T('Goes where you go; hears what you miss.', '어디든 따라다니며 놓친 말을 듣는다.'), wage: 4, key: false },
  { id: 'cook', name: T('Head cook', '찬모'), text: T('A good table keeps guests and servants content.', '좋은 상차림은 손님과 하인을 만족시킨다.'), wage: 5, key: false },
  { id: 'guard', name: T('Gatekeeper and guards', '청지기와 수직꾼'), text: T('Keeps thieves and unwanted callers out.', '도둑과 불청객을 막는다.'), wage: 6, key: false },
  { id: 'messenger', name: T('Messenger', '심부름꾼'), text: T('Carries letters, and brings news back.', '편지를 나르고 소식을 물어 온다.'), wage: 3, key: false },
];
export const staffRole = (id: string) => STAFF_ROLES.find((r) => r.id === id) ?? STAFF_ROLES[0];
/** Wages per servant per season. */
export const SERVANT_WAGE = 2;

export type BusinessKind = { id: string; name: Text; text: Text; good: string | null; margin: number; risk: number; min: number };
export const BUSINESS_KINDS: BusinessKind[] = [
  { id: 'inn', name: T('Inn and tavern', '주막과 객사'), text: T('Travellers pay for rice wine, soup and a warm floor.', '나그네가 막걸리와 국밥, 따뜻한 방에 돈을 낸다.'), good: 'rice', margin: 0.07, risk: 0.06, min: 150 },
  { id: 'cloth', name: T('Cloth shop', '포목전'), text: T('Cotton and silk for the capital’s tailors.', '도성 바느질집에 무명과 비단을 댄다.'), good: 'cotton', margin: 0.08, risk: 0.07, min: 250 },
  { id: 'broker', name: T('Merchant broker', '객주'), text: T('Lodges travelling merchants and handles their goods for a fee.', '객상을 묵게 하고 물건을 맡아 거간한다.'), good: null, margin: 0.09, risk: 0.09, min: 400 },
  { id: 'boats', name: T('River boats and warehouse', '경강 선상과 창고'), text: T('Carries tax grain and goods up the Han River.', '한강을 따라 세곡과 물건을 실어 나른다.'), good: 'salt', margin: 0.1, risk: 0.11, min: 500 },
  { id: 'workshop', name: T('Brassware workshop', '유기 공방'), text: T('Bowls and spoons for every household that can afford them.', '형편 되는 집마다 쓰는 놋그릇과 수저.'), good: null, margin: 0.08, risk: 0.06, min: 300 },
  { id: 'ginseng', name: T('Ginseng fields', '인삼밭'), text: T('Slow to grow, precious when sold.', '자라는 데 오래 걸리지만 값지다.'), good: 'ginseng', margin: 0.12, risk: 0.13, min: 600 },
];
export const businessKind = (id: string) => BUSINESS_KINDS.find((k) => k.id === id) ?? BUSINESS_KINDS[0];

/** GSDD Part III §14.2. */
export const WEATHER: Record<string, Text> = {
  clear: T('Clear', '맑음'), rain: T('Rain', '비'), storm: T('Heavy rain', '폭우'), snow: T('Snow', '눈'),
  heat: T('Heat', '무더위'), cold: T('Bitter cold', '혹한'), wind: T('Strong winds', '강풍'), fog: T('Fog', '안개'),
};
/** Weather by season: spring, summer, autumn, winter. */
export const SEASON_WEATHER: string[][] = [
  ['clear', 'clear', 'rain', 'wind', 'fog'],
  ['rain', 'storm', 'heat', 'clear', 'rain'],
  ['clear', 'clear', 'wind', 'rain', 'fog'],
  ['snow', 'cold', 'clear', 'snow', 'wind'],
];

/** GSDD Part III §14.3, with the warning that comes a season before. */
export const DISASTERS: Record<string, { name: Text; warn: Text; seasons: number[]; hurts: string[]; text: Text }> = {
  drought: { name: T('Drought', '가뭄'), warn: T('Little snow fell and the wells are low.', '눈이 적게 내려 우물이 마르고 있다.'), seasons: [0, 1], hurts: ['rice', 'cotton'], text: T('The paddies crack and the seedlings wither.', '논이 갈라지고 모가 말라 간다.') },
  flood: { name: T('Flood', '홍수'), warn: T('The rivers run high with spring rain.', '봄비로 강물이 불었다.'), seasons: [1], hurts: ['rice', 'salt'], text: T('The rivers burst their banks and carry away fields and houses.', '강이 넘쳐 논밭과 집을 쓸어 갔다.') },
  storm: { name: T('Typhoon', '태풍'), warn: T('Fishermen say the sea has turned strange.', '어부들이 바다 기색이 이상하다고 한다.'), seasons: [1, 2], hurts: ['rice', 'timber', 'salt'], text: T('A great wind tears roofs off and flattens the crops.', '큰바람이 지붕을 걷어 가고 곡식을 쓰러뜨렸다.') },
  blight: { name: T('Crop failure', '흉작'), warn: T('Insects swarm in the summer fields.', '여름 들판에 벌레가 들끓는다.'), seasons: [2], hurts: ['rice', 'cotton'], text: T('The harvest comes in thin and grey.', '거둔 곡식이 적고 부실하다.') },
  epidemic: { name: T('Epidemic', '역병'), warn: T('A fever is reported in the port towns.', '포구 고을에 열병이 돈다는 소문이다.'), seasons: [0, 1, 2, 3], hurts: [], text: T('Fever spreads from house to house.', '열병이 집집마다 번진다.') },
  freeze: { name: T('Great cold', '대한파'), warn: T('Geese flew south early this year.', '올해는 기러기가 일찍 남으로 날아갔다.'), seasons: [3], hurts: ['timber', 'ginseng'], text: T('Rivers freeze solid and the old and poor suffer.', '강이 꽁꽁 얼고 노인과 가난한 이들이 고통받는다.') },
};

/** GSDD Part III §13.1: how to travel and what it costs per day. */
export const TRAVEL: { id: string; name: Text; speed: number; cost: number; needs?: string }[] = [
  { id: 'walk', name: T('On foot', '걸어서'), speed: 0.6, cost: 0 },
  { id: 'horse', name: T('On horseback', '말을 타고'), speed: 1, cost: 2 },
  { id: 'palanquin', name: T('By palanquin', '가마를 타고'), speed: 0.7, cost: 5 },
  { id: 'boat', name: T('By river and sea', '배를 타고'), speed: 1.4, cost: 3, needs: 'coast' },
];

/** Who lends money, at what rate per season. */
export const LENDERS: { id: string; name: Text; rate: number; max: number }[] = [
  { id: 'kin', name: T('A wealthy cousin', '부유한 친척'), rate: 0.02, max: 300 },
  { id: 'merchant', name: T('A Gaeseong merchant', '개성 상인'), rate: 0.06, max: 1200 },
  { id: 'usurer', name: T('A moneylender in the alleys', '골목의 고리대금업자'), rate: 0.12, max: 2500 },
];

/** Seasonal household expenses, by family size and wealth band. */
export const HOUSEHOLD_BASE: Record<'poor' | 'modest' | 'comfortable' | 'rich', number> = { poor: 6, modest: 12, comfortable: 30, rich: 62 };
/** Seasonal allowance from the family to a member who does not hold the keys. */
export const ALLOWANCE: Record<'poor' | 'modest' | 'comfortable' | 'rich', number> = { poor: 3, modest: 6, comfortable: 16, rich: 35 };

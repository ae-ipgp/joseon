import type { Background, Campaign, Game, Gender, Text } from '../model/schemas';
import { T } from '../engine/text';

/*
 * v0.6 scenarios: a life begun with a goal. Each sets the family, the year and the age, and names what
 * counts as success. They are fictional lives in the historical world (or the sandbox), not history.
 */
export type ScenarioDef = {
  id: string;
  seal: string;
  name: Text;
  text: Text;
  goal: Text;
  campaign: Campaign;
  background: Background;
  /** Fixed, or the player's choice. */
  gender: Gender | 'any';
  age: number;
  /** The goal must be met by this age (in the first life, unless heirs carry it on). */
  byAge?: number;
  /** The goal may be finished by a later generation. */
  heirs?: boolean;
  hard: 1 | 2 | 3;
  won: (g: Game) => boolean;
  /** How far along, in words. */
  progress: (g: Game) => Text;
};

const hist = (era: number, continuity: 'strict' | 'limited' | 'dynamic' = 'limited'): Campaign => ({ mode: 'historical', era, premise: null, continuity });
const wealth = (g: Game) => g.player.money + (g.player.legal === 'commoner' ? 0 : g.econ.treasury);
const works = (g: Game) => g.player.works.length;
const friends = (g: Game) => Object.keys(g.rel).filter((id) => g.npcs[id]?.alive && !g.npcs[id].kin && g.rel[id].met && g.rel[id].regard >= 45).length;
const allies = (g: Game) => Object.keys(g.flags).filter((k) => k.startsWith('ally-') && g.flags[k]).length;
const best = (g: Game) => Math.max(0, ...Object.values(g.player.skills));

export const SCENARIOS: ScenarioDef[] = [
  {
    id: 'first-on-the-list', seal: '壯', hard: 1, background: 'scholarly', gender: 'man', age: 15, byAge: 30, campaign: hist(1724),
    name: T('First on the List', '장원 급제'),
    text: T('Three generations of scholars, and not one office among them. Your grandfather has decided that you will be the one.', '삼대가 글만 읽고 벼슬은 하나도 없었다. 할아버지는 당신이 그 사람이 되리라 정하셨다.'),
    goal: T('Pass the great civil examination before you are thirty.', '서른 전에 문과에 급제한다.'),
    won: (g) => g.player.quals.includes('munkwa'),
    progress: (g) => T(`Classics ${g.player.edu.classics ?? 0}${g.player.quals.includes('sogwa') ? ', licentiate' : ''}.`, `경서 ${g.player.edu.classics ?? 0}${g.player.quals.includes('sogwa') ? ', 생원' : ''}.`),
  },
  {
    id: 'inner-palace', seal: '嬪', hard: 2, background: 'noble', gender: 'woman', age: 15, byAge: 26, campaign: hist(1724),
    name: T('The Road to the Inner Palace', '내전으로 가는 길'),
    text: T('The palace will choose a bride for the crown prince. Your mother has been preparing you for this since you could walk.', '궁에서 세자빈을 간택한다. 어머니는 당신이 걸음마를 뗀 날부터 이날을 준비하셨다.'),
    goal: T('Enter the royal household before you are twenty-six.', '스물여섯 전에 왕실에 든다.'),
    won: (g) => g.player.royal !== 'none',
    progress: (g) => T(`Royal favour ${g.player.favour}, grace ${g.player.qualities.grace}.`, `총애 ${g.player.favour}, 기품 ${g.player.qualities.grace}.`),
  },
  {
    id: 'fallen-house', seal: '興', hard: 2, background: 'declining', gender: 'any', age: 17, heirs: true, campaign: hist(1776),
    name: T('The House That Fell', '기운 가문'),
    text: T('The roof leaks, the land is mortgaged and the name is all that is left. A name is not nothing.', '지붕은 새고 땅은 저당 잡혔으며 남은 것은 이름뿐이다. 그래도 이름은 아무것도 아닌 게 아니다.'),
    goal: T('Raise the family to prestige 4 with 3,000 nyang, in this life or the next.', '이번 생이든 다음 생이든 가문의 위세 4와 재산 3,000냥을 이룬다.'),
    won: (g) => g.house.prestige >= 4 && wealth(g) >= 3000 && g.player.legal !== 'commoner',
    progress: (g) => T(`Prestige ${g.house.prestige} of 4, ${Math.round(wealth(g))} of 3,000 nyang.`, `위세 ${g.house.prestige}/4, 재산 ${Math.round(wealth(g))}/3,000냥.`),
  },
  {
    id: 'northern-frontier', seal: '將', hard: 3, background: 'military', gender: 'man', age: 18, campaign: hist(1620),
    name: T('The Northern Frontier', '북방의 장수'),
    text: T('The Jurchen are gathering beyond the Yalu, and everyone on the border knows what is coming. Everyone in the capital prefers not to.', '압록강 너머에 여진이 모여들고 있다. 변방 사람들은 무엇이 올지 다 안다. 도성 사람들은 모르고 싶어 한다.'),
    goal: T('Win two victories and live to see 1640.', '두 번 승전하고 1640년까지 살아남는다.'),
    won: (g) => (g.counts.victories ?? 0) >= 2 && g.date.year >= 1640 && g.player.alive,
    progress: (g) => T(`${g.counts.victories ?? 0} of 2 victories; the year is ${g.date.year}.`, `승전 ${g.counts.victories ?? 0}/2, 지금은 ${g.date.year}년.`),
  },
  {
    id: 'black-dragon-year', seal: '亂', hard: 2, background: 'landed', gender: 'any', age: 20, campaign: hist(1590),
    name: T('The Year of the Black Dragon', '임진년'),
    text: T('It is 1590. The granaries are full and the talk is of weddings. In two years the war will come up the road from Busan.', '1590년. 곳간은 가득하고 혼담이 오간다. 두 해 뒤, 전쟁이 부산에서 길을 따라 올라올 것이다.'),
    goal: T('Come through the war: be alive in 1599, still of noble status, with 500 nyang.', '전란을 견딘다. 1599년에 양반 신분으로 500냥을 지니고 살아 있다.'),
    won: (g) => g.date.year >= 1599 && g.player.alive && g.player.legal !== 'commoner' && wealth(g) >= 500,
    progress: (g) => T(`The year is ${g.date.year}; ${Math.round(wealth(g))} nyang.`, `지금은 ${g.date.year}년, 재산 ${Math.round(wealth(g))}냥.`),
  },
  {
    id: 'life-of-letters', seal: '文', hard: 2, background: 'scholarly', gender: 'any', age: 16, campaign: hist(1776),
    name: T('A Life of Letters', '문장으로 사는 삶'),
    text: T('The new king loves books and the capital is full of poets. You have a brush, an ink stone and no intention of taking office.', '새 임금은 책을 아끼고 도성에는 시인이 넘친다. 당신에게는 붓과 벼루가 있고, 벼슬할 뜻은 없다.'),
    goal: T('Finish three works and master one art.', '작품 세 편을 완성하고 한 가지 재주의 대가가 된다.'),
    won: (g) => works(g) >= 3 && best(g) >= 80,
    progress: (g) => T(`${works(g)} of 3 works; best art ${best(g)} of 80.`, `작품 ${works(g)}/3, 으뜸 재주 ${best(g)}/80.`),
  },
  {
    id: 'silk-and-silver', seal: '商', hard: 2, background: 'landed', gender: 'any', age: 19,
    campaign: { mode: 'alternative', era: 1724, premise: 'peace', rules: { womenOffice: false, succession: 'male', mobility: 'open', authority: 3, strife: 2, commerce: true, preset: 'reformist', tax: 2 } },
    name: T('Silk and Silver', '비단과 은'),
    text: T('In this Joseon a reforming king has made trade respectable. Your family has land; you have ideas.', '이 조선에서는 개혁 군주가 상업을 떳떳한 일로 만들었다. 집안에는 땅이 있고 당신에게는 생각이 있다.'),
    goal: T('Own two businesses and 8,000 nyang.', '사업 두 곳과 8,000냥을 가진다.'),
    won: (g) => g.econ.businesses.length >= 2 && wealth(g) >= 8000,
    progress: (g) => T(`${g.econ.businesses.length} of 2 businesses; ${Math.round(wealth(g))} of 8,000 nyang.`, `사업 ${g.econ.businesses.length}/2, 재산 ${Math.round(wealth(g))}/8,000냥.`),
  },
  {
    id: 'three-generations', seal: '代', hard: 3, background: 'noble', gender: 'any', age: 19, heirs: true, campaign: hist(1506),
    name: T('Three Generations', '삼대'),
    text: T('A coup has put a new king on the throne, and the purges are not over. A family that lasts three generations in these years has done something.', '반정으로 새 임금이 섰고 사화는 아직 끝나지 않았다. 이 시절에 삼대를 잇는 집안이라면 무언가 해낸 것이다.'),
    goal: T('Reach the third generation with the family still noble.', '양반 신분을 지킨 채 삼대째에 이른다.'),
    won: (g) => g.generation >= 3 && g.player.legal !== 'commoner',
    progress: (g) => T(`Generation ${g.generation} of 3.`, `${g.generation}대 / 3대.`),
  },
  {
    id: 'the-crown', seal: '王', hard: 3, background: 'royal', gender: 'man', age: 16, campaign: hist(1724, 'dynamic'),
    name: T('The Crown', '보위'),
    text: T('You are a prince of the blood in a court where the succession is never quite settled. History says another man reigns next. History can be argued with.', '당신은 후사가 늘 불안한 조정의 왕자다. 역사는 다른 이가 보위를 잇는다고 한다. 역사와 다투어 볼 수 있다.'),
    goal: T('Take the throne.', '보위에 오른다.'),
    won: (g) => !!g.counts.reigned,
    progress: (g) => T(`Legitimacy ${g.player.legitimacy}, royal favour ${g.player.favour}.`, `정통성 ${g.player.legitimacy}, 총애 ${g.player.favour}.`),
  },
  {
    id: 'healing-hands', seal: '醫', hard: 2, background: 'scholarly', gender: 'any', age: 17, campaign: hist(1610),
    name: T('Healing Hands', '의술의 길'),
    text: T('The war left more sick than physicians. A great medical book has just been finished at court, and you mean to read every page of it.', '전란은 의원보다 병자를 더 많이 남겼다. 조정에서 큰 의서가 막 완성되었고, 당신은 그 책을 한 장도 빼놓지 않고 읽을 작정이다.'),
    goal: T('Master herbal lore and write your own medical notes.', '의약 지식의 대가가 되고 자신의 의방 초록을 쓴다.'),
    won: (g) => (g.player.skills.medicine ?? 0) >= 80 && g.player.works.some((w) => w.kind === 'medical'),
    progress: (g) => T(`Herbal lore ${g.player.skills.medicine ?? 0} of 80; medical notes ${g.player.works.some((w) => w.kind === 'medical') ? 'written' : 'not yet written'}.`, `의약 지식 ${g.player.skills.medicine ?? 0}/80, 의방 초록 ${g.player.works.some((w) => w.kind === 'medical') ? '완성' : '아직'}.`),
  },
  {
    id: 'friends-in-every-hall', seal: '友', hard: 2, background: 'political', gender: 'any', age: 19, campaign: hist(1694),
    name: T('Friends in Every Hall', '사방의 벗'),
    text: T('Governments have fallen three times in fifteen years. Your family has learned that the only safe side is to be liked on both.', '열다섯 해 사이 환국이 세 번이었다. 집안이 배운 것은 하나, 양쪽 모두에게 호감을 사는 것만이 안전하다는 것이다.'),
    goal: T('Have eight friends (regard 45 or more) and two allies at the same time.', '벗 여덟(호감 45 이상)과 동맹 둘을 동시에 둔다.'),
    won: (g) => friends(g) >= 8 && allies(g) >= 2,
    progress: (g) => T(`${friends(g)} of 8 friends; ${allies(g)} of 2 allies.`, `벗 ${friends(g)}/8, 동맹 ${allies(g)}/2.`),
  },
  {
    id: 'open-hand', seal: '施', hard: 2, background: 'landed', gender: 'any', age: 28, campaign: hist(1750),
    name: T('The Open Hand', '베푸는 손'),
    text: T('The granaries are full and the name is new. Old families do not respect money; they respect what money has built.', '곳간은 가득하나 이름은 새것이다. 오래된 가문은 돈을 존중하지 않는다. 돈이 세운 것을 존중할 뿐이다.'),
    goal: T('Give patronage five times and raise the family to prestige 4.', '다섯 번 후원하고 가문의 위세를 4로 올린다.'),
    won: (g) => (g.counts.patronage ?? 0) >= 5 && g.house.prestige >= 4,
    progress: (g) => T(`${g.counts.patronage ?? 0} of 5 gifts; prestige ${g.house.prestige} of 4.`, `후원 ${g.counts.patronage ?? 0}/5, 위세 ${g.house.prestige}/4.`),
  },
];
export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);

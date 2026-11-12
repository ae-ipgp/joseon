import type { Background, Campaign, Gender, Npc, PortraitSpec, Rel, Text } from '../model/schemas';
import { T } from '../engine/text';
import { KINGS, reignIndex } from './history';
import { premiseOf } from './campaigns';
import { familyOf } from './families';

export function makeNpc(p: Partial<Npc> & Pick<Npc, 'id' | 'name' | 'role' | 'gender' | 'birthYear' | 'portrait'>): Npc {
  return {
    given: null, faction: 'none', likes: [], places: [], romance: false, giftable: true, kin: null, parents: [], spouse: null,
    house: null, alive: true, diedYear: null, away: false, sees: null, wants: null, talk: [], ...p,
  };
}
export const makeRel = (regard: number, met = true): Rel => ({ regard, bond: 'none', met, moments: [], talked: -1, gifted: -1 });

const full = (surname: Text, given: Text): Text => T(`${surname.en} ${given.en}`, `${surname.ko ?? surname.en}${given.ko ?? given.en}`);
const ordinalKo = (n: number) => `조선 제${n}대 임금`;

/** The ruler as an NPC. Historical kings change with the date; alternative rulers are fictional. */
export function rulerNpc(c: Campaign, year: number, moon: number): Npc {
  if (c.mode === 'alternative') {
    const p = premiseOf(c.premise);
    const queen = c.premise === 'queen';
    return makeNpc({
      id: 'king', name: p.ruler, role: c.rules?.dynasty === 'wang' ? T('Monarch of the restored Wang house', '다시 일어선 왕씨 왕실의 군주') : c.rules?.dynasty === 'new' ? T('First monarch of a new royal house', '새 왕가의 첫 군주') : queen ? T('Queen of Joseon, the first to rule in her own name', '제 이름으로 다스리는 첫 여왕') : T('King of Joseon', '조선의 임금'),
      gender: queen ? 'woman' : 'man', birthYear: c.era - (queen ? 27 : 46),
      portrait: { kind: queen ? 'queen' : 'king' }, faction: 'crown', giftable: false, places: ['throne-hall'],
      sees: T('The child of a {factionB} family. Nothing more, yet.', '{factionB} 집안의 자식. 아직은 그 이상도 이하도 아니다.'),
      wants: T('To rule above the factions, and to be obeyed.', '당파 위에서 다스리고, 따르게 하는 것.'),
    });
  }
  const i = reignIndex(year, moon);
  const k = KINGS[i];
  const n = i + 1;
  const ord = n === 1 ? 'first' : n === 2 ? 'second' : n === 3 ? 'third' : `${n}th`;
  return makeNpc({
    id: 'king', name: k.title, role: T(`The ${ord} king of Joseon`, ordinalKo(n)), gender: 'man', birthYear: k.born,
    portrait: { kind: 'king' }, faction: 'crown', giftable: false, places: ['throne-hall'],
    sees: T('The child of a {factionB} family. Nothing more, yet.', '{factionB} 집안의 자식. 아직은 그 이상도 이하도 아니다.'),
    wants: T('To rule above the factions, and to be obeyed.', '당파 위에서 다스리고, 따르게 하는 것.'),
  });
}

type World = { npcs: Record<string, Npc>; rel: Record<string, Rel> };

/** Everyone the first generation knows: family, court and the ruler. */
export function buildWorld(c: Campaign, start: { year: number; moon: number }, background: Background, gender: Gender, age: number): World {
  const y = start.year;
  const f = familyOf(background);
  const woman = gender === 'woman';
  const npcs: Record<string, Npc> = {};
  const rel: Record<string, Rel> = {};
  const add = (n: Npc, r: Rel) => { npcs[n.id] = n; rel[n.id] = r; };
  const house = { surname: f.surname, prestige: f.prestige, faction: f.faction, background };

  // ---------------------------------------------------------------- family
  add(makeNpc({
    id: 'grandfather', name: f.grandfather.full ?? full(f.surname, f.grandfather.given), given: f.grandfather.given,
    role: T('Former Inspector-General, honoured in the family rites', '전 대사헌, 가문의 제사로 기리는 분'), gender: 'man', birthYear: y - 77,
    portrait: { kind: 'minister', robe: '#5A2A30', beard: 'long', grey: true }, kin: 'grandfather', alive: false, diedYear: y - 6, faction: f.faction, house,
    sees: T('A grandchild born after his time.', '그가 떠난 뒤에 태어난 손주.'),
    wants: T('His memorial rite kept every year, without fail.', '해마다 거르지 않는 제사.'),
  }), makeRel(40));
  add(makeNpc({
    id: 'grandmother', name: f.grandmother, role: T('Keeper of the family rites', '집안 제사를 지키는 어른'), gender: 'woman', birthYear: y - 68,
    portrait: { kind: 'noblewoman', robe: '#CFC3B0', under: '#3A3048', grey: true }, kin: 'grandmother', places: ['residence'], likes: ['pouch'], faction: f.faction, house,
    sees: T('A grandchild who reminds her of herself, unfortunately.', '안타깝게도 자기를 꼭 닮은 손주.'),
    wants: T('To see the family’s rites kept properly while she lives.', '살아 있는 동안 집안의 제사가 제대로 지켜지는 것.'),
    talk: [
      T('“In my day, young people did not run about the palace.”', '“내 젊을 적엔 젊은 것들이 궁을 쏘다니지 않았다.”'),
      T('“Bring me the persimmons from the high branch. The servants are too slow.”', '“저 높은 가지의 감 좀 따 오너라. 하인들은 너무 굼뜨구나.”'),
    ],
  }), makeRel(35));
  add(makeNpc({
    id: 'father', name: f.father.full ?? full(f.surname, f.father.given), given: f.father.given, role: f.father.role, gender: 'man', birthYear: y - 52,
    portrait: f.father.portrait, kin: 'father', places: ['residence'], likes: ['paper'], faction: f.faction, house,
    sees: T('His most capable child, which worries him.', '가장 똑똑한 자식. 그래서 걱정스럽다.'),
    wants: T('To keep his family safe while {factionA} hold the court.', '{factionA_i} 조정을 쥔 동안 가족을 지키는 것.'),
    talk: [
      T('“Close the door when you come in. Walls listen in this city.”', '“들어올 때 문을 닫아라. 이 도성은 벽에도 귀가 있다.”'),
      T('“Read the Analects again. Then tell me what Confucius would say about {factionA}.”', '“논어를 다시 읽어라. 그리고 공자께서 {factionA_eul} 보면 뭐라 하셨을지 말해 보거라.”'),
    ],
  }), makeRel(40));
  add(makeNpc({
    id: 'mother', name: f.mother, role: T('Runs the household and its accounts', '살림과 집안 셈을 맡은 안주인'), gender: 'woman', birthYear: y - 47,
    portrait: { kind: 'noblewoman', robe: '#C9B7A2', under: '#5A2140' }, kin: 'mother', places: ['residence'], likes: ['fan'], faction: f.faction, house,
    sees: T('A child who must marry well, and soon.', '좋은 혼처를, 그것도 서둘러 찾아야 할 자식.'),
    wants: T('A marriage that will save the family when politics cannot.', '정치가 못 하는 일을 혼사로 해내는 것.'),
    talk: [
      T('“Stand straight. The matchmaker has eyes everywhere.”', '“허리를 펴거라. 중매쟁이 눈은 어디에나 있다.”'),
      T('“Your father has not slept well. Don’t trouble him tonight.”', '“아버지가 요즘 잠을 못 이루신다. 오늘 밤은 번거롭게 해 드리지 마라.”'),
    ],
  }), makeRel(45));
  add(makeNpc({
    id: 'uncle', name: f.uncle.full ?? full(f.surname, f.uncle.given), given: f.uncle.given, role: f.uncle.role, gender: 'man', birthYear: y - 48,
    portrait: { kind: 'minister', robe: '#2C3E63', beard: 'short' }, kin: 'uncle', faction: f.faction, house,
    sees: T('His brother’s child, seen twice a year at the rites.', '일 년에 두 번 제사 때 보는 조카.'),
    wants: T('To stay far from the capital and its quarrels.', '도성과 그 다툼에서 멀리 떨어져 지내는 것.'),
  }), makeRel(20));
  add(makeNpc({
    id: 'cousin', name: full(f.surname, f.cousin.given), given: f.cousin.given, role: T('Your uncle’s daughter, in the provinces', '시골에 사는 숙부의 딸'),
    gender: 'woman', birthYear: y - 15, portrait: { kind: 'lady', robe: '#D9AFA8', under: '#263247' }, kin: 'cousin', faction: f.faction, house,
    sees: T('The cousin in the capital, who must lead a thrilling life.', '도성에 사는, 분명 신나게 살 사촌.'),
    wants: T('Letters about the capital, every month.', '달마다 오는 도성 소식 편지.'),
  }), makeRel(30));
  if (woman) {
    add(makeNpc({
      id: 'sibling', name: full(f.surname, f.brother.given), given: f.brother.given, role: T('Student at Seonggyungwan, heir to the house', '성균관 유생, 집안의 장자'), gender: 'man',
      birthYear: y - age - 4, portrait: { kind: 'scholar', robe: '#3E5274' }, kin: 'sibling', places: ['residence', 'academy'], likes: ['poems'], faction: f.faction, house,
      sees: T('The sister who covers for him, and the one he would die for.', '자기를 감싸 주는 누이, 그리고 목숨이라도 내줄 누이.'),
      wants: T('To pass the exam and be worthy of the family name.', '과거에 급제해 가문의 이름에 걸맞은 사람이 되는 것.'),
      talk: [
        T('“If anyone asks, I was at the academy all evening.”', '“누가 물으면 저녁 내내 성균관에 있었다고 해 줘.”'),
        T('“Han Seon-woo says you write better than he does. Don’t tell him I told you.”', '“한선우가 너더러 자기보다 글을 잘 쓴다더라. 내가 말했다고는 하지 마.”'),
      ],
    }), makeRel(65));
  } else {
    add(makeNpc({
      id: 'sibling', name: full(f.surname, f.sister.given), given: f.sister.given, role: T('Your younger sister', '누이동생'), gender: 'woman',
      birthYear: y - Math.max(12, age - 3), portrait: { kind: 'lady', robe: '#D9AFA8', under: '#2F5E55' }, kin: 'sibling', places: ['residence'], likes: ['fan'], faction: f.faction, house,
      sees: T('The brother who will one day decide her marriage.', '언젠가 자기 혼사를 정할 오라버니.'),
      wants: T('A say in her own marriage, which no one has offered her.', '아무도 주지 않은 자기 혼사에 대한 발언권.'),
      talk: [
        T('“Is it true you spoke to the king’s guard? The whole house is saying so.”', '“오라버니가 임금님 호위무사랑 얘기했다는 거 정말이에요? 온 집안이 다 그래요.”'),
        T('“Mother wants me to learn embroidery. I want to learn archery.”', '“어머니는 수를 배우라 하시는데, 저는 활을 배우고 싶어요.”'),
      ],
    }), makeRel(62));
  }

  // ---------------------------------------------------------------- court
  add(makeNpc({
    id: 'kang', name: T('Kang Mu-yeol', '강무열'), given: T('Mu-yeol', '무열'), role: T('Captain of the Royal Guard', '내금위장'), gender: 'man', birthYear: y - 26,
    portrait: { kind: 'guard' }, faction: 'crown', likes: ['pouch'], places: ['rear-garden', 'tribunal'], romance: woman,
    house: { surname: T('Kang', '강'), prestige: 2, faction: 'crown', background: 'military' },
    sees: woman ? T('You ask the questions no one else at court dares to.', '조정에서 아무도 감히 묻지 못하는 것을 묻는 사람.') : T('A friend who doesn’t flinch.', '움찔하지 않는 벗.'),
    wants: woman ? T('To protect the king. Lately, to protect you as well, though he would never say so.', '전하를 지키는 것. 요즘은 당신까지. 입 밖에 내지는 않겠지만.') : T('To serve the throne without serving a faction.', '당파가 아닌 왕실을 섬기는 것.'),
    talk: [
      T('“The guard changes at the second drum. I am always at the west gate.”', '“이경에 교대합니다. 저는 늘 서문에 있습니다.”'),
      T('“Be careful whom you smile at in this garden. Everyone keeps accounts.”', '“이 후원에서는 누구에게 웃어 주는지 조심하십시오. 다들 장부를 적고 있으니.”'),
    ],
  }), makeRel(20, false));
  add(makeNpc({
    id: 'han', name: T('Han Seon-woo', '한선우'), given: T('Seon-woo', '선우'), role: T('Scholar at Seonggyungwan', '성균관 유생'), gender: 'man', birthYear: y - 22,
    portrait: { kind: 'scholar', robe: '#A9C4B4' }, faction: 'B', likes: ['poems'], places: ['rear-garden', 'academy'], romance: woman,
    house: { surname: T('Han', '한'), prestige: 2, faction: 'B', background: 'noble' },
    sees: T('The only person who reads his poems and tells him the truth about them.', '그의 시를 읽고 솔직하게 말해 주는 유일한 사람.'),
    wants: T('To pass the civil service exam and clear his father’s name.', '과거에 급제해 아버지의 누명을 벗기는 것.'),
    talk: [
      T('“Have you read the new commentary on Mencius? It is wrong in every chapter. I loved it.”', '“맹자 새 주석 읽어 봤소? 장마다 틀렸더군. 아주 마음에 들었소.”'),
      T('“{factionA} are counting our people again. I am counting theirs.”', '“{factionA_i} 또 우리 쪽 사람을 세고 있소. 나도 저쪽을 세는 중이오.”'),
    ],
  }), makeRel(60));
  add(makeNpc({
    id: 'han-sister', name: T('Han Seo-yeon', '한서연'), given: T('Seo-yeon', '서연'), role: T('Han Seon-woo’s younger sister', '한선우의 누이동생'), gender: 'woman', birthYear: y - 18,
    portrait: { kind: 'lady', robe: '#A9B97A', under: '#2C3E63' }, faction: 'B', likes: ['poems'], places: ['rear-garden', 'market'], romance: !woman,
    house: { surname: T('Han', '한'), prestige: 2, faction: 'B', background: 'noble' },
    sees: T('Her brother’s friend, who listens when she talks about books.', '책 이야기를 하면 귀 기울여 주는 오라버니의 벗.'),
    wants: T('To read everything her brother is allowed to read.', '오라버니가 읽을 수 있는 건 무엇이든 읽는 것.'),
    talk: [
      T('“My brother says women shouldn’t read the histories. I have read them twice.”', '“오라버니는 여자가 사서를 읽으면 안 된대요. 저는 두 번 읽었어요.”'),
      T('“Don’t tell my brother you saw me at the bookseller’s.”', '“책방에서 저 봤다고 오라버니한테 말하지 마세요.”'),
    ],
  }), makeRel(30));
  add(makeNpc({
    id: 'seo', name: T('Seo Ha-eun', '서하은'), given: T('Ha-eun', '하은'), role: T('General Seo’s daughter, an archer', '서 장군의 딸, 활의 명수'), gender: 'woman', birthYear: y - 18,
    portrait: { kind: 'lady', robe: '#EDE6D6', under: '#2F5E55', accent: '#2F5E55' }, faction: 'crown', likes: ['fan'], places: ['market', 'rear-garden'], romance: !woman,
    house: { surname: T('Seo', '서'), prestige: 3, faction: 'crown', background: 'military' },
    sees: T('Someone who doesn’t laugh when she says she can shoot.', '활을 쏠 줄 안다고 하면 웃지 않는 사람.'),
    wants: T('A household that will let her keep her bow.', '활을 놓지 않아도 되는 집안.'),
    talk: [
      T('“My father says a lady shouldn’t draw a bow. My father has never beaten me at the butts.”', '“아버지는 규수가 활을 당기면 안 된다 하세요. 아버지는 한 번도 저를 이긴 적이 없으시고요.”'),
      T('“If you want to impress me, bring a better fan. This heat is unbearable.”', '“잘 보이고 싶으시면 더 좋은 부채를 가져오세요. 더워서 못 견디겠어요.”'),
    ],
  }), makeRel(20));
  add(makeNpc({
    id: 'baek', name: T('Lady Baek Ga-yeon', '백가연'), given: T('Ga-yeon', '가연'), role: T('Minister Ryu’s daughter-in-law', '류 대감의 며느리'), gender: 'woman', birthYear: y - 21,
    portrait: { kind: 'noblewoman', robe: '#D9B6AE' }, faction: 'A', places: ['queens-hall', 'rear-garden'],
    sees: woman ? T('A pretty girl from a falling family, reaching above herself.', '기우는 집안의 예쁜 아가씨. 제 분수를 모르는.') : T('A young man from a falling family, reaching above himself.', '기우는 집안의 젊은이. 제 분수를 모르는.'),
    wants: T('To see your family out of the capital.', '당신 집안이 도성에서 사라지는 것.'),
    talk: [
      T('“What an interesting colour. My mother wore it, years ago.”', '“색이 참 특이하네요. 우리 어머니가 예전에 입으시던 색인데.”'),
      T('“Do give my regards to your father. While he still has a post.”', '“아버님께 안부 전해 주세요. 아직 벼슬에 계실 때.”'),
    ],
  }), makeRel(-30));
  add(makeNpc({
    id: 'choi', name: T('Court Lady Choi', '최 상궁'), role: T('Senior court lady of the Queen’s Hall', '중궁전 상궁'), gender: 'woman', birthYear: y - 44,
    portrait: { kind: 'courtlady' }, faction: 'crown', likes: ['paper'], places: ['queens-hall', 'rear-garden'],
    sees: T('Clever. Perhaps too clever to be useful.', '영리하다. 쓸모 있기엔 지나치게 영리할지도.'),
    wants: T('Loyal servants for the queen, and no scandals in her hall.', '중전마마께 충성하는 사람들, 그리고 중궁전에 추문이 없는 것.'),
    talk: [
      T('“The queen rises before dawn. So should anyone who wishes to be noticed.”', '“중전마마께서는 동트기 전에 일어나십니다. 눈에 들고 싶은 사람도 그래야지요.”'),
      T('“Hold your sleeve so, when you bow. No. So.”', '“절할 때 소매는 이렇게. 아니, 이렇게요.”'),
    ],
  }), makeRel(10));
  add(makeNpc({
    id: 'ryu', name: T('Minister Ryu Hyeon-jik', '류현직 대감'), given: T('Hyeon-jik', '현직'), role: T('Inspector-General and elder of {factionA}', '대사헌, {factionA}의 원로'), gender: 'man', birthYear: y - 60,
    portrait: { kind: 'minister', robe: '#7A2230', beard: 'long' }, faction: 'A', places: ['throne-hall'],
    house: { surname: T('Ryu', '류'), prestige: 4, faction: 'A', background: 'political' },
    sees: T('His rival’s child. Therefore a tool, or an obstacle.', '맞수의 자식. 그러니 도구 아니면 걸림돌.'),
    wants: T('Your father’s office, and {factionB} out of court for good.', '아버님의 자리, 그리고 {factionB_eul} 조정에서 영영 몰아내는 것.'),
    talk: [
      T('“Your father writes so many letters. One wonders to whom.”', '“아버님께서 편지를 참 많이 쓰시더군. 누구에게 쓰시는지 궁금하구먼.”'),
      T('“Youth is a fine thing. It passes.”', '“젊음은 좋은 것이지. 금방 지나가서 그렇지.”'),
    ],
  }), makeRel(-55));
  const ryuHouse = { surname: T('Ryu', '류'), prestige: 4, faction: 'A' as const, background: 'political' as const };
  add(makeNpc(woman
    ? {
      id: 'ryu-child', name: T('Ryu Ji-seok', '류지석'), given: T('Ji-seok', '지석'), role: T('Minister Ryu’s younger son', '류 대감의 둘째 아들'), gender: 'man', birthYear: y - 23,
      portrait: { kind: 'scholar', robe: '#E9E2D2' }, faction: 'A', likes: ['paper'], places: ['market'], house: ryuHouse,
      sees: T('A match his father wants. He hasn’t decided whether he does.', '아버지가 원하는 혼처. 자기가 원하는지는 아직 모른다.'),
      wants: T('To be more than his father’s son.', '아버지의 아들 그 이상이 되는 것.'),
      talk: [T('“My father chose you. I would rather we chose each other, if we must.”', '“아버지가 고르셨지요. 어차피 해야 한다면, 서로 고르는 편이 낫겠습니다.”')],
    }
    : {
      id: 'ryu-child', name: T('Ryu Ji-hye', '류지혜'), given: T('Ji-hye', '지혜'), role: T('Minister Ryu’s daughter', '류 대감의 딸'), gender: 'woman', birthYear: y - 18,
      portrait: { kind: 'lady', robe: '#D8BF73', under: '#5A2140' }, faction: 'A', likes: ['paper'], places: ['market'], house: ryuHouse,
      sees: T('A match her father wants. She hasn’t decided whether she does.', '아버지가 원하는 혼처. 자기가 원하는지는 아직 모른다.'),
      wants: T('To be more than her father’s daughter.', '아버지의 딸 그 이상이 되는 것.'),
      talk: [T('“My father chose you. I would rather we chose each other, if we must.”', '“아버지가 고르셨지요. 어차피 해야 한다면, 서로 고르는 편이 낫겠어요.”')],
    }), makeRel(0, false));
  const guHouse = { surname: T('Gu', '구'), prestige: 3, faction: 'none' as const, background: 'noble' as const };
  add(makeNpc(woman
    ? {
      id: 'gu-child', name: T('Gu Tae-yun', '구태윤'), given: T('Tae-yun', '태윤'), role: T('Eldest son of a wealthy Gyeonggi family', '경기도 부잣집 맏아들'), gender: 'man', birthYear: y - 24,
      portrait: { kind: 'scholar', robe: '#B9C7CF' }, likes: ['pouch'], house: guHouse,
      sees: T('A stranger from the capital, chosen by a matchmaker.', '중매쟁이가 고른 도성의 낯선 사람.'),
      wants: T('A quiet house, a good harvest, and no politics.', '조용한 집, 풍년, 그리고 정치와 무관한 삶.'),
    }
    : {
      id: 'gu-child', name: T('Gu Hye-rin', '구혜린'), given: T('Hye-rin', '혜린'), role: T('Daughter of a wealthy Gyeonggi family', '경기도 부잣집 딸'), gender: 'woman', birthYear: y - 17,
      portrait: { kind: 'lady', robe: '#A9C4B4', under: '#8E2230' }, likes: ['pouch'], house: guHouse,
      sees: T('A stranger from the capital, chosen by a matchmaker.', '중매쟁이가 고른 도성의 낯선 사람.'),
      wants: T('A quiet house, a good harvest, and no politics.', '조용한 집, 풍년, 그리고 정치와 무관한 삶.'),
    }), makeRel(0, false));

  add(rulerNpc(c, start.year, start.moon), makeRel(5));
  return { npcs, rel };
}

/** Default portrait colours for people the game creates later. */
export function plainPortrait(gender: Gender, age: number, colors?: { top: string; bottom: string }): PortraitSpec {
  if (age < 15) return gender === 'woman' ? { kind: 'youth', robe: colors?.top ?? '#D9AFA8', under: colors?.bottom ?? '#8E2230' } : { kind: 'boy', robe: colors?.top ?? '#B9C7CF', under: colors?.bottom ?? '#3E5274' };
  return gender === 'woman' ? { kind: 'lady', robe: colors?.top ?? '#D8BF73', under: colors?.bottom ?? '#8E2230' } : { kind: 'scholar', robe: colors?.top ?? '#A9C4B4', under: colors?.bottom ?? '#6B1626' };
}

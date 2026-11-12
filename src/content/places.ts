import { extendPlaces } from './placesExtra';
import type { Effect, Place } from '../model/content';
import { T } from '../engine/text';

const q = (q: 'wit' | 'grace' | 'resolve', d: number): Effect => ({ kind: 'quality', q, d });
const stat = (stat: 'health' | 'reputation' | 'favour' | 'prestige', d: number): Effect => ({ kind: 'stat', stat, d });
const reg = (npc: string, d: number): Effect => ({ kind: 'regard', npc, d });

export const PLACES: Place[] = [
  {
    id: 'rear-garden', zone: 'palace', scene: 'garden',
    name: T('The Rear Garden', '창덕궁 후원'), area: T('Changdeokgung palace', '창덕궁'),
    gbg: { name: T('Gyeonghoeru Pond', '경회루 연못'), area: T('Gyeongbokgung palace', '경복궁'), x: 38.5, y: 26, side: 'l' },
    desc: T('A walled garden of ponds and pavilions, where the royal family walks and the court sometimes follows.', '연못과 정자가 있는 담장 안의 정원. 왕실이 거닐고, 때로 조정이 그 뒤를 따른다.'),
    map: { x: 70, y: 25, side: 'r' },
    slots: [{ x: 61, y: 52 }, { x: 34, y: 58 }, { x: 47, y: 67 }, { x: 22, y: 66 }],
    activities: [
      { id: 'walk', title: T('Walk the lotus pond path', '연못가 산책'), text: T('Restores your health. Someone else may be walking there.', '건강을 되찾는다. 다른 누군가도 거닐고 있을지 모른다.'), effects: [stat('health', 4)], result: T('The afternoon passes by the water.', '물가에서 오후가 지나간다.') },
      { id: 'poetry', title: T('Compose poetry with Han Seon-woo', '한선우와 시 짓기'), text: T('Wit rises. Han Seon-woo’s regard rises.', '재치가 오르고 한선우의 호감이 오른다.'), when: { alive: ['han'], met: ['han'] }, effects: [q('wit', 2), reg('han', 4)], result: T('You trade verses until the light turns gold.', '빛이 금빛으로 바뀔 때까지 시를 주고받는다.') },
      { id: 'prince-archery', title: T('Watch the crown prince at archery', '세자 저하의 활쏘기 구경'), text: T('Resolve and royal favour rise. The crown prince’s regard rises.', '결단력과 왕의 총애, 세자의 호감이 오른다.'), when: { alive: ['crown-prince'] }, effects: [q('resolve', 1), stat('favour', 1), reg('crown-prince', 4)], result: T('He hits the target four times in five, and glances to see who noticed.', '다섯 발 중 네 발을 맞히고는, 누가 보았는지 슬쩍 돌아본다.') },
      { id: 'gossip', title: T('Listen to the court ladies’ gossip', '궁녀들의 수군거림 엿듣기'), text: T('Learn a rumour. Someone may notice you listening.', '소문을 듣는다. 누군가 엿듣는 당신을 볼지도 모른다.'), effects: [q('wit', 1), stat('reputation', -1), { kind: 'flag', flag: 'heard-rumour', v: true }], result: T('They say {factionA} have asked the ruler about your father. Someone saw you listening.', '{factionA_i} 임금께 아버님에 대해 여쭈었다는 소문이다. 누군가 엿듣는 당신을 보았다.') },
    ],
  },
  {
    id: 'queens-hall', zone: 'palace', scene: 'queen',
    name: T('The Queen’s Hall', '대조전'), area: T('Daejojeon, Changdeokgung palace', '창덕궁 대조전'),
    gbg: { name: T('The Queen’s Hall', '교태전'), area: T('Gyotaejeon, Gyeongbokgung palace', '경복궁 교태전'), x: 44.5, y: 25, side: 'r' },
    desc: T('The queen’s residence. Court ladies decide who is admitted, and who is remembered.', '중전의 거처. 누구를 들이고 누구를 기억할지는 상궁들이 정한다.'),
    map: { x: 64, y: 31.4, side: 'l' },
    requires: { any: [{ gender: 'woman' }, { premise: 'queen' }] },
    locked: T('Men outside the royal family may not enter the queen’s quarters.', '왕실 밖의 남자는 중궁전에 들 수 없다.'),
    slots: [{ x: 36, y: 62 }, { x: 64, y: 60 }, { x: 50, y: 70 }, { x: 20, y: 68 }],
    activities: [
      { id: 'respects', title: T('Pay your respects to the queen', '중전마마께 문안 인사'), text: T('Royal favour rises. Grace rises.', '왕의 총애와 품위가 오른다.'), effects: [stat('favour', 3), q('grace', 1)], result: T('The queen asks after your mother, and remembers your name.', '중전마마께서 어머님 안부를 물으시고 당신의 이름을 기억하셨다.') },
      { id: 'dowager', title: T('Pay your respects to the Queen Dowager', '대비마마께 문안 인사'), text: T('Royal favour and grace rise. The Queen Dowager’s regard rises.', '왕의 총애와 품위, 대비마마의 호감이 오른다.'), when: { alive: ['queen-dowager'] }, effects: [stat('favour', 2), q('grace', 1), reg('queen-dowager', 5)], result: T('She asks you to read aloud from the Lesson for Women, and corrects your pronunciation twice.', '대비마마께서 내훈을 소리 내어 읽게 하시고는, 발음을 두 번 바로잡아 주신다.') },
      { id: 'flowers', title: T('Help prepare the queen’s flowers', '중전마마의 꽃꽂이 돕기'), text: T('Grace rises. Court Lady Choi’s regard rises.', '품위가 오르고 최 상궁의 호감이 오른다.'), when: { alive: ['choi'] }, effects: [q('grace', 2), reg('choi', 5)], result: T('Court Lady Choi corrects your work twice, then says nothing, which is praise.', '최 상궁이 두 번 고쳐 주더니 아무 말도 하지 않는다. 칭찬이라는 뜻이다.') },
    ],
  },
  {
    id: 'throne-hall', zone: 'palace', scene: 'throne',
    name: T('The Throne Hall', '인정전'), area: T('Injeongjeon, Changdeokgung palace', '창덕궁 인정전'),
    gbg: { name: T('The Throne Hall', '근정전'), area: T('Geunjeongjeon, Gyeongbokgung palace', '경복궁 근정전'), x: 43.5, y: 32.5, side: 'b' },
    desc: T('Where the ruler receives ministers and envoys. You may enter only when summoned.', '임금이 대신과 사신을 맞는 곳. 부름을 받아야만 들어갈 수 있다.'),
    map: { x: 60, y: 38.9, side: 'l' },
    requires: { flags: { summoned: true } },
    locked: T('Opens only with a royal summons.', '어명으로 부름을 받아야만 열린다.'),
    slots: [{ x: 40, y: 64 }, { x: 60, y: 64 }, { x: 50, y: 72 }, { x: 24, y: 66 }],
    activities: [],
  },
  {
    id: 'offices', zone: 'palace', scene: 'offices',
    name: T('The Palace Offices', '궐내각사'), area: T('West of the Throne Hall, Changdeokgung palace', '창덕궁 인정전 서쪽'),
    gbg: { name: T('The Palace Offices', '궐내각사'), area: T('West of the Throne Hall, Gyeongbokgung palace', '경복궁 근정전 서쪽'), x: 39, y: 34, side: 'l' },
    desc: T('The government offices inside the palace walls: the Royal Secretariat, the Office of Special Advisers, the Office of Annals and the Palace Infirmary.', '궁궐 담장 안의 관청들. 승정원과 홍문관, 춘추관, 그리고 내의원이 모여 있다.'),
    map: { x: 68, y: 39, side: 'r' },
    requires: { any: [{ gender: 'man' }, { premise: 'queen' }, { office: true }] },
    locked: T('Only officials and the men of the court work in the palace offices.', '궐내각사에는 관원과 조정의 남자들만 드나든다.'),
    slots: [{ x: 30, y: 63 }, { x: 64, y: 61 }, { x: 48, y: 71 }, { x: 16, y: 68 }],
    activities: [
      { id: 'duties', title: T('Attend to your duties', '맡은 일 보기'), text: T('Royal favour, reputation and wit rise.', '왕의 총애와 평판, 재치가 오른다.'), when: { office: true }, effects: [stat('favour', 2), stat('reputation', 1), q('wit', 1)], result: T('A day of memorials, seals and careful wording. Someone senior notices that nothing went wrong.', '상소와 도장과 조심스러운 문구로 하루가 간다. 아무 탈이 없었다는 것을 윗사람이 알아챈다.') },
      { id: 'secretariat', title: T('Copy petitions for the Royal Secretariat', '승정원에서 상소 베끼기'), text: T('Wit rises. The Royal Secretary’s regard rises.', '재치가 오르고 도승지의 호감이 오른다.'), when: { office: false, alive: ['royal-secretary'] }, effects: [q('wit', 2), reg('royal-secretary', 3)], result: T('Your hand is neat. The Royal Secretary says so, which he does not say often.', '글씨가 단정하다. 도승지가 그렇게 말해 준다. 좀처럼 하지 않는 말이다.') },
      { id: 'physician', title: T('Consult the royal physician', '어의에게 진맥받기'), text: T('Health rises.', '건강이 오른다.'), when: { alive: ['physician'] }, effects: [{ kind: 'money', d: -30 }, stat('health', 10), reg('physician', 2)], result: T('He takes your pulse at both wrists and prescribes rest, ginger and fewer late nights.', '양쪽 손목의 맥을 짚더니 휴식과 생강, 그리고 밤을 덜 새우라는 처방을 내린다.') },
      { id: 'call-left', title: T('Call on the Left State Councillor', '좌의정 대감 찾아뵙기'), text: T('Reputation rises. The Left State Councillor’s regard rises.', '평판과 좌의정의 호감이 오른다.'), when: { alive: ['left-councillor'] }, effects: [stat('reputation', 1), reg('left-councillor', 4)], result: T('He keeps you for an hour and tells you nothing, which is a lesson in itself.', '한 시진이나 붙잡아 두고는 아무 말도 해 주지 않는다. 그것 자체가 가르침이다.') },
    ],
  },
  {
    id: 'residence', zone: 'city', scene: 'residence',
    name: T('The family residence', '본가'), area: T('Bukchon, north of the main road', '북촌'),
    desc: T('Your family’s house, where your father keeps his library and, lately, keeps his door closed.', '아버지가 서재를 두고, 요즘은 문까지 닫아 두는 집.'),
    map: { x: 50.5, y: 45.8, side: 'l' },
    slots: [{ x: 30, y: 62 }, { x: 66, y: 60 }, { x: 48, y: 70 }, { x: 16, y: 66 }],
    activities: [
      { id: 'study', title: T('Study the classics with your father', '아버지와 경서 공부'), text: T('Wit rises. Your father’s regard rises.', '재치와 아버지의 호감이 오른다.'), when: { alive: ['father'], married: false }, effects: [q('wit', 2), reg('father', 3)], result: T('Your father tests you on the Doctrine of the Mean, and seems almost pleased.', '아버지가 중용을 물으시고는, 거의 흡족해 보이신다.') },
      { id: 'read', title: T('Read in the library', '서재에서 책 읽기'), text: T('Wit rises.', '재치가 오른다.'), when: { not: { alive: ['father'], married: false } }, effects: [q('wit', 2)], result: T('An afternoon with the histories.', '사서와 함께한 오후.') },
      { id: 'sibling', title: T('Spend time with {sibling}', '{sibling_wa} 시간 보내기'), text: T('Their regard rises.', '호감이 오른다.'), when: { alive: ['sibling'] }, effects: [reg('sibling', 4)], result: T('You talk until the lamps are lit.', '등불을 켤 때까지 이야기를 나눈다.') },
      { id: 'embroider', title: T('Embroider a silk pouch', '비단 주머니에 수놓기'), text: T('Grace rises. You make a gift.', '품위가 오르고 선물이 생긴다.'), when: { gender: 'woman' }, effects: [q('grace', 1), { kind: 'gift', id: 'pouch' }] },
      { id: 'archery', title: T('Practise archery in the yard', '마당에서 활쏘기'), text: T('Resolve rises.', '결단력이 오른다.'), when: { any: [{ gender: 'man' }, { background: 'military' }] }, effects: [q('resolve', 2)], result: T('Your arm aches. Your aim improves.', '팔은 아프지만 조준은 나아졌다.') },
      { id: 'write-han', title: T('Write to Han Seon-woo', '한선우에게 편지 쓰기'), text: T('Han Seon-woo’s regard rises.', '한선우의 호감이 오른다.'), when: { gender: 'woman', alive: ['han'], met: ['han'] }, effects: [reg('han', 3)], result: T('His answer comes before nightfall, three pages long.', '해 지기 전에 세 장짜리 답장이 왔다.') },
      { id: 'accounts', title: T('Go over the accounts with the steward', '청지기와 장부 살피기'), text: T('Wit rises. You may find money the household had lost track of.', '재치가 오른다. 살림에서 새던 돈을 찾을지도 모른다.'), when: { alive: ['steward'] }, effects: [q('wit', 1), { kind: 'money', d: 12 }, reg('steward', 2)], result: T('Between the rice ledger and the wine bills, you find twelve nyang nobody had counted.', '쌀 장부와 술값 사이에서 아무도 세지 않은 열두 냥을 찾아낸다.') },
      { id: 'rest', title: T('Rest at home', '집에서 쉬기'), text: T('Health rises.', '건강이 오른다.'), effects: [stat('health', 6)] },
    ],
  },
  {
    id: 'academy', zone: 'city', scene: 'academy',
    name: T('Seonggyungwan', '성균관'), area: T('The royal academy', '나라의 최고 교육 기관'),
    desc: T('Where young men study for the civil service exam and argue politics by lamplight.', '젊은 선비들이 과거를 준비하며 등불 아래서 정치를 논하는 곳.'),
    map: { x: 83, y: 16.7, side: 'l' },
    requires: { any: [{ gender: 'man' }, { premise: 'queen' }] },
    locked: T('Women may not enter. Letters can.', '여인은 들어갈 수 없다. 편지는 들어간다.'),
    aside: T('Under Queen Seon, the gates are open to women.', '선 여왕의 치세에는 여인에게도 문이 열려 있다.'),
    slots: [{ x: 38, y: 62 }, { x: 62, y: 60 }, { x: 50, y: 70 }, { x: 22, y: 68 }],
    activities: [
      { id: 'exam-study', title: T('Study for the civil service exam', '과거 공부'), text: T('Wit rises.', '재치가 오른다.'), effects: [q('wit', 3)], result: T('The ginkgo leaves fall on your books.', '은행잎이 책 위로 떨어진다.') },
      { id: 'debate', title: T('Debate in the lecture hall', '명륜당에서 토론'), text: T('Resolve and reputation rise. Han Seon-woo’s regard rises.', '결단력과 평판, 한선우의 호감이 오른다.'), effects: [q('resolve', 2), stat('reputation', 1), { kind: 'regard', npc: 'han', d: 3, when: { alive: ['han'] } }], result: T('You win the argument and make two enemies, which is normal here.', '논쟁에서 이기고 적을 둘 만들었다. 여기선 흔한 일이다.') },
    ],
  },
  {
    id: 'market', zone: 'city', scene: 'market',
    name: T('Unjongga market', '운종가'), area: T('Along the main road', '종로 큰길'),
    desc: T('The great market street of Hanseong. Silk, paper, medicine and rumours, all for sale.', '한성의 큰 저잣거리. 비단과 종이, 약재, 그리고 소문까지 다 판다.'),
    map: { x: 54, y: 55.6, side: 'r' },
    slots: [{ x: 28, y: 64 }, { x: 70, y: 62 }, { x: 50, y: 72 }, { x: 14, y: 70 }],
    activities: [
      { id: 'buy-poems', title: T('Visit the bookseller', '책방 들르기'), text: T('Buy a book of Tang poems to give.', '선물할 당시집을 산다.'), effects: [{ kind: 'money', d: -12 }, { kind: 'gift', id: 'poems' }] },
      { id: 'buy-paper', title: T('Visit the paper shop', '지물포 들르기'), text: T('Buy fine hanji paper to give.', '선물할 고급 한지를 산다.'), effects: [{ kind: 'money', d: -8 }, { kind: 'gift', id: 'paper' }] },
      { id: 'buy-fan', title: T('Visit the fan maker', '부채 장인 들르기'), text: T('Buy a painted fan to give.', '선물할 그림 부채를 산다.'), effects: [{ kind: 'money', d: -10 }, { kind: 'gift', id: 'fan' }] },
      { id: 'buy-pouch', title: T('Visit the silk stalls', '비단전 들르기'), text: T('Buy an embroidered pouch to give.', '선물할 수놓은 주머니를 산다.'), effects: [{ kind: 'money', d: -15 }, { kind: 'gift', id: 'pouch' }], when: { gender: 'man' } },
      { id: 'invest', title: T('Buy a share in a silk shipment', '비단 배에 한몫 넣기'), text: T('A silk merchant’s ship sails for the Chinese coast. It pays out next season, if it comes back.', '비단 상인의 배가 중국으로 떠난다. 무사히 돌아오면 다음 철에 돈이 들어온다.'), when: { alive: ['merchant'] }, effects: [{ kind: 'invest', amount: 100 }, reg('merchant', 3)], result: T('The merchant writes your name in his ledger with a flourish.', '상인이 장부에 당신 이름을 큼직하게 적는다.') },
      { id: 'news', title: T('Hear the city’s news', '도성 소식 듣기'), text: T('Wit rises. Learn what the city says.', '재치가 오른다. 도성이 하는 말을 듣는다.'), effects: [q('wit', 1)], result: T('The rice merchants say the {palace} kitchens have doubled their orders. Something is being celebrated, or prepared for.', '쌀장수들 말로는 {palace} 수라간 주문이 두 배로 늘었다 한다. 무언가를 축하하거나, 대비하는 모양이다.') },
    ],
  },
  {
    id: 'tribunal', zone: 'city', scene: 'tribunal',
    name: T('The State Tribunal', '의금부'), area: T('Uigeumbu, near the main road', '큰길 가 의금부'),
    desc: T('Where crimes against the throne are investigated by royal order. People go in. Not all of them come out.', '왕실에 대한 죄를 어명으로 다스리는 곳. 들어가는 사람은 있어도 다 나오지는 못한다.'),
    map: { x: 38, y: 54.9, side: 'b' },
    requires: { flags: { 'tribunal-open': true } },
    locked: T('No one you know is held here. Yet.', '아는 사람이 갇혀 있지는 않다. 아직은.'),
    slots: [{ x: 40, y: 64 }, { x: 60, y: 62 }, { x: 50, y: 72 }, { x: 24, y: 68 }],
    activities: [
      { id: 'ask-prisoner', title: T('Ask the clerks about your father’s case', '서리들에게 아버지 일 묻기'), text: T('Learn where things stand. Your father’s regard rises.', '일이 어찌 되어 가는지 알아본다. 아버지의 호감이 오른다.'), effects: [reg('father', 4), q('resolve', 1)], when: { alive: ['father'] }, result: T('A clerk tells you, for a price, that the case is being kept open. Nobody will say by whom.', '서리 하나가 값을 받고 귀띔한다. 사건을 일부러 닫지 않고 있다고. 누가 그러는지는 아무도 말하지 않는다.') },
      { id: 'petition', title: T('Petition for clemency at the gate', '문 앞에서 선처를 탄원하기'), text: T('Resolve rises. Royal favour falls.', '결단력이 오르고 왕의 총애가 떨어진다.'), effects: [q('resolve', 2), stat('favour', -2), stat('reputation', 1)], result: T('The guards take your petition. Kang Mu-yeol watches from the gate.', '군졸들이 탄원서를 받는다. 강무열이 문간에서 지켜본다.') },
    ],
  },
  {
    id: 'temple', zone: 'city', scene: 'temple',
    name: T('The mountain temple', '산사'), area: T('In the hills north-west of the walls', '도성 서북쪽 산중'),
    desc: T('A small temple above the city: a painted hall, a stone pagoda and a bell that carries to the palace on a still morning.', '도성이 내려다보이는 작은 절. 단청 입힌 법당과 석탑, 고요한 아침이면 궁궐까지 닿는 종소리.'),
    map: { x: 21, y: 19, side: 'r' },
    slots: [{ x: 30, y: 64 }, { x: 66, y: 62 }, { x: 48, y: 72 }, { x: 16, y: 70 }],
    activities: [
      { id: 'temple-bows', title: T('Make your bows in the main hall', '법당에서 절을 올린다'), text: T('Stress falls; a little stiff in the knees.', '근심이 가라앉는다. 무릎은 조금 뻐근하다.'), effects: [{ kind: 'stress', d: -7 }, { kind: 'practice', id: 'lantern', d: 1 }], result: T('Incense, a wooden fish drum, and a hundred and eight bows. Somewhere around the sixtieth you stop counting your worries.', '향 내음, 목탁 소리, 그리고 백팔 배. 예순 번째쯤에서 근심 세는 것을 잊었다.') },
      { id: 'temple-tea', title: T('Take tea with the abbot', '주지 스님과 차를 마신다'), text: T('Judgement and happiness rise.', '판단력과 행복이 오른다.'), effects: [{ kind: 'attr', a: 'judgement', d: 1 }, { kind: 'happy', d: 3 }], when: { minAge: 12 }, result: T('He asks what troubles you, listens to all of it, and pours more tea.', '무엇이 괴로우냐 묻고는 끝까지 듣더니 차를 더 따라 주었다.') },
      { id: 'temple-sutra', title: T('Copy a sutra in the scriptorium', '사경을 한다'), text: T('Calligraphy grows; stress falls.', '서예가 늘고 근심이 준다.'), effects: [{ kind: 'skill', id: 'calligraphy', d: 2 }, { kind: 'stress', d: -3 }], when: { minAge: 10 }, result: T('Gold ink on indigo paper, one character to a breath.', '감지에 금니로, 한 호흡에 한 글자.') },
      { id: 'temple-path', title: T('Climb the path to the hermitage', '암자까지 산길을 오른다'), text: T('Health and happiness rise.', '건강과 행복이 오른다.'), effects: [stat('health', 2), { kind: 'happy', d: 2 }], child: true, commoner: true, result: T('Pines, a cold spring, and the whole of Hanseong small enough to cover with one hand.', '소나무와 찬 샘물, 그리고 한 손으로 가릴 만큼 작아진 한성.') },
    ],
  },
];

extendPlaces(PLACES);

export const placeById = (id: string) => PLACES.find((p) => p.id === id) ?? PLACES[0];
